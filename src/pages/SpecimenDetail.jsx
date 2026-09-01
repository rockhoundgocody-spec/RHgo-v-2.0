import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import {
  Calendar, MapPin, Star, Gem,
  Zap, TrendingUp, ChevronLeft, BookOpen, BadgeCheck, Loader2
} from 'lucide-react';
import GlassPanel from '@/components/visuals/GlassPanel.jsx';
import ShareSpecimenButton from '@/components/collection/ShareSpecimenButton.jsx';

const RARITY_CONFIG = {
  common:    { label: 'Common',    color: '#94a3b8', glow: 'hsla(215,20%,55%,0.35)',  gradient: 'from-slate-900 to-slate-800',   border: 'border-white/10' },
  uncommon:  { label: 'Uncommon',  color: '#34d399', glow: 'hsla(160,80%,50%,0.4)',   gradient: 'from-emerald-950 to-slate-900', border: 'border-emerald-400/25' },
  rare:      { label: 'Rare',      color: '#38bdf8', glow: 'hsla(200,90%,60%,0.45)',  gradient: 'from-sky-950 to-slate-900',     border: 'border-sky-400/30' },
  legendary: { label: 'Legendary', color: '#a78bfa', glow: 'hsla(270,80%,65%,0.55)', gradient: 'from-violet-950 to-slate-900',  border: 'border-amethyst/40' },
};

const EVOLUTION_STAGES = [
  { level: 0, label: 'Unknown Rock',   icon: '❓', desc: 'Not yet identified.' },
  { level: 1, label: 'Identified',     icon: '🔍', desc: 'AI has named this specimen.' },
  { level: 2, label: 'Verified',       icon: '✅', desc: 'Confidence confirmed above 80%.' },
  { level: 3, label: 'Documented',     icon: '📋', desc: 'Field notes and context recorded.' },
  { level: 4, label: 'Museum Grade',   icon: '🏛️', desc: 'Fully documented, verified, and preserved.' },
];

function getEvolutionLevel(s) {
  if (!s.mineral_name || s.mineral_name === 'Unknown') return 0;
  if (!s.ai_confidence) return 1;
  if (s.verified) return 4;
  if (s.notes && s.ai_confidence > 0.8) return 3;
  if (s.ai_confidence > 0.5) return 2;
  return 1;
}

function buildLore(specimen) {
  const name = specimen.mineral_name?.toLowerCase() || '';
  const ageMap = {
    quartz: '2.5 billion', flint: '70 million', obsidian: '10,000',
    fluorite: '300 million', calcite: '250 million', pyrite: '180 million',
    feldspar: '1.5 billion', mica: '450 million',
  };
  const matchedAge = Object.keys(ageMap).find((k) => name.includes(k));
  const age = matchedAge ? ageMap[matchedAge] : '280 million';
  const loc = specimen.found_at || (specimen.lat ? `${specimen.lat.toFixed(3)}°N, ${specimen.lng?.toFixed(3)}°W` : 'an undisclosed location');
  return `This specimen formed approximately ${age} years ago under immense geological pressure. Discovered at ${loc}, it carries a unique crystalline memory of the conditions that shaped it. No two specimens are exactly alike — each is a fingerprint of the Earth itself.`;
}

function buildHistoricalNote(specimen) {
  const name = specimen.mineral_name?.toLowerCase() || '';
  if (name.includes('quartz'))   return 'Quartz was once believed to be permanently frozen water by ancient Greeks. Its piezoelectric properties power every modern clock and smartphone.';
  if (name.includes('flint'))    return 'Flint shaped human civilization. Used for tools and fire-starting for 2.5 million years — the original technology.';
  if (name.includes('fluorite')) return 'The word "fluorescence" comes from fluorite — scientists discovered its glow under UV light in 1852. Illinois was once the world\'s largest producer.';
  if (name.includes('pyrite'))   return 'Pyrite — Fool\'s Gold — caused entire gold rushes. But pyrite is actually a semiconductor used in solar cell research today.';
  if (name.includes('obsidian')) return 'Obsidian blades hold edges sharper than surgical steel. Ancient Mesoamerican surgeons used them for precise incisions.';
  if (name.includes('calcite'))  return 'Calcite birefringence (double refraction) was used by Vikings for navigation as a "sunstone" — locating the sun even on cloudy days.';
  return 'Geological specimens like this have been collected and studied since ancient times, each one a window into the deep history of our planet.';
}

