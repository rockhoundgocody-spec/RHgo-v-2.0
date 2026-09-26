import React, { createContext, useState, useContext, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { appParams } from '@/lib/app-params';
// (toast import removed — auth-persistence fix no longer toasts on timeout)

// If the session check hasn't settled by then, stop blocking the app and
// continue as logged-out. A late result still applies when it arrives.
const AUTH_CHECK_TIMEOUT_MS = 20000;

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [appPublicSettings, setAppPublicSettings] = useState(null); // Contains only { id, public_settings }

  useEffect(() => {
    checkAppState();
  }, []);

  const checkAppState = async () => {
    try {
      setIsLoadingPublicSettings(true);
      setAuthError(null);

      try {
        // Public settings don't depend on the session check — never let a slow
        // or hung auth call keep this flag (and the boot spinner) stuck.
        setAppPublicSettings({ id: appParams.appId });
        setIsLoadingPublicSettings(false);
        // Always try me() — the SDK's internal token (set by loginViaEmailPassword)
        // may be valid even if appParams.token hasn't picked it up from storage yet.
        // If there's no token at all, me() throws and we handle it gracefully.
        await checkUserAuth();
        setAuthError(null);
      } catch (appError) {
        /* public app: failed bootstrap is handled via authError */
        const reason = appError?.data?.extra_data?.reason;
        if (reason === 'user_not_registered') {
          setAuthError({ type: 'user_not_registered', message: 'User not registered for this app' });
        } else if (reason === 'auth_required') {
          // Only hard-gate when the platform explicitly requires auth for the app.
          setAuthError({ type: 'auth_required', message: 'Authentication required' });
        } else {
          // Network / unknown: still allow public routes (login must stay reachable).
          setAuthError(null);
        }
        setIsLoadingPublicSettings(false);
        setIsLoadingAuth(false);
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      setAuthError({
        type: 'unknown',
        message: error.message || 'An unexpected error occurred'
      });
      setIsLoadingPublicSettings(false);
      setIsLoadingAuth(false);
    }
  };

  const checkUserAuth = async () => {
    setIsLoadingAuth(true);
    let settled = false;
    // Safety net only: if the session check truly never settles (hung network,
    // unreachable auth server), log a warning after the timeout — but do NOT
    // declare the user logged out. Declaring logged out here was the root cause
    // of the Login → Profile → Login bounce: a slow me() flipped the app to
    // logged-out, Layout redirected to /login, then me() resolved and sent the
    // user back — repeating on every reload. Keep the loading state so
    // protected routes never flash-redirect before the real session resolves.
    const timer = setTimeout(() => {
      if (settled) return;
      console.warn('[auth] Session check is taking longer than expected — still waiting, not bouncing.');
    }, AUTH_CHECK_TIMEOUT_MS);

    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
      setIsAuthenticated(true);
    } catch (error) {
      /* visitor is simply logged out */
      setUser(null);
      setIsAuthenticated(false);
      // A signed-in account that isn't registered for this app is the one
      // auth failure the user must see (UserNotRegisteredError screen).
      if (error?.data?.extra_data?.reason === 'user_not_registered') {
        setAuthError({ type: 'user_not_registered', message: 'User not registered for this app' });
      }
    } finally {
      settled = true;
      clearTimeout(timer);
      setAuthChecked(true);
      setIsLoadingAuth(false);
    }
  };

  const logout = (shouldRedirect = true) => {
    setUser(null);
    setIsAuthenticated(false);
    
    if (shouldRedirect) {
      // Use the SDK's logout method which handles token cleanup and redirect
      base44.auth.logout(window.location.href);
    } else {
      // Just remove the token without redirect
      base44.auth.logout();
    }
  };

  const navigateToLogin = () => {
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated, 
      isLoadingAuth,
      isLoadingPublicSettings,
      authError,
      appPublicSettings,
      authChecked,
      logout,
      navigateToLogin,
      checkUserAuth,
      checkAppState
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};