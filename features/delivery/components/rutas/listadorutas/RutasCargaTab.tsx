// features/delivery/components/rutas/listadorutas/RutasCargaTab.tsx
// ============================================================================
// TAB CARGA — Planificación de carga 3D del camión (componente presentacional).
//
// Reutiliza los componentes existentes del design system (Card, Input,
// StatusBadge) y el visor aislado TruckLoad3DViewer. No contiene fetching:
// recibe el `RouteLoadPlan` ya resuelto desde su contenedor.
// ============================================================================

"use client";

import React, { useMemo, useState } from "react";
import {
  MagnifyingGlassIcon,
  AdjustmentsHorizontalIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import { Boxes, MapPin } from "lucide-react";
import Card from "@/components/ui/card/Card";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/ui/badge/StatusBadge";
import { TruckLoad3DViewer, type LoadViewMode } from "./TruckLoad3DViewer";
import {
  type RouteLoadPlan,
  type LoadRuleStatus,
  type LoadAlertLevel,
  stopColor,
  fmtVolume,
  fmtWeight,
  fmtMeters,
  pct,
} from "./loadPlan";

/* ─── Sub-componentes reutilizables locales ─── */

function ProgressBar({
  value,
  color = "#3b82f6",
}: {
  value: number;
  color?: string;
}) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
      <div
        className="h-full rounded-full transition-all"
        style={{
          width: `${Math.min(100, Math.max(0, value))}%`,
          backgroundColor: color,
        }}
      />
    </div>
  );
}

function MetricRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-slate-500">{label}</span>
      <span className="font-semibold text-slate-800">{value}</span>
    </div>
  );
}

function MetricWithBar({
  label,
  value,
  percentage,
  color,
}: {
  label: string;
  value: string;
  percentage: number;
  color?: string;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="text-slate-500">{label}</span>
        <span className="font-semibold text-slate-800">{value}</span>
      </div>
      <ProgressBar value={percentage} color={color} />
      <div className="text-right text-[11px] font-medium text-slate-400">
        {percentage}%
      </div>
    </div>
  );
}

const ruleBadgeVariant: Record<
  LoadRuleStatus,
  "success" | "warning" | "error"
> = {
  pass: "success",
  warn: "warning",
  fail: "error",
};

const alertStyle: Record<
  LoadAlertLevel,
  { wrap: string; icon: React.ReactNode }
> = {
  warning: {
    wrap: "border-amber-200 bg-amber-50 text-amber-800",
    icon: (
      <ExclamationTriangleIcon className="h-4 w-4 shrink-0 text-amber-500" />
    ),
  },
  info: {
    wrap: "border-sky-200 bg-sky-50 text-sky-800",
    icon: <InformationCircleIcon className="h-4 w-4 shrink-0 text-sky-500" />,
  },
  error: {
    wrap: "border-rose-200 bg-rose-50 text-rose-800",
    icon: <XCircleIcon className="h-4 w-4 shrink-0 text-rose-500" />,
  },
};

/* ─── Componente principal ─── */

export interface RutasCargaTabProps {
  plan: RouteLoadPlan | null;
  loading?: boolean;
  error?: string | null;
}

