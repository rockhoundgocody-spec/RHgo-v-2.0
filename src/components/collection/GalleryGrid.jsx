import React, { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import GalleryItem from './GalleryItem.jsx';
import SpecimenLightbox from './SpecimenLightbox.jsx';

export default function GalleryGrid({ specimens }) {
  const [selected, setSelected] = useState(null);

  if (!specimens.length) return null;

  return (
    <>
      <div className="grid grid-cols-3 gap-1.5">
        {specimens.map((s, i) => (
          <GalleryItem
            key={s.id}
            specimen={s}
            index={i}
            onClick={setSelected}
          />
        ))}
      </div>

      <AnimatePresence>
        {selected && (
          <SpecimenLightbox
            specimen={selected}
            onClose={() => setSelected(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
