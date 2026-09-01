import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Calendar, Users, Gem, Plus, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import GlassPanel from '@/components/visuals/GlassPanel.jsx';
import CreateCapsuleSheet from '@/components/expeditions/CreateCapsuleSheet.jsx';

/**
 * Expeditions / Memory Capsules
 * Temporal snapshots of field trips with companions, finds, and stories
 */
export default function Expeditions() {
  const [filterMode, setFilterMode] = useState('all');
  const [createOpen, setCreateOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: capsules = [], isLoading } = useQuery({
    queryKey: ['memoryCapsules'],
    queryFn: () =>
      base44.entities.MemoryCapsule.filter({}, '-expedition_date', 50),
  });

  const { data: familyProfile } = useQuery({
    queryKey: ['familyProfile'],
    queryFn: async () => {
      const me = await base44.auth.me();
      const families = await base44.entities.FamilyProfile.filter(
        { owner_email: me.email },
        '-created_date',
        1
      );
      return families[0] || null;
    },
  });

  const moodIcons = {
    excited: '🔥',
    adventurous: '⛰️',
    peaceful: '🧘',
    playful: '😄',
    curious: '🔍',
    satisfied: '😊',
  };

  const filteredCapsules = capsules.filter((c) => {
    if (filterMode === 'family') return c.family_profile_id === familyProfile?.id;
    return true;
  });

  return (
    <div className="min-h-screen px-4 pt-6 pb-24 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Expeditions</h1>
          <p className="text-white/35 text-[11px] uppercase tracking-[0.25em] mt-1">Field trips & memory capsules</p>
        </div>
        <button
          onClick={() => setCreateOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amethyst/20 border border-amethyst/30 hover:bg-amethyst/30 text-amethyst-glow text-sm font-semibold transition"
        >
          <Plus size={15} /> New
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-5">
        {['all', 'family'].map((mode) => (
          <button
            key={mode}
            onClick={() => setFilterMode(mode)}
            className={`px-3.5 py-1.5 rounded-lg border transition text-xs font-medium capitalize ${
              filterMode === mode
                ? 'border-amethyst/50 bg-amethyst/15 text-amethyst-glow'
                : 'border-white/10 text-white/40 hover:border-white/25 hover:text-white/60'
            }`}
          >
            {mode === 'all' ? 'All trips' : 'Family trips'}
          </button>
        ))}
      </div>

      {/* Timeline */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-amethyst/20 border-t-amethyst rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-3">
          {filteredCapsules.map((capsule, i) => (
            <Link key={capsule.id} to={`/expedition/${capsule.id}`}>
              <GlassPanel className="p-4 hover:bg-white/5 transition">
                <div className="flex items-start justify-between mb-2.5">
                  <div className="min-w-0 flex-1 pr-3">
                    <h3 className="text-base font-bold text-white truncate">{capsule.expedition_name}</h3>
                    <p className="text-xs text-white/45 mt-0.5 truncate">{capsule.location_name}</p>
                  </div>
                  <div className="text-xl flex-shrink-0">{moodIcons[capsule.mood_snapshot] || '🏔️'}</div>
                </div>

                {/* Meta info */}
                <div className="flex flex-wrap gap-3 mb-3 text-xs text-white/60">
                  <div className="flex items-center gap-1">
                    <Calendar size={14} /> {new Date(capsule.expedition_date).toLocaleDateString()}
                  </div>
                  <div className="flex items-center gap-1">
                    <Gem size={14} /> {capsule.total_finds} finds
                  </div>
                  {capsule.companion_emails?.length > 0 && (
                    <div className="flex items-center gap-1">
                      <Users size={14} /> {capsule.companion_emails.length} companions
                    </div>
                  )}
                </div>

                {/* Story snippet */}
                {capsule.story && (
                  <p className="text-sm text-white/50 line-clamp-2 mb-3">{capsule.story}</p>
                )}

                {/* Highlights */}
                {capsule.highlights?.length > 0 && (
                  <div className="flex gap-2 mb-3">
                    {capsule.highlights.slice(0, 3).map((url, j) => (
                      <div
                        key={j}
                        className="w-12 h-12 rounded-lg bg-white/10 border border-white/20 overflow-hidden"
                        style={{ backgroundImage: `url(${url})`, backgroundSize: 'cover' }}
                      />
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-end text-white/40 hover:text-white/60">
                  <ChevronRight size={16} />
                </div>
              </GlassPanel>
            </Link>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && filteredCapsules.length === 0 && (
        <GlassPanel className="p-12 text-center">
          <p className="text-white/50 mb-4">No expeditions yet.</p>
          <button
            onClick={() => setCreateOpen(true)}
            className="px-6 py-3 rounded-xl bg-amethyst-deep hover:bg-amethyst text-white font-semibold transition"
          >
            Log Your First Trip
          </button>
        </GlassPanel>
      )}

      <CreateCapsuleSheet
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreate={() => queryClient.invalidateQueries(['memoryCapsules'])}
      />
    </div>
  );
}