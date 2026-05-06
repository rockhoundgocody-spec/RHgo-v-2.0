import React from 'react';
import { ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

/**
 * EcosystemFooter — small "Powered by RockHound-GO" link that bridges
 * this field app to the main rockhoundgo.com hub. (Audit R5.)
 */
export default function EcosystemFooter() {
  return (
    <footer className="mt-16 mb-4 flex flex-col items-center gap-1 text-center">
      <a
        href="https://rockhoundgo.com"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-[0.3em] text-amethyst/60 hover:text-amethyst-glow transition"
      >
        Powered by RockHound-GO
        <ExternalLink size={11} />
      </a>
      <div className="text-[10px] text-white/30 tracking-wider">
        Field App · rhgo.base44.app
      </div>
      <nav className="mt-2 flex items-center gap-4 text-[11px] font-mono uppercase tracking-[0.3em]">
        <Link to="/about" className="text-amethyst/60 hover:text-amethyst-glow transition">
          About
        </Link>
        <span className="text-white/20">·</span>
        <Link to="/contact" className="text-amethyst/60 hover:text-amethyst-glow transition">
          Contact
        </Link>
      </nav>
    </footer>
  );
}