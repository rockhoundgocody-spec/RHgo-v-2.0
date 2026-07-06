import { useState, useEffect } from 'react';

export function usePermissionState(name) {
  const [state, setState] = useState('prompt');

  useEffect(() => {
    if (!navigator.permissions) return;

    navigator.permissions.query({ name }).then((s) => {
      setState(s.state);
      s.onchange = () => setState(s.state);
    }).catch(() => {});
  }, [name]);

  return state;
}
