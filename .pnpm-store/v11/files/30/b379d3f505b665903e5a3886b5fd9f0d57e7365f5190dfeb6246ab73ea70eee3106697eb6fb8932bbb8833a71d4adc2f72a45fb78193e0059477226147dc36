import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { parse } from "@babel/parser";
import { default as traverse } from "@babel/traverse";
import { normalizePath } from "vite";
import { isVite8OrLater } from "./utils.js";
/**
 * Closes three workerd gaps that break Node-targeted npm clients (Stagehand among
 * them) in full-stack server code. @base44/functions-compiler covers the first
 * two for backend functions:
 *
 * - `ws`: its exports map sends the "browser" condition (which Cloudflare's Vite
 *   plugin resolves with) to a stub that throws on use. It is served as a
 *   `ws`-shaped client over workerd's native WebSocket.
 * - `AsyncLocalStorage.enterWith()`: workerd omits it. A module that calls it
 *   first imports a patch that makes it a no-op. Builtins never reach plugin
 *   resolution in Vite 8, so `async_hooks` itself cannot be swapped.
 * - `createRequire()` in dev: optimized dependencies carry a `?v=` query in
 *   their ids, and workerd rejects a `createRequire` path with a query. Calls
 *   are routed through a wrapper that drops it. Builds have no query, so their
 *   bytes are left alone.
 *
 * Only environments that resolve with the "workerd" condition are touched, so
 * the browser bundle and a Node-run server keep the real modules.
 */
// Vite ids use forward slashes on every platform, so these must too.
const compatFile = (name) => normalizePath(fileURLToPath(new URL(`../compat/${name}`, import.meta.url)));
export const WORKERD_WS_ADAPTER = compatFile("workerd-ws.cjs");
export const WORKERD_ENTER_WITH_PATCH = compatFile("workerd-enter-with.mjs");
const isWorkerd = (conditions) => !!conditions?.includes("workerd");
// `ws` exports only its root, so a deep import never resolves to begin with.
const redirect = (id) => (id === "ws" ? WORKERD_WS_ADAPTER : null);
// JSON, CSS and the like reach a "pre" transform raw. Virtual ids often have no
// extension at all, and are JavaScript.
const NON_SCRIPT_FILE = /\.(?![cm]?[jt]sx?$)[a-z0-9]+$/i;
const NODE_MODULE = new Set(["module", "node:module"]);
const CREATE_REQUIRE_IMPL = "__b44CreateRequireImpl";
const CREATE_REQUIRE = "__b44CreateRequire";
// @babel/traverse is CommonJS: Node's ESM interop nests the function under
// `default`, while bundlers and Vitest hand it over directly.
const traverseAst = (traverse.default ??
    traverse);
const pathOf = (id) => id.split("?")[0] ?? id;
function parserPlugins(file) {
    if (/\.tsx$/.test(file))
        return [["typescript", "jsx"]];
    if (/\.[cm]?ts$/.test(file))
        return [["typescript"]];
    // Apps routinely put JSX in .js, but JSX parsing can misread plain JS, so it
    // is only the fallback.
    return [[], ["jsx"]];
}
function parseModule(code, file) {
    for (const plugins of parserPlugins(file)) {
        try {
            return parse(code, {
                // A module is ESM only if it has ESM syntax: text that merely looks
                // like an import, inside a string or comment, does not count.
                sourceType: /\.c[jt]s$/.test(file) ? "script" : /\.m[jt]s$/.test(file) ? "module" : "unambiguous",
                allowReturnOutsideFunction: true,
                allowAwaitOutsideFunction: true,
                plugins,
            });
        }
        catch {
            // Try the next plugin set.
        }
    }
    return null;
}
const isRequireOfNodeModule = (node) => node?.type === "CallExpression" &&
    node.callee.type === "Identifier" &&
    node.callee.name === "require" &&
    node.arguments[0]?.type === "StringLiteral" &&
    NODE_MODULE.has(node.arguments[0].value);
