import React, { useCallback, useEffect, useState } from 'react';
import { BellRing } from 'lucide-react';
import GlassPanel from '@/components/visuals/GlassPanel.jsx';
import SectionHeader from './SectionHeader.jsx';
import AlertCategoryToggle from './AlertCategoryToggle.jsx';
import {
  ALERT_CATEGORIES,
  disableAlerts,
  enableAlerts,
  loadAlertState,
  saveAlertCategories,
  sendTestAlert,
} from '@/lib/pushAlerts';

const DEFAULT_CATEGORIES = { community: true, missions: true, rewards: true };

const isIOS = typeof navigator !== 'undefined' && /iPhone|iPad|iPod/i.test(navigator.userAgent || '');

export default function PushAlertsSection() {
  const [state, setState] = useState({
    supported: true,
    permission: 'default',
    subscribed: false,
    categories: DEFAULT_CATEGORIES,
  });
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');

  const refresh = useCallback(async () => {
    setState(await loadAlertState());
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const toggleMaster = async () => {
    if (busy) return;
    setBusy(true);
    setNote('');
    try {
      if (state.subscribed) {
        await disableAlerts();
        setNote('Alerts are off on this device.');
      } else {
        const result = await enableAlerts(state.categories);
        if (result.ok) setNote('Alerts on. They will still reach you with the app closed.');
        else if (result.reason === 'denied') setNote('Your browser is blocking notifications for this site.');
        else if (result.reason === 'unsupported') setNote('This browser cannot show status-bar alerts.');
        else setNote('Could not turn alerts on for this device.');
      }
      await refresh();
    } finally {
      setBusy(false);
    }
  };

  const toggleCategory = async (key) => {
    const categories = { ...state.categories, [key]: !state.categories[key] };
    setState((previous) => ({ ...previous, categories }));
    if (state.subscribed) await saveAlertCategories(categories);
  };

  const test = async () => {
    if (busy) return;
    setBusy(true);
    setNote('');
    try {
      const result = await sendTestAlert();
      if (result.delivered) {
        setNote(`Test alert sent to ${result.delivered} device${result.delivered === 1 ? '' : 's'}.`);
      } else {
        setNote('No alert was delivered — check your browser notification settings.');
      }
    } catch {
      setNote('Could not send a test alert just now.');
    } finally {
      setBusy(false);
    }
  };

  const statusText = !state.supported
    ? (isIOS
      ? 'Open RockHound GO from your Home Screen to get alerts on iPhone.'
      : 'This browser cannot show status-bar alerts.')
    : state.subscribed
      ? 'On for this device.'
      : 'Off — nothing reaches you while the app is closed.';

  return (
    <div className="mb-6">
      <GlassPanel className="p-4">
        <SectionHeader
          icon={BellRing}
          iconColor="text-[#9FE8D0]"
          title="Status-bar alerts"
          subtitle="With the app closed, these land in your status bar instead of covering the field screen."
        />

        <div className="ml-9">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[11px] text-white/40 leading-relaxed">{statusText}</p>
            <button
              type="button"
              role="switch"
              aria-checked={state.subscribed}
              aria-label="Status-bar alerts on this device"
              disabled={!state.supported || busy}
              onClick={toggleMaster}
              className="relative w-11 h-6 rounded-full shrink-0 transition disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9FE8D0]/70"
              style={{ background: state.subscribed ? '#9FE8D0' : 'hsla(0,0%,100%,0.12)' }}
            >
              <span
                className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full transition-transform"
                style={{
                  background: state.subscribed ? '#0a0a14' : 'hsla(0,0%,100%,0.7)',
                  transform: state.subscribed ? 'translateX(20px)' : 'none',
                }}
              />
            </button>
          </div>

          <div className="mt-4 space-y-3">
            {ALERT_CATEGORIES.map((category) => (
              <AlertCategoryToggle
                key={category.key}
                label={category.label}
                hint={category.hint}
                enabled={state.categories[category.key] !== false}
                disabled={!state.supported}
                onToggle={() => toggleCategory(category.key)}
              />
            ))}
          </div>

          {state.subscribed && (
            <button
              type="button"
              onClick={test}
              disabled={busy}
              className="mt-4 w-full py-2.5 rounded-xl text-[12px] font-bold text-[#0a0a14] transition active:scale-[0.98] disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9FE8D0]/70"
              style={{ background: 'linear-gradient(135deg, #9FE8D0, #7dd3b8)' }}
            >
              Send a test alert
            </button>
          )}

          {note && <p className="text-[11px] text-[#9FE8D0] mt-2 leading-relaxed">{note}</p>}
        </div>
      </GlassPanel>
    </div>
  );
}