import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { useSeoRobots } from '@/lib/useSeoRobots';

export default function SessionRecovery() {
  const { checkUserAuth } = useAuth();
  useSeoRobots(false);
  return <main id="main-content" className="min-h-screen grid place-items-center bg-background text-foreground px-6">
    <div className="max-w-sm text-center space-y-4">
      <h1 className="text-xl font-bold">Your session check did not finish</h1>
      <p className="text-muted-foreground text-sm">You have not been signed out. Check your connection and retry to open your private workspace.</p>
      <button type="button" onClick={checkUserAuth} className="min-h-12 px-6 rounded-xl bg-primary text-primary-foreground font-semibold">Retry session check</button>
      <Link to="/demo" className="block min-h-12 py-3 text-muted-foreground">See the public field journey</Link>
    </div>
  </main>;
}