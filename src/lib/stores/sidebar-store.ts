import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SidebarState {
  isOpen: boolean;       // Active as drawer open/close
  isPinned: boolean;     // Desktop docking mode (false = Focused full-screen mode by default)
  isHovered: boolean;    // Expanded on hover when docked
  setIsOpen: (isOpen: boolean) => void;
  setIsPinned: (isPinned: boolean) => void;
  setIsHovered: (isHovered: boolean) => void;
  toggleOpen: () => void;
  togglePinned: () => void;
}

export const useSidebarStore = create<SidebarState>()(
  persist(
    (set) => ({
      isOpen: false,
      isPinned: false, // Focused full-screen mode is default!
      isHovered: false,

      setIsOpen: (isOpen) => set({ isOpen }),
      setIsPinned: (isPinned) => set({ isPinned }),
      setIsHovered: (isHovered) => set({ isHovered }),
      toggleOpen: () => set((state) => ({ isOpen: !state.isOpen })),
      togglePinned: () => set((state) => ({ isPinned: !state.isPinned, isOpen: false })), // close drawer if pinned
    }),
    {
      name: 'agency-sidebar-storage',
      partialize: (state) => ({
        isPinned: state.isPinned,
      }),
    }
  )
);
