import React, { useState } from 'react';
import { Share2, Check } from 'lucide-react';

/**
 * Share a specimen via the native Web Share API on mobile, falling back to
 * clipboard copy on desktop. Builds a friendly text payload — coordinates
 * are intentionally omitted (privacy) and only the fuzzed `found_at` label
 * is shared if present.
 */
export default function ShareSpecimenButton({ specimen, className = '' }) {
  const [copied, setCopied] = useState(false);

  const handleShare = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    const rarityTag = specimen.rarity && specimen.rarity !== 'common'
      ? ` (${specimen.rarity.toUpperCase()})`
      : '';
    const where = specimen.found_at ? ` near ${specimen.found_at}` : '';
    const text = `Found ${specimen.mineral_name}${rarityTag}${where} — logged with RockHound-GO 💎`;
    const shareData = { title: 'My RockHound find', text, url: window.location.origin };

    if (navigator.share && navigator.canShare?.(shareData)) {
      try {
        await navigator.share(shareData);
        return;
      } catch {
        // user dismissed — fall through to copy
      }
    }
    try {
      await navigator.clipboard.writeText(`${text} ${shareData.url}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // clipboard blocked — silent fail
    }
  };

  return (
    <button
      type="button"
      onClick={handleShare}
      aria-label="Share specimen"
      className={`inline-flex items-center justify-center gap-1.5 min-h-[36px] min-w-[36px] px-2.5 rounded-lg border border-amethyst/30 bg-amethyst/10 hover:bg-amethyst/20 text-amethyst-glow text-[10px] uppercase tracking-wider transition ${className}`}
    >
      {copied ? <Check size={12} /> : <Share2 size={12} />}
      <span>{copied ? 'Copied' : 'Share'}</span>
    </button>
  );
}