"use client";

import { useMemo, useState } from "react";
import { Truck, MapPin, Clock } from "lucide-react";
import {
  ScreenHeader,
  SearchBar,
  Pills,
  Card,
  Badge,
  ChevronRight,
} from "@/components/mobile/ui";

type Ruta = {
  id: string;
  transportista: string;
  patente: string;
  paradas: number;
  entregadas: number;
  zona: string;
  eta: string;
  estado: "ruta" | "preparacion" | "completada";
};

const RUTAS: Ruta[] = [
  { id: "RT-318", transportista: "Blue Express", patente: "JKLM-34", paradas: 12, entregadas: 7, zona: "Maipú · Cerrillos", eta: "18:40", estado: "ruta" },
  { id: "RT-317", transportista: "Chilexpress", patente: "PRST-91", paradas: 9, entregadas: 3, zona: "Ñuñoa · Macul", eta: "19:10", estado: "ruta" },
  { id: "RT-316", transportista: "Starken", patente: "BCDF-12", paradas: 15, entregadas: 0, zona: "La Florida", eta: "—", estado: "preparacion" },
  { id: "RT-315", transportista: "Flota interna", patente: "GHJK-77", paradas: 8, entregadas: 8, zona: "Providencia", eta: "17:05", estado: "completada" },
];

const tone = (e: Ruta["estado"]) =>
  e === "ruta" ? "blue" : e === "preparacion" ? "amber" : "green";
const label = (e: Ruta["estado"]) =>
  e === "ruta" ? "En ruta" : e === "preparacion" ? "Preparación" : "Completada";

export default function DeliveryScreen() {
  const [filter, setFilter] = useState<"todas" | "ruta" | "preparacion" | "completada">("todas");
  const counts = useMemo(
    () => ({
      todas: RUTAS.length,
      ruta: RUTAS.filter((r) => r.estado === "ruta").length,
      preparacion: RUTAS.filter((r) => r.estado === "preparacion").length,
      completada: RUTAS.filter((r) => r.estado === "completada").length,
    }),
    []
  );
  const visible = filter === "todas" ? RUTAS : RUTAS.filter((r) => r.estado === filter);

  return (
    <div className="pt-2">
      <ScreenHeader title="Delivery" subtitle={`${counts.ruta} rutas en ruta`} onRefresh={() => {}} onAdd={() => {}} />
      <SearchBar placeholder="Ruta, transportista o patente" />
      <Pills
        active={filter}
        onChange={(k) => setFilter(k as typeof filter)}
        items={[
          { key: "todas", label: "Todas", count: counts.todas },
          { key: "ruta", label: "En ruta", count: counts.ruta },
          { key: "preparacion", label: "Preparación", count: counts.preparacion },
          { key: "completada", label: "Listas", count: counts.completada },
        ]}
      />
      <div className="space-y-3 px-4 pt-3">
        {visible.map((r) => {
          const pct = Math.round((r.entregadas / r.paradas) * 100);
          return (
            <Card key={r.id} accent={tone(r.estado) as "blue" | "amber" | "green"}>
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-[17px] font-bold text-gray-900">Ruta {r.id}</h3>
                <Badge tone={tone(r.estado)}>{label(r.estado)}</Badge>
              </div>
              <div className="mt-2 flex items-center gap-2 text-[14px] text-gray-500">
                <Truck className="h-4 w-4 shrink-0" />
                <span>{r.transportista} · {r.patente}</span>
              </div>
              <div className="mt-1 flex items-center gap-2 text-[14px] text-gray-500">
                <MapPin className="h-4 w-4 shrink-0" />
                <span>{r.zona} · {r.entregadas}/{r.paradas} entregas</span>
                <span className="ml-auto flex items-center gap-1"><Clock className="h-4 w-4" />{r.eta}</span>
              </div>
              <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-gray-100">
                <div className="h-full rounded-full bg-blue-600" style={{ width: `${pct}%` }} />
              </div>
              <div className="mt-1.5 flex items-center justify-between text-[13px] text-gray-400">
                <span>{pct}% entregado</span>
                <ChevronRight className="h-5 w-5 text-gray-300" />
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
