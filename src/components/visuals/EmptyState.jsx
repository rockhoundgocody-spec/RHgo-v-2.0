import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

/**
 * On-brand empty / zero-state component.
 * Usage: <EmptyState icon="💎" title="No specimens yet" body="..." ctaLabel="Scan Your First Find" ctaTo="/scan" />
 */
export default function EmptyState({ icon = '🪨', title, body, description, ctaLabel, ctaTo, ctaOnClick }) {
  const bodyText = body || description;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col items-center text-center py-14 px-8"
    >
      {/* Glowing crystal orb */}
      <motion.div
        aria-hidden="true"
        animate={{
          scale: [1, 1.08, 1],
          filter: [
            'drop-shadow(0 0 16px hsla(280,100%,65%,0.3))',
            'drop-shadow(0 0 32px hsla(280,100%,65%,0.55))',
            'drop-shadow(0 0 16px hsla(280,100%,65%,0.3))',
          ],
        }}
        transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
        className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl mb-5 select-none"
        style={{
          background: 'radial-gradient(circle at 35% 30%, hsla(280,80%,55%,0.25), hsla(265,50%,15%,0.5))',
          border: '1px solid hsla(280,70%,65%,0.25)',
          boxShadow: 'inset 0 1px 0 hsla(280,80%,95%,0.15)',
        }}
      >
        {typeof icon === 'function' || (icon && typeof icon === 'object' && !React.isValidElement(icon))
          ? React.createElement(icon, { size: 36, className: 'text-amethyst-glow' })
          : icon}
      </motion.div>

      <h3 className="text-white/80 font-bold text-lg mb-2 leading-snug">{title}</h3>
      {bodyText && <p className="text-white/35 text-sm leading-relaxed max-w-[220px] mb-6">{bodyText}</p>}

      {ctaLabel && (ctaTo || ctaOnClick) && (
        ctaTo ? (
          <Link
            to={ctaTo}
            className="px-6 py-3 rounded-2xl font-bold text-white text-sm transition active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amethyst-glow/60 focus-visible:ring-offset-2 focus-visible:ring-offset-black/80"
            style={{
              background: 'linear-gradient(135deg, hsl(265,70%,48%), hsl(280,90%,60%))',
              boxShadow: '0 6px 28px -6px hsla(270,80%,60%,0.55)',
            }}
          >
            {ctaLabel}
          </Link>
        ) : (
          <button
            type="button"
            onClick={ctaOnClick}
            className="px-6 py-3 rounded-2xl font-bold text-white text-sm transition active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amethyst-glow/60 focus-visible:ring-offset-2 focus-visible:ring-offset-black/80"
            style={{
              background: 'linear-gradient(135deg, hsl(265,70%,48%), hsl(280,90%,60%))',
              boxShadow: '0 6px 28px -6px hsla(270,80%,60%,0.55)',
            }}
          >
            {ctaLabel}
          </button>
        )
      )}
    </motion.div>
  );
}
