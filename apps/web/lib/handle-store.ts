import { create } from "zustand";
import { persist } from "zustand/middleware";

interface HandleStore {
  lastHandle: string | null;
  setHandle: (h: string) => void;
}

export const useHandleStore = create<HandleStore>()(
  persist(
    (set) => ({
      lastHandle: null,
      setHandle: (h) => set({ lastHandle: h }),
    }),
    { name: "cp-dashboard-handle" }
  )
);
