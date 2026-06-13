"use client";

import { useMemo, useState } from "react";
import { Truck, Boxes, Clock } from "lucide-react";
import {
  ScreenHeader,
  SearchBar,
  Pills,
  AlertBanner,
  Card,
  Badge,
  clp,
  ChevronRight,
} from "@/components/mobile/ui";
import PedidoDetail from "./PedidoDetail";

type Tag = { label: string; tone: "amber" | "gray" | "blue" };
type Order = {
  id: string;
  name: string;
  amount: number;
  ref: string;
  delivery: string;
  time: string;
  items: number;
  units: number;
  assign: string;
  tags: Tag[];
  overdue: boolean;
  validacion: boolean;
};

// Datos de muestra (mismo set del mockup). En producción se mapean desde el
// tipo `Pedido` (features/pedidos/types/lista-pedidos.ts).
const ORDERS: Order[] = [
  { id: "15402", name: "Christian Edgardo González Sepúlveda", amount: 47980, ref: "MER-002-2000016913130338", delivery: "Envío a Domicilio", time: "17:26", items: 1, units: 2, assign: "Sin asignar", tags: [{ label: "Validación cliente", tone: "amber" }], overdue: true, validacion: true },
  { id: "15401", name: "Iván Edgardo Cariaga Muñoz", amount: 14990, ref: "MER-001-2000016913117244", delivery: "Envío a Domicilio", time: "17:22", items: 1, units: 1, assign: "Picking externo", tags: [{ label: "Ola finanzas", tone: "gray" }], overdue: true, validacion: false },
  { id: "15400", name: "Juan Alberto Salas", amount: 2890, ref: "MER-001-2000016913116676", delivery: "Envío a Domicilio", time: "17:21", items: 1, units: 1, assign: "Picking externo", tags: [], overdue: true, validacion: false },
  { id: "15399", name: "María Fernanda Rojas Pérez", amount: 89990, ref: "MER-002-2000016913110021", delivery: "Retiro en tienda", time: "16:58", items: 3, units: 5, assign: "Picker: J. Soto", tags: [{ label: "Ola finanzas", tone: "gray" }], overdue: true, validacion: false },
  { id: "15398", name: "Pedro Pablo Henríquez", amount: 12500, ref: "MER-001-2000016913108845", delivery: "Envío a Domicilio", time: "16:40", items: 2, units: 2, assign: "Sin asignar", tags: [], overdue: true, validacion: false },
  { id: "15397", name: "Camila Andrea Vega Lillo", amount: 34990, ref: "MER-003-2000016913104410", delivery: "Envío a Domicilio", time: "16:12", items: 4, units: 7, assign: "Picker: M. Díaz", tags: [], overdue: false, validacion: false },
  { id: "15396", name: "Sebastián Ignacio Muñoz", amount: 5990, ref: "MER-001-2000016913100233", delivery: "Retiro en tienda", time: "15:50", items: 1, units: 1, assign: "Picking externo", tags: [], overdue: false, validacion: false },
  { id: "15395", name: "Valentina Paz Contreras", amount: 119900, ref: "MER-002-2000016913098765", delivery: "Envío a Domicilio", time: "15:31", items: 6, units: 9, assign: "Picker: L. Pinto", tags: [], overdue: false, validacion: false },
];

export default function PedidosScreen() {
  const [filter, setFilter] = useState<"todos" | "vencidos" | "validacion">("todos");
  const [selected, setSelected] = useState<Order | null>(null);

  const counts = useMemo(
    () => ({
      todos: ORDERS.length,
      vencidos: ORDERS.filter((o) => o.overdue).length,
      validacion: ORDERS.filter((o) => o.validacion).length,
    }),
    []
  );

  const visible = useMemo(() => {
    if (filter === "vencidos") return ORDERS.filter((o) => o.overdue);
    if (filter === "validacion") return ORDERS.filter((o) => o.validacion);
    return ORDERS;
  }, [filter]);

  if (selected) {
    return <PedidoDetail order={selected} onBack={() => setSelected(null)} />;
  }

  return (
    <div className="pt-2">
      <ScreenHeader
        title="Pedidos"
        subtitle={`${counts.todos} activos · actualizado 17:27`}
        onRefresh={() => {}}
        onAdd={() => {}}
      />

      <SearchBar placeholder="Pedido, cliente o RUT" />

      <Pills
        active={filter}
        onChange={(k) => setFilter(k as typeof filter)}
        items={[
          { key: "todos", label: "Todos", count: counts.todos },
          { key: "vencidos", label: "Vencidos", count: counts.vencidos, tone: "red" },
          { key: "validacion", label: "Validación", count: counts.validacion },
        ]}
      />

      {counts.vencidos > 0 && filter !== "vencidos" && (
        <AlertBanner onClick={() => setFilter("vencidos")}>
          <strong className="font-bold">{counts.vencidos} pedidos</strong> con tiempo vencido
        </AlertBanner>
      )}

      <div className="space-y-3 px-4 pt-3">
        {visible.map((o) => (
          <Card key={o.id} accent={o.overdue ? "red" : "blue"} onClick={() => setSelected(o)}>
            <div className="flex items-start justify-between gap-3">
              <h3 className="truncate text-[17px] font-bold text-gray-900">{o.name}</h3>
              <span className="shrink-0 text-[17px] font-bold text-gray-900">{clp(o.amount)}</span>
            </div>

            <div className="mt-0.5 text-[14px]">
              <span className="font-semibold text-blue-600">#{o.id}</span>
              <span className="text-gray-400"> · {o.ref}</span>
            </div>

            <div className="mt-2 flex items-center gap-2 text-[14px] text-gray-500">
              <Truck className="h-4 w-4 shrink-0" />
              <span>{o.delivery} · {o.time}</span>
            </div>
            <div className="mt-1 flex items-center gap-2 text-[14px] text-gray-500">
              <Boxes className="h-4 w-4 shrink-0" />
              <span>{o.items} ítem{o.items > 1 ? "s" : ""} · {o.units} un · {o.assign}</span>
            </div>

            <div className="mt-3 flex items-center gap-2">
              {o.tags.map((t) => (
                <Badge key={t.label} tone={t.tone}>{t.label}</Badge>
              ))}
              {o.overdue && (
                <Badge tone="red" icon={<Clock className="h-3.5 w-3.5" />}>Vencido</Badge>
              )}
              <ChevronRight className="ml-auto h-5 w-5 text-gray-300" />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
