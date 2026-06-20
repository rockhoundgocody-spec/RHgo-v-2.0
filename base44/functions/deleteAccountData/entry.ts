import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * Deletes all data associated with the authenticated user.
 * Consolidated server-side to avoid N+1 network calls from the client.
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const email = user.email;

    // Fetch all entities to be deleted
    const [specimens, companions, drafts, badges] = await Promise.all([
      base44.entities.Specimen.filter({ created_by: email }),
      base44.entities.Companion.filter({ owner_email: email }),
      base44.entities.SpecimenDraft.filter({ owner_email: email }),
      base44.entities.Badge.filter({ owner_email: email }),
    ]);

    // Perform deletions
    // We use Promise.all for each group to keep it relatively fast,
    // but the critical part is that this happens on the server.
    const results = await Promise.all([
      ...specimens.map((r) => base44.entities.Specimen.delete(r.id)),
      ...companions.map((r) => base44.entities.Companion.delete(r.id)),
      ...drafts.map((r) => base44.entities.SpecimenDraft.delete(r.id)),
      ...badges.map((r) => base44.entities.Badge.delete(r.id)),
    ]);

    return Response.json({
      status: 'success',
      deleted_counts: {
        specimens: specimens.length,
        companions: companions.length,
        drafts: drafts.length,
        badges: badges.length,
      },
      total_deleted: results.length,
    });
  } catch (error) {
    console.error('Account data deletion error:', error);
    return Response.json({
      status: 'error',
      message: error.message,
    }, { status: 500 });
  }
});
