import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import GlassPanel from '@/components/visuals/GlassPanel.jsx';

const SKILLS = [
  {
    id: 'text',
    emoji: '✍️',
    title: 'Text Prompting',
    level: 'Intermediate',
    color: '#a78bfa',
    tags: ['CROFTC', 'Copywriting', 'SEO', 'LinkedIn', 'Blogging'],
    description: '50 text-based prompt recipes covering blog titles, cold email, product copy, SEO metadata, LinkedIn posts, FAQ generation, and more.',
  },
  {
    id: 'visual',
    emoji: '🎨',
    title: 'Visual Prompting',
    level: 'Intermediate',
    color: '#38bdf8',
    tags: ['Midjourney', 'DALL·E', 'Ideogram', 'Stable Diffusion'],
    description: '50 visual prompt recipes for product mockups, logo concepts, infographics, UI wireframes, and editorial illustrations using layered CROFTC structure.',
  },
  {
    id: 'audio',
    emoji: '🎙️',
    title: 'Audio & Voiceover',
    level: 'Intermediate',
    color: '#34d399',
    tags: ['Voiceover', 'Podcast', 'TTS', 'Narration', 'Scripts'],
    description: '50 audio prompt recipes for podcast intros, product demos, meditation scripts, onboarding voice clips, and storytelling narration.',
  },
  {
    id: 'music',
    emoji: '🎵',
    title: 'Music Generation',
    level: 'Intermediate',
    color: '#f59e0b',
    tags: ['Suno', 'Udio', 'Lo-Fi', 'Cinematic', 'Ambient'],
    description: '25 music prompt recipes spanning lo-fi study beats, cinematic trailers, jazz lounge, synthwave, and children\'s jingles with BPM and instrumentation specs.',
  },
  {
    id: 'video',
    emoji: '🎬',
    title: 'Video Prompting',
    level: 'Advanced',
    color: '#f87171',
    tags: ['Sora', 'RunwayML', 'Kling', 'Hailuo', 'Cinematic'],
    description: '50 video prompt recipes across promotional ads, cinematic storytelling, travel lifestyle, camera dynamics, and conceptual explainers.',
  },
  {
    id: 'multimodal',
    emoji: '🔀',
    title: 'Multimodal Prompting',
    level: 'Advanced',
    color: '#c084fc',
    tags: ['Image+Audio', 'Cross-format', 'Campaign', 'Brand'],
    description: '50 multimodal recipes combining images, audio, and text to create brand moodboards, product campaigns, music video treatments, and UX optimizations.',
  },
  {
    id: 'advanced',
    emoji: '🧠',
    title: 'Advanced Techniques',
    level: 'Expert',
    color: '#fb923c',
    tags: ['Chain-of-Thought', 'Self-Refinement', 'Ensembling', 'RAG'],
    description: '50 advanced prompting techniques: CoT reasoning, problem decomposition, self-refinement loops, self-consistency checks, and multi-AI ensembling.',
  },
  {
    id: 'rag',
    emoji: '📚',
    title: 'RAG Prompting',
    level: 'Expert',
    color: '#67e8f9',
    tags: ['Document Q&A', 'Extraction', 'Grounding', 'Citations'],
    description: '50 RAG-style prompts for grounded, document-anchored outputs: summarizing PDFs, extracting contracts, building glossaries, and turning research into reports.',
  },
  {
    id: 'ethics',
    emoji: '⚖️',
    title: 'Ethics & Responsible AI',
    level: 'Intermediate',
    color: '#86efac',
    tags: ['Bias Audit', 'Inclusion', 'Transparency', 'Fairness'],
    description: '50 ethics-focused prompts for detecting bias, prompting for inclusion, ensuring consent, and building responsible AI-powered content and products.',
  },
  {
    id: 'monetizing',
    emoji: '💰',
    title: 'Monetizing with AI',
    level: 'Intermediate',
    color: '#fde68a',
    tags: ['Digital Products', 'Freelance', 'Funnels', 'SaaS', 'Etsy'],
    description: '50 monetization prompts for building ebooks, prompt packs, Fiverr gigs, affiliate plans, micro-SaaS, and AI consulting offerings using the CROFTC system.',
  },
  {
    id: 'croftc',
    emoji: '🔧',
    title: 'CROFTC Framework',
    level: 'Foundation',
    color: '#d1d5db',
    tags: ['Context', 'Role', 'Objective', 'Format', 'Tone', 'Conditions'],
    description: 'The foundational prompt engineering framework across all modalities. Context · Role · Objective · Format · Tone · Conditions — the backbone of every prompt recipe in this pack.',
  },
];

const LEVEL_COLORS = {
  Foundation: 'hsla(0,0%,70%,0.2)',
  Intermediate: 'hsla(145,60%,40%,0.2)',
  Advanced: 'hsla(30,90%,55%,0.2)',
  Expert: 'hsla(270,80%,60%,0.2)',
};
const LEVEL_TEXT = {
  Foundation: '#d1d5db',
  Intermediate: '#34d399',
  Advanced: '#fb923c',
  Expert: '#a78bfa',
};

function SkillCard({ skill }) {
  const [open, setOpen] = useState(false);
  return (
    <button
      onClick={() => setOpen(o => !o)}
      aria-expanded={open}
      className="w-full text-left rounded-xl overflow-hidden transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amethyst/50 focus-visible:ring-offset-2 ring-offset-background"
      style={{
        background: `hsla(265,40%,5%,0.7)`,
        border: `1px solid ${skill.color}28`,
        boxShadow: open ? `0 0 18px -4px ${skill.color}30` : 'none',
      }}
    >
      <div className="flex items-center gap-3 px-4 py-3">
        <span className="text-xl leading-none flex-shrink-0">{skill.emoji}</span>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-white/90 leading-tight">{skill.title}</div>
          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
            {skill.tags.slice(0, 3).map(t => (
              <span key={t} className="text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded-full"
                style={{ background: `${skill.color}18`, color: skill.color }}>
                {t}
              </span>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full"
            style={{ background: LEVEL_COLORS[skill.level], color: LEVEL_TEXT[skill.level] }}>
            {skill.level}
          </span>
          {open ? <ChevronUp size={13} className="text-white/30" /> : <ChevronDown size={13} className="text-white/30" />}
        </div>
      </div>
      {open && (
        <div className="px-4 pb-3 text-[11px] text-white/50 leading-relaxed border-t" style={{ borderColor: `${skill.color}20` }}>
          {skill.description}
        </div>
      )}
    </button>
  );
}

export default function SkillsSection() {
  return (
    <GlassPanel className="mb-8 p-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-[9px] uppercase tracking-[0.35em] text-white/30 mb-0.5">AI Prompt Engineering</div>
          <div className="text-sm font-bold text-white/90">Skills & Certifications</div>
        </div>
        <span className="text-[10px] font-bold px-2 py-1 rounded-full"
          style={{ background: 'hsla(280,80%,55%,0.15)', color: 'hsl(280,80%,75%)', border: '1px solid hsla(280,80%,55%,0.25)' }}>
          500+ Prompts
        </span>
      </div>
      <div className="space-y-2">
        {SKILLS.map(skill => <SkillCard key={skill.id} skill={skill} />)}
      </div>
    </GlassPanel>
  );
}