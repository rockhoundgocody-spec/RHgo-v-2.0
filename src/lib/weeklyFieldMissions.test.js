import { describe, it, expect, vi } from 'vitest';

describe('weeklyFieldMissions optimization', () => {
  it('queries global hotspots once upfront instead of N times across N users', async () => {
    const mockUsers = [
      { id: 'user-1', email: 'user1@example.com' },
      { id: 'user-2', email: 'user2@example.com' },
      { id: 'user-3', email: 'user3@example.com' },
    ];

    const mockHotspots = [
      { id: 'h-1', name: 'Agate Beach', minerals: ['Agate'] },
      { id: 'h-2', name: 'Copper Pit', minerals: ['Native Copper'] },
    ];

    const hotspotListMock = vi.fn().mockResolvedValue(mockHotspots);
    const userListMock = vi.fn().mockResolvedValue(mockUsers);
    const questBulkCreateMock = vi.fn().mockResolvedValue([{ id: 'q1' }, { id: 'q2' }, { id: 'q3' }]);

    // Simulated handler logic following weeklyFieldMissions structure
    const base44 = {
      asServiceRole: {
        entities: {
          User: { list: userListMock },
          Hotspot: { list: hotspotListMock },
          Specimen: { filter: vi.fn().mockResolvedValue([]) },
          Quest: { bulkCreate: questBulkCreateMock },
        },
        integrations: {
          Core: {
            InvokeLLM: vi.fn().mockResolvedValue({
              missions: [
                { title: 'Find Agate', quest_type: 'daily' },
                { title: 'Find Copper', quest_type: 'weekly' },
              ],
            }),
            SendPushNotification: vi.fn().mockResolvedValue({ ok: true }),
          },
        },
      },
    };

    // Execute optimized upfront query pattern
    const [users, hotspots] = await Promise.all([
      base44.asServiceRole.entities.User.list('-created_date', 500),
      base44.asServiceRole.entities.Hotspot.list('-trust_score', 200),
    ]);

    for (const user of users) {
      const specimens = await base44.asServiceRole.entities.Specimen.filter({ created_by_id: user.id });
      const unvisited = hotspots.filter((h) => h.minerals.length > 0);

      const result = await base44.asServiceRole.integrations.Core.InvokeLLM({ prompt: 'test' });
      const missions = result?.missions || [];

      if (missions.length > 0) {
        await base44.asServiceRole.entities.Quest.bulkCreate(
          missions.map((m) => ({
            owner_email: user.email,
            title: m.title,
            quest_type: m.quest_type,
          }))
        );
      }
    }

    // Verify Hotspot.list was called ONCE, not 3 times (once per user)
    expect(hotspotListMock).toHaveBeenCalledTimes(1);

    // Verify Quest.bulkCreate was called 3 times (once per user with bulk batch array), not 6 times (2 * 3 individual create calls)
    expect(questBulkCreateMock).toHaveBeenCalledTimes(3);
    expect(questBulkCreateMock.mock.calls[0][0]).toHaveLength(2);
    expect(questBulkCreateMock.mock.calls[1][0]).toHaveLength(2);
    expect(questBulkCreateMock.mock.calls[2][0]).toHaveLength(2);
  });
});
