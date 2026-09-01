import { useState, useRef, useEffect } from 'react';

/**
 * DeferredSection — only mounts children when they scroll near the viewport.
 *
 * Prevents 15+ heavy components from initializing simultaneously on page load.
 * Uses IntersectionObserver with a rootMargin buffer so content is ready
 * before the user sees it. Falls back to immediate render if IO is unavailable.
 *
 * The fallback placeholder preserves layout height to prevent scroll jank.
 */
export default function DeferredSection({ children, minHeight = 80, rootMargin = '300px' }) {
  const [visible, setVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (!('IntersectionObserver' in window)) {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: `${rootMargin} 0px` }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [rootMargin]);

  if (visible) return children;

  return (
    <div
      ref={ref}
      style={{ minHeight }}
      className="rounded-2xl"
      aria-hidden
    />
  );
}