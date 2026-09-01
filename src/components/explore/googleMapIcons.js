/**
 * googleMapIcons — SVG pin builders for the Google Maps hotspot map.
 * Each returns an HTML element usable as AdvancedMarkerElement content.
 */
export const LAND_COLORS = {
  public:         '#34d399',
  blm:            '#fbbf24',
  forest_service: '#a3e635',
  state_park:     '#38bdf8',
  private:        '#fb7185',
  unknown:        '#94a3b8',
};

const DIFF_BADGE = { easy: '●', moderate: '◆', hard: '▲', expert: '★' };

function toEl(svg) {
  const div = document.createElement('div');
  div.innerHTML = svg.trim();
  div.style.transform = 'translateY(50%)'; // advanced markers anchor bottom-center; recenter
  return div;
}

export function hotspotPinEl({ color, isActive, isGlowing, hasGap, difficulty, highContrast }) {
  const size  = highContrast ? (isActive ? 42 : 34) : (isActive ? 36 : 28);
  const badge = DIFF_BADGE[difficulty] || '●';
  const ring  = hasGap ? `<circle cx="22" cy="22" r="18" fill="none" stroke="#c084fc" stroke-width="2.5" stroke-dasharray="4 3" opacity="0.8"/>` : '';
  const pulse = isGlowing ? `
    <circle cx="22" cy="22" r="17" fill="none" stroke="${color}" stroke-width="1.5" opacity="0.4">
      <animate attributeName="r" values="14;20;14" dur="2s" repeatCount="indefinite"/>
      <animate attributeName="opacity" values="0.6;0;0.6" dur="2s" repeatCount="indefinite"/>
    </circle>` : '';
  const coreR = isActive ? 14 : highContrast ? 12 : 10;
  const halo  = highContrast ? `<circle cx="22" cy="22" r="${coreR + 4}" fill="#0a0f1e" opacity="0.85"/>` : '';
  return toEl(`
    <svg xmlns="http://www.w3.org/2000/svg" width="${size + 8}" height="${size + 8}" viewBox="0 0 44 44">
      ${pulse}${ring}${halo}
      <circle cx="22" cy="22" r="${coreR}" fill="${color}" opacity="${highContrast ? 1 : 0.92}"
        style="filter:drop-shadow(0 0 ${isActive ? 8 : 4}px ${highContrast ? '#0a0f1e' : color})"/>
      <circle cx="22" cy="22" r="${coreR}" fill="none" stroke="${highContrast ? '#ffffff' : 'rgba(255,255,255,0.6)'}" stroke-width="${highContrast ? 3 : isActive ? 2 : 1.5}"/>
      <text x="22" y="27" text-anchor="middle" font-size="${isActive ? 13 : highContrast ? 12 : 9}" fill="white" font-weight="bold">${badge}</text>
    </svg>`);
}

export function specimenPinEl(rarity, highContrast) {
  const color = rarity === 'legendary' ? '#f59e0b' : rarity === 'rare' ? '#a78bfa' : '#c084fc';
  const s = highContrast ? 24 : 18;
  return toEl(`
    <svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 18 18">
      <polygon points="9,2 16,7 13,15 5,15 2,7" fill="${color}" opacity="0.9"
        style="filter:drop-shadow(0 0 3px ${color})"/>
      <polygon points="9,2 16,7 13,15 5,15 2,7" fill="none" stroke="rgba(255,255,255,0.5)" stroke-width="1"/>
    </svg>`);
}

export function userPinEl(highContrast) {
  const s = highContrast ? 36 : 28;
  return toEl(`
    <svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 28 28">
      <circle cx="14" cy="14" r="12" fill="#22d3ee" opacity="0.2">
        <animate attributeName="r" values="10;16;10" dur="2.5s" repeatCount="indefinite"/>
        <animate attributeName="opacity" values="0.3;0;0.3" dur="2.5s" repeatCount="indefinite"/>
      </circle>
      <circle cx="14" cy="14" r="7" fill="#22d3ee" opacity="0.95" style="filter:drop-shadow(0 0 6px #22d3ee)"/>
      <circle cx="14" cy="14" r="7" fill="none" stroke="white" stroke-width="2"/>
      <circle cx="14" cy="14" r="2.5" fill="white"/>
    </svg>`);
}

export function clubPinEl() {
  return toEl(`
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
      <rect x="8" y="10" width="16" height="14" rx="2" fill="#14b8a6" opacity="0.95"
        style="filter:drop-shadow(0 0 5px #14b8a6)"/>
      <rect x="8" y="10" width="16" height="14" rx="2" fill="none" stroke="white" stroke-width="1.5"/>
      <rect x="12" y="6" width="8" height="5" rx="1" fill="#14b8a6" opacity="0.9"/>
      <circle cx="16" cy="17" r="2.5" fill="white" opacity="0.8"/>
    </svg>`);
}