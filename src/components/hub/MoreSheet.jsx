import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { X, Trophy, Lock, Users, Building2, Atom } from 'lucide-react';

const MORE_ACTIONS = [
{ to: '/badges', icon: Trophy, label: 'Badges', color: '#fbbf24' },
{ to: '/private-log', icon: Lock, label: 'Finds', color: 'hsl(280,85%,82%)' },
{ to: '/community', icon: Users, label: 'Social', color: 'hsl(195,100%,78%)' },
{ to: '/clubs', icon: Building2, label: 'Clubs', color: 'hsl(195,100%,78%)' },
{ to: '/chronolith', icon: Atom, label: 'Chronolith', color: 'hsl(280,85%,82%)' }];


/**
 * MoreSheet — bottom sheet holding secondary Hub quick actions.
 * Keeps the Hub's primary 4 tiles clean while remaining one tap away.
 */
export default function MoreSheet({ open, onClose }) {
  return (
    <AnimatePresence>
      {open &&
      <>
          <motion.div
          className="fixed inset-0 z-[1999] bg-black/60 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose} />
        
          <motion.div
          className="fixed bottom-0 inset-x-0 z-[2000] rounded-t-3xl overflow-hidden"
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 30, stiffness: 280 }}
          style={{
            background: 'linear-gradient(180deg, hsla(245,32%,10%,0.99) 0%, hsla(240,26%,6%,1) 100%)',
            backdropFilter: 'blur(40px)',
            border: '1px solid hsla(270,30%,40%,0.25)',
            borderBottom: 'none'
          }}>
          
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-white/15" />
            </div>

            <div className="my-20 px-6 py-1">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-base font-black text-white">More</h2>
                <button
                onClick={onClose}
                aria-label="Close"
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background: 'hsla(255,30%,20%,0.5)', border: '1px solid hsla(255,30%,40%,0.2)' }}>
                
                  <X size={14} className="text-white/60" />
                </button>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {MORE_ACTIONS.map(({ to, icon: Icon, label, color }) =>
              <Link
                key={to}
                to={to}
                onClick={onClose}
                className="flex flex-col items-center gap-2.5 py-5 rounded-2xl transition active:scale-95"
                style={{
                  background: 'linear-gradient(180deg, hsla(255,30%,16%,0.55) 0%, hsla(250,28%,10%,0.7) 100%)',
                  border: '1px solid hsla(280,70%,65%,0.18)'
                }}>
                
                    <Icon size={22} strokeWidth={1.5} style={{ color, filter: `drop-shadow(0 0 5px ${color}66)` }} />
                    <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-white/55">{label}</span>
                  </Link>
              )}
              </div>
            </div>
          </motion.div>
        </>
      }
    </AnimatePresence>);

}