import { useEffect, useRef } from 'react';

const FOCUSABLE_SELECTOR =
  'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Custom hook for trapping focus inside a modal/dialog container,
 * handling Escape key presses, and restoring focus on exit.
 *
 * @param {React.RefObject<HTMLElement>} containerRef - Ref pointing to the dialog/modal container element
 * @param {boolean} isActive - Whether the trap is currently active
 * @param {Object} [options]
 * @param {Function} [options.onEscape] - Callback triggered when Escape key is pressed
 * @param {string} [options.initialFocusSelector] - Optional selector for initial element to focus inside container
 * @param {React.RefObject<HTMLElement>} [options.triggerRef] - Ref to element that triggered the dialog (for focus restoration)
 * @param {boolean} [options.autoFocus=true] - Whether to automatically focus initial element on activation
 */
export function useFocusTrap(containerRef, isActive, options = {}) {
  const {
    onEscape,
    initialFocusSelector,
    triggerRef,
    autoFocus = true,
  } = options;

  const onEscapeRef = useRef(onEscape);
  useEffect(() => {
    onEscapeRef.current = onEscape;
  }, [onEscape]);

  useEffect(() => {
    if (!isActive || typeof document === 'undefined') return undefined;

    const previousFocus = document.activeElement;
    const container = containerRef?.current;

    const getFocusableControls = () => {
      if (!container) return [];
      return Array.from(container.querySelectorAll(FOCUSABLE_SELECTOR));
    };

    if (autoFocus && container) {
      const controls = getFocusableControls();
      const initialElement =
        (initialFocusSelector && container.querySelector(initialFocusSelector)) ||
        controls[0] ||
        container;

      initialElement?.focus?.();
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && onEscapeRef.current) {
        event.preventDefault();
        onEscapeRef.current(event);
        return;
      }

      if (event.key !== 'Tab') return;

      const controls = getFocusableControls();
      if (controls.length === 0) return;

      const first = controls[0];
      const last = controls[controls.length - 1];

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
      if (triggerRef?.current?.focus) {
        triggerRef.current.focus();
      } else if (previousFocus?.focus) {
        previousFocus.focus();
      }
    };
  }, [containerRef, isActive, initialFocusSelector, triggerRef, autoFocus]);
}

export default useFocusTrap;
