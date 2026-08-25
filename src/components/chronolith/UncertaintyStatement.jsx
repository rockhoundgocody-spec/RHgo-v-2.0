import React from 'react';
import { motion } from 'framer-motion';
import { Eye } from 'lucide-react';

export default function UncertaintyStatement({ imageUrl, uncertaintyStatement }) {
  if (!uncertaintyStatement) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.1 }}
      className="flex gap-3 p-3 rounded-2xl"
      style={{ background: 'hsla(220,40%,5%,0.6)', border: '1px solid hsla(270,20%,25%,0.2)' }}
    >
      {imageUrl && (
        <img
          src={imageUrl}
          alt="specimen"
          className="w-14 h-14 rounded-xl object-cover shrink-0 opacity-80"
          style={{ border: '1px solid hsla(270,30%,40%,0.2)' }}
        />
      )}
      <div className="flex-1 min-w-0">
        <div className="text-[8px] uppercase tracking-widest text-white/30 mb-1 flex items-center gap-1">
          <Eye size={9} /> Uncertainty Statement
        </div>
        <p className="text-xs text-white/65 leading-relaxed">{uncertaintyStatement}</p>
      </div>
    </motion.div>
  );
}
