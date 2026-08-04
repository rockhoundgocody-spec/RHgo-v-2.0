import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, ImagePlus, Send } from 'lucide-react';
import GlassPanel from '@/components/visuals/GlassPanel.jsx';

export default function PostComposer({ onPosted }) {
  const [open, setOpen] = useState(false);
  const [body, setBody] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [specimens, setSpecimens] = useState([]);
  const [selectedSpecimen, setSelectedSpecimen] = useState(null);
  const [showFinds, setShowFinds] = useState(false);
  const [busy, setBusy] = useState(false);
  const [me, setMe] = useState(null);

  useEffect(() => {
    base44.auth.me().then(u => {
      if (u?.email) {
        setMe(u);
        base44.entities.Specimen.list('-created_date', 10)
          .then(setSpecimens).catch(() => {});
      }
    }).catch(() => {});
  }, []);

  const handleImage = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setImageUrl(file_url);
    } finally {
      setBusy(false);
    }
  };

  const post = async () => {
    if (!body.trim() && !imageUrl && !selectedSpecimen) return;
    setBusy(true);
    try {
      const created = await base44.entities.Post.create({
        owner_email: me.email,
        author_name: me.full_name || 'Rockhound',
        post_type: selectedSpecimen ? 'find_share' : 'text',
        body: body.trim(),
        image_url: imageUrl || selectedSpecimen?.image_url || '',
        specimen_id: selectedSpecimen?.id || '',
        mineral_name: selectedSpecimen?.mineral_name || '',
        rarity: selectedSpecimen?.rarity || '',
        location_label: selectedSpecimen?.found_at || '',
        reactions: { fire: 0, gem: 0, clap: 0, wow: 0 },
        reactors: [],
        comments: [],
        comment_count: 0,
      });
      setBody('');
      setImageUrl('');
      setSelectedSpecimen(null);
      setOpen(false);
      onPosted?.(created);
    } finally {
      setBusy(false);
    }
  };

  if (!open) {
    return (
      <button onClick={() => setOpen(true)}
        className="w-full text-left px-4 py-3 rounded-2xl text-white/40 text-sm transition hover:text-white/60"
        style={{ background: 'hsla(255,25%,16%,0.6)', border: '1px solid hsla(260,20%,40%,0.25)' }}>
        Share a find or start a conversation…
      </button>
    );
  }

  return (
    <GlassPanel className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/50">New Post</span>
        <button onClick={() => setOpen(false)} className="text-white/30 hover:text-white/60 text-xs">Cancel</button>
      </div>
      <textarea value={body} onChange={e => setBody(e.target.value)} rows={3}
        placeholder="What did you find out there?"
        className="w-full bg-transparent text-sm text-white/85 placeholder-white/25 outline-none resize-none" />

      {imageUrl && <img src={imageUrl} alt="" className="w-full max-h-64 object-cover rounded-xl" />}

      {selectedSpecimen && (
        <div className="flex items-center gap-2 p-2 rounded-xl"
          style={{ background: 'hsla(280,60%,40%,0.12)', border: '1px solid hsla(280,60%,60%,0.25)' }}>
          <span className="text-lg">🪨</span>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-bold text-white truncate">{selectedSpecimen.mineral_name}</div>
            <div className="text-[9px] text-white/40 uppercase">{selectedSpecimen.rarity}</div>
          </div>
          <button onClick={() => setSelectedSpecimen(null)} className="text-white/30 hover:text-white/60 text-xs">✕</button>
        </div>
      )}

      {showFinds && (
        <div className="space-y-1 max-h-40 overflow-y-auto">
          {specimens.length === 0
            ? <p className="text-[11px] text-white/30 text-center py-2">No finds yet — scan a rock first!</p>
            : specimens.map(s => (
              <button key={s.id} onClick={() => { setSelectedSpecimen(s); setShowFinds(false); }}
                className="w-full flex items-center gap-2 p-2 rounded-lg text-left transition hover:bg-white/5">
                {s.image_url
                  ? <img src={s.image_url} className="w-8 h-8 rounded object-cover" alt="" />
                  : <span className="w-8 h-8 rounded flex items-center justify-center bg-white/5">🪨</span>}
                <span className="text-xs text-white/75 truncate">{s.mineral_name}</span>
              </button>
            ))}
        </div>
      )}

      <div className="flex items-center gap-2">
        <label className="cursor-pointer p-2 rounded-lg transition hover:bg-white/5 focus-within:ring-2 focus-within:ring-white/50 focus-within:outline-none"
          style={{ background: 'hsla(255,20%,20%,0.5)' }}>
          <ImagePlus size={16} className="text-white/50" />
          <input type="file" accept="image/*" className="sr-only" onChange={handleImage} aria-label="Upload image" />
        </label>
        <button onClick={() => setShowFinds(s => !s)} disabled={specimens.length === 0}
          className="px-3 py-2 rounded-lg text-[11px] font-semibold text-white/60 transition hover:bg-white/5 disabled:opacity-30"
          style={{ background: 'hsla(255,20%,20%,0.5)' }}>
          Share a find
        </button>
        <button onClick={post} disabled={busy || (!body.trim() && !imageUrl && !selectedSpecimen)}
          className="ml-auto flex items-center gap-1.5 px-4 py-2 rounded-lg text-[11px] font-bold transition active:scale-95 disabled:opacity-30"
          style={{ background: 'linear-gradient(135deg, hsl(270,60%,55%), hsl(265,70%,45%))', color: '#fff' }}>
          {busy ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />} Post
        </button>
      </div>
    </GlassPanel>
  );
}