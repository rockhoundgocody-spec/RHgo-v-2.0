/**
 * QuickPinButton — one-tap "mark this spot" for offline hikes.
 * Saves current GPS coordinates only to the authenticated owner's private log.
 * It never creates or updates a publicly readable hotspot.
 */
import React, { useState } from 'react';
import { MapPin, Check, Loader2, WifiOff } from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { queueWrite, getQueueLength } from '@/lib/offlineQueue';
import { base44 } from '@/api/base44Client';
import { buildPrivatePinRecord } from '@/lib/privateLocation';

export default function QuickPinButton({ userLocation }) {
  const reducedMotion = useReducedMotion();
  const [state, setState] = useState('idle'); // idle | saving | saved | error
  const [savedOffline, setSavedOffline] = useState(false);

  const handlePin = async () => {
    if (state === 'saving') return;

    if (!userLocation) {
      setState('error');
      setTimeout(() => setState('idle'), 2000);
      return;
    }

    setState('saving');
    let result;
    try {
      const user = await base44.auth.me();
      const data = buildPrivatePinRecord(userLocation, user?.email);
      result = await queueWrite({ entity: 'PrivateRockLog', op: 'create', data });
    } catch {
      setState('error');
      setTimeout(() => setState('idle'), 2000);
      return;
    }

    const { ok, offline } = result;

    if (ok) {
      setSavedOffline(offline);
      setState('saved');
      setTimeout(() => setState('idle'), 2500);
    } else {
      setState('error');
      setTimeout(() => setState('idle'), 2000);
    }
  };

  const queueCount = getQueueLength();

  const getAriaLabel = () => {
    if (state === 'saving') return 'Saving location to private rock log...';
    if (state === 'saved') {
      return savedOffline
        ? 'Location queued for offline sync'
        : 'Location saved to private rock log';
    }
    if (state === 'error') {
      return !userLocation ? 'GPS location unavailable' : 'Failed to save location';
    }
    return 'Save this location to my private rock log';
  };

  return (
    <div className="relative flex flex-col items-center gap-1">
      <motion.button
        type="button"
        onClick={handlePin}
        whileTap={reducedMotion ? undefined : { scale: 0.88 }}
        disabled={state === 'saving'}
        className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amethyst/70 focus-visible:ring-offset-2 focus-visible:ring-offset-black/80"
        style={{
          background: state === 'saved'
            ? 'hsla(142,70%,30%,.35)'
            : state === 'error'
            ? 'hsla(0,70%,40%,.3)'
            : 'hsla(240,30%,8%,.88)',
          border: state === 'saved'
            ? '1px solid hsla(142,70%,55%,.55)'
            : state === 'error'
            ? '1px solid hsla(0,70%,55%,.45)'
            : '1px solid hsla(280,60%,60%,.4)',
          backdropFilter: 'blur(20px)',
          boxShadow: state === 'saved' ? '0 0 14px hsla(142,70%,50%,.3)' : 'none',
        }}
        aria-label={getAriaLabel()}
        aria-pressed={state === 'saving' || state === 'saved'}
        aria-busy={state === 'saving'}
      >
        <AnimatePresence mode="wait" initial={false}>
          {state === 'saving' && (
            <motion.span key="spin" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Loader2 size={16} className="text-amethyst-glow animate-spin" />
            </motion.span>
          )}
          {state === 'saved' && (
            <motion.span key="check" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ opacity: 0 }}>
              <Check size={16} className="text-emerald-300" />
            </motion.span>
          )}
          {(state === 'idle' || state === 'error') && (
            <motion.span key="pin" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <MapPin size={16} className={state === 'error' ? 'text-rose-400' : 'text-amethyst-glow'} />
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Pending queue badge */}
      {queueCount > 0 && state === 'idle' && (
        <div
          role="status"
          aria-label={`${queueCount} pending ${queueCount === 1 ? 'pin' : 'pins'}`}
          className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold text-white"
          style={{ background: 'hsla(280,80%,55%,1)', border: '1.5px solid hsla(240,30%,8%,.9)' }}
        >
          <span aria-hidden="true">{queueCount > 9 ? '9+' : queueCount}</span>
        </div>
      )}

      {/* Tooltip feedback */}
      <AnimatePresence>
        {state === 'saved' && (
          <motion.div
            role="status"
            initial={reducedMotion ? false : { opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={reducedMotion ? undefined : { opacity: 0, y: -4 }}
            className="absolute top-12 left-1/2 -translate-x-1/2 whitespace-nowrap px-2.5 py-1 rounded-xl text-[10px] font-semibold flex items-center gap-1"
            style={{
              background: 'hsla(245,30%,9%,.95)',
              border: '1px solid hsla(142,70%,55%,.35)',
              backdropFilter: 'blur(16px)',
              color: savedOffline ? '#fbbf24' : '#86efac',
              zIndex: 9999,
            }}
          >
            {savedOffline && <WifiOff size={9} />}
            {savedOffline ? 'Private pin queued — syncs on signal' : 'Saved to private log'}
          </motion.div>
        )}
        {state === 'error' && (
          <motion.div
            role="status"
            initial={reducedMotion ? false : { opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={reducedMotion ? undefined : { opacity: 0, y: -4 }}
            className="absolute top-12 left-1/2 -translate-x-1/2 whitespace-nowrap px-2.5 py-1 rounded-xl text-[10px] font-semibold text-rose-300"
            style={{
              background: 'hsla(245,30%,9%,.95)',
              border: '1px solid hsla(0,70%,55%,.3)',
              backdropFilter: 'blur(16px)',
              zIndex: 9999,
            }}
          >
            {!userLocation ? 'Waiting for GPS…' : 'Could not pin'}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
