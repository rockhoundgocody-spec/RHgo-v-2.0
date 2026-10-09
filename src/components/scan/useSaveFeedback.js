import { useRef, useState } from 'react';

export default function useSaveFeedback() {
  const pending = useRef(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const runSave = async (action) => {
    if (pending.current) return;
    pending.current = true;
    setSaving(true); setSaveError('');
    try { await action(); }
    catch { setSaveError('The save could not finish. Your report is still open. Check your connection and your collection before trying again.'); }
    finally { pending.current = false; setSaving(false); }
  };
  return { saving, saveError, runSave, clearSaveError: () => setSaveError('') };
}