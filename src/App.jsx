import React, { Suspense, lazy } from 'react';
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import Layout from '@/components/Layout.jsx';
import Hub from '@/pages/Hub';

// Heavy pages are code-split — Three.js, Leaflet, charts, etc.
// only load when user actually navigates there.
const Explore = lazy(() => import('@/pages/Explore'));
const Scan = lazy(() => import('@/pages/Scan'));
const Collection = lazy(() => import('@/pages/Collection'));
const Compare = lazy(() => import('@/pages/Compare'));
const CompareLive = lazy(() => import('@/pages/CompareLive'));
const Admin = lazy(() => import('@/pages/Admin'));
const Docs = lazy(() => import('@/pages/Docs'));
const DesignSystem = lazy(() => import('@/pages/DesignSystem'));
const Badges = lazy(() => import('@/pages/Badges'));

const RouteFallback = () => (
  <div className="fixed inset-0 flex items-center justify-center">
    <div className="w-8 h-8 border-4 border-amethyst/20 border-t-amethyst-glow rounded-full animate-spin" />
  </div>
);

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      navigateToLogin();
      return null;
    }
  }

  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Hub />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/scan" element={<Scan />} />
          <Route path="/collection" element={<Collection />} />
          <Route path="/badges" element={<Badges />} />
          <Route path="/compare" element={<Compare />} />
          <Route path="/compare-live" element={<CompareLive />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/docs" element={<Docs />} />
          <Route path="/design-system" element={<DesignSystem />} />
        </Route>
        <Route path="*" element={<PageNotFound />} />
      </Routes>
    </Suspense>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App