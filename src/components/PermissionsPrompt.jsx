/**
 * PermissionsPrompt — requests push notifications, location, and PWA update in one card.
 * Dismisses permanently via localStorage once all are granted or skipped.
 */
import React, { useState } from 'react';
import { Bell, MapPin, RefreshCw, X } from 'lucide-react';
import { usePermissionState } from '../hooks/usePermissionState';
import { useServiceWorkerUpdate } from '../hooks/useServiceWorkerUpdate';
import PermissionItem from './PermissionItem';

export default function PermissionsPrompt({ onDismiss = undefined }) {
  const notifPerm = usePermissionState('notifications');
  const locationPerm = usePermissionState('geolocation');
  const { updateAvailable, applyUpdate } = useServiceWorkerUpdate();
  const [requesting, setRequesting] = useState({});

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
        {items.map((item) => (
          <PermissionItem
            key={item.key}
            item={item}
            loading={requesting[item.key]}
          />
        ))}
      </div>
    </div>
  );
}
