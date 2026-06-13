"use client";

import { useMemo, useState } from "react";
import { User, Package, Clock } from "lucide-react";
import {
  ScreenHeader,
  SearchBar,
  Pills,
  Card,
  Badge,
  ChevronRight,
} from "@/components/mobile/ui";

type Ronda = {
  id: string;
  picker: string;
  zona: string;
  done: number;
  total: number;
  time: string;
  estado: "activa" | "pendiente" | "completada";
};

const RONDAS: Ronda[] = [
  { id: "R-2048", picker: "Javiera Soto", zona: "Pasillo A1–A6", done: 14, total: 20, time: "12 min", estado: "activa" },
  { id: "R-2047", picker: "Matías Díaz", zona: "Pasillo B2–B5", done: 8, total: 18, time: "20 min", estado: "activa" },
  { id: "R-2046", picker: "Sin asignar", zona: "Pasillo C1–C4", done: 0, total: 15, time: "—", estado: "pendiente" },
  { id: "R-2045", picker: "Lucas Pinto", zona: "Pasillo A7–A9", done: 16, total: 16, time: "9 min", estado: "completada" },
  { id: "R-2044", picker: "Carolina Vera", zona: "Refrigerados", done: 22, total: 22, time: "18 min", estado: "completada" },
];

const tone = (e: Ronda["estado"]) =>
  e === "activa" ? "blue" : e === "pendiente" ? "amber" : "green";
const label = (e: Ronda["estado"]) =>
  e === "activa" ? "En curso" : e === "pendiente" ? "Pendiente" : "Completada";

export default function PickingScreen() {
  const [filter, setFilter] = useState<"todas" | "activa" | "pendiente" | "completada">("todas");
  const counts = useMemo(
    () => ({
      todas: RONDAS.length,
      activa: RONDAS.filter((r) => r.estado === "activa").length,
      pendiente: RONDAS.filter((r) => r.estado === "pendiente").length,
      completada: RONDAS.filter((r) => r.estado === "completada").length,
    }),
    []
  );
  const visible = filter === "todas" ? RONDAS : RONDAS.filter((r) => r.estado === filter);

  return (
    <div className="pt-2">
      <ScreenHeader title="Picking" subtitle={`${counts.activa} rondas en curso`} onRefresh={() => {}} onAdd={() => {}} />
      <SearchBar placeholder="Ronda, picker o zona" />
      <Pills
        active={filter}
        onChange={(k) => setFilter(k as typeof filter)}
        items={[
          { key: "todas", label: "Todas", count: counts.todas },
          { key: "activa", label: "En curso", count: counts.activa },
          { key: "pendiente", label: "Pendientes", count: counts.pendiente },
          { key: "completada", label: "Listas", count: counts.completada },
        ]}
      />
      <div className="space-y-3 px-4 pt-3">
        {visible.map((r) => {
          const pct = Math.round((r.done / r.total) * 100);
          return (
            <Card key={r.id} accent={tone(r.estado) as "blue" | "amber" | "green"}>
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-[17px] font-bold text-gray-900">Ronda {r.id}</h3>
                <Badge tone={tone(r.estado)}>{label(r.estado)}</Badge>
              </div>
              <div className="mt-2 flex items-center gap-2 text-[14px] text-gray-500">
                <User className="h-4 w-4 shrink-0" />
                <span>{r.picker}</span>
              </div>
              <div className="mt-1 flex items-center gap-2 text-[14px] text-gray-500">
                <Package className="h-4 w-4 shrink-0" />
                <span>{r.zona} · {r.done}/{r.total} ítems</span>
                <span className="ml-auto flex items-center gap-1"><Clock className="h-4 w-4" />{r.time}</span>
              </div>
              <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-gray-100">
                <div className="h-full rounded-full bg-blue-600" style={{ width: `${pct}%` }} />
              </div>
              <div className="mt-1.5 flex items-center justify-between text-[13px] text-gray-400">
                <span>{pct}% completado</span>
                <ChevronRight className="h-5 w-5 text-gray-300" />
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
