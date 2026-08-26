const VALID_VOTE_TYPES = new Set(['agree', 'disagree', 'unsure']);

export const SUGGESTION_MAX_LENGTH = 80;
export const TIP_MAX_LENGTH = 240;

function cleanText(value, maxLength) {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : '';
}

export function buildCommunityVoteUpdate({
  item,
  userEmail,
  voteType,
  suggestion,
  tip,
  now = () => new Date().toISOString(),
}) {
  const voterEmail = cleanText(userEmail, 320);
  if (!item?.id || !voterEmail || !VALID_VOTE_TYPES.has(voteType)) {
    throw new Error('Invalid community vote');
  }

  const suggestedName = cleanText(suggestion, SUGGESTION_MAX_LENGTH);
  const fieldTip = cleanText(tip, TIP_MAX_LENGTH);
  const existingVotes = Array.isArray(item.votes) ? item.votes : [];
  const newVote = {
    voter_email: voterEmail,
    vote: voteType,
    suggested_name: suggestedName || null,
    tip: fieldTip || null,
    voted_at: now(),
  };
  const votes = [...existingVotes, newVote];
  const agreeCount = votes.filter((vote) => vote?.vote === 'agree').length;
  const voteCount = votes.length;

  return {
    voteType,
    update: {
      votes,
      vote_count: voteCount,
      agree_count: agreeCount,
      status: agreeCount >= 2
        ? 'verified'
        : voteCount >= 3 && agreeCount < voteCount / 2
          ? 'corrected'
          : 'pending',
      final_community_guess: voteType === 'disagree' && suggestedName
        ? suggestedName
        : item.original_ai_guess,
    },
  };
}
