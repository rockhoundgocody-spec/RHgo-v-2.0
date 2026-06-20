/**
 * useCloverChat — lightweight text-based Clover companion hook.
 * Replaces the xAI Realtime WebSocket voice with a free InvokeLLM
 * call via the cloverChat backend function. No API key cost on every tap.
 *
 * Usage:
 *   const { reply, loading, sendMessage, history } = useCloverChat({ companion, todaysFinds });
 */
import { useState, useRef, useCallback } from 'react';
import { base44 } from '@/api/base44Client';

export default function useCloverChat({ companion, todaysFinds = 0, onFindLogged } = {}) {
  const [reply, setReply]     = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);
  const historyRef            = useRef([]);

  const sendMessage = useCallback(async (text) => {
    if (!text?.trim() || loading) return;

    historyRef.current = [...historyRef.current, { role: 'user', content: text }].slice(-10);
    setLoading(true);
    setError(null);

    try {
      const res = await base44.functions.invoke('cloverChat', {
        history: historyRef.current,
        companion,
        todays_finds: todaysFinds,
      });

      const data = res?.data;
      const cloverReply = data?.reply || "Hey, what did you find today?";
      historyRef.current = [...historyRef.current, { role: 'assistant', content: cloverReply }].slice(-10);
      setReply(cloverReply);

      if (data?.log_find && data?.find_details) {
        try {
          await base44.functions.invoke('parseSpecimenDictation', {
            transcript: data.find_details,
            create: true,
          });
          onFindLogged?.(data.find_details.split(' ').slice(0, 3).join(' '));
        } catch {}
      }
    } catch (e) {
      setError(e.message);
      setReply("I couldn't connect right now — tap again to retry.");
    } finally {
      setLoading(false);
    }
  }, [companion, todaysFinds, loading, onFindLogged]);

  const reset = useCallback(() => {
    historyRef.current = [];
    setReply('');
    setError(null);
  }, []);

  return { reply, loading, error, sendMessage, reset, history: historyRef.current };
}