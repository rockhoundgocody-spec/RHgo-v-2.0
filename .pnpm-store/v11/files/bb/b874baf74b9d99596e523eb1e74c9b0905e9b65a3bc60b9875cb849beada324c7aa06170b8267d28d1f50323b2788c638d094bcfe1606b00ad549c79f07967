/**
 * Creates the Browser module for the Base44 SDK.
 *
 * @param axios - Axios instance (should be service role client)
 * @returns Browser module with methods to create and end remote browser sessions
 * @internal
 */
export function createBrowserModule(axios) {
    const endSession = async (sessionId) => {
        if (!sessionId || typeof sessionId !== "string") {
            throw new Error("Session ID is required and must be a string");
        }
        await axios.delete(`/v1/browser-sessions/${encodeURIComponent(sessionId)}`);
    };
    return {
        async getSession(options = {}) {
            var _a;
            // The app is derived from the service token, so the route isn't app-scoped.
            const response = await axios.post("/v1/browser-sessions", {
                capture_debug_artifacts: (_a = options.captureDebugArtifacts) !== null && _a !== void 0 ? _a : true,
                // Omit when unset so the backend applies its configured default.
                ...(options.sessionTimeoutSeconds !== undefined && {
                    session_timeout_seconds: options.sessionTimeoutSeconds,
                }),
            });
            const data = response;
            return {
                sessionId: data.session_id,
                connectionUrl: data.connection_url,
                connectionScope: data.connection_scope,
                ...(data.connection_expires_at && {
                    connectionExpiresAt: data.connection_expires_at,
                }),
                ...(data.session_expires_at && {
                    sessionExpiresAt: data.session_expires_at,
                }),
                end: () => endSession(data.session_id),
            };
        },
        endSession,
    };
}
