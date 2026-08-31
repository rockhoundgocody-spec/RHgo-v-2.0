import { useState, useEffect, useCallback, useRef } from 'react';
import { generateSpawns } from './spawnEngine';
import { base44 } from '@/api/base44Client';

const DAILY_CAP = 25;
const MOVEMENT_TRIGGER_M = 150;
const REFRESH_MS = 30 * 60 * 1000;

function haversineM(a, b) {
  const R = 6371000;
  const dLat = (b.lat - a.lat) * Math.PI / 180;
  const dLng = (b.lng - a.lng) * Math.PI / 180;
  const x = Math.sin(dLat / 2) ** 2 +
    Math.cos(a.lat * Math.PI / 180) * Math.cos(b.lat * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}

export default function useSpawns({ userLocation, hotspots = [] }) {
  const [spawns, setSpawns] = useState([]);
  const [caughtToday, setCaughtToday] = useState(() => {
    const stored = localStorage.getItem('rhgo_caught_today');
    if (!stored) return 0;
    const { date, count } = JSON.parse(stored);
    return date === new Date().toISOString().slice(0, 10) ? count : 0;
  });
  const lastLocationRef = useRef(null);
  const collectedRef = useRef(new Set());

  // Load user's collected minerals for dupe-awareness
  // Performance optimization: pass fields projection array to fetch only mineral_name & id
  useEffect(() => {
    base44.entities.Specimen.list('-created_date', 500, 0, ['id', 'mineral_name'])
      .then(s => {
        collectedRef.current = new Set((s || []).map(x => (x.mineral_name || '').toLowerCase()));
      })
      .catch(() => {});
  }, []);

  const refresh = useCallback((loc, force = false) => {
    if (!loc) return;
    if (!force && lastLocationRef.current) {
      const moved = haversineM(lastLocationRef.current, loc);
      if (moved < MOVEMENT_TRIGGER_M) return;
    }
    lastLocationRef.current = loc;

    const nearHotspot = hotspots.some(h =>
      h.lat && h.lng && haversineM(loc, h) < 500
    );

    const next = generateSpawns(loc.lat, loc.lng, {
      count: 6,
      collectedMinerals: collectedRef.current,
      nearHotspot,
    });
    setSpawns(next);
  }, [hotspots]);

  // Auto-refresh every 30 min
  useEffect(() => {
    if (!userLocation) return;
    refresh(userLocation, true);
    const interval = setInterval(() => refresh(userLocation, true), REFRESH_MS);
    return () => clearInterval(interval);
  }, [userLocation, refresh]);

  // Movement-triggered refresh
  useEffect(() => {
    if (!userLocation) return;
    refresh(userLocation);
  }, [userLocation, refresh]);

  const catchSpawn = useCallback((spawnId) => {
    if (caughtToday >= DAILY_CAP) return false;
    setSpawns(prev => prev.filter(s => s.id !== spawnId));
    const today = new Date().toISOString().slice(0, 10);
    const next = caughtToday + 1;
    setCaughtToday(next);
    localStorage.setItem('rhgo_caught_today', JSON.stringify({ date: today, count: next }));
    return true;
  }, [caughtToday]);

  const dismissSpawn = useCallback((spawnId) => {
    setSpawns(prev => prev.filter(s => s.id !== spawnId));
  }, []);

  return { spawns, caughtToday, dailyCap: DAILY_CAP, catchSpawn, dismissSpawn };
}