import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Calendar, Users, Share2, Edit, MapIcon, Gem } from 'lucide-react';
import GlassPanel from '@/components/visuals/GlassPanel.jsx';

/**
 * Expedition Detail Page
 * Full memory capsule: story, finds, companions, map, goals
 */
export default function ExpeditionDetail() {
  const { expeditionId } = useParams();
  const [showMap, setShowMap] = useState(false);

  const { data: capsule, isLoading } = useQuery({
    queryKey: ['expedition', expeditionId],
    queryFn: () => base44.entities.MemoryCapsule.get(expeditionId),
  });

  const { data: specimens = [] } = useQuery({
    queryKey: ['expeditionSpecimens', expeditionId],
    queryFn: () =>
      capsule
        ? base44.entities.Specimen.filter(
            { memory_capsule_id: expeditionId },
            '-found_date',
            100
          )
        : [],
    enabled: !!capsule,
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="w-8 h-8 border-4 border-amethyst/20 border-t-amethyst rounded-full animate-spin" />
      </div>
    );
  }

  if (!capsule) {
    return (
      <div className="min-h-screen px-4 pt-6 text-center text-white/50">
        Expedition not found
      </div>
    );
  }

  const moodIcons = {
    excited: '🔥',
    adventurous: '⛰️',
    peaceful: '🧘',
    playful: '😄',
    curious: '🔍',
    satisfied: '😊',
  };

  return (
    <div className="min-h-screen px-4 pt-6 pb-24 max-w-4xl mx-auto">
      {/* Hero section */}
      <div className="mb-8">
        {capsule.highlights?.[0] && (
          <div className="w-full h-64 rounded-2xl overflow-hidden mb-6 border border-white/10"
            style={{
              backgroundImage: `url(${capsule.highlights[0]})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />
        )}

        <div className="flex items-start justify-between mb-4">
          <h1 className="text-4xl font-bold text-white">{capsule.expedition_name}</h1>
          <div className="text-5xl">{moodIcons[capsule.mood_snapshot]}</div>
        </div>

        <p className="text-white/60 text-lg mb-6">{capsule.location_name}</p>

        {/* Meta */}
        <div className="flex flex-wrap gap-4 mb-6 text-sm text-white/60">
          <div className="flex items-center gap-2">
            <Calendar size={16} /> {new Date(capsule.expedition_date).toLocaleDateString()}
          </div>
          {capsule.companion_emails?.length > 0 && (
            <div className="flex items-center gap-2">
              <Users size={16} /> {capsule.companion_emails.join(', ')}
            </div>
          )}
          <div className="flex items-center gap-2">
            <MapIcon size={16} /> {capsule.difficulty_level}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-3 rounded-xl border border-white/20 text-white hover:bg-white/5 transition">
            <Edit size={16} /> Edit
          </button>
          <button className="flex items-center gap-2 px-4 py-3 rounded-xl border border-white/20 text-white hover:bg-white/5 transition">
            <Share2 size={16} /> Share
          </button>
          <button
            onClick={() => setShowMap(!showMap)}
            className="flex items-center gap-2 px-4 py-3 rounded-xl bg-amethyst-deep hover:bg-amethyst text-white font-semibold transition"
          >
            <MapIcon size={16} /> Map
          </button>
        </div>
      </div>

      {/* Story */}
      {capsule.story && (
        <GlassPanel className="p-6 mb-8">
          <h2 className="text-lg font-bold text-white mb-3">The Story</h2>
          <p className="text-white/70 whitespace-pre-line leading-relaxed">{capsule.story}</p>
        </GlassPanel>
      )}

      {/* Finds */}
      <div className="mb-8">
        <h2 className="text-lg font-bold text-white mb-4">Finds ({specimens.length})</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {specimens.map((specimen) => (
            <GlassPanel key={specimen.id} className="p-4 cursor-pointer hover:bg-white/5 transition">
              <div className="aspect-square rounded-lg bg-white/5 border border-white/10 mb-3 flex items-center justify-center">
                {specimen.image_url ? (
                  <img src={specimen.image_url} alt={specimen.mineral_name} className="w-full h-full object-cover rounded-lg" />
                ) : (
                  <Gem size={24} className="text-amethyst/40" />
                )}
              </div>
              <div className="text-sm font-bold text-white">{specimen.mineral_name}</div>
              <div className="text-xs text-white/50">{specimen.common_name}</div>
            </GlassPanel>
          ))}
        </div>
      </div>

      {/* Goals for next time */}
      {capsule.next_goals && (
        <GlassPanel className="p-6 mb-8">
          <h3 className="text-lg font-bold text-white mb-3">Goals for Next Time</h3>
          <p className="text-white/70">{capsule.next_goals}</p>
        </GlassPanel>
      )}

      {/* Weather snapshot */}
      {capsule.weather_snapshot && (
        <GlassPanel className="p-4 mb-8">
          <div className="text-xs text-white/50 uppercase tracking-wide mb-2">Weather</div>
          <div className="flex items-center gap-4 text-sm text-white">
            <span>{capsule.weather_snapshot.condition}</span>
            <span>{capsule.weather_snapshot.temperature_f}°F</span>
            <span>{capsule.weather_snapshot.humidity}% humidity</span>
          </div>
        </GlassPanel>
      )}
    </div>
  );
}