import { useEffect, useState } from 'react';

/**
 * Returns true when the page/tab is currently visible.
 * Lets animation loops pause cleanly when user switches tabs / locks phone.
 */
export default function usePageVisible() {
  const [visible, setVisible] = useState(
    typeof document !== 'undefined' ? !document.hidden : true
  );
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const onVis = () => setVisible(!document.hidden);
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, []);
  return visible;
}