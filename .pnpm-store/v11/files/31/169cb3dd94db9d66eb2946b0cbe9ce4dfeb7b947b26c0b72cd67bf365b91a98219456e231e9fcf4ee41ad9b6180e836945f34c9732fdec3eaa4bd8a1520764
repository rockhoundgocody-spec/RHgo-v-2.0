import type { Plugin } from "vite";
export declare const WORKERD_WS_ADAPTER: string;
export declare const WORKERD_ENTER_WITH_PATCH: string;
export interface PatchOptions {
    /** Also route `createRequire` calls through the query-dropping wrapper. */
    createRequire: boolean;
}
/**
 * Patches a workerd server module: imports the enterWith no-op ahead of a module
 * that calls `.enterWith()`, and, with `createRequire`, routes node:module's
 * `createRequire` through a wrapper that drops the id's query. Code is inserted
 * on the first line after any shebang or directive prologue, so strict mode
 * holds and line numbers stay put. Returns null when nothing applies.
 */
export declare function patchServerModule(code: string, id: string, options: PatchOptions): string | null;
export interface WorkerdCompatOptions {
    /** Which dependency optimizer to hook. Defaults to the installed Vite's. */
    rolldown?: boolean;
}
export declare function workerdCompatPlugin({ rolldown }?: WorkerdCompatOptions): Plugin;
//# sourceMappingURL=workerd-compat-plugin.d.ts.map