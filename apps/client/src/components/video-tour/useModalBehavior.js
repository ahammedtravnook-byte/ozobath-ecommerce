import { useEffect, useRef } from 'react';

/**
 * Cross-cutting dialog behaviour: scroll lock, focus restoration, and Escape.
 *
 * Kept separate from rendering so the layout components stay presentational
 * and this logic can be reused by any other modal.
 *
 * @param {boolean} open
 * @param {() => void} onClose
 * @returns {React.RefObject<HTMLElement>} ref to attach to the focusable panel
 */
export const useModalBehavior = (open, onClose) => {
  const panelRef = useRef(null);
  const previouslyFocused = useRef(null);

  useEffect(() => {
    if (!open) return undefined;

    previouslyFocused.current = document.activeElement;

    // Locking the body removes the scrollbar, which would shift the page
    // sideways underneath the overlay. Pad by the exact gutter to hold it.
    const { overflow, paddingRight } = document.body.style;
    const gutter = window.innerWidth - document.documentElement.clientWidth;

    document.body.style.overflow = 'hidden';
    if (gutter > 0) document.body.style.paddingRight = `${gutter}px`;

    panelRef.current?.focus();

    return () => {
      document.body.style.overflow = overflow;
      document.body.style.paddingRight = paddingRight;
      // Return focus to whatever opened the dialog.
      previouslyFocused.current?.focus?.();
    };
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;

    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose?.();
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  return panelRef;
};

export default useModalBehavior;
