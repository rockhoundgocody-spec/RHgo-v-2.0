import { describe, it, expect, beforeAll, beforeEach, vi } from "vitest";

let readIntendedPath;
let getPostAuthPath;
let withNext;
let persistBase44Session;

const createStorage = () => {
  const values = new Map();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: (key) => values.delete(key),
    clear: () => values.clear(),
  };
};

const localStorage = createStorage();
const sessionStorage = createStorage();

beforeAll(async () => {
  globalThis.localStorage = localStorage;
  globalThis.sessionStorage = sessionStorage;
  globalThis.window = {
    location: {
      origin: "http://localhost:3000",
      href: "http://localhost:3000",
      pathname: "/",
      search: "",
      hash: "",
    },
    localStorage,
    sessionStorage,
    history: {
      replaceState: () => {},
    },
  };
  globalThis.document = {
    title: "RockHound GO",
  };

  const mod = await import("./authRedirect");
  readIntendedPath = mod.readIntendedPath;
  getPostAuthPath = mod.getPostAuthPath;
  withNext = mod.withNext;
  persistBase44Session = mod.persistBase44Session;
});

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  window.location.search = "";
});

describe("readIntendedPath", () => {
  it("extracts next parameter from search string", () => {
    expect(readIntendedPath("?next=/dashboard")).toBe("/dashboard");
  });

  it("extracts from_url parameter if next is absent", () => {
    expect(readIntendedPath("?from_url=/map")).toBe("/map");
  });

  it("prioritizes next over from_url", () => {
    expect(readIntendedPath("?next=/dashboard&from_url=/map")).toBe("/dashboard");
  });

  it("returns empty string when neither param is present", () => {
    expect(readIntendedPath("?ref=123")).toBe("");
    expect(readIntendedPath("")).toBe("");
  });

  it("uses window.location.search when search argument is omitted", () => {
    window.location.search = "?next=/explore";
    expect(readIntendedPath()).toBe("/explore");
  });
});

describe("getPostAuthPath", () => {
  it("returns valid safe relative paths", () => {
    expect(getPostAuthPath("/dashboard")).toBe("/dashboard");
    expect(getPostAuthPath("/collection?view=grid")).toBe("/collection?view=grid");
    expect(getPostAuthPath("/map#spot-1")).toBe("/map#spot-1");
  });

  it("redirects restricted auth paths to /profile", () => {
    expect(getPostAuthPath("/signin")).toBe("/profile");
    expect(getPostAuthPath("/login")).toBe("/profile");
    expect(getPostAuthPath("/register")).toBe("/profile");
    expect(getPostAuthPath("/forgot-password")).toBe("/profile");
    expect(getPostAuthPath("/new-password")).toBe("/profile");
    expect(getPostAuthPath("/reset-password")).toBe("/profile");
    expect(getPostAuthPath("/auth")).toBe("/profile");
  });

  it("handles case-insensitive auth path checks", () => {
    expect(getPostAuthPath("/LOGIN")).toBe("/profile");
    expect(getPostAuthPath("/SignIn")).toBe("/profile");
    expect(getPostAuthPath("/REGISTER")).toBe("/profile");
    expect(getPostAuthPath("/FORGOT-PASSWORD")).toBe("/profile");
    expect(getPostAuthPath("/NEW-PASSWORD")).toBe("/profile");
    expect(getPostAuthPath("/RESET-PASSWORD")).toBe("/profile");
    expect(getPostAuthPath("/AUTH")).toBe("/profile");
  });

  it("ignores query strings on auth paths and redirects to /profile", () => {
    expect(getPostAuthPath("/login?redirect=1")).toBe("/profile");
    expect(getPostAuthPath("/signin?ref=email")).toBe("/profile");
    expect(getPostAuthPath("/REGISTER?tab=form")).toBe("/profile");
  });

  it("returns /profile for empty, invalid, or non-string targets", () => {
    expect(getPostAuthPath("")).toBe("/profile");
    expect(getPostAuthPath(null)).toBe("/profile");
    expect(getPostAuthPath(undefined)).toBe("/profile");
    expect(getPostAuthPath(12345)).toBe("/profile");
  });

  it("blocks open redirects and falls back to /profile", () => {
    expect(getPostAuthPath("https://evil.com/phish")).toBe("/profile");
    expect(getPostAuthPath("//attacker.com")).toBe("/profile");
    expect(getPostAuthPath("/\\evil.com")).toBe("/profile");
    expect(getPostAuthPath("javascript:alert(1)")).toBe("/profile");
  });

  it("allows same-origin absolute URL path when origin matches", () => {
    expect(getPostAuthPath("http://localhost:3000/settings")).toBe("http://localhost:3000/settings");
  });

  it("redirects same-origin absolute URL to /profile if path is an auth path", () => {
    expect(getPostAuthPath("http://localhost:3000/login")).toBe("/profile");
    expect(getPostAuthPath("http://localhost:3000/SIGNIN")).toBe("/profile");
  });
});

describe("withNext", () => {
  it("appends next param using ? when target href has no query string", () => {
    expect(withNext("/signin", "?next=/dashboard")).toBe("/signin?next=%2Fdashboard");
  });

  it("appends next param using & when target href already has query string", () => {
    expect(withNext("/login?mode=oauth", "?next=/settings")).toBe("/login?mode=oauth&next=%2Fsettings");
  });

  it("returns unchanged href when no intended path is in search", () => {
    expect(withNext("/signin", "?foo=bar")).toBe("/signin");
    expect(withNext("/login", "")).toBe("/login");
  });

  it("uses window.location.search when search parameter is omitted", () => {
    window.location.search = "?next=/field-guide";
    expect(withNext("/signin")).toBe("/signin?next=%2Ffield-guide");
  });
});

describe("persistBase44Session", () => {
  it("does nothing if accessToken is missing or base44.auth.setToken is missing", () => {
    const base44Mock = { auth: { setToken: vi.fn() } };
    persistBase44Session(base44Mock, null, true);
    expect(base44Mock.auth.setToken).not.toHaveBeenCalled();

    persistBase44Session({}, "token-123", true);
  });

  it("invokes setToken and sets rhgo_remember when remember is true", () => {
    const base44Mock = { auth: { setToken: vi.fn() } };
    persistBase44Session(base44Mock, "token-123", true);

    expect(base44Mock.auth.setToken).toHaveBeenCalledWith("token-123", true);
    expect(localStorage.getItem("rhgo_remember")).toBe("1");
  });

  it("invokes setToken and clears storage tokens when remember is false", () => {
    localStorage.setItem("rhgo_remember", "1");
    localStorage.setItem("base44_access_token", "old-token");
    localStorage.setItem("base44_token", "old-token");

    const base44Mock = { auth: { setToken: vi.fn() } };
    persistBase44Session(base44Mock, "token-456", false);

    expect(base44Mock.auth.setToken).toHaveBeenCalledWith("token-456", false);
    expect(localStorage.getItem("rhgo_remember")).toBeNull();
    expect(localStorage.getItem("base44_access_token")).toBeNull();
    expect(localStorage.getItem("base44_token")).toBeNull();
  });
});
