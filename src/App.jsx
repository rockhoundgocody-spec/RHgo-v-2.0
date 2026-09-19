import React, { Suspense, lazy } from 'react';
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import Layout from '@/components/Layout.jsx';
import AdminRoute from '@/components/AdminRoute.jsx';
import MobileOnlyGate from '@/components/MobileOnlyGate.jsx';
import HomeGate from '@/components/HomeGate.jsx';
const Landing = lazy(() => import('@/pages/Landing'));

import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';

const Onboarding = lazy(() => import('@/pages/Onboarding'));

const Explore = lazy(() => import('@/pages/Explore.jsx'));
const Scan = lazy(() => import('@/pages/Scan'));
const Collection = lazy(() => import('@/pages/Collection'));
const Collections = lazy(() => import('@/pages/Collections'));
const Community = lazy(() => import('@/pages/Community'));
const Market = lazy(() => import('@/pages/Market'));
const Expeditions = lazy(() => import('@/pages/Expeditions'));
const ExpeditionDetail = lazy(() => import('@/pages/ExpeditionDetail'));

const Admin = lazy(() => import('@/pages/Admin'));
const Docs = lazy(() => import('@/pages/Docs'));
const DesignSystem = lazy(() => import('@/pages/DesignSystem'));
const Profile = lazy(() => import('@/pages/Profile'));
const Settings = lazy(() => import('@/pages/Settings'));
const ArchitectureBoundaries = lazy(() => import('@/pages/ArchitectureBoundaries'));

const SpecimenDetail = lazy(() => import('@/pages/SpecimenDetail'));
const Compare = lazy(() => import('@/pages/Compare'));
const Chronolith = lazy(() => import('@/pages/Chronolith'));
const QuestDashboard = lazy(() => import('@/pages/QuestDashboard'));
const Leaderboard = lazy(() => import('@/pages/Leaderboard'));
const Badges = lazy(() => import('@/pages/Badges.jsx'));
const CompanionDashboard = lazy(() => import('@/pages/CompanionDashboard'));
const PrivateRockLog = lazy(() => import('@/pages/PrivateRockLog'));
const AgateGuide = lazy(() => import('@/pages/AgateGuide'));
const Live = lazy(() => import('@/pages/Live'));
const LiveStreamView = lazy(() => import('@/pages/LiveStreamView'));
const FindOfTheWeek = lazy(() => import('@/pages/FindOfTheWeek'));
const Clubs = lazy(() => import('@/pages/Clubs'));

const OAuthConsent = lazy(() => import('@/pages/OAuthConsent'));
const Connect = lazy(() => import('@/pages/Connect'));
const About = lazy(() => import('@/pages/About'));
const Paywall = lazy(() => import('@/pages/Paywall'));
const Demo = lazy(() => import('@/pages/Demo'));
const Contact = lazy(() => import('@/pages/Contact'));
const Auth = lazy(() => import('@/pages/Auth'));
const Pricing = lazy(() => import('@/pages/Pricing'));
const PrivacyPolicy = lazy(() => import('@/pages/PrivacyPolicy'));
const Terms = lazy(() => import('@/pages/Terms'));

const RouteFallback = () => (
  <div className="fixed inset-0 flex items-center justify-center" style={{ background: '#0a0a14' }}>
    <div className="w-9 h-9 border-2 border-white/10 border-t-[#9FE8D0] rounded-full animate-spin" />
  </div>
);

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center" style={{ background: '#0a0a14' }}>
        <div className="w-9 h-9 border-2 border-white/10 border-t-[#9FE8D0] rounded-full animate-spin"></div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      return (
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/demo" element={<Demo />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/agate-guide" element={<AgateGuide />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/docs" element={<Docs />} />
            <Route path="/clubs" element={<Clubs />} />
            <Route path="/find-of-the-week" element={<FindOfTheWeek />} />
            <Route path="/live" element={<Live />} />
            <Route path="/live/:streamId" element={<LiveStreamView />} />
            <Route path="/scan" element={<Scan />} />
            <Route path="/oauth/consent" element={<OAuthConsent />} />
            <Route path="/connect" element={<Connect />} />
            <Route path="*" element={<Landing />} />
          </Routes>
        </Suspense>
      );
    }
  }

  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/demo" element={<Demo />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/scan" element={<Scan />} />
        <Route path="/oauth/consent" element={<OAuthConsent />} />
        <Route path="/connect" element={<Connect />} />

        <Route element={<Layout />}>
          <Route path="/" element={<HomeGate />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/collection" element={<Collection />} />
          <Route path="/community" element={<Community />} />
          <Route path="/collections" element={<Collections />} />
          <Route path="/expeditions" element={<Expeditions />} />
          <Route path="/expedition/:expeditionId" element={<ExpeditionDetail />} />
          <Route path="/market" element={<Market />} />
          <Route path="/specimen/:id" element={<SpecimenDetail />} />
          <Route path="/compare" element={<Compare />} />
          <Route path="/chronolith" element={<Chronolith />} />
          <Route path="/quests" element={<QuestDashboard />} />
          <Route path="/dashboard" element={<Navigate to="/" replace />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/badges" element={<Badges />} />
          <Route path="/companion" element={<CompanionDashboard />} />
          <Route path="/private-log" element={<PrivateRockLog />} />
          <Route path="/agate-guide" element={<AgateGuide />} />
          <Route path="/live" element={<Live />} />
          <Route path="/live/:streamId" element={<LiveStreamView />} />
          <Route path="/find-of-the-week" element={<FindOfTheWeek />} />
          <Route path="/clubs" element={<Clubs />} />

          <Route path="/profile" element={<Profile />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/docs" element={<Docs />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/paywall" element={<Paywall />} />
        </Route>

        <Route element={<AdminRoute />}>
          <Route path="/admin" element={<Admin />} />
          <Route path="/dev/architecture" element={<ArchitectureBoundaries />} />
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
      <MobileOnlyGate>
        <BrowserRouter>
          <AuthProvider>
            <AuthenticatedApp />
          </AuthProvider>
          <Toaster />
        </BrowserRouter>
      </MobileOnlyGate>
    </QueryClientProvider>
  )
}

export default App