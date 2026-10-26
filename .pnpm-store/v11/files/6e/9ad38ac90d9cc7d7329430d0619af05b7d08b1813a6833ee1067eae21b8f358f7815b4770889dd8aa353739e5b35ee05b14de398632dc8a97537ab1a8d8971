// Served for `ws` in Cloudflare Workers environments by the base44-workerd-compat
// plugin. The `ws` package's "browser" export is a stub that throws, and its Node
// build needs node:net; workerd has a native WebSocket client, so this is a
// `ws`-shaped client over it. Kept in step with @base44/functions-compiler's copy.
"use strict";
const CONNECTING = 0;
const OPEN = 1;
const CLOSING = 2;
const CLOSED = 3;
const toBuffer = (value) => (globalThis.Buffer ? globalThis.Buffer.from(value) : value);
// The WHATWG close() that workerd implements accepts fewer codes than `ws` does.
const isWhatwgCloseCode = (code) => code === 1000 || (code >= 3000 && code <= 4999);
const later = (fn, ...args) => queueMicrotask(() => fn(...args));
class WebSocket {
  static CONNECTING = CONNECTING;
  static OPEN = OPEN;
  static CLOSING = CLOSING;
  static CLOSED = CLOSED;
  #socket;
  #listeners = new Map();
  #maxListeners = 10;
  #terminated = false;
  constructor(address, protocols) {
    this.#socket = new globalThis.WebSocket(String(address), typeof protocols === "string" || Array.isArray(protocols) ? protocols : undefined);
    try { this.#socket.binaryType = "arraybuffer"; } catch {}
    this.#socket.addEventListener("open", () => this.emit("open"));
    this.#socket.addEventListener("message", (event) => {
      const isBinary = typeof event.data !== "string";
      this.emit("message", toBuffer(isBinary ? new Uint8Array(event.data) : event.data), isBinary);
    });
    this.#socket.addEventListener("error", (event) => this.emit("error", event.error ?? new Error(event.message || "WebSocket error")));
    this.#socket.addEventListener("close", (event) => {
      if (!this.#terminated) this.emit("close", event.code, toBuffer(event.reason ?? ""));
    });
  }
  get readyState() { return this.#terminated ? CLOSED : this.#socket.readyState; }
  get url() { return this.#socket.url; }
  get protocol() { return this.#socket.protocol; }
  on(name, listener) { return this.#add(name, listener, false, false); }
  addListener(name, listener) { return this.#add(name, listener, false, false); }
  once(name, listener) { return this.#add(name, listener, true, false); }
  prependListener(name, listener) { return this.#add(name, listener, false, true); }
  prependOnceListener(name, listener) { return this.#add(name, listener, true, true); }
  off(name, listener) { return this.removeListener(name, listener); }
  removeListener(name, listener) {
    const listeners = this.#listeners.get(name);
    if (listeners) this.#listeners.set(name, listeners.filter((entry) => entry.listener !== listener));
    return this;
  }
  removeAllListeners(name) {
    if (name === undefined) this.#listeners.clear();
    else this.#listeners.delete(name);
    return this;
  }
  listeners(name) { return (this.#listeners.get(name) ?? []).map((entry) => entry.listener); }
  listenerCount(name) { return this.#listeners.get(name)?.length ?? 0; }
  eventNames() { return [...this.#listeners.keys()].filter((name) => this.listenerCount(name) > 0); }
  setMaxListeners(count) { this.#maxListeners = count; return this; }
  getMaxListeners() { return this.#maxListeners; }
  emit(name, ...args) {
    // Dispatch to a snapshot, as Node's EventEmitter does.
    const listeners = this.#listeners.get(name) ?? [];
    this.#listeners.set(name, listeners.filter((entry) => !entry.once));
    for (const entry of listeners) entry.listener.apply(this, args);
    return listeners.length > 0;
  }
  send(data, options, callback) {
    const done = typeof options === "function" ? options : callback;
    try {
      this.#socket.send(data);
    } catch (error) {
      if (!done) throw error;
      later(done, error);
      return;
    }
    // `ws` reports completion asynchronously; so does this.
    if (done) later(done);
  }
  // workerd answers the peer's pings itself but cannot send one. A keepalive
  // loop waiting for "pong" would otherwise kill a healthy socket, so an open
  // socket answers with one.
  ping(data, mask, callback) {
    const done = [data, mask, callback].find((arg) => typeof arg === "function");
    if (this.readyState === OPEN) later(() => this.emit("pong", toBuffer("")));
    if (done) later(done);
  }
  pong(data, mask, callback) {
    const done = [data, mask, callback].find((arg) => typeof arg === "function");
    if (done) later(done);
  }
  close(code, reason) {
    try {
      this.#socket.close(code, reason);
    } catch (error) {
      // A code `ws` accepts but WHATWG close() rejects, such as 1001.
      if (code === undefined || isWhatwgCloseCode(code)) throw error;
      this.#socket.close(1000, reason);
    }
  }
  // `ws` tears the connection down at once. workerd has no abrupt close, so the
  // socket is closed normally and "close" is reported now, not on the reply.
  terminate() {
    if (this.#terminated || this.#socket.readyState === CLOSED) return;
    this.#terminated = true;
    try { this.#socket.close(); } catch {}
    later(() => this.emit("close", 1006, toBuffer("")));
  }
  #add(name, listener, once, prepend) {
    const listeners = this.#listeners.get(name) ?? [];
    if (prepend) listeners.unshift({ listener, once });
    else listeners.push({ listener, once });
    this.#listeners.set(name, listeners);
    return this;
  }
}
Object.assign(WebSocket.prototype, { CONNECTING, OPEN, CLOSING, CLOSED });
const unavailable = (what) => new Error(`ws ${what} is not available in Cloudflare Workers server code, which only supports the ws WebSocket client.`);
class WebSocketServer {
  constructor() { throw unavailable("WebSocketServer"); }
}
class Receiver {
  constructor() { throw unavailable("Receiver"); }
}
class Sender {
  constructor() { throw unavailable("Sender"); }
}
function createWebSocketStream() { throw unavailable("createWebSocketStream"); }
module.exports = WebSocket;
module.exports.WebSocket = WebSocket;
module.exports.WebSocketServer = WebSocketServer;
module.exports.Server = WebSocketServer;
module.exports.Receiver = Receiver;
module.exports.Sender = Sender;
module.exports.createWebSocketStream = createWebSocketStream;
module.exports.default = WebSocket;
