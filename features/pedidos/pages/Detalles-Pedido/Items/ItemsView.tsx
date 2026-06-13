"use client";

import React, { useMemo, useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";
import { Action } from "@/components/layout/page-header";
import { ShoppingCart, EyeOff, Barcode, ChevronDown, ChevronRight, Tag, ClipboardList, Home, Calendar, ArrowLeftCircleIcon } from "lucide-react";
import SaveOutlined from "@mui/icons-material/SaveOutlined";
import { fetchIssueItems } from "@/app/fetchWithAuth/api-pedidos/pedidos";
import { ArrowPathIcon, CheckCircleIcon } from "@heroicons/react/24/outline";
import { useAuth } from "@/app/context/auth/AuthContext";
import { getStatusVariant } from "@/features/pedidos/utils/pedido-status";
import { parseDayFirstDateTime } from "@/lib/format/date";
import { formatCurrency } from "@/lib/format/money";
import { extractOrderId as extractOrderIdShared } from "@/utils/pedido";
import { useFetchWithAuthQA } from "@/lib/http/client";
import { withAuthPlatformHeaders } from "@/features/almacenes/services/auth-headers";
import { URL_BASE_QA, WAREHOUSE_API } from "@/lib/http/endpoints";
import { RoundsExpandableList, type PedidoRound } from "@/features/pedidos/components/detalles-pedido/RoundsExpandableList";
import { StatusBadge } from "@/components/ui/badge/status";
import { resolveStatus } from "@/components/ui/badge/status-registry";
import { CopyableText } from "@/components/ui/copyable-text";

/* ===== Config básica ===== */
const GRID_COLS = "grid-cols-[minmax(280px,1fr)_110px_110px_120px]"; // Producto | Unit | Cant | Total

/* ===== Tipos UI ===== */
type UiItem = {
  id: string;
  name: string;
  image?: string;
  sku?: string;
  barcode?: string;
  unitPrice: number;
  qty: number;
  total: number;
  criteria?: string;
  storeCode?: string;
  isSubstitute?: boolean;
};

type UiGroup = {
  key: string;
  title: string;
  meta?: {
    code?: string;
    status?: string;
    zone?: string;
    date?: string;
    assigned?: string;
    cantidadGrupo?: number;
    totalGrupo?: number;
  };
  items: UiItem[];
};

type UiRound = PedidoRound;

type UiPickingResult = {
  containerId: string;
  itemCount: number;
  inventory?: string | null;
  position?: string | null;
  status?: string;
  products?: Array<{
    id: string;
    name: string;
    image?: string;
    sku?: string;
    requestedQty: number;
    pickedQty: number;
    missingQty: number;
    status?: string;
  }>;
};

/* ===== Tipos de API ===== */
type IssueSummaryResponse = {
  resumen: {
    cliente: {
      nombre: string;
      tipoDocumento: string | null;
      documento: string | null;
      telefono: string | null;
      email: string | null;
      customerType: string | null;
      fechaCreacion: string;
      clusters: any[];
    };
    picking: {
      sesiones: number;
      contenedores: number;
      productosPickeados: number;
      itemsPickeados: number;
      faltantes: number;
      tiempoPickingMin: number | null;
      almacenOTienda: string | null;
    };
    totales: {
      subtotal: number | null;
      total: number | null;
    };
    originalsPostPicking: {
      itemsPickeados: number;
      subtotal: number | null;
      total: number | null;
    };
  };
  items: {
    originales?: {
      grupos: Array<{
        categoria: string;
        categoriaCodigo?: string;
        totalGrupo?: number;
        cantidadGrupo?: number;
        items: Array<{
          producto: string;
          itemcode?: string;
          cantidad: number;
          precioUnitario?: number | null;
          totalItem?: number | null;
          imagen?: string | null;
          eans?: string | null;
        }>;
      }>;
    };
    totalItems?: number;
    resultadosPicking?: Array<{
      idContenedor: string;
      cantItems: number;
      inventario: string | null;
      posicion: string | null;
      productos?: Array<{
        shipmentItemId?: number;
        orderItemPickingId?: number;
        sku?: string;
        nombre?: string;
        imagen?: string;
        requestedQty?: number;
        pickedQty?: number;
        missingQty?: number;
        estado?: string;
      }>;
    }>;
    rondas?: Array<{
      id: string;
      almacen?: string | null;
      nombreAlmacen?: string | null;
      fechaRonda: string;
      asignar: string | null;
      estado: string;
    }>;
  };
  facturacion?: any;
  historial?: any;
  datosEntrega?: any;
  datosPedido?: any;
};

type RoundsByOrderResponse = {
  message: string;
  data?: {
    orderId: string;
    pedidos?: Array<{
      shipmentCode: string;
      rondas?: Array<{
        sessionId: string;
        displayId?: string;
        almacen?: string | null;
        fechaInicio?: string;
        asignacion?: {
          estado?: string;
          pickerNombre?: string | null;
        };
        estado?: string;
        resultados?: Array<{
          sessionItemId: string;
          imagen?: string;
          nombreProducto?: string;
          ean?: string;
          sku?: string;
          cantidadSolicitada?: number;
          cantidadPickeada?: number;
          faltante?: number;
          estado?: string;
        }>;
      }>;
    }>;
  };
};

type WarehouseApiRow = {
  name?: string;
  referenceId?: string;
};

const getErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === "string" && error.trim()) return error;
  return fallback;
};

