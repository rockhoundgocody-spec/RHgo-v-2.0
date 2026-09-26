/**
 * Legacy purple Auth wall — Wave-1 audit: redirect to canonical Login.
 * Preserves from_url / next / returnTo query params.
 */
import { Navigate, useLocation } from 'react-router-dom';
import { useSeoRobots } from '@/lib/useSeoRobots';

export default function Auth() {
  useSeoRobots(false);
  const location = useLocation();
  return <Navigate to={`/login${location.search}${location.hash}`} replace />;
}
