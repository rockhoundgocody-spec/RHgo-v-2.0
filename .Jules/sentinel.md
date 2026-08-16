## 2025-05-18 - Open Redirect via Unvalidated Stripe Checkout Callbacks

**Vulnerability:**
The `createCheckoutSession` Deno edge function accepted arbitrary `successUrl` and `cancelUrl` parameters from client requests and passed them directly to `stripe.checkout.sessions.create()`, allowing unauthenticated callers to craft links redirecting users to arbitrary malicious external sites post-checkout.

**Learning:**
Edge functions accepting external URL parameters for browser navigation or callbacks must explicitly validate both scheme and domain against an allowlist on the server side rather than relying on frontend input validation.

**Prevention:**
Always validate redirect destinations with strict hostname allowlists (`localhost`, `127.0.0.1`, `base44.app`, `*.base44.app`) using a dedicated helper module (`isValidRedirectTarget`) before returning or forwarding redirect URLs.
