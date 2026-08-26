import { describe, expect, it } from 'vitest';
import {
  buildCommunityVoteUpdate,
  SUGGESTION_MAX_LENGTH,
  TIP_MAX_LENGTH,
} from './communityVerification';

const item = { id: 'verification-1', original_ai_guess: 'Quartz', votes: [] };

describe('buildCommunityVoteUpdate', () => {
  it('rejects missing identities and unsupported vote types', () => {
    expect(() => buildCommunityVoteUpdate({ item, voteType: 'agree' })).toThrow();
    expect(() => buildCommunityVoteUpdate({ item, userEmail: 'voter@example.com', voteType: 'admin' })).toThrow();
  });

  it('trims and bounds user-authored vote fields', () => {
    const result = buildCommunityVoteUpdate({
      item,
      userEmail: ' voter@example.com ',
      voteType: 'disagree',
      suggestion: `  ${'A'.repeat(SUGGESTION_MAX_LENGTH + 20)}  `,
      tip: `  ${'B'.repeat(TIP_MAX_LENGTH + 20)}  `,
      now: () => '2026-08-26T00:00:00.000Z',
    });

    expect(result.update.votes[0]).toMatchObject({
      voter_email: 'voter@example.com',
      vote: 'disagree',
      voted_at: '2026-08-26T00:00:00.000Z',
    });
    expect(result.update.votes[0].suggested_name).toHaveLength(SUGGESTION_MAX_LENGTH);
    expect(result.update.votes[0].tip).toHaveLength(TIP_MAX_LENGTH);
    expect(result.update.final_community_guess).toHaveLength(SUGGESTION_MAX_LENGTH);
  });

  it('marks two agreeing votes as verified', () => {
    const result = buildCommunityVoteUpdate({
      item: { ...item, votes: [{ vote: 'agree' }] },
      userEmail: 'voter@example.com',
      voteType: 'agree',
    });

    expect(result.update).toMatchObject({ vote_count: 2, agree_count: 2, status: 'verified' });
  });
});
