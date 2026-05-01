import { useEffect, useState } from 'react';

/**
 * useLunarSolar — returns { phase: 0..1, illumination: 0..1, isNight, sunAlt: 0..1 }
 * Pure astronomical math, no API. Uses device geolocation when available
 * for sun altitude; otherwise approximates from time-of-day.
 */
export default function useLunarSolar() {
  const [data, setData] = useState({ phase: 0.5, illumination: 0.5, isNight: false, sunAlt: 0.5 });

  useEffect(() => {
    const compute = (lat = 35, lng = -98) => {
      const now = new Date();
      // moon phase — synodic month = 29.5306 days
      const knownNewMoon = new Date('2000-01-06T18:14:00Z').getTime();
      const synodic = 29.530588853 * 86400000;
      const phase = ((now.getTime() - knownNewMoon) % synodic) / synodic; // 0..1
      const illumination = (1 - Math.cos(phase * Math.PI * 2)) / 2;

      // simple sun altitude — peaks at solar noon for this longitude
      const utcHours = now.getUTCHours() + now.getUTCMinutes() / 60;
      const localHours = (utcHours + lng / 15 + 24) % 24;
      // alt: 0 at 6am/6pm, 1 at noon, negative at night
      const altRaw = Math.sin(((localHours - 6) / 12) * Math.PI);
      const sunAlt = Math.max(0, altRaw);
      const isNight = altRaw < -0.1;

      setData({ phase, illumination, isNight, sunAlt });
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (p) => compute(p.coords.latitude, p.coords.longitude),
        () => compute(),
        { timeout: 4000, maximumAge: 600000 }
      );
    } else {
      compute();
    }
    const interval = setInterval(() => compute(), 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return data;
}