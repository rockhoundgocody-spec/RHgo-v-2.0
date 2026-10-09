import React, { useState } from 'react';
import { Gem } from 'lucide-react';

export default function MineralArtwork() {
  const [failed, setFailed] = useState(false);
  return (
    <figure className="showcase-artwork" aria-label="Red beryl mineral illustration">
      <div className="showcase-orbit" aria-hidden="true" />
      {failed ? <div className="showcase-artwork-fallback"><Gem size={100} strokeWidth={0.7} aria-hidden="true" /><span>Every find holds a story.</span></div> :
        <img src="https://media.base44.com/images/public/69f35dd14650b54681c835ec/dbd543718_generated_image.png" alt="AI artwork of crimson Red beryl crystals on a frost-white matrix" width="1024" height="1280" fetchpriority="high" decoding="async" onError={() => setFailed(true)} />}
      <figcaption className="showcase-art-caption"><span>Red beryl</span><span>AI mineral artwork · not a scan result</span></figcaption>
    </figure>
  );
}