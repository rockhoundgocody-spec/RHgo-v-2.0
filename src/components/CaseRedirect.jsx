/**
 * CaseRedirect — catches wrong-cased variants of public routes and redirects
 * to the canonical lowercase route. React Router v6 is case-sensitive, so
 * /AboutUs or /About-Us would otherwise hit the branded 404. This component
 * runs once on mount and checks the pathname against the known public routes.
 *
 * Genuinely unknown routes pass through to the 404 page.
 */
import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { PUBLIC_INDEXABLE_PATHS } from '@/lib/routeSeo';

const CANONICAL = new Set(PUBLIC_INDEXABLE_PATHS);

// Extra public routes that aren't in the sitemap list but should still
// redirect case variants (e.g. /signin, /register, /forgot-password).
const EXTRA_CANONICAL = [
  '/signin',
  '/login',
  '/register',
  '/auth',
  '/forgot-password',
  '/new-password',
  '/reset-password',
  '/onboarding',
  '/oauth/consent',
  '/connect',
];
const ALL_CANONICAL = new Set([...CANONICAL, ...EXTRA_CANONICAL]);

export default function CaseRedirect() {
  const { pathname, search, hash } = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const lower = pathname.toLowerCase();

    // Already lowercase or root — nothing to fix.
    if (lower === pathname) return;

    // Check if the lowercase version is a known route.
    if (ALL_CANONICAL.has(lower)) {
      navigate(`${lower}${search}${hash}`, { replace: true });
    }
  }, [pathname, search, hash, navigate]);

  return null;
}