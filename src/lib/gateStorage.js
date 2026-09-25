/** First-visit gate localStorage keys — keep Login reachable. */

export const GATE_CHOICE_KEY = 'rhgo_gate_choice';
export const GATE_NAME_KEY = 'rhgo_user_name';
export const GATE_INTRO_KEY = 'rhgo_intro_seen';
export const GATE_BUFFER_KEY = 'rhgo_buffer_seen';
export const GATE_SESSION_REDIRECT_KEY = 'rhgo_gate_session_redirect';

export function clearGateChoice() {
  try {
    localStorage.removeItem(GATE_CHOICE_KEY);
    sessionStorage.removeItem(GATE_SESSION_REDIRECT_KEY);
  } catch {
    /* private mode */
  }
}

export function resetGateFlow() {
  try {
    localStorage.removeItem(GATE_CHOICE_KEY);
    localStorage.removeItem(GATE_INTRO_KEY);
    localStorage.removeItem(GATE_BUFFER_KEY);
    sessionStorage.removeItem(GATE_SESSION_REDIRECT_KEY);
  } catch {
    /* private mode */
  }
}

export function readGateChoice() {
  try {
    return localStorage.getItem(GATE_CHOICE_KEY);
  } catch {
    return null;
  }
}
