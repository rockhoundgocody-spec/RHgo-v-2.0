import React, { useState, useEffect } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Trash2, ChevronDown, ChevronUp, MessageCircle } from 'lucide-react';

const STORAGE_KEY = 'clover_memory_log';
const MAX_ENTRIES = 50;

export function appendToMemoryLog(messages) {
  try {
    const existing = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    const session = {
      ts: new Date().toISOString(),
      messages,
    };
    const updated = [session, ...existing].slice(0, MAX_ENTRIES);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {}
}

export function clearMemoryLog() {
  localStorage.removeItem(STORAGE_KEY);
}

export default function CloverMemoryLog() {
  const [open, setOpen] = useState(false);
  const [sessions, setSessions] = useState([]);

  const load = () => {
    try {
      setSessions(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'));
    } catch {
      setSessions([]);
    }
  };

  useEffect(() => {
    load();
  }, [open]);

  const handleClear = () => {
    clearMemoryLog();
    setSessions([]);
  };

  const totalMessages = sessions.reduce((a, s) => a + s.messages.length, 0);

  return (
    <div className="mt-4 w-full max-w-sm mx-auto">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-2 rounded-xl glass-panel border border-amethyst/20 text-amethyst-glow/70 text-xs font-mono uppercase tracking-wider hover:border-amethyst/40 transition-colors"
      >
        <span className="flex items-center gap-2">
          <MessageCircle size={13} />
          Clover Memory · {totalMessages} msgs
        </span>
        {open ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
      </button>

      {open && (
        <div className="mt-2 glass-panel rounded-xl border border-amethyst/20 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2 border-b border-amethyst/10">
            <span className="text-[11px] font-mono text-amethyst-glow/60 uppercase tracking-wider">
              {sessions.length} session{sessions.length !== 1 ? 's' : ''}
            </span>
            <button
              onClick={handleClear}
              className="flex items-center gap-1 text-rose-400/70 hover:text-rose-400 text-[11px] transition-colors"
            >
              <Trash2 size={11} /> Clear
            </button>
          </div>

          {sessions.length === 0 ? (
            <div className="px-4 py-6 text-center text-white/30 text-xs">No memory yet</div>
          ) : (
            <ScrollArea className="max-h-64">
              <div className="p-3 space-y-3">
                {sessions.map((session, si) => (
                  <div key={si} className="space-y-1">
                    <div className="text-[10px] font-mono text-white/30 px-1">
                      {new Date(session.ts).toLocaleString()}
                    </div>
                    {session.messages.map((msg, mi) => (
                      <div
                        key={mi}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[85%] px-3 py-1.5 rounded-lg text-xs leading-snug ${
                            msg.role === 'user'
                              ? 'bg-amethyst/20 text-white/80'
                              : 'bg-white/5 text-white/60'
                          }`}
                        >
                          {msg.content}
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
      )}
    </div>
  );
}