export function RutasCargaTab({ plan, loading, error }: RutasCargaTabProps) {
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<LoadViewMode>("packages");
  const [transparency, setTransparency] = useState(35);

  const filteredPackages = useMemo(() => {
    if (!plan) return [];
    const q = search.trim().toLowerCase();
    if (!q) return plan.packages;
    return plan.packages.filter((p) => p.id.toLowerCase().includes(q));
  }, [plan, search]);

  if (loading) {
    return (
      <div className="p-6 text-sm text-slate-500">Cargando plan de carga…</div>
    );
  }
  if (error) {
    return (
      <div className="m-2 rounded-md border-l-4 border-red-400 bg-red-50 p-4 text-sm text-red-700">
        {error}
      </div>
    );
  }
  if (!plan) {
    return (
      <div className="p-6 text-sm text-slate-500">
        No hay plan de carga para esta ruta.
      </div>
    );
  }

  const { vehicle, summary } = plan;

  return (
    <div className="space-y-4">
      {/* ===== Fila superior: 3 paneles ===== */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[300px_minmax(0,1fr)_340px]">
        {/* ---- Panel izquierdo: Resumen de carga ---- */}
        <Card
          title="Resumen de carga"
          titleClassName="text-base"
          className="space-y-4"
        >
          <div className="rounded-lg border border-slate-200 p-3">
            <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
              Capacidad del vehículo
            </div>
            <div className="space-y-2">
              <MetricRow
                label="Volumen"
                value={fmtVolume(vehicle.maxVolumeM3)}
              />
              <MetricRow
                label="Peso máximo"
                value={fmtWeight(vehicle.maxWeightKg)}
              />
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 p-3">
            <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
              Carga planificada
            </div>
            <div className="space-y-3">
              <MetricWithBar
                label="Volumen utilizado"
                value={fmtVolume(summary.usedVolumeM3)}
                percentage={pct(summary.usedVolumeM3, vehicle.maxVolumeM3)}
              />
              <MetricWithBar
                label="Peso total"
                value={fmtWeight(summary.usedWeightKg)}
                percentage={pct(summary.usedWeightKg, vehicle.maxWeightKg)}
                color="#22c55e"
              />
              <MetricWithBar
                label="Espacios utilizados"
                value={`${summary.usedSpaces} / ${vehicle.totalSpaces}`}
                percentage={pct(summary.usedSpaces, vehicle.totalSpaces)}
                color="#0ea5e9"
              />
            </div>
          </div>

          {/* Estado de validación */}
          <div
            className={`flex items-start gap-2 rounded-lg border p-3 text-sm ${
              summary.valid
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-rose-200 bg-rose-50 text-rose-800"
            }`}
          >
            <CheckCircleIcon
              className={`h-5 w-5 shrink-0 ${summary.valid ? "text-emerald-500" : "text-rose-500"}`}
            />
            <div>
              <div className="font-semibold">
                {summary.valid ? "Carga válida" : "Carga inválida"}
              </div>
              <div className="text-xs">{summary.validationMessage}</div>
            </div>
          </div>

          {/* Alertas */}
          <div className="space-y-2">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Alertas
            </div>
            {plan.alerts.length === 0 ? (
              <div className="text-xs text-slate-400">Sin alertas.</div>
            ) : (
              plan.alerts.map((alert, i) => (
                <div
                  key={i}
                  className={`flex items-start gap-2 rounded-lg border p-2.5 text-xs ${alertStyle[alert.level].wrap}`}
                >
                  {alertStyle[alert.level].icon}
                  <span>{alert.message}</span>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* ---- Panel central: Vista 3D ---- */}
        <Card
          title="Vista 3D del camión"
          icon={Boxes}
          titleClassName="text-base"
          className="flex flex-col"
        >
          {/* Leyenda por parada */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
            {plan.stops.map((stop) => (
              <div
                key={stop.id}
                className="flex items-center gap-1.5 text-xs text-slate-600"
              >
                <span
                  className="inline-block h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: stopColor(stop.sequence) }}
                />
                Parada {stop.sequence}
              </div>
            ))}
          </div>

          <div className="mt-3 flex-1">
            <TruckLoad3DViewer
              packages={plan.packages}
              stops={plan.stops}
              viewMode={viewMode}
              transparency={transparency}
            />
          </div>

          {/* Controles: selector + transparencia */}
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Ver</span>
              <div className="inline-flex rounded-lg border border-slate-200 p-0.5">
                <button
                  type="button"
                  onClick={() => setViewMode("packages")}
                  className={`rounded-md px-3 py-1 text-xs font-medium transition ${
                    viewMode === "packages"
                      ? "bg-blue-600 text-white"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  Por bultos
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("stops")}
                  className={`rounded-md px-3 py-1 text-xs font-medium transition ${
                    viewMode === "stops"
                      ? "bg-blue-600 text-white"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  Por paradas
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Transparencia</span>
              <input
                type="range"
                min={0}
                max={100}
                value={transparency}
                onChange={(e) => setTransparency(Number(e.target.value))}
                className="h-1.5 w-32 cursor-pointer accent-blue-600"
              />
              <span className="w-9 text-right text-xs font-medium text-slate-500">
                {transparency}%
              </span>
            </div>
          </div>
        </Card>

        {/* ---- Panel derecho: Bultos + secuencia de paradas ---- */}
        <div className="space-y-4">
          <Card
            title={`Lista de bultos (${plan.packages.length})`}
            titleClassName="text-base"
            headerAction={
              <button
                type="button"
                className="ml-auto flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:bg-slate-50"
                aria-label="Filtrar bultos"
              >
                <AdjustmentsHorizontalIcon className="h-4 w-4" />
              </button>
            }
          >
            <Input
              placeholder="Buscar bulto…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              icon={<MagnifyingGlassIcon className="h-4 w-4 text-slate-400" />}
            />

            <div className="-mx-1 mt-1 max-h-[320px] overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-white">
                  <tr className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    <th className="px-1 pb-2 text-left">Bulto</th>
                    <th className="px-1 pb-2 text-center">Parada</th>
                    <th className="px-1 pb-2 text-right">Peso</th>
                    <th className="px-1 pb-2 text-right">Vol.</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPackages.length === 0 ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-1 py-4 text-center text-xs text-slate-400"
                      >
                        Sin resultados.
                      </td>
                    </tr>
                  ) : (
                    filteredPackages.map((p) => (
                      <tr key={p.id} className="border-t border-slate-100">
                        <td className="px-1 py-2">
                          <span className="font-medium text-slate-700">
                            {p.id}
                          </span>
                        </td>
                        <td className="px-1 py-2 text-center">
                          <span
                            className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[11px] font-semibold text-white"
                            style={{
                              backgroundColor: stopColor(p.stopSequence),
                            }}
                          >
                            {p.stopSequence}
                          </span>
                        </td>
                        <td className="px-1 py-2 text-right text-slate-600">
                          {fmtWeight(p.weightKg)}
                        </td>
                        <td className="px-1 py-2 text-right text-slate-600">
                          {fmtVolume(p.volumeM3)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          <Card title="Secuencia de paradas" titleClassName="text-base">
            <ol className="space-y-2.5">
              {plan.stops.map((stop) => (
                <li key={stop.id} className="flex items-center gap-3">
                  <span
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white"
                    style={{ backgroundColor: stopColor(stop.sequence) }}
                  >
                    {stop.sequence}
                  </span>
                  <span className="flex-1 text-sm font-medium text-slate-700">
                    {stop.name}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-slate-400">
                    <MapPin className="h-3.5 w-3.5" />
                    {stop.eta}
                  </span>
                </li>
              ))}
            </ol>
          </Card>
        </div>
      </div>

      {/* ===== Panel inferior: ejes, centro de gravedad, reglas ===== */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Distribución de peso por eje */}
        <Card title="Distribución de peso por eje" titleClassName="text-base">
          <div className="space-y-3">
            {plan.axles.map((axle) => (
              <div key={axle.label} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">{axle.label}</span>
                  <span className="font-semibold text-slate-800">
                    {fmtWeight(axle.weightKg)}{" "}
                    <span className="text-xs font-normal text-slate-400">
                      {axle.percentage}%
                    </span>
                  </span>
                </div>
                <ProgressBar value={axle.percentage} color="#14b8a6" />
              </div>
            ))}
            <div className="flex items-center justify-between border-t border-slate-100 pt-2 text-sm">
              <span className="font-medium text-slate-500">Total</span>
              <span className="font-semibold text-slate-800">
                {fmtWeight(plan.axles.reduce((acc, a) => acc + a.weightKg, 0))}{" "}
                <span className="text-xs font-normal text-slate-400">100%</span>
              </span>
            </div>
          </div>
        </Card>

        {/* Centro de gravedad */}
        <Card title="Centro de gravedad" titleClassName="text-base">
          <div className="space-y-3">
            {plan.centerOfGravity.map((axis) => (
              <div
                key={axis.label}
                className="flex items-center justify-between text-sm"
              >
                <span className="text-slate-500">{axis.label}</span>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-800">
                    {fmtMeters(axis.valueM)}
                  </span>
                  <StatusBadge
                    status={axis.statusLabel}
                    variant={ruleBadgeVariant[axis.status]}
                    label={axis.statusLabel}
                    className="px-2.5 py-0.5 text-[11px]"
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Cumplimiento de reglas */}
        <Card title="Cumplimiento de reglas" titleClassName="text-base">
          <div className="space-y-2.5">
            {plan.rules.map((rule) => (
              <div
                key={rule.label}
                className="flex items-center justify-between text-sm"
              >
                <span className="flex items-center gap-2 text-slate-600">
                  <CheckCircleIcon
                    className={`h-4 w-4 ${
                      rule.status === "pass"
                        ? "text-emerald-500"
                        : rule.status === "warn"
                          ? "text-amber-500"
                          : "text-rose-500"
                    }`}
                  />
                  {rule.label}
                </span>
                <StatusBadge
                  status={rule.statusLabel}
                  variant={ruleBadgeVariant[rule.status]}
                  label={rule.statusLabel}
                  className="px-2.5 py-0.5 text-[11px]"
                />
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

export default RutasCargaTab;
