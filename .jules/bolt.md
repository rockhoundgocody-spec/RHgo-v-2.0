## 2025-05-20 - Optimize Array.find in map callback with Map lookup

**Learning:** Repeatedly calling `Array.prototype.find()` inside a `.map()` callback over collection items creates O(N * M) algorithmic complexity. By creating a static or pre-computed `Map` dictionary for lookups, item matching is reduced to O(1) constant time lookup, eliminating linear scanning on every iteration.

**Action:** Whenever mapping array items to related constant or static data (such as fighters, mineral types, or badge definitions), replace `.find(item => item.id === target)` inside `.map()` with a pre-constructed `Map` or plain JavaScript object lookup (`map.get(target)`).
