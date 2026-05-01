import { useEffect, useRef } from 'react';

/**
 * IdleWhispers — every 45–90s of orb stillness, surfaces a low-volume
 * geological factoid. Uses speak() from parent. Resets timer on any
 * activity (active/speaking/listening).
 */
const WHISPERS = [
  "Quartz is one of the most abundant minerals on Earth's crust.",
  "Amethyst gets its purple from trace iron and natural radiation.",
  "Most meteorites you can hold are billions of years older than Earth.",
  "Pyrite forms cubes because of its isometric crystal lattice.",
  "Tourmaline can become electrically charged when heated — pyroelectricity.",
  "Opals contain up to 20 percent water trapped in silica spheres.",
  "Fluorite glows under UV light. The word 'fluorescence' comes from it.",
  "Jasper takes its color from iron impurities — that's why no two are alike.",
  "Geodes form when gas bubbles in volcanic rock fill with mineral water.",
  "Diamonds are the only common mineral made of a single element: carbon.",
];

export default function IdleWhispers({ enabled, isOrbBusy, speak }) {
  const lastActivityRef = useRef(Date.now());
  const busyRef = useRef(isOrbBusy);
  const speakRef = useRef(speak);
  busyRef.current = isOrbBusy;
  speakRef.current = speak;

  // Reset the idle timer whenever activity happens (start OR end)
  useEffect(() => {
    lastActivityRef.current = Date.now();
  }, [isOrbBusy]);

  useEffect(() => {
    if (!enabled) return;
    const id = setInterval(() => {
      if (busyRef.current) return;
      const idleFor = Date.now() - lastActivityRef.current;
      if (idleFor > 45000 + Math.random() * 45000) {
        const w = WHISPERS[Math.floor(Math.random() * WHISPERS.length)];
        speakRef.current?.(w);
        lastActivityRef.current = Date.now();
      }
    }, 5000);
    return () => clearInterval(id);
  }, [enabled]);

  return null;
}