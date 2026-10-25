import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { hashEmail } from '@/lib/useSubscription';

export default function HoundTrialCard() {
  const { user } = useAuth();
  const [trial, setTrial] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    let live = true;
    setTrial(null); setError('');
    if (user?.email) base44.functions.invoke('houndTrial', { action: 'status' })
      .then(({ data }) => { if (live) setTrial(data); })
      .catch(() => { if (live) setError('Unable to check your trial. Reload this page to try again.'); });
    return () => { live = false; };
  }, [user?.email]);
  useEffect(() => {
    const end = Date.parse(trial?.ends_at || '');
    if (!['active', 'eligible'].includes(trial?.state) || !Number.isFinite(end)) return;
    const timer = setTimeout(() => setTrial((value) => ({ ...value, state: 'expired', eligible: false })), Math.max(0, end - Date.now()));
    return () => clearTimeout(timer);
  }, [trial]);
  const activate = async () => {
    setBusy(true); setError('');
    try {
      const { data } = await base44.functions.invoke('houndTrial', { action: 'start' });
      setTrial(data);
      sessionStorage.removeItem(`sub_${hashEmail(user.email)}`);
      window.dispatchEvent(new Event('rhgo-subscription-changed'));
    } catch (err) { setError(err?.response?.data?.error || 'Unable to start your trial. Please try again.'); }
    finally { setBusy(false); }
  };
  const end = trial?.ends_at ? new Date(trial.ends_at).toLocaleString() : '';
  return (
    <section data-testid="hound-trial-card" className="mb-6 rounded-2xl border border-showcase-amber/40 bg-showcase-panel p-5 text-showcase-frost">
      <h2 className="font-heading text-lg font-semibold">Hound trial</h2>
      <p className="mt-2 text-sm leading-relaxed text-showcase-muted">Unlimited member scans during the 14 days following your first signed-in scan. No card, no charge, no automatic renewal. Other Hound benefits are still being completed.</p>
      <div aria-live="polite" className="mt-4 text-sm">
        {!user ? <Link to="/signin?from_url=%2Fpricing" className="showcase-secondary">Sign in to check eligibility</Link> : error ? <p role="alert">{error}</p> : !trial ? <p>Checking trial eligibility…</p> : trial.state === 'eligible' ? <Button onClick={activate} disabled={busy} className="min-h-12 bg-showcase-amber text-showcase-ink hover:bg-showcase-amber/90">{busy ? 'Activating…' : 'Activate Hound trial'}</Button> : trial.state === 'active' ? <p data-testid="hound-trial-active">Your trial is active until {end}. Unlimited member scans are unlocked.</p> : trial.state === 'needs_scan' ? <Link to="/scan" className="showcase-secondary">Complete your first scan</Link> : trial.state === 'expired' ? <p>Your trial window has ended{end ? ` (${end})` : ''}. Your free scan allowance remains available.</p> : <p>{trial.state === 'member' ? 'You already have member access.' : 'This trial is for accounts without a previous paid membership.'}</p>}
      </div>
      {trial?.state === 'eligible' && <p className="mt-3 text-xs text-showcase-muted">Trial window ends {end}. Activating later does not extend it.</p>}
    </section>
  );
}