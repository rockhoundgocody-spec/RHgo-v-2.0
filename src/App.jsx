import { Suspense, lazy } from 'react';
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import Layout from '@/components/Layout.jsx';
import AdminRoute from '@/components/AdminRoute.jsx';
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
const Explore = lazy(() => import('@/pages/Explore.jsx'));
const Scan = lazy(() => import('@/pages/Scan'));
const Collection = lazy(() => import('@/pages/Collection'));
const Collections = lazy(() => import('@/pages/Collections'));
const Community = lazy(() => import('@/pages/Community'));
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
const Chronolith = lazy(() => import('@/pages/Chronolith'));
const QuestDashboard = lazy(() => import('@/pages/QuestDashboard'));
const Dashboard = lazy(() => import('@/pages/Dashboard'));
const Leaderboard = lazy(() => import('@/pages/Leaderboard'));
const Badges = lazy(() => import('@/pages/Badges.jsx'));
const CompanionDashboard = lazy(() => import('@/pages/CompanionDashboard'));
const PrivateRockLog = lazy(() => import('@/pages/PrivateRockLog'));
const AgateGuide = lazy(() => import('@/pages/AgateGuide'));
const Live = lazy(() => import('@/pages/Live'));
const LiveStreamView = lazy(() => import('@/pages/LiveStreamView'));
const FindOfTheWeek = lazy(() => import('@/pages/FindOfTheWeek'));
const Clubs = lazy(() => import('@/pages/Clubs'));


// Feature pages (moved to modals/drawers in main app, kept for legacy)
const About = lazy(() => import('@/pages/About'));
const Paywall = lazy(() => import('@/pages/Paywall'));
const Demo = lazy(() => import('@/pages/Demo'));
const Contact = lazy(() => import('@/pages/Contact'));
const Auth = lazy(() => import('@/pages/Auth'));
const Pricing = lazy(() => import('@/pages/Pricing'));
const PrivacyPolicy = lazy(() => import('@/pages/PrivacyPolicy'));
const Terms = lazy(() => import('@/pages/Terms'));

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
        {/* Auth routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/onboarding" element={<Onboarding />} />
        {/* Public pricing — no auth required */}
        <Route path="/pricing" element={<Pricing />} />
        {/* Guest demo — no auth required */}
        <Route path="/demo" element={<Demo />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<Terms />} />

        <Route element={<Layout />}>
          <Route path="/" element={<Hub />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/scan" element={<Scan />} />
          <Route path="/collection" element={<Collection />} />
          <Route path="/community" element={<Community />} />
          <Route path="/collections" element={<Collections />} />
          <Route path="/expeditions" element={<Expeditions />} />
          <Route path="/expedition/:expeditionId" element={<ExpeditionDetail />} />
          <Route path="/market" element={<Market />} />
          <Route path="/specimen/:id" element={<SpecimenDetail />} />
          <Route path="/chronolith" element={<Chronolith />} />
          <Route path="/quests" element={<QuestDashboard />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/badges" element={<Badges />} />
          <Route path="/companion" element={<CompanionDashboard />} />
          <Route path="/private-log" element={<PrivateRockLog />} />
          <Route path="/agate-guide" element={<AgateGuide />} />
          <Route path="/live" element={<Live />} />
          <Route path="/live/:streamId" element={<LiveStreamView />} />
          <Route path="/find-of-the-week" element={<FindOfTheWeek />} />
          <Route path="/clubs" element={<Clubs />} />

          {/* USER ROUTES */}
          <Route path="/profile" element={<Profile />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/docs" element={<Docs />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/paywall" element={<Paywall />} />
        </Route>

        {/* ADMIN-ONLY ROUTES — require role="admin" */}
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
      <BrowserRouter>
        <AuthProvider>
          <AuthenticatedApp />
        </AuthProvider>
        <Toaster />
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App