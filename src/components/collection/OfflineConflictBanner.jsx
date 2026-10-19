import React, { useEffect, useState, useCallback } from 'react';
import { AlertTriangle, CloudDownload, Smartphone, Loader2 } from 'lucide-react';
import { getQueuedConflicts, resolveQueuedConflict } from '@/lib/offlineQueue';
import { toast } from '@/components/ui/use-toast';

const FIELD_LABELS = {
  mineral_name: 'Mineral',
  common_name: 'Common name',
  notes: 'Field notes',
  found_at: 'Location',
  rarity: 'Rarity',
  verified: 'Verified',
  geo_privacy: 'Privacy',
  field_habit: 'Habit',
  field_luster: 'Luster',
  field_matrix: 'Matrix',
  field_next_test: 'Next test',
};

function formatVal(val) {
  if (val === undefined || val === null || val === '') return '—';
  if (typeof val === 'boolean') return val ? 'Yes' : 'No';
  return String(val);
}

export default function OfflineConflictBanner({ specimens = [], onResolved }) {
  const [conflicts, setConflicts] = useState([]);
  const [busyKey, setBusyKey] = useState(null);

  const refreshConflicts = useCallback(async () => {
    try {
      const list = await getQueuedConflicts();
      setConflicts(Array.isArray(list) ? list : []);
    } catch {
      setConflicts([]);
    }
  }, []);

  useEffect(() => {
    refreshConflicts();
    if (typeof window === 'undefined') return undefined;
    const handler = () => refreshConflicts();
    window.addEventListener('rhgo:offline-queue-changed', handler);
    window.addEventListener('storage', handler);
    window.addEventListener('online', handler);
    return () => {
      window.removeEventListener('rhgo:offline-queue-changed', handler);
      window.removeEventListener('storage', handler);
      window.removeEventListener('online', handler);
    };
  }, [refreshConflicts, specimens.length]);

  if (!conflicts.length) return null;

  const handleResolve = async (recordId, strategy) => {
    const actionKey = `${recordId}:${strategy}`;
    setBusyKey(actionKey);
    try {
      const res = await resolveQueuedConflict(recordId, strategy);
      if (res?.resolved) {
        await refreshConflicts();
        onResolved?.();
        toast({
          title: strategy === 'keep_local' ? 'Device edit applied' : 'Server version kept',
          description:
            strategy === 'keep_local'
              ? 'Your offline changes have been synced to your collection.'
              : 'The conflicting offline edit was discarded.',
        });
      }
    } catch (err) {
      toast({
        title: 'Could not resolve conflict',
        description: err?.message || 'Check your connection and try again.',
        variant: 'destructive',
      });
    } finally {
      setBusyKey(null);
    }
  };

  return (
    <section
      role="region"
      aria-label="Offline edit conflicts"
      className="mb-4 rounded-2xl p-4 space-y-3"
      style={{
        background: 'linear-gradient(145deg, hsla(38, 74%, 14%, 0.92) 0%, hsla(240, 24%, 9%, 0.96) 100%)',
        border: '1px solid hsl(var(--showcase-amber) / 0.45)',
        boxShadow: '0 12px 32px -10px hsla(38, 80%, 40%, 0.28), inset 0 1px 0 hsla(38, 90%, 80%, 0.16)',
      }}
    >
      <div className="flex items-start gap-3">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
          style={{
            background: 'hsl(var(--showcase-amber) / 0.16)',
            border: '1px solid hsl(var(--showcase-amber) / 0.4)',
            color: 'hsl(var(--showcase-amber))',
          }}
        >
          <AlertTriangle size={18} aria-hidden="true" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-bold text-white tracking-tight">
              {conflicts.length === 1
                ? '1 Offline Edit Collided'
                : `${conflicts.length} Offline Edits Collided`}
            </h2>
            <span
              className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full shrink-0"
              style={{
                background: 'hsl(var(--showcase-amber) / 0.16)',
                color: 'hsl(var(--showcase-amber))',
              }}
            >
              Needs Review
            </span>
          </div>
          <p className="text-xs text-white/70 mt-0.5 leading-relaxed">
            Changed on another device while you were offline. Choose which version to keep.
          </p>
        </div>
      </div>

      <div className="space-y-2.5">
        {conflicts.map((item) => {
          const remote = specimens.find((s) => s.id === item.id);
          const title =
            remote?.mineral_name ||
            item.data?.mineral_name ||
            item.baseSnapshot?.mineral_name ||
            `Specimen #${String(item.id || '').slice(-6)}`;
          const changedKeys = Object.keys(item.data || {});
          const busyLocal = busyKey === `${item.id}:keep_local`;
          const busyRemote = busyKey === `${item.id}:keep_remote`;
          const isBusy = busyLocal || busyRemote;

          return (
            <div
              key={`${item.id}-${item.queuedAt || 0}`}
              className="rounded-xl p-3 space-y-2.5"
              style={{
                background: 'hsla(240, 25%, 7%, 0.78)',
                border: '1px solid hsla(0, 0%, 100%, 0.1)',
              }}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-white truncate">{title}</span>
                <span className="text-[10px] text-white/45 font-mono shrink-0">
                  {changedKeys.length} {changedKeys.length === 1 ? 'field' : 'fields'}
                </span>
              </div>

              {changedKeys.length > 0 && (
                <div className="space-y-1.5 text-[11px]">
                  {changedKeys.slice(0, 4).map((key) => (
                    <div
                      key={key}
                      className="grid grid-cols-2 gap-2 rounded-lg px-2.5 py-1.5 bg-white/[0.03] border border-white/[0.06]"
                    >
                      <div className="min-w-0">
                        <div className="text-[9px] uppercase tracking-wider text-white/40">
                          {FIELD_LABELS[key] || key} · This Device
                        </div>
                        <div className="text-emerald-300 font-medium truncate">
                          {formatVal(item.data[key])}
                        </div>
                      </div>
                      <div className="min-w-0 border-l border-white/10 pl-2">
                        <div className="text-[9px] uppercase tracking-wider text-white/40">
                          Server Version
                        </div>
                        <div className="text-amber-200/90 font-medium truncate">
                          {remote ? formatVal(remote[key]) : 'Updated remotely'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 pt-0.5">
                <button
                  type="button"
                  disabled={isBusy}
                  onClick={() => handleResolve(item.id, 'keep_local')}
                  className="min-h-[44px] px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-95 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9FE8D0]"
                  style={{
                    background: '#9FE8D0',
                    color: '#0a0a14',
                  }}
                >
                  {busyLocal ? (
                    <Loader2 size={14} className="animate-spin" aria-hidden="true" />
                  ) : (
                    <Smartphone size={14} aria-hidden="true" />
                  )}
                  <span>Keep My Edit</span>
                </button>
                <button
                  type="button"
                  disabled={isBusy}
                  onClick={() => handleResolve(item.id, 'keep_remote')}
                  className="min-h-[44px] px-3 py-2 rounded-xl text-xs font-semibold text-white/85 flex items-center justify-center gap-1.5 transition hover:bg-white/10 active:scale-95 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
                  style={{
                    background: 'hsla(0, 0%, 100%, 0.06)',
                    border: '1px solid hsla(0, 0%, 100%, 0.16)',
                  }}
                >
                  {busyRemote ? (
                    <Loader2 size={14} className="animate-spin" aria-hidden="true" />
                  ) : (
                    <CloudDownload size={14} aria-hidden="true" />
                  )}
                  <span>Keep Server</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}