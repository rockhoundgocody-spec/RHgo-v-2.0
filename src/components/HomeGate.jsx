import React, { Suspense } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';

const Landing = React.lazy(() => import('@/pages/Landing'));
const Hub = React.lazy(() => import('@/pages/Hub'));

// Show value before registration. Signed-in collectors can revisit this public
// introduction with ?welcome=1 without changing their session or account.
export default function HomeGate() {
  const { isAuthenticated } = useAuth();
  const [params] = useSearchParams();
  const showWelcome = !isAuthenticated || params.get('welcome') === '1';
  return <Suspense fallback={<div className="min-h-screen bg-background" />}>
    {showWelcome ? <Landing /> : <Hub />}
  </Suspense>;
}