import React, { useState } from 'react';
import {
  X, HardDrive, Map, Gem, BookOpen, Cloud, Zap,
  Package, Lock, Smartphone, Laptop, Glasses,
  ChevronRight, CheckCircle2, Circle, AlertCircle,
  Folder, UploadCloud, GitBranch, Code2, Database,
} from 'lucide-react';
import GlassPanel from '@/components/visuals/GlassPanel.jsx';

const PulseStatus = ({ status = 'healthy' }) => {
  const colors = {
    healthy: 'bg-emerald-500',
    warning: 'bg-amber-500',
    error: 'bg-rose-500',
    pending: 'bg-hud-cyan',
  };
  return <div className={`w-2 h-2 rounded-full ${colors[status] || 'bg-emerald-500'} animate-pulse`} />;
};

const CapabilityCard = ({ icon: Icon, title, bullets }) => (
  <div className="p-4 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm">
    <div className="flex items-start gap-3 mb-3">
      <Icon size={16} className="text-amethyst-glow mt-0.5" />
      <h4 className="font-bold text-white text-sm">{title}</h4>
    </div>
    <ul className="space-y-1.5">
      {bullets.map((b, i) => (
        <li key={i} className="text-[11px] text-white/50 flex items-start gap-2">
          <span className="text-amethyst/40 mt-1">•</span>
          <span>{b}</span>
        </li>
      ))}
    </ul>
  </div>
);

const SyncQueueRow = ({ icon: Icon, title, status }) => {
  const statusColor = {
    queued: 'bg-amber-500/10 border-amber-500/25 text-amber-300',
    ready: 'bg-emerald-500/10 border-emerald-500/25 text-emerald-300',
    synced: 'bg-hud-cyan/10 border-hud-cyan/25 text-hud-cyan',
    retrying: 'bg-amber-500/10 border-amber-500/25 text-amber-300',
    conflict: 'bg-rose-500/10 border-rose-500/25 text-rose-300',
  };
  return (
    <div className="flex items-center justify-between py-3 px-3 border-l-2 border-white/10 hover:border-amethyst/30 transition">
      <div className="flex items-center gap-3 flex-1">
        <Icon size={14} className="text-amethyst/60" />
        <span className="text-sm text-white/70">{title}</span>
      </div>
      <div className={`text-[10px] font-mono uppercase tracking-[0.2em] px-2 py-0.5 rounded-full border ${statusColor[status]}`}>
        {status}
      </div>
    </div>
  );
};

const MemoryFolder = ({ name, description }) => (
  <div className="p-3 rounded-lg border border-white/10 bg-white/5 flex items-start gap-2">
    <Folder size={14} className="text-hud-cyan mt-0.5" />
    <div className="flex-1">
      <div className="text-sm font-mono text-hud-cyan">{name}</div>
      <div className="text-[10px] text-white/40 mt-0.5">{description}</div>
    </div>
  </div>
);

const DataModelCard = ({ title, fields }) => (
  <div className="p-3 rounded-lg border border-white/10 bg-white/5">
    <div className="text-sm font-bold text-amethyst-glow mb-2">{title}</div>
    <div className="space-y-1">
      {fields.map((f, i) => (
        <div key={i} className="text-[10px] text-white/40 font-mono">
          <span className="text-hud-cyan">{f.name}</span>
          <span className="text-white/20">: {f.type}</span>
        </div>
      ))}
    </div>
  </div>
);

const RoadmapPhase = ({ phase, title, description }) => (
  <div className="flex items-start gap-3">
    <div className="w-8 h-8 rounded-full bg-amethyst/20 border border-amethyst/40 flex items-center justify-center shrink-0 font-bold text-amethyst text-xs">
      {phase}
    </div>
    <div className="flex-1">
      <div className="font-semibold text-white text-sm">{title}</div>
      <div className="text-[11px] text-white/50 mt-0.5">{description}</div>
    </div>
  </div>
);

