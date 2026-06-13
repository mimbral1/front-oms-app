// features/pedidos/components/cells/index.ts
// Barrel for extracted table cell components.

export { SelectCell } from "./SelectCell";
export { OrderIdCell } from "./OrderIdCell";
export { CustomerCell } from "./CustomerCell";
export { DeliveryCell } from "./DeliveryCell";
export { PickingCell } from "./PickingCell";
export { TotalsCell } from "./TotalsCell";
export { StatusCell } from "./StatusCell";

// Backward-compatible aliases (deprecated — use English names)
export { OrderIdCell as PedidoCell } from "./OrderIdCell";
export { CustomerCell as ClienteCell } from "./CustomerCell";
export { DeliveryCell as EntregaCell } from "./DeliveryCell";
export { TotalsCell as TotalesCell } from "./TotalsCell";
export { StatusCell as EstadoCell } from "./StatusCell";
