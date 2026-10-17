import type { CheckoutElement, CheckoutMount, CompleteCheckoutResult, MountableCheckout, MountCheckoutOptions } from "./payments.types.js";
/** @internal */
export type LoadScript = (src: string) => Promise<void>;
/**
 * The response of `GET /payments/config`.
 * @internal
 */
export interface PaymentsCheckoutConfig {
    paypal?: {
        script_url?: string;
    };
    stripe?: {
        script_url?: string;
    };
}
/** @internal */
export interface MountCheckoutDeps {
    completeCheckout: (checkoutId: string) => Promise<CompleteCheckoutResult>;
    getConfig: () => Promise<PaymentsCheckoutConfig>;
    loadScript: LoadScript;
}
/**
 * Appends a script tag once per URL and resolves when it loads.
 * @internal
 */
export declare const loadScript: LoadScript;
/**
 * Mounts the embedded checkout that createCheckout() returned.
 * @internal
 */
export declare function mountCheckout(element: CheckoutElement, checkout: MountableCheckout, options: MountCheckoutOptions, deps: MountCheckoutDeps): Promise<CheckoutMount>;
