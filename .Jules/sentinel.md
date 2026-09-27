## 2026-08-24 - AES-GCM Encryption for Offline Queue Storage

**Vulnerability:** Offline queue items containing sensitive specimen or field operation payloads were previously stored in plain JSON text in `localStorage` under `rh-offline-queue-v1`.

**Learning:** Storing offline write queues unencrypted in browser `localStorage` leaves sensitive field data vulnerable to local script access or device inspection.

**Prevention:** Use Web Crypto API (`crypto.subtle`) with AES-GCM 256-bit encryption to encrypt offline payloads before storing them in `localStorage`. Store an encrypted payload structure containing an initialization vector (`iv`) and ciphertext (`data`), and gracefully decrypt legacy plain text items during migration.

## 2026-08-25 - Domain Suffix Spoofing in Edge Function URL Validation

**Vulnerability:** `removeSpecimenBackground` edge function checked image hostnames using `host.endsWith('base44.app')` or similar, allowing attackers to supply URLs on spoofed domains like `evilbase44.app`.

**Learning:** Using string `endsWith` for hostname domain checking without an exact match or leading dot (`.`) allows domain suffix spoofing bypasses.

**Prevention:** Ensure URL hostname validation checks exact domain equality (`host === domain`) or subdomains with a leading dot (`host.endsWith('.' + domain)`), and strictly enforce HTTP/HTTPS protocols.

## 2026-08-26 - Geographic Coordinate Parameter Injection in External API Calls

**Vulnerability:** External API query parameters (`lat` and `lng`) passed to Macrostrat geology endpoints were interpolated directly into request URLs without strict type or range validation.

**Learning:** Unsanitized string inputs containing URL query parameters or control characters (e.g. `lat = "45.5&admin=1"`) could alter outgoing request URL structures or trigger malformed external API calls.

**Prevention:** Parse coordinates to numbers, verify `Number.isFinite(...)`, and enforce valid geographic ranges (`[-90, 90]` for latitude, `[-180, 180]` for longitude) before embedding coordinates into external API URLs.

## 2025-05-18 - Non-Extractable Web Crypto Key Storage in IndexedDB

**Vulnerability:** Raw AES-GCM 256-bit encryption keys were exported to Base64 strings and stored in cleartext in `localStorage` alongside the encrypted offline queue data, rendering the encryption ineffective against XSS or local storage inspection.
**Learning:** `localStorage` is cleartext storage accessible to all JS running in origin and cannot securely hold raw symmetric key material. Web Crypto `CryptoKey` objects created with `extractable: false` cannot be exported to raw bytes, but can be persisted securely in IndexedDB via structured cloning.
**Prevention:** Always create Web Crypto keys with `extractable: false` and persist key handles in IndexedDB (or retain in memory) instead of exporting raw key bytes to `localStorage`.
