import React, { Suspense } from 'react';
import { useAuth } from '@/lib/AuthContext';
import Hub from '@/pages/Hub';
const Landing = React.lazy(() => import('@/pages/Landing'));

/**
 * HomeGate — shows the public Landing page to logged-out visitors,
 * and the Hub to authenticated users. Rendered inside the Layout so
 * all providers (Oracle, BadgeAwarder, etc.) stay active for the Hub.
 */
export default function HomeGate() {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return (
      <Suspense fallback={<div className="min-h-screen" style={{ background: '#0a0a14' }} />}>
        <Landing />
      </Suspense>
    );
  }
  return <Hub />;
}