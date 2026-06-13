import { DetalleRondaStore } from "@/features/picking/types/detalle-rondas";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useDetalleRonda = create<DetalleRondaStore>()(
  persist(
    (set) => ({
      ronda: null,
      setRonda: (ronda) => set({ ronda }),
      //clearPedido: () => set({ pedido: null }),
    }),
    {
      name: "detalle-ronda-storage",
      version: 1,
    }
  )
);
