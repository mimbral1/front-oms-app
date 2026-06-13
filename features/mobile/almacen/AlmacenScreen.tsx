"use client";

import { useMemo, useState } from "react";
import { Warehouse, Boxes, AlertTriangle } from "lucide-react";
import {
  ScreenHeader,
  SearchBar,
  Pills,
  Card,
  Badge,
  ChevronRight,
} from "@/components/mobile/ui";

type Bodega = {
  id: string;
  nombre: string;
  comuna: string;
  ocupacion: number; // %
  skus: number;
  quiebres: number;
};

const BODEGAS: Bodega[] = [
  { id: "WH-01", nombre: "CD Central", comuna: "Pudahuel", ocupacion: 82, skus: 12450, quiebres: 14 },
  { id: "WH-02", nombre: "Tienda Mall Plaza", comuna: "Maipú", ocupacion: 61, skus: 3820, quiebres: 3 },
  { id: "WH-03", nombre: "Bodega Norte", comuna: "Quilicura", ocupacion: 94, skus: 8970, quiebres: 27 },
  { id: "WH-04", nombre: "Tienda Centro", comuna: "Santiago", ocupacion: 47, skus: 2110, quiebres: 0 },
];

export default function AlmacenScreen() {
  const [filter, setFilter] = useState<"todas" | "alta" | "quiebres">("todas");
  const counts = useMemo(
    () => ({
      todas: BODEGAS.length,
      alta: BODEGAS.filter((b) => b.ocupacion >= 80).length,
      quiebres: BODEGAS.filter((b) => b.quiebres > 0).length,
    }),
    []
  );
  const visible =
    filter === "alta"
      ? BODEGAS.filter((b) => b.ocupacion >= 80)
      : filter === "quiebres"
        ? BODEGAS.filter((b) => b.quiebres > 0)
        : BODEGAS;

  return (
    <div className="pt-2">
      <ScreenHeader title="Almacén" subtitle={`${counts.todas} bodegas activas`} onRefresh={() => {}} onAdd={() => {}} />
      <SearchBar placeholder="Bodega, SKU o comuna" />
      <Pills
        active={filter}
        onChange={(k) => setFilter(k as typeof filter)}
        items={[
          { key: "todas", label: "Todas", count: counts.todas },
          { key: "alta", label: "Ocupación alta", count: counts.alta, tone: "red" },
          { key: "quiebres", label: "Con quiebres", count: counts.quiebres },
        ]}
      />
      <div className="space-y-3 px-4 pt-3">
        {visible.map((b) => {
          const accent = b.ocupacion >= 90 ? "red" : b.ocupacion >= 80 ? "amber" : "blue";
          return (
            <Card key={b.id} accent={accent}>
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-[17px] font-bold text-gray-900">{b.nombre}</h3>
                {b.quiebres > 0 ? (
                  <Badge tone="red" icon={<AlertTriangle className="h-3.5 w-3.5" />}>{b.quiebres} quiebres</Badge>
                ) : (
                  <Badge tone="green">Sin quiebres</Badge>
                )}
              </div>
              <div className="mt-2 flex items-center gap-2 text-[14px] text-gray-500">
                <Warehouse className="h-4 w-4 shrink-0" />
                <span>{b.id} · {b.comuna}</span>
              </div>
              <div className="mt-1 flex items-center gap-2 text-[14px] text-gray-500">
                <Boxes className="h-4 w-4 shrink-0" />
                <span>{b.skus.toLocaleString("es-CL")} SKUs</span>
              </div>
              <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-gray-100">
                <div
                  className={`h-full rounded-full ${b.ocupacion >= 90 ? "bg-red-500" : b.ocupacion >= 80 ? "bg-amber-400" : "bg-blue-600"}`}
                  style={{ width: `${b.ocupacion}%` }}
                />
              </div>
              <div className="mt-1.5 flex items-center justify-between text-[13px] text-gray-400">
                <span>{b.ocupacion}% ocupación</span>
                <ChevronRight className="h-5 w-5 text-gray-300" />
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
