# Discovery Psychology Layer

## Purpose

Make the MVP feel like a geological adventure engine, not a basic rock ID tool.

## Core loop

Explore -> Find -> Scan -> Reveal -> Choose -> Log -> Learn -> Unlock -> Explore again.

## Discovery Choice

After scan results, show a choice:

### Add to My GeoDex

Collected/chattel path.

Effects:
- Adds to personal GeoDex.
- Awards Collector XP.
- Saves specimen photos, notes, tests, locality, confidence, and provenance.
- Can later support marketplace or valuation.

### Mark In Place

Affixed/legacy pin path.

Effects:
- Logs discovery without removal.
- Awards Steward XP.
- Creates a private or fuzzed public location record.
- Strengthens the map and learning graph.

## Finding fields

Add these fields to the finding model:

```ts
type DiscoveryDisposition =
  | 'chattel_collected'
  | 'affixed_logged'
  | 'restricted_observed'
  | 'unknown';

type Finding = {
  disposition: DiscoveryDisposition;
  collected: boolean;
  leftInPlace: boolean;
  legalStatus: 'allowed' | 'permit_required' | 'private' | 'restricted' | 'unknown';
  ethicsPromptShown: boolean;
  userConfirmedLegalAccess: boolean;
  geoPrivacy: 'exact_private' | 'fuzzed_public' | 'hidden';
  rarityQualityScore?: number;
  xpAwarded?: number;
  chainIds?: string[];
};
```

## XP categories

- Collector XP
- Steward XP
- Scientist XP
- Explorer XP
- Mentor XP

Reward documentation, tests, ethical choices, discovery chains, and learning more strongly than raw extraction volume.

## Discovery chains

When a mineral is found, suggest related minerals by site or district.

Example: Fluorite District Chain: fluorite, calcite, galena, sphalerite, barite.

## Clover behavior

Clover should create curiosity. Clover should explain relationships, suggest next observations, reinforce safety, and guide ethical choices.
