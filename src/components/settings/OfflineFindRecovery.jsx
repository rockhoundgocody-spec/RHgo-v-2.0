import React, { useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import useOfflineQueueStatus from '@/hooks/useOfflineQueueStatus';
import { flushQueue } from '@/lib/offlineQueue';
import GlassPanel from '@/components/visuals/GlassPanel.jsx';

export default function OfflineFindRecovery() {
  const { user } = useAuth();
  const { items, error, refresh } = useOfflineQueueStatus();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const retry = async () => {
    setBusy(true);
    try {
      const result = await flushQueue({ retryBlocked: true });
      setMessage(result.flushed ? `${result.flushed} finds synced.` : 'No finds synced yet. They remain on this device.');
      await refresh();
    } catch (error) { setMessage(error.message); }
    finally { setBusy(false); }
  };
  const backup = () => {
    const url = URL.createObjectURL(new Blob([JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), finds: items }, null, 2)], { type: 'application/json' }));
    const link = document.createElement('a');
    link.href = url; link.download = 'rockhound-go-unsynced-finds.json'; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setMessage('Backup downloaded. It contains private locations; keep it secure.');
  };
  if (!user || (!items.length && !error && !message)) return null;
  const paused = items.filter(item => item.blocked).length;
  return <GlassPanel className="p-4 mb-6 text-foreground" data-offline-recovery>
    <h2 className="font-bold">Unsynced field finds</h2>
    <p className="text-sm text-muted-foreground mt-2">{items.length} saved on this device{paused ? `; ${paused} need attention` : ''}. Do not clear browser data before syncing or making a backup.</p>
    {error && <p role="alert" className="text-destructive text-sm mt-2">{error}</p>}
    <div className="flex flex-wrap gap-2 mt-3">
      <button type="button" onClick={retry} disabled={busy || !!error || !items.length} className="bg-primary text-primary-foreground rounded-lg px-4 min-h-11 font-semibold disabled:opacity-50">{busy ? 'Syncing…' : 'Retry sync'}</button>
      <button type="button" onClick={backup} disabled={!items.length} className="bg-secondary text-secondary-foreground rounded-lg px-4 min-h-11 font-semibold disabled:opacity-50">Download backup</button>
    </div>
    <p role="status" className="text-sm text-muted-foreground mt-2">{message}</p>
  </GlassPanel>;
}