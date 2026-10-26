import { useEffect } from 'react';
import { on } from '@/lib/cloverWake';
import { pulse, alertWhenAway } from '@/lib/fieldAlerts';

/**
 * CloverNotifications — how her ears report back.
 *
 * In front of the user: a subtle haptic pulse, never a popup, so the field
 * screen stays clear. Away from the app (backgrounded or closed out): the same
 * moment becomes a status-bar notification, which waits without covering
 * anything.
 */

const BLOCKED = {
  noise: {
    title: 'Wake turned away',
    body: 'Too much background noise. Say "Hey Clover" closer to the mic.',
  },
  not_you: {
    title: 'Wake turned away',
    body: 'That was not your enrolled voice.',
  },
};

const DENIED = {
  title: 'Microphone blocked',
  body: 'Allow mic access for this site, then switch "Hey Clover" back on in Settings.',
};

export default function CloverNotifications() {
  useEffect(() => {
    const offs = [
      // A wake only happens with the app in front, so the pulse says it all.
      on('wake', () => pulse('tap')),

      on('command', ({ text, kind } = {}) => {
        const logged = kind === 'logged';
        pulse(logged ? 'pulse' : 'tap');
        void alertWhenAway({
          title: logged ? 'Find logged' : 'Clover acted on that',
          body: logged ? 'Saved to your collection.' : (text ? `"${text}"` : 'Done.'),
          variant: logged ? 'logged' : 'command',
        });
      }),

      on('blocked', ({ reason } = {}) => {
        const copy = BLOCKED[reason] || BLOCKED.noise;
        pulse('pulse');
        void alertWhenAway({ ...copy, variant: 'blocked' });
      }),

      on('denied', () => {
        pulse('pulse');
        void alertWhenAway({ ...DENIED, variant: 'denied' });
      }),
    ];

    return () => offs.forEach((off) => off());
  }, []);

  return null;
}