const keyName = (key) => key.type === "Identifier" ? key.name : key.type === "StringLiteral" ? key.value : undefined;
/** Whether `name` at `path` is node:module's createRequire, under any alias. */
function bindsCreateRequire(path, name) {
    const binding = path.scope.getBinding(name);
    if (!binding)
        return false;
    const decl = binding.path.node;
    const parent = binding.path.parent;
    if (decl.type === "ImportSpecifier") {
        return (parent.type === "ImportDeclaration" &&
            NODE_MODULE.has(parent.source.value) &&
            keyName(decl.imported) === "createRequire");
    }
    // const { createRequire } = require("node:module")
    if (decl.type === "VariableDeclarator" && decl.id.type === "ObjectPattern" && isRequireOfNodeModule(decl.init)) {
        return decl.id.properties.some((prop) => prop.type === "ObjectProperty" &&
            keyName(prop.key) === "createRequire" &&
            prop.value.type === "Identifier" &&
            prop.value.name === name);
    }
    return false;
}
/** Whether `name` at `path` is node:module itself, as a default, namespace or required binding. */
function bindsNodeModule(path, name) {
    const binding = path.scope.getBinding(name);
    if (!binding)
        return false;
    const decl = binding.path.node;
    const parent = binding.path.parent;
    if (decl.type === "ImportDefaultSpecifier" || decl.type === "ImportNamespaceSpecifier") {
        return parent.type === "ImportDeclaration" && NODE_MODULE.has(parent.source.value);
    }
    return decl.type === "VariableDeclarator" && decl.id.type === "Identifier" && isRequireOfNodeModule(decl.init);
}
/** The callee of a call that reaches node:module's createRequire, or null. */
function createRequireCallee(path) {
    const callee = path.node.callee;
    if (callee.type === "Identifier") {
        return bindsCreateRequire(path, callee.name) ? callee : null;
    }
    if (callee.type !== "MemberExpression" || callee.computed || keyName(callee.property) !== "createRequire") {
        return null;
    }
    const object = callee.object;
    if (object.type === "Identifier")
        return bindsNodeModule(path, object.name) ? callee : null;
    return isRequireOfNodeModule(object) ? callee : null;
}
/**
 * Patches a workerd server module: imports the enterWith no-op ahead of a module
 * that calls `.enterWith()`, and, with `createRequire`, routes node:module's
 * `createRequire` through a wrapper that drops the id's query. Code is inserted
 * on the first line after any shebang or directive prologue, so strict mode
 * holds and line numbers stay put. Returns null when nothing applies.
 */
