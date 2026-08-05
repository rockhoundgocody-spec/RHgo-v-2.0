# Sentinel Security Journal

This journal records critical security learnings, vulnerability patterns, and solutions specific to this codebase.

## 2025-02-18 - Open Redirect Prevention
**Vulnerability:** Open Redirect vulnerability via arbitrary redirect/from_url parameters stored in sessionStorage/localStorage and used for routing.
**Learning:** Checking for `window` or `window.location` presence dynamically is critical in SSR/hybrid and Node testing environments. Unsafe redirects can be prevented by validating parameters to ensure they only allow same-origin absolute URLs or safe relative paths.
**Prevention:** Always sanitize dynamic redirect targets with a standard `getSafeRedirectUrl` utility.
