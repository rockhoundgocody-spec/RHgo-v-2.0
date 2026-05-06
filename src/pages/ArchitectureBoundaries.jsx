import React, { useState } from 'react';
import { Check, X, ChevronDown, ChevronUp } from 'lucide-react';
import GlassPanel from '@/components/visuals/GlassPanel.jsx';

export default function ArchitectureBoundaries() {
  const [expandedSection, setExpandedSection] = useState('backend-owns');

  const sections = [
    {
      id: 'backend-owns',
      title: 'Backend Owns (Authority)',
      color: 'border-rose-500/30 bg-rose-500/5',
      items: [
        'Authentication authority',
        'User accounts and roles',
        'Database writes',
        'AI deep analysis jobs',
        'Scan result persistence',
        'Payment/subscription logic',
        'Stripe secret keys',
        'Stripe webhooks',
        'Marketplace orders',
        'Escrow state',
        'Moderation/report handling',
        'Signed media URLs',
        'Sync validation',
        'Conflict resolution authority',
        'Legal/access data validation',
        'Rate limiting',
        'Security rules',
        'Private/protected APIs'
      ]
    },
    {
      id: 'frontend-owns',
      title: 'Frontend Owns (Presentation)',
      color: 'border-emerald-500/30 bg-emerald-500/5',
      items: [
        'UI rendering',
        'Camera capture',
        'Map display',
        'Offline read access',
        'Local draft creation',
        'Local queue display',
        'Optimistic UI states',
        'User input validation',
        'Animations',
        'Haptics',
        'Cached field pack display',
        'Clover UI shell',
        'Local privacy indicators'
      ]
    },
    {
      id: 'frontend-forbidden',
      title: 'Frontend Must NOT Contain',
      color: 'border-rose-600/40 bg-rose-600/10',
      items: [
        'Stripe secret keys',
        'API secret keys',
        'Admin permissions',
        'Payment entitlement decisions',
        'Permanent trust/provenance decisions',
        'Final AI confidence authority',
        'Private moderation logic',
        'Unrestricted database write access',
        'Hidden premium unlock logic',
        'Hardcoded sensitive endpoints'
      ]
    }
  ];

  const workflows = [
    {
      name: 'Scan Workflow',
      steps: [
        'Capture Image → Frontend',
        'Save ScanDraft locally → Frontend',
        'Run quick guidance → Frontend/Backend',
        'Queue upload → Frontend',
        'Backend creates job → Backend',
        'Return candidates → Backend',
        'Save to Collection → Frontend',
        'Sync remotely → Frontend + Backend'
      ]
    },
    {
      name: 'Explore Workflow',
      steps: [
        'Open Map → Frontend',
        'Load cached region → Frontend',
        'Stream updated sites → Backend',
        'Show safety badges → Backend',
        'Save site pack → Frontend + Backend'
      ]
    },
    {
      name: 'Collection Workflow',
      steps: [
        'Open Collection → Frontend',
        'Render local database → Frontend',
        'Sync in background → Backend',
        'Mark records (synced/queued) → Frontend + Backend'
      ]
    },
    {
      name: 'Market Workflow',
      steps: [
        'Create listing draft → Frontend',
        'Save local draft → Frontend',
        'Validate with backend → Backend',
        'Handle payment & orders → Backend only',
        'Update trust signals → Backend only'
      ]
    }
  ];

  return (
    <div className="min-h-screen px-4 pt-6 pb-24 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white tracking-tight">Architecture Boundaries</h1>
        <p className="text-white/50 text-sm mt-2">
          Clear responsibility separation between frontend (presentation) and backend (authority).
        </p>
      </div>

      {/* Boundary sections */}
      <div className="space-y-4 mb-8">
        {sections.map((section) => (
          <GlassPanel key={section.id} className={`border ${section.color} overflow-hidden`}>
            <button
              onClick={() => setExpandedSection(expandedSection === section.id ? null : section.id)}
              className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition"
            >
              <h3 className="font-bold text-white">{section.title}</h3>
              {expandedSection === section.id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>

            {expandedSection === section.id && (
              <div className="px-4 pb-4 border-t border-white/10 grid grid-cols-1 sm:grid-cols-2 gap-2">
                {section.items.map((item, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm text-white/70">
                    {section.id === 'frontend-forbidden' ? (
                      <X size={14} className="text-rose-400 mt-0.5 shrink-0" />
                    ) : (
                      <Check size={14} className="text-emerald-400 mt-0.5 shrink-0" />
                    )}
                    {item}
                  </div>
                ))}
              </div>
            )}
          </GlassPanel>
        ))}
      </div>

      {/* Data flow rules */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-white mb-4">Standard Field Workflow</h2>
        <GlassPanel className="p-5">
          <div className="space-y-2 text-sm text-white/70 font-mono">
            <div className="flex items-center gap-3">
              <span className="text-amethyst">1.</span>
              <span>Capture / Action → Frontend</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-amethyst">2.</span>
              <span>Save Local Draft → Frontend</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-amethyst">3.</span>
              <span>Show Immediate UI → Frontend</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-amethyst">4.</span>
              <span>Queue Sync → Frontend</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-amethyst">5.</span>
              <span>Backend Validate → Backend</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-amethyst">6.</span>
              <span>Resolve Conflict → Backend</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-amethyst">7.</span>
              <span>Update Cloud → Backend</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-amethyst">8.</span>
              <span>Refresh Local Cache → Frontend</span>
            </div>
          </div>
        </GlassPanel>
      </div>

      {/* Specific workflows */}
      <div>
        <h2 className="text-xl font-bold text-white mb-4">Feature-Specific Workflows</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {workflows.map((workflow, i) => (
            <GlassPanel key={i} className="p-5">
              <h3 className="font-bold text-white mb-3">{workflow.name}</h3>
              <div className="space-y-1">
                {workflow.steps.map((step, j) => (
                  <div key={j} className="flex items-start gap-2 text-xs text-white/60 font-mono">
                    <span className="text-amethyst/60 shrink-0">{j + 1}.</span>
                    <span>{step}</span>
                  </div>
                ))}
              </div>
            </GlassPanel>
          ))}
        </div>
      </div>

      {/* Backend service model */}
      <div className="mt-8">
        <h2 className="text-xl font-bold text-white mb-4">Backend Service Model</h2>
        <GlassPanel className="p-5">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              '/auth',
              '/users',
              '/sites',
              '/field-packs',
              '/scan-jobs',
              '/findings',
              '/sync',
              '/market',
              '/orders',
              '/reports',
              '/media',
              '/clover'
            ].map((route, i) => (
              <div key={i} className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white/70 font-mono text-center">
                {route}
              </div>
            ))}
          </div>
        </GlassPanel>
      </div>
    </div>
  );
}