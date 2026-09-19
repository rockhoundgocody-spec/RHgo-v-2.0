import { useEffect } from 'react';

const FOCUSABLE_SELECTOR =
  'button:not([disabled]), [href]:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Custom hook to manage focus trapping inside a container (e.g., dialog, drawer, sheet).
 *
 * @param {React.RefObject<HTMLElement>} containerRef
 * @param {Object} [options]
 * @param {boolean} [options.active=true] Whether the trap is active.
 * @param {Function} [options.onClose] Callback when Escape key is pressed.
 * @param {React.RefObject<HTMLElement>} [options.initialFocusRef] Optional element to focus initially.
 * @param {Function} [options.onDeactivate] Custom deactivate handler (e.g., returning focus to trigger).
 * @param {boolean} [options.restoreFocus=true] Whether to automatically restore focus to document.activeElement on unmount/deactivation.
 */
export function useFocusTrap(containerRef, options = {}) {
  const {
    active = true,
    onClose,
    initialFocusRef,
    onDeactivate,
    restoreFocus = true,
  } = options;

  useEffect(() => {
    if (!active || typeof document === 'undefined') return;

    const previouslyFocused = document.activeElement;

    const getControls = () => {
      const el = containerRef?.current;
      if (!el) return { selected: null, focusables: [] };
      const selected = el.querySelector?.('[aria-checked="true"]');
      const focusables = Array.from(el.querySelectorAll?.(FOCUSABLE_SELECTOR) || []);
      return { selected, focusables };
    };

    const focusInitial = () => {
      if (initialFocusRef?.current) {
        initialFocusRef.current.focus?.();
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
        last.focus?.();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        last.focus?.();
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
  }, [containerRef, active, onClose, initialFocusRef, onDeactivate, restoreFocus]);
}
