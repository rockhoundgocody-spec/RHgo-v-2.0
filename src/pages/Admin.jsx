import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Database, Activity, Shield, Trash2, Plus, Loader2 } from 'lucide-react';
import GlassPanel from '@/components/visuals/GlassPanel.jsx';
import HudFrame from '@/components/visuals/HudFrame.jsx';
import { Button } from '@/components/ui/button';
import MindatCrawlerPanel from '@/components/admin/MindatCrawlerPanel.jsx';

const SEED_HOTSPOTS = [
  { name: 'Crater of Diamonds State Park', state: 'AR', country: 'USA', lat: 34.0353, lng: -93.6713, land_type: 'state_park', minerals: ['Diamond', 'Quartz', 'Jasper'], difficulty: 'easy', description: 'Only public diamond mine in the world. Keep what you find.', trust_score: 0.98, source: 'state_official' },
  { name: 'Herkimer Diamond Mines', state: 'NY', country: 'USA', lat: 43.0392, lng: -74.9788, land_type: 'private', minerals: ['Quartz (Herkimer Diamond)', 'Pyrite'], difficulty: 'easy', description: 'Famous double-terminated quartz crystals.', trust_score: 0.95, source: 'commercial' },
  { name: 'Topaz Mountain', state: 'UT', country: 'USA', lat: 39.7019, lng: -113.1308, land_type: 'blm', minerals: ['Topaz', 'Red Beryl', 'Garnet'], difficulty: 'moderate', description: 'BLM open collecting area for sherry topaz.', trust_score: 0.92, source: 'blm' },
  { name: 'Petrified Forest (Rainbow Forest)', state: 'AZ', country: 'USA', lat: 34.9100, lng: -109.8068, land_type: 'public', minerals: ['Petrified Wood'], difficulty: 'easy', description: 'NPS — collecting prohibited inside park; legal sites adjacent.', rules: 'No collection inside park boundary.', trust_score: 0.99, source: 'nps' },
  { name: 'Graves Mountain', state: 'GA', country: 'USA', lat: 33.5667, lng: -82.6500, land_type: 'private', minerals: ['Rutile', 'Lazulite', 'Pyrophyllite', 'Kyanite'], difficulty: 'moderate', description: 'Open during scheduled rockhound digs.', trust_score: 0.88, source: 'club' },
  { name: 'Emerald Hollow Mine', state: 'NC', country: 'USA', lat: 35.9007, lng: -81.2484, land_type: 'private', minerals: ['Emerald', 'Hiddenite', 'Aquamarine'], difficulty: 'easy', description: 'Pay-to-dig, sluicing & creeking allowed.', trust_score: 0.9, source: 'commercial' },
  { name: 'Mount Antero', state: 'CO', country: 'USA', lat: 38.6741, lng: -106.2467, land_type: 'forest_service', minerals: ['Aquamarine', 'Smoky Quartz', 'Phenakite'], difficulty: 'expert', description: 'High alpine — 14k ft. Casual collecting allowed on USFS.', trust_score: 0.87, source: 'usfs' },
  { name: 'Ellis Jasper Pit', state: 'OR', country: 'USA', lat: 42.4500, lng: -118.5000, land_type: 'blm', minerals: ['Jasper', 'Agate'], difficulty: 'moderate', description: 'Owyhee region BLM lands.', trust_score: 0.82, source: 'blm' },
  { name: 'Royal Peacock Opal Mine', state: 'NV', country: 'USA', lat: 41.6850, lng: -118.7256, land_type: 'private', minerals: ['Black Opal', 'Fire Opal'], difficulty: 'moderate', description: 'Virgin Valley fee-dig opal mine.', trust_score: 0.91, source: 'commercial' },
  { name: 'Wegner Quartz Crystal Mines', state: 'AR', country: 'USA', lat: 34.5667, lng: -93.0833, land_type: 'private', minerals: ['Quartz', 'Calcite'], difficulty: 'easy', description: 'Hot Springs region — clear quartz clusters.', trust_score: 0.93, source: 'commercial' },
  { name: 'Lake Superior Agate Beach', state: 'MN', country: 'USA', lat: 46.9000, lng: -91.5000, land_type: 'public', minerals: ['Lake Superior Agate'], difficulty: 'easy', description: 'Beach combing along North Shore.', trust_score: 0.85, source: 'state_dnr' },
  { name: 'Garnet Hill Recreation Area', state: 'NV', country: 'USA', lat: 39.2603, lng: -114.9631, land_type: 'blm', minerals: ['Almandine Garnet'], difficulty: 'moderate', description: 'BLM rec area, collecting permitted.', trust_score: 0.94, source: 'blm' },
  { name: 'Hogg Mine', state: 'GA', country: 'USA', lat: 33.1833, lng: -84.5667, land_type: 'private', minerals: ['Beryl', 'Aquamarine', 'Tourmaline'], difficulty: 'moderate', description: 'Pegmatite mine open on dig days.', trust_score: 0.86, source: 'club' },
  { name: 'Diamond Hill Mine', state: 'SC', country: 'USA', lat: 34.4500, lng: -82.4500, land_type: 'private', minerals: ['Quartz', 'Smoky Quartz', 'Amethyst'], difficulty: 'easy', description: 'Public-access quartz mine.', trust_score: 0.89, source: 'commercial' },
  { name: 'Tonopah Turquoise Area', state: 'NV', country: 'USA', lat: 38.0667, lng: -117.2300, land_type: 'private', minerals: ['Turquoise'], difficulty: 'hard', description: 'Multiple historic claim mines; permission required.', trust_score: 0.78, source: 'claim' },
].map((hotspot) => ({
  ...hotspot,
  // Seed data is reference material, not publication approval. Every record
  // stays admin-only until its entrance and official rules are reviewed.
  publication_state: 'hold',
  access_status: 'unverified',
  collection_status: 'unknown',
  coordinate_quality: 'unknown',
  navigation_eligible: false,
}));

