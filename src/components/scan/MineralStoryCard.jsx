import React, { useState } from 'react';
import { getMineralStory } from '@/lib/mineralStories';
import { BookOpen, ChevronDown, ChevronUp, Compass } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Story card shown after identifying a Great Lakes mineral.
 * Collapses/expands. Auto-shown on first find.
 */
export default function MineralStoryCard({ mineralName }) {
  const [expanded, setExpanded] = useState(true);
  const story = getMineralStory(mineralName);
  if (!story) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.4 }}
      className="rounded-2xl overflow-hidden mt-3"
      style={{
        background: 'linear-gradient(135deg, hsla(265,40%,10%,0.9) 0%, hsla(255,35%,8%,0.95) 100%)',
        border: `1px solid ${story.color}44`,
        boxShadow: `0 0 24px ${story.color}22`,
      }}
    >
      {/* Header */}
      <button
        onClick={() => setExpanded((e) => !e)}
        className="w-full flex items-center justify-between px-4 py-3"
        style={{ borderBottom: expanded ? `1px solid ${story.color}22` : 'none' }}
      >
        <div className="flex items-center gap-2.5">
          <span className="text-xl">{story.emoji}</span>
          <div className="text-left">
            <div className="text-[11px] font-bold tracking-[0.12em] uppercase" style={{ color: story.color }}>
              {story.mineral} — Origin Story
            </div>
            <div className="text-[9px] text-white/30 uppercase tracking-[0.2em]">{story.era}</div>
          </div>
        </div>
        <div style={{ color: story.color }}>
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-4 py-3 space-y-3">
              {/* Story text */}
              <p className="text-[12px] text-white/65 leading-relaxed">{story.story}</p>

              {/* Field tip */}
              <div className="flex gap-2.5 p-2.5 rounded-xl"
                style={{ background: `${story.color}18`, border: `1px solid ${story.color}30` }}>
                <Compass size={13} style={{ color: story.color, flexShrink: 0, marginTop: 1 }} />
                <div>
                  <div className="text-[9px] uppercase tracking-[0.2em] font-bold mb-0.5" style={{ color: story.color }}>
                    Field Tip
                  </div>
                  <p className="text-[11px] text-white/55">{story.field_tip}</p>
                </div>
              </div>

              {/* BookOpen footer */}
              <div className="flex items-center gap-1.5 text-[9px] text-white/20 uppercase tracking-[0.2em]">
                <BookOpen size={9} />
                Great Lakes Geo-Chronicle
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}