// Paywall.jsx — legacy upgrade route, redirects to /pricing
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Paywall() {
  const navigate = useNavigate();
  useEffect(() => { navigate('/pricing', { replace: true }); }, [navigate]);
  return null;
}