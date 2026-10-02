import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { useSeoRobots } from '@/lib/useSeoRobots';

const DefaultFallback = () => (
  <div className="fixed inset-0 flex items-center justify-center">
    <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
  </div>
);

/**
 * AdminRoute — only renders children when the current user has role="admin".
 * Unauthenticated visitors are sent to /signin with from_url preserved.
 * Authenticated non-admins are sent to /.
 */
export default function AdminRoute() {
  const { user, isAuthenticated, isLoadingAuth } = useAuth();
  const location = useLocation();
  useSeoRobots(false);

  if (isLoadingAuth) return <DefaultFallback />;
  if (!isAuthenticated) {
    const from = `${location.pathname}${location.search}`;
    const q = encodeURIComponent(from);
    return <Navigate to={`/signin?from_url=${q}&next=${q}`} replace />;
  }
  if (user?.role !== 'admin') return <Navigate to="/" replace />;

  return <Outlet />;
}
