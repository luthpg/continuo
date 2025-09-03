import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Id } from '@/convex/_generated/dataModel';

interface ConcertState {
  activeOrgId: Id<'organizations'> | null;
  activeConcertId: Id<'concerts'> | null;
  setActiveOrgId: (id: string | null) => void;
  setActiveConcertId: (id: string | null) => void;
}

export const useConcertStore = create<ConcertState>()(
  persist(
    (set) => ({
      activeOrgId: null,
      activeConcertId: null,
      setActiveOrgId: (id) =>
        set({ activeOrgId: id as Id<'organizations'>, activeConcertId: null }),
      setActiveConcertId: (id) =>
        set({ activeConcertId: id as Id<'concerts'> }),
    }),
    {
      name: 'continuo-app-storage',
    },
  ),
);
