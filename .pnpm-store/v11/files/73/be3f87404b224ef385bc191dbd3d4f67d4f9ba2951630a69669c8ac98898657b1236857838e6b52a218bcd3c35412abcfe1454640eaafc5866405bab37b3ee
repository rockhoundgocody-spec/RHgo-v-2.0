import { loadScript, mountCheckout, } from "./payments-checkout.js";
function requireId(value, name) {
    if (!value || typeof value !== "string") {
        throw new Error(`${name} is required and must be a string`);
    }
    return encodeURIComponent(value);
}
function createPaymentsRequests(axios, appId) {
    const base = `/apps/${appId}/payments`;
    return {
        async completeCheckout(checkoutId) {
            const id = requireId(checkoutId, "Checkout ID");
            return axios.post(`${base}/checkout-sessions/${id}/complete`);
        },
        async listPurchases(params = {}) {
            return axios.get(`${base}/purchases`, { params });
        },
        async createCheckout(params) {
            return axios.post(`${base}/checkout-sessions`, params);
        },
        async refund(params) {
            return axios.post(`${base}/refunds`, params);
        },
        async cancelSubscription(subscriptionId, options = {}) {
            const id = requireId(subscriptionId, "Subscription ID");
            return axios.post(`${base}/subscriptions/${id}/cancel`, options);
        },
        async pauseSubscription(subscriptionId) {
            const id = requireId(subscriptionId, "Subscription ID");
            return axios.post(`${base}/subscriptions/${id}/pause`);
        },
        async resumeSubscription(subscriptionId) {
            const id = requireId(subscriptionId, "Subscription ID");
            return axios.post(`${base}/subscriptions/${id}/resume`);
        },
    };
}
/**
 * Creates the payments module for anonymous and user authentication.
 *
 * @param axios - Axios instance
 * @param appId - Application ID
 * @returns Payments module for the browser
 * @internal
 */
export function createPaymentsModule(axios, appId) {
    const requests = createPaymentsRequests(axios, appId);
    // One fetch per client, retried on the next mount if it fails.
    let config;
    const getConfig = () => {
        config !== null && config !== void 0 ? config : (config = axios.get(`/apps/${appId}/payments/config`).catch((error) => {
            config = undefined;
            throw error;
        }));
        return config;
    };
    return {
        completeCheckout: requests.completeCheckout,
        listPurchases: requests.listPurchases,
        mountCheckout(element, checkout, options = {}) {
            return mountCheckout(element, checkout, options, {
                completeCheckout: requests.completeCheckout,
                getConfig,
                loadScript,
            });
        },
    };
}
/**
 * Creates the payments module for service role authentication.
 *
 * @param axios - Axios instance (should be service role client)
 * @param appId - Application ID
 * @returns Payments module for backend functions
 * @internal
 */
export function createServiceRolePaymentsModule(axios, appId) {
    return createPaymentsRequests(axios, appId);
}
