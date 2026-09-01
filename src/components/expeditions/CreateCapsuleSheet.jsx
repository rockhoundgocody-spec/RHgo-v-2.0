import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, MapPin, Users, Sparkles } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const MOODS = [
  { value: 'excited', label: 'Excited', icon: '🔥' },
  { value: 'adventurous', label: 'Adventurous', icon: '⛰️' },
  { value: 'peaceful', label: 'Peaceful', icon: '🧘' },
  { value: 'playful', label: 'Playful', icon: '😄' },
  { value: 'curious', label: 'Curious', icon: '🔍' },
  { value: 'satisfied', label: 'Satisfied', icon: '😊' },
];

/**
 * CreateCapsuleSheet — bottom sheet for logging a new expedition memory capsule.
 * onCreate(capsule) is called after the record is persisted.
 */
export default function CreateCapsuleSheet({ open, onClose, onCreate }) {
  const [form, setForm] = useState({
    expedition_name: '',
    location_name: '',
    expedition_date: new Date().toISOString().split('T')[0],
    mood_snapshot: 'curious',
    story: '',
    total_finds: 0,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const update = (key, value) => setForm((p) => ({ ...p, [key]: value }));

  const handleSubmit = async () => {
    if (!form.expedition_name.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const me = await base44.auth.me().catch(() => null);
      if (!me?.email) throw new Error('Sign in to log a trip');
      const capsule = await base44.entities.MemoryCapsule.create({
        ...form,
        owner_email: me.email,
        highlights: [],
        companion_emails: [],
      });
      onCreate?.(capsule);
      setForm({
        expedition_name: '',
        location_name: '',
        expedition_date: new Date().toISOString().split('T')[0],
        mood_snapshot: 'curious',
        story: '',
        total_finds: 0,
      });
      onClose();
    } catch (e) {
      setError(e.message || 'Could not save trip');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-[1999] bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed bottom-0 inset-x-0 z-[2000] rounded-t-3xl overflow-hidden"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 280 }}
            style={{
              maxHeight: '85vh',
              background: 'linear-gradient(180deg, hsla(245,32%,10%,0.99) 0%, hsla(240,26%,6%,1) 100%)',
              backdropFilter: 'blur(40px)',
              border: '1px solid hsla(270,30%,40%,0.25)',
              borderBottom: 'none',
            }}
          >
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-white/15" />
            </div>

            <div className="overflow-y-auto px-5 pb-8" style={{ maxHeight: 'calc(85vh - 20px)' }}>
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-black text-white">Log a Trip</h2>
                <button
                  onClick={onClose}
                  aria-label="Close"
                  className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ background: 'hsla(255,30%,20%,0.5)', border: '1px solid hsla(255,30%,40%,0.2)' }}
                >
                  <X size={14} className="text-white/60" />
                </button>
              </div>

              <div className="space-y-4">
                <Field label="Trip Name">
                  <input
                    type="text"
                    value={form.expedition_name}
                    onChange={(e) => update('expedition_name', e.target.value)}
                    placeholder="e.g. Agate Beach Weekend"
                    maxLength={80}
                    className="w-full px-3 py-2.5 rounded-xl text-white text-sm outline-none"
                    style={{ background: 'hsla(255,30%,12%,0.7)', border: '1px solid hsla(280,80%,65%,0.3)' }}
                  />
                </Field>

                <Field label="Location">
                  <div className="relative">
                    <MapPin size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                    <input
                      type="text"
                      value={form.location_name}
                      onChange={(e) => update('location_name', e.target.value)}
                      placeholder="e.g. Sleeping Bear Dunes, MI"
                      maxLength={80}
                      className="w-full pl-8 pr-3 py-2.5 rounded-xl text-white text-sm outline-none"
                      style={{ background: 'hsla(255,30%,12%,0.7)', border: '1px solid hsla(280,80%,65%,0.3)' }}
                    />
                  </div>
                </Field>

                <Field label="Date">
                  <div className="relative">
                    <Calendar size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                    <input
                      type="date"
                      value={form.expedition_date}
                      onChange={(e) => update('expedition_date', e.target.value)}
                      className="w-full pl-8 pr-3 py-2.5 rounded-xl text-white text-sm outline-none"
                      style={{ background: 'hsla(255,30%,12%,0.7)', border: '1px solid hsla(280,80%,65%,0.3)' }}
                    />
                  </div>
                </Field>

                <Field label="Mood">
                  <div className="flex flex-wrap gap-2">
                    {MOODS.map((m) => (
                      <button
                        key={m.value}
                        type="button"
                        onClick={() => update('mood_snapshot', m.value)}
                        className="px-3 py-2 rounded-xl text-xs font-semibold transition"
                        style={
                          form.mood_snapshot === m.value
                            ? { background: 'hsla(280,80%,40%,0.3)', border: '1px solid hsla(280,80%,65%,0.5)', color: 'hsl(280,100%,88%)' }
                            : { background: 'hsla(255,30%,12%,0.5)', border: '1px solid hsla(255,30%,30%,0.2)', color: 'hsla(0,0%,100%,0.5)' }
                        }
                      >
                        {m.icon} {m.label}
                      </button>
                    ))}
                  </div>
                </Field>

                <Field label="Story (optional)">
                  <textarea
                    value={form.story}
                    onChange={(e) => update('story', e.target.value)}
                    placeholder="What happened on this trip?"
                    maxLength={2000}
                    rows={3}
                    className="w-full px-3 py-2.5 rounded-xl text-white text-sm outline-none resize-none"
                    style={{ background: 'hsla(255,30%,12%,0.7)', border: '1px solid hsla(280,80%,65%,0.3)' }}
                  />
                </Field>

                {error && (
                  <p className="text-rose-400 text-xs text-center">{error}</p>
                )}

                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={saving || !form.expedition_name.trim()}
                  className="w-full py-3.5 rounded-2xl font-black text-white text-sm transition active:scale-95 disabled:opacity-40"
                  style={{ background: 'linear-gradient(135deg, hsl(265,70%,48%), hsl(280,90%,60%))', boxShadow: '0 6px 28px -6px hsla(270,80%,60%,0.5)' }}
                >
                  {saving ? 'Saving…' : 'Save Trip'}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-[0.2em] text-white/40 mb-1.5 font-semibold">{label}</div>
      {children}
    </div>
  );
}