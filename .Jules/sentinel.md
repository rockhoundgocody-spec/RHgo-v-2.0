## 2026-08-23 - Fix Open Redirect in Stripe Checkout Redirect Validation

**Vulnerability:** isValidRedirectTarget used hostname.endsWith('.base44.app') to validate checkout redirect URLs (successUrl and cancelUrl). This allowed any arbitrary domain under .base44.app (e.g. unauthorized.base44.app or an attacker-controlled app hosted on the base44 platform) to act as a valid redirect target, leading to an Open Redirect vulnerability.

**Learning:** Using broad suffix matching like endsWith('.domain.com') without restricting to specific application subdomains allows unvalidated subdomains or third-party tenants on shared platforms to bypass redirect whitelist controls.

**Prevention:** Use exact domain matching or explicitly whitelist allowed application subdomains (e.g., rhgo.base44.app, rhgo2.base44.app, and their subdomains .rhgo.base44.app, .rhgo2.base44.app) when validating redirect URLs.
