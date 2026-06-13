"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowPathIcon,
  ChevronDownIcon,
  ClipboardDocumentListIcon,
  PlusIcon,
  Squares2X2Icon,
  XCircleIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

import { ActionButton } from "@/components/ui";
import type { Action, PageHeaderProps } from "@/components/layout/page-header";
import { SimpleModal } from "@/components/ui/modal";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";
import {
  type ScenePosition,
  type SceneRack,
  type SceneStatus,
  WarehousePlanogramScene,
} from "./WarehousePlanogramScene";

const RACKS: SceneRack[] = [
  { id: 1, label: "R01", orientation: "V", levels: 5, positions: 46, heightM: 6.4, schemaType: "inbound" },
  { id: 2, label: "R02", orientation: "V", levels: 5, positions: 40, heightM: 6.4, schemaType: "slotting" },
  { id: 3, label: "R03", orientation: "V", levels: 5, positions: 40, heightM: 6.4, schemaType: "slotting" },
  { id: 4, label: "R04", orientation: "V", levels: 5, positions: 40, heightM: 6.4, schemaType: "slotting" },
  { id: 5, label: "R05", orientation: "V", levels: 5, positions: 40, heightM: 6.4, schemaType: "slotting" },
  { id: 6, label: "R06", orientation: "V", levels: 5, positions: 40, heightM: 6.4, schemaType: "holding" },
  { id: 7, label: "R07", orientation: "V", levels: 5, positions: 40, heightM: 6.4, schemaType: "outbound" },
  { id: 8, label: "R08", orientation: "V", levels: 5, positions: 44, heightM: 6.4, schemaType: "outbound" },
  { id: 9, label: "RH", orientation: "H", levels: 5, positions: 14, heightM: 6.4, schemaType: "consolidation" },
];

const BAY_WIDTH_LABEL = "1.5 m";
const BAY_WIDTH_METERS = 1.5;

type RackDraft = {
  label: string;
  orientation: string;
  levels: string;
  positionsPerLevel: string;
  heightM: string;
  assignment: string;
  schemaType: string;
};

const DEFAULT_RACK_DRAFT: RackDraft = {
  label: "R10",
  orientation: "vertical",
  levels: "5",
  positionsPerLevel: "40",
  heightM: "6,4",
  assignment: "storage",
  schemaType: "slotting",
};

const ORIENTATION_OPTIONS = [
  { value: "vertical", label: "Vertical (en profundidad)" },
  { value: "horizontal", label: "Horizontal (en ancho)" },
];

const ASSIGNMENT_OPTIONS = [
  { value: "storage", label: "storage" },
  { value: "picking", label: "picking" },
  { value: "reserve", label: "reserve" },
];

const SCHEMA_OPTIONS = [
  { value: "slotting", label: "slotting" },
  { value: "inbound", label: "inbound" },
  { value: "outbound", label: "outbound" },
  { value: "consolidation", label: "consolidation" },
];

const PLANOGRAM_LABEL = "Layout Bodega · CR01A";

const SECTOR_SUMMARY = [
  { label: "Recepción", count: 1, colorClassName: "bg-blue-500" },
  { label: "Almacenamiento", count: 4, colorClassName: "bg-violet-500" },
  { label: "Holding", count: 1, colorClassName: "bg-amber-500" },
  { label: "Despacho", count: 2, colorClassName: "bg-emerald-500" },
  { label: "Consolidación", count: 1, colorClassName: "bg-teal-500" },
];

const PLANOGRAM_STATUS: Record<
  SceneStatus,
  {
    label: string;
    dotClassName: string;
    visibleClassName: string;
    detailClassName: string;
    barClassName: string;
  }
