import { AxiosInstance } from "axios";
import { PaymentsModule, ServiceRolePaymentsModule } from "./payments.types.js";
/**
 * Creates the payments module for anonymous and user authentication.
 *
 * @param axios - Axios instance
 * @param appId - Application ID
 * @returns Payments module for the browser
 * @internal
 */
export declare function createPaymentsModule(axios: AxiosInstance, appId: string): PaymentsModule;
/**
 * Creates the payments module for service role authentication.
 *
 * @param axios - Axios instance (should be service role client)
 * @param appId - Application ID
 * @returns Payments module for backend functions
 * @internal
 */
export declare function createServiceRolePaymentsModule(axios: AxiosInstance, appId: string): ServiceRolePaymentsModule;
