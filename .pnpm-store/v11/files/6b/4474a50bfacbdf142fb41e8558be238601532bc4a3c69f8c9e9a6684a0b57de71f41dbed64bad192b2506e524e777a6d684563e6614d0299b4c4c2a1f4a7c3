import type { Plugin } from "vite";

/**
 * Serves `base44:runtime` to full-stack server routes, so a route reads secrets
 * and schedules background work with the SAME import a backend function uses:
 *
 *   import { secrets, waitUntil } from "base44:runtime";
 *
 * WHY A BUILD-TIME VIRTUAL MODULE. The Workers runtime cannot resolve a custom
 * scheme: the legacy module registry special-cases only `node:` / `cloudflare:` /
 * `workerd:`, and the new registry (`new_module_registry`) explicitly rejects a
 * bundle module whose name carries a non-`file:` scheme. Import maps are not
 * supported either. So `base44:runtime` has to be resolved before upload — there
 * is no runtime path to it, and no amount of wrapping the deployed entry creates
 * one.
 *
 * SECRETS AND BACKGROUND WORK NEED NO EXTRA WRAPPER. Cloudflare now ships both
 * primitives ambiently from `cloudflare:workers` (`env` since 2025-03-17,
 * `waitUntil` since 2025-08-08), backed by workerd's own AsyncContextFrame and
 * IoContext. The backend-function bundler predates that and threads a context
 * through `globalThis.Base44` because it owns the generated entry; here the
 * framework owns the entry, and borrowing the platform's ambient accessors means
 * we never have to for those APIs. Static-egress TCP delegates to the helper
 * installed by Base44's deployed entry wrapper; this module only adapts the
 * public import. Without that wrapper (including local dev), TCP fails closed.
 */

const SPECIFIER = "base44:runtime";

// Reserved so a route importing it fails with an explanation instead of a bare
// "failed to resolve import". Actors are never imported — they live in the app's
// actors directory, in server routes exactly as in backend functions.
const ACTORS_REASON =
  "Actors are defined in the app's actors directory, not imported into a route.";

function unsupportedReason(id: string): string | null {
  if (id === "base44:runtime/actors") return ACTORS_REASON;
  return null;
}

/**
 * `cloudflare:workers` stays external — workerd provides it, and Nitro's
 * cloudflare preset already treats `cloudflare:*` that way.
 *
 * There is deliberately no separate dev body. Nitro's `cloudflareDev` preset
 * (aliased for `cloudflare-module`, which is what these apps build with) sets
 * `devServer.runner: "miniflare"`, so dev runs in workerd too and the same
 * import resolves there. A `process.env` fallback would buy nothing and cost a
 * dev/prod behaviour split — the shape that makes background work silently
 * vanish locally while working in production. If someone overrides the runner
 * away from workerd, this fails loudly at resolution rather than quietly
 * serving a different value.
 *
 * `waitUntil` is WRAPPED rather than re-exported: ours returns the promise so it
 * composes (`infra/base44-userapp-bundler/src/runtime/index.ts` in apper),
 * Cloudflare's returns void. A bare re-export would make `const p = waitUntil(x)`
 * work in a backend function and silently yield `undefined` here — one specifier
 * with two behaviours is the exact failure this module exists to prevent.
 */
const RUNTIME_MODULE = `
import { env, waitUntil as cfWaitUntil } from "cloudflare:workers";

export function waitUntil(promise) {
  cfWaitUntil(promise);
  return promise;
}

export const secrets = {
  get(name) {
    const value = env[name];
    return typeof value === "string" ? value : undefined;
  },
};

export const staticEgress = Object.freeze({
  async connect(address, options) {
    const api = globalThis.Base44?.staticEgress;
    if (!api) throw new Error("Static egress TCP is unavailable; rebuild and redeploy with a supported runtime");
    return api.connect(address, options);
  },
});
`;

const IMPORTER_QUERY = "?importer=";

export function base44RuntimePlugin(): Plugin {
  return {
    name: "base44-runtime",
    // Ahead of Vite's own resolution so the bare `base44:` specifier is never
    // mistaken for a URL protocol.
    enforce: "pre",

    // Errors are raised in `load`, never `resolveId`: Vite's dep scanner resolves
    // the raw source of server routes and server-fn handlers in the client
    // environment, before TanStack strips them, and a throw there fails the scan
    // so Vite skips pre-bundling. This relies on the scanner externalizing
    // resolved virtual ids rather than loading them (true of the esbuild scan in
    // Vite 7 and the Rolldown scan in Vite 8); re-check it on a bundler change.
    resolveId(id, importer) {
      if (id !== SPECIFIER && !unsupportedReason(id)) return null;
      // Rollup convention: a NUL-prefixed id is virtual, so no other plugin
      // (and no filesystem lookup) tries to claim it.
      const virtual = `\0${id}`;
      // A module that only exists to fail carries its importer in its id, so the
      // error names that exact file. Server environments share one instance.
      const fails = id !== SPECIFIER || this.environment?.name === "client";
      if (!fails || !importer) return virtual;
      // Drop the importer's own query (e.g. TanStack's `?tsr-split=component`).
      // base64url has no `%`, so the id survives however many times the dev
      // server decodes the request URL.
      return `${virtual}${IMPORTER_QUERY}${Buffer.from(importer.split("?")[0]!).toString("base64url")}`;
    },

    load(id) {
      if (!id.startsWith("\0")) return null;
      const [specifier = "", importer] = id.slice(1).split(IMPORTER_QUERY);
      const reason = unsupportedReason(specifier);
      if (specifier !== SPECIFIER && !reason) return null;
      const from = importer ? ` Imported from ${Buffer.from(importer, "base64url").toString()}.` : "";

      if (reason) this.error(`"${specifier}" is not available in server routes. ${reason}${from}`);

      // `cloudflare:workers` has no browser equivalent, so a client-side import
      // would bundle a module that cannot run. Fail with the reason instead.
      if (this.environment?.name === "client") {
        this.error(`"${SPECIFIER}" is server-only. Move this import into a server route.${from}`);
      }
      return RUNTIME_MODULE;
    },
  };
}