> = {
  available: {
    label: "Disponible",
    dotClassName: "bg-emerald-500",
    visibleClassName: "border-emerald-200 bg-emerald-50 text-emerald-700",
    detailClassName: "bg-emerald-50 text-emerald-700",
    barClassName: "bg-emerald-500",
  },
  occupied: {
    label: "Ocupado",
    dotClassName: "bg-blue-500",
    visibleClassName: "border-gray-900 bg-white text-gray-900 shadow-sm",
    detailClassName: "bg-blue-50 text-blue-700",
    barClassName: "bg-blue-500",
  },
  reserved: {
    label: "En pedido",
    dotClassName: "bg-amber-500",
    visibleClassName: "border-amber-200 bg-amber-50 text-amber-700",
    detailClassName: "bg-amber-50 text-amber-700",
    barClassName: "bg-amber-500",
  },
  blocked: {
    label: "Bloqueada",
    dotClassName: "bg-slate-500",
    visibleClassName: "border-slate-200 bg-slate-50 text-slate-600",
    detailClassName: "bg-slate-100 text-slate-600",
    barClassName: "bg-slate-500",
  },
};

const STATUS_SUMMARY: Array<{
  status: SceneStatus;
  label: string;
  dotClassName: string;
  visibleClassName: string;
  detailClassName: string;
  barClassName: string;
}> = (["available", "occupied", "reserved", "blocked"] as SceneStatus[]).map((status) => ({
  status,
  ...PLANOGRAM_STATUS[status],
}));

type PositionProduct = {
  name: string;
  quantity: number;
};

const PRODUCT_POOL = [
  "Yeso Volcán 1kg",
  "Taladro Bosch GSB",
  "Saco Arena Fina",
  "Cemento Especial",
  "Pintura Blanca 1gl",
  "Tornillo zincado",
];

function getStatus(rackId: number, level: number, index: number): SceneStatus {
  const seed = rackId * 17 + level * 7 + index;
  if (seed % 19 === 0) return "blocked";
  if (seed % 11 === 0) return "reserved";
  if (seed % 3 === 0 || seed % 5 === 0) return "occupied";
  return "available";
}

function buildPositions(): ScenePosition[] {
  return RACKS.flatMap((rack) =>
    Array.from({ length: rack.levels }, (_, levelOffset) => {
      const level = levelOffset + 1;

      return Array.from({ length: rack.positions }, (_, indexOffset) => {
        const index = indexOffset + 1;
        const paddedIndex = String(index).padStart(3, "0");

        return {
          id: `${rack.label}-${level}-${paddedIndex}`,
          positionKey: `${rack.label}-N${level}-P${paddedIndex}`,
          status: getStatus(rack.id, level, index),
          rackId: rack.id,
          level,
          index,
          schemaType: rack.schemaType,
        } satisfies ScenePosition;
      });
    }).flat()
  );
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("es-CL").format(value);
}

function parsePositiveInteger(value: string): number {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
}

function parsePositiveDecimal(value: string): number {
  const parsed = Number.parseFloat(value.replace(",", "."));
  return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
}

function getRackLabel(position: ScenePosition): string {
  return RACKS.find((rack) => rack.id === position.rackId)?.label ?? `R${position.rackId}`;
}

function getPositionDetail(position: ScenePosition) {
  const seed = position.rackId * 23 + position.level * 11 + position.index;
  const capacity = 500;
  const occupied =
    position.status === "available"
      ? 0
      : position.status === "blocked"
        ? 0
        : 140 + ((seed * 37) % 260);
  const firstQuantity = occupied > 0 ? Math.max(1, Math.round(occupied * 0.49)) : 0;
  const secondQuantity = occupied > 0 ? Math.max(1, Math.round(occupied * 0.05)) : 0;
  const thirdQuantity = Math.max(0, occupied - firstQuantity - secondQuantity);
  const quantities = [firstQuantity, secondQuantity, thirdQuantity].filter((quantity) => quantity > 0);
  const products: PositionProduct[] = quantities.map((quantity, offset) => ({
    name: PRODUCT_POOL[(seed + offset) % PRODUCT_POOL.length],
    quantity,
  }));

  return {
    rackLabel: getRackLabel(position),
    positionLabel: String(position.index).padStart(3, "0"),
    capacity,
    occupied,
    occupiedPercent: Math.round((occupied / capacity) * 100),
    status: PLANOGRAM_STATUS[position.status],
    products,
  };
}

