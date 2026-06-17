/**
 * PermissionsPrompt — requests push notifications, location, and PWA update in one card.
 * Dismisses permanently via localStorage once all are granted or skipped.
 */
import React, { useEffect, useState } from 'react';
import { Bell, MapPin, RefreshCw, CheckCircle2, X } from 'lucide-react';

function usePermissionState(name) {
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

export default function PermissionsPrompt({ onDismiss }) {
  const notifPerm = usePermissionState('notifications');
  const locationPerm = usePermissionState('geolocation');
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [requesting, setRequesting] = useState({});

  // Check for SW update
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then((reg) => {
        if (reg?.waiting) setUpdateAvailable(true);
        if (reg) reg.addEventListener('updatefound', () => {
          reg.installing?.addEventListener('statechange', (e) => {
            if (e.target.state === 'installed' && navigator.serviceWorker.controller) setUpdateAvailable(true);
          });
        });
      }).catch(() => {});
    }
  }, []);

  const requestNotifications = async () => {
    setRequesting((r) => ({ ...r, notif: true }));
    await Notification.requestPermission().catch(() => {});
    setRequesting((r) => ({ ...r, notif: false }));
  };

  const requestLocation = async () => {
    setRequesting((r) => ({ ...r, loc: true }));
    await new Promise((res) => navigator.geolocation?.getCurrentPosition(res, res, { timeout: 8000 }));
    setRequesting((r) => ({ ...r, loc: false }));
  };

  const applyUpdate = () => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then((reg) => {
        reg?.waiting?.postMessage({ type: 'SKIP_WAITING' });
        window.location.reload();
      });
    }
  };

  const items = [
    {
      key: 'notif',
      icon: Bell,
      label: 'Push Notifications',
      desc: 'Hotspot alerts, storm windows, quest reminders',
      granted: notifPerm === 'granted',
      denied: notifPerm === 'denied',
      onRequest: requestNotifications,
    },
    {
      key: 'loc',
      icon: MapPin,
      label: 'Location Access',
      desc: 'Find nearby hotspots, tag your finds, storm alerts',
      granted: locationPerm === 'granted',
      denied: locationPerm === 'denied',
      onRequest: requestLocation,
    },
    ...(updateAvailable ? [{
      key: 'update',
      icon: RefreshCw,
      label: 'App Update Ready',
      desc: 'A new version is available — tap to reload',
      granted: false,
      denied: false,
      onRequest: applyUpdate,
      isUpdate: true,
    }] : []),
  ];

  const allDone = items.every((i) => i.granted || i.denied);

  if (allDone && !updateAvailable) return null;

  return (
    <div
      className="rounded-2xl px-4 py-4 mb-6"
      style={{
        background: 'linear-gradient(135deg, hsla(265,50%,12%,0.95), hsla(240,35%,8%,0.98))',
        border: '1px solid hsla(280,60%,55%,0.35)',
        boxShadow: '0 4px 24px hsla(265,80%,20%,0.35)',
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-amethyst-glow">
          Enable Features
        </span>
        {onDismiss && (
          <button onClick={onDismiss} className="text-white/25 hover:text-white/60 transition">
            <X size={14} />
          </button>
        )}
      </div>

      <div className="space-y-3">
        {items.map((item) => {
          const Icon = item.icon;
          const loading = requesting[item.key];
          return (
            <div key={item.key} className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{
                  background: item.granted
                    ? 'hsla(150,70%,30%,0.2)'
                    : item.isUpdate
                    ? 'hsla(38,90%,40%,0.2)'
                    : 'hsla(265,50%,25%,0.3)',
                  border: item.granted
                    ? '1px solid hsla(150,70%,50%,0.35)'
                    : item.isUpdate
                    ? '1px solid hsla(38,90%,55%,0.4)'
                    : '1px solid hsla(280,60%,55%,0.25)',
                }}
              >
                {item.granted
                  ? <CheckCircle2 size={16} className="text-emerald-400" />
                  : <Icon size={16} style={{ color: item.isUpdate ? '#fbbf24' : 'hsl(280,85%,82%)' }} />
                }
              </div>

              <div className="flex-1 min-w-0">
                <div className="text-white text-[12px] font-semibold leading-tight">{item.label}</div>
                <div className="text-white/40 text-[10px] leading-snug">{item.desc}</div>
              </div>

              {!item.granted && (
                <button
                  onClick={item.onRequest}
                  disabled={loading || item.denied}
                  className="flex-shrink-0 px-3 py-1.5 rounded-xl text-[11px] font-bold transition active:scale-95 disabled:opacity-40"
                  style={{
                    background: item.isUpdate
                      ? 'hsla(38,90%,40%,0.25)'
                      : 'hsla(280,60%,35%,0.35)',
                    border: item.isUpdate
                      ? '1px solid hsla(38,90%,55%,0.4)'
                      : '1px solid hsla(280,60%,55%,0.35)',
                    color: item.isUpdate ? '#fbbf24' : 'hsl(280,100%,88%)',
                  }}
                >
                  {loading ? '…' : item.denied ? 'Blocked' : item.isUpdate ? 'Update' : 'Allow'}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}