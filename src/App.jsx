import React, { Suspense, lazy } from 'react';
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import Layout from '@/components/Layout.jsx';
import Hub from '@/pages/Hub';
const Landing = lazy(() => import('@/pages/Landing'));

// Auth pages — not lazy, need to be fast
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';

// Onboarding
const Onboarding = lazy(() => import('@/pages/Onboarding'));

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
const QuestDashboard = lazy(() => import('@/pages/QuestDashboard'));
const Leaderboard = lazy(() => import('@/pages/Leaderboard'));
const Badges = lazy(() => import('@/pages/Badges'));

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
      // Don't hard-redirect — show public routes instead
      return (
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="*" element={<Landing />} />
          </Routes>
        </Suspense>
      );
    }
  }

  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        {/* Auth routes — outside Layout, no nav bar */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/onboarding" element={<Onboarding />} />

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
          <Route path="/quests" element={<QuestDashboard />} />
          <Route path="/QuestDashboard" element={<Navigate to="/quests" replace />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/badges" element={<Badges />} />

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
    <QueryClientProvider client={queryClientInstance}>
      <Router>
        <AuthProvider>
          <AuthenticatedApp />
        </AuthProvider>
        <Toaster />
      </Router>
    </QueryClientProvider>
  )
}

export default App