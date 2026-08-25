## 2026-08-24 - AES-GCM Encryption for Offline Queue Storage

**Vulnerability:** Offline queue items containing sensitive specimen or field operation payloads were previously stored in plain JSON text in `localStorage` under `rh-offline-queue-v1`.

**Learning:** Storing offline write queues unencrypted in browser `localStorage` leaves sensitive field data vulnerable to local script access or device inspection.

**Prevention:** Use Web Crypto API (`crypto.subtle`) with AES-GCM 256-bit encryption to encrypt offline payloads before storing them in `localStorage`. Store an encrypted payload structure containing an initialization vector (`iv`) and ciphertext (`data`), and gracefully decrypt legacy plain text items during migration.
