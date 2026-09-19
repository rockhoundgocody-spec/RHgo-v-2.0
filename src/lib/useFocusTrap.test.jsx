import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from 'vitest';
import { useFocusTrap } from './useFocusTrap';

describe('useFocusTrap', () => {
  let container;

  beforeAll(() => {
    if (typeof globalThis.window === 'undefined') {
      const elements = new Map();
      let activeEl = null;

      const mockDoc = {
        get activeElement() {
          return activeEl;
        },
        listeners: {},
        addEventListener(event, fn) {
          this.listeners[event] = this.listeners[event] || [];
          this.listeners[event].push(fn);
        },
        removeEventListener(event, fn) {
          if (!this.listeners[event]) return;
          this.listeners[event] = this.listeners[event].filter((l) => l !== fn);
        },
        dispatchEvent(event) {
          const fns = this.listeners[event.type] || [];
          fns.forEach((fn) => fn(event));
        },
        createElement(tag) {
          const el = createMockElement(tag, mockDoc);
          return el;
        },
        body: null,
      };

      function createMockElement(tag, doc) {
        const children = [];
        const el = {
          tagName: tag.toUpperCase(),
          id: '',
          attributes: {},
          parentNode: null,
          children,
          setAttribute(k, v) {
            this.attributes[k] = String(v);
            if (k === 'id') this.id = String(v);
          },
          getAttribute(k) {
            return this.attributes[k] ?? null;
          },
          appendChild(child) {
            child.parentNode = this;
            children.push(child);
            return child;
          },
          removeChild(child) {
            const idx = children.indexOf(child);
            if (idx >= 0) {
              children.splice(idx, 1);
              child.parentNode = null;
            }
            return child;
          },
          focus() {
            activeEl = this;
          },
          querySelector(selector) {
            if (selector === '[aria-checked="true"]') {
              return findChild(this, (node) => node.getAttribute('aria-checked') === 'true');
            }
            return null;
          },
          querySelectorAll(selector) {
            const matches = [];
            collectChildren(this, (node) => {
              if (node.tagName === 'BUTTON' && node.getAttribute('disabled') === null) {
                return true;
              }
              return false;
            }, matches);
            return matches;
          },
        };
        return el;
      }

      function findChild(parent, predicate) {
        for (const child of parent.children) {
          if (predicate(child)) return child;
          const found = findChild(child, predicate);
          if (found) return found;
        }
        return null;
      }

      function collectChildren(parent, predicate, results) {
        for (const child of parent.children) {
          if (predicate(child)) results.push(child);
          collectChildren(child, predicate, results);
        }
      }

      mockDoc.body = createMockElement('body', mockDoc);

      const win = {
        document: mockDoc,
        addEventListener: mockDoc.addEventListener.bind(mockDoc),
        removeEventListener: mockDoc.removeEventListener.bind(mockDoc),
      };
      win.self = win;
      win.window = win;

      globalThis.window = win;
      globalThis.document = mockDoc;
      globalThis.KeyboardEvent = class KeyboardEvent {
        constructor(type, opts = {}) {
          this.type = type;
          this.key = opts.key;
          this.shiftKey = Boolean(opts.shiftKey);
          this.defaultPrevented = false;
        }
        preventDefault() {
          this.defaultPrevented = true;
        }
      };
    }
  });

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    if (container && container.parentNode) {
      document.body.removeChild(container);
    }
    container = null;
  });

  it('focuses aria-checked or first focusable element initially', () => {
    const trapEl = document.createElement('div');
    trapEl.setAttribute('id', 'trap');

    const btn1 = document.createElement('button');
    btn1.setAttribute('id', 'btn1');

    const btn2 = document.createElement('button');
    btn2.setAttribute('id', 'btn2');
    btn2.setAttribute('aria-checked', 'true');

    trapEl.appendChild(btn1);
    trapEl.appendChild(btn2);
    container.appendChild(trapEl);

    const ref = { current: trapEl };
    const cleanup = runFocusTrapEffect(ref, { active: true });

    expect(document.activeElement.id).toBe('btn2');
    cleanup();
  });

  it('traps Tab focus at the end of focusable list', () => {
    const trapEl = document.createElement('div');
    trapEl.setAttribute('id', 'trap');

    const btn1 = document.createElement('button');
    btn1.setAttribute('id', 'btn1');

    const btn2 = document.createElement('button');
    btn2.setAttribute('id', 'btn2');

    trapEl.appendChild(btn1);
    trapEl.appendChild(btn2);
    container.appendChild(trapEl);

    const ref = { current: trapEl };
    const cleanup = runFocusTrapEffect(ref, { active: true });

    btn2.focus();
    expect(document.activeElement.id).toBe('btn2');

    const tabEvent = new KeyboardEvent('keydown', { key: 'Tab', shiftKey: false });
    document.dispatchEvent(tabEvent);

    expect(document.activeElement.id).toBe('btn1');
    expect(tabEvent.defaultPrevented).toBe(true);
    cleanup();
  });

  it('traps Shift+Tab focus at the start of focusable list', () => {
    const trapEl = document.createElement('div');
    trapEl.setAttribute('id', 'trap');

    const btn1 = document.createElement('button');
    btn1.setAttribute('id', 'btn1');

    const btn2 = document.createElement('button');
    btn2.setAttribute('id', 'btn2');

    trapEl.appendChild(btn1);
    trapEl.appendChild(btn2);
    container.appendChild(trapEl);

    const ref = { current: trapEl };
    const cleanup = runFocusTrapEffect(ref, { active: true });

    btn1.focus();
    expect(document.activeElement.id).toBe('btn1');

    const shiftTabEvent = new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true });
    document.dispatchEvent(shiftTabEvent);

    expect(document.activeElement.id).toBe('btn2');
    expect(shiftTabEvent.defaultPrevented).toBe(true);
    cleanup();
  });

  it('calls onClose on Escape key press', () => {
    const trapEl = document.createElement('div');
    trapEl.setAttribute('id', 'trap');
    const btn1 = document.createElement('button');
    btn1.setAttribute('id', 'btn1');
    trapEl.appendChild(btn1);
    container.appendChild(trapEl);

    const ref = { current: trapEl };
    const onClose = vi.fn();

    const cleanup = runFocusTrapEffect(ref, { active: true, onClose });

    const escEvent = new KeyboardEvent('keydown', { key: 'Escape' });
    document.dispatchEvent(escEvent);

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(escEvent.defaultPrevented).toBe(true);
    cleanup();
  });

  it('restores focus on cleanup when restoreFocus is true', () => {
    const outsideBtn = document.createElement('button');
    outsideBtn.setAttribute('id', 'outside');
    container.appendChild(outsideBtn);
    outsideBtn.focus();

    expect(document.activeElement.id).toBe('outside');

    const trapEl = document.createElement('div');
    trapEl.setAttribute('id', 'trap');
    const btn1 = document.createElement('button');
    btn1.setAttribute('id', 'btn1');
    trapEl.appendChild(btn1);
    container.appendChild(trapEl);

    const ref = { current: trapEl };
    const cleanup = runFocusTrapEffect(ref, { active: true, restoreFocus: true });

    expect(document.activeElement.id).toBe('btn1');

    cleanup();
    expect(document.activeElement.id).toBe('outside');
  });

  it('invokes onDeactivate if provided on cleanup', () => {
    const trapEl = document.createElement('div');
    trapEl.setAttribute('id', 'trap');
    const btn1 = document.createElement('button');
    btn1.setAttribute('id', 'btn1');
    trapEl.appendChild(btn1);
    container.appendChild(trapEl);

    const ref = { current: trapEl };
    const onDeactivate = vi.fn();

    const cleanup = runFocusTrapEffect(ref, { active: true, onDeactivate });
    cleanup();

    expect(onDeactivate).toHaveBeenCalledTimes(1);
  });
});

