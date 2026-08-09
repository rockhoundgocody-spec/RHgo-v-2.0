# Sentinel's Journal

## 2026-07-05 - Open Redirect Protection on Auth Redirect Parameters
**Vulnerability:** The application was vulnerable to Open Redirect attacks through the `from_url` application parameter, which was accepted directly from query parameters without validation. If an attacker passed an external or malicious site URL as `?from_url=http://malicious.com`, the user would be redirected to the attacker's site post login or registration.
**Learning:** Redirect mechanisms and OAuth callback state tracking often use user-supplied URLs (e.g. `from_url`, `redirect_to`). Without checking if the target URL is same-origin or a safe relative path, attackers can bypass security indicators and perform phishing attacks.
**Prevention:** Always validate all user-supplied redirect parameters using a dedicated, strict sanitization helper (like `getSafeRedirectUrl`) that only permits same-origin absolute URLs or relative paths starting with a single `/`, explicitly rejecting protocol-relative bypass attempts (`//`, `\\`, `/\`, `///`).
