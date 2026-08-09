/**
 * Performance Optimization Utilities
 * Targets: sub-50ms touch feedback, 60fps scroll, progressive loading
 */

/**
 * Debounce utility (search, filters)
 */
export function debounce(fn, delayMs = 300) {
  let timeout;
  return function debounced(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn.apply(this, args), delayMs);
  };
}

/**
 * Throttle utility (scroll events, resize)
 */
export function throttle(fn, intervalMs = 100) {
  let lastCall = 0;
  return function throttled(...args) {
    const now = Date.now();
    if (now - lastCall >= intervalMs) {
      lastCall = now;
      fn.apply(this, args);
    }
  };
}

/**
 * Measure component render time
 */
export function measureRenderTime(componentName) {
  const startMark = `${componentName}-start`;
  const endMark = `${componentName}-end`;

  performance.mark(startMark);

  return () => {
    performance.mark(endMark);
    performance.measure(componentName, startMark, endMark);

    const measure = performance.getEntriesByName(componentName)[0];
    console.log(`[Perf] ${componentName}: ${measure.duration.toFixed(2)}ms`);

    return measure.duration;
  };
}

/**
 * Image lazy loading with IntersectionObserver
 */
export function lazyLoadImages(containerElement) {
  if (!('IntersectionObserver' in window)) {
    // Fallback for older browsers
    const images = containerElement.querySelectorAll('img[data-src]');
    images.forEach((img) => {
      img.src = img.dataset.src;
      img.removeAttribute('data-src');
    });
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const img = entry.target;
        img.src = img.dataset.src;
        img.removeAttribute('data-src');
        observer.unobserve(img);
      }
    });
  });

  containerElement.querySelectorAll('img[data-src]').forEach((img) => {
    observer.observe(img);
  });

  return observer;
}

/**
 * Batch DOM updates (reduce thrashing)
 */
export function batchDOMUpdates(updates) {
  // Read all
  const reads = updates.filter((u) => u.type === 'read').map((u) => u.fn());

  // Write all
  updates.filter((u) => u.type === 'write').forEach((u) => u.fn());

  return reads;
}

/**
 * Request idle callback polyfill + wrapper
 */
export function scheduleWork(callback, options = {}) {
  if ('requestIdleCallback' in window) {
    return requestIdleCallback(callback, options);
  }

  // Polyfill: use setTimeout with 0 delay
  return setTimeout(callback, 0);
}

/**
 * Virtual scroll optimization (for large lists)
 */
export class VirtualScroller {
  constructor(containerElement, itemHeight, renderItem) {
    this.container = containerElement;
    this.itemHeight = itemHeight;
    this.renderItem = renderItem;
    this.items = [];
    this.visibleRange = { start: 0, end: 0 };

    this.container.addEventListener('scroll', () => this.onScroll());
  }

  setItems(items) {
    this.items = items;
    this.render();
  }

  onScroll() {
    const scrollTop = this.container.scrollTop;
    const containerHeight = this.container.clientHeight;

    const start = Math.floor(scrollTop / this.itemHeight);
    const end = Math.ceil((scrollTop + containerHeight) / this.itemHeight);

    if (start !== this.visibleRange.start || end !== this.visibleRange.end) {
      this.visibleRange = { start, end };
      this.render();
    }
  }

  render() {
    const { start, end } = this.visibleRange;
    const visibleItems = this.items.slice(start, end);

    this.container.textContent = '';

    visibleItems.forEach((item, i) => {
      const el = this.renderItem(item, start + i);
      el.style.transform = `translateY(${(start + i) * this.itemHeight}px)`;
      this.container.appendChild(el);
    });
  }
}

/**
 * Cache strategy for API responses
 */
export class ResponseCache {
  constructor(ttlSeconds = 300) {
    this.cache = new Map();
    this.ttlSeconds = ttlSeconds;
  }

  set(key, value) {
    this.cache.set(key, {
      value,
      expiry: Date.now() + this.ttlSeconds * 1000,
    });
  }

  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }

    return item.value;
  }

  clear() {
    this.cache.clear();
  }
}

/**
 * Web Worker wrapper for heavy computation
 */
export function offloadWork(workerScript, data) {
  return new Promise((resolve, reject) => {
    const blob = new Blob([workerScript], { type: 'application/javascript' });
    const worker = new Worker(URL.createObjectURL(blob));

    worker.onmessage = (e) => {
      resolve(e.data);
      worker.terminate();
    };

    worker.onerror = (e) => {
      reject(e);
      worker.terminate();
    };

    worker.postMessage(data);
  });
}

/**
 * Memory leak detection (dev only)
 */
export function detectMemoryLeaks() {
  if (typeof performance === 'undefined' || !performance.memory) {
    console.warn('Memory API not available in this browser');
    return null;
  }

  const mem = performance.memory;
  const usagePercent = (mem.usedJSHeapSize / mem.jsHeapSizeLimit) * 100;

  return {
    usedHeap: `${(mem.usedJSHeapSize / 1048576).toFixed(2)}MB`,
    totalHeap: `${(mem.jsHeapSizeLimit / 1048576).toFixed(2)}MB`,
    usagePercent: usagePercent.toFixed(1),
    warning: usagePercent > 80,
  };
}

/**
 * Network information API (adaptive quality)
 */
export function getNetworkInfo() {
  const connection =
    navigator.connection ||
    navigator.mozConnection ||
    navigator.webkitConnection;

  if (!connection) return null;

  return {
    effectiveType: connection.effectiveType, // 'slow-2g', '2g', '3g', '4g'
    downlink: connection.downlink, // Mbps
    rtt: connection.rtt, // Round-trip time
    saveData: connection.saveData, // User requested data saver
  };
}

/**
 * Adaptive image loading based on network
 */
export function getImageUrl(baseUrl, options = {}) {
  const networkInfo = getNetworkInfo();

  if (!networkInfo) {
    return baseUrl; // Fallback
  }

  // Degrade quality on slow networks or with data saver enabled
  if (networkInfo.effectiveType === 'slow-2g' || networkInfo.saveData) {
    return baseUrl.replace(/\.(jpg|png)/, '-thumb.$1');
  }

  if (networkInfo.effectiveType === '2g' || networkInfo.effectiveType === '3g') {
    return baseUrl.replace(/\.(jpg|png)/, '-sm.$1');
  }

  return baseUrl;
}