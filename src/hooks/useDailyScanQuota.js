import { useEffect, useState } from 'react';
import { getGuestQuota } from '@/lib/guestDevice';

const today = () => new Date().toISOString().slice(0, 10);

export default function useDailyScanQuota(user) {
  const [day, setDay] = useState(today);
  const [counts, setCounts] = useState({});
  const [guestQuota, setGuestQuota] = useState(getGuestQuota);
  const key = `rhgo_daily_scans_${user?.id || 'guest'}_${day}`;
  const scansUsed = counts[key] ?? Number(localStorage.getItem(key) || 0);
  const setScansUsed = (value) => {
    const currentKey = `rhgo_daily_scans_${user?.id || 'guest'}_${today()}`;
    setCounts((previous) => {
      const used = previous[currentKey] ?? Number(localStorage.getItem(currentKey) || 0);
      const next = typeof value === 'function' ? value(used) : value;
      localStorage.setItem(currentKey, String(next));
      return { ...previous, [currentKey]: next };
    });
  };
  useEffect(() => {
    const refresh = () => { setDay(today()); setCounts({}); setGuestQuota(getGuestQuota()); };
    const midnight = Date.parse(`${day}T00:00:00.000Z`) + 86400000;
    const timer = setTimeout(refresh, Math.max(1, midnight - Date.now()));
    window.addEventListener('focus', refresh);
    window.addEventListener('storage', refresh);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('focus', refresh);
      window.removeEventListener('storage', refresh);
    };
  }, [day]);
  return { scansUsed, setScansUsed, guestQuota, setGuestQuota };
}