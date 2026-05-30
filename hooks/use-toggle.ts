import { useState, useCallback } from 'react';

/**
 * Hook standard pour la gestion des états booléens (modales, menus, switchs)
 * Conforme au standard ECC (Custom Hooks)
 * 
 * @param initialState État initial (défaut: false)
 */
export function useToggle(initialState = false) {
  const [isOpen, setIsOpen] = useState<boolean>(initialState);

  const toggle = useCallback(() => setIsOpen((prev) => !prev), []);
  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);

  return {
    isOpen,
    toggle,
    open,
    close,
    setIsOpen,
  };
}
