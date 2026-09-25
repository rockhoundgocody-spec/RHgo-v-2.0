import React, { Suspense, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import Hub from '@/pages/Hub';
import FirstVisitGate from '@/components/FirstVisitGate.jsx';
import {
  GATE_BUFFER_KEY,
  GATE_CHOICE_KEY,
  GATE_INTRO_KEY,
  GATE_NAME_KEY,
  GATE_SESSION_REDIRECT_KEY,
  readGateChoice,
} from '@/lib/gateStorage';

const Landing = React.lazy(() => import('@/pages/Landing'));
const OpeningBuffer = React.lazy(() => import('@/components/hub/OpeningBuffer.jsx'));
const IntroCinematic = React.lazy(() => import('@/components/hub/IntroCinematic.jsx'));

/**
 * HomeGate — unauthenticated `/` entry.
 * Authenticated users → Hub.
 * Everyone else sees FirstVisitGate (or a one-shot soft redirect to login/register).
 * Never permanently trap users away from /login.
 */
export default function HomeGate() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [gateState, setGateState] = useState('gate'); // 'gate' | 'buffer' | 'cinematic'
  const [userName, setUserName] = useState('');

  // Soft one-shot redirect for returning visitors — once per tab session only.
  useEffect(() => {
    if (isAuthenticated) return;
    let choice;
    let already;
    try {
      choice = readGateChoice();
      already = sessionStorage.getItem(GATE_SESSION_REDIRECT_KEY);
    } catch {
      return;
    }
    if (already) return;

    if (choice === 'returning') {
      try { sessionStorage.setItem(GATE_SESSION_REDIRECT_KEY, '1'); } catch { /* */ }
      navigate('/login', { replace: true });
    }
    // Do NOT auto-force /register on every visit — that blocked "I have an account".
  }, [isAuthenticated, navigate]);

  if (isAuthenticated) return <Hub />;

  const handleGateChoice = (choice, name) => {
    if (choice === 'returning') {
      try {
        localStorage.setItem(GATE_CHOICE_KEY, 'returning');
        sessionStorage.setItem(GATE_SESSION_REDIRECT_KEY, '1');
      } catch { /* */ }
      navigate('/login');
      return;
    }
    if (choice === 'guest') {
      navigate('/scan');
      return;
    }
    if (choice === 'google') {
      try {
        localStorage.setItem(GATE_CHOICE_KEY, 'new');
        if (name) localStorage.setItem(GATE_NAME_KEY, name);
      } catch { /* */ }
      return; // OAuth redirect already started by FirstVisitGate
    }
    try {
      localStorage.setItem(GATE_CHOICE_KEY, 'new');
      localStorage.setItem(GATE_NAME_KEY, name || 'Explorer');
      localStorage.setItem(GATE_INTRO_KEY, '1');
      sessionStorage.setItem(GATE_SESSION_REDIRECT_KEY, '1');
    } catch { /* */ }
    setUserName(name || 'Explorer');
    navigate('/register');
  };

  if (gateState === 'gate') {
    return <FirstVisitGate onChoice={handleGateChoice} />;
  }

  if (gateState === 'buffer') {
    return (
      <Suspense fallback={<div className="min-h-screen" style={{ background: '#0a0a14' }} />}>
        <OpeningBuffer onDone={() => {
          try { localStorage.setItem(GATE_BUFFER_KEY, '1'); } catch { /* */ }
          setGateState('cinematic');
        }} />
      </Suspense>
    );
  }

  if (gateState === 'cinematic') {
    return (
      <Suspense fallback={<div className="min-h-screen" style={{ background: '#0a0a14' }} />}>
        <IntroCinematic
          initialName={userName || (() => { try { return localStorage.getItem(GATE_NAME_KEY) || ''; } catch { return ''; } })()}
          onDone={() => { navigate('/register'); }}
        />
      </Suspense>
    );
  }

  return (
    <Suspense fallback={<div className="min-h-screen" style={{ background: '#0a0a14' }} />}>
      <Landing />
    </Suspense>
  );
}
