import React, { Suspense, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import Hub from '@/pages/Hub';
import FirstVisitGate from '@/components/FirstVisitGate.jsx';
const Landing = React.lazy(() => import('@/pages/Landing'));
const OpeningBuffer = React.lazy(() => import('@/components/hub/OpeningBuffer.jsx'));
const IntroCinematic = React.lazy(() => import('@/components/hub/IntroCinematic.jsx'));

/**
 * HomeGate — routes unauthenticated visitors through the first-visit gate
 * (name input or "I already have an account"), then the cinematic opening,
 * then to register/login. Authenticated users go straight to the Hub.
 */
export default function HomeGate() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [gateState, setGateState] = useState('gate'); // 'gate' | 'buffer' | 'cinematic'
  const [userName, setUserName] = useState('');

  // Route returning/new users past the gate on first load
  useEffect(() => {
    if (isAuthenticated) return;
    const choice = localStorage.getItem('rhgo_gate_choice');
    if (choice === 'returning') {
      navigate('/login', { replace: true });
    } else if (choice === 'new') {
      if (localStorage.getItem('rhgo_intro_seen') === '1') {
        navigate('/register', { replace: true });
      } else if (localStorage.getItem('rhgo_buffer_seen') === '1') {
        setGateState('cinematic');
      } else {
        setGateState('buffer');
      }
    }
  }, [isAuthenticated]);

  if (isAuthenticated) return <Hub />;

  const handleGateChoice = (choice, name) => {
    if (choice === 'returning') {
      localStorage.setItem('rhgo_gate_choice', 'returning');
      navigate('/login');
    } else {
      localStorage.setItem('rhgo_gate_choice', 'new');
      localStorage.setItem('rhgo_user_name', name);
      setUserName(name);
      if (localStorage.getItem('rhgo_buffer_seen') === '1') {
        setGateState('cinematic');
      } else {
        setGateState('buffer');
      }
    }
  };

  if (gateState === 'gate') {
    return <FirstVisitGate onChoice={handleGateChoice} />;
  }

  if (gateState === 'buffer') {
    return (
      <Suspense fallback={<div className="min-h-screen" style={{ background: '#0a0a14' }} />}>
        <OpeningBuffer onDone={() => {
          localStorage.setItem('rhgo_buffer_seen', '1');
          setGateState('cinematic');
        }} />
      </Suspense>
    );
  }

  if (gateState === 'cinematic') {
    return (
      <Suspense fallback={<div className="min-h-screen" style={{ background: '#0a0a14' }} />}>
        <IntroCinematic
          initialName={userName || localStorage.getItem('rhgo_user_name') || ''}
          onDone={() => {
            navigate('/register');
          }}
        />
      </Suspense>
    );
  }

  // Fallback: show Landing for any unauthenticated user not in the gate flow
  return (
    <Suspense fallback={<div className="min-h-screen" style={{ background: '#0a0a14' }} />}>
      <Landing />
    </Suspense>
  );
}