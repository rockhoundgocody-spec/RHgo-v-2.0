import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Swords, Zap, Trophy, RefreshCw, X, Shield, Flame, Camera, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import BattleLeaderboard from './BattleLeaderboard.jsx';

// Rock fighters with stats derived from real mineral properties
const ROCK_FIGHTERS = [
  { id: 'quartz',    name: 'Quartz',    emoji: '🔷', hp: 85,  atk: 70, def: 65, spd: 75, ability: 'Crystal Strike',   color: '#38bdf8', rarity: 'common'   },
  { id: 'obsidian',  name: 'Obsidian',  emoji: '⚫', hp: 75,  atk: 90, def: 55, spd: 80, ability: 'Volcanic Slash',   color: '#6b7280', rarity: 'uncommon' },
  { id: 'amethyst',  name: 'Amethyst',  emoji: '💜', hp: 90,  atk: 65, def: 80, spd: 60, ability: 'Mystic Shield',    color: '#a78bfa', rarity: 'uncommon' },
  { id: 'pyrite',    name: 'Pyrite',    emoji: '✨', hp: 70,  atk: 85, def: 60, spd: 70, ability: "Fool's Gold Rush",  color: '#fbbf24', rarity: 'common'   },
  { id: 'malachite', name: 'Malachite', emoji: '🟢', hp: 80,  atk: 75, def: 75, spd: 65, ability: 'Toxic Swirl',      color: '#34d399', rarity: 'rare'     },
  { id: 'ruby',      name: 'Ruby',      emoji: '🔴', hp: 95,  atk: 95, def: 70, spd: 85, ability: 'Inferno Blast',    color: '#f87171', rarity: 'rare'     },
  { id: 'diamond',   name: 'Diamond',   emoji: '💎', hp: 100, atk: 80, def: 100,spd: 90, ability: 'Unbreakable',      color: '#e2e8f0', rarity: 'legendary'},
  { id: 'lava',      name: 'Lava Rock', emoji: '🌋', hp: 88,  atk: 88, def: 50, spd: 95, ability: 'Magma Surge',      color: '#f97316', rarity: 'uncommon' },
];

const RARITY_GLOW = {
  common:    'hsla(200,60%,50%,0.3)',
  uncommon:  'hsla(145,60%,50%,0.3)',
  rare:      'hsla(280,80%,60%,0.4)',
  legendary: 'hsla(45,100%,60%,0.5)',
};

const BATTLE_QUIPS = [
  'CRITICAL HIT!!', 'SUPER EFFECTIVE!', 'BOULDERS COLLIDE!',
  'THE EARTH SHAKES!', 'MINERAL MADNESS!', 'ROCK SOLID DAMAGE!',
  'TECTONIC FORCE!', 'GEO-SMASH!!',
];

function getRandomFighters() {
  const shuffled = [...ROCK_FIGHTERS].sort(() => Math.random() - 0.5);
  return [shuffled[0], shuffled[1]];
}

function StatBar({ label, value, color }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[8px] text-white/40 uppercase w-6 shrink-0">{label}</span>
      <div className="flex-1 h-1.5 rounded-full bg-white/10">
        <div className="h-full rounded-full transition-all" style={{ width: `${value}%`, background: color }} />
      </div>
      <span className="text-[9px] text-white/50 w-5 text-right">{value}</span>
    </div>
  );
}

