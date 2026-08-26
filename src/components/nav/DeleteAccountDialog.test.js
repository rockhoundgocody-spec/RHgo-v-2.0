import { describe, expect, it, vi } from 'vitest';
import { deleteUserData } from './DeleteAccountDialog';

describe('deleteUserData', () => {
  it('deletes each owned entity type with four parallel bulk operations', async () => {
    const client = {
      entities: {
        Specimen: { deleteMany: vi.fn().mockResolvedValue({ deleted: 3 }) },
        Companion: { deleteMany: vi.fn().mockResolvedValue({ deleted: 1 }) },
        SpecimenDraft: { deleteMany: vi.fn().mockResolvedValue({ deleted: 2 }) },
        Badge: { deleteMany: vi.fn().mockResolvedValue({ deleted: 4 }) },
      },
    };

    await deleteUserData(client, 'collector@example.com');

    expect(client.entities.Specimen.deleteMany).toHaveBeenCalledWith({ created_by: 'collector@example.com' });
    expect(client.entities.Companion.deleteMany).toHaveBeenCalledWith({ owner_email: 'collector@example.com' });
    expect(client.entities.SpecimenDraft.deleteMany).toHaveBeenCalledWith({ owner_email: 'collector@example.com' });
    expect(client.entities.Badge.deleteMany).toHaveBeenCalledWith({ owner_email: 'collector@example.com' });
  });
});
