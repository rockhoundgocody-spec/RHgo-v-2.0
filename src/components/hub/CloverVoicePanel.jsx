import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Loader2, Target, Gem, Keyboard, ChevronDown, ChevronUp, Minimize2, Sparkles, MapPin, NotebookPen, Route, Globe, Orbit, BookOpen, Home, Compass, Camera, Award } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { lookupMineralIntelligence, lookupTermIntelligence } from '@/lib/mindatApi';
import useKidMode from '@/lib/useKidMode';
import { getKidFriendlyMineral } from '@/lib/kidFriendlyData';
import { getTerminologyMastery } from '@/lib/cloverMemory';
import CloverVoiceControls from './CloverVoiceControls.jsx';
import CloverDailyTermQuiz from './CloverDailyTermQuiz.jsx';

const QUICK_TEST_PROMPTS = [
  { label: '🪨 Scratch Test', prompt: 'Walk me through a simple scratch test on my rock.' },
  { label: '🫧 Fizz Test', prompt: 'How do I do a vinegar fizz test for calcite vs quartz?' },
  { label: '🔥 Slag or Real?', prompt: 'How can I tell if this is industrial slag glass or a real mineral?' },
  { label: '⚖️ Streak & Heft', prompt: 'How do I check streak color and weight heft in the field?' },
  { label: '🔦 UV Glow', prompt: 'What does UV blacklight glow tell me about this rock?' },
  { label: '🗣️ Rock Slang', prompt: 'Teach me a fun piece of rockhound slang or slag terminology.' },
];

const KID_EASY_SCREENS = [
  { to: '/', label: 'Home', icon: Home },
  { to: '/explore', label: 'Map', icon: Compass },
  { to: '/scan', label: 'Scan', icon: Camera },
  { to: '/collection', label: 'My Rocks', icon: Gem },
  { to: '/badges', label: 'Badges', icon: Award },
];

/**
 * CloverVoicePanel — the conversation surface. Voice-first: no text box unless
 * the browser can't do speech input.
 */