export default function Admin() {
  const [counts, setCounts] = useState({ hotspots: 0, specimens: 0, minerals: 0 });
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [user, setUser] = useState(null);

  React.useEffect(() => {
    base44.auth.me().then(setUser).catch(() => setUser(null));
  }, []);

  const refresh = async () => {
    setLoading(true);
    const [h, s, m] = await Promise.all([
      base44.entities.Hotspot.list(),
      base44.entities.Specimen.list(),
      base44.entities.Mineral.list(),
    ]);
    setCounts({ hotspots: h.length, specimens: s.length, minerals: m.length });
    setLoading(false);
  };

  useEffect(() => { refresh(); }, []);

  const seedHotspots = async () => {
    setSeeding(true);
    await base44.entities.Hotspot.bulkCreate(SEED_HOTSPOTS);
    await refresh();
    setSeeding(false);
  };

  const clearHotspots = async () => {
    if (!confirm('Delete all hotspots?')) return;
    setSeeding(true);
    const all = await base44.entities.Hotspot.list();
    await Promise.all(all.map((h) => base44.entities.Hotspot.delete(h.id)));
    await refresh();
    setSeeding(false);
  };

  const stats = [
    { label: 'Hotspots', value: counts.hotspots, icon: Database },
    { label: 'Specimens', value: counts.specimens, icon: Activity },
    { label: 'Minerals', value: counts.minerals, icon: Shield },
  ];

  if (user && user.role !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-rose-400 text-center">
          <Shield size={40} className="mx-auto mb-3 opacity-60" />
          <p className="font-bold text-lg">Access Denied</p>
          <p className="text-white/50 text-sm mt-1">Admin access required.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-hud glow-hud tracking-wider">SYSTEM CONTROL</h1>
        <p className="text-hud-cyan/60 text-xs uppercase tracking-[0.3em] mt-2">
          Admin dashboard / data ops
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {stats.map(({ label, value, icon: Icon }) => (
          <GlassPanel variant="hud" key={label}>
            <HudFrame label={label}>
              <div className="flex items-center justify-between py-2">
                <Icon className="text-hud-cyan/60" size={28} />
                <div className="text-4xl font-mono text-hud glow-hud">
                  {loading ? '—' : value}
                </div>
              </div>
            </HudFrame>
          </GlassPanel>
        ))}
      </div>

      <GlassPanel variant="hud" className="mb-6">
        <HudFrame label="Data Operations">
          <div className="space-y-3 py-2">
            <div className="flex items-center justify-between gap-4 p-3 rounded bg-hud-cyan/5 border border-hud-cyan/20">
              <div>
                <div className="text-white font-medium">Seed Hotspot Database</div>
                <div className="text-xs text-hud-cyan/60">
                  Inserts {SEED_HOTSPOTS.length} reference sites on admin-only hold for governance review
                </div>
              </div>
              <Button
                onClick={seedHotspots}
                disabled={seeding}
                className="bg-hud-cyan/20 hover:bg-hud-cyan/30 border border-hud-cyan/50 text-hud"
              >
                {seeding ? <Loader2 className="animate-spin" size={16} /> : <Plus size={16} className="mr-1" />}
                Seed
              </Button>
            </div>
            <div className="flex items-center justify-between gap-4 p-3 rounded bg-rose-400/5 border border-rose-400/20">
              <div>
                <div className="text-white font-medium">Clear All Hotspots</div>
                <div className="text-xs text-rose-300/60">Destructive — removes every hotspot record</div>
              </div>
              <Button
                onClick={clearHotspots}
                disabled={seeding}
                variant="outline"
                className="border-rose-400/40 text-rose-300 hover:bg-rose-400/10"
              >
                <Trash2 size={16} className="mr-1" /> Clear
              </Button>
            </div>
          </div>
        </HudFrame>
      </GlassPanel>

      <MindatCrawlerPanel onComplete={refresh} />

      <GlassPanel variant="hud">
        <HudFrame label="System Status">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 py-2 font-mono text-xs">
            {[
              ['DB', 'OPERATIONAL', 'text-emerald-300'],
              ['AI', 'OPERATIONAL', 'text-emerald-300'],
              ['ETL', 'IDLE', 'text-amber-300'],
              ['AUTH', 'OPERATIONAL', 'text-emerald-300'],
            ].map(([k, v, c]) => (
              <div key={k} className="flex items-center justify-between p-2 rounded bg-black/30">
                <span className="text-hud-cyan/70">{k}</span>
                <span className={c}>● {v}</span>
              </div>
            ))}
          </div>
        </HudFrame>
      </GlassPanel>
    </div>
  );
}
