## 2026-08-24 - AES-GCM Encryption for Offline Queue Storage

**Vulnerability:** Offline queue items containing sensitive specimen or field operation payloads were previously stored in plain JSON text in `localStorage` under `rh-offline-queue-v1`.

**Learning:** Storing offline write queues unencrypted in browser `localStorage` leaves sensitive field data vulnerable to local script access or device inspection.

**Prevention:** Use Web Crypto API (`crypto.subtle`) with AES-GCM 256-bit encryption to encrypt offline payloads before storing them in `localStorage`. Store an encrypted payload structure containing an initialization vector (`iv`) and ciphertext (`data`), and gracefully decrypt legacy plain text items during migration.

## 2026-08-25 - Domain Suffix Spoofing in Edge Function URL Validation

**Vulnerability:** `removeSpecimenBackground` edge function checked image hostnames using `host.endsWith('base44.app')` or similar, allowing attackers to supply URLs on spoofed domains like `evilbase44.app`.

**Learning:** Using string `endsWith` for hostname domain checking without an exact match or leading dot (`.`) allows domain suffix spoofing bypasses.

**Prevention:** Ensure URL hostname validation checks exact domain equality (`host === domain`) or subdomains with a leading dot (`host.endsWith('.' + domain)`), and strictly enforce HTTP/HTTPS protocols.

## 2026-09-01 - Open Redirect Mitigation in OAuth Consent Navigation

**Vulnerability:** In `OAuthConsent.jsx`, the application assigned unvalidated `data.redirect_url` directly to `window.location.href` after completing an OAuth authorization grant, allowing attackers to redirect users to malicious off-site phishing destinations.

**Learning:** Assigning backend-returned redirect URLs directly to `window.location.href` without validating origin or protocol allows open redirect attacks, especially when authorization responses accept or return caller-supplied callback destinations.

**Prevention:** Always validate HTTP/HTTPS redirect targets using `getSafeRedirectUrl` against the application origin before assigning to `window.location.href`, while filtering dangerous schemes (`javascript:`, `data:`, `file:`) when handling valid deep-link custom app schemes (such as `cursor://`).
