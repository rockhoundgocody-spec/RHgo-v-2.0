/**
 * CreateListingSheet — bottom sheet to list a specimen from your collection.
 */
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Gem, DollarSign, ArrowRightLeft, MapPin, Check } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const RARITY_CFG = {
  common:    { color: '#94a3b8', label: 'Common' },
  uncommon:  { color: '#34d399', label: 'Uncommon' },
  rare:      { color: '#38bdf8', label: 'Rare' },
  legendary: { color: '#a78bfa', label: 'Legendary' },
};

export default function CreateListingSheet({ open, onClose, onCreated, prefillSpecimen = null }) {
  const [specimens, setSpecimens] = useState([]);
  const [selectedSpecimen, setSelectedSpecimen] = useState(prefillSpecimen);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [askingPrice, setAskingPrice] = useState('');
  const [tradeOnly, setTradeOnly] = useState(false);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!open) return;
    base44.entities.Specimen.list('-found_date', 50).then(setSpecimens).catch(() => {});
  }, [open]);

  useEffect(() => {
    if (prefillSpecimen) setSelectedSpecimen(prefillSpecimen);
  }, [prefillSpecimen]);

  const handleSubmit = async () => {
    if (!selectedSpecimen) return;
    setSaving(true);
    try {
      const me = await base44.auth.me();
      await base44.entities.MarketListing.create({
        owner_email: me.email,
        seller_name: me.full_name || me.email.split('@')[0],
        specimen_id: selectedSpecimen.id,
        mineral_name: selectedSpecimen.mineral_name,
        rarity: selectedSpecimen.rarity || 'common',
        image_url: selectedSpecimen.image_url || '',
        title: title || selectedSpecimen.mineral_name,
        description,
        asking_price: tradeOnly ? 0 : parseFloat(askingPrice) || 0,
        trade_only: tradeOnly,
        location_label: selectedSpecimen.found_at || '',
        verified: !!selectedSpecimen.verified,
        ai_confidence: selectedSpecimen.ai_confidence || 0,
        status: 'active',
      });
      setDone(true);
      setTimeout(() => { setDone(false); onCreated?.(); onClose(); }, 1400);
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[5000] flex items-end"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="absolute inset-0 bg-black/60" onClick={onClose} />
          <motion.div className="relative w-full rounded-t-3xl flex flex-col max-h-[90vh]"
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            style={{ background: 'linear-gradient(180deg, hsla(245,30%,9%,0.99) 0%, hsla(240,25%,6%,1) 100%)', border: '1px solid hsla(270,30%,40%,0.2)', borderBottom: 'none' }}>

            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-white/15" />
            </div>

            <div className="flex items-center justify-between px-5 pb-3">
              <h2 className="text-white font-black text-lg">List for Trade</h2>
              <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'hsla(255,20%,20%,0.6)' }}>
                <X size={16} className="text-white/50" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 pb-8 space-y-4">
              {/* Pick specimen */}
              <div>
                <label className="text-[10px] uppercase tracking-wider text-white/40 mb-2 block">Select Specimen</label>
                <div className="flex gap-2 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
                  {specimens.map(s => {
                    const rc = RARITY_CFG[s.rarity] || RARITY_CFG.common;
                    const sel = selectedSpecimen?.id === s.id;
                    return (
                      <button key={s.id} onClick={() => setSelectedSpecimen(s)}
                        className="flex-shrink-0 flex flex-col items-center gap-1 p-2 rounded-xl transition"
                        style={{ background: sel ? `${rc.color}22` : 'hsla(255,20%,12%,0.6)', border: `1px solid ${sel ? rc.color : 'hsla(255,20%,30%,0.2)'}`, minWidth: 72 }}>
                        {s.image_url
                          ? <img src={s.image_url} alt={s.mineral_name} className="w-12 h-12 rounded-lg object-cover" />
                          : <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ background: `${rc.color}22` }}><Gem size={20} style={{ color: rc.color }} /></div>}
                        <span className="text-[9px] text-white/70 truncate w-full text-center">{s.mineral_name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {selectedSpecimen && (
                <>
                  {/* Title */}
                  <div>
                    <label className="text-[10px] uppercase tracking-wider text-white/40 mb-1.5 block">Listing Title</label>
                    <input value={title} onChange={e => setTitle(e.target.value)}
                      placeholder={selectedSpecimen.mineral_name}
                      className="w-full px-4 py-2.5 rounded-xl text-sm text-white/90 placeholder-white/25 outline-none"
                      style={{ background: 'hsla(255,20%,14%,0.8)', border: '1px solid hsla(270,20%,30%,0.3)' }} />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="text-[10px] uppercase tracking-wider text-white/40 mb-1.5 block">Description</label>
                    <textarea value={description} onChange={e => setDescription(e.target.value)}
                      rows={3} placeholder="Describe the specimen, find conditions, weight, size…"
                      className="w-full px-4 py-2.5 rounded-xl text-sm text-white/90 placeholder-white/25 outline-none resize-none"
                      style={{ background: 'hsla(255,20%,14%,0.8)', border: '1px solid hsla(270,20%,30%,0.3)' }} />
                  </div>

                  {/* Pricing */}
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <label className="text-[10px] uppercase tracking-wider text-white/40 mb-1.5 block">Asking Price (USD)</label>
                      <div className="relative">
                        <DollarSign size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                        <input type="number" value={askingPrice} onChange={e => setAskingPrice(e.target.value)}
                          disabled={tradeOnly} placeholder="0.00"
                          className="w-full pl-8 pr-3 py-2.5 rounded-xl text-sm text-white/90 placeholder-white/25 outline-none"
                          style={{ background: tradeOnly ? 'hsla(255,20%,10%,0.4)' : 'hsla(255,20%,14%,0.8)', border: '1px solid hsla(270,20%,30%,0.3)', opacity: tradeOnly ? 0.4 : 1 }} />
                      </div>
                    </div>
                    <div className="flex flex-col items-center justify-end gap-1">
                      <label className="text-[10px] uppercase tracking-wider text-white/40">Trade only</label>
                      <button onClick={() => setTradeOnly(t => !t)}
                        className="w-12 h-7 rounded-full transition-all relative flex items-center"
                        style={{ background: tradeOnly ? 'hsla(195,80%,35%,0.5)' : 'hsla(255,20%,20%,0.5)', border: `1px solid ${tradeOnly ? 'hsla(195,90%,55%,0.4)' : 'hsla(255,20%,30%,0.2)'}` }}>
                        <div className="w-5 h-5 rounded-full transition-all absolute"
                          style={{ background: tradeOnly ? 'hsl(195,100%,70%)' : 'hsl(255,20%,50%)', left: tradeOnly ? '50%' : '4px' }} />
                      </button>
                    </div>
                  </div>
                </>
              )}

              {/* Submit */}
              <button onClick={handleSubmit} disabled={!selectedSpecimen || saving || done}
                className="w-full py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition active:scale-[0.98]"
                style={{
                  background: done ? 'hsla(145,70%,30%,0.5)' : 'linear-gradient(135deg, hsla(270,60%,35%,0.6), hsla(195,70%,30%,0.5))',
                  border: `1px solid ${done ? 'hsla(145,80%,55%,0.4)' : 'hsla(270,60%,55%,0.35)'}`,
                  color: done ? 'hsl(145,80%,70%)' : 'hsl(270,100%,88%)',
                  opacity: !selectedSpecimen ? 0.4 : 1,
                }}>
                {done ? <><Check size={16} /> Listed!</> : saving ? 'Creating…' : <><ArrowRightLeft size={15} /> Post Listing</>}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}