export default function SpecimenDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('story');
  const [verifying, setVerifying] = useState(false);
  const queryClient = useQueryClient();

  const { data: specimen, isLoading } = useQuery({
    queryKey: ['specimen', id],
    queryFn: () => base44.entities.Specimen.filter({ id }),
    select: (rows) => rows?.[0],
    enabled: !!id,
  });

  const handleVerify = async () => {
    if (verifying || !id) return;
    setVerifying(true);
    try {
      await base44.functions.invoke('progressiveVerify', { specimen_id: id });
      await base44.entities.Specimen.update(id, { verified: true });
      queryClient.invalidateQueries(['specimen', id]);
    } catch (e) {
      console.error('Verification failed:', e);
    } finally {
      setVerifying(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-amethyst/20 border-t-amethyst-glow rounded-full animate-spin" />
      </div>
    );
  }

  if (!specimen) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 text-white/40 px-6 text-center">
        <Gem size={40} className="opacity-30" />
        <p>Specimen not found.</p>
        <button onClick={() => navigate(-1)} className="text-amethyst-glow text-sm">← Go back</button>
      </div>
    );
  }

  const rarity = RARITY_CONFIG[specimen.rarity] || RARITY_CONFIG.common;
  const evoLevel = getEvolutionLevel(specimen);
  const evoStage = EVOLUTION_STAGES[evoLevel];
  const purity = specimen.ai_confidence ? (specimen.ai_confidence * 100).toFixed(0) : null;
  const collectionScore = specimen.ai_confidence
    ? ((specimen.ai_confidence * 0.7 + (evoLevel / 4) * 0.3) * 5).toFixed(1)
    : null;

  const conf = specimen.ai_confidence;
  const confLabel = conf == null ? null
    : conf >= 0.88 ? 'Near Certain'
    : conf >= 0.72 ? 'High Confidence'
    : conf >= 0.52 ? 'Moderate — field test recommended'
    : 'Uncertain — verify before recording';
  const confColor = conf == null ? '#94a3b8'
    : conf >= 0.88 ? '#34d399'
    : conf >= 0.72 ? '#38bdf8'
    : conf >= 0.52 ? '#fbbf24'
    : '#f87171';

  const tabs = [
    { key: 'story',   label: 'Story' },
    { key: 'science', label: 'Science' },
    { key: 'history', label: 'History' },
  ];

  return (
    <div className="min-h-screen pb-32" style={{ background: 'hsl(240 20% 4%)' }}
      // reveal: framer not needed here, CSS transition on mount is enough
    >
      {/* Back nav */}
      <div className="absolute top-0 inset-x-0 z-10 px-4 pt-4 flex items-center gap-3 pointer-events-none">
        <button onClick={() => navigate(-1)}
          className="pointer-events-auto w-9 h-9 rounded-full flex items-center justify-center transition active:scale-90"
          style={{ background: 'hsla(220,40%,5%,0.75)', border: '1px solid hsla(0,0%,100%,0.12)', backdropFilter: 'blur(16px)' }}
          aria-label="Go back">
          <ChevronLeft size={16} className="text-white/70" />
        </button>
      </div>
      {/* Hero image */}
      <div className="relative w-full aspect-[4/3] max-h-72 overflow-hidden">
        {specimen.image_url ? (
          <img
            src={specimen.image_url}
            alt={specimen.mineral_name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center"
            style={{ background: `radial-gradient(ellipse at center, ${rarity.glow} 0%, hsl(240,20%,6%) 60%)` }}>
            <Gem size={72} style={{ color: rarity.color, opacity: 0.5 }} />
          </div>
        )}

        {/* Gradient fade to page bg */}
        <div className="absolute inset-0 bg-gradient-to-t from-[hsl(240,20%,4%)] via-transparent to-transparent" />

        {/* Rarity glow overlay */}
        <div className="absolute inset-0 mix-blend-screen pointer-events-none"
          style={{ background: `radial-gradient(ellipse at 50% 100%, ${rarity.glow} 0%, transparent 60%)` }} />

        {/* Top chrome */}
        <div className="absolute top-0 inset-x-0 h-16 bg-gradient-to-b from-black/40 to-transparent" />

        {/* Rarity badge */}
        <div className="absolute top-4 right-4 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-[0.25em]"
          style={{ background: 'hsla(220,40%,5%,0.9)', color: rarity.color, border: `1px solid ${rarity.color}40` }}>
          {rarity.label}
        </div>
      </div>

      {/* Main content */}
      <div className="px-4 -mt-6 max-w-md mx-auto space-y-4">

        {/* Identity block */}
        <div>
          <div className="text-[10px] font-mono uppercase tracking-[0.35em] mb-1" style={{ color: rarity.color }}>
            Specimen · {specimen.id?.slice(-6).toUpperCase()}
          </div>
          <h1 className="text-3xl font-black text-white leading-tight">
            {specimen.mineral_name}
          </h1>
          {specimen.common_name && specimen.common_name !== specimen.mineral_name && (
            <div className="text-white/45 text-sm mt-0.5">{specimen.common_name}</div>
          )}

          {/* Location + date */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2">
            {specimen.found_date && (
              <span className="flex items-center gap-1 text-[11px] text-white/40">
                <Calendar size={10} /> {specimen.found_date}
              </span>
            )}
            {specimen.found_at && (
              <span className="flex items-center gap-1 text-[11px] text-white/40">
                <MapPin size={10} /> {specimen.found_at}
              </span>
            )}
          </div>
        </div>

        {/* Honest AI confidence banner */}
        {conf != null && (
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
            style={{ background: `${confColor}10`, border: `1px solid ${confColor}35` }}>
            <span className="text-base flex-shrink-0">{conf >= 0.72 ? '✅' : '⚠️'}</span>
            <div className="flex-1 min-w-0">
              <div className="text-[10px] font-bold uppercase tracking-[0.15em]" style={{ color: confColor }}>
                AI: {confLabel}
              </div>
              {conf < 0.72 && (
                <div className="text-[9px] text-white/35 mt-0.5">Run a hardness or streak test to confirm.</div>
              )}
            </div>
            <div className="text-lg font-black tabular-nums" style={{ color: confColor }}>{purity}%</div>
          </div>
        )}

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2">
          <StatBlock
            icon={<Zap size={14} />}
            label="Purity"
            value={purity ? `${purity}%` : '—'}
            color={rarity.color}
          />
          <StatBlock
            icon={<Star size={14} />}
            label="Score"
            value={collectionScore ? `${collectionScore}★` : '—'}
            color={rarity.color}
          />
          <StatBlock
            icon={<TrendingUp size={14} />}
            label="AI Match"
            value={specimen.ai_confidence ? `${(specimen.ai_confidence * 100).toFixed(0)}%` : '—'}
            color={rarity.color}
          />
        </div>

        {/* Action buttons */}
        <div className="grid grid-cols-2 gap-2">
          {[
            { icon: '➕', label: 'Add to Collection', color: '#34d399', bg: 'hsla(160,50%,12%,0.6)', border: 'hsla(160,70%,45%,0.3)' },
            { icon: '🛡️', label: 'Mark Private', color: '#c084fc', bg: 'hsla(265,50%,12%,0.6)', border: 'hsla(280,60%,50%,0.3)' },
          ].map(({ icon, label, color, bg, border }) => (
            <button key={label}
              className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-[11px] font-semibold transition active:scale-95 min-h-[44px]"
              style={{ background: bg, border: `1px solid ${border}`, color }}>
              <span>{icon}</span>
              <span className="leading-tight text-left">{label}</span>
            </button>
          ))}
          <button
            onClick={handleVerify}
            disabled={verifying || specimen?.verified}
            className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-[11px] font-semibold transition active:scale-95 min-h-[44px] disabled:opacity-50"
            style={{ background: 'hsla(150,60%,12%,0.6)', border: '1px solid hsla(150,80%,45%,0.35)', color: '#34d399' }}
          >
            {verifying ? <Loader2 size={14} className="animate-spin" /> : <BadgeCheck size={14} />}
            <span className="leading-tight text-left">{specimen?.verified ? 'Verified ✓' : 'Request Verification'}</span>
          </button>
          <button
            onClick={() => navigate('/scan')}
            className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-[11px] font-semibold transition active:scale-95 min-h-[44px]"
            style={{ background: 'hsla(205,60%,12%,0.6)', border: '1px solid hsla(195,80%,50%,0.3)', color: '#38bdf8' }}
          >
            <span>🧪</span>
            <span className="leading-tight text-left">Run Field Test</span>
          </button>
        </div>

        {/* Evolution tracker */}
        <GlassPanel className="p-4">
          <div className="text-[10px] uppercase tracking-[0.25em] text-white/40 mb-3 font-semibold">
            Evolution Stage
          </div>
          <div className="flex items-center gap-0 mb-3">
            {EVOLUTION_STAGES.map((stage, i) => {
              const reached = evoLevel >= stage.level;
              const isCurrent = evoLevel === stage.level;
              return (
                <React.Fragment key={stage.level}>
                  <div className="flex flex-col items-center gap-1">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm border-2 transition-all ${
                        reached
                          ? isCurrent
                            ? 'border-white/60 shadow-lg scale-110'
                            : 'border-white/30'
                          : 'border-white/10 opacity-30'
                      }`}
                      style={reached ? { borderColor: rarity.color, boxShadow: isCurrent ? `0 0 12px ${rarity.color}80` : 'none' } : {}}
                    >
                      <span className="text-xs">{stage.icon}</span>
                    </div>
                    <span className={`text-[7px] uppercase tracking-wide text-center leading-none w-10 ${reached ? 'text-white/60' : 'text-white/20'}`}>
                      {stage.label.split(' ')[0]}
                    </span>
                  </div>
                  {i < EVOLUTION_STAGES.length - 1 && (
                    <div className={`flex-1 h-0.5 mb-4 mx-0.5 ${evoLevel > i ? 'opacity-60' : 'opacity-10'}`}
                      style={{ background: rarity.color }} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg"
            style={{ background: `${rarity.color}12`, border: `1px solid ${rarity.color}25` }}>
            <span className="text-base">{evoStage.icon}</span>
            <div>
              <div className="text-xs font-bold" style={{ color: rarity.color }}>{evoStage.label}</div>
              <div className="text-[10px] text-white/40">{evoStage.desc}</div>
            </div>
          </div>

          {/* How to evolve */}
          {evoLevel < 4 && (
            <div className="mt-3 space-y-1">
              <div className="text-[9px] uppercase tracking-[0.2em] text-white/25 font-semibold">To reach next stage:</div>
              {evoLevel === 0 && <NextStep text="Scan this specimen with the AI scanner" />}
              {evoLevel === 1 && <NextStep text="Verify with 80%+ confidence or add field context" />}
              {evoLevel === 2 && <NextStep text="Add detailed field notes and location data" />}
              {evoLevel === 3 && <NextStep text="Get verified by the community or an expert" />}
            </div>
          )}
        </GlassPanel>

        {/* Tab content */}
        <GlassPanel className="overflow-hidden">
          {/* Tab bar */}
          <div className="flex border-b border-white/8">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={`flex-1 py-2.5 text-[10px] uppercase tracking-[0.25em] font-semibold transition-all ${
                  activeTab === t.key
                    ? 'text-white border-b-2'
                    : 'text-white/30 hover:text-white/60'
                }`}
                style={activeTab === t.key ? { borderColor: rarity.color } : {}}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="p-4">
            {activeTab === 'story' && (
              <div className="space-y-3">
                <p className="text-white/65 text-[12px] leading-relaxed">
                  {buildLore(specimen)}
                </p>
                {specimen.notes && (
                  <div className="rounded-lg p-3 bg-white/3 border border-white/8">
                    <div className="text-[9px] uppercase tracking-[0.2em] text-white/30 mb-1.5 font-semibold">Your Field Notes</div>
                    <p className="text-white/60 text-[11px] leading-relaxed italic">"{specimen.notes}"</p>
                  </div>
                )}
                {specimen.weather?.condition && (
                  <div className="flex items-center gap-2 text-[10px] text-white/35">
                    <span>🌤</span>
                    <span>Found in: {specimen.weather.condition}, {specimen.weather.temperature_f}°F</span>
                  </div>
                )}
                {specimen.lunar_phase?.phase_name && (
                  <div className="flex items-center gap-2 text-[10px] text-white/35">
                    <span>🌙</span>
                    <span>Lunar phase: {specimen.lunar_phase.phase_name}</span>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'science' && (
              <div className="space-y-3">
                {specimen.ai_candidates?.length > 0 && (
                  <div>
                    <div className="text-[9px] uppercase tracking-[0.2em] text-white/30 mb-2 font-semibold">AI Candidates</div>
                    <div className="space-y-1.5">
                      {specimen.ai_candidates.slice(0, 4).map((c, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full rounded-full transition-all"
                              style={{ width: `${((c.confidence || c.score || 0) * 100)}%`, background: rarity.color }} />
                          </div>
                          <span className="text-[10px] text-white/60 w-24 truncate text-right">{c.name || c.label}</span>
                          <span className="text-[9px] text-white/30 w-8 text-right">
                            {((c.confidence || c.score || 0) * 100).toFixed(0)}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <SciBlock label="Rarity" value={rarity.label} color={rarity.color} />
                  <SciBlock label="Confidence" value={purity ? `${purity}%` : 'Unknown'} color={rarity.color} />
                  <SciBlock label="Evolution" value={`Lv ${evoLevel}/4`} color={rarity.color} />
                  <SciBlock label="Score" value={collectionScore ? `${collectionScore}/5` : 'Unrated'} color={rarity.color} />
                </div>

                {(specimen.lat || specimen.lng) && (
                  <div className="text-[10px] text-white/30 font-mono text-center pt-1">
                    📍 {specimen.lat?.toFixed(4)}°N · {specimen.lng?.toFixed(4)}°W
                  </div>
                )}
              </div>
            )}

            {activeTab === 'history' && (
              <div className="space-y-3">
                <p className="text-white/65 text-[12px] leading-relaxed">
                  {buildHistoricalNote(specimen)}
                </p>
                <div className="flex items-start gap-2 p-3 rounded-lg bg-amethyst-deep/15 border border-amethyst/20">
                  <span className="text-base mt-0.5">💡</span>
                  <p className="text-white/50 text-[11px] leading-relaxed">
                    Did you know? You can learn more about this mineral by asking Clover — tap the orb on the Hub and say the mineral name.
                  </p>
                </div>
              </div>
            )}
          </div>
        </GlassPanel>

        {/* Actions */}
        <div className="flex gap-2">
          <ShareSpecimenButton specimen={specimen} />
        </div>

        {/* Field journal export CTA */}
        <div className="mt-4 rounded-2xl p-4 flex items-center gap-3 cursor-pointer active:scale-[0.99] transition-transform"
          style={{ background: 'hsla(270,40%,15%,0.4)', border: '1px solid hsla(280,50%,55%,0.18)' }}>
          <BookOpen size={16} className="text-amethyst-glow flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="text-white/80 text-sm font-semibold">Add to Field Journal</div>
            <div className="text-white/35 text-xs mt-0.5">Export this specimen's full record as a field note — coming soon.</div>
          </div>
          <ChevronLeft size={14} className="text-white/25 rotate-180" />
        </div>
      </div>
    </div>
  );
}

function StatBlock({ icon, label, value, color }) {
  return (
    <div className="rounded-xl p-3 text-center border border-white/8 bg-white/3">
      <div className="flex justify-center mb-1" style={{ color }}>{icon}</div>
      <div className="text-sm font-bold text-white">{value}</div>
      <div className="text-[9px] uppercase tracking-[0.2em] text-white/30 mt-0.5">{label}</div>
    </div>
  );
}

function SciBlock({ label, value, color }) {
  return (
    <div className="rounded-lg p-2.5 bg-white/3 border border-white/8">
      <div className="text-[8px] uppercase tracking-[0.2em] text-white/25 mb-0.5">{label}</div>
      <div className="text-xs font-bold" style={{ color }}>{value}</div>
    </div>
  );
}

function NextStep({ text }) {
  return (
    <div className="flex items-center gap-1.5 text-[10px] text-white/40">
      <span className="w-1 h-1 rounded-full bg-white/20 shrink-0" />
      {text}
    </div>
  );
}