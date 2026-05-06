/**
 * FieldCorePanel — Detailed Field Core command center
 *
 * Sections:
 *   1. Overview — what Field Core is
 *   2. Portable Memory Vault — visual vault folders
 *   3. Offline AI Stack — local capabilities
 *   4. Field Sync Queue — pending actions
 *   5. Hardware Concept — future device spec
 *   6. Roadmap — phases 1-5
 */
import React, { useState } from 'react';
import {
  X, HardDrive, Map, Gem, BookOpen, Cloud, Zap,
  Package, Lock, Smartphone, Laptop, Glasses,
  ChevronRight, CheckCircle2, Circle, AlertCircle,
} from 'lucide-react';
import GlassPanel from '@/components/visuals/GlassPanel.jsx';

export default function FieldCorePanel({ onClose }) {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl bg-gradient-to-b from-slate-900 via-slate-950 to-black border border-amethyst/20">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-start justify-between p-6 border-b border-amethyst/10 bg-gradient-to-b from-slate-900/95 to-slate-950/80">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-[0.3em] text-amethyst-glow/70 mb-2">
              Field Core
            </div>
            <h2 className="text-2xl font-bold text-white">Portable Offline AI Command Kit</h2>
            <p className="text-sm text-white/50 mt-1">RockHound-GO expedition & sync intelligence</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition text-white/60 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-amethyst/10 px-6 pt-4">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'vault', label: 'Memory Vault' },
            { id: 'ai', label: 'AI Stack' },
            { id: 'sync', label: 'Sync Queue' },
            { id: 'hardware', label: 'Hardware' },
            { id: 'roadmap', label: 'Roadmap' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 text-xs font-mono uppercase tracking-[0.2em] border-b-2 transition ${
                activeTab === tab.id
                  ? 'border-amethyst-glow text-amethyst-glow'
                  : 'border-transparent text-white/40 hover:text-white/70'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {activeTab === 'overview' && <OverviewTab />}
          {activeTab === 'vault' && <VaultTab />}
          {activeTab === 'ai' && <AIStackTab />}
          {activeTab === 'sync' && <SyncQueueTab />}
          {activeTab === 'hardware' && <HardwareTab />}
          {activeTab === 'roadmap' && <RoadmapTab />}
        </div>
      </div>
    </div>
  );
}

function OverviewTab() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-amethyst-glow mb-3">What is Field Core?</h3>
        <p className="text-white/75 text-sm leading-relaxed">
          Field Core transforms RockHound-GO into a portable expedition brain. It carries saved regions, mineral
          reference packs, local scan assistance, field notes, specimen captures, and sync queues so you can keep
          working with little or no signal.
        </p>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-amethyst-glow mb-3">Core Capabilities</h3>
        <ul className="space-y-2">
          {[
            'Offline map caching — explore without cell service',
            'Local specimen shortlist — quick ID when disconnected',
            'Field notes + safety logs — synced when online',
            'Sync queue — automatic uploads on reconnection',
            'Clover offline pack — geology guidance in remote zones',
            'Future hardware bridge — portable dedicated device coming Phase 3',
          ].map((item, i) => (
            <li key={i} className="flex items-start gap-2.5 text-sm text-white/70">
              <CheckCircle2 size={14} className="text-emerald-400 mt-0.5 shrink-0" />
              {item}
            </li>
          ))}
        </ul>
      </div>

      <GlassPanel className="p-4 border-l-2 border-l-amber-500/40">
        <p className="text-xs text-amber-300/80 flex items-start gap-2">
          <span className="mt-0.5">⚠</span>
          <span>
            <strong>Current:</strong> App-level offline Field Mode (Phase 1). <strong>Future:</strong> Dedicated Field
            Core portable device (Phase 3+).
          </span>
        </p>
      </GlassPanel>
    </div>
  );
}

