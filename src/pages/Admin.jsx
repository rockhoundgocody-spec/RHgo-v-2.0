import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Database, Activity, Shield, Trash2, Plus, Loader2 } from 'lucide-react';
import GlassPanel from '@/components/visuals/GlassPanel.jsx';
import HudFrame from '@/components/visuals/HudFrame.jsx';
import { Button } from '@/components/ui/button';
import MindatCrawlerPanel from '@/components/admin/MindatCrawlerPanel.jsx';


export const clearAllHotspots = async (client = base44, confirmFn = (msg) => typeof window !== 'undefined' && window.confirm ? window.confirm(msg) : true) => {
  if (!confirmFn('Delete all hotspots?')) return false;
  await client.entities.Hotspot.deleteMany({});
  return true;
};

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

  const [seedCount, setSeedCount] = useState(null);
  useEffect(() => {
    if (user?.role !== 'admin') return;
    base44.functions.invoke('seedAdminHotspots', { dry_run: true }).then((r) => setSeedCount(r.data.count));
  }, [user]);

  const seedHotspots = async () => {
    setSeeding(true);
    await base44.functions.invoke('seedAdminHotspots', {});
    await refresh();
    setSeeding(false);
  };

  const clearHotspots = async () => {
    setSeeding(true);
    const deleted = await clearAllHotspots();
    if (deleted) {
      await refresh();
    }
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
                  Inserts {seedCount ?? '…'} curated US rockhounding sites with land-type & trust scores
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