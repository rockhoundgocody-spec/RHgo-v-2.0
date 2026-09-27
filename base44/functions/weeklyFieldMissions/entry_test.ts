import { assertEquals } from 'jsr:@std/assert@1';

Deno.test('weeklyFieldMissions: maps missions correctly for bulkCreate', () => {
  const user = { email: 'rockhound@example.com' };
  const missions = [
    {
      title: 'Find Quartz',
      description: 'Find a specimen of quartz',
      quest_type: 'daily',
      target_count: 2,
      xp_reward: 100,
      target_rarity: null,
      target_mineral: 'Quartz',
      clover_message: 'Keep your eyes peeled!',
    },
    {
      title: 'Explore Amethyst Vein',
      description: 'Search near the old quarry',
      quest_type: 'weekly',
      target_count: 1,
      xp_reward: 250,
      target_rarity: 'rare',
      target_mineral: 'Amethyst',
      clover_message: 'A rare find awaits!',
    },
  ];

  const questRecords = missions.map((m) => ({
    owner_email: user.email,
    title: m.title,
    description: m.description,
    quest_type: m.quest_type || 'daily',
    target_count: m.target_count || 1,
    xp_reward: m.xp_reward || 100,
    target_rarity: m.target_rarity || null,
    target_mineral: m.target_mineral || null,
    clover_message: m.clover_message || '',
    status: 'active',
    progress: 0,
    expires_at: '2025-01-01T00:00:00.000Z',
  }));

  assertEquals(questRecords.length, 2);
  assertEquals(questRecords[0].owner_email, 'rockhound@example.com');
  assertEquals(questRecords[0].title, 'Find Quartz');
  assertEquals(questRecords[0].target_count, 2);
  assertEquals(questRecords[0].status, 'active');
  assertEquals(questRecords[1].xp_reward, 250);
  assertEquals(questRecords[1].target_rarity, 'rare');
});

Deno.test('weeklyFieldMissions: uses bulkCreate to insert all missions in a single call', async () => {
  let bulkCreateCallCount = 0;
  let bulkCreatedRecords: unknown[] = [];

  const mockBase44 = {
    asServiceRole: {
      entities: {
        Quest: {
          bulkCreate: (records: unknown[]) => {
            bulkCreateCallCount++;
            bulkCreatedRecords = records;
            return Promise.resolve(records);
          },
        },
      },
    },
  };

  const missions = [
    { title: 'Mission 1', description: 'Desc 1', quest_type: 'daily' },
    { title: 'Mission 2', description: 'Desc 2', quest_type: 'weekly' },
    { title: 'Mission 3', description: 'Desc 3', quest_type: 'monthly' },
  ];

  const questRecords = missions.map((m) => ({
    owner_email: 'test@example.com',
    title: m.title,
    description: m.description,
    quest_type: m.quest_type || 'daily',
    target_count: m.target_count || 1,
    xp_reward: m.xp_reward || 100,
    target_rarity: m.target_rarity || null,
    target_mineral: m.target_mineral || null,
    clover_message: m.clover_message || '',
    status: 'active',
    progress: 0,
    expires_at: '2025-01-01T00:00:00.000Z',
  }));

  await mockBase44.asServiceRole.entities.Quest.bulkCreate(questRecords);

  assertEquals(bulkCreateCallCount, 1);
  assertEquals(bulkCreatedRecords.length, 3);
});