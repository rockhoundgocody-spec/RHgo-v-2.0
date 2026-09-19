import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeAll, describe, expect, it, vi } from 'vitest';

const mockBulkCreate = vi.fn().mockResolvedValue([]);
const mockCreate = vi.fn().mockResolvedValue({});
const mockInvoke = vi.fn().mockRejectedValue(new Error('no missions returned'));

vi.mock('@/api/base44Client', () => ({
  base44: {
    auth: { me: vi.fn().mockResolvedValue({ email: 'explorer@example.com' }) },
    functions: { invoke: (...args) => mockInvoke(...args) },
    entities: {
      Quest: {
        filter: vi.fn().mockResolvedValue([]),
        create: (...args) => mockCreate(...args),
        bulkCreate: (...args) => mockBulkCreate(...args),
      },
      Companion: {
        filter: vi.fn().mockResolvedValue([]),
      },
    },
  },
}));

vi.mock('react-router-dom', () => ({ useNavigate: () => vi.fn() }));
vi.mock('@tanstack/react-query', () => ({
  useQuery: () => ({ data: [], refetch: vi.fn() }),
}));

globalThis.window = {
  self: 1,
  top: 1,
  location: { href: 'http://localhost' },
};

let QuestCard;

describe('QuestCard', () => {
  beforeAll(async () => {
    QuestCard = (await import('./QuestDashboard')).QuestCard;
  });

  it('exposes keyboard focus, expansion state, and progress semantics', () => {
    const markup = renderToStaticMarkup(
      <QuestCard
        q={{
          id: 'quest-1',
          title: 'Find Quartz',
          description: 'Log two quartz specimens.',
          quest_type: 'daily',
          progress: 1,
          target_count: 2,
          xp_reward: 50,
          status: 'active',
        }}
      />
    );

    expect(markup).toContain('role="button"');
    expect(markup).toContain('tabindex="0"');
    expect(markup).toContain('aria-expanded="false"');
    expect(markup).toContain('aria-controls=');
    expect(markup).toContain('focus-visible:ring-amethyst/80');
    expect(markup).toContain('role="progressbar"');
    expect(markup).toContain('aria-valuenow="50"');
    expect(markup).toContain('motion-reduce:transition-none');
  });
});

describe('Quest bulkCreate Optimization', () => {
  it('uses bulkCreate instead of multiple create calls when creating fallback quests', async () => {
    const { base44 } = await import('@/api/base44Client');
    const user = { email: 'test@example.com' };
    const QUEST_TEMPLATES = [
      { title: 'Quest 1', quest_type: 'daily' },
      { title: 'Quest 2', quest_type: 'daily' },
      { title: 'Quest 3', quest_type: 'weekly' },
    ];

    const records = QUEST_TEMPLATES.map(t => ({
      owner_email: user.email,
      ...t,
      status: 'active',
      progress: 0,
    }));

    await base44.entities.Quest.bulkCreate(records);

    expect(mockBulkCreate).toHaveBeenCalledTimes(1);
    expect(mockBulkCreate).toHaveBeenCalledWith(records);
    expect(mockCreate).not.toHaveBeenCalled();
    expect(mockBulkCreate.mock.calls[0][0]).toHaveLength(3);
  });
});
