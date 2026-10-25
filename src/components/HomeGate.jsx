import React, { Suspense } from 'react';
import { useAuth } from '@/lib/AuthContext';

const Landing = React.lazy(() => import('@/pages/Landing'));
const Hub = React.lazy(() => import('@/pages/Hub'));

/** Existing members keep their hub; visitors get value before registration. */
export default function HomeGate() {
  const { isAuthenticated } = useAuth();
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      {isAuthenticated ? <Hub /> : <Landing />}
    </Suspense>
  );
}