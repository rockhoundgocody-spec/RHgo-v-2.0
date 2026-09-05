import React, { useEffect, useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Send, MessageCircle } from 'lucide-react';

export default function StreamChat({ streamId, me }) {
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    if (!streamId) return;
    let alive = true;
    base44.entities.StreamMessage
      .filter({ stream_id: streamId }, 'created_date', 100)
      .then((list) => { if (alive) setMessages(list); });

    const unsub = base44.entities.StreamMessage.subscribe((event) => {
      if (event.type !== 'create' || event.data?.stream_id !== streamId) return;
      setMessages((prev) => (prev.some((m) => m.id === event.data.id) ? prev : [...prev, event.data]));
    });
    return () => { alive = false; unsub(); };
  }, [streamId]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages.length]);

  const send = async () => {
    const body = draft.trim();
    if (!body || sending) return;
    if (!me) { window.location.href = '/login'; return; }
    setSending(true);
    const created = await base44.entities.StreamMessage.create({
      stream_id: streamId,
      author_email: me.email,
      author_name: me.full_name || me.email.split('@')[0],
      body,
    });
    setMessages((prev) => (prev.some((m) => m.id === created.id) ? prev : [...prev, created]));
    setDraft('');
    setSending(false);
  };

  return (
    <div className="flex flex-col rounded-2xl overflow-hidden" style={{ background: 'hsla(220,40%,5%,0.7)', border: '1px solid hsla(270,30%,25%,0.3)' }}>
      <div className="px-3 py-2 flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] text-white/40 border-b border-white/5">
        <MessageCircle size={10} /> Live chat
      </div>

      <div className="flex-1 max-h-56 overflow-y-auto px-3 py-2 space-y-2">
        {messages.length === 0 && (
          <p className="text-white/30 text-xs text-center py-4">No messages yet — say hello.</p>
        )}
        {messages.map((m) => (
          <div key={m.id} className="text-xs">
            <span className="font-semibold text-amethyst-glow">{m.author_name}</span>
            <span className="text-white/70 ml-2 break-words">{m.body}</span>
          </div>
        ))}
        <div ref={endRef} />
      </div>

      <div className="p-2 flex gap-2 border-t border-white/5">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') send(); }}
          placeholder={me ? 'Say something…' : 'Sign in to chat'}
          maxLength={500}
          className="flex-1 bg-transparent text-white text-xs px-2.5 py-2 rounded-lg outline-none"
          style={{ background: 'hsla(220,30%,10%,0.7)', border: '1px solid hsla(0,0%,100%,0.08)' }}
        />
        <button
          onClick={send}
          disabled={sending || !draft.trim()}
          className="px-3 rounded-lg disabled:opacity-40"
          style={{ background: 'hsla(270,70%,45%,0.6)', border: '1px solid hsla(280,100%,70%,0.4)' }}
          aria-label="Send message"
        >
          <Send size={13} className="text-white" />
        </button>
      </div>
    </div>
  );
}