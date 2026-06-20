import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ChevronRight } from 'lucide-react';

// ── AGATE AGE GATE ────────────────────────────────────────────────────────────
// A secret behavioral test disguised as a fun quiz. Kids and pros answer
// differently — the result sets kid/pro mode for the session.
const AGE_GATE_QUESTIONS = [
  {
    q: "You find a shiny purple rock. What do you do first?",
    answers: [
      { text: "🤩 Take a picture immediately!", kid: true },
      { text: "🔍 Check hardness & streak test", kid: false },
      { text: "📖 Look it up in a field guide", kid: false },
      { text: "😱 Show everyone around me!", kid: true },
    ]
  },
  {
    q: "What's your rockhounding style?",
    answers: [
      { text: "🧪 Scientific — I love geology data", kid: false },
      { text: "🎮 Explorer — it's an adventure!", kid: true },
      { text: "💰 Collector — value & rarity matter", kid: false },
      { text: "🌈 I just think rocks are SO cool", kid: true },
    ]
  }
];

function AgateAgeGate({ onComplete }) {
  const [qIdx, setQIdx] = useState(0);
  const [kidPoints, setKidPoints] = useState(0);
  const [selected, setSelected] = useState(null);
  const [shaking, setShaking] = useState(false);

  const current = AGE_GATE_QUESTIONS[qIdx];

  const pick = (answer, idx) => {
    if (selected !== null) return;
    setSelected(idx);
    if (answer.kid) {
      setShaking(true);
      setTimeout(() => setShaking(false), 500);
    }
    setTimeout(() => {
      const newKidPts = kidPoints + (answer.kid ? 1 : 0);
      if (qIdx < AGE_GATE_QUESTIONS.length - 1) {
        setQIdx(q => q + 1);
        setSelected(null);
        setKidPoints(newKidPts);
      } else {
        // Behaviorally: 2+ kid answers = kid mode
        const isKidMode = newKidPts >= 2;
        localStorage.setItem('rhgo_mode', isKidMode ? 'kid' : 'pro');
        onComplete(isKidMode);
      }
    }, 420);
  };

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center px-6"
      style={{ background: 'radial-gradient(ellipse at 60% 30%, hsla(280,80%,15%,0.9) 0%, hsla(240,30%,4%,1) 70%)' }}>

      {/* Crystal decoration */}
      <div className="absolute top-16 left-8 text-4xl opacity-30 rotate-12">💎</div>
      <div className="absolute top-24 right-10 text-3xl opacity-20 -rotate-6">🔮</div>
      <div className="absolute bottom-32 left-12 text-2xl opacity-25 rotate-45">✨</div>

      {/* Progress */}
      <div className="flex gap-2 mb-8">
        {AGE_GATE_QUESTIONS.map((_, i) => (
          <div key={i} className="h-1.5 w-12 rounded-full transition-all duration-300"
            style={{ background: i <= qIdx ? 'hsl(280,80%,65%)' : 'hsla(0,0%,100%,0.12)' }} />
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={qIdx}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -16 }}
          transition={{ duration: 0.28 }}
          className="w-full max-w-sm"
        >
          {/* Secret header — looks like a fun quiz, not an age gate */}
          <div className="text-center mb-8">
            <div className="text-5xl mb-4">🪨</div>
            <p className="text-white/40 text-[11px] uppercase tracking-[0.3em] mb-2">Quick crystal quiz</p>
            <h2 className="text-xl font-black text-white leading-snug">{current.q}</h2>
          </div>

          <div className="space-y-3">
            {current.answers.map((a, i) => (
              <motion.button
                key={i}
                onClick={() => pick(a, i)}
                whileTap={{ scale: 0.97 }}
                animate={selected === i ? { scale: [1, 1.04, 1] } : {}}
                className="w-full text-left px-4 py-3.5 rounded-2xl text-sm font-semibold text-white/90 transition-all"
                style={{
                  background: selected === i
                    ? 'linear-gradient(135deg, hsla(280,80%,35%,0.8), hsla(265,70%,25%,0.9))'
                    : 'hsla(255,30%,14%,0.7)',
                  border: selected === i
                    ? '1px solid hsla(280,80%,65%,0.6)'
                    : '1px solid hsla(255,30%,30%,0.25)',
                  boxShadow: selected === i ? '0 0 20px hsla(280,80%,55%,0.25)' : 'none',
                  backdropFilter: 'blur(12px)',
                }}
              >
                {a.text}
              </motion.button>
            ))}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// ── TOUR STEPS ────────────────────────────────────────────────────────────────
const STEPS = [
  {
    id: 'welcome',
    emoji: '🍀',
    title: 'Your First Discovery Journey',
    subtitle: 'Built by collectors · for collectors',
    body: "Meet Clover — your geology guide, field intelligence companion, and mineral identification expert. Together you'll uncover what's hiding in the ground beneath your feet.",
    color: '#a78bfa',
    glow: 'hsla(270,80%,65%,0.6)',
  },
  {
    id: 'scan',
    emoji: '📷',
    title: 'Point. Snap. Identified.',
    subtitle: 'AI Field Scanner · Vision · 3D Reconstruct',
    body: 'Photograph any rock or mineral in the field. The AI cross-references color, texture, crystal structure, and locality — returning a calibrated confidence score, not a guess.',
    color: '#38bdf8',
    glow: 'hsla(195,100%,60%,0.6)',
    demo: 'scan',
  },
  {
    id: 'map',
    emoji: '🗺️',
    title: 'Find the Hot Zones',
    subtitle: 'BLM · State Parks · River Beds · Private',
    body: 'Explore a curated map of real collecting sites with land-access layers. Know what you can legally collect before you even leave the truck.',
    color: '#34d399',
    glow: 'hsla(160,70%,50%,0.6)',
    demo: 'map',
  },
  {
    id: 'stealth',
    emoji: '🛡️',
    title: 'Stealth Mode',
    subtitle: 'Your coordinates. Your secret.',
    body: "Your exact GPS coordinates are never shared publicly. Stealth Mode fuzzed your pins on the community map — sensitive sites stay hidden. Privacy is a first-class feature here.",
    color: '#34d399',
    glow: 'hsla(160,65%,50%,0.6)',
    demo: null,
  },
  {
    id: 'collect',
    emoji: '💎',
    title: 'Etch Your Liquid Codex',
    subtitle: 'Log · Catalog · Rank · Export',
    body: "Every specimen you identify enters your GeoDex with rarity grade, GPS context, weather, and lunar phase. Your collection is a living geological record — not just a photo album.",
    color: '#f0abfc',
    glow: 'hsla(290,85%,75%,0.6)',
    demo: 'collect',
  },
  {
    id: 'quests',
    emoji: '⚡',
    title: 'Field Missions & XP',
    subtitle: 'Ethics earn XP · Finds earn rank',
    body: "Complete daily field missions — verify specimens, run streak days, practice responsible collecting. XP rewards ethical behavior, not just quantity. Level up from Pebble Scout to Mythic Earth Wizard.",
    color: '#fbbf24',
    glow: 'hsla(45,90%,60%,0.6)',
    demo: 'quests',
  },
  {
    id: 'ready',
    emoji: '🪨',
    title: "The Ground is Waiting.",
    subtitle: "Let's make the first discovery",
    body: "Clover is online. Your GeoDex is empty and ready. The earth doesn't give up its specimens easily — but you have the tools now.",
    color: '#a78bfa',
    glow: 'hsla(270,80%,65%,0.7)',
  },
];

// ── DEMO COMPONENTS ───────────────────────────────────────────────────────────
function ScanDemo() {
  const [pulse, setPulse] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setPulse(p => (p + 1) % 3), 700);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="relative w-32 h-32 rounded-2xl overflow-hidden border border-sky-400/40 bg-black/40">
      <div className="absolute inset-0 flex items-center justify-center text-4xl">🪨</div>
      <motion.div
        animate={{ y: ['0%', '100%', '0%'] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: 'linear' }}
        className="absolute inset-x-0 h-0.5 bg-sky-400 shadow-[0_0_8px_2px_rgba(56,189,248,0.7)]"
        style={{ top: 0 }}
      />
      {[['top-1 left-1', 'border-t-2 border-l-2'], ['top-1 right-1', 'border-t-2 border-r-2'],
        ['bottom-1 left-1', 'border-b-2 border-l-2'], ['bottom-1 right-1', 'border-b-2 border-r-2']].map(([pos, border], i) => (
        <div key={i} className={`absolute ${pos} w-4 h-4 ${border} border-sky-400 rounded-sm`} />
      ))}
      <div className="absolute bottom-2 inset-x-0 text-center text-sky-300 text-[9px] font-mono tracking-widest">
        {['ANALYZING', 'MATCHING', 'IDENTIFIED'][pulse]}...
      </div>
    </div>
  );
}

