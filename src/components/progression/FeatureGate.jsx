import React, { useEffect, useRef, useState } from 'react';
import UnlockTeaser from '@/components/progression/UnlockTeaser.jsx';
import { featureForPath } from '@/lib/featureProgression';
import { useFeatureProgression } from '@/lib/useFeatureProgression';

/**
 * Wraps authenticated page content. Locked wings render a teaser.
 * First visit to an unlocked wing stamps a crawl (bragging right + small XP).
 */
export default function FeatureGate({ pathname, children }) {
  const { level, xp, markCrawled, crawled } = useFeatureProgression();
  const feature = featureForPath(pathname);
  const [justCrawled, setJustCrawled] = useState(null);
  const stamped = useRef(null);

  useEffect(() => {
    if (!feature || feature.core) return;
    if (level < feature.minLevel) return;
    if (crawled.includes(feature.id)) return;
    if (stamped.current === feature.id) return;
    stamped.current = feature.id;
    markCrawled(feature.id).then((fresh) => {
      if (fresh) setJustCrawled(feature);
    });
  }, [feature, level, crawled, markCrawled]);

  if (feature && level < feature.minLevel) {
    return <UnlockTeaser feature={feature} xp={xp} />;
  }

  return (
    <>
      {children}
      {justCrawled && (
        <button
          type="button"
          onClick={() => setJustCrawled(null)}
          className="fixed left-1/2 z-[80] -translate-x-1/2 px-4 py-2.5 rounded-full text-[11px] text-white"
          style={{
            bottom: 'calc(92px + env(safe-area-inset-bottom, 0px))',
            background: 'hsla(160,50%,14%,0.95)',
            border: '1px solid hsla(160,60%,45%,0.45)',
            boxShadow: '0 8px 32px hsla(160,60%,10%,0.5)',
          }}
        >
          First footing · {justCrawled.label}. {justCrawled.brag}
        </button>
      )}
    </>
  );
}