function VaultTab() {
  const vaults = [
    { folder: '/maps', icon: <Map size={14} />, label: 'Maps', desc: 'Cached regions & offline tile layers', count: '3 regions' },
    { folder: '/minerals', icon: <Gem size={14} />, label: 'Minerals', desc: 'Reference packs & ID prompts', count: '287 species' },
    { folder: '/captures', icon: <Package size={14} />, label: 'Captures', desc: 'Specimen photos & scan drafts', count: '24 items' },
    { folder: '/field-notes', icon: <BookOpen size={14} />, label: 'Field Notes', desc: 'Trip notes & site observations', count: '12 notes' },
    { folder: '/sync-queue', icon: <Cloud size={14} />, label: 'Sync Queue', desc: 'Pending uploads & edits', count: '4 pending' },
    { folder: '/assistant', icon: <Zap size={14} />, label: 'Clover Pack', desc: 'Field prompts & guidance', count: 'Updated' },
  ];

  return (
    <div className="space-y-3">
      <p className="text-sm text-white/60">Portable memory vault — organized by expedition intelligence domain</p>
      <div className="space-y-2">
        {vaults.map((v) => (
          <div key={v.folder} className="flex items-start gap-3 p-3 rounded-lg bg-white/5 border border-white/10 hover:border-amethyst/30 transition">
            <div className="text-amethyst-glow mt-0.5">{v.icon}</div>
            <div className="flex-1 min-w-0">
              <div className="font-mono text-xs text-white/40 mb-0.5">{v.folder}</div>
              <h4 className="font-semibold text-white text-sm">{v.label}</h4>
              <p className="text-xs text-white/50 mt-0.5">{v.desc}</p>
            </div>
            <div className="text-xs font-mono text-amethyst-glow/60 shrink-0 text-right">{v.count}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AIStackTab() {
  const capabilities = [
    { name: 'Quick Specimen Shortlist', status: 'Available', detail: 'Local mineral matcher for fast field ID' },
    { name: 'Mineral Property Prompts', status: 'Available', detail: 'Hardness, streak, crystal system guides' },
    { name: 'Safety & Ethics Reminders', status: 'Available', detail: 'Toxicity, extraction rules by location' },
    { name: 'Locality-Aware Guidance', status: 'Cached Data', detail: 'Works when region maps are cached' },
    { name: 'Cloud Deep Analysis', status: 'Deferred', detail: 'Full AI analysis queued for sync' },
  ];

  return (
    <div className="space-y-4">
      <p className="text-sm text-white/60">Offline-capable AI features — cloud analysis deferred until reconnection</p>
      {capabilities.map((cap, i) => (
        <div key={i} className="border-l-2 border-l-hud-cyan/30 pl-4 py-2">
          <div className="flex items-start justify-between mb-1">
            <h4 className="font-semibold text-white text-sm">{cap.name}</h4>
            <span className="text-[10px] font-mono uppercase tracking-[0.1em] px-2 py-0.5 rounded bg-hud-cyan/10 border border-hud-cyan/30 text-hud-cyan">
              {cap.status}
            </span>
          </div>
          <p className="text-xs text-white/50">{cap.detail}</p>
        </div>
      ))}
    </div>
  );
}

function SyncQueueTab() {
  const queued = [
    { type: 'Scan Draft', item: 'Rose Quartz specimen #3', status: 'Ready' },
    { type: 'Collection Entry', item: 'Fluorite find – Rosiclare', status: 'Ready' },
    { type: 'Site Note', item: 'BLM permit observation – Dist. #4', status: 'Ready' },
    { type: 'Safety Report', item: 'Hazard log – Old mine shaft', status: 'Ready' },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-white text-sm">Queued Actions</h3>
        <span className="text-sm font-mono text-amber-300">{queued.length} pending</span>
      </div>

      <div className="space-y-2">
        {queued.map((q, i) => (
          <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-white/5 border border-white/10">
            <AlertCircle size={14} className="text-amber-400 mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-0.5">
                <span className="font-mono text-[10px] text-white/40">{q.type}</span>
                <span className="text-[10px] font-mono text-amber-300">{q.status}</span>
              </div>
              <p className="text-sm text-white/70">{q.item}</p>
            </div>
          </div>
        ))}
      </div>

      <GlassPanel className="p-4 border-l-2 border-l-amber-500/40 mt-4">
        <p className="text-xs text-amber-300/80">
          Queued marketplace drafts are offline only — submission disabled until reconnection to cloud.
        </p>
      </GlassPanel>
    </div>
  );
}

function HardwareTab() {
  return (
    <div className="space-y-6">
      <GlassPanel className="p-4 border-l-2 border-l-amber-500/40">
        <p className="text-xs text-amber-300/80 flex items-start gap-2">
          <span className="mt-0.5">🔮</span>
          <span>
            <strong>Phase 3 Concept:</strong> Hardware designs are future roadmap. Current RockHound-GO operates
            entirely on your phone/tablet with offline caching.
          </span>
        </p>
      </GlassPanel>

      <div>
        <h3 className="text-sm font-semibold text-amethyst-glow mb-3">Field Core Device (Concept)</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { icon: <HardDrive size={16} />, label: 'Portable Storage', detail: 'USB-C / NVMe field drive' },
            { icon: <Lock size={16} />, label: 'Encrypted', detail: 'Secure workspace & data' },
            { icon: <Zap size={16} />, label: 'Offline AI', detail: 'Local model pack option' },
            { icon: <Package size={16} />, label: 'Ruggedized', detail: 'Field-ready protective case' },
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-white/5 border border-white/10">
              <div className="text-amethyst-glow">{item.icon}</div>
              <div>
                <h4 className="font-semibold text-white text-sm">{item.label}</h4>
                <p className="text-xs text-white/50 mt-0.5">{item.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-white/80 mb-3">Ecosystem Pairing</h3>
        <div className="flex items-center justify-between text-xs text-white/60 mb-3 font-mono">
          <span className="flex items-center gap-2">
            <Smartphone size={14} /> Phone/Tablet
          </span>
          <ChevronRight size={14} className="text-white/30" />
          <span className="flex items-center gap-2">
            <HardDrive size={14} /> Field Core
          </span>
          <ChevronRight size={14} className="text-white/30" />
          <span className="flex items-center gap-2">
            <Laptop size={14} /> Laptop
          </span>
          <ChevronRight size={14} className="text-white/30" />
          <span className="flex items-center gap-2">
            <Glasses size={14} /> AR Glasses
          </span>
        </div>
        <p className="text-xs text-white/50">
          Field Core bridges mobile, desktop, and future AR glasses — one portable ecosystem.
        </p>
      </div>
    </div>
  );
}

function RoadmapTab() {
  const phases = [
    {
      num: 1,
      title: 'App-Level Offline Field Mode',
      status: 'Current',
      features: ['Map caching', 'Scan drafts offline', 'Specimen photos saved locally'],
    },
    {
      num: 2,
      title: 'Export & Import Field Packs',
      status: 'Planned',
      features: ['Share cached regions with team', 'Import mineral reference sets', 'Backup/restore field data'],
    },
    {
      num: 3,
      title: 'Portable Field Core Device',
      status: 'Concept',
      features: ['Dedicated hardware', 'Local storage + encryption', 'USB/wireless sync'],
    },
    {
      num: 4,
      title: 'Clover Local Assistant Pack',
      status: 'Concept',
      features: ['Offline AI guidance', 'Geology Q&A cache', 'Field identification prompts'],
    },
    {
      num: 5,
      title: 'AR Glasses Sync Bridge',
      status: 'Roadmap',
      features: ['Live field overlay', 'Head-mounted geology UI', 'Real-time hands-free ID'],
    },
  ];

  return (
    <div className="space-y-4">
      {phases.map((phase) => (
        <div
          key={phase.num}
          className={`border-l-4 pl-4 py-3 ${
            phase.status === 'Current'
              ? 'border-l-emerald-500 bg-emerald-500/10'
              : phase.status === 'Planned'
                ? 'border-l-amber-500 bg-amber-500/10'
                : 'border-l-slate-500 bg-slate-500/10'
          }`}
        >
          <div className="flex items-start justify-between mb-1">
            <h4 className="font-semibold text-white">
              Phase {phase.num}: {phase.title}
            </h4>
            <span
              className={`text-[10px] font-mono uppercase tracking-[0.1em] px-2 py-0.5 rounded ${
                phase.status === 'Current'
                  ? 'bg-emerald-500/20 text-emerald-300'
                  : phase.status === 'Planned'
                    ? 'bg-amber-500/20 text-amber-300'
                    : 'bg-slate-500/20 text-slate-300'
              }`}
            >
              {phase.status}
            </span>
          </div>
          <ul className="text-xs text-white/60 space-y-1">
            {phase.features.map((f, i) => (
              <li key={i} className="flex items-center gap-1.5">
                <Circle size={3} className="text-white/30" />
                {f}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}