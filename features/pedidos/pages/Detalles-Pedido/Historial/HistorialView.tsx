// views\PedidosView\Detalles-Pedido\HistoryView.tsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Action } from "@/components/layout/page-header";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";
import {
  CheckCircleIcon,
  ClipboardDocumentCheckIcon,
  ClockIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";
import SaveOutlined from "@mui/icons-material/SaveOutlined";
import { ArrowLeftCircleIcon } from "lucide-react";
import { fetchIssueHistorial } from "@/app/fetchWithAuth/api-pedidos/pedidos";
import { useAuth } from "@/app/context/auth/AuthContext";
import { getStatusVariant } from "@/features/pedidos/utils/pedido-status";
import type { PedidoStatus } from "@/features/pedidos/types/lista-pedidos";
import { parseDayFirstDateTime } from "@/lib/format/date";
import { extractOrderId } from "@/utils/pedido";
import { SimpleModal } from "@/components/ui/modal";

/* ========= Tipos ========= */
type ApiHistoryItem = {
  status: string;
  fecha: string;      // "DD/MM/YYYY HH:mm:ss"
  usuario: string | null;
  description?: string | null;
  note?: string | null;
};

type IssueSummaryResponse = {
  historial?: ApiHistoryItem[];
};

type HistoryItem = {
  status: string;
  dateLabel: string;  // texto que mostramos
  when: Date;         // fecha parseada para ordenar
  description?: string | null;
  note?: string | null;
  isCompleted: boolean;
  isCurrent: boolean;
};

type Point = {
  x: number;
  y: number;
};

type IndexedPoint = Point & {
  index: number;
};

/* ========= Utils ========= */
function formatCLDateTime(d: Date): string {
  // Mantiene formato local “DD/MM/YYYY HH:mm:ss”
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

/* ========= Data hook ========= */
function useIssueHistory(orderParam?: string) {
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [currentStatus, setCurrentStatus] = useState<string | null>(null);
  const [isLoading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuth();

  // llamada a la api 
  useEffect(() => {
    const id = extractOrderId(orderParam);
    if (!id) return;

    // Previene fetch antes de que AuthContext hidrate el token
    if (!token) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        const json = await fetchIssueHistorial<IssueSummaryResponse>(token, id);

        const sorted = (json.historial ?? [])
          .map((h) => {
            const when = parseDayFirstDateTime(h.fecha);
            return {
              status: h.status,
              dateLabel: h.fecha || formatCLDateTime(when),
              when,
              description: h.description ?? null,
              note: h.note ?? null,
            };
          })
          .sort((a, b) => a.when.getTime() - b.when.getTime());

        // último = estado actual
        const lastIndex = sorted.length - 1;
        const mapped: HistoryItem[] = sorted.map((x, idx) => ({
          status: x.status,
          dateLabel: x.dateLabel,
          when: x.when,
          description: x.description,
          note: x.note,
          isCompleted: idx < lastIndex, // todos los anteriores completados
          isCurrent: idx === lastIndex, // último es el actual
        }));

        // tras obtener json: calcular estado actual (más reciente). Si empatan hora, gana el que esté más abajo.
        let latestStatusLocal: string | null = null;
        const hist = json.historial ?? [];
        if (hist.length) {
          let bestIdx = 0;
          let bestTime = parseDayFirstDateTime(hist[0]?.fecha).getTime();
          for (let i = 1; i < hist.length; i++) {
            const t = parseDayFirstDateTime(hist[i]?.fecha).getTime();
            if (t > bestTime || (t === bestTime && i > bestIdx)) {
              bestIdx = i;
              bestTime = t;
            }
          }
          latestStatusLocal = hist[bestIdx]?.status ?? null;
        }

        if (!cancelled) {
          setItems(mapped);
          setCurrentStatus(latestStatusLocal);
        }

      } catch (e: any) {
        if (!cancelled) setError(String(e?.message || e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [orderParam]);

  return { items, currentStatus, isLoading, error };
}

/* ========= UI ========= */
export function HistoryView() {
  const router = useRouter();
  const { id: pedidoId } = useParams<{ id: string }>();

  const { items, currentStatus, isLoading, error } = useIssueHistory(pedidoId);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const selectedItem = selectedIndex !== null ? items[selectedIndex] : null;
  const nodesPerRow = 5;
  const rowHeight = 160;
  const timelineRef = useRef<HTMLDivElement | null>(null);
  const [timelineWidth, setTimelineWidth] = useState(0);
  const [nodeCenters, setNodeCenters] = useState<IndexedPoint[]>([]);

  const timelineRows = useMemo(() => {
    const rows: Array<Array<{ item: HistoryItem; index: number }>> = [];
    for (let i = 0; i < items.length; i += nodesPerRow) {
      rows.push(items.slice(i, i + nodesPerRow).map((item, offset) => ({ item, index: i + offset })));
    }
    return rows;
  }, [items]);

  useEffect(() => {
    const element = timelineRef.current;
    if (!element) return;

    const update = () => {
      setTimelineWidth(element.clientWidth);

      const containerRect = element.getBoundingClientRect();
      const centers: IndexedPoint[] = [];

      for (let index = 0; index < items.length; index++) {
        const node = element.querySelector<HTMLElement>(`[data-history-node="${index}"]`);
        if (!node) continue;

        const rect = node.getBoundingClientRect();
        centers.push({
          index,
          x: rect.left - containerRect.left + rect.width / 2,
          y: rect.top - containerRect.top + rect.height / 2,
        });
      }

      setNodeCenters(centers);
    };

    update();

    const observer = new ResizeObserver(update);
    observer.observe(element);

    return () => observer.disconnect();
  }, [items.length]);

  const snakeRows = useMemo(() => {
    const rows = timelineRows.length;
    const rowPoints: IndexedPoint[][] = [];

    for (let rowIndex = 0; rowIndex < rows; rowIndex++) {
      const rowTop = rowIndex * rowHeight;
      const rowBottom = rowTop + rowHeight;
      const pts = nodeCenters
        .filter((point) => point.y >= rowTop && point.y < rowBottom)
        .sort((a, b) => a.x - b.x);

      if (rowIndex % 2 === 1) {
        pts.reverse();
      }

      if (pts.length) {
        rowPoints.push(pts);
      }
    }

    return rowPoints;
  }, [nodeCenters, timelineRows.length]);

  const buildSnakePath = (rows: IndexedPoint[][], stopAtItemIndex?: number) => {
    if (!rows.length || timelineWidth <= 0) return "";

    const toNum = (n: number) => Number(n.toFixed(2));
    let d = `M ${toNum(rows[0][0].x)} ${toNum(rows[0][0].y)}`;

    for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
      const currentRow = rows[rowIndex];
      const rowStart = currentRow[0];
      const rowEnd = currentRow[currentRow.length - 1];
      const stopInCurrentRow =
        stopAtItemIndex !== undefined
          ? currentRow.find((point) => point.index === stopAtItemIndex)
          : null;

      if (stopInCurrentRow) {
        d += ` L ${toNum(stopInCurrentRow.x)} ${toNum(stopInCurrentRow.y)}`;
        return d;
      }

      d += ` L ${toNum(rowEnd.x)} ${toNum(rowEnd.y)}`;

      const nextRow = rows[rowIndex + 1];
      if (!nextRow) continue;

      const nextStart = nextRow[0];
      const isRightSideTurn = rowEnd.x >= rowStart.x;
      const sideOffset = 54;
      const minX = 14;
      const maxX = Math.max(minX, timelineWidth - 14);
      const outerX = isRightSideTurn
        ? Math.min(maxX, Math.max(rowEnd.x, nextStart.x) + sideOffset)
        : Math.max(minX, Math.min(rowEnd.x, nextStart.x) - sideOffset);
      const midY = (rowEnd.y + nextStart.y) / 2;

      d += ` Q ${toNum(outerX)} ${toNum(rowEnd.y)} ${toNum(outerX)} ${toNum(midY)}`;
      d += ` Q ${toNum(outerX)} ${toNum(nextStart.y)} ${toNum(nextStart.x)} ${toNum(nextStart.y)}`;
    }

    return d;
  };

  const snakePath = useMemo(() => {
    return buildSnakePath(snakeRows);
  }, [snakeRows, timelineWidth]);

  const currentItemIndex = useMemo(() => {
    for (let i = items.length - 1; i >= 0; i--) {
      if (items[i].isCurrent) return i;
    }
    return -1;
  }, [items]);

  const activeIndex = selectedIndex ?? currentItemIndex;
  const activeSnakePath = useMemo(() => {
    if (activeIndex < 0) return "";
    return buildSnakePath(snakeRows, activeIndex);
  }, [activeIndex, snakeRows, timelineWidth]);

  const timelineHeight = Math.max(timelineRows.length * rowHeight, rowHeight);

  const headerActions: Action[] = useMemo(
    () => [
      {
        label: "Aplicar",
        variant: "success",
        onClick: () => { },
        icon: <CheckCircleIcon className="h-5 w-5" />,
      },
      {
        label: "Guardar",
        variant: "success",
        onClick: () => { },
        icon: <SaveOutlined className="h-5 w-5" />,
      },
      {
        label: "Volver al listado",
        variant: "secondary",
        onClick: () => router.push("/pedidos/listado-pedidos"),
        icon: <ArrowLeftCircleIcon className="h-5 w-5" />,
      },
    ],
    [router]
  );

  const statusVariant = useMemo(() => {
    const raw = currentStatus || "Pendiente";
    return getStatusVariant(raw as PedidoStatus);
  }, [currentStatus]);

  usePageHeader(
    () => ({
      title: (
        <div>
          <div className="text-xs font-semibold uppercase text-blue-600 tracking-wider">PEDIDOS</div>
          <div className="text-2xl font-semibold text-gray-900">
            {`PEDIDO #${pedidoId ?? ""}`}
          </div>
        </div>
      ),
      action: headerActions,
      status: { text: currentStatus ?? "Pendiente", variant: statusVariant },
    }),
    [pedidoId, headerActions, currentStatus, statusVariant]
  );

  if (isLoading) {
    return (
      <div className="overflow-x-auto border rounded-md bg-white">
        <table className="min-w-full text-sm">
          <tbody>
            <tr>
              <td colSpan={8} className="px-4 py-6 text-center text-gray-500">
                <ArrowPathIcon className="h-5 w-5 inline animate-spin mr-2" />
                Cargando…
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  }


  if (error) {
    return <div className="bg-red-50 p-4 rounded-lg text-red-600 text-center">{error}</div>;
  }

  if (!items.length) {
    return <div className="rounded-xl border bg-white p-4 text-sm text-gray-500">Sin historial para este pedido.</div>;
  }

  return (
    <div className="relative pb-10">
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <div className="pb-4">
          <div ref={timelineRef} className="relative" style={{ height: timelineHeight }}>
            <svg className="pointer-events-none absolute inset-0 z-0" width="100%" height={timelineHeight} viewBox={`0 0 ${Math.max(timelineWidth, 1)} ${timelineHeight}`} fill="none">
              <defs>
                <linearGradient id="historySnakeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#22c55e" />
                  <stop offset="100%" stopColor="#3b82f6" />
                </linearGradient>
              </defs>

              {snakePath && (
                <>
                  <path
                    d={snakePath}
                    className="stroke-gray-300"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  {activeSnakePath && (
                    <path
                      d={activeSnakePath}
                      stroke="url(#historySnakeGradient)"
                      strokeWidth="8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  )}
                </>
              )}
            </svg>

            <div className="relative z-10" style={{ gridTemplateRows: `repeat(${timelineRows.length}, ${rowHeight}px)` }}>
              {timelineRows.map((row, rowIndex) => {
                const isReverseRow = rowIndex % 2 === 1;
                const displayRow = isReverseRow ? [...row].reverse() : row;
                const emptySlots = Math.max(nodesPerRow - displayRow.length, 0);
                const leftPad = isReverseRow ? emptySlots : 0;
                const rightPad = isReverseRow ? 0 : emptySlots;

                return (
                  <div key={`row-${rowIndex}`} className="grid h-[160px] grid-cols-1 gap-4 px-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5">
                    {Array.from({ length: leftPad }).map((_, idx) => (
                      <div key={`pad-left-${rowIndex}-${idx}`} className="hidden xl:block" />
                    ))}
                    {displayRow.map(({ item, index }) => {
                      const isSelected = index === selectedIndex;
                      const isReached = selectedIndex !== null ? index <= selectedIndex : item.isCompleted || item.isCurrent;
                      const nodeClasses = item.isCurrent
                        ? "bg-blue-100 text-blue-700"
                        : item.isCompleted
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-500";
                      const LineIcon = item.isCurrent ? ClockIcon : item.isCompleted ? CheckCircleIcon : ClipboardDocumentCheckIcon;

                      return (
                        <button
                          key={`${item.status}-${index}`}
                          type="button"
                          onClick={() => setSelectedIndex((prev) => (prev === index ? null : index))}
                          className="group flex flex-col items-center rounded-xl px-2 pt-2 text-center transition-transform hover:-translate-y-0.5"
                        >
                          <div
                            data-history-node={index}
                            className={`z-10 flex h-12 w-12 items-center justify-center rounded-full border-2 bg-white transition-all ${isSelected
                              ? "border-blue-500 ring-4 ring-blue-100"
                              : isReached
                                ? "border-green-400"
                                : "border-gray-300"
                              }`}
                          >
                            <div className={`flex h-9 w-9 items-center justify-center rounded-full ${nodeClasses}`}>
                              <LineIcon className="h-5 w-5" />
                            </div>
                          </div>

                          <div className="mt-2 rounded-md bg-white/90 px-2 py-1">
                            <div className={`text-sm font-semibold leading-tight ${isSelected ? "text-blue-700" : "text-gray-900"}`}>
                              {item.status}
                            </div>
                            <div className="mt-1 inline-flex rounded-full bg-gray-100 px-2 py-0.5 text-[11px] text-gray-600">{item.dateLabel}</div>
                          </div>
                        </button>
                      );
                    })}
                    {Array.from({ length: rightPad }).map((_, idx) => (
                      <div key={`pad-right-${rowIndex}-${idx}`} className="hidden xl:block" />
                    ))}
                  </div>
                );
              })}
            </div>

          </div>
        </div>

        <SimpleModal
          open={!!selectedItem}
          title={selectedItem?.status || "Detalle"}
          onClose={() => setSelectedIndex(null)}
          maxWidth="sm:max-w-lg"
        >
          {selectedItem && (
            <div className="grid grid-cols-1 gap-3">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <div className="text-xs uppercase tracking-wide text-slate-500">Descripcion</div>
                <div className="mt-1 text-sm font-medium text-slate-900">{selectedItem.description || "Sin descripcion"}</div>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <div className="text-xs uppercase tracking-wide text-slate-500">Nota</div>
                <div className="mt-1 text-sm font-medium text-slate-900">{selectedItem.note || "Sin nota"}</div>
              </div>
            </div>
          )}
        </SimpleModal>
      </div>
    </div>
  );
}

export default HistoryView;

