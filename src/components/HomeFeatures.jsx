import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Camera, Map, Trophy } from 'lucide-react';

/**
 * HomeFeatures — short "what you can do" section under the sign-in card on `/`.
 * Gives signed-out visitors (and search engines) a plain description of the
 * app. FirstVisitGate hides it inside the Android app, where people have
 * already installed it.
 */
export const HOME_FEATURES = [
  {
    icon: Camera,
    title: 'Scan a specimen',
    body: 'Point your camera at a rock or mineral and get a likely name with a confidence score, so you know when to take a second look.',
  },
  {
    icon: Map,
    title: 'Check land status',
    body: 'Browse collecting sites marked as BLM, national forest, state park or other public land before you head out. Always confirm the rules with the land manager.',
  },
  {
    icon: BookOpen,
    title: 'Build your Geo-DEX',
    body: 'Log every find with its photo, location and notes. Your collection grows into a personal field guide you can keep, share or trade.',
  },
  {
    icon: Trophy,
    title: 'Take on quests',
    body: 'Daily and weekly field quests, streaks and badges turn each outing into progress, with a leaderboard to see how you stack up.',
  },
];

export default function HomeFeatures() {
  return (
    <section
      id="home-features"
      aria-labelledby="home-features-title"
      className="relative z-10 w-full max-w-3xl mx-auto px-6 pt-4 pb-16 select-text"
    >
      <h2 id="home-features-title" className="text-white text-lg font-bold text-center tracking-tight">
        What you can do with RockHound-GO
      </h2>
      <p className="text-white/65 text-sm text-center mt-2">
        An AI field kit for rockhounds, from the first scan to a finished collection.
      </p>
      <ul className="mt-6 grid gap-3 sm:grid-cols-2">
        {HOME_FEATURES.map(({ icon: Icon, title, body }) => (
          <li key={title} className="rounded-2xl p-4 border border-white/10 bg-white/[0.04]">
            <div className="flex items-center gap-2">
              <Icon aria-hidden="true" className="w-4 h-4 shrink-0 text-amethyst-glow" />
              <h3 className="text-white text-sm font-semibold">{title}</h3>
            </div>
            <p className="text-white/65 text-[13px] leading-relaxed mt-1.5">{body}</p>
          </li>
        ))}
      </ul>
      <p className="text-center mt-6">
        <Link
          to="/demo"
          className="inline-block text-sm font-semibold text-amethyst-glow underline underline-offset-4 hover:text-white rounded px-2 py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amethyst-glow"
        >
          Try the demo, no account needed
        </Link>
      </p>
    </section>
  );
}
