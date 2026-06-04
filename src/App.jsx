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

// Primary workflow pages — code-split for performance
const Explore = lazy(() => import('@/pages/Explore'));
const Scan = lazy(() => import('@/pages/Scan'));
const Collection = lazy(() => import('@/pages/Collection'));
const Collections = lazy(() => import('@/pages/Collections'));
const Market = lazy(() => import('@/pages/Market'));
const Expeditions = lazy(() => import('@/pages/Expeditions'));
const ExpeditionDetail = lazy(() => import('@/pages/ExpeditionDetail'));

// Secondary systems — admin/tools only
const Admin = lazy(() => import('@/pages/Admin'));
const Docs = lazy(() => import('@/pages/Docs'));
const DesignSystem = lazy(() => import('@/pages/DesignSystem'));
const Profile = lazy(() => import('@/pages/Profile'));
const Settings = lazy(() => import('@/pages/Settings'));
const ArchitectureBoundaries = lazy(() => import('@/pages/ArchitectureBoundaries'));

const SpecimenDetail = lazy(() => import('@/pages/SpecimenDetail'));

// Feature pages (moved to modals/drawers in main app, kept for legacy)
const About = lazy(() => import('@/pages/About'));
const Contact = lazy(() => import('@/pages/Contact'));

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
          {/* PRIMARY WORKFLOW ROUTES */}
          <Route path="/" element={<Hub />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/scan" element={<Scan />} />
          <Route path="/collection" element={<Collection />} />
          <Route path="/collections" element={<Collections />} />
          <Route path="/expeditions" element={<Expeditions />} />
          <Route path="/expedition/:expeditionId" element={<ExpeditionDetail />} />
          <Route path="/market" element={<Market />} />
          <Route path="/specimen/:id" element={<SpecimenDetail />} />

          {/* SECONDARY / ADMIN ROUTES */}
          <Route path="/admin" element={<Admin />} />
          <Route path="/docs" element={<Docs />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/dev/architecture" element={<ArchitectureBoundaries />} />

          {/* LEGACY / FEATURE ROUTES (kept for backwards compat, not in main nav) */}
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/dev/design-system" element={<DesignSystem />} />
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