function FighterCard({ rock, hp, maxHp, isAttacking, isHurt, side }) {
  const hpPct = Math.max(0, (hp / maxHp) * 100);
  const hpColor = hpPct > 50 ? rock.color : hpPct > 25 ? '#fbbf24' : '#f87171';

  return (
    <motion.div
      animate={isAttacking
        ? { x: side === 'left' ? [0, 28, 0] : [0, -28, 0], scale: [1, 1.12, 1] }
        : isHurt
          ? { x: side === 'left' ? [0, -10, 0] : [0, 10, 0], filter: ['brightness(1)', 'brightness(2.5)', 'brightness(1)'] }
          : {}}
      transition={{ duration: 0.3 }}
      className="flex-1 rounded-2xl p-3 min-w-0"
      style={{
        background: `hsla(240,30%,8%,0.7)`,
        border: `1px solid ${rock.color}30`,
        boxShadow: isAttacking ? `0 0 24px ${rock.color}60` : `0 0 12px ${RARITY_GLOW[rock.rarity]}`,
      }}
    >
      <div className="text-center mb-2">
        <div className="text-4xl mb-0.5 leading-none">{rock.emoji}</div>
        <div className="text-white font-black text-xs truncate">{rock.name}</div>
        <div className="text-[8px] uppercase tracking-widest mt-0.5" style={{ color: rock.color }}>{rock.rarity}</div>
      </div>

      {/* HP bar */}
      <div className="mb-2">
        <div className="flex justify-between items-center mb-0.5">
          <span className="text-[7px] text-white/40 uppercase tracking-wider">HP</span>
          <span className="text-[8px] font-bold" style={{ color: hpColor }}>{hp}</span>
        </div>
        <div className="h-2 rounded-full bg-white/10 overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ background: hpColor }}
            animate={{ width: `${hpPct}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>

      <StatBar label="ATK" value={rock.atk} color={rock.color} />
      <StatBar label="DEF" value={rock.def} color={rock.color} />
      <StatBar label="SPD" value={rock.spd} color={rock.color} />

      <div className="mt-2 text-center">
        <span className="text-[7px] italic px-2 py-0.5 rounded-full" style={{ background: `${rock.color}15`, color: rock.color }}>
          {rock.ability}
        </span>
      </div>
    </motion.div>
  );
}

// ── Avatar upload pill ──────────────────────────────────────────────────────
function AvatarUpload({ avatarUrl, onUpload }) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef(null);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    onUpload(file_url);
    setUploading(false);
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-amethyst/40 hover:border-amethyst/70 transition flex-shrink-0"
        style={{ background: 'hsla(265,60%,15%,0.8)' }}
        title="Upload avatar"
      >
        {avatarUrl ? (
          <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
        ) : uploading ? (
          <Loader2 size={14} className="absolute inset-0 m-auto text-amethyst animate-spin" />
        ) : (
          <Camera size={14} className="absolute inset-0 m-auto text-amethyst/60" />
        )}
      </button>
      <span className="text-[9px] text-white/35">
        {avatarUrl ? 'Tap to change avatar' : 'Add avatar'}
      </span>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
    </div>
  );
}

// ── Main component ──────────────────────────────────────────────────────────
export default function ARRockBattle() {
  const [fighters, setFighters] = useState(() => getRandomFighters());
  const [hp, setHp] = useState([fighters[0].hp, fighters[1].hp]);
  const [log, setLog] = useState([]);
  const [phase, setPhase] = useState('idle');
  const [winner, setWinner] = useState(null);
  const [attackingIdx, setAttackingIdx] = useState(null);
  const [hurtIdx, setHurtIdx] = useState(null);
  const [quip, setQuip] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // Persistent state
  const [scores, setScores] = useState([]);
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [userEmail, setUserEmail] = useState(null);

  const turnRef = useRef(0);
  const intervalRef = useRef(null);

  // Load user + profile (avatar + battle history) from backend on mount
  useEffect(() => {
    base44.auth.me().then(async (me) => {
      if (!me) return;
      setUserEmail(me.email);

      // Load PlayerProfile for avatar
      const res = await base44.functions.invoke('getPlayerProfile', {}).catch(() => null);
      if (res?.data?.avatar_url) setAvatarUrl(res.data.avatar_url);

      // Load battle history from BattleResult entity
      const battles = await base44.entities.BattleResult.filter({ owner_email: me.email }, '-created_date', 20).catch(() => []);
      const mapped = battles.map(b => ({
        mineral: b.winner_mineral,
        emoji: ROCK_FIGHTERS.find(r => r.name === b.winner_mineral)?.emoji || '🪨',
        xp: b.xp_awarded,
        avatarUrl: b.avatar_url_at_time,
        date: b.battle_date ? new Date(b.battle_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '',
      }));
      if (mapped.length > 0) setScores(mapped);
    }).catch(() => {});
  }, []);

  const saveAvatar = async (url) => {
    setAvatarUrl(url);
    if (!userEmail) return;
    try {
      const profiles = await base44.entities.PlayerProfile.filter({ owner_email: userEmail }, '-created_date', 1);
      if (profiles[0]) await base44.entities.PlayerProfile.update(profiles[0].id, { avatar_url: url });
    } catch { /* non-critical */ }
  };

  const persistScore = async (winnerRock, xp) => {
    const entry = {
      mineral: winnerRock.name,
      emoji: winnerRock.emoji,
      xp,
      avatarUrl,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    };
    setScores(prev => [entry, ...prev].slice(0, 20));

    // Save to backend and award XP
    try {
      await base44.functions.invoke('saveBattleResult', {
        winner_mineral: winnerRock.name,
        opponent_mineral: fighters.find(f => f.id !== winnerRock.id)?.name || 'Unknown',
        xp_awarded: xp,
        avatar_url: avatarUrl,
      });
      // Sync XP to PlayerLegend widget if present
      if (window.__rhgo_addXP) await window.__rhgo_addXP(0, 'sync'); // trigger re-render only
    } catch { /* non-critical */ }
  };

  const reset = () => {
    const newFighters = getRandomFighters();
    setFighters(newFighters);
    setHp([newFighters[0].hp, newFighters[1].hp]);
    setLog([]);
    setPhase('idle');
    setWinner(null);
    setAttackingIdx(null);
    setHurtIdx(null);
    setQuip(null);
    turnRef.current = 0;
    clearInterval(intervalRef.current);
  };

  const runBattle = () => {
    if (phase === 'battling') return;
    setPhase('battling');
    setLog([]);

    let currentHp = [fighters[0].hp, fighters[1].hp];
    turnRef.current = 0;

    intervalRef.current = setInterval(() => {
      const attacker = turnRef.current % 2 === 0 ? 0 : 1;
      const defender = attacker === 0 ? 1 : 0;
      const f = fighters[attacker];
      const d = fighters[defender];

      const base = Math.max(5, f.atk - Math.floor(d.def / 3));
      const dmg = Math.floor(base * (0.9 + Math.random() * 0.2));

      currentHp[defender] = Math.max(0, currentHp[defender] - dmg);
      setHp([...currentHp]);
      setAttackingIdx(attacker);
      setHurtIdx(defender);
      setQuip(BATTLE_QUIPS[Math.floor(Math.random() * BATTLE_QUIPS.length)]);

      setLog((prev) => [
        { text: `${f.emoji} ${f.name} used ${f.ability}! -${dmg} HP`, color: f.color },
        ...prev.slice(0, 3),
      ]);

      setTimeout(() => { setAttackingIdx(null); setHurtIdx(null); setQuip(null); }, 350);

      turnRef.current += 1;

      if (currentHp[defender] <= 0) {
        clearInterval(intervalRef.current);
        setPhase('win');
        setWinner(fighters[attacker]);
        // Award XP based on rarity of winner
        const rarityXp = { common: 100, uncommon: 150, rare: 200, legendary: 350 };
        const xp = rarityXp[fighters[attacker].rarity] || 150;
        persistScore(fighters[attacker], xp);
        if (window.__rhgo_addXP) window.__rhgo_addXP(xp, `AR Battle win vs ${fighters[defender].name}`);
      }
    }, 900);
  };

  useEffect(() => () => clearInterval(intervalRef.current), []);

  const totalWins = scores.length;
  const totalXp = scores.reduce((acc, s) => acc + (s.xp || 0), 0);

  return (
    <>
      {/* Teaser card */}
      <motion.div
        whileTap={{ scale: 0.97 }}
        onClick={() => setShowModal(true)}
        className="rounded-2xl overflow-hidden cursor-pointer"
        style={{
          background: 'linear-gradient(135deg, hsla(0,80%,10%,0.7) 0%, hsla(30,80%,10%,0.7) 100%)',
          border: '1px solid hsla(0,80%,50%,0.3)',
          boxShadow: '0 4px 24px -8px hsla(0,90%,50%,0.25)',
        }}
      >
        <div className="flex items-center justify-between px-4 pt-4 pb-3">
          <div className="flex items-center gap-2">
            <Swords size={14} className="text-red-400" />
            <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-red-400/80">AR Rock Battle</span>
          </div>
          <span className="text-[8px] uppercase tracking-[0.25em] text-red-300/40 px-2 py-0.5 rounded-full border border-red-400/20">
            ⚡ Chaos Only
          </span>
        </div>
        <div className="px-4 pb-4 flex items-center gap-3">
          <div className="flex gap-1 text-3xl">{fighters[0].emoji}<span className="text-white/30 text-xl self-center">VS</span>{fighters[1].emoji}</div>
          <div className="flex-1">
            <div className="text-white font-bold text-sm">{fighters[0].name} vs {fighters[1].name}</div>
            <div className="text-white/40 text-[10px] mt-0.5">
              {totalWins > 0 ? `${totalWins} wins · ${totalXp} XP earned` : 'Tap to battle! Stats from real geology 🔬'}
            </div>
          </div>
          {avatarUrl ? (
            <img src={avatarUrl} alt="avatar" className="w-9 h-9 rounded-full object-cover border border-red-400/40" />
          ) : (
            <Swords size={20} className="text-red-400/60" />
          )}
        </div>
      </motion.div>

      {/* Battle Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center"
            style={{ background: 'hsla(240,30%,3%,0.88)', backdropFilter: 'blur(12px)' }}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 28 }}
              className="w-full max-w-sm rounded-t-3xl overflow-y-auto"
              style={{
                background: 'linear-gradient(180deg, hsla(240,30%,7%,0.98) 0%, hsla(240,30%,4%,0.98) 100%)',
                border: '1px solid hsla(280,80%,55%,0.15)',
                paddingBottom: 'env(safe-area-inset-bottom, 16px)',
                maxHeight: '92vh',
              }}
            >
              {/* Modal header */}
              <div className="flex items-center justify-between px-5 pt-5 pb-2">
                <div className="flex items-center gap-2">
                  <Swords size={16} className="text-red-400" />
                  <span className="text-white font-black text-sm uppercase tracking-[0.2em]">AR Rock Battle</span>
                </div>
                <button onClick={() => { setShowModal(false); reset(); }} className="text-white/40 hover:text-white/80 transition p-1">
                  <X size={18} />
                </button>
              </div>

              {/* Avatar + stats row */}
              <div className="px-5 pb-3 flex items-center justify-between">
                <AvatarUpload avatarUrl={avatarUrl} onUpload={saveAvatar} />
                {totalWins > 0 && (
                  <div className="flex gap-3">
                    <div className="text-center">
                      <div className="text-sm font-black text-yellow-400">{totalWins}</div>
                      <div className="text-[7px] text-white/30 uppercase tracking-wider">Wins</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-black text-amethyst-glow">{totalXp}</div>
                      <div className="text-[7px] text-white/30 uppercase tracking-wider">XP</div>
                    </div>
                  </div>
                )}
              </div>

              {/* VS Arena */}
              <div className="px-4 mb-3">
                <AnimatePresence>
                  {quip && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.8 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="text-center mb-2"
                    >
                      <span className="text-yellow-300 font-black text-sm tracking-widest">{quip}</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="flex gap-3 items-stretch">
                  <FighterCard rock={fighters[0]} hp={hp[0]} maxHp={fighters[0].hp} isAttacking={attackingIdx === 0} isHurt={hurtIdx === 0} side="left" />
                  <div className="flex flex-col items-center justify-center shrink-0 gap-1">
                    <Swords size={18} className="text-red-400" />
                    <span className="text-white/20 text-[8px] font-bold uppercase">VS</span>
                  </div>
                  <FighterCard rock={fighters[1]} hp={hp[1]} maxHp={fighters[1].hp} isAttacking={attackingIdx === 1} isHurt={hurtIdx === 1} side="right" />
                </div>
              </div>

              {/* Battle log */}
              <div className="mx-4 rounded-xl overflow-hidden mb-3" style={{ background: 'hsla(240,30%,5%,0.8)', border: '1px solid hsla(240,30%,20%,0.5)' }}>
                <div className="px-3 py-1.5 border-b border-white/5">
                  <span className="text-[8px] uppercase tracking-[0.3em] text-white/30">Battle Log</span>
                </div>
                <div className="px-3 py-2 min-h-[52px] space-y-1">
                  {log.length === 0 && <p className="text-white/20 text-[10px] italic">The rocks glare at each other...</p>}
                  {log.map((entry, i) => (
                    <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1 - i * 0.2, x: 0 }}
                      className="text-[10px] font-semibold" style={{ color: entry.color }}>
                      {entry.text}
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Win screen */}
              <AnimatePresence>
                {winner && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="mx-4 rounded-2xl p-4 text-center mb-3"
                    style={{ background: `linear-gradient(135deg, ${winner.color}20, ${winner.color}10)`, border: `1px solid ${winner.color}40` }}
                  >
                    <div className="text-4xl mb-1">{winner.emoji}</div>
                    <div className="text-white font-black text-base">{winner.name} WINS!</div>
                    <div className="flex items-center justify-center gap-1 mt-1">
                      <Trophy size={11} className="text-yellow-400" />
                      <span className="text-yellow-400 text-xs font-bold">
                        +{({ common: 100, uncommon: 150, rare: 200, legendary: 350 }[winner.rarity] || 150)} XP
                      </span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Leaderboard */}
              <BattleLeaderboard scores={scores} />

              {/* Action buttons */}
              <div className="flex gap-3 px-4 pb-5">
                {phase === 'idle' && (
                  <button
                    onClick={runBattle}
                    className="flex-1 py-3.5 rounded-2xl font-black text-sm uppercase tracking-[0.2em] transition-all active:scale-95 flex items-center justify-center gap-2"
                    style={{ background: 'linear-gradient(135deg, #dc2626, #f97316)', color: 'white', boxShadow: '0 4px 20px -4px hsla(0,90%,50%,0.5)' }}
                  >
                    <Flame size={16} /> FIGHT!
                  </button>
                )}
                {phase === 'battling' && (
                  <div className="flex-1 py-3.5 rounded-2xl font-black text-sm uppercase tracking-[0.2em] flex items-center justify-center gap-2 opacity-60"
                    style={{ background: 'hsla(0,80%,20%,0.4)', color: '#f87171', border: '1px solid hsla(0,80%,50%,0.3)' }}>
                    <div className="w-3 h-3 rounded-full border-2 border-red-400/50 border-t-red-400 animate-spin" />
                    Battling...
                  </div>
                )}
                {(phase === 'win' || phase === 'idle') && (
                  <button onClick={reset}
                    className="flex items-center gap-1.5 px-4 py-3.5 rounded-2xl text-xs font-bold uppercase tracking-[0.2em] transition-all active:scale-95"
                    style={{ background: 'hsla(240,30%,15%,0.5)', border: '1px solid hsla(240,30%,40%,0.3)', color: 'hsla(240,30%,70%,0.8)' }}>
                    <RefreshCw size={13} />
                    New Match
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}