export function patchServerModule(code, id, options) {
    const file = pathOf(id);
    if (NON_SCRIPT_FILE.test(file.slice(file.lastIndexOf("/") + 1)) || file === WORKERD_ENTER_WITH_PATCH)
        return null;
    // The AST makes the call; this only skips files that cannot contain one,
    // including calls a formatter split across lines.
    const mayEnterWith = code.includes("enterWith");
    const mayCreateRequire = options.createRequire && code.includes("createRequire") && !code.includes(CREATE_REQUIRE_IMPL);
    if (!mayEnterWith && !mayCreateRequire)
        return null;
    const ast = parseModule(code, file);
    if (!ast)
        return null;
    let callsEnterWith = false;
    const callees = [];
    const visit = (path) => {
        const callee = path.node.callee;
        if (mayEnterWith &&
            (callee.type === "MemberExpression" || callee.type === "OptionalMemberExpression") &&
            !callee.computed &&
            keyName(callee.property) === "enterWith") {
            callsEnterWith = true;
        }
        const target = mayCreateRequire ? createRequireCallee(path) : null;
        if (target)
            callees.push(target);
    };
    traverseAst(ast, { CallExpression: visit, OptionalCallExpression: visit });
    if (!callsEnterWith && callees.length === 0)
        return null;
    const isEsm = ast.program.sourceType === "module";
    let prefix = "";
    if (callsEnterWith) {
        const patch = JSON.stringify(WORKERD_ENTER_WITH_PATCH);
        // An ESM import in a CommonJS module would turn it into ESM; require it there.
        prefix += isEsm ? `import ${patch};` : `require(${patch});`;
    }
    if (callees.length > 0) {
        prefix += isEsm
            ? `import { createRequire as ${CREATE_REQUIRE_IMPL} } from "node:module";`
            : `const { createRequire: ${CREATE_REQUIRE_IMPL} } = require("node:module");`;
        prefix += `const ${CREATE_REQUIRE} = (path) => ${CREATE_REQUIRE_IMPL}(String(path).replace(/[?#].*$/, ""));`;
    }
    // A shebang line cannot be followed on the same line, so the code goes at the
    // start of the next one.
    const { interpreter, directives } = ast.program;
    let afterInterpreter = 0;
    if (interpreter) {
        const newline = code.indexOf("\n", interpreter.end);
        if (newline === -1)
            prefix = `\n${prefix}`;
        afterInterpreter = newline === -1 ? code.length : newline + 1;
    }
    const insertAt = Math.max(afterInterpreter, ...directives.map((d) => d.end));
    // A directive may end without a semicolon, and code cannot follow it directly.
    if (insertAt > afterInterpreter && code[insertAt - 1] !== ";")
        prefix = `;${prefix}`;
    const edits = [
        { start: insertAt, end: insertAt, text: prefix },
        ...callees.map((node) => ({ start: node.start, end: node.end, text: CREATE_REQUIRE })),
    ].sort((a, b) => b.start - a.start);
    let out = code;
    for (const edit of edits)
        out = out.slice(0, edit.start) + edit.text + out.slice(edit.end);
    return out;
}
const devTransform = (code, id) => patchServerModule(code, id, { createRequire: true });
// Every edit keeps lines in place, so the input's source map still holds.
const transformResult = (code) => (code === null ? null : { code, map: null });
// Dev pre-bundles dependencies without running Vite plugins, so the dependency
// optimizer, which only runs in dev, needs its own copy. Each copy checks the
// build's conditions itself: Cloudflare's plugin sets them after ours has run.
function esbuildOptimizerPlugin() {
    return {
        name: "base44-workerd-compat",
        setup(build) {
            if (!isWorkerd(build.initialOptions.conditions))
                return;
            build.onResolve({ filter: /^ws$/ }, () => ({ path: WORKERD_WS_ADAPTER }));
            // Other namespaces hold virtual modules with no file to read.
            build.onLoad({ filter: /\.[cm]?js$/, namespace: "file" }, async (args) => {
                const code = devTransform(await readFile(args.path, "utf8"), args.path);
                return code === null ? undefined : { contents: code, loader: "js" };
            });
        },
    };
}
function rolldownOptimizerPlugin() {
    let active = false;
    return {
        name: "base44-workerd-compat",
        options(options) {
            active = isWorkerd(options.resolve?.conditionNames);
        },
        resolveId: (id) => (active ? redirect(id) : null),
        transform: (code, id) => (active ? transformResult(devTransform(code, id)) : null),
    };
}
const OPTIMIZED_DEP = /[\\/]node_modules[\\/]\.vite[\\/]/;
export function workerdCompatPlugin({ rolldown = isVite8OrLater } = {}) {
    return {
        name: "base44-workerd-compat",
        enforce: "pre",
        applyToEnvironment: (environment) => isWorkerd(environment.config.resolve.conditions),
        configEnvironment(name) {
            if (name === "client")
                return;
            const optimizeDeps = rolldown
                ? { rolldownOptions: { plugins: [rolldownOptimizerPlugin()] } }
                : { esbuildOptions: { plugins: [esbuildOptimizerPlugin()] } };
            // Vite 7's types do not know `rolldownOptions`, hence the cast.
            return { optimizeDeps };
        },
        resolveId: (id) => redirect(id),
        transform(code, id) {
            // The optimizer already patched its output.
            if (OPTIMIZED_DEP.test(id))
                return null;
            return transformResult(patchServerModule(code, id, { createRequire: this.environment.mode === "dev" }));
        },
    };
}
//# sourceMappingURL=workerd-compat-plugin.js.map