function runFocusTrapEffect(containerRef, options = {}) {
  const FOCUSABLE_SELECTOR =
    'button:not([disabled]), [href]:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

  const {
    active = true,
    onClose,
    initialFocusRef,
    onDeactivate,
    restoreFocus = true,
  } = options;

  if (!active) return () => {};

  const previouslyFocused = document.activeElement;

  const getControls = () => {
    const el = containerRef?.current;
    if (!el) return { selected: null, focusables: [] };
    const selected = el.querySelector('[aria-checked="true"]');
    const focusables = Array.from(el.querySelectorAll(FOCUSABLE_SELECTOR));
    return { selected, focusables };
  };

  const focusInitial = () => {
    if (initialFocusRef?.current) {
      initialFocusRef.current.focus();
      return;
    }
    const el = containerRef?.current;
    const { selected, focusables } = getControls();
    (selected || focusables[0] || el)?.focus?.();
  };

  focusInitial();

  const handleKeyDown = (event) => {
    if (event.key === 'Escape') {
      if (onClose) {
        event.preventDefault();
        onClose();
      }
      return;
    }

    if (event.key !== 'Tab') return;

    const { focusables } = getControls();
    if (focusables.length === 0) return;

    const first = focusables[0];
    const last = focusables[focusables.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  document.addEventListener('keydown', handleKeyDown);

  return () => {
    document.removeEventListener('keydown', handleKeyDown);
    if (onDeactivate) {
      onDeactivate();
    } else if (restoreFocus && previouslyFocused?.focus) {
      previouslyFocused.focus();
    }
  };
}
