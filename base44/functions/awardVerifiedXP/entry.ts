/**
 * awardVerifiedXP — client-facing XP award endpoint that validates events
 * server-side before granting XP. Replaces direct calls to awardXP from
 * frontend code.
 *
 * POST /awardVerifiedXP
 * Body: { event_type, event_id?, disposition? }
 *
 * event_type='quest'        — verifies quest is completed + owned by caller
 * event_type='roulette'     — daily roulette, fixed 15 XP, once per day
 * event_type='guest_reclaim'— verifies specimen owned by caller, fixed 25 XP
 * event_type='specimen'     — verifies specimen owned by caller, disposition-based XP
 * event_type='ar_catch'     — verifies a fresh AR-catch specimen owned by caller,
 *                              rarity-based XP, at most AR_DAILY_CAP awards per day
 * event_type='orb_blessing' — Orb resonance blessing, fixed 50 XP, once per day
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.53';
import { awardXPServerSide } from '../../shared/awardXP.ts';
import { safeError } from '../../shared/httpErrors.ts';

const QUEST_XP_CAP = 100;
const ROULETTE_XP = 15;
const GUEST_RECLAIM_XP = 25;
const DISP_XP: Record<string, number> = { collected: 25, left_in_place: 40, observed: 15 };
const AR_XP: Record<string, number> = { common: 50, uncommon: 150, rare: 400, legendary: 500 };
const AR_DAILY_CAP = 5;
const AR_MAX_AGE_MS = 60 * 60 * 1000;
const ORB_BLESSING_XP = 50;

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user?.email) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { event_type, event_id, disposition } = await req.json();

    let amount = 0;
    let reason = '';
    let idempotencyKey = '';

    if (event_type === 'quest') {
      if (!event_id) return Response.json({ error: 'event_id required' }, { status: 400 });
      let quest;
      try {
        quest = await base44.entities.Quest.get(event_id);
      } catch {
        return Response.json({ error: 'Quest not found' }, { status: 404 });
      }
      if (!quest || quest.owner_email !== user.email) {
        return Response.json({ error: 'Quest not found' }, { status: 404 });
      }
      if (quest.status !== 'completed') {
        return Response.json({ error: 'Quest not completed' }, { status: 400 });
      }
      amount = Math.min(quest.xp_reward || 0, QUEST_XP_CAP);
      reason = `Quest: ${quest.title}`;
      idempotencyKey = `quest:${quest.id}`;

    } else if (event_type === 'roulette') {
      const today = new Date().toISOString().split('T')[0];
      amount = ROULETTE_XP;
      reason = 'Daily Roulette';
      idempotencyKey = `roulette:${user.email}:${today}`;

    } else if (event_type === 'guest_reclaim') {
      if (!event_id) return Response.json({ error: 'event_id required' }, { status: 400 });
      let specimen;
      try {
        specimen = await base44.entities.Specimen.get(event_id);
      } catch {
        return Response.json({ error: 'Specimen not found' }, { status: 404 });
      }
      if (!specimen || specimen.created_by_id !== user.id) {
        return Response.json({ error: 'Specimen not found' }, { status: 404 });
      }
      amount = GUEST_RECLAIM_XP;
      reason = 'Guest report reclaimed';
      idempotencyKey = `guest_reclaim:${specimen.id}`;

    } else if (event_type === 'specimen') {
      if (!event_id) return Response.json({ error: 'event_id required' }, { status: 400 });
      let specimen;
      try {
        specimen = await base44.entities.Specimen.get(event_id);
      } catch {
        return Response.json({ error: 'Specimen not found' }, { status: 404 });
      }
      if (!specimen || specimen.created_by_id !== user.id) {
        return Response.json({ error: 'Specimen not found' }, { status: 404 });
      }
      const disp = disposition || 'collected';
      amount = DISP_XP[disp] || 25;
      reason = `scan_${disp}`;
      idempotencyKey = `scan:${specimen.id}:${disp}`;

    } else if (event_type === 'ar_catch') {
      if (!event_id) return Response.json({ error: 'event_id required' }, { status: 400 });
      let specimen;
      try {
        specimen = await base44.entities.Specimen.get(event_id);
      } catch {
        return Response.json({ error: 'Specimen not found' }, { status: 404 });
      }
      if (!specimen || specimen.created_by_id !== user.id || !String(specimen.notes || '').startsWith('AR catch')) {
        return Response.json({ error: 'Specimen not found' }, { status: 404 });
      }
      const age = Date.now() - Date.parse(specimen.created_date || '');
      if (!Number.isFinite(age) || age > AR_MAX_AGE_MS) {
        return Response.json({ error: 'Catch is too old to award' }, { status: 400 });
      }
      const today = new Date().toISOString().split('T')[0];
      const todays = await base44.asServiceRole.entities.XPAward.filter(
        { owner_email: user.email, reason: 'AR catch', created_date: { $gte: `${today}T00:00:00` } },
        '-created_date',
        AR_DAILY_CAP + 1,
      ).catch(() => []);
      if ((todays?.length || 0) >= AR_DAILY_CAP) {
        return Response.json({ error: 'Daily AR catch XP limit reached', already_awarded: false, capped: true }, { status: 429 });
      }
      amount = AR_XP[specimen.rarity] || AR_XP.common;
      reason = 'AR catch';
      idempotencyKey = `ar_catch:${specimen.id}`;

    } else if (event_type === 'orb_blessing') {
      const today = new Date().toISOString().split('T')[0];
      amount = ORB_BLESSING_XP;
      reason = 'Orb blessing';
      idempotencyKey = `orb_blessing:${user.email}:${today}`;

    } else {
      return Response.json({ error: 'Unknown event type' }, { status: 400 });
    }

    if (amount <= 0) {
      return Response.json({ error: 'No XP to award' }, { status: 400 });
    }

    const result = await awardXPServerSide(base44, user.email, amount, reason, idempotencyKey);
    return Response.json(result);
  } catch (error) {
    return safeError('awardVerifiedXP', error);
  }
});