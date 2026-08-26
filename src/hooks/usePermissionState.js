import { useEffect, useState } from 'react';

export function usePermissionState(name) {
  const [state, setState] = useState('prompt');

  useEffect(() => {
    const permissions = globalThis.navigator?.permissions;
    if (typeof permissions?.query !== 'function') return undefined;

    let permissionStatus;
    let disposed = false;
    const handleChange = () => setState(permissionStatus.state);

    permissions.query({ name }).then((status) => {
      if (disposed) return;
      permissionStatus = status;
      setState(status.state);
      status.addEventListener?.('change', handleChange);
    }).catch(() => {});

    return () => {
      disposed = true;
      permissionStatus?.removeEventListener?.('change', handleChange);
    };
  }, [name]);

  return state;
}
