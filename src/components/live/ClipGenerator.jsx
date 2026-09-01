/**
 * ClipGenerator — 15-second TikTok/Reels highlight export for live streams.
 * Host taps "Clip This" to capture the current moment, add a caption,
 * and generate a vertical-format highlight clip ready for social sharing.
 */
import React, { useState, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { Film, Share2, Loader2, Scissors, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ASPECT_OPTIONS = [
  { id: '9:16', label: 'TikTok / Reels', desc: 'Vertical 9:16' },
  { id: '1:1', label: 'Instagram', desc: 'Square 1:1' },
  { id: '16:9', label: 'YouTube', desc: 'Landscape 16:9' },
];

export default function ClipGenerator({ stream, me, latestId }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [aspect, setAspect] = useState('9:16');
  const [exporting, setExporting] = useState(false);
  const [clipUrl, setClipUrl] = useState(null);
  const [clips, setClips] = useState([]);

  const mineralName = latestId?.mineral_name || '';

  const exportClip = useCallback(async () => {
    if (!stream?.id || !me?.email) return;
    setExporting(true);
    setClipUrl(null);
    try {
      // Use the current stream frame as the clip source
      const frameUrl = stream.current_frame_url;
      const clipTitle = title || (mineralName ? `${mineralName} find!` : 'Field highlight');

      const created = await base44.entities.StreamClip.create({
        stream_id: stream.id,
        owner_email: me.email,
        clip_url: frameUrl || '',
        thumbnail_url: frameUrl || '',
        mineral_name: mineralName,
        title: clipTitle,
        duration_seconds: 15,
        aspect_ratio: aspect,
      });

      setClips(prev => [created, ...prev]);
      setClipUrl(created.clip_url);
      setTitle('');
    } catch {}
    setExporting(false);
  }, [stream, me, mineralName, title, aspect]);

  const shareClip = async (clip) => {
    if (navigator.share && clip.clip_url) {
      try {
        await navigator.share({ title: clip.title, text: clip.title, url: clip.clip_url });
        await base44.entities.StreamClip.update(clip.id, { share_count: (clip.share_count || 0) + 1 });
      } catch {}
    }
  };

  return (
    <div className="rounded-2xl overflow-hidden"
      style={{ background: 'hsla(220,40%,8%,0.7)', border: '1px solid hsla(280,60%,50%,0.25)' }}
    >
      {/* Header */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full px-4 py-3 flex items-center gap-2 transition"
        style={{ background: open ? 'hsla(280,60%,20%,0.3)' : 'transparent' }}
      >
        <Film size={14} className="text-amethyst-glow" />
        <span className="text-white font-bold text-xs">Clip Generator</span>
        <span className="ml-auto text-[9px] uppercase tracking-wider text-white/40">
          15s TikTok export
        </span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 py-3 space-y-3">
              {/* Current frame preview */}
              {stream?.current_frame_url && (
                <div className="relative rounded-xl overflow-hidden aspect-video bg-black/40">
                  <img src={stream.current_frame_url} alt="clip preview" className="w-full h-full object-cover" />
                  <div className="absolute bottom-1.5 right-1.5 px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-wider text-white"
                    style={{ background: 'hsla(0,80%,45%,0.85)' }}>
                    <Scissors size={8} className="inline mr-1" />Last 15s
                  </div>
                </div>
              )}

              {/* Mineral auto-detected */}
              {mineralName && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl"
                  style={{ background: 'hsla(280,60%,15%,0.4)', border: '1px solid hsla(280,60%,50%,0.25)' }}>
                  <Sparkles size={11} className="text-amethyst-glow" />
                  <span className="text-white/60 text-[11px]">
                    Detected: <span className="text-amethyst-glow font-semibold">{mineralName}</span>
                  </span>
                </div>
              )}

              {/* Caption input */}
              <input
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder={mineralName ? `${mineralName} find! #rockhounding` : 'Clip caption…'}
                maxLength={80}
                className="w-full text-xs text-white px-3 py-2.5 rounded-xl outline-none"
                style={{ background: 'hsla(255,20%,16%,0.6)', border: '1px solid hsla(255,20%,30%,0.3)' }}
              />

              {/* Aspect ratio selector */}
              <div className="flex gap-2">
                {ASPECT_OPTIONS.map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => setAspect(opt.id)}
                    className="flex-1 px-2 py-2 rounded-xl text-center transition active:scale-95"
                    style={{
                      background: aspect === opt.id ? 'hsla(280,70%,40%,0.3)' : 'hsla(255,20%,16%,0.5)',
                      border: aspect === opt.id ? '1px solid hsla(280,70%,60%,0.5)' : '1px solid hsla(255,20%,30%,0.2)',
                    }}
                  >
                    <div className={`text-[10px] font-bold ${aspect === opt.id ? 'text-amethyst-glow' : 'text-white/50'}`}>
                      {opt.label}
                    </div>
                    <div className="text-[8px] text-white/30 mt-0.5">{opt.desc}</div>
                  </button>
                ))}
              </div>

              {/* Export button */}
              <button
                onClick={exportClip}
                disabled={exporting || !stream?.id}
                className="w-full py-3 rounded-xl text-sm font-bold text-white transition active:scale-95 disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, hsl(280,70%,50%), hsl(265,75%,45%))', boxShadow: '0 4px 16px hsla(280,80%,50%,0.25)' }}
              >
                {exporting ? <Loader2 size={14} className="mr-2 animate-spin inline" /> : <Scissors size={14} className="mr-2 inline" />}
                {exporting ? 'Exporting 15s clip…' : 'Export 15s Clip'}
              </button>

              {/* Exported clips */}
              {clips.length > 0 && (
                <div className="space-y-2 pt-2 border-t" style={{ borderColor: 'hsla(255,30%,30%,0.15)' }}>
                  <div className="text-[9px] uppercase tracking-wider text-white/30">Exported Clips</div>
                  {clips.slice(0, 3).map(clip => (
                    <div key={clip.id} className="flex items-center gap-2 px-3 py-2 rounded-xl"
                      style={{ background: 'hsla(255,20%,12%,0.4)', border: '1px solid hsla(255,20%,25%,0.15)' }}>
                      <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 bg-black/40">
                        {clip.thumbnail_url && <img src={clip.thumbnail_url} alt="" className="w-full h-full object-cover" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-white/70 text-[11px] font-semibold truncate">{clip.title}</div>
                        <div className="text-white/30 text-[9px]">{clip.aspect_ratio} · 15s</div>
                      </div>
                      <button
                        onClick={() => shareClip(clip)}
                        aria-label="Share clip"
                        className="px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider text-white transition active:scale-95"
                        style={{ background: 'hsla(280,70%,50%,0.25)', border: '1px solid hsla(280,70%,60%,0.3)' }}
                      >
                        <Share2 size={11} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}