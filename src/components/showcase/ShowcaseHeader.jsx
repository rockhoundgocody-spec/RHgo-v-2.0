import React from 'react';
import { Link } from 'react-router-dom';
import { Gem, ArrowUpRight } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';

export default function ShowcaseHeader() {
  const { isAuthenticated } = useAuth();
  return (
    <header className="showcase-header">
      <Link to="/" className="flex items-center gap-3 min-h-12 font-heading font-bold tracking-tight" aria-label="RockHound GO home">
        <span className="showcase-brand-mark"><Gem size={23} strokeWidth={1.5} aria-hidden="true" /></span>
        <span>RockHound <span className="text-showcase-amber">GO</span></span>
      </Link>
      <nav aria-label="Public navigation" className="flex items-center gap-2 sm:gap-6">
        <Link to="/demo" className="showcase-text-link showcase-tour-link">The field journey</Link>
        <Link to={isAuthenticated ? '/collection' : '/signin'} className="showcase-text-link">
          {isAuthenticated ? 'My collection' : 'Sign in'}<ArrowUpRight size={15} aria-hidden="true" />
        </Link>
      </nav>
    </header>
  );
}