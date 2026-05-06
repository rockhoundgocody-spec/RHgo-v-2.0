import React from 'react';
import { Save, GitCompare, Map, Camera, Tag, BookOpen, UserCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

const decisions = {
  save:    { label: 'Save to collection', icon: Save,       color: 'text-emerald-300', border: 'border-emerald-500/30', bg: 'bg-emerald-500/10' },
  compare: { label: 'Compare specimens',  icon: GitCompare, color: 'text-hud-cyan',    border: 'border-hud-cyan/30',    bg: 'bg-hud-cyan/10' },
  map:     { label: 'View on map',        icon: Map,        color: 'text-sky-300',     border: 'border-sky-500/30',     bg: 'bg-sky-500/10' },
  rescan:  { label: 'Re-scan specimen',   icon: Camera,     color: 'text-amber-300',   border: 'border-amber-500/30',   bg: 'bg-amber-500/10' },
  list:    { label: 'List for sale',      icon: Tag,        color: 'text-violet-300',  border: 'border-violet-500/30',  bg: 'bg-violet-500/10' },
  learn:   { label: 'Learn more',         icon: BookOpen,   color: 'text-purple-300',  border: 'border-purple-500/30',  bg: 'bg-purple-500/10' },
  expert:  { label: 'Ask an expert',      icon: UserCheck,  color: 'text-rose-300',    border: 'border-rose-500/30',    bg: 'bg-rose-500/10' },
};

/**
 * FieldDecisionCard — the recommended next action after reasoning completes.
 */
export default function FieldDecisionCard({ action, onAction }) {
  const d = decisions[action] || decisions.save;
  const Icon = d.icon;

  return (
    <div>
      <div className="text-[10px] uppercase tracking-[0.25em] text-white/40 mb-1.5">Recommended action</div>
      <button
        onClick={() => onAction?.(action)}
        className={cn(
          'flex items-center gap-2.5 w-full px-3 py-2.5 rounded-lg border transition',
          d.bg, d.border,
          'hover:brightness-125'
        )}
      >
        <Icon size={14} className={d.color} />
        <span className={cn('text-sm font-medium', d.color)}>{d.label}</span>
      </button>
    </div>
  );
}