export default function CloverVoicePanel({
  phase, messages, interim, onClose, onMinimize, compact = false, onHunt, huntLoading,
  suggestions, onDismissSuggestions, voiceSupported, onSend, onSpeak, onListen,
  muted, onToggleMute, onStop, getWaveBars, onOpenAbilities, resonanceClaimed,
}) {
  const transcriptRef = useRef(null);
  const [draft, setDraft] = useState('');
  const [expandedIntel, setExpandedIntel] = useState(false);
  const [quizOpen, setQuizOpen] = useState(false);
  const isKid = useKidMode();
  const navigate = useNavigate();
  const location = useLocation();
  const mastery = useMemo(() => getTerminologyMastery(), [quizOpen, messages.length]);

  const lastMsg = messages[messages.length - 1]?.content || '';
  const detectedMineral = useMemo(() => lookupMineralIntelligence(lastMsg), [lastMsg]);
  const detectedTerm = useMemo(() => lookupTermIntelligence(lastMsg), [lastMsg]);
  const kidMineral = useMemo(() => detectedMineral ? getKidFriendlyMineral(detectedMineral.name) : null, [detectedMineral]);

  // Scroll only the panel's internal transcript — never the page.
  // This keeps the orb in place while Clover talks.
  useEffect(() => {
    if (transcriptRef.current) {
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
    }
  }, [messages, interim, suggestions, detectedMineral, detectedTerm, expandedIntel, quizOpen]);

  const visibleMessages = compact ? messages.slice(-2) : messages;

  return (
    <div
      id="clover-voice-panel"
      role="region"
      aria-label="Clover Voice Companion"
      className={`${compact ? 'w-[244px]' : 'mt-3 w-full max-w-[280px]'} rounded-2xl overflow-hidden flex flex-col`}
      style={{
        background: 'hsla(255,30%,14%,0.96)',
        border: '1px solid hsla(270,50%,55%,0.25)',
        boxShadow: '0 8px 32px -8px hsla(270,80%,40%,0.38)',
        maxHeight: compact ? 295 : 335,
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-2.5 py-1.5 border-b border-white/8">
        <span className="text-[11px] font-semibold text-amethyst-glow tracking-wide flex items-center gap-1.5">
          Clover 🍀 {isKid && <span className="text-[9px] text-amber-300 font-bold">(Explorer Buddy)</span>}
        </span>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setQuizOpen((v) => !v)}
            aria-pressed={quizOpen}
            aria-label="Toggle daily rockhounding terminology quiz"
            className="relative flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-md transition active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hud-cyan/60"
            style={{
              background: quizOpen ? 'hsla(165,80%,40%,0.28)' : 'hsla(195,80%,45%,0.16)',
              border: '1px solid hsla(175,80%,60%,0.35)',
              color: '#9FE8D0',
            }}
          >
            <BookOpen size={10} />
            <span>Quiz</span>
            {!mastery.completedToday && (
              <span
                className="w-1.5 h-1.5 rounded-full bg-amber-300 animate-pulse"
                title="Today's terminology quiz is ready"
              />
            )}
          </button>
          {onHunt && !compact && (
            <button
              type="button"
              onClick={onHunt}
              disabled={huntLoading}
              className="flex items-center gap-1 text-[10px] font-semibold text-amethyst-glow disabled:opacity-40 active:scale-90 transition rounded px-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amethyst-glow/50"
              aria-label="Get hunt suggestions"
            >
              {huntLoading ? <Loader2 size={11} className="animate-spin" /> : <Target size={11} />}
              <span>Hunt</span>
            </button>
          )}
          {onMinimize && (
            <button
              type="button"
              onClick={onMinimize}
              aria-label="Minimize Clover panel while keeping conversation active"
              title="Minimize (keep talking)"
              className="p-1 rounded-md text-white/60 hover:text-white hover:bg-white/10 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amethyst-glow/50"
            >
              <Minimize2 size={12} />
            </button>
          )}
        </div>
      </div>

      {/* Super-Easy 1-Tap Screen Switcher so even a kid can hop anywhere */}
      <div
        className="grid grid-cols-5 gap-1 px-2 py-1.5 border-b border-white/8"
        role="navigation"
        aria-label="Quick screen navigation"
        style={{ background: 'hsla(245,28%,10%,0.65)' }}
      >
        {KID_EASY_SCREENS.map(({ to, label, icon: Icon }) => {
          const active = location.pathname === to || (to !== '/' && location.pathname.startsWith(to));
          return (
            <button
              key={to}
              type="button"
              onClick={() => navigate(to)}
              aria-current={active ? 'page' : undefined}
              className="flex flex-col items-center justify-center gap-0.5 py-1 rounded-lg text-[9.5px] font-bold transition active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hud-cyan/60"
              style={
                active
                  ? { background: 'hsla(165,80%,40%,0.25)', border: '1px solid #9FE8D0', color: '#9FE8D0' }
                  : { background: 'hsla(250,20%,18%,0.5)', border: '1px solid hsla(0,0%,100%,0.08)', color: 'rgba(255,255,255,0.75)' }
              }
            >
              <Icon size={12} />
              <span className="leading-none truncate max-w-full">{label}</span>
            </button>
          );
        })}
      </div>

      {/* Transcript — fixed height so Clover never shifts or jumps around while answering */}
      <div
        ref={transcriptRef}
        className="overflow-y-auto px-2.5 py-1.5 space-y-1.5"
        style={{ height: compact ? 88 : 112 }}
      >
        {visibleMessages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className="max-w-[92%] px-2.5 py-1.5 rounded-xl text-[11px] leading-snug"
              style={m.role === 'user'
                ? { background: 'hsla(270,60%,40%,0.4)', border: '1px solid hsla(270,60%,60%,0.2)', color: 'hsl(280,80%,93%)' }
                : { background: 'hsla(255,25%,20%,0.6)', border: '1px solid hsla(255,20%,40%,0.2)', color: 'rgba(255,255,255,0.82)' }}
            >
              {m.content}
              {m.role !== 'user' && m.sources?.length > 0 && <SourceChips sources={m.sources} />}
            </div>
          </div>
        ))}

        {/* Mindat Scientific Mineral Intelligence Card */}
        {detectedMineral && (
          <div
            className="rounded-xl p-2.5 space-y-1.5 transition-all text-[11px]"
            style={{
              background: 'hsla(270,40%,18%,0.75)',
              border: '1px solid hsla(280,70%,60%,0.35)',
            }}
          >
            <div
              role="button"
              tabIndex={0}
              aria-expanded={expandedIntel}
              aria-controls="mindat-intel-details"
              className="flex items-center justify-between cursor-pointer rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amethyst-glow/50"
              onClick={() => setExpandedIntel(!expandedIntel)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setExpandedIntel(!expandedIntel);
                }
              }}
            >
              <div className="flex items-center gap-1.5 font-bold text-amethyst-glow">
                <Gem size={12} />
                <span>Mindat: {detectedMineral.name}</span>
              </div>
              <span className="text-[9px] text-white/50 font-mono flex items-center gap-0.5">
                {detectedMineral.hardness} {expandedIntel ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              </span>
            </div>

            {kidMineral && (
              <div className="text-[10px] font-bold text-amber-300 flex items-center gap-1 pt-0.5">
                <Sparkles size={11} className="text-yellow-400" />
                <span>Superpower: {kidMineral.superpower}</span>
              </div>
            )}

            {expandedIntel && (
              <div id="mindat-intel-details" className="pt-1.5 space-y-1 text-[10px] text-white/70 border-t border-white/10">
                <div><span className="text-white/40">Formula:</span> <span className="font-mono text-cyan-300 font-semibold">{detectedMineral.formula}</span></div>
                <div><span className="text-white/40">System:</span> {detectedMineral.crystal_system}</div>
                <div><span className="text-white/40">Cleavage:</span> {detectedMineral.cleavage}</div>
                {detectedMineral.uv_fluorescence && (
                  <div><span className="text-amber-400 font-semibold">UV:</span> {detectedMineral.uv_fluorescence}</div>
                )}
                <div className="text-white/60 italic pt-0.5 leading-snug">{detectedMineral.field_test}</div>
              </div>
            )}
          </div>
        )}

        {/* Field Slang & Terminology Card when a term is mentioned */}
        {detectedTerm && !quizOpen && (
          <div
            className="rounded-xl p-2 space-y-1 text-[10.5px]"
            style={{
              background: 'hsla(195,45%,16%,0.75)',
              border: '1px solid hsla(185,80%,60%,0.32)',
            }}
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-hud flex items-center gap-1">
                <BookOpen size={11} />
                <span>Field Term: {detectedTerm.term}</span>
              </span>
              {detectedTerm.category && (
                <span className="text-[8.5px] font-mono uppercase tracking-wider text-amber-300/80">
                  {detectedTerm.category}
                </span>
              )}
            </div>
            <p className="text-[10px] text-white/75 leading-snug">{detectedTerm.meaning}</p>
          </div>
        )}

        {/* Daily Quick-Tap Rockhounding Terminology Quiz */}
        {quizOpen && (
          <CloverDailyTermQuiz
            onSpeak={onSpeak}
            onClose={() => setQuizOpen(false)}
          />
        )}

        {/* What she's hearing right now */}
        {interim && (
          <div className="flex justify-end">
            <div
              className="max-w-[90%] px-3 py-2 rounded-xl text-[11px] leading-relaxed italic"
              style={{ background: 'hsla(270,50%,35%,0.22)', border: '1px dashed hsla(270,60%,60%,0.25)', color: 'hsla(280,70%,90%,0.6)' }}
            >
              {interim}
            </div>
          </div>
        )}

        {phase === 'thinking' && (
          <div className="flex justify-start">
            <div className="px-3 py-2 rounded-xl" style={{ background: 'hsla(255,25%,20%,0.6)' }}>
              <Loader2 size={12} className="animate-spin opacity-50" />
            </div>
          </div>
        )}

        {suggestions && (
          <div className="rounded-xl overflow-hidden" style={{ background: 'hsla(270,40%,20%,0.35)', border: '1px solid hsla(280,80%,60%,0.3)' }}>
            <div
              className="px-3 py-2 text-[10px] font-bold text-amethyst-glow tracking-wide"
              style={{ borderBottom: '1px solid hsla(280,80%,60%,0.2)', background: 'hsla(270,60%,30%,0.25)' }}
            >
              🎯 Hunt Next — {suggestions.collection_size} in collection
            </div>
            <div className="space-y-2 p-2">
              {suggestions.clover_intro && (
                <p className="text-[10px] text-white/70 italic px-1">{suggestions.clover_intro}</p>
              )}
              {suggestions.suggestions.map((s, i) => (
                <div key={i} className="rounded-lg p-2" style={{ background: 'hsla(255,30%,14%,0.6)', border: '1px solid hsla(280,60%,50%,0.18)' }}>
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-[11px] font-bold text-amethyst-glow flex items-center gap-1">
                      <Gem size={9} /> {s.mineral_name}
                    </span>
                    {s.distance_mi != null && (
                      <span className="text-[8px] font-mono text-hud-cyan/70">{s.distance_mi}mi</span>
                    )}
                  </div>
                  {s.hotspot_name && <p className="text-[9px] text-hud-cyan/80 mb-1">📍 {s.hotspot_name}</p>}
                  <p className="text-[9px] text-white/65 leading-relaxed mb-1">{s.what_to_look_for}</p>
                  <p className="text-[9px] text-white/40 italic leading-relaxed">{s.why}</p>
                </div>
              ))}
              <button onClick={onDismissSuggestions} className="w-full text-[9px] text-white/35 hover:text-white/60 transition py-1 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amethyst-glow/50">
                Dismiss
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="px-3 py-2 border-t border-white/8 space-y-2">
        {onSend && (
          <div
            className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5"
            role="group"
            aria-label="Quick geological test prompts"
          >
            {QUICK_TEST_PROMPTS.map((chip) => (
              <button
                key={chip.label}
                type="button"
                disabled={phase === 'thinking'}
                onClick={() => onSend(chip.prompt)}
                className="shrink-0 px-2 py-1 rounded-lg text-[10px] font-mono font-semibold tracking-wide transition active:scale-95 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hud-cyan/60"
                style={{
                  background: 'hsla(195,85%,45%,0.14)',
                  border: '1px solid hsla(190,90%,65%,0.32)',
                  color: 'hsl(188,100%,82%)',
                }}
              >
                {chip.label}
              </button>
            ))}
          </div>
        )}
        <CloverVoiceControls
          phase={phase}
          muted={muted}
          onToggleMute={onToggleMute}
          onStop={onStop || onClose}
          onListen={onListen}
          getWaveBars={getWaveBars}
          onOpenAbilities={onOpenAbilities}
          resonanceClaimed={resonanceClaimed}
        />
        <div className="flex items-center gap-2">
          <Keyboard size={12} className="text-white/25 shrink-0" />
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && draft.trim()) { onSend(draft.trim()); setDraft(''); }
            }}
            aria-label="Type message to Clover"
            placeholder={voiceSupported ? 'Or type if it is noisy out' : "Voice isn't available — type"}
            className="flex-1 bg-transparent text-[11px] text-white/75 placeholder-white/25 outline-none rounded px-1.5 py-0.5 focus-visible:ring-2 focus-visible:ring-amethyst-glow/50"
          />
        </div>
      </div>
    </div>
  );
}

