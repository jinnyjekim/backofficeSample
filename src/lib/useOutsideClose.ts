import { useEffect, type RefObject } from 'react';

// Closes a Drawer (aside) when the user clicks/mousedowns outside its DOM node.
// Drawers render with no backdrop element, so "outside" is determined by the
// ref'd root element's bounds rather than a dedicated overlay div (unlike Dialogs,
// which already have a `dialogOverlay` backdrop and should close via that div's
// own onMouseDown instead of this hook).
export function useOutsideClose<T extends HTMLElement>(ref: RefObject<T | null>, onClose: () => void, enabled = true) {
  useEffect(() => {
    if (!enabled) return;
    function handlePointerDown(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [ref, onClose, enabled]);
}
