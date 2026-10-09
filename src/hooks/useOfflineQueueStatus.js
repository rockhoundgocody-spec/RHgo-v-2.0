import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { belongsToUser, loadQueue } from '@/lib/offlineQueue';

export default function useOfflineQueueStatus() {
  const { user } = useAuth();
  const [state, setState] = useState({ items: [], error: '' });
  const refresh = useCallback(async () => {
    if (!user?.id) { setState({ items: [], error: '' }); return; }
    try {
      const items = await loadQueue();
      setState({ items: items.filter(item => belongsToUser(item, user)), error: '' });
    } catch (error) { setState({ items: [], error: error.message }); }
  }, [user?.id, user?.email]);
  useEffect(() => {
    refresh();
    window.addEventListener('rhgo-offline-queue-change', refresh);
    window.addEventListener('storage', refresh);
    return () => {
      window.removeEventListener('rhgo-offline-queue-change', refresh);
      window.removeEventListener('storage', refresh);
    };
  }, [refresh]);
  return { ...state, items: state.items.filter(item => belongsToUser(item, user)), refresh };
}