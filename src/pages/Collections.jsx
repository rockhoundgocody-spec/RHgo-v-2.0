import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Plus, Share2, Lock, Globe, Users, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import GlassPanel from '@/components/visuals/GlassPanel.jsx';

export default function Collections() {
  const [filterMode, setFilterMode] = useState('all');
  const [sortBy, setSortBy] = useState('recent');

  const { data: specimens = [], isLoading } = useQuery({
    queryKey: ['specimens'],
    queryFn: () => base44.entities.Specimen.filter({ verified: true }, '-created_date', 100),
  });

  const { data: familyProfiles = [] } = useQuery({
    queryKey: ['familyProfiles'],
    queryFn: () => base44.entities.FamilyProfile.list('-created_date', 10),
  });

  const { data: sharedCollections = [] } = useQuery({
    queryKey: ['sharedCollections'],
    queryFn: () => base44.entities.SharedCollection.list('-created_date', 50),
  });

  const visibilityIcons = {
    'private': Lock,
    'family-only': Users,
    'public': Globe,
  };

  const filteredCollections = useMemo(() => {
    return sharedCollections.filter((c) => {
      if (filterMode === 'owned') return c.creator_email === base44.auth.me?.().email;
      if (filterMode === 'shared') return c.shared_with?.length > 0;
      return true;
    });
  }, [sharedCollections, filterMode]);

  return (
    <div className="min-h-screen px-4 pt-6 pb-24 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-white">Collections</h1>
        <button className="flex items-center gap-2 px-4 py-3 rounded-xl bg-amethyst-deep hover:bg-amethyst text-white font-semibold transition">
          <Plus size={18} /> New Collection
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {['all', 'owned', 'shared'].map((mode) => (
          <button
            key={mode}
            onClick={() => setFilterMode(mode)}
            className={`px-4 py-2 rounded-lg border transition capitalize ${
              filterMode === mode
                ? 'border-amethyst bg-amethyst/20 text-amethyst'
                : 'border-white/10 text-white/60 hover:border-white/30'
            }`}
          >
            {mode}
          </button>
        ))}
      </div>

      {/* Collections grid */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-amethyst/20 border-t-amethyst rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {filteredCollections.map((collection) => {
            const VisIcon = visibilityIcons[collection.visibility] || Globe;
            return (
              <GlassPanel key={collection.id} className="p-5 flex flex-col">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-bold text-white flex-1 line-clamp-2">{collection.title}</h3>
                  <VisIcon size={16} className="text-white/40 shrink-0" />
                </div>

                <p className="text-sm text-white/50 mb-3 line-clamp-2">{collection.description}</p>

                <div className="flex items-center justify-between mb-4 pt-2 border-t border-white/10">
                  <span className="text-xs text-white/40">{collection.specimen_ids?.length || 0} specimens</span>
                  <span className="text-xs text-white/40">{collection.view_count || 0} views</span>
                </div>

                <div className="flex gap-2">
                  <Link
                    to={`/collection/${collection.id}`}
                    className="flex-1 px-3 py-2 rounded-lg bg-amethyst/20 border border-amethyst/30 text-amethyst text-sm font-semibold hover:bg-amethyst/30 transition text-center"
                  >
                    View
                  </Link>
                  {collection.creator_email === base44.auth.me?.().email && (
                    <button className="px-3 py-2 rounded-lg border border-white/20 text-white/60 hover:text-white transition">
                      <Share2 size={16} />
                    </button>
                  )}
                </div>
              </GlassPanel>
            );
          })}
        </div>
      )}

      {/* Family collections */}
      {familyProfiles.length > 0 && (
        <div className="mt-12">
          <h2 className="text-xl font-bold text-white mb-4">Family Collections</h2>
          <div className="space-y-2">
            {familyProfiles.map((family) => (
              <GlassPanel key={family.id} className="p-4 flex items-center justify-between">
                <div>
                  <div className="font-bold text-white">{family.name}</div>
                  <div className="text-xs text-white/50">{family.total_family_finds} total finds</div>
                </div>
                <ChevronRight size={16} className="text-white/30" />
              </GlassPanel>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}