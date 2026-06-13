import { RondaPicking } from "@/features/picking/types/rondas";

export interface DetalleRondaStore {
  ronda: RondaPicking | null;
  setRonda: (pedido: RondaPicking) => void;
}
