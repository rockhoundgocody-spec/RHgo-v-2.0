import { useCallback, useEffect, useRef } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { on } from '@/lib/cloverWake';

const COPY = {
  noise: {
    title: 'Too much background noise',
    description: 'She heard the phrase but it was buried — say "Hey Clover" again, closer to the mic.',
  },
  not_you: {
    title: 'That voice is not you',
    description: 'Clover only wakes to your enrolled voice, so anyone else can be ignored.',
  },
};

/**
 * CloverNotifications — the popups that confirm what her ears just did: the
 * wake itself, a command she acted on, and the two ways a wake gets turned away
 * (background noise, or somebody else's voice).
 *
 * Each popup dismisses itself on its own timer, so a field session never leaves
 * a stack of them on screen.
 */
export default function CloverNotifications() {
  const { toast } = useToast();
  const timers = useRef([]);

  const pop = useCallback(({ duration = 2800, ...options }) => {
    const { dismiss } = toast({ ...options, duration });
    timers.current.push(setTimeout(() => dismiss(), duration));
  }, [toast]);

  useEffect(() => () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }, []);

  useEffect(() => {
    const offs = [
      on('wake', () => pop({
        title: 'Clover heard you',
        description: 'Listening now — go ahead.',
        duration: 2500,
      })),

      on('command', ({ text, kind } = {}) => pop({
        title: kind === 'logged' ? 'Find logged' : 'Command received',
        description: kind === 'logged' ? 'Saved to your collection.' : (text ? `"${text}"` : 'On it.'),
        duration: 2800,
      })),

      on('blocked', ({ reason } = {}) => {
        const copy = COPY[reason] || COPY.noise;
        pop({ title: copy.title, description: copy.description, duration: 3200 });
      }),

      on('denied', () => pop({
        title: 'Microphone blocked',
        description: 'Allow mic access for this site, then switch "Hey Clover" back on in Settings.',
        variant: 'destructive',
        duration: 6000,
      })),
    ];

    return () => offs.forEach((off) => off());
  }, [pop]);

  return null;
}