export default function FieldCorePanel({ onClose }) {
  const [expandedSection, setExpandedSection] = useState('overview');

  const toggleSection = (id) => setExpandedSection(expandedSection === id ? null : id);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-lg z-50 overflow-y-auto">
      <div className="max-w-2xl mx-auto px-4 py-6 pb-24">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 sticky top-0 bg-black/60 backdrop-blur py-3 px-4 rounded-2xl">
          <div className="flex items-center gap-3">
            <HardDrive size={20} className="text-amethyst-glow" />
            <span className="text-xl font-bold text-white">Field Core</span>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center transition text-white/50 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-6">
          {/* SECTION 1: Overview */}
          <GlassPanel variant="amethyst" className="p-5">
            <div className="space-y-3">
              <h2 className="text-lg font-bold text-white">Field Core Overview</h2>
              <p className="text-sm text-white/70 leading-relaxed">
                Field Core turns RockHound-GO into a portable expedition brain. It carries saved regions, mineral reference packs, local scan assistance, field notes, specimen captures, and sync queues so you can keep working with little or no signal.
              </p>
              <div className="mt-4 flex flex-col gap-1.5">
                <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-amethyst/60 mb-2">Ecosystem Roadmap</div>
                {['App Hub', 'Offline Field Mode', 'Local-First Field Database', 'Portable Field Core', 'Clover', 'AR glasses'].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-[11px]">
                    <div className="w-1.5 h-1.5 rounded-full bg-amethyst/40" />
                    <span className="text-white/60">{item}</span>
                    {i < 5 && <ChevronRight size={10} className="ml-auto text-white/20" />}
                  </div>
                ))}
              </div>
            </div>
          </GlassPanel>

          {/* SECTION 2: Local-First Field Database */}
          <GlassPanel variant="hud" className="p-5">
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-bold text-white">Local-First Field Database</h2>
                  <p className="text-[10px] text-hud-cyan/60 uppercase tracking-[0.2em] mt-1">Field records stay usable offline and sync safely later</p>
                </div>
                <div className="text-[8px] uppercase tracking-[0.25em] px-2 py-1 rounded-full border border-hud-cyan/30 bg-hud-cyan/10 text-hud-cyan/70 font-mono shrink-0">
                  iOS Field Mode Ready
                </div>
              </div>
              <p className="text-sm text-white/70 leading-relaxed mt-3">
                RockHound-GO stores field-critical records locally first, then syncs when a reliable connection returns. Finds, photos, scan drafts, saved sites, map packs, notes, and field records remain available in remote collecting terrain.
              </p>
              <div className="mt-4 flex flex-col gap-2 text-[11px]">
                <div className="font-mono uppercase tracking-[0.2em] text-hud-cyan/60 mb-1">Sync Pipeline</div>
                {['Capture in Field', 'Save Local', 'Queue Sync', 'Reconnect', 'Resolve Conflicts', 'Cloud Update'].map((step, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-hud-cyan/30" />
                    <span className="text-white/50">{step}</span>
                    {i < 5 && <ChevronRight size={10} className="ml-auto text-white/20" />}
                  </div>
                ))}
              </div>
            </div>
          </GlassPanel>

          {/* SECTION 3: Capability Cards */}
          <div className="space-y-3">
            <h2 className="text-lg font-bold text-white px-1">Core Capabilities</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <CapabilityCard
                icon={Gem}
                title="Local Collections"
                bullets={[
                  'saved findings',
                  'specimen metadata',
                  'notes and photos',
                  'scan confidence history',
                ]}
              />
              <CapabilityCard
                icon={Map}
                title="Saved Site Packs"
                bullets={[
                  'site details',
                  'access notes',
                  'route notes',
                  'expected minerals',
                  'offline map regions',
                ]}
              />
              <CapabilityCard
                icon={BookOpen}
                title="Scan Draft Store"
                bullets={[
                  'captured photos',
                  'quick ID candidates',
                  'pending deep analysis jobs',
                  'user corrections',
                ]}
              />
              <CapabilityCard
                icon={Cloud}
                title="Sync Queue"
                bullets={[
                  'queued creates',
                  'queued edits',
                  'queued uploads',
                  'retry status',
                  'conflict flags',
                ]}
              />
              <CapabilityCard
                icon={AlertCircle}
                title="Conflict Resolver"
                bullets={[
                  'safe merge logic',
                  'preserve user notes',
                  'duplicate finding detection',
                  'manual review for conflicting records',
                ]}
              />
              <CapabilityCard
                icon={Lock}
                title="Secure Field Cache"
                bullets={[
                  'encrypted local records',
                  'protected media links when online',
                  'private exact GPS for collection',
                  'generalized location for sharing',
                ]}
              />
            </div>
          </div>

          {/* SECTION 4: Sync Queue Preview */}
          <GlassPanel className="p-5">
            <div className="space-y-3">
              <h2 className="text-lg font-bold text-white">Field Sync Queue</h2>
              <div className="space-y-1">
                <SyncQueueRow icon={BookOpen} title="Scan Draft: Fluorite candidate" status="pending" />
                <SyncQueueRow icon={Gem} title="Collection Edit: Quartz note update" status="queued" />
                <SyncQueueRow icon={Map} title="Site Pack: Rosiclare cache refresh" status="ready" />
                <SyncQueueRow icon={BookOpen} title="Field Note: creek access note" status="queued" />
              </div>
            </div>
          </GlassPanel>

          {/* SECTION 5: Portable Memory Vault */}
          <div className="space-y-3">
            <h2 className="text-lg font-bold text-white px-1">Portable Memory Vault</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <MemoryFolder name="/maps" description="Cached regions and offline tiles" />
              <MemoryFolder name="/minerals" description="Mineral reference packs and ID prompts" />
              <MemoryFolder name="/captures" description="Specimen photos and scan drafts" />
              <MemoryFolder name="/field-notes" description="Trip notes, site observations, and field logs" />
              <MemoryFolder name="/sync-queue" description="Pending uploads, collection edits, and reports" />
              <MemoryFolder name="/assistant" description="Clover field prompts and local guidance packs" />
            </div>
          </div>

          {/* SECTION 6: Developer Architecture Notes */}
          <GlassPanel className="p-5">
            <button
              onClick={() => toggleSection('arch')}
              className="w-full flex items-center justify-between py-2 mb-3"
            >
              <div className="flex items-center gap-2">
                <Code2 size={16} className="text-hud-cyan" />
                <h2 className="text-lg font-bold text-white">Developer Architecture Notes</h2>
              </div>
              <ChevronRight size={16} className={`text-white/30 transition ${expandedSection === 'arch' ? 'rotate-90' : ''}`} />
            </button>
            {expandedSection === 'arch' && (
              <ul className="space-y-1.5 text-[11px] text-white/60">
                <li className="flex items-start gap-2"><span className="text-amethyst/40 mt-0.5">•</span> React Native / Expo client</li>
                <li className="flex items-start gap-2"><span className="text-amethyst/40 mt-0.5">•</span> local database abstraction for iOS and Android</li>
                <li className="flex items-start gap-2"><span className="text-amethyst/40 mt-0.5">•</span> Couchbase Lite-style document store or SQLite fallback</li>
                <li className="flex items-start gap-2"><span className="text-amethyst/40 mt-0.5">•</span> future server sync gateway</li>
                <li className="flex items-start gap-2"><span className="text-amethyst/40 mt-0.5">•</span> encrypted local storage for sensitive records</li>
                <li className="flex items-start gap-2"><span className="text-amethyst/40 mt-0.5">•</span> deterministic sync queue with retries</li>
                <li className="flex items-start gap-2"><span className="text-amethyst/40 mt-0.5">•</span> conflict metadata per record</li>
                <li className="flex items-start gap-2"><span className="text-amethyst/40 mt-0.5">•</span> exact GPS private by default</li>
                <li className="flex items-start gap-2"><span className="text-amethyst/40 mt-0.5">•</span> generalized geo for shared/community surfaces</li>
              </ul>
            )}
          </GlassPanel>

          {/* SECTION 7: Data Model Preview */}
          <div className="space-y-3">
            <h2 className="text-lg font-bold text-white px-1">Data Model Preview</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <DataModelCard
                title="FindingDoc"
                fields={[
                  { name: 'id', type: 'string' },
                  { name: 'userId', type: 'string' },
                  { name: 'photos', type: 'string[]' },
                  { name: 'geoPrivate', type: 'geo' },
                  { name: 'mineralCandidate', type: 'string' },
                  { name: 'notes', type: 'string' },
                  { name: 'syncStatus', type: 'enum' },
                  { name: 'updatedAt', type: 'timestamp' },
                ]}
              />
              <DataModelCard
                title="SitePackDoc"
                fields={[
                  { name: 'id', type: 'string' },
                  { name: 'siteId', type: 'string' },
                  { name: 'mapRegion', type: 'geo' },
                  { name: 'accessNotes', type: 'string' },
                  { name: 'expectedMinerals', type: 'string[]' },
                  { name: 'cacheExpiresAt', type: 'timestamp' },
                ]}
              />
              <DataModelCard
                title="ScanDraftDoc"
                fields={[
                  { name: 'id', type: 'string' },
                  { name: 'imageLocalUri', type: 'string' },
                  { name: 'quickCandidates', type: 'object[]' },
                  { name: 'deepJobStatus', type: 'enum' },
                  { name: 'corrections', type: 'object' },
                  { name: 'syncStatus', type: 'enum' },
                ]}
              />
              <DataModelCard
                title="SyncEventDoc"
                fields={[
                  { name: 'id', type: 'string' },
                  { name: 'entityType', type: 'enum' },
                  { name: 'operation', type: 'enum' },
                  { name: 'payload', type: 'object' },
                  { name: 'retryCount', type: 'number' },
                  { name: 'conflictState', type: 'object' },
                  { name: 'createdAt', type: 'timestamp' },
                ]}
              />
            </div>
          </div>

          {/* SECTION 8: Field Mode Roadmap */}
          <div className="space-y-3">
            <h2 className="text-lg font-bold text-white px-1">Field Mode Roadmap</h2>
            <GlassPanel className="p-5">
              <div className="space-y-4">
                <RoadmapPhase phase="1" title="Local Collection Database" description="Local collection database and offline find access" />
                <RoadmapPhase phase="2" title="Saved Site Packs & Maps" description="Saved site packs and map cache manifest" />
                <RoadmapPhase phase="3" title="Scan Queueing" description="Queued scan and deep-analysis jobs" />
                <RoadmapPhase phase="4" title="Conflict Resolution" description="Conflict resolver and sync audit trail" />
                <RoadmapPhase phase="5" title="Portable Export Packs" description="Portable Field Core export/import packs" />
              </div>
            </GlassPanel>
          </div>

          {/* SECTION 9: Hardware Concept */}
          <GlassPanel variant="hud" className="p-5">
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <h2 className="text-lg font-bold text-white">Portable Field Core Device</h2>
                <div className="text-[8px] uppercase tracking-[0.25em] px-2 py-1 rounded-full border border-hud-cyan/30 bg-hud-cyan/10 text-hud-cyan/70 font-mono shrink-0">
                  Future Concept
                </div>
              </div>
              <p className="text-sm text-white/70 leading-relaxed">
                The physical Field Core concept is a future rugged portable storage and AI module for field teams. It is not a finished shipping product. The current app feature is Offline Field Mode and Local-First Field Database.
              </p>
              <div className="mt-4 space-y-2 text-[11px]">
                <div className="font-mono uppercase tracking-[0.2em] text-hud-cyan/60 mb-2">Hardware Specifications</div>
                <div className="flex items-start gap-2">
                  <Smartphone size={12} className="text-hud-cyan mt-0.5" />
                  <span className="text-white/60">USB-C / NVMe portable field drive</span>
                </div>
                <div className="flex items-start gap-2">
                  <Lock size={12} className="text-hud-cyan mt-0.5" />
                  <span className="text-white/60">encrypted workspace</span>
                </div>
                <div className="flex items-start gap-2">
                  <Package size={12} className="text-hud-cyan mt-0.5" />
                  <span className="text-white/60">optional local model pack</span>
                </div>
                <div className="flex items-start gap-2">
                  <Zap size={12} className="text-hud-cyan mt-0.5" />
                  <span className="text-white/60">ruggedized case concept</span>
                </div>
                <div className="flex items-start gap-2">
                  <GitBranch size={12} className="text-hud-cyan mt-0.5" />
                  <span className="text-white/60">pairs with mobile app, laptop, and future AR glasses</span>
                </div>
              </div>
            </div>
          </GlassPanel>
        </div>
      </div>
    </div>
  );
}