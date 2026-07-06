import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * sendWeeklySummary — scheduled weekly digest.
 * For every user, emails:
 *   - New Specimens found in the last 7 days (mineral name, rarity, when)
 *   - Companion progress (level, XP, streak, mood, energy)
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Scheduled automations run as the app, not as a user — but we still
    // gate on auth.me() to block unauthenticated webhook abuse.
    const caller = await base44.auth.me().catch(() => null);
    if (!caller) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (caller.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const users = await base44.asServiceRole.entities.User.list();
    const userEmails = users.map((u) => u.email).filter(Boolean) as string[];

    // Optimization: Batch fetch specimens and companions to avoid N+1 queries
    const [allSpecimens, allCompanions] = await Promise.all([
      base44.asServiceRole.entities.Specimen.filter(
        { created_by: { $in: userEmails }, created_date: { $gte: since } },
        "-created_date",
        10000,
      ),
      base44.asServiceRole.entities.Companion.filter(
        { owner_email: { $in: userEmails } },
        "-updated_date",
        userEmails.length * 5,
      ),
    ]);

    // Group specimens by user email
    const specimensByEmail: Record<string, any[]> = {};
    for (const s of allSpecimens) {
      if (!specimensByEmail[s.created_by]) specimensByEmail[s.created_by] = [];
      specimensByEmail[s.created_by].push(s);
    }

    // Group latest companion by user email
    const companionByEmail: Record<string, any> = {};
    for (const c of allCompanions) {
      if (!companionByEmail[c.owner_email]) {
        companionByEmail[c.owner_email] = c;
      }
    }

    let sent = 0;
    const errors = [];

    for (const user of users) {
      if (!user.email) continue;
      try {
        const recent = specimensByEmail[user.email] || [];
        const companion = companionByEmail[user.email];

        // Skip users with no activity AND no companion at all
        if (recent.length === 0 && !companion) continue;

        const { subject, body } = buildEmail(user, recent, companion);
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: user.email,
          subject,
          body,
        });
        sent += 1;
      } catch (e) {
        errors.push({ email: user.email, error: String(e?.message || e) });
      }
    }

    return Response.json({ sent, errors, total_users: users.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function buildEmail(user, recent, companion) {
  const name = user.full_name?.split(' ')?.[0] || 'rockhound';
  const subject = recent.length
    ? `Your week in stones: ${recent.length} new find${recent.length === 1 ? '' : 's'}`
    : `Your weekly RockHound check-in`;

  const findsHtml = recent.length
    ? `
      <h2 style="font-size:18px;color:#7c3aed;margin:24px 0 8px;">New finds this week</h2>
      <ul style="padding-left:18px;margin:0;">
        ${recent.slice(0, 25).map((s) => `
          <li style="margin:6px 0;color:#1f2937;">
            <strong>${escapeHtml(s.mineral_name || 'Unknown')}</strong>
            ${s.common_name ? ` (${escapeHtml(s.common_name)})` : ''}
            <span style="color:#6b7280;"> — ${escapeHtml(s.rarity || 'common')}</span>
            ${s.found_date ? `<span style="color:#9ca3af;"> · ${escapeHtml(s.found_date)}</span>` : ''}
          </li>
        `).join('')}
      </ul>
      ${recent.length > 25 ? `<p style="color:#6b7280;font-size:13px;">…and ${recent.length - 25} more.</p>` : ''}
    `
    : `<p style="color:#6b7280;">No new finds logged this week — the field is patient. Try a new spot soon.</p>`;

  const companionHtml = companion
    ? `
      <h2 style="font-size:18px;color:#7c3aed;margin:24px 0 8px;">${escapeHtml(companion.name || 'Amethyst')}'s progress</h2>
      <table style="border-collapse:collapse;font-size:14px;color:#1f2937;">
        <tr><td style="padding:4px 12px 4px 0;color:#6b7280;">Level</td><td><strong>${companion.level ?? 1}</strong></td></tr>
        <tr><td style="padding:4px 12px 4px 0;color:#6b7280;">XP</td><td><strong>${companion.xp ?? 0}</strong></td></tr>
        <tr><td style="padding:4px 12px 4px 0;color:#6b7280;">Streak</td><td><strong>${companion.streak_days ?? 0} day${companion.streak_days === 1 ? '' : 's'}</strong></td></tr>
        <tr><td style="padding:4px 12px 4px 0;color:#6b7280;">Mood</td><td><strong>${escapeHtml(companion.mood || 'calm')}</strong></td></tr>
        <tr><td style="padding:4px 12px 4px 0;color:#6b7280;">Energy</td><td><strong>${companion.energy ?? 80}/100</strong></td></tr>
      </table>
    `
    : '';

  const body = `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Inter',sans-serif;max-width:560px;margin:0 auto;padding:24px;background:#ffffff;color:#1f2937;">
      <h1 style="font-size:22px;margin:0 0 4px;color:#0f172a;">Hey ${escapeHtml(name)},</h1>
      <p style="color:#6b7280;margin:0 0 8px;">Here's your week in RockHound-GO.</p>
      ${findsHtml}
      ${companionHtml}
      <p style="margin-top:32px;color:#9ca3af;font-size:12px;">— The Amethyst Oracle</p>
    </div>
  `;

  return { subject, body };
}

function escapeHtml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
