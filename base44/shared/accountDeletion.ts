const OWNER_ENTITIES = ['Badge', 'BattleResult', 'ChronolithCase', 'ClubChapter', 'ClubEvent', 'CollectionWeight', 'Companion', 'CompanionLog', 'FamilyProfile', 'LiveEyesMeter', 'LiveStream', 'LocationSubmission', 'MarketListing', 'MemoryCapsule', 'PlayerProfile', 'Post', 'PrivateRockLog', 'Quest', 'ScanReceipt', 'SpecimenDraft', 'SpecimenVerification', 'StreamClip', 'StreamIdentification', 'Subscription', 'SyncConflict', 'SyncEventLedger', 'SyncFind', 'SyncIdResult', 'SyncPhoto', 'XPAward'];
export function deletionScopes(user) {
  if (!user?.id || !user?.email) throw new Error('An authenticated account is required.');
  const creator = [{ created_by_id: user.id }, { created_by: user.email }];
  const owned = { $or: [{ owner_email: user.email }, { $and: [{ owner_email: { $exists: false } }, { $or: creator }] }] };
  return [
    ...OWNER_ENTITIES.filter(name => name !== 'Subscription').map(name => ({ name, query: owned })),
    { name: 'Specimen', query: { $or: creator } }, { name: 'TrainingCandidate', query: { $or: creator } },
    ...[['FindVote', 'voter_email'], ['StreamBid', 'bidder_email'], ['StreamMessage', 'author_email'], ['Referral', 'inviter_email']].map(([name, field]) => ({ name, query: { $or: [...creator, { [field]: user.email }] } })),
    { name: 'Subscription', query: { owner_email: user.email } }
  ];
}
const SHARED_REFERENCES = [
  { name: 'Post', query: email => ({ $or: [{ 'comments.email': email }, { 'reactors.email': email }] }), patch: (row, email) => {
    const comments = (row.comments || []).filter(item => item.email !== email);
    const reactors = (row.reactors || []).filter(item => item.email !== email);
    const reactions = { fire: 0, gem: 0, clap: 0, wow: 0 };
    for (const item of reactors) if (item.type in reactions) reactions[item.type]++;
    return { comments, reactors, reactions, comment_count: comments.length };
  } },
  { name: 'ClubEvent', query: email => ({ rsvp_emails: email }), patch: (row, email) => { const emails = (row.rsvp_emails || []).filter(value => value !== email); return { rsvp_emails: emails, rsvp_count: emails.length }; } },
  { name: 'MemoryCapsule', query: email => ({ companion_emails: email }), patch: (row, email) => ({ companion_emails: (row.companion_emails || []).filter(value => value !== email) }) },
  { name: 'Referral', query: email => ({ invitee_email: email }), patch: () => ({ invitee_email: '' }) },
  { name: 'SpecimenVerification', query: email => ({ 'votes.voter_email': email }), patch: (row, email) => { const votes = (row.votes || []).filter(item => item.voter_email !== email); return { votes, vote_count: votes.length, agree_count: votes.filter(item => item.vote === 'agree').length }; } }
];
export async function deleteAccountBatch(client, user, { dryRun = false, limit = 150, cancelSubscription = async () => {} } = {}) {
  const scopes = deletionScopes(user);
  const entities = client.asServiceRole.entities;
  if (dryRun) {
    const summary = [];
    for (const scope of scopes) {
      const sample = await entities[scope.name].filter(scope.query, '-created_date', 1);
      summary.push({ entity: scope.name, has_data: sample.length > 0 });
    }
    let references = 0;
    for (const reference of SHARED_REFERENCES) {
      const rows = await entities[reference.name].filter(reference.query(user.email), '-created_date', 1);
      if (rows.length) references++;
    }
    return { dry_run: true, collections_checked: summary.length, collections_with_data: summary.filter(item => item.has_data).length, shared_reference_types_checked: SHARED_REFERENCES.length, shared_reference_types_with_data: references, account_deleted: false, uploaded_files_erased: false };
  }
  let removed = 0;
  for (const scope of scopes) {
    while (removed < limit) {
      const rows = await entities[scope.name].filter(scope.query, '-created_date', Math.min(25, limit - removed));
      if (!rows.length) break;
      if (scope.name === 'Specimen') {
        const trainingQuery = { specimen_id: { $in: rows.map(row => row.id) } };
        let training;
        do {
          training = await entities.TrainingCandidate.filter(trainingQuery, '-created_date', 25);
          for (let index = 0; index < training.length; index += 5) await Promise.all(training.slice(index, index + 5).map(row => entities.TrainingCandidate.delete(row.id)));
        } while (training.length);
      }
      // Billing must stop before any subscription record is removed.
      for (const row of rows) if (scope.name === 'Subscription' && row.stripe_subscription_id) await cancelSubscription(row.stripe_subscription_id, user);
      for (let index = 0; index < rows.length; index += 5) {
        const outcomes = await Promise.allSettled(rows.slice(index, index + 5).map(row => entities[scope.name].delete(row.id)));
        removed += outcomes.filter(result => result.status === 'fulfilled').length;
        if (outcomes.some(result => result.status === 'rejected')) throw new Error('Deletion paused after partial progress. Your account remains available; retry to finish.');
      }
    }
    if (removed >= limit) return { complete: false, removed, account_deleted: false, uploaded_files_erased: false };
  }
  let scrubbed = 0;
  for (const reference of SHARED_REFERENCES) {
    while (scrubbed < limit) {
      const rows = await entities[reference.name].filter(reference.query(user.email), '-created_date', Math.min(25, limit - scrubbed));
      if (!rows.length) break;
      for (let index = 0; index < rows.length; index += 5) {
        const outcomes = await Promise.allSettled(rows.slice(index, index + 5).map(row => entities[reference.name].update(row.id, reference.patch(row, user.email))));
        scrubbed += outcomes.filter(result => result.status === 'fulfilled').length;
        if (outcomes.some(result => result.status === 'rejected')) throw new Error('Some shared references remain. Your account is still available; retry to finish.');
      }
    }
    if (scrubbed >= limit) return { complete: false, removed, scrubbed, account_deleted: false, uploaded_files_erased: false };
  }
  // Remove app membership last, so partial failures can be retried while signed in.
  await entities.User.delete(user.id);
  return { complete: true, removed, scrubbed, account_deleted: true, uploaded_files_erased: false };
}