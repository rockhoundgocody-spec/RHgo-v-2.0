import React, { useEffect, useRef, useState } from 'react';
import HudFrame from '@/components/visuals/HudFrame.jsx';
import GlassPanel from '@/components/visuals/GlassPanel.jsx';

export default function StreetViewPanel({ lat, lng, name }) {
  const ref = useRef(null);
  const pano = useRef(null);
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    if (!window.google?.maps || !ref.current) return;
    setUnavailable(false);
    const google = window.google;
    const svService = new google.maps.StreetViewService();
    svService.getPanorama(
      { location: { lat, lng }, radius: 50000, source: google.maps.StreetViewSource.OUTDOOR },
      (result, status) => {
        if (status !== 'OK' || !ref.current) {
          setUnavailable(true);
          return;
        }
        if (!pano.current) {
          pano.current = new google.maps.StreetViewPanorama(ref.current, {
            pano: result.location.pano,
            pov: { heading: 0, pitch: 0 },
            zoom: 0.5,
            disableDefaultUI: true,
            showRoadLabels: false,
            motionTracking: false,
          });
        } else {
          pano.current.setPano(result.location.pano);
        }
      }
    );
  }, [lat, lng]);

  return (
    <GlassPanel variant="hud">
      <HudFrame label={`Street View · ${name || ''}`}>
        <div className="relative h-64 rounded-md overflow-hidden border border-hud-cyan/20 bg-black/40">
          <div ref={ref} className="absolute inset-0" />
          {unavailable && (
            <div className="absolute inset-0 flex items-center justify-center text-hud-cyan/60 text-xs uppercase tracking-[0.3em]">
              No street view nearby
            </div>
          )}
        </div>
      </HudFrame>
    </GlassPanel>
  );
}