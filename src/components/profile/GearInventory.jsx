import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Backpack, Plus, Trash2, Loader2, Check } from 'lucide-react';
import GlassPanel from '@/components/visuals/GlassPanel.jsx';

const CATEGORIES = ['tools', 'safety', 'navigation', 'storage', 'optics', 'other'];

export default function GearInventory() {
  const [items, setItems] = useState(null);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('tools');
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const page = await base44.entities.GearItem.filter({}, { sort: 'created_date', limit: 100 });
    setItems(page.items);
  };
  useEffect(() => { load(); }, []);

  const add = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    await base44.entities.GearItem.create({ name: name.trim(), category });
    setName('');
    await load();
    setSaving(false);
  };
  const toggle = async (item) => {
    setItems((list) => list.map((i) => (i.id === item.id ? { ...i, packed: !i.packed } : i)));
    await base44.entities.GearItem.update(item.id, { packed: !item.packed });
  };
  const remove = async (id) => {
    setItems((list) => list.filter((i) => i.id !== id));
    await base44.entities.GearItem.delete(id);
  };
  const packed = items?.filter((i) => i.packed).length || 0;

  return (
    <GlassPanel className="mb-8">
      <div className="flex items-center gap-3 px-5 pt-4 pb-3 border-b border-white/8">
        <Backpack size={15} className="text-hud-cyan flex-shrink-0" />
        <span className="font-bold text-white text-sm">Field Gear</span>
        {items?.length > 0 && <span className="ml-auto text-[11px] text-white/50">{packed}/{items.length} packed</span>}
      </div>
      <form onSubmit={add} className="flex gap-2 px-5 py-3">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Add gear, e.g. rock hammer"
          aria-label="Gear name" className="flex-1 min-w-0 h-11 rounded-xl bg-white/5 border border-white/10 px-3 text-sm text-white placeholder:text-white/35" />
        <select value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Category"
          className="h-11 rounded-xl bg-white/5 border border-white/10 px-2 text-sm text-white capitalize">
          {CATEGORIES.map((c) => <option key={c} value={c} className="bg-background">{c}</option>)}
        </select>
        <button type="submit" disabled={saving || !name.trim()} aria-label="Add gear"
          className="h-11 w-11 flex items-center justify-center rounded-xl mint-cta disabled:opacity-40">
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Plus size={18} />}
        </button>
      </form>
      {items === null ? (
        <div className="px-5 pb-5 text-white/40 text-sm">Loading gear…</div>
      ) : items.length === 0 ? (
        <p className="px-5 pb-5 text-white/45 text-sm">No gear yet. Add the tools you bring on every hunt.</p>
      ) : (
        <ul className="divide-y divide-white/5 pb-2">
          {items.map((item) => (
            <li key={item.id} className="flex items-center gap-3 px-5 py-2.5">
              <button onClick={() => toggle(item)} aria-label={item.packed ? `Unpack ${item.name}` : `Pack ${item.name}`}
                className={`w-7 h-7 rounded-lg border flex items-center justify-center flex-shrink-0 ${item.packed ? 'bg-hud-cyan/20 border-hud-cyan/60 text-hud-cyan' : 'border-white/20'}`}>
                {item.packed && <Check size={14} />}
              </button>
              <div className="flex-1 min-w-0">
                <div className={`text-sm truncate ${item.packed ? 'text-white/50 line-through' : 'text-white'}`}>{item.name}</div>
                <div className="text-[11px] text-white/40 capitalize">{item.category}</div>
              </div>
              <button onClick={() => remove(item.id)} aria-label={`Remove ${item.name}`} className="p-2 text-white/35 hover:text-rose-400">
                <Trash2 size={15} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </GlassPanel>
  );
}