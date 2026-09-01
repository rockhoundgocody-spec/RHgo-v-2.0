/**
 * AuctionPanel — Live field auction bidding interface for stream viewers.
 * Shows the current high bid, lets viewers place bids on specimens identified
 * during the stream, and displays the bid history.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { Gavel, TrendingUp, DollarSign, Zap, Crown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AuctionPanel({ streamId, me, hostEmail }) {
  const [bids, setBids] = useState([]);
  const [amount, setAmount] = useState('');
  const [mineralName, setMineralName] = useState('');
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState('');

  const isHost = me?.email === hostEmail;

  const loadBids = useCallback(async () => {
    if (!streamId) return;
    try {
      const list = await base44.entities.StreamBid.filter({ stream_id: streamId }, '-bid_at', 20);
      setBids(list || []);
    } catch {}
  }, [streamId]);

  useEffect(() => {
    loadBids();
    const unsub = base44.entities.StreamBid.subscribe((event) => {
      if (event.data?.stream_id !== streamId) return;
      loadBids();
    });
    return () => unsub();
  }, [streamId, loadBids]);

  const activeBids = bids.filter(b => b.status === 'active');
  const highBid = activeBids.reduce((max, b) => (b.amount > (max?.amount || 0) ? b : max), null);

  const placeBid = async () => {
    const value = parseFloat(amount);
    if (!value || value <= 0) { setError('Enter a valid amount'); return; }
    if (highBid && value <= highBid.amount) { setError(`Bid must exceed $${highBid.amount}`); return; }
    if (!me?.email) { setError('Sign in to bid'); return; }

    setPlacing(true);
    setError('');
    try {
      await base44.entities.StreamBid.create({
        stream_id: streamId,
        bidder_email: me.email,
        bidder_name: me.full_name || me.email,
        amount: value,
        mineral_name: mineralName || 'Specimen',
        status: 'active',
        bid_at: new Date().toISOString(),
      });
      setAmount('');
      setMineralName('');
    } catch (e) {
      setError(e.message || 'Bid failed');
    }
    setPlacing(false);
  };

  return (
    <div className="rounded-2xl overflow-hidden"
      style={{ background: 'hsla(220,40%,8%,0.7)', border: '1px solid hsla(280,60%,50%,0.3)' }}
    >
      {/* Header */}
      <div className="px-4 py-3 flex items-center gap-2"
        style={{ background: 'linear-gradient(135deg, hsla(280,60%,25%,0.4), hsla(265,50%,15%,0.5))' }}>
        <Gavel size={14} className="text-amethyst-glow" />
        <span className="text-white font-bold text-xs">Field Auction</span>
        {highBid && (
          <span className="ml-auto flex items-center gap-1 text-[10px] font-mono text-amber-400">
            <Crown size={10} /> ${highBid.amount}
          </span>
        )}
      </div>

      {/* High bid display */}
      {highBid ? (
        <div className="px-4 py-2.5 flex items-center justify-between"
          style={{ background: 'hsla(45,60%,12%,0.3)', borderBottom: '1px solid hsla(255,30%,30%,0.15)' }}>
          <div>
            <div className="text-[9px] uppercase tracking-wider text-white/40">High Bid</div>
            <div className="text-amber-400 font-black text-lg leading-none">${highBid.amount}</div>
          </div>
          <div className="text-right">
            <div className="text-[9px] uppercase tracking-wider text-white/40">Bidder</div>
            <div className="text-white/70 text-xs font-semibold truncate max-w-[120px]">{highBid.bidder_name}</div>
          </div>
        </div>
      ) : (
        <div className="px-4 py-2.5 text-center">
          <p className="text-white/40 text-[11px]">No bids yet — start the auction!</p>
        </div>
      )}

      {/* Bid form (viewers only) */}
      {!isHost && me && (
        <div className="px-4 py-3 space-y-2">
          <input
            value={mineralName}
            onChange={e => setMineralName(e.target.value)}
            placeholder="Specimen name (optional)"
            maxLength={60}
            className="w-full text-xs text-white px-3 py-2 rounded-xl outline-none"
            style={{ background: 'hsla(255,20%,16%,0.6)', border: '1px solid hsla(255,20%,30%,0.3)' }}
          />
          <div className="flex gap-2">
            <div className="relative flex-1">
              <DollarSign size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
              <input
                type="number"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder={highBid ? `${highBid.amount + 1}` : '5'}
                min={highBid ? highBid.amount + 1 : 1}
                className="w-full pl-7 pr-3 py-2.5 rounded-xl text-sm text-white outline-none"
                style={{ background: 'hsla(255,20%,16%,0.6)', border: '1px solid hsla(255,20%,30%,0.3)' }}
              />
            </div>
            <button
              onClick={placeBid}
              disabled={placing}
              className="px-4 py-2.5 rounded-xl text-sm font-bold text-white transition active:scale-95 disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, hsl(280,70%,50%), hsl(265,75%,45%))', boxShadow: '0 4px 12px hsla(280,80%,50%,0.25)' }}
            >
              {placing ? '…' : <Zap size={14} />}
            </button>
          </div>
          {error && <p className="text-rose-400 text-[10px]">{error}</p>}
        </div>
      )}

      {/* Bid history */}
      {activeBids.length > 0 && (
        <div className="px-4 pb-3">
          <div className="text-[9px] uppercase tracking-wider text-white/30 mb-1.5 flex items-center gap-1">
            <TrendingUp size={9} /> Bid History
          </div>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            <AnimatePresence>
              {activeBids.slice(0, 8).map((bid) => (
                <motion.div
                  key={bid.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center justify-between px-2.5 py-1.5 rounded-lg"
                  style={{
                    background: bid.id === highBid?.id ? 'hsla(45,60%,15%,0.4)' : 'hsla(255,20%,12%,0.4)',
                    border: bid.id === highBid?.id ? '1px solid hsla(45,70%,50%,0.3)' : '1px solid hsla(255,20%,25%,0.15)',
                  }}
                >
                  <span className="text-white/60 text-[11px] truncate flex-1">{bid.bidder_name}</span>
                  <span className="text-amber-400 text-xs font-bold ml-2">${bid.amount}</span>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  );
}