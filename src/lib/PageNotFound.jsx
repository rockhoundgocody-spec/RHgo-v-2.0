import { Link, useLocation } from 'react-router-dom';
import { useSeoMeta } from '@/lib/useSeoMeta';

// Base44 hosting answers every URL with HTTP 200, so this page is also marked
// noindex by RouteSeo (unknown paths are never indexable) to avoid soft 404s.
export default function PageNotFound() {
  const location = useLocation();
  const pageName = location.pathname.substring(1);
  useSeoMeta('Page not found | RockHound-GO', 'This page is not on the map. Head back to RockHound-GO to scan a specimen or explore.');

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: '#0a0a14' }}>
      <div className="max-w-md w-full text-center space-y-6">
        <div className="text-7xl font-black tracking-tight" style={{ color: 'hsla(280,80%,75%,0.28)' }}>404</div>
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Trail went cold</h1>
          <p className="text-white/45 text-sm mt-2 leading-relaxed">
            <span className="text-white/70">“{pageName || 'this page'}”</span> isn’t on the map.
          </p>
        </div>
        <div className="flex flex-col gap-2 items-center">
          <Link
            to="/"
            className="inline-flex items-center justify-center px-6 py-3 rounded-2xl font-bold text-sm mint-cta"
          >
            Back to home
          </Link>
          <Link to="/scan" className="text-white/45 text-sm hover:text-white/80">Scan a specimen</Link>
        </div>
      </div>
    </div>
  );
}
