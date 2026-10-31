// Imported ahead of any Cloudflare Workers server module that calls enterWith,
// by the base44-workerd-compat plugin. workerd defines
// AsyncLocalStorage.prototype.enterWith but makes it always throw; libraries such
// as Stagehand call it to seed a context they also pass explicitly, so a no-op
// keeps them working.
//
// The no-op is global: any caller in the isolate that relies on enterWith to
// propagate state gets nothing instead of an exception. Storing the value per
// instance instead would leak it across the concurrent requests an isolate
// serves, which is worse. A runtime whose enterWith works is left alone.
import { AsyncLocalStorage } from "node:async_hooks";

const native = AsyncLocalStorage.prototype.enterWith;
let works = false;
try {
  native.call(new AsyncLocalStorage(), undefined);
  works = true;
} catch {}

if (!works) AsyncLocalStorage.prototype.enterWith = function enterWith() {};
