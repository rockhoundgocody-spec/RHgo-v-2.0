// The backend picks each script URL, but the script runs on the buyer's page, so only these hosts may load.
const ALLOWED_SCRIPT_HOSTS = {
    paypal: ["www.paypal.com", "www.sandbox.paypal.com"],
    stripe: ["js.stripe.com"],
};
async function scriptUrlFor(provider, deps) {
    var _a, _b;
    const value = (_b = (_a = (await deps.getConfig())) === null || _a === void 0 ? void 0 : _a[provider]) === null || _b === void 0 ? void 0 : _b.script_url;
    let url;
    try {
        url = value ? new URL(value) : undefined;
    }
    catch (_c) {
        url = undefined;
    }
    if (!url ||
        url.protocol !== "https:" ||
        url.port !== "" ||
        url.username !== "" ||
        url.password !== "" ||
        !ALLOWED_SCRIPT_HOSTS[provider].includes(url.hostname)) {
        const name = provider === "paypal" ? "PayPal" : "Stripe";
        throw new Error(`The payments config has no valid ${name} script URL`);
    }
    return url.href;
}
function browserGlobals() {
    return window;
}
const scriptLoads = new Map();
/**
 * Appends a script tag once per URL and resolves when it loads.
 * @internal
 */
export const loadScript = (src) => {
    let load = scriptLoads.get(src);
    if (!load) {
        load = new Promise((resolve, reject) => {
            const script = document.createElement("script");
            script.src = src;
            script.async = true;
            script.onload = () => resolve();
            script.onerror = () => {
                // Forget the failure so a later mount can retry.
                scriptLoads.delete(src);
                script.remove();
                reject(new Error(`Failed to load ${src}`));
            };
            document.head.appendChild(script);
        });
        scriptLoads.set(src, load);
    }
    return load;
};
async function loadGlobal(src, read, load) {
    if (!read()) {
        await load(src);
    }
    const value = read();
    if (!value) {
        throw new Error(`${src} loaded but didn't define its global`);
    }
    return value;
}
// Stripe asks for a single Stripe instance per key.
const stripeInstances = new Map();
// Stripe allows one Embedded Checkout at a time, so mounts run in order and replace the last.
let stripeQueue = Promise.resolve();
let activeStripeCheckout = null;
function mountStripe(element, scriptUrl, embedded, deps) {
    const mount = stripeQueue.then(async () => {
        var _a;
        const Stripe = await loadGlobal(scriptUrl, () => browserGlobals().Stripe, deps.loadScript);
        let stripe = stripeInstances.get(embedded.publishable_key);
        if (!stripe) {
            stripe = Stripe(embedded.publishable_key);
            stripeInstances.set(embedded.publishable_key, stripe);
        }
        // Try the pre-dahlia name first, since dahlia and later reject the ui_mode Base44 sessions use.
        // A newer Stripe.js that the app loaded itself is still tried rather than refused.
        const create = (_a = stripe.initEmbeddedCheckout) !== null && _a !== void 0 ? _a : stripe.createEmbeddedCheckoutPage;
        if (typeof create !== "function") {
            throw new Error("Stripe.js doesn't support Embedded Checkout");
        }
        activeStripeCheckout === null || activeStripeCheckout === void 0 ? void 0 : activeStripeCheckout.destroy();
        const checkout = await create.call(stripe, {
            fetchClientSecret: () => Promise.resolve(embedded.client_secret),
        });
        try {
            checkout.mount(element);
        }
        catch (error) {
            checkout.destroy();
            throw error;
        }
        let destroyed = false;
        const handle = {
            destroy() {
                if (destroyed)
                    return;
                destroyed = true;
                if (activeStripeCheckout === handle)
                    activeStripeCheckout = null;
                checkout.destroy();
            },
        };
        activeStripeCheckout = handle;
        return handle;
    });
    stripeQueue = mount.catch(() => undefined);
    return mount;
}
async function mountPayPal(element, scriptUrl, checkoutId, currency, embedded, options, deps) {
    var _a;
    const paypal = await loadGlobal(scriptUrl, () => browserGlobals().paypal, deps.loadScript);
    if (typeof paypal.createInstance !== "function") {
        throw new Error("Another PayPal JS SDK version is already loaded on this page. Remove it to use mountCheckout().");
    }
    const subscription = embedded.intent === "subscription";
    const sdk = await paypal.createInstance({
        clientId: embedded.client_id,
        merchantId: embedded.merchant_id,
        // Sent only when set, since the backend returns null when no attribution ID is configured.
        ...(embedded.partner_attribution_id
            ? { partnerAttributionId: embedded.partner_attribution_id }
            : {}),
        components: [subscription ? "paypal-subscriptions" : "paypal-payments"],
        pageType: "checkout",
    });
    const methods = await sdk.findEligibleMethods({
        currencyCode: currency.toUpperCase(),
        ...(subscription ? { paymentFlow: "RECURRING_PAYMENT" } : {}),
    });
    if (!methods.isEligible("paypal")) {
        throw new Error("PayPal isn't available for this checkout");
    }
    const createSession = subscription
        ? (_a = sdk.createPayPalSubscriptionPaymentSession) !== null && _a !== void 0 ? _a : sdk.createPayPalSubscriptionSession
        : sdk.createPayPalOneTimePaymentSession;
    if (typeof createSession !== "function") {
        throw new Error("The loaded PayPal JS SDK can't create this checkout");
    }
    let destroyed = false;
    let completing = false;
    // App callbacks run only while mounted, and their own errors never reach PayPal or onError.
    const notify = (callback) => {
        if (destroyed)
            return;
        try {
            callback();
        }
        catch (error) {
            console.error("[Base44 SDK] A mountCheckout() callback threw", error);
        }
    };
    const button = document.createElement("paypal-button");
    const session = createSession.call(sdk, {
        // Errors are reported here, not rethrown, so PayPal doesn't report them a second time.
        async onApprove() {
            completing = true;
            button.disabled = true;
            let result;
            try {
                // Runs even after destroy(), so an approved payment is still captured.
                result = await deps.completeCheckout(checkoutId);
            }
            catch (error) {
                // Re-enabled only on failure, since a paid order can't be approved again.
                completing = false;
                button.disabled = false;
                notify(() => { var _a; return (_a = options.onError) === null || _a === void 0 ? void 0 : _a.call(options, error); });
                return;
            }
            completing = false;
            notify(() => { var _a; return (_a = options.onComplete) === null || _a === void 0 ? void 0 : _a.call(options, result); });
        },
        onCancel() {
            notify(() => { var _a; return (_a = options.onCancel) === null || _a === void 0 ? void 0 : _a.call(options); });
        },
        onError(error) {
            notify(() => { var _a; return (_a = options.onError) === null || _a === void 0 ? void 0 : _a.call(options, error); });
        },
    });
    button.setAttribute("type", subscription ? "subscribe" : "pay");
    const onClick = () => {
        if (completing)
            return;
        // Not awaited before start(), which must run inside the click to open PayPal's popup.
        const id = Promise.resolve(subscription ? { subscriptionId: checkoutId } : { orderId: checkoutId });
        const report = (error) => notify(() => { var _a; return (_a = options.onError) === null || _a === void 0 ? void 0 : _a.call(options, error); });
        try {
            Promise.resolve(session.start({ presentationMode: "auto" }, id)).catch(report);
        }
        catch (error) {
            report(error);
        }
    };
    button.addEventListener("click", onClick);
    element.appendChild(button);
    return {
        destroy() {
            var _a;
            if (destroyed)
                return;
            destroyed = true;
            button.removeEventListener("click", onClick);
            button.remove();
            (_a = session.destroy) === null || _a === void 0 ? void 0 : _a.call(session);
        },
    };
}
/**
 * Mounts the embedded checkout that createCheckout() returned.
 * @internal
 */
export async function mountCheckout(element, checkout, options, deps) {
    if (typeof window === "undefined" || typeof document === "undefined") {
        throw new Error("mountCheckout() requires a browser environment");
    }
    if (!element) {
        throw new Error("mountCheckout() requires an element to render in");
    }
    const embedded = checkout === null || checkout === void 0 ? void 0 : checkout.embedded;
    if (!embedded) {
        throw new Error("This checkout isn't embedded. Create it with presentation: 'embedded', or send the buyer to its redirect_url.");
    }
    switch (embedded.provider) {
        case "stripe":
            return mountStripe(element, await scriptUrlFor("stripe", deps), embedded, deps);
        case "paypal":
            return mountPayPal(element, await scriptUrlFor("paypal", deps), checkout.checkout_id, checkout.currency, embedded, options, deps);
        default:
            throw new Error(`Embedded checkout isn't supported for provider ${embedded.provider}`);
    }
}
