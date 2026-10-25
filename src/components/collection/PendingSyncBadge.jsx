import React, { useEffect, useState, useCallback } from 'react';
import { CloudOff, AlertTriangle } from 'lucide-react';
import { loadQueue } from '@/lib/offlineQueue';

/** Shows when this specimen has offline edits waiting to sync (or in conflict). */
export default function PendingSyncBadge({ specimenId }) {
  const [state, setState] = useState(null);

  const refresh = useCallback(async () => {
    const queue = await loadQueue().catch(() => []);
    const mine = queue.filter((item) => item.id === specimenId);
    if (!mine.length) return setState(null);
    const conflict = mine.some((i) => i.conflict || /Changed on another device/i.test(i.lastError || ''));
    setState({ count: mine.length, conflict });
  }, [specimenId]);

  useEffect(() => {
    refresh();
    const events = ['rhgo:offline-queue-changed', 'storage', 'online', 'offline'];
    events.forEach((e) => window.addEventListener(e, refresh));
    return () => events.forEach((e) => window.removeEventListener(e, refresh));
  }, [refresh]);

  if (!state) return null;
  const color = state.conflict ? '#fbbf24' : '#9FE8D0';
  const Icon = state.conflict ? AlertTriangle : CloudOff;
  const label = state.conflict
    ? 'Sync conflict — review in Collection'
    : `${state.count} edit${state.count > 1 ? 's' : ''} pending sync`;

  return (
    <div role="status"
      className="inline-flex items-center gap-1.5 mt-2 px-2.5 py-1 rounded-full text-[11px] font-semibold"
      style={{ background: `${color}18`, border: `1px solid ${color}55`, color }}>
      <Icon size={12} aria-hidden="true" />
      {label}
    </div>
  );
}