// Placeholder de imagen (SVG gris)
const DEFAULT_PRODUCT_IMG =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='64' height='64'>
      <rect width='100%' height='100%' fill='#f1f5f9'/>
      <g fill='#94a3b8'>
        <rect x='10' y='38' width='44' height='8' rx='2'/>
        <circle cx='20' cy='24' r='8'/>
      </g>
    </svg>`
  );

const fmtDate = (iso: string | null) => {
  if (!iso) return "-";
  const d = new Date(iso);
  return d.toLocaleDateString("es-CL", { year: "numeric", month: "2-digit", day: "2-digit" });
};

const fmtTime = (iso: string | null) => {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" });
};

const toStatusEs = (status?: string | null) => {
  const normalized = String(status || "").trim().toLowerCase();
  if (normalized === "item_picked" || normalized === "picked") return "Pickeado";
  if (normalized === "item_missing" || normalized === "missing") return "Faltante";
  if (normalized === "finished") return "Finalizada";
  if (normalized === "started") return "Iniciada";
  if (normalized === "pending") return "Pendiente";
  if (normalized === "created") return "Creada";
  if (normalized === "assigned") return "Asignada";
  if (normalized === "active") return "Activo";
  if (normalized === "inactive") return "Inactivo";
  if (normalized === "canceled") return "Cancelada";
  if (normalized === "rejected") return "Rechazada";
  return status && String(status).trim() ? String(status).trim() : "-";
};

/* ===== Fetch de issue-summary ===== */
function useIssueItems(orderParam?: string) {
  const [data, setData] = useState<IssueSummaryResponse | null>(null);
  const [isLoading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuth();

  // llamada a la api 
  useEffect(() => {
    const id = extractOrderIdShared(orderParam);
    if (!id) return;

    // Previene fetch antes de que AuthContext hidrate el token
    if (!token) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchIssueItems<IssueSummaryResponse>(token, id)
      .then((json) => {
        if (!cancelled) setData(json);
      })
      .catch((error: unknown) => {
        if (!cancelled) setError(getErrorMessage(error, "Error al cargar items"));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [orderParam, token]);

  return { data, isLoading, error };
}

function useOrderRounds(orderParam?: string) {
  const { fetchWithAuthQA, token } = useFetchWithAuthQA();
  const [rounds, setRounds] = useState<UiRound[]>([]);

  const withTimeout = async <T,>(promise: Promise<T>, ms: number, label: string): Promise<T> => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => reject(new Error(`Timeout en ${label} (${ms}ms)`)), ms);
    });

    try {
      return await Promise.race([promise, timeoutPromise]);
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
    }
  };

  useEffect(() => {
    const orderId = extractOrderIdShared(orderParam);
    if (!orderId || !token) return;

    let cancelled = false;

    const loadRounds = async () => {
      try {
        const absoluteUrl = `${URL_BASE_QA}/picking-service/sessions/orders/${orderId}/rounds`;
        const relativeUrl = `picking-service/sessions/orders/${orderId}/rounds`;
        const warehouseUrl = `${WAREHOUSE_API}?sortBy=referenceId&sortDirection=asc`;
        let json: RoundsByOrderResponse;

        let warehouses: WarehouseApiRow[] = [];
        try {
          warehouses = await fetch(warehouseUrl, {
            method: "GET",
            headers: withAuthPlatformHeaders({
              "x-janis-page": "1",
              "x-janis-page-size": "20",
            }),
            cache: "no-store",
          }).then(async (response) => {
            if (!response.ok) {
              const body = await response.text().catch(() => "");
              throw new Error(`Error cargando bodegas: HTTP ${response.status}${body ? ` - ${body}` : ""}`);
            }
            return response.json() as Promise<WarehouseApiRow[]>;
          });
        } catch (warehouseError) {
          console.warn("No se pudo cargar warehouseUrl. Se continua sin nombre de bodega:", warehouseError);
        }

        const warehouseByReferenceId = new Map<string, string>();
        (warehouses || []).forEach((warehouse) => {
          const ref = String(warehouse.referenceId || "").trim();
          const name = String(warehouse.name || "").trim();
          if (ref) warehouseByReferenceId.set(ref, name || ref);
        });

        try {
          json = await withTimeout(
            fetchWithAuthQA<RoundsByOrderResponse>(relativeUrl, { method: "GET" }),
            8000,
            "rounds relativo"
          );
        } catch (relativeError: unknown) {
          const message = getErrorMessage(relativeError, "").toLowerCase();
          const isHtmlResponse =
            message.includes("unexpected token '<'") ||
            message.includes("doctype") ||
            message.includes("not valid json");

          if (!isHtmlResponse && !message.includes("timeout")) {
            throw relativeError;
          }

          json = await withTimeout(
            fetchWithAuthQA<RoundsByOrderResponse>(absoluteUrl, {
              method: "GET",
              headers: {
                Accept: "application/json",
                "ngrok-skip-browser-warning": "true",
              },
            }),
            8000,
            "rounds absoluto"
          );
        }

        const mapped: UiRound[] = (json?.data?.pedidos ?? []).flatMap((pedido) =>
          (pedido.rondas ?? []).map((ronda) => {
            const fecha = ronda.fechaInicio || null;
            const picker =
              ronda.asignacion?.estado === "ASIGNADO"
                ? ronda.asignacion?.pickerNombre || null
                : null;

            return {
              id: ronda.displayId || ronda.sessionId,
              sessionId: ronda.sessionId,
              shipmentCode: pedido.shipmentCode,
              date: fecha ? `${fmtDate(fecha)} ${fmtTime(fecha)}`.trim() : "-",
              assigned: picker,
              status: toStatusEs(ronda.estado),
              warehouseName: warehouseByReferenceId.get(String(ronda.almacen || "").trim()) || ronda.almacen || null,
              resultados: (ronda.resultados ?? []).map((res) => ({
                sessionItemId: res.sessionItemId,
                imagen: res.imagen || undefined,
                nombreProducto: res.nombreProducto || "-",
                sku: res.sku || undefined,
                ean: res.ean || undefined,
                cantidadSolicitada: Number(res.cantidadSolicitada ?? 0),
                cantidadPickeada: Number(res.cantidadPickeada ?? 0),
                faltante: Number(res.faltante ?? 0),
                estado: toStatusEs(res.estado),
              })),
            };
          })
        );

        if (!cancelled) setRounds(mapped);
      } catch (err) {
        console.error("Error al cargar rondas por pedido:", err);
        if (!cancelled) setRounds([]);
      }
    };

    loadRounds();
    return () => {
      cancelled = true;
    };
  }, [orderParam, token, fetchWithAuthQA]);

  return rounds;
}

/* ===== Item ===== */
function ItemRow({ item }: { item: UiItem }) {
  const productDetailsHref = item.sku ? `/catalogo/productos/details/${encodeURIComponent(item.sku)}` : null;
  const skuDetailsHref = item.sku ? `/catalogo/skus/${encodeURIComponent(item.sku)}` : null;

  return (
    <div className={`relative grid ${GRID_COLS} gap-x-6 px-6 py-5 hover:bg-blue-50/40`}>
      {/* —— Columna 1: Items —— */}
      <div className="flex items-start gap-4 min-w-0">
        <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-md border bg-white">
          <img
            src={item.image || DEFAULT_PRODUCT_IMG}
            onError={(e) => { e.currentTarget.src = DEFAULT_PRODUCT_IMG; }}
            alt={item.name}
            className="h-full w-full object-contain"
          />

        </div>

        <div className="min-w-0">
          <p className="truncate font-medium text-gray-800">
            {productDetailsHref ? (
              <Link
                href={productDetailsHref}
                className="text-blue-700 hover:text-blue-800 hover:underline"
                title="Ver detalle del producto en catálogo"
              >
                {item.name}
              </Link>
            ) : (
              item.name
            )}
          </p>
          <div className="mt-1 flex flex-wrap items-start gap-x-6 gap-y-1 text-xs text-gray-500">
            {(item.sku || item.barcode) && (
              <div className="flex flex-col gap-1">
                {item.sku && (
                  <span className="group/copy inline-flex">
                    <CopyableText
                      text={item.sku}
                      className="font-mono [&>button]:opacity-0 [&>button]:transition-opacity [&>button]:duration-150 group-hover/copy:[&>button]:opacity-100"
                    >
                      <span className="inline-flex items-center gap-1">
                        <span className="inline-flex h-5 w-5 items-center justify-center rounded bg-blue-50 text-blue-600">
                          <Tag size={13} />
                        </span>
                        {skuDetailsHref ? (
                          <Link
                            href={skuDetailsHref}
                            className="text-blue-700 hover:text-blue-800 hover:underline"
                            title="Ver detalle del SKU en catálogo"
                          >
                            {item.sku}
                          </Link>
                        ) : (
                          item.sku
                        )}
                      </span>
                    </CopyableText>
                  </span>
                )}

                {item.barcode && (
                  <span className="group/copy inline-flex">
                    <CopyableText
                      text={item.barcode}
                      className="font-mono [&>button]:opacity-0 [&>button]:transition-opacity [&>button]:duration-150 group-hover/copy:[&>button]:opacity-100"
                    >
                      <span className="inline-flex items-center gap-1">
                        <span className="inline-flex h-5 w-5 items-center justify-center rounded bg-emerald-50 text-emerald-600">
                          <Barcode size={13} />
                        </span>
                        {item.barcode}
                      </span>
                    </CopyableText>
                  </span>
                )}
              </div>
            )}
            {item.criteria && <span className="rounded bg-gray-100 px-2 py-0.5">{item.criteria}</span>}
            {item.storeCode && <span className="rounded bg-indigo-50 px-2 py-0.5 text-indigo-700">{item.storeCode}</span>}
            {item.isSubstitute && (
              <span className="inline-flex items-center gap-1 rounded bg-yellow-50 px-2 py-0.5 text-yellow-700">
                <EyeOff size={14} /> Substituto
              </span>
            )}
          </div>
        </div>
      </div>

      {/* —— Columna 2: Unit Price —— */}
      <div className="text-sm text-gray-700 text-right tabular-nums pr-1">
        {formatCurrency(item.unitPrice)}
      </div>

      {/* —— Columna 3: Cantidad —— */}
      <div className="text-sm text-gray-700 text-right tabular-nums pr-1">
        {item.qty ?? 0}
      </div>

      {/* —— Columna 4: Total —— */}
      <div className="text-sm font-medium text-gray-900 text-right tabular-nums pr-1">
        {formatCurrency(item.total)}
      </div>

    </div>
  );
}

function CollapsibleGroup({ group, defaultOpen = false }: { group: UiGroup; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-5 py-3 text-left hover:bg-gray-50"
      >
        <div className="flex items-center gap-2">
          <ChevronRight className={`h-4 w-4 transition-transform ${open ? "rotate-90" : ""}`} />
          <span className="font-semibold text-gray-800">{group.title}</span>
          {group.meta?.zone && <span className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-700">{group.meta.zone}</span>}
          {group.meta?.status && (
            <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-700">
              <CheckCircleIcon className="h-3 w-3" /> {group.meta.status}
            </span>
          )}
        </div>
        <div className="text-sm text-gray-600 flex items-center gap-3">
          <span>
            {(group.meta?.cantidadGrupo ?? group.items?.length ?? 0)}{" "}
            {(group.meta?.cantidadGrupo ?? group.items?.length ?? 0) === 1 ? "item" : "items"}
          </span>
          <span className="text-gray-300"></span>
          <span className="font-medium text-gray-700">
            Total grupo: {formatCurrency(group.meta?.totalGrupo ?? 0)}
          </span>
        </div>

      </button>

      {open && (
        <div className="divide-y">
          {/* Header de columnas */}
          <div className={`grid ${GRID_COLS} gap-x-6 px-6 py-2 text-[12px] text-gray-500 bg-gray-50`}>
            <div>Producto</div>
            <div className="text-right pr-1">Precio Unit.</div>
            <div className="text-right pr-1">Cantidad</div>
            <div className="text-right pr-1">Total</div>
          </div>

          {group.items?.map((item) => (
            <ItemRow key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}

/* ===== Lista de Picking (API) ===== */
function PickingResultsList({ results }: { results: UiPickingResult[] }) {
  const [openIds, setOpenIds] = useState<Record<string, boolean>>({});
  const toggleOpen = (id: string) =>
    setOpenIds((prev) => ({ ...prev, [id]: !prev[id] }));

  if (!results?.length) {
    return <div className="rounded-xl border bg-white p-4 text-sm text-gray-500">No hay resultados de picking.</div>;
  }

  return (
    <div className="space-y-3">
      {/* Header de columnas de la vista de contenedores */}
      <div className="grid items-center gap-4 px-5 text-[12px] text-gray-500">
        <div className="grid grid-cols-[minmax(260px,1fr)_140px_180px_160px_140px] gap-4">
          <div>ID de Contenedor</div>
          <div className="text-center">Cant. de Items</div>
          <div>Inventario</div>
          <div>Posición</div>
          <div>Estado</div>
        </div>
      </div>

      {results.map((c) => {
        const isOpen = !!openIds[c.containerId];
        return (
          <div key={c.containerId} className="rounded-xl border bg-white shadow-sm overflow-hidden">
            {/* Header del contenedor */}
            <button
              type="button"
              onClick={() => toggleOpen(c.containerId)}
              className="grid w-full grid-cols-[minmax(260px,1fr)_140px_180px_160px_140px] items-center gap-4 px-5 py-3 text-left hover:bg-gray-50"
            >
              <div className="flex items-center gap-2">
                {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                <span className="font-medium text-gray-800">{c.containerId}</span>
              </div>

              <div className="flex items-center justify-center">
                <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-gray-100 px-2 text-sm font-medium text-gray-700">
                  {c.itemCount}
                </span>
              </div>

              <div className="inline-flex items-center gap-2 text-gray-700">
                <Home className="h-5 w-5" />
                <span className="truncate">{c.inventory ?? "—"}</span>
              </div>

              <div className="text-gray-700">{c.position ?? "—"}</div>

              <div className="text-gray-700">
                <StatusBadge
                  status={toStatusEs(c.status)}
                  variant={resolveStatus(toStatusEs(c.status), "picking").variant as any}
                />
              </div>
            </button>

            {isOpen && (
              <div className="divide-y">
                {!c.products?.length ? (
                  <div className="px-5 py-4 text-sm text-gray-500">Sin detalle de productos para este contenedor.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead className="bg-gray-50 text-gray-600">
                        <tr>
                          <th className="px-5 py-2 text-left font-medium">Producto</th>
                          <th className="px-5 py-2 text-left font-medium">SKU</th>
                          <th className="px-5 py-2 text-right font-medium">Solicitada</th>
                          <th className="px-5 py-2 text-right font-medium">Pickeada</th>
                          <th className="px-5 py-2 text-right font-medium">Faltante</th>
                          <th className="px-5 py-2 text-left font-medium">Estado</th>
                        </tr>
                      </thead>
                      <tbody>
                        {c.products.map((p) => (
                          <tr key={p.id} className="border-t">
                            <td className="px-5 py-3">
                              <div className="flex items-center gap-3 min-w-0">
                                <img
                                  src={p.image || DEFAULT_PRODUCT_IMG}
                                  onError={(e) => { e.currentTarget.src = DEFAULT_PRODUCT_IMG; }}
                                  alt={p.name}
                                  className="h-10 w-10 rounded border object-contain bg-white"
                                />
                                <span className="truncate text-gray-800">{p.name}</span>
                              </div>
                            </td>
                            <td className="px-5 py-3 font-mono text-gray-700">{p.sku || "-"}</td>
                            <td className="px-5 py-3 text-right tabular-nums text-gray-700">{p.requestedQty}</td>
                            <td className="px-5 py-3 text-right tabular-nums text-gray-700">{p.pickedQty}</td>
                            <td className="px-5 py-3 text-right tabular-nums text-gray-700">{p.missingQty}</td>
                            <td className="px-5 py-3 text-gray-700">
                              <StatusBadge
                                status={toStatusEs(p.status)}
                                variant={resolveStatus(toStatusEs(p.status), "picking").variant as any}
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ===== Vista principal ===== */
function ItemsView() {
  const router = useRouter();
  const { id: pedidoId } = useParams<{ id: string }>();

  const { data: issue, isLoading, error } = useIssueItems(pedidoId);
  const roundsByOrder = useOrderRounds(pedidoId);

  // Estado actual desde historial (elige el más reciente; si empatan, el que viene más tarde en el array)
  const currentStatusFromHistory = useMemo(() => {
    const arr = issue?.historial ?? [];
    if (!arr.length) return null;
    let bestIdx = 0;
    let bestTime = parseDayFirstDateTime(arr[0]?.fecha).getTime();
    for (let i = 1; i < arr.length; i++) {
      const t = parseDayFirstDateTime(arr[i]?.fecha).getTime();
      if (t > bestTime || (t === bestTime && i > bestIdx)) {
        bestIdx = i;
        bestTime = t;
      }
    }
    return arr[bestIdx]?.status ?? null;
  }, [issue?.historial]);

  const statusVariant = useMemo(() => {
    const raw = currentStatusFromHistory || "Pendiente";
    return getStatusVariant(raw);
  }, [currentStatusFromHistory]);

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

  usePageHeader(
    () => ({
      title: (
        <div>
          <div className="text-xs font-semibold uppercase text-blue-600 tracking-wider">PEDIDOS</div>
          <div className="text-2xl font-semibold text-gray-900">
            {`PEDIDO #${pedidoId ?? "ORD-XXXXXX"}`}
          </div>
        </div>
      ),
      action: headerActions,
      status: { text: currentStatusFromHistory ?? "Pendiente", variant: statusVariant },
    }),
    [pedidoId, headerActions, currentStatusFromHistory, statusVariant]
  );

  // 1) Grupos desde API
  const groups: UiGroup[] = useMemo(() => {
    const apiGroups = issue?.items?.originales?.grupos ?? [];
    return apiGroups.map((g, idx) => ({
      key: g.categoria || `grupo-${idx}`,
      title: g.categoria || `Grupo ${idx + 1}`,
      meta: {
        cantidadGrupo: Number(g.cantidadGrupo ?? (g.items?.length ?? 0)),
        totalGrupo:
          Number(
            g.totalGrupo ??
            g.items?.reduce(
              (acc, it) =>
                acc +
                Number(
                  it.totalItem ??
                  (Number(it.precioUnitario ?? 0) * Number(it.cantidad ?? 0))
                ),
              0
            )
          ) || 0,
      },
      items: g.items.map((it, j) => ({
        id: `${idx}-${j}-${it.itemcode ?? it.producto}`,
        name: it.producto,
        unitPrice: Number(it.precioUnitario ?? 0),
        qty: Number(it.cantidad ?? 0),
        total: Number(
          it.totalItem ?? (Number(it.precioUnitario ?? 0) * Number(it.cantidad ?? 0))
        ),
        sku: it.itemcode ?? undefined,
        image: it.imagen ?? undefined,
        barcode: it.eans ?? undefined,
      })),
    }));
  }, [issue]);

  // 2) Picking desde API
  const pickingFromApi: UiPickingResult[] = useMemo(() => {
    const arr = issue?.items?.resultadosPicking;
    if (!arr) return [];
    return arr.map((r) => {
      const products = (r.productos ?? []).map((p, idx) => ({
        id: String(p.orderItemPickingId ?? p.shipmentItemId ?? idx),
        name: p.nombre || "-",
        image: p.imagen || undefined,
        sku: p.sku || undefined,
        requestedQty: Number(p.requestedQty ?? 0),
        pickedQty: Number(p.pickedQty ?? 0),
        missingQty: Number(p.missingQty ?? 0),
        status: toStatusEs(p.estado),
      }));

      const hasMissing = products.some((p) => p.missingQty > 0);
      const allPicked = products.length > 0 && products.every((p) => p.pickedQty >= p.requestedQty && p.missingQty === 0);

      return {
        containerId: r.idContenedor,
        itemCount: Number(r.cantItems ?? 0),
        inventory: r.inventario ?? null,
        position: r.posicion ?? null,
        status: allPicked ? "Pickeado" : hasMissing ? "Faltante" : "Pendiente",
        products,
      };
    });
  }, [issue]);

  // 3) Rondas desde API
  const roundsFromApi: UiRound[] = useMemo(() => {
    return roundsByOrder;
  }, [roundsByOrder]);

  const [view, setView] = useState<"original" | "picking" | "rounds">("original");

  /************ Toolbar superior (pills mejorados) ************/
  const tabs = [
    { key: "original", label: "Original por grupos", icon: <ShoppingCart size={16} /> },
    { key: "picking", label: "Resultado picking", icon: <ClipboardList size={16} /> },
    { key: "rounds", label: "Rondas", icon: <Calendar size={16} /> },
  ] as const;

  type TabKey = typeof tabs[number]["key"];

  const handlePillsKey = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const order: TabKey[] = ["original", "picking", "rounds"];
    const idx = order.indexOf(view);
    if (e.key === "ArrowRight") setView(order[(idx + 1) % order.length]);
    if (e.key === "ArrowLeft") setView(order[(idx - 1 + order.length) % order.length]);
  };

  return (
    <section className="space-y-6">
      {/* Toolbar superior */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div
          role="tablist"
          aria-label="Selecciona vista"
          onKeyDown={handlePillsKey}
          className="flex flex-wrap items-center gap-2"
        >
          {tabs.map(t => {
            const active = view === t.key;
            return (
              <button
                key={t.key}
                role="tab"
                aria-selected={active}
                onClick={() => setView(t.key)}
                className={[
                  "group inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm shadow-sm",
                  "transition-all focus:outline-none focus:ring-2 focus:ring-blue-200",
                  active
                    ? "border-blue-500 bg-white text-blue-700"
                    : "border-gray-300 bg-white text-gray-700 hover:border-blue-400 hover:bg-gray-50"
                ].join(" ")}
              >
                {/* marca circular */}
                <span
                  className={[
                    "inline-block h-2.5 w-2.5 rounded-full ring-2 transition-all",
                    active ? "bg-blue-600 ring-blue-600" : "bg-white ring-gray-300 group-hover:ring-blue-400"
                  ].join(" ")}
                />
                {t.icon}
                <span className="whitespace-nowrap">{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Contenido según vista */}
      {view === "rounds" ? (
        <RoundsExpandableList rounds={roundsFromApi} mode="order-rounds" />
      ) : view === "picking" ? (
        <PickingResultsList results={pickingFromApi} />
      ) : (
        <>
          {isLoading && (
            <div className="overflow-x-auto border rounded-md bg-white">
              <table className="min-w-full text-sm">
                <tbody>
                  <tr>
                    <td colSpan={8} className="px-4 py-6 text-center text-gray-500">
                      <ArrowPathIcon className="h-5 w-5 inline animate-spin mr-2" />
                      Cargando...
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
          {error && <div className="text-sm text-red-600">Error al cargar ítems: {error}</div>}
          {!isLoading && groups.map((g, i) => <CollapsibleGroup key={g.key + i} group={g} defaultOpen={i === 0} />)}
          {!isLoading && !error && groups.length === 0 && (
            <div className="rounded-xl border bg-white p-4 text-sm text-gray-500">No hay ítems para mostrar.</div>
          )}
        </>
      )}
    </section>
  );
}

export default ItemsView;

