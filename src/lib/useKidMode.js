import { useState, useEffect } from 'react';

// Reads the onboarding age-gate result ('kid' | 'pro'). Onboarding sets
// localStorage('rhgo_mode'); this hook lets the rest of the app actually
// consume it so the kid/pro flag is no longer decorative. Listens for
// cross-tab + same-tab changes so toggling during a session updates live.
export default function useKidMode() {
  const [isKid, setIsKid] = useState(
    () => typeof localStorage !== 'undefined' && localStorage.getItem('rhgo_mode') === 'kid'
  );

  useEffect(() => {
    const sync = () => setIsKid(localStorage.getItem('rhgo_mode') === 'kid');
    window.addEventListener('storage', sync);
    window.addEventListener('rhgo-mode-change', sync);
    return () => {
      window.removeEventListener('storage', sync);
      window.removeEventListener('rhgo-mode-change', sync);
    };
  }, []);

  return isKid;
}