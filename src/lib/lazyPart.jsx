import React, { Suspense, lazy } from 'react';

/**
 * lazyPart — code-split a non-essential UI part (a shader, an overlay, an
 * animation) so it stays out of the first download.
 *
 * Unlike a bare React.lazy, a part that fails to load (offline in the field,
 * or a chunk that vanished after a redeploy) renders its fallback instead of
 * throwing and taking the whole screen down.
 */
class PartBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error) {
    if (import.meta.env?.DEV) console.warn('[lazyPart] part failed to load:', error);
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

export function lazyPart(factory, Fallback = null) {
  const Lazy = lazy(factory);
  function LazyPart(props) {
    const fallback = Fallback ? <Fallback {...props} /> : null;
    return (
      <PartBoundary fallback={fallback}>
        <Suspense fallback={fallback}>
          <Lazy {...props} />
        </Suspense>
      </PartBoundary>
    );
  }
  LazyPart.preload = factory;
  return LazyPart;
}

/**
 * Warm likely-next chunks once the page is idle, unless the visitor is on a
 * data-saver or 2G connection (field signal is precious).
 */
export function prefetchWhenIdle(factories) {
  if (typeof window === 'undefined') return;
  const conn = navigator.connection;
  if (conn && (conn.saveData || /(^|-)2g$/.test(conn.effectiveType || ''))) return;
  const idle = window.requestIdleCallback || ((cb) => window.setTimeout(cb, 2500));
  idle(() => {
    for (const load of factories) {
      try {
        const p = load();
        if (p && typeof p.catch === 'function') p.catch(() => {});
      } catch {
        /* prefetch is best-effort */
      }
    }
  });
}
