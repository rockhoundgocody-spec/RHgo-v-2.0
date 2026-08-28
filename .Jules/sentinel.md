## 2026-08-24 - AES-GCM Encryption for Offline Queue Storage

**Vulnerability:** Offline queue items containing sensitive specimen or field operation payloads were previously stored in plain JSON text in `localStorage` under `rh-offline-queue-v1`.

**Learning:** Storing offline write queues unencrypted in browser `localStorage` leaves sensitive field data vulnerable to local script access or device inspection.

**Prevention:** Use Web Crypto API (`crypto.subtle`) with AES-GCM 256-bit encryption to encrypt offline payloads before storing them in `localStorage`. Store an encrypted payload structure containing an initialization vector (`iv`) and ciphertext (`data`), and gracefully decrypt legacy plain text items during migration.

## 2026-08-25 - Domain Suffix Spoofing in Image URL Validation

**Vulnerability:** `removeSpecimenBackground` previously checked `host.endsWith('base44.app') || host.endsWith('base44.com') || host.endsWith('amazonaws.com')`, allowing attacker-controlled domains like `evilbase44.app` or `attackerbase44.com` to pass domain verification and burn AI image generation credits or fetch arbitrary external assets.

**Learning:** `String.prototype.endsWith()` without checking for an exact hostname match or a leading dot (`.`) allows domain suffix spoofing attacks.

**Prevention:** Extract URL validation into a strict parser (`isValidImageHost`) that verifies `http:`/`https:` protocols and checks that `hostname === domain || hostname.endsWith('.' + domain)`.