export default function PlanogramaView() {
  const router = useRouter();
  const { id } = useParams();
  const warehouseCode = String(id || "").trim();
  const positions = useMemo(() => buildPositions(), []);
  const sceneRef = useRef<WarehousePlanogramScene | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const selectedRef = useRef<ScenePosition | null>(null);
  const [ready, setReady] = useState(false);
  const [selected, setSelected] = useState<ScenePosition | null>(null);
  const [searchValue, setSearchValue] = useState("");
  const [hiddenStatuses, setHiddenStatuses] = useState<SceneStatus[]>([]);
  const [createRackOpen, setCreateRackOpen] = useState(false);
  const [rackDraft, setRackDraft] = useState<RackDraft>(DEFAULT_RACK_DRAFT);

  const statusCounts = useMemo(
    () =>
      positions.reduce<Record<SceneStatus, number>>(
        (acc, position) => {
          acc[position.status] += 1;
          return acc;
        },
        { available: 0, occupied: 0, reserved: 0, blocked: 0 }
      ),
    [positions]
  );
  const hiddenStatusSet = useMemo(() => new Set(hiddenStatuses), [hiddenStatuses]);
  const visiblePositions = useMemo(
    () => positions.filter((position) => !hiddenStatusSet.has(position.status)),
    [hiddenStatusSet, positions]
  );
  const visibleOccupied = useMemo(
    () => visiblePositions.filter((position) => position.status === "occupied").length,
    [visiblePositions]
  );
  const totalPositions = visiblePositions.length;
  const occupancy = totalPositions > 0 ? Math.round((visibleOccupied / totalPositions) * 100) : 0;
  const rackMetrics = useMemo(() => {
    const levels = parsePositiveInteger(rackDraft.levels);
    const positionsPerLevel = parsePositiveInteger(rackDraft.positionsPerLevel);
    const heightM = parsePositiveDecimal(rackDraft.heightM);

    return {
      totalSpaces: levels * positionsPerLevel,
      heightPerLevel: levels > 0 ? heightM / levels : 0,
      rackLength: positionsPerLevel * BAY_WIDTH_METERS,
    };
  }, [rackDraft.heightM, rackDraft.levels, rackDraft.positionsPerLevel]);
  const selectedDetail = useMemo(() => (selected ? getPositionDetail(selected) : null), [selected]);

  useEffect(() => {
    selectedRef.current = selected;
  }, [selected]);

  const resetView = useCallback(() => {
    sceneRef.current?.resetView();
  }, []);

  const updateRackDraft = useCallback((field: keyof RackDraft, value: string) => {
    setRackDraft((current) => ({ ...current, [field]: value }));
  }, []);

  const handleCreateRack = useCallback((event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setCreateRackOpen(false);
  }, []);

  const toggleStatus = useCallback((status: SceneStatus) => {
    setHiddenStatuses((current) =>
      current.includes(status)
        ? current.filter((item) => item !== status)
        : [...current, status]
    );
  }, []);

  const clearSearch = useCallback(() => {
    setSearchValue("");
    setSelected(null);
    sceneRef.current?.selectByPositionId(null);
  }, []);

  const clearSelectedPosition = useCallback(() => {
    setSelected(null);
    sceneRef.current?.selectByPositionId(null);
  }, []);

  const handleSearchChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;
      setSearchValue(value);

      const query = value.trim().toLowerCase();
      if (!query) {
        setSelected(null);
        sceneRef.current?.selectByPositionId(null);
        return;
      }

      const match = visiblePositions.find((position) => {
        const rack = RACKS.find((item) => item.id === position.rackId);
        return [position.id, position.positionKey, position.schemaType, rack?.label]
          .filter(Boolean)
          .some((item) => String(item).toLowerCase().includes(query));
      });

      setSelected(match ?? null);
      sceneRef.current?.selectByPositionId(match?.id ?? null);
    },
    [visiblePositions]
  );

  const headerActions: Action[] = useMemo(
    () => [
      {
        label: "Volver al listado",
        variant: "secondary",
        onClick: () => router.push("/almacen/almacenes"),
        icon: <XCircleIcon className="h-5 w-5" />,
      },
    ],
    [router]
  );

  usePageHeader(
    () =>
      ({
        title: (
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-blue-600">Almacenes</div>
            <div className="text-2xl font-semibold text-gray-900">#{warehouseCode || "-"}</div>
          </div>
        ),
        action: headerActions,
      } as PageHeaderProps),
    [headerActions, warehouseCode]
  );

  useEffect(() => {
    const currentSelected = selectedRef.current;
    if (!currentSelected || !hiddenStatusSet.has(currentSelected.status)) return;
    setSelected(null);
    sceneRef.current?.selectByPositionId(null);
  }, [hiddenStatusSet]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    setReady(false);
    const scene = new WarehousePlanogramScene(container, RACKS, visiblePositions, setSelected);
    sceneRef.current = scene;
    setReady(true);

    const currentSelected = selectedRef.current;
    if (currentSelected && visiblePositions.some((position) => position.id === currentSelected.id)) {
      scene.selectByPositionId(currentSelected.id);
    }

    const handleResize = () => scene.resize();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      scene.dispose();
      if (sceneRef.current === scene) {
        sceneRef.current = null;
      }
    };
  }, [visiblePositions]);

  return (
    <div className="bg-page-bg pb-6">
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {STATUS_SUMMARY.map((item) => {
            const hidden = hiddenStatusSet.has(item.status);

            return (
              <button
                key={item.status}
                type="button"
                aria-pressed={!hidden}
                onClick={() => toggleStatus(item.status)}
                className={`inline-flex h-8 items-center gap-2 rounded-md border px-3 text-sm font-semibold transition ${
                  hidden
                    ? "border-slate-200 bg-white text-slate-400 opacity-60 hover:border-slate-300 hover:opacity-100"
                    : item.visibleClassName
                }`}
              >
                <span className={`h-2.5 w-2.5 rounded-full ${item.dotClassName} ${hidden ? "opacity-40" : ""}`} />
                <span>{item.label}</span>
                <span className={hidden ? "text-slate-400" : "text-slate-500"}>{statusCounts[item.status]}</span>
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-2 lg:justify-end">
          <ActionButton variant="secondary" className="h-9 rounded-full px-4" onClick={resetView}>
            Reiniciar vista
          </ActionButton>
          <ActionButton
            variant="primary"
            className="h-9 rounded-full px-4"
            onClick={() => setCreateRackOpen(true)}
          >
            <PlusIcon className="h-4 w-4" />
            Crear rack
          </ActionButton>
        </div>
      </div>

      <div className="rounded-lg border border-[#d8dce6] bg-white shadow-sm">
        <div className="px-5 py-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-4">
                <Squares2X2Icon className="h-7 w-7 shrink-0 text-slate-500" />
                <h2 className="shrink-0 text-xl font-semibold text-gray-900">Planograma</h2>
                <div className="h-px flex-1 bg-slate-500" />
              </div>
            </div>

            <div className="flex w-full flex-col gap-3 lg:w-auto lg:flex-row lg:items-center lg:justify-end">
              <div className="flex w-full flex-col gap-2 sm:flex-row lg:w-[355px]">
                <input
                  type="search"
                  value={searchValue}
                  onChange={handleSearchChange}
                  placeholder="Buscar ubicación, rack o esquema"
                  className="h-9 min-w-0 flex-1 rounded-md border border-[#d8dce6] bg-white px-3 text-sm font-medium text-gray-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
                <button
                  type="button"
                  onClick={clearSearch}
                  className="h-9 rounded-md border border-[#d8dce6] bg-white px-4 text-sm font-semibold text-slate-500 transition hover:border-slate-300 hover:text-slate-700"
                >
                  Limpiar
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-[#e6eaf1] px-5 py-5">
          <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_440px]">
            <section className="min-w-0">
              <div className="mb-6 flex items-center gap-3">
                <ClipboardDocumentListIcon className="h-5 w-5 text-slate-700" />
                <h3 className="text-sm font-bold uppercase text-gray-950">DETALLE</h3>
                <div className="h-px flex-1 bg-[#d8dce6]" />
              </div>

              <div className="grid grid-cols-[180px_minmax(0,1fr)] items-center border-b border-[#e6eaf1] pb-5 text-sm">
                <span className="font-medium text-slate-500">Almacén</span>
                <span className="font-semibold text-gray-950">{PLANOGRAM_LABEL}</span>
              </div>

              <div className="relative mt-6 h-[calc(100vh-445px)] min-h-[430px] overflow-hidden rounded-lg border border-[#d8dce6] bg-white shadow-lg shadow-slate-200/60">
                <div ref={containerRef} className="h-full w-full" />

                {!ready ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-white/80 text-sm font-medium text-gray-600">
                    <ArrowPathIcon className="mr-2 h-4 w-4 animate-spin" /> Preparando planograma...
                  </div>
                ) : null}

                {selected && selectedDetail ? (
                  <div className="absolute bottom-3 left-3 right-3 top-3 rounded-xl border border-[#d8dce6] bg-white/95 p-5 shadow-lg shadow-slate-200/70 backdrop-blur md:left-auto md:w-[276px]">
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h4 className="text-xl font-bold tracking-wider text-slate-800">{selected.positionKey}</h4>
                        <p className="mt-1 text-xs font-medium text-slate-500">
                          Rack {selectedDetail.rackLabel} · Nivel {selected.level} · Posición {selectedDetail.positionLabel}
                        </p>
                      </div>
                      <button
                        type="button"
                        aria-label="Cerrar detalle de ubicación"
                        onClick={clearSelectedPosition}
                        className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[#d8dce6] bg-white text-slate-400 transition hover:border-slate-300 hover:text-slate-700"
                      >
                        <XMarkIcon className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="mb-3 flex flex-wrap items-center gap-2">
                      <PlanogramStatusBadge status={selected.status} />
                    </div>

                    <div className="mb-4 flex flex-wrap items-center gap-2">
                      <PlanogramTag>{selected.schemaType}</PlanogramTag>
                      <PlanogramTag>storage</PlanogramTag>
                    </div>

                    <div className="mb-4 space-y-1.5 text-sm">
                      <PlanogramMetricRow label="Capacidad" value={`${selectedDetail.capacity} u`} />
                      <PlanogramMetricRow label="Ocupación" value={`${selectedDetail.occupied} u`} />
                      <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className={`h-full rounded-full ${selectedDetail.status.barClassName}`}
                          style={{ width: `${selectedDetail.occupiedPercent}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <h5 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">PRODUCTOS</h5>
                      {selectedDetail.products.length > 0 ? (
                        <div className="space-y-2">
                          {selectedDetail.products.map((product) => (
                            <PlanogramProductRow key={`${selected.id}-${product.name}`} product={product} />
                          ))}
                        </div>
                      ) : (
                        <div className="rounded-lg border border-dashed border-[#d8dce6] bg-slate-50 px-3 py-3 text-sm font-medium text-slate-500">
                          Sin productos asignados
                        </div>
                      )}
                    </div>
                  </div>
                ) : null}

                <div className="absolute bottom-3 left-3 flex flex-wrap items-center gap-2 rounded-full border border-gray-200 bg-white/90 px-3 py-2 text-xs text-gray-600 shadow-sm">
                  <span>
                    <b>Arrastrar</b> rotar
                  </span>
                  <span>
                    <b>Scroll</b> zoom
                  </span>
                  <span>
                    <b>Clic</b> ubicación
                  </span>
                </div>
              </div>
            </section>

            <aside className="min-w-0">
              <div className="mb-6 flex items-center gap-3">
                <ClipboardDocumentListIcon className="h-5 w-5 text-slate-700" />
                <h3 className="text-sm font-bold uppercase text-gray-950">RESUMEN</h3>
                <div className="h-px flex-1 bg-[#d8dce6]" />
              </div>

              <div className="divide-y divide-[#e6eaf1] text-sm">
                <div className="grid grid-cols-[1fr_190px] py-4">
                  <span className="font-medium text-slate-500">Racks</span>
                  <span className="font-semibold text-gray-950">{RACKS.length}</span>
                </div>
                <div className="grid grid-cols-[1fr_190px] py-4">
                  <span className="font-medium text-slate-500">Ubicaciones</span>
                  <span className="font-semibold text-gray-950">{formatNumber(totalPositions)}</span>
                </div>
                <div className="grid grid-cols-[1fr_190px] py-4">
                  <span className="font-medium text-slate-500">Ancho de bahía</span>
                  <span className="font-semibold text-gray-950">{BAY_WIDTH_LABEL}</span>
                </div>
                <div className="grid grid-cols-[1fr_190px] py-4">
                  <span className="font-medium text-slate-500">Esquema</span>
                  <span className="font-semibold text-gray-950">rack · nivel · posición</span>
                </div>
                <div className="grid grid-cols-[1fr_190px] py-4">
                  <span className="font-medium text-slate-500">Estado</span>
                  <span className="font-semibold text-gray-950">Activo</span>
                </div>
              </div>

              <div className="mt-1">
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="font-medium text-slate-500">Ocupación</span>
                  <span className="font-semibold text-gray-950">{occupancy}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-blue-600" style={{ width: `${occupancy}%` }} />
                </div>
              </div>

              <div className="mt-8">
                <div className="mb-4 flex items-center gap-3">
                  <h3 className="text-sm font-bold uppercase text-gray-950">SECTORES</h3>
                  <div className="h-px flex-1 bg-[#d8dce6]" />
                </div>

                <div className="space-y-4 text-sm">
                  {SECTOR_SUMMARY.map((sector) => (
                    <SectorSummaryRow key={sector.label} sector={sector} />
                  ))}
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>

      <SimpleModal
        open={createRackOpen}
        onClose={() => setCreateRackOpen(false)}
        title="CREAR RACK"
        maxWidth="sm:max-w-2xl"
        bodyClassName="px-8 py-6"
      >
        <form onSubmit={handleCreateRack} className="space-y-4">
          <RackTextField label="Etiqueta" value={rackDraft.label} onChange={(value) => updateRackDraft("label", value)} />

          <RackSelectField
            label="Orientación"
            value={rackDraft.orientation}
            options={ORIENTATION_OPTIONS}
            onChange={(value) => updateRackDraft("orientation", value)}
          />

          <div className="grid gap-4 md:grid-cols-2">
            <RackTextField
              label="Niveles (altura)"
              value={rackDraft.levels}
              inputMode="numeric"
              onChange={(value) => updateRackDraft("levels", value)}
            />
            <RackTextField
              label="Espacios / nivel"
              value={rackDraft.positionsPerLevel}
              inputMode="numeric"
              onChange={(value) => updateRackDraft("positionsPerLevel", value)}
            />
            <RackTextField
              label="Altura física (m)"
              value={rackDraft.heightM}
              inputMode="decimal"
              onChange={(value) => updateRackDraft("heightM", value)}
            />
            <RackSelectField
              label="Asignación"
              value={rackDraft.assignment}
              options={ASSIGNMENT_OPTIONS}
              onChange={(value) => updateRackDraft("assignment", value)}
            />
          </div>

          <RackSelectField
            label="Schema (zona)"
            value={rackDraft.schemaType}
            options={SCHEMA_OPTIONS}
            onChange={(value) => updateRackDraft("schemaType", value)}
          />

          <div className="rounded-lg border border-[#d8dce6] bg-slate-50 px-4 py-3 text-sm">
            <RackMetricRow label="Total de espacios" value={formatNumber(rackMetrics.totalSpaces)} />
            <RackMetricRow label="Altura por nivel" value={`${rackMetrics.heightPerLevel.toFixed(2)} m`} />
            <RackMetricRow label="Largo del rack" value={`${rackMetrics.rackLength.toFixed(1)} m`} />
          </div>

          <div className="-mx-8 -mb-6 mt-6 flex justify-end gap-3 border-t border-[#e6eaf1] bg-slate-50 px-6 py-4">
            <ActionButton
              type="button"
              variant="secondary"
              className="min-w-[122px] rounded-full"
              onClick={() => setCreateRackOpen(false)}
            >
              Cancelar
            </ActionButton>
            <ActionButton
              type="submit"
              variant="primary"
              className="min-w-[122px] rounded-full"
              disabled={!rackDraft.label.trim() || rackMetrics.totalSpaces <= 0}
            >
              Crear rack
            </ActionButton>
          </div>
        </form>
      </SimpleModal>
    </div>
  );
}

function PlanogramStatusBadge({ status }: { status: SceneStatus }) {
  const meta = PLANOGRAM_STATUS[status];

  return (
    <span className={`inline-flex h-7 items-center gap-2 rounded-full px-3 text-xs font-bold ${meta.detailClassName}`}>
      <span className={`h-2 w-2 rounded-full ${meta.dotClassName}`} />
      {meta.label}
    </span>
  );
}

function PlanogramTag({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500">
      {children}
    </span>
  );
}

function PlanogramMetricRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="font-medium text-slate-500">{label}</span>
      <span className="font-bold text-slate-700">{value}</span>
    </div>
  );
}

function PlanogramProductRow({ product }: { product: PositionProduct }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-[#d8dce6] bg-slate-50 px-3 py-2 text-sm">
      <span className="min-w-0 truncate font-medium text-slate-700">{product.name}</span>
      <span className="shrink-0 font-bold text-blue-600">{product.quantity} u</span>
    </div>
  );
}

function SectorSummaryRow({
  sector,
}: {
  sector: { label: string; count: number; colorClassName: string };
}) {
  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <div className="flex min-w-0 items-center gap-3">
        <span className={`h-3 w-3 shrink-0 rounded ${sector.colorClassName}`} />
        <span className="truncate font-medium text-slate-700">{sector.label}</span>
      </div>
      <span className="font-semibold text-slate-500">{sector.count}</span>
    </div>
  );
}

function RackTextField({
  label,
  value,
  inputMode,
  onChange,
}: {
  label: string;
  value: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-500">{label}</span>
      <input
        value={value}
        inputMode={inputMode}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 h-9 w-full border-0 border-b border-[#d8dce6] bg-transparent px-0 text-sm font-semibold text-slate-800 outline-none transition focus:border-blue-500 focus:ring-0"
      />
    </label>
  );
}

function RackSelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-500">{label}</span>
      <span className="relative mt-1 block">
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-9 w-full appearance-none border-0 border-b border-[#d8dce6] bg-transparent px-0 pr-8 text-sm font-semibold text-slate-800 outline-none transition focus:border-blue-500 focus:ring-0"
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDownIcon className="pointer-events-none absolute right-0 top-1/2 h-4 w-4 -translate-y-1/2 text-blue-600" />
      </span>
    </label>
  );
}

function RackMetricRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 py-0.5">
      <span className="font-medium text-slate-500">{label}</span>
      <span className="font-bold text-blue-600">{value}</span>
    </div>
  );
}
