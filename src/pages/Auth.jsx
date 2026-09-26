import { Navigate, useLocation } from 'react-router-dom';
import { useSeoRobots } from '@/lib/useSeoRobots';

/**
 * Marks the legacy auth page as noindex and redirects to login, preserving
 * the query string (including from_url, next, and returnTo) and URL hash.
 */
export default function Auth() {
  useSeoRobots(false);
  const location = useLocation();
  return <Navigate to={`/login${location.search}${location.hash}`} replace />;
}
