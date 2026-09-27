import { getSafeRedirectUrl } from "@/lib/app-params";

const AUTH_PATHS = new Set([
  "/login",
  "/register",
  "/forgot-password",
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
    if (!path || AUTH_PATHS.has(path) || path.toLowerCase() === "/login") {
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