const SOURCE_ICONS = { specimen: Gem, site: MapPin, log: NotebookPen, expedition: Route, web: Globe };

/** Where Clover's answer came from — each chip opens the record. */
function SourceChips({ sources }) {
  const vaultFocus = sources.find((s) => s.type === 'specimen' || s.type === 'log' || s.type === 'site');
  return (
    <div className="mt-1.5 flex flex-wrap gap-1" aria-label="Sources">
      {sources.map((s) => {
        const Icon = SOURCE_ICONS[s.type] || Gem;
        const chip = (
          <span className="inline-flex items-center gap-1 max-w-[180px] px-1.5 py-0.5 rounded-md text-[9px] font-semibold"
            style={{ background: 'hsla(185,70%,40%,0.16)', border: '1px solid hsla(185,80%,60%,0.28)', color: 'hsl(185,80%,82%)' }}>
            <Icon size={9} className="shrink-0" />
            <span className="truncate">{s.label}{s.place ? ` · ${s.place}` : ''}</span>
          </span>
        );
        return s.route
          ? <Link key={s.key} to={s.route} className="rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hud-cyan/60">{chip}</Link>
          : <span key={s.key}>{chip}</span>;
      })}
      {vaultFocus && (
        <Link to={`/vault?focus=${encodeURIComponent(vaultFocus.id)}`}
          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-semibold text-amethyst-glow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amethyst-glow/50"
          style={{ background: 'hsla(275,60%,40%,0.18)', border: '1px solid hsla(280,70%,65%,0.3)' }}>
          <Orbit size={9} /> In the galaxy
        </Link>
      )}
    </div>
  );
}