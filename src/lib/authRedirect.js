import { getSafeRedirectUrl } from "@/lib/app-params";

// Never send a freshly signed-in user back to an auth screen.
// "/signin" is the canonical sign-in path — Base44 hosting reserves "/login"
// and "/reset-password" on the app domain, so those never reach this app on a
// full page load; they stay here for in-app navigation and old links.
const AUTH_PATHS = new Set([
  "/signin",
  "/login",
  "/register",
  "/forgot-password",
  "/new-password",
  "/reset-password",
  "/auth",
]);

export function readIntendedPath(search = typeof window !== "undefined" ? window.location.search : "") {
  const params = new URLSearchParams(search);
  return params.get("next") || params.get("from_url") || "";
}

export function getPostAuthPath(raw) {
  const target = getSafeRedirectUrl(raw, "/profile");
  try {
    const path = target.startsWith("http")
      ? new URL(target).pathname
      : target.split("?")[0];
    if (!path || AUTH_PATHS.has(path.toLowerCase())) {
      return "/profile";
    }
  } catch {
    return "/profile";
  }
  return target;
}

export function withNext(href, search = typeof window !== "undefined" ? window.location.search : "") {
  const next = readIntendedPath(search);
  if (!next) return href;
  const join = href.includes("?") ? "&" : "?";
  return `${href}${join}next=${encodeURIComponent(next)}`;
}

export function persistBase44Session(base44, accessToken, remember) {
  if (!accessToken || !base44?.auth?.setToken) return;
  base44.auth.setToken(accessToken, !!remember);
  try {
    if (remember) localStorage.setItem("rhgo_remember", "1");
    else {
      localStorage.removeItem("rhgo_remember");
      localStorage.removeItem("base44_access_token");
      localStorage.removeItem("base44_token");
    }
  } catch {
    /* storage blocked */
  }
}