function MapDemo() {
  return (
    <div className="relative w-32 h-32 rounded-2xl overflow-hidden border border-emerald-400/40 bg-slate-900/60">
      <div className="absolute inset-0 opacity-20"
        style={{ backgroundImage: 'linear-gradient(hsla(160,60%,50%,0.3) 1px,transparent 1px),linear-gradient(90deg,hsla(160,60%,50%,0.3) 1px,transparent 1px)', backgroundSize: '16px 16px' }} />
      {[{ x: '40%', y: '35%', size: 10 }, { x: '65%', y: '55%', size: 7 }, { x: '28%', y: '62%', size: 8 }].map((dot, i) => (
        <motion.div key={i}
          animate={{ scale: [1, 1.4, 1], opacity: [0.8, 1, 0.8] }}
          transition={{ duration: 1.5 + i * 0.3, repeat: Infinity, delay: i * 0.4 }}
          className="absolute rounded-full bg-emerald-400"
          style={{ left: dot.x, top: dot.y, width: dot.size, height: dot.size, transform: 'translate(-50%,-50%)', boxShadow: '0 0 8px 2px rgba(52,211,153,0.5)' }}
        />
      ))}
      <div className="absolute text-lg" style={{ left: '50%', top: '50%', transform: 'translate(-50%,-50%)' }}>📍</div>
    </div>
  );
}

