/**
 * useSidebarStore — Zustand store for sidebar state management
 * Persists: expandedGroups, pinnedItems, recentlyVisited, theme
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// --- Helper: auto-detect viewport
const getInitialMode = () => {
  if (typeof window === 'undefined') return 'expanded';
  if (window.innerWidth < 768) return 'mobile';
  if (window.innerWidth < 1100) return 'collapsed';
  return 'expanded';
};

const useSidebarStore = create(
  persist(
    (set, get) => ({
      // ── Layout mode ──────────────────────────────────────────
      mode: getInitialMode(), // 'expanded' | 'collapsed' | 'mobile'
      mobileOpen: false,      // is the mobile drawer open?

      // ── Group accordion state ─────────────────────────────────
      expandedGroups: ['OVERVIEW', 'OPERATIONS'], // groups open by default

      // ── Pinned / favorites ───────────────────────────────────
      pinnedItems: [], // array of item.key strings

      // ── Recently visited ─────────────────────────────────────
      recentlyVisited: [], // array of { key, label, to, icon } — last 5

      // ── Search ───────────────────────────────────────────────
      searchQuery: '',
      searchOpen: false,

      // ── Notification badges ──────────────────────────────────
      badges: {
        pendingOrders: 0,
        openTickets: 0,
        pendingWaste: 0,
        lowStock: 0,
      },

      // ── Theme ────────────────────────────────────────────────
      theme: 'light', // 'light' | 'dark'

      // ── Actions ──────────────────────────────────────────────

      setMode: (mode) => set({ mode }),

      toggleSidebar: () => {
        const { mode } = get();
        if (mode === 'expanded') set({ mode: 'collapsed' });
        else if (mode === 'collapsed') set({ mode: 'expanded' });
      },

      openMobile: () => set({ mobileOpen: true }),
      closeMobile: () => set({ mobileOpen: false }),
      toggleMobile: () => set((s) => ({ mobileOpen: !s.mobileOpen })),

      toggleGroup: (key) =>
        set((s) => ({
          expandedGroups: s.expandedGroups.includes(key)
            ? s.expandedGroups.filter((k) => k !== key)
            : [...s.expandedGroups, key],
        })),

      expandGroup: (key) =>
        set((s) => ({
          expandedGroups: s.expandedGroups.includes(key)
            ? s.expandedGroups
            : [...s.expandedGroups, key],
        })),

      collapseGroup: (key) =>
        set((s) => ({
          expandedGroups: s.expandedGroups.filter((k) => k !== key),
        })),


      togglePin: (itemKey) =>
        set((s) => ({
          pinnedItems: s.pinnedItems.includes(itemKey)
            ? s.pinnedItems.filter((k) => k !== itemKey)
            : [...s.pinnedItems, itemKey],
        })),

      isPinned: (itemKey) => get().pinnedItems.includes(itemKey),

      visit: (item) => {
        if (!item?.to) return;
        set((s) => {
          const filtered = s.recentlyVisited.filter((r) => r.to !== item.to);
          return {
            recentlyVisited: [{ key: item.key, label: item.label, to: item.to }, ...filtered].slice(0, 6),
          };
        });
      },

      setSearchQuery: (q) => set({ searchQuery: q }),
      openSearch: () => set({ searchOpen: true }),
      closeSearch: () => set({ searchOpen: false, searchQuery: '' }),

      setBadges: (badges) => set((s) => ({ badges: { ...s.badges, ...badges } })),

      toggleTheme: () => {
        const next = get().theme === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', next);
        set({ theme: next });
      },

      initTheme: () => {
        const theme = get().theme;
        document.documentElement.setAttribute('data-theme', theme);
      },
    }),
    {
      name: 'sidebar-store',
      // Only persist these fields — mode is intentionally NOT persisted (viewport-dependent)
      partialize: (s) => ({
        expandedGroups: s.expandedGroups,
        pinnedItems: s.pinnedItems,
        recentlyVisited: s.recentlyVisited,
        theme: s.theme,
      }),
    }
  )
);

export default useSidebarStore;
