import { Base44 } from "@base44/sdk";

export async function run(
  request: { email: string },
  context: { base44: Base44 }
) {
  const { email } = request;
  if (!email) {
    throw new Error('Email is required');
  }

  const { base44 } = context;

  // We are using asServiceRole to bypass user-level RLS if needed, or simply doing the batched deletions.
  const b44 = base44.asServiceRole;

  try {
    const [specimens, companions, drafts, badges] = await Promise.all([
      b44.entities.Specimen.filter({ created_by: email }),
      b44.entities.Companion.filter({ owner_email: email }),
      b44.entities.SpecimenDraft.filter({ owner_email: email }),
      b44.entities.Badge.filter({ owner_email: email }),
    ]);

    await Promise.all([
      ...specimens.map((r) => b44.entities.Specimen.delete(r.id)),
      ...companions.map((r) => b44.entities.Companion.delete(r.id)),
      ...drafts.map((r) => b44.entities.SpecimenDraft.delete(r.id)),
      ...badges.map((r) => b44.entities.Badge.delete(r.id)),
    ]);

    return { success: true };
  } catch (error) {
    console.error('Failed to delete account data:', error);
    throw new Error('Failed to delete account data');
  }
}
