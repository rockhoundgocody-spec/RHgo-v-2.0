/**
 * MapSearchBar — search hotspots by name, state, or mineral.
 * Shows a dropdown of matching results; selecting one flies the map
 * to that hotspot and opens its detail sheet.
 */
import React, { useState, useMemo, useRef, useEffect, useId } from 'react';
import { Search, X, MapPin, SearchX } from 'lucide-react';

export default function MapSearchBar({ hotspots, onSelect }) {
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef(null);
  const listboxId = useId();

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return hotspots
      .filter(h =>
        h.name?.toLowerCase().includes(q) ||
        h.state?.toLowerCase().includes(q) ||
        (h.minerals || []).some(m => m.toLowerCase().includes(q))
      )
      .slice(0, 6);
  }, [query, hotspots]);

  const isOpen = focused && query.trim().length > 0;

  useEffect(() => {
    setActiveIndex(-1);
  }, [query]);

  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setFocused(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSelect = (h) => {
    onSelect(h);
    setQuery('');
    setFocused(false);
  };

  const handleKeyDown = (e) => {
    if (!isOpen) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(prev => (prev < results.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(prev => (prev > 0 ? prev - 1 : results.length - 1));
    } else if (e.key === 'Enter' && activeIndex >= 0 && results[activeIndex]) {
      e.preventDefault();
      handleSelect(results[activeIndex]);
    } else if (e.key === 'Escape') {
      setFocused(false);
    }
  };

  const activeOptionId = activeIndex >= 0 && results[activeIndex]
    ? `${listboxId}-opt-${activeIndex}`
    : undefined;

  return (
    <div ref={containerRef} className="relative w-full">
      <div
        className="flex items-center px-3 py-2 rounded-2xl transition-all"
        style={{
          background: 'hsla(240,30%,8%,.92)',
          border: `1px solid ${focused ? 'hsla(280,80%,70%,.5)' : 'hsla(270,30%,40%,.3)'}`,
          backdropFilter: 'blur(20px)',
          boxShadow: focused ? '0 0 16px hsla(280,80%,50%,0.15)' : 'none',
        }}
      >
        <Search size={15} className="text-white/40 shrink-0" aria-hidden="true" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onKeyDown={handleKeyDown}
          role="combobox"
          aria-expanded={isOpen}
          aria-autocomplete="list"
          aria-controls={listboxId}
          aria-activedescendant={activeOptionId}
          placeholder="Search hotspots, minerals, states…"
          aria-label="Search hotspots, minerals, states"
          className="flex-1 bg-transparent text-[12px] text-white/80 placeholder-white/30 outline-none focus-visible:ring-2 focus-visible:ring-amethyst-glow/50 ml-2"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            aria-label="Clear search"
            className="text-white/30 hover:text-white/60 transition shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 rounded-sm"
          >
            <X size={14} aria-hidden="true" />
          </button>
        )}
      </div>

      {isOpen && (
        <div
          id={listboxId}
          role="listbox"
          aria-label="Search results"
          className="absolute top-full mt-1.5 left-0 right-0 rounded-2xl overflow-hidden z-[1001]"
          style={{
            background: 'hsla(240,30%,8%,.97)',
            border: '1px solid hsla(270,30%,40%,.3)',
            backdropFilter: 'blur(24px)',
            boxShadow: '0 12px 40px hsla(240,50%,5%,.6)',
          }}
        >
          {results.length > 0 ? (
            results.map((h, index) => {
              const isSelected = activeIndex === index;
              return (
                <button
                  key={h.id}
                  id={`${listboxId}-opt-${index}`}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => handleSelect(h)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-left transition border-b border-white/5 last:border-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amethyst-glow/50 relative z-10 ${isSelected ? 'bg-white/10' : 'hover:bg-white/5'}`}
                >
                  <MapPin size={13} className="text-amethyst-glow shrink-0" aria-hidden="true" />
                  <div className="min-w-0 flex-1">
                    <div className="text-[12px] font-semibold text-white/85 truncate">{h.name}</div>
                    <div className="text-[10px] text-white/40 truncate">
                      {h.state || '—'} · {(h.minerals || []).slice(0, 3).join(', ')}
                    </div>
                  </div>
                </button>
              );
            })
          ) : (
            <div className="p-3 text-center text-white/50 text-[11px] flex items-center justify-center gap-2" role="status">
              <SearchX size={14} className="text-white/40" aria-hidden="true" />
              <span>No matching hotspots found</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
