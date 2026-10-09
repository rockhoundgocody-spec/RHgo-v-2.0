# Privacy work that still requires the main branch

This branch cannot change existing entity access rules or mutate production records. No existing access rule was changed here.

## Main-only enforcement work

- PrivateRockLog, PlayerProfile, Quest, Companion, FamilyProfile, MemoryCapsule and other owner-email collections: anchor read/update/delete on immutable creator identity where appropriate, retain administrator access, and constrain creation owner fields to the signed-in account. Check service-created rows before changing owner anchors.
- ClubEvent: remove unrestricted private-event reads. Decide member visibility from actual chapter membership, not an RSVP list. Keep public events public without exposing attendee email lists.
- TrainingCandidate: contributors must not approve their own submissions. Moderation transitions and training acceptance require administrator-only server controls.
- PlayerProfile, Quest, Badge, Specimen and StreamIdentification: separate owner-editable notes/avatar fields from server-controlled rewards, verification and moderation. Entity update permissions are not field permissions; moving these fields behind server-controlled records is required.
- Post, FindVote, StreamBid, StreamMessage and LiveStream: public projections must omit private email fields and exact GPS. Tightening the raw entity rules is required; hiding fields in cards alone is not a fix.
- Test with an owner, a second ordinary user, an administrator and an anonymous visitor on main. This branch cannot verify production saves or deletion.

## Storage limitation

New Private Rock Log uploads are private and metadata-stripped. Existing public uploads remain public. The documented storage tools do not expose uploaded-file erasure. Account removal deletes app records and app membership, not underlying uploaded blobs, external billing records, downloaded copies or backups. The deletion dialog and privacy policy disclose this explicitly.

## Implemented on this branch

Owner-scoped private-log queries; short-lived photo viewing links checked against saved log ownership; private metadata-stripped uploads; bounded and resumable account-record cleanup including shared personal references; recurring billing cancellation before membership removal; app membership removed last; local queue cleanup scoped to the deleted account; late billing updates cannot recreate subscription rows for missing app members.