function CollectDemo() {
  return (
    <div className="grid grid-cols-2 gap-2 w-32">
      {['💎', '🪨', '✨', '🟣'].map((g, i) => (
        <motion.div key={i}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: i * 0.15, type: 'spring', stiffness: 300 }}
          className="h-14 rounded-xl flex items-center justify-center text-2xl border border-fuchsia-400/30 bg-fuchsia-900/20"
        >{g}</motion.div>
      ))}
    </div>
  );
}

function QuestDemo() {
  const [progress, setProgress] = useState(40);
  useEffect(() => {
    const t = setInterval(() => setProgress(p => p >= 90 ? 40 : p + 5), 300);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="w-36 space-y-2">
      {['Find 3 Minerals', 'Visit a Hotspot'].map((q, i) => (
        <div key={i} className="px-3 py-2 rounded-xl bg-amber-900/30 border border-amber-400/25">
          <div className="text-amber-300 text-[10px] font-semibold mb-1.5">{q}</div>
          <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
            <motion.div
              animate={{ width: `${i === 0 ? progress : 100}%` }}
              transition={{ duration: 0.3 }}
              className="h-full rounded-full bg-amber-400"
            />
          </div>
        </div>
      ))}
    </div>
  );
}

const DEMOS = { scan: ScanDemo, map: MapDemo, collect: CollectDemo, quests: QuestDemo };

// ── MAIN ONBOARDING ───────────────────────────────────────────────────────────
export default function Onboarding() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState('gate'); // 'gate' | 'tour'
  const [step, setStep] = useState(0);
  const [kidMode, setKidMode] = useState(false);

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;
  const Demo = current?.demo ? DEMOS[current.demo] : null;

  const handleGateComplete = (isKid) => {
    setKidMode(isKid);
    setPhase('tour');
  };

  const handleNext = () => {
    if (isLast) {
      localStorage.setItem('rhgo_onboarded', '1');
      navigate('/');
    } else {
      setStep(s => s + 1);
    }
  };

  const handleSkip = () => {
    localStorage.setItem('rhgo_onboarded', '1');
    navigate('/');
  };

  if (phase === 'gate') {
    return <AgateAgeGate onComplete={handleGateComplete} />;
  }

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-between overflow-hidden"
      style={{ background: 'radial-gradient(ellipse at top, hsl(265 60% 12%) 0%, hsl(240 30% 5%) 45%, hsl(240 20% 3%) 100%)' }}>

      {/* Mode badge */}
      {kidMode && (
        <div className="absolute top-4 left-4 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] z-10"
          style={{ background: 'hsla(45,90%,50%,0.2)', border: '1px solid hsla(45,90%,60%,0.4)', color: '#fbbf24' }}>
          🌟 Explorer Mode
        </div>
      )}

      {/* Skip */}
      {!isLast && (
        <button onClick={handleSkip} className="absolute top-5 right-5 text-white/40 text-sm hover:text-white/70 transition z-10">
          Skip
        </button>
      )}

      {/* Step dots */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 flex gap-2 z-10">
        {STEPS.map((_, i) => (
          <motion.div key={i}
            animate={{ width: i === step ? 24 : 6, opacity: i === step ? 1 : 0.3 }}
            transition={{ duration: 0.3 }}
            className="h-1.5 rounded-full"
            style={{ background: current.color }}
          />
        ))}
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center w-full px-8 pt-16">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 40, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -40, scale: 0.95 }}
            transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="flex flex-col items-center text-center w-full max-w-sm"
          >
            {/* Orb */}
            <motion.div
              animate={{ scale: [1, 1.06, 1], filter: [`drop-shadow(0 0 20px ${current.color}80)`, `drop-shadow(0 0 40px ${current.color})`, `drop-shadow(0 0 20px ${current.color}80)`] }}
              transition={{ duration: 2.5, repeat: Infinity }}
              className="mb-6"
            >
              <div className="w-28 h-28 rounded-full flex items-center justify-center text-6xl"
                style={{
                  background: `radial-gradient(circle at 35% 35%, ${current.color}40, ${current.color}15)`,
                  border: `2px solid ${current.color}40`,
                  boxShadow: `0 0 50px ${current.color}40, inset 0 1px 0 ${current.color}50`,
                }}>
                {current.emoji}
              </div>
            </motion.div>

            {Demo && (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="mb-6">
                <Demo />
              </motion.div>
            )}

            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <div className="text-[11px] uppercase tracking-[0.3em] mb-2 font-semibold" style={{ color: current.color }}>
                {current.subtitle}
              </div>
              <h1 className="text-3xl font-black text-white mb-4" style={{ textShadow: `0 0 30px ${current.glow}` }}>
                {current.title}
              </h1>
              <p className="text-white/65 text-[15px] leading-relaxed">{current.body}</p>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* CTA */}
      <div className="w-full px-8 pb-12">
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={handleNext}
          className="w-full h-14 rounded-2xl text-white font-bold text-base flex items-center justify-center gap-2"
          style={{
            background: `linear-gradient(135deg, ${current.color}cc, ${current.color}88)`,
            boxShadow: `0 0 30px ${current.color}50, inset 0 1px 0 ${current.color}50`,
            border: `1px solid ${current.color}40`,
          }}
        >
          {isLast ? <><Sparkles size={18} /> Start Rockhounding!</> : <>Next <ChevronRight size={18} /></>}
        </motion.button>
        {!isLast && (
          <p className="text-center text-white/30 text-xs mt-4">{step + 1} of {STEPS.length}</p>
        )}
      </div>
    </div>
  );
}