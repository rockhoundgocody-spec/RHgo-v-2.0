import React from 'react';
import { Link } from 'react-router-dom';
import { Check, Lock } from 'lucide-react';
import { FEATURES } from '@/lib/featureProgression';

/**
 * Bragging map of wings crawled vs still sealed. Core loop is always lit.
 */
export default function CrawlAtlas({ level, crawled = [] }) {
  const crawledSet = new Set(crawled);
  const wings = FEATURES.filter((f) => !f.core);

  return (
    <section className="px-5 mt-8 pb-4">
      <h2 className="text-white/35 text-[10px] font-medium uppercase tracking-[0.22em] mb-3">Atlas crawled</h2>
      <div className="grid grid-cols-2 gap-2">
        {wings.map((f) => {
          const open = level >= f.minLevel;
          const seen = crawledSet.has(f.id);
          return (
            <Link
              key={f.id}
              to={open ? f.path : '/scan'}
              className="rounded-2xl px-3 py-3 min-h-[72px] flex flex-col justify-between"
              style={{
                background: seen
                  ? 'hsla(160,40%,12%,0.7)'
                  : open
                    ? 'hsla(265,35%,12%,0.8)'
                    : 'hsla(240,20%,8%,0.7)',
                border: `1px solid ${seen ? 'hsla(160,60%,40%,0.35)' : open ? 'hsla(280,50%,45%,0.28)' : 'hsla(0,0%,100%,0.08)'}`,
                opacity: open ? 1 : 0.72,
              }}
            >
              <div className="flex items-start justify-between gap-2">
                <span className="text-white text-[12px] font-semibold leading-tight">{f.label}</span>
                {seen ? (
                  <Check size={12} className="text-emerald-400 shrink-0" />
                ) : (
                  <Lock size={11} className="text-white/35 shrink-0" />
                )}
              </div>
              <span className="text-[9px] uppercase tracking-wider mt-2" style={{ color: seen ? '#34d399' : 'hsla(0,0%,100%,0.35)' }}>
                {seen ? 'Crawled' : open ? 'Open — first footing waits' : `Sealed · Lv ${f.minLevel}`}
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
