import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, FlaskConical, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';

const PRESET_FIELDS = [
  { key: 'weight',     label: 'Weight (g)',        type: 'text', placeholder: '99' },
  { key: 'magnetism',  label: 'Magnetism',         type: 'choice', options: ['Strong', 'Weak', 'None'] },
  { key: 'density',    label: 'Density (g/cm³)',    type: 'text', placeholder: '7.8' },
  { key: 'streak',     label: 'Streak Color',      type: 'text', placeholder: 'Brown-red' },
  { key: 'hardness',   label: 'Hardness (Mohs)',   type: 'text', placeholder: '5.5' },
  { key: 'color',      label: 'Color',             type: 'text', placeholder: 'Dark metallic' },
];

export default function ObservationForm({ open, onClose, onSubmit, loading, suggestedTest }) {
  const [values, setValues] = useState({});
  const [freeText, setFreeText] = useState('');

  const handleSubmit = () => {
    const observations = [];
    for (const field of PRESET_FIELDS) {
      const v = values[field.key];
      if (v && v.trim()) {
        observations.push({
          key: field.key,
          label: field.label,
          value: v,
          reliability: 0.8,
          entered_at: new Date().toISOString(),
        });
      }
    }
    if (freeText.trim()) {
      observations.push({
        key: 'free_text',
        label: 'Additional observation',
        value: freeText.trim(),
        reliability: 0.6,
        entered_at: new Date().toISOString(),
      });
    }
    if (observations.length === 0) return;
    onSubmit(observations);
    setValues({});
    setFreeText('');
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50"
            style={{ background: 'hsla(0,0%,0%,0.7)', backdropFilter: 'blur(8px)' }}
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed bottom-0 inset-x-0 z-50 rounded-t-3xl overflow-hidden"
            style={{
              background: 'linear-gradient(180deg, hsl(255,30%,14%) 0%, hsl(250,28%,10%) 100%)',
              borderTop: '1px solid hsla(270,50%,50%,0.25)',
              maxHeight: '85vh',
            }}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-white/15" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 pb-3 border-b border-white/8">
              <div className="flex items-center gap-2">
                <FlaskConical size={15} className="text-amber-400" />
                <span className="text-sm font-bold text-white/90">Enter Field Evidence</span>
              </div>
              <button onClick={onClose} className="text-white/30 hover:text-white/60 transition">
                <X size={16} />
              </button>
            </div>

            {/* Suggested test prompt */}
            {suggestedTest && (
              <div className="mx-5 mt-3 px-3 py-2.5 rounded-xl" style={{ background: 'hsla(40,90%,35%,0.08)', border: '1px solid hsla(40,90%,50%,0.2)' }}>
                <div className="text-[9px] uppercase tracking-widest text-amber-400/70 mb-0.5">Suggested Test</div>
                <div className="text-xs text-white/70">{suggestedTest}</div>
              </div>
            )}

            {/* Fields */}
            <div className="px-5 py-4 overflow-y-auto" style={{ maxHeight: '50vh' }}>
              <div className="grid grid-cols-2 gap-3">
                {PRESET_FIELDS.map((field) => (
                  <div key={field.key} className="space-y-1">
                    <label className="text-[9px] uppercase tracking-widest text-white/40">{field.label}</label>
                    {field.type === 'choice' ? (
                      <div className="flex gap-1">
                        {field.options.map((opt) => (
                          <button
                            key={opt}
                            onClick={() => setValues((v) => ({ ...v, [field.key]: opt }))}
                            className="flex-1 py-1.5 rounded-lg text-[10px] font-semibold transition"
                            style={
                              values[field.key] === opt
                                ? { background: 'hsla(270,60%,40%,0.5)', color: 'hsl(280,80%,90%)', border: '1px solid hsla(270,80%,60%,0.4)' }
                                : { background: 'hsla(220,40%,6%,0.6)', color: 'hsla(0,0%,100%,0.4)', border: '1px solid hsla(0,0%,100%,0.08)' }
                            }
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <input
                        type="text"
                        placeholder={field.placeholder}
                        value={values[field.key] || ''}
                        onChange={(e) => setValues((v) => ({ ...v, [field.key]: e.target.value }))}
                        className="w-full h-9 px-2.5 rounded-lg text-xs text-white/80 bg-white/5 border border-white/10 outline-none focus:border-amber-500/40"
                      />
                    )}
                  </div>
                ))}
              </div>

              {/* Free text */}
              <div className="mt-3 space-y-1">
                <label className="text-[9px] uppercase tracking-widest text-white/40">Additional Observation</label>
                <textarea
                  rows={2}
                  placeholder="Describe any other visible features, test results, or context…"
                  value={freeText}
                  onChange={(e) => setFreeText(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-xs text-white/80 bg-white/5 border border-white/10 outline-none focus:border-amber-500/40 resize-none"
                />
              </div>
            </div>

            {/* Submit */}
            <div className="px-5 py-3 border-t border-white/8" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom,0px) + 12px)' }}>
              <Button
                onClick={handleSubmit}
                disabled={loading}
                className="w-full h-11 rounded-xl text-sm font-bold text-white"
                style={{ background: 'linear-gradient(135deg, hsl(40,90%,45%), hsl(35,100%,52%))' }}
              >
                {loading ? (
                  <span className="flex items-center gap-2">Reconstructing histories…</span>
                ) : (
                  <span className="flex items-center gap-2"><Send size={14} /> Submit Evidence & Re-investigate</span>
                )}
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}