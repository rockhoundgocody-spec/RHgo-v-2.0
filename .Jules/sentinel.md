## 2026-08-23 - Strict Domain Matching for Redirect Validation
**Vulnerability:** Open Redirect in `isValidRedirectTarget` caused by loose `hostname.endsWith('.base44.app')` check, allowing attacker subdomains like `evil.base44.app` to pass redirect URL validation.
**Learning:** `endsWith('.domain.com')` on hostnames matches any subdomain under `.domain.com`. If a platform allows untrusted users or applications to register arbitrary subdomains under `.domain.com`, relying on `endsWith('.domain.com')` introduces open redirect and SSRF vulnerabilities.
**Prevention:** Whitelist exact allowed hostnames (`Set`) and require strict dot-prefixed domain suffixes (`.rhgo.base44.app`) for authorized sub-apps only.
