import { useCallback, useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { hashEmail } from '@/lib/useSubscription';
import {
  FEATURES,
  crawlScore,
  featureForPath,
  getLevel,
  getTitle,
  isPathOpen,
  nextUnlock,
  xpNeededForLevel,
  xpToNext,
} from '@/lib/featureProgression';

const STORAGE_KEY = 'rhgo_crawled_v1';

function loadAllCrawls() {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function loadCrawled(email) {
  const all = loadAllCrawls();
  const key = hashEmail(email) || '_anon';
  return Array.isArray(all[key]) ? all[key] : [];
}

function saveCrawled(email, ids) {
  if (typeof localStorage === 'undefined') return;
  const all = loadAllCrawls();
  const key = hashEmail(email) || '_anon';
  all[key] = ids;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}

export function useFeatureProgression() {
  const { data: user } = useCurrentUser();
  const email = user?.email || null;

  const profileQuery = useQuery({
    queryKey: ['playerProfile', email],
    enabled: Boolean(email),
    queryFn: async () => {
      const rows = await base44.entities.PlayerProfile.filter({ owner_email: email });
      return rows?.[0] || { total_xp: 0 };
    },
    staleTime: 30_000,
  });

  const xp = Number(profileQuery.data?.total_xp) || 0;
  const level = getLevel(xp);
  const title = getTitle(level);
  const remaining = xpToNext(xp);
  const next = nextUnlock(level);

  const [crawled, setCrawled] = useState(() => loadCrawled(email));

  useEffect(() => {
    setCrawled(loadCrawled(email));
  }, [email]);

  const markCrawled = useCallback(async (featureId) => {
    if (!featureId || crawled.includes(featureId)) return false;
    const nextIds = [...crawled, featureId];
    setCrawled(nextIds);
    saveCrawled(email, nextIds);
    const feat = FEATURES.find((f) => f.id === featureId);
    if (feat?.crawlXp && email) {
      try {
        await base44.functions.invoke('awardXP', {
          amount: feat.crawlXp,
          reason: `First footing · ${feat.label}`,
        });
      } catch { /* stamp still counts locally */ }
    }
    return true;
  }, [crawled, email]);

  const score = useMemo(() => crawlScore(crawled), [crawled]);

  return {
    user,
    xp,
    level,
    title,
    remaining,
    next,
    crawled,
    markCrawled,
    score,
    isPathOpen: (pathname) => isPathOpen(pathname, level),
    featureForPath,
    xpNeededFor: (minLevel) => xpNeededForLevel(minLevel, xp),
    loading: profileQuery.isLoading,
  };
}
