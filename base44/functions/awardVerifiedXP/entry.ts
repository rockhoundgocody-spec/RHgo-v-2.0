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
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import { awardXPServerSide } from '../../shared/awardXP.ts';

const QUEST_XP_CAP = 100;
const ROULETTE_XP = 15;
const GUEST_RECLAIM_XP = 25;
const DISP_XP: Record<string, number> = { collected: 25, left_in_place: 40, observed: 15 };

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

    } else {
      return Response.json({ error: 'Unknown event type' }, { status: 400 });
    }

    if (amount <= 0) {
      return Response.json({ error: 'No XP to award' }, { status: 400 });
    }

    const result = await awardXPServerSide(base44, user.email, amount, reason, idempotencyKey);
    return Response.json(result);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});