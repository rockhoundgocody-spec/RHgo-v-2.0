/**
 * Clubs — Gem & Mineral Club Chapter Portal.
 * Lists club chapters, upcoming events, and lets users discover or create chapters.
 * Links testimonials and pre-signups into an institutional event management hub.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { Users, MapPin, Calendar, Plus, Building2, Globe, Mail, CheckCircle2, Clock, Mountain } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSeoRobots } from '@/lib/useSeoRobots';
import { useSeoMeta } from '@/lib/useSeoMeta';

const EVENT_TYPE_CONFIG = {
  field_trip: { label: 'Field Trip', icon: Mountain, color: '#34d399' },
  meeting:    { label: 'Meeting',    icon: Users,    color: '#38bdf8' },
  show:       { label: 'Show',       icon: Building2, color: '#c084fc' },
  auction:    { label: 'Auction',    icon: Mountain, color: '#fbbf24' },
  workshop:   { label: 'Workshop',   icon: CheckCircle2, color: '#fb923c' },
  social:     { label: 'Social',     icon: Users,    color: '#f472b6' },
};

export default function Clubs() {
  useSeoRobots(true);
  useSeoMeta(
    'Gem & mineral clubs near you — RockHound-GO',
    'Discover local gem and mineral club chapters, field trips, shows, and workshops on RockHound-GO.',
  );
  const [chapters, setChapters] = useState(null);
  const [events, setEvents] = useState(null);
  const [me, setMe] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [rsvpMap, setRsvpMap] = useState({});

  useEffect(() => {
    base44.auth.me().then(setMe).catch(() => setMe(null));
  }, []);

  const load = useCallback(async () => {
    try {
      const [chap, evs] = await Promise.all([
        base44.entities.ClubChapter.list('-created_date', 50),
        base44.entities.ClubEvent.list('-start_at', 30),
      ]);
      setChapters(chap || []);
      setEvents(evs || []);
      // Build RSVP map for current user
      if (me?.email) {
        const map = {};
        (evs || []).forEach(e => {
          if (e.rsvp_emails?.includes(me.email)) map[e.id] = true;
        });
        setRsvpMap(map);
      }
    } catch {
      setChapters([]);
      setEvents([]);
    }
  }, [me]);

  useEffect(() => { load(); }, [load]);

  const handleRsvp = async (event) => {
    if (!me?.email) { window.location.href = '/login'; return; }
    const isRsvped = rsvpMap[event.id];
    const newEmails = isRsvped
      ? (event.rsvp_emails || []).filter(e => e !== me.email)
      : [...(event.rsvp_emails || []), me.email];
    try {
      await base44.entities.ClubEvent.update(event.id, {
        rsvp_emails: newEmails,
        rsvp_count: newEmails.length,
      });
      setRsvpMap(prev => ({ ...prev, [event.id]: !isRsvped }));
      setEvents(prev => prev.map(e => e.id === event.id
        ? { ...e, rsvp_emails: newEmails, rsvp_count: newEmails.length }
        : e));
    } catch {}
  };

  const upcomingEvents = (events || []).filter(e => e.status === 'upcoming' || !e.status);

  return (
    <div className="w-full max-w-md mx-auto px-3 pb-28 pt-4 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-lg font-black text-white tracking-tight leading-none">Club Chapters</h1>
          <p className="text-white/55 text-[9px] uppercase tracking-[0.22em] mt-1">
            Gem & Mineral Societies
          </p>
        </div>
        {me && (
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-bold uppercase tracking-wider text-white transition active:scale-95"
            style={{ background: 'linear-gradient(135deg, hsl(280,70%,50%), hsl(265,75%,45%))', boxShadow: '0 4px 12px hsla(280,80%,50%,0.25)' }}
          >
            <Plus size={13} /> Start Chapter
          </button>
        )}
      </div>

      {/* Chapters list */}
      {chapters === null ? (
        <div className="space-y-3">
          {[0, 1].map(i => <div key={i} className="h-24 rounded-2xl animate-pulse" style={{ background: 'hsla(220,40%,10%,0.6)' }} />)}
        </div>
      ) : chapters.length === 0 ? (
        <div className="rounded-2xl px-5 py-10 text-center" style={{ background: 'hsla(220,40%,6%,0.6)', border: '1px solid hsla(270,30%,25%,0.3)' }}>
          <Users size={30} className="mx-auto text-white/20 mb-3" />
          <p className="text-white/70 text-sm font-semibold">No chapters yet</p>
          <p className="text-white/40 text-xs mt-1.5">Start the first gem & mineral club chapter in your area.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {chapters.map(chapter => (
            <ChapterCard key={chapter.id} chapter={chapter} events={upcomingEvents.filter(e => e.chapter_id === chapter.id)} />
          ))}
        </div>
      )}

      {/* Upcoming events */}
      {upcomingEvents.length > 0 && (
        <div className="pt-2">
          <h2 className="text-white font-bold text-sm mb-3 flex items-center gap-2">
            <Calendar size={14} className="text-amethyst-glow" /> Upcoming Events
          </h2>
          <div className="space-y-2">
            {upcomingEvents.slice(0, 10).map(event => {
              const config = EVENT_TYPE_CONFIG[event.event_type] || EVENT_TYPE_CONFIG.meeting;
              const Icon = config.icon;
              const isRsvped = rsvpMap[event.id];
              const chapter = chapters?.find(c => c.id === event.chapter_id);
              return (
                <div key={event.id} className="rounded-2xl p-4"
                  style={{ background: 'hsla(255,22%,12%,0.7)', border: '1px solid hsla(270,30%,40%,0.2)' }}>
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: `${config.color}18`, border: `1px solid ${config.color}30` }}>
                      <Icon size={16} style={{ color: config.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full"
                          style={{ background: `${config.color}15`, color: config.color }}>
                          {config.label}
                        </span>
                        {event.start_at && (
                          <span className="text-white/40 text-[10px] font-mono">
                            {new Date(event.start_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </span>
                        )}
                      </div>
                      <h3 className="text-white font-bold text-sm leading-tight">{event.title}</h3>
                      {chapter && <p className="text-white/40 text-[10px] mt-0.5">{chapter.name}</p>}
                      {event.location_label && (
                        <div className="flex items-center gap-1 mt-1.5">
                          <MapPin size={9} className="text-white/30" />
                          <span className="text-white/40 text-[10px] truncate">{event.location_label}</span>
                        </div>
                      )}
                      {event.description && <p className="text-white/45 text-[11px] mt-1.5 line-clamp-2">{event.description}</p>}
                      <div className="flex items-center justify-between mt-2.5">
                        <span className="text-white/35 text-[10px] flex items-center gap-1">
                          <Users size={9} /> {event.rsvp_count || 0} attending
                        </span>
                        <button
                          onClick={() => handleRsvp(event)}
                          className="px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition active:scale-95"
                          style={{
                            background: isRsvped ? 'hsla(150,60%,30%,0.3)' : 'hsla(280,70%,45%,0.25)',
                            border: isRsvped ? '1px solid hsla(150,70%,50%,0.4)' : '1px solid hsla(280,70%,60%,0.3)',
                            color: isRsvped ? '#34d399' : '#e0b0ff',
                          }}
                        >
                          {isRsvped ? <CheckCircle2 size={11} className="inline mr-1" /> : null}
                          {isRsvped ? 'Going' : 'RSVP'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Create chapter modal */}
      <AnimatePresence>
        {showCreate && me && (
          <CreateChapterForm
            me={me}
            onSaved={() => { setShowCreate(false); load(); }}
            onClose={() => setShowCreate(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function ChapterCard({ chapter, events }) {
  return (
    <div className="rounded-2xl p-4"
      style={{ background: 'linear-gradient(145deg, hsla(255,25%,12%,0.8), hsla(250,22%,8%,0.9))', border: '1px solid hsla(270,30%,40%,0.2)' }}>
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-xl overflow-hidden flex items-center justify-center shrink-0"
          style={{ background: 'hsla(280,60%,20%,0.4)', border: '1px solid hsla(280,60%,50%,0.2)' }}>
          {chapter.image_url
            ? <img src={chapter.image_url} alt={chapter.name} className="w-full h-full object-cover" />
            : <Building2 size={20} className="text-amethyst-glow/60" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <h3 className="text-white font-bold text-sm truncate">{chapter.name}</h3>
            {chapter.is_verified && <CheckCircle2 size={12} className="text-hud-cyan shrink-0" />}
          </div>
          {chapter.location_label && (
            <div className="flex items-center gap-1 mt-0.5">
              <MapPin size={9} className="text-white/30" />
              <span className="text-white/40 text-[10px]">{chapter.location_label}</span>
            </div>
          )}
          {chapter.meeting_schedule && (
            <div className="flex items-center gap-1 mt-0.5">
              <Clock size={9} className="text-white/30" />
              <span className="text-white/40 text-[10px]">{chapter.meeting_schedule}</span>
            </div>
          )}
        </div>
      </div>

      {chapter.testimonial && (
        <p className="text-white/50 text-[11px] italic mt-2.5 px-3 py-2 rounded-lg"
          style={{ background: 'hsla(280,40%,15%,0.3)', border: '1px solid hsla(280,40%,40%,0.15)' }}>
          "{chapter.testimonial}"
        </p>
      )}

      <div className="flex items-center gap-3 mt-2.5 pt-2.5 border-t" style={{ borderColor: 'hsla(255,30%,30%,0.15)' }}>
        <span className="text-white/40 text-[10px] flex items-center gap-1">
          <Users size={9} /> {chapter.member_count || 0} members
        </span>
        {events.length > 0 && (
          <span className="text-amethyst-glow text-[10px] flex items-center gap-1">
            <Calendar size={9} /> {events.length} upcoming
          </span>
        )}
        {chapter.contact_email && (
          <a href={`mailto:${chapter.contact_email}`} className="ml-auto text-white/30 hover:text-white/60 transition">
            <Mail size={11} />
          </a>
        )}
        {chapter.website_url && (
          <a href={chapter.website_url} target="_blank" rel="noopener noreferrer" className="text-white/30 hover:text-white/60 transition">
            <Globe size={11} />
          </a>
        )}
      </div>
    </div>
  );
}

function CreateChapterForm({ me, onSaved, onClose }) {
  const [form, setForm] = useState({
    name: '',
    location_label: '',
    meeting_schedule: '',
    contact_email: me?.email || '',
    description: '',
    testimonial: '',
  });
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const slug = form.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      await base44.entities.ClubChapter.create({
        ...form,
        slug,
        owner_email: me.email,
      });
      onSaved();
    } catch {}
    setSaving(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ background: 'hsla(245,30%,4%,0.75)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-md rounded-t-3xl p-5 overflow-y-auto"
        style={{ maxHeight: 'calc(100dvh - 60px)', background: 'linear-gradient(180deg, hsl(252 22% 12%) 0%, hsl(248 24% 7%) 100%)', border: '1px solid hsla(270,50%,60%,0.22)' }}
      >
        <h2 className="text-white font-bold text-base mb-4 text-center">Start a Club Chapter</h2>

        <div className="mb-3">
          <label className="block text-white/40 text-[10px] uppercase tracking-widest mb-1">Chapter Name *</label>
          <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Chicago Rocks & Minerals Society" className="input-base" />
        </div>

        <div className="mb-3">
          <label className="block text-white/40 text-[10px] uppercase tracking-widest mb-1">Location</label>
          <input value={form.location_label} onChange={e => set('location_label', e.target.value)} placeholder="City, State" className="input-base" />
        </div>

        <div className="mb-3">
          <label className="block text-white/40 text-[10px] uppercase tracking-widest mb-1">Meeting Schedule</label>
          <input value={form.meeting_schedule} onChange={e => set('meeting_schedule', e.target.value)} placeholder="2nd Tuesday of each month, 7pm" className="input-base" />
        </div>

        <div className="mb-3">
          <label className="block text-white/40 text-[10px] uppercase tracking-widest mb-1">Contact Email</label>
          <input value={form.contact_email} onChange={e => set('contact_email', e.target.value)} placeholder="club@example.com" className="input-base" />
        </div>

        <div className="mb-3">
          <label className="block text-white/40 text-[10px] uppercase tracking-widest mb-1">Description</label>
          <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={3} placeholder="What your club does, specialties, community focus…" className="input-base resize-none" />
        </div>

        <div className="mb-3">
          <label className="block text-white/40 text-[10px] uppercase tracking-widest mb-1">Member Testimonial</label>
          <input value={form.testimonial} onChange={e => set('testimonial', e.target.value)} placeholder="A short quote about your chapter" className="input-base" />
        </div>

        <div className="flex gap-3 mt-5">
          <button onClick={onClose} className="flex-1 py-3 rounded-2xl text-sm font-semibold text-white/40" style={{ background: 'hsla(255,20%,18%,0.5)', border: '1px solid hsla(255,20%,30%,0.25)' }}>
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!form.name.trim() || saving}
            className="flex-1 py-3 rounded-2xl text-sm font-bold text-white disabled:opacity-40"
            style={{ background: 'linear-gradient(135deg, hsl(280,70%,55%), hsl(265,75%,45%))', boxShadow: '0 4px 20px hsla(280,80%,50%,0.3)' }}
          >
            {saving ? 'Creating…' : 'Create Chapter'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}