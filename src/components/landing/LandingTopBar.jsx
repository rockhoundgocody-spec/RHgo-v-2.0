import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const LOGO = 'https://media.base44.com/images/public/69f35dd14650b54681c835ec/64fc40049_1000004994.png';

export default function LandingTopBar() {
  return (
    <motion.header
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className="w-full max-w-5xl px-5 pt-5 flex items-center justify-between relative z-10"
    >
      <Link to="/" className="flex items-center gap-2.5">
        <motion.img src={LOGO} alt="" className="w-9 h-9 rounded-xl"
          animate={{ rotate: [0, 4, -4, 0] }} transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }} />
        <span className="text-white font-black text-[15px] tracking-tight">RockHound GO</span>
      </Link>
      <Link to="/pricing"
        className="px-4 py-2.5 rounded-full text-[12px] font-semibold text-white/85 border border-white/15 bg-white/5 backdrop-blur-md hover:text-white transition">
        Pricing
      </Link>
    </motion.header>
  );
}