/**
 * PrivateRockLog — personal, private map + list of rocks you've physically collected.
 * Coordinates and photos are visible only to you.
 */
import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { MapPin, Plus, Gem, Trash2, Lock, Image } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import HelpTip from '@/components/hub/HelpTip.jsx';

const RARITY_COLORS = {
  common:   'hsl(195,80%,70%)',
  uncommon: 'hsl(120,70%,60%)',
  rare:     'hsl(280,80%,75%)',
  legendary:'hsl(45,100%,65%)',
};

export default function PrivateRockLog() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    base44.auth.me().then(u => { if (u?.email) setUserEmail(u.email); }).catch(() => {});
    loadLogs();
  }, []);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const data = await base44.entities.PrivateRockLog.list('-created_date');
      setLogs(data || []);
    } catch {}
    setLoading(false);
  };

  const handleDelete = async (id) => {
    await base44.entities.PrivateRockLog.delete(id);
    setLogs(prev => prev.filter(l => l.id !== id));
  };

  return (
    <div className="min-h-screen pb-32 px-4 pt-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            <Lock size={14} className="text-amethyst" />
            <h1 className="text-white font-bold text-lg">Private Rock Log</h1>
            <HelpTip tip="Your personal stash — exact GPS, photos, and notes saved only for your eyes. No other user can see these finds." />
          </div>
          <p className="text-white/35 text-[11px] mt-0.5">Only visible to you · {logs.length} finds logged</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold text-white focus-visible:ring-2 focus-visible:ring-amethyst-glow/60 focus-visible:outline-none"
          style={{
            background: 'linear-gradient(135deg, hsl(280 70% 55%), hsl(265 75% 45%))',
            boxShadow: '0 4px 16px hsla(280,80%,50%,0.35)',
          }}
        >
          <Plus size={15} /> Log Rock
        </button>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-7 h-7 border-2 border-amethyst/30 border-t-amethyst rounded-full animate-spin" />
        </div>
      ) : logs.length === 0 ? (
        <div className="text-center py-20 text-white/30">
          <Gem size={32} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">No rocks logged yet.</p>
          <p className="text-[11px] mt-1">Tap "Log Rock" to add your first private find.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {logs.map(log => (
            <LogCard key={log.id} log={log} onDelete={handleDelete} />
          ))}
        </div>
      )}

      {/* Add Form Modal */}
      <AnimatePresence>
        {showForm && (
          <AddLogForm
            userEmail={userEmail}
            onSaved={(newLog) => { setLogs(prev => [newLog, ...prev]); setShowForm(false); }}
            onClose={() => setShowForm(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function LogCard({ log, onDelete }) {
  const color = RARITY_COLORS[log.rarity] || RARITY_COLORS.common;
  return (
    <div
      className="rounded-2xl p-4 flex gap-3"
      style={{
        background: 'hsla(255,22%,12%,0.7)',
        border: '1px solid hsla(270,30%,40%,0.2)',
      }}
    >
      {log.image_url ? (
        <img src={log.image_url} alt={log.mineral_name} className="w-16 h-16 rounded-xl object-cover shrink-0" />
      ) : (
        <div className="w-16 h-16 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'hsla(255,20%,18%,0.6)' }}>
          <Image size={22} className="text-white/20" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-white font-semibold text-sm truncate">{log.mineral_name}</p>
            <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color }}>{log.rarity}</span>
          </div>
          <button
            onClick={() => onDelete(log.id)}
            className="text-white/20 hover:text-rose-400 transition shrink-0 focus-visible:ring-2 focus-visible:ring-rose-400/50 focus-visible:outline-none rounded-sm"
            aria-label="Delete log"
            title="Delete log"
          >
            <Trash2 size={14} />
          </button>
        </div>
        {log.location_label && (
          <div className="flex items-center gap-1 mt-1">
            <MapPin size={10} className="text-white/30" />
            <span className="text-white/35 text-[10px] truncate">{log.location_label}</span>
          </div>
        )}
        {log.lat && log.lng && (
          <p className="text-white/20 text-[9px] mt-0.5 font-mono">{log.lat.toFixed(5)}, {log.lng.toFixed(5)}</p>
        )}
        {log.notes && <p className="text-white/40 text-[11px] mt-1 line-clamp-2">{log.notes}</p>}
        {log.found_date && <p className="text-white/20 text-[10px] mt-1">{log.found_date}</p>}
      </div>
    </div>
  );
}

function AddLogForm({ userEmail, onSaved, onClose }) {
  const [form, setForm] = useState({
    mineral_name: '',
    notes: '',
    location_label: '',
    rarity: 'common',
    found_date: new Date().toISOString().split('T')[0],
    weight_lbs: '',
    image_url: '',
    lat: '',
    lng: '',
  });
  const [locating, setLocating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const getLocation = () => {
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        set('lat', pos.coords.latitude.toFixed(6));
        set('lng', pos.coords.longitude.toFixed(6));
        setLocating(false);
      },
      () => setLocating(false),
      { enableHighAccuracy: true }
    );
  };

  const handleImage = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const res = await base44.integrations.Core.UploadFile({ file });
      set('image_url', res.file_url);
    } catch {}
    setUploading(false);
  };

  const handleSave = async () => {
    if (!form.mineral_name.trim()) return;
    setSaving(true);
    try {
      const payload = {
        owner_email: userEmail,
        mineral_name: form.mineral_name.trim(),
        notes: form.notes,
        location_label: form.location_label,
        rarity: form.rarity,
        found_date: form.found_date,
        image_url: form.image_url,
        lat: form.lat ? parseFloat(form.lat) : undefined,
        lng: form.lng ? parseFloat(form.lng) : undefined,
        weight_lbs: form.weight_lbs ? parseFloat(form.weight_lbs) : undefined,
      };
      const created = await base44.entities.PrivateRockLog.create(payload);
      onSaved(created);
    } catch {}
    setSaving(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ background: 'hsla(245,30%,4%,0.75)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 40, opacity: 0 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-md rounded-t-3xl p-5 overflow-y-auto"
        style={{
          maxHeight: 'calc(100dvh - 60px)',
          background: 'linear-gradient(180deg, hsl(252 22% 12%) 0%, hsl(248 24% 7%) 100%)',
          border: '1px solid hsla(270,50%,60%,0.22)',
        }}
      >
        <h2 className="text-white font-bold text-base mb-4 text-center">Log a Rock Find</h2>

        <Field label="Mineral Name *">
          <input
            value={form.mineral_name}
            onChange={e => set('mineral_name', e.target.value)}
            placeholder="e.g. Petoskey Stone"
            className="input-base"
          />
        </Field>

        <Field label="Notes">
          <textarea
            value={form.notes}
            onChange={e => set('notes', e.target.value)}
            rows={2}
            placeholder="Color, texture, how you found it…"
            className="input-base resize-none"
          />
        </Field>

        <Field label="Location Name">
          <input
            value={form.location_label}
            onChange={e => set('location_label', e.target.value)}
            placeholder="e.g. Lake Michigan North Beach"
            className="input-base"
          />
        </Field>

        {/* GPS */}
        <Field label="GPS Coordinates">
          <div className="flex gap-2">
            <input value={form.lat} onChange={e => set('lat', e.target.value)} placeholder="Lat" className="input-base flex-1" />
            <input value={form.lng} onChange={e => set('lng', e.target.value)} placeholder="Lng" className="input-base flex-1" />
            <button
              onClick={getLocation}
              disabled={locating}
              className="px-3 rounded-xl text-xs font-semibold text-white transition focus-visible:ring-2 focus-visible:ring-emerald-400/50 focus-visible:outline-none"
              style={{ background: 'hsla(195,80%,55%,0.15)', border: '1px solid hsla(195,80%,55%,0.3)' }}
              aria-label="Get current location"
              title="Get current location"
            >
              {locating ? '…' : <MapPin size={14} />}
            </button>
          </div>
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Rarity">
            <select value={form.rarity} onChange={e => set('rarity', e.target.value)} className="input-base">
              {['common','uncommon','rare','legendary'].map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </Field>
          <Field label="Date Found">
            <input type="date" value={form.found_date} onChange={e => set('found_date', e.target.value)} className="input-base" />
          </Field>
        </div>

        <Field label="Weight (lbs)">
          <input type="number" value={form.weight_lbs} onChange={e => set('weight_lbs', e.target.value)} placeholder="0.5" step="0.1" className="input-base" />
        </Field>

        {/* Photo upload */}
        <Field label="Photo">
          <label className="flex items-center gap-2 cursor-pointer focus-within:ring-2 focus-within:ring-amethyst-glow/50 focus-within:outline-none w-fit rounded-xl">
            <div
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-white/50 transition"
              style={{ background: 'hsla(255,20%,18%,0.6)', border: '1px solid hsla(255,20%,30%,0.3)' }}
            >
              <Image size={14} />
              {uploading ? 'Uploading…' : form.image_url ? '✓ Photo added' : 'Choose photo'}
            </div>
            <input type="file" accept="image/*" onChange={handleImage} className="sr-only" />
          </label>
          {form.image_url && <img src={form.image_url} alt="preview" className="mt-2 w-20 h-20 rounded-xl object-cover" />}
        </Field>

        <div className="flex gap-3 mt-5">
          <button onClick={onClose} className="flex-1 py-3 rounded-2xl text-sm font-semibold text-white/40 focus-visible:ring-2 focus-visible:ring-white/30 focus-visible:outline-none" style={{ background: 'hsla(255,20%,18%,0.5)', border: '1px solid hsla(255,20%,30%,0.25)' }}>
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!form.mineral_name.trim() || saving}
            className="flex-1 py-3 rounded-2xl text-sm font-bold text-white disabled:opacity-40 transition focus-visible:ring-2 focus-visible:ring-amethyst-glow/60 focus-visible:outline-none"
            style={{ background: 'linear-gradient(135deg, hsl(280 70% 55%), hsl(265 75% 45%))', boxShadow: '0 4px 20px hsla(280,80%,50%,0.3)' }}
          >
            {saving ? 'Saving…' : 'Save Log'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function Field({ label, children }) {
  return (
    <div className="mb-3">
      <label className="block text-white/40 text-[10px] uppercase tracking-widest mb-1">{label}</label>
      {children}
    </div>
  );
}

// Inline styles injected via a global class for DRY input styling
const style = document.createElement('style');
style.textContent = `.input-base { width: 100%; background: hsla(255,20%,16%,0.6); border: 1px solid hsla(255,20%,30%,0.3); border-radius: 12px; padding: 8px 12px; color: white; font-size: 13px; outline: none; } .input-base:focus { border-color: hsla(280,60%,65%,0.5); } .input-base option { background: hsl(248,24%,9%); }`;
document.head.appendChild(style);