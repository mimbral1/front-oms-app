// views\PedidosView\Detalles-Pedido\Transacciones\FacturacionView.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowPathIcon,
  CheckCircleIcon,
  EyeIcon,
} from "@heroicons/react/24/outline";
import { DataTable } from "@/components/ui/table";
import { Pagination } from "@/components/ui/pagination";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";
import { type Action } from "@/components/layout/page-header";
import { ArrowLeftCircleIcon } from "lucide-react";
import SaveOutlined from "@mui/icons-material/SaveOutlined";
import { fetchIssueFacturacion } from "@/app/fetchWithAuth/api-pedidos/pedidos";
import { useAuth } from "@/app/context/auth/AuthContext";
import { getStatusVariant } from "@/features/pedidos/utils/pedido-status";
import type { PedidoStatus } from "@/features/pedidos/types/lista-pedidos";
import { StatusBadge } from "@/components/ui/badge/status";
import { resolveStatus } from "@/components/ui/badge/status-registry";
import { parseDayFirstDateTime, fmtDateTime } from "@/lib/format/date";
import { clp } from "@/lib/format/money";
import { extractOrderId } from "@/utils/pedido";

/* ────────────── TIPOS DE API ────────────── */
type ApiFactura = {
  numero: string;
  valor: number;
  fechaCreacion: string;     // "YYYY-MM-DD HH:mm:ss"
  usuarioCreador: string | null;
  fechaFacturacion: string;  // "YYYY-MM-DD"
  link: unknown;
};

type ApiFormulario = {
  indice: string;            // "#001"
  items: number;
  valor: number;
  fechaCreacion: string;     // "DD/MM/YYYY HH:mm:ss"
  modificado: string;        // "DD/MM/YYYY HH:mm:ss"
  usuario: string;
  factura: string;           // "13012904"
  estado: string;            // "pendiente" | ...
};

type ApiNotaCredito = {
  numero: string | null;
  valor: number;
  fechaCreacion: string;
  fechaDocumento?: string | null;
  usuarioCreador: string;
  estado: string;
  comentarioCliente?: string | null;
  comentarioInterno?: string | null;
  links?: unknown;
};

type ApiNotaCreditoRow = ApiNotaCredito & {
  _rowKey: string;
};

type IssueSummaryResponse = {
  facturacion?: Array<{
    titulo: "facturas" | "formulario" | "devoluciones" | "notas de crédito";
    items: any[];
  }>;
  historial?: Array<{ status: string; fecha: string; usuario: string | null }>;
};

/* ────────────── TIPOS UI ────────────── */
interface Invoice {
  id: string;            // numero
  number: string;        // "#13012904"
  value: number;         // 60851
  createdAt: string;
  createdBy: string;
  invoicedAt: string;
  link?: unknown;
  hasForms?: boolean;    // derivado: si existe formulario asociado
}

interface Formulario {
  indice: string;        // "#001"
  items: number;
  valor: number;
  createdAt: string;
  modificatedAt: string;
  createdBy: string;     // usuario
  factura: string;
  status: string;
}

interface Devolucion {
  id: string;            // devolucion
  amount: number;        // monto
  createdAt: string | null;
  processedBy: string | null;
  processedAt: string | null;
}

/* ────────────── HELPERS ────────────── */
const CLP = clp;

const formatBackendIso = (value?: string | null) => {
  if (!value) return "-";
  // ISO UTC → texto plano sin TZ
  return value.replace("T", " ").replace("Z", "").split(".")[0];
};

const resolveLinkValue = (value: unknown): string | null => {
  if (typeof value === "string") {
    const normalized = value.trim();
    if (!normalized) return null;

    const lower = normalized.toLowerCase();
    if (lower === "null" || lower === "undefined" || lower === "[]" || lower === "{}" || lower === "-") {
      return null;
    }

    return normalized;
  }

  if (Array.isArray(value)) {
    for (const entry of value) {
      const resolved = resolveLinkValue(entry);
      if (resolved) return resolved;
    }
    return null;
  }

  if (value && typeof value === "object") {
    const candidate = (value as any).url ?? (value as any).link ?? (value as any).href ?? null;
    return resolveLinkValue(candidate);
  }

  return null;
};


/* ────────────── FETCH + MAP ────────────── */
function useFacturacion(orderParam?: string) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [forms, setForms] = useState<Formulario[]>([]);
  const [returnsList, setReturnsList] = useState<Devolucion[]>([]);
  const [creditNotes, setCreditNotes] = useState<ApiNotaCredito[]>([]);
  const [latestStatus, setLatestStatus] = useState<string | null>(null);
  const [isLoading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuth();

  // llamada a la api 
  useEffect(() => {
    const id = extractOrderId(orderParam);
    if (!id) return;

    // Evita el fetch hasta que AuthContext haya hidratado el token
    if (!token) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        const json = await fetchIssueFacturacion<IssueSummaryResponse>(token, id);

        // Estado actual desde historial del mismo response
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

        const section = (name: "facturas" | "formulario" | "devoluciones" | "notas de crédito") =>
          (json.facturacion ?? []).find((s) => s.titulo === name)?.items ?? [];

        const facturas = section("facturas") as ApiFactura[];
        const formularios = section("formulario") as ApiFormulario[];
        const notasCredito = section("notas de crédito") as ApiNotaCredito[];
        const devoluciones = section("devoluciones")

        // Mapeos UI
        const invs: Invoice[] = facturas.map((f) => ({
          id: f.numero,
          number: `#${f.numero}`,
          value: Number(f.valor ?? 0),
          createdAt: f.fechaCreacion,
          createdBy: f.usuarioCreador ?? "-",
          invoicedAt: f.fechaFacturacion,
          link: f.link ?? null,
          hasForms: formularios.some((fo) => String(fo.factura) === String(f.numero)),
        }));

        const frms: Formulario[] = formularios.map((f) => ({
          indice: f.indice,
          items: Number(f.items ?? 0),
          valor: Number(f.valor ?? 0),
          createdAt: f.fechaCreacion,
          modificatedAt: f.modificado,
          createdBy: f.usuario,
          factura: f.factura,
          status: (f.estado || "").trim() || "-",
        }));

        const rets: Devolucion[] = devoluciones.map((d) => ({
          id: d.devolucion,
          amount: Number(d.monto ?? 0),
          createdAt: d.fechaCreacion,
          processedBy: d.procesadoPor,
          processedAt: d.procesadoEl,
        }));

        if (!cancelled) {
          setInvoices(invs);
          setForms(frms);
          setReturnsList(rets);
          setCreditNotes(notasCredito);
          setLatestStatus(latestStatusLocal);
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
  }, [orderParam, token]);

  return { invoices, forms, returnsList, creditNotes, latestStatus, isLoading, error };
}

/* ────────────── COLUMNAS PARA CADA TAB ────────────── */
const getInvoiceColumns = (router: ReturnType<typeof useRouter>, pedidoId: string) => [
  {
    header: (
      <div className="min-w-[110px]">
        Número
      </div>
    ),
    accessorKey: "number",
    cell: (inv: Invoice) => (
      <div className="flex flex-col min-w-[110px]">
        <span className="text-xs lg:text-sm font-medium text-blue-600 truncate">
          {inv.number}
        </span>
      </div>
    ),
  },
  {
    header: (
      <div className="min-w-[100px]">
        Valor
      </div>
    ),
    accessorKey: "value",
    cell: (inv: Invoice) => (
      <div className="flex flex-col min-w-[100px]">
        <span className="text-xs lg:text-sm text-gray-700 truncate">
          {CLP.format(inv.value)}
        </span>
      </div>
    ),
  },
  {
    header: "Fecha de creación",
    accessorKey: "createdAt",
    cell: (inv: Invoice) => (
      <div className="flex flex-col min-w-0">
        <span className="text-xs lg:text-sm text-gray-700 truncate">
          {formatBackendIso(inv.createdAt) || "-"}
        </span>
      </div>
    ),
  },
  {
    header: "Fecha documento",
    accessorKey: "fechaDocumento",
    cell: (n: ApiNotaCredito) => {
      const dateOnly = n.fechaDocumento
        ? n.fechaDocumento.split("T")[0]
        : "-";

      return (
        <div className="flex flex-col min-w-0">
          <span className="text-xs lg:text-sm text-gray-700 truncate">

            {dateOnly}
          </span>
        </div>
      );
    },
  },
  {
    header: "Usuario creador",
    accessorKey: "createdBy",
    cell: (inv: Invoice) => (
      <div className="flex flex-col min-w-0">
        <span className="text-xs lg:text-sm text-gray-700 truncate">
          {inv.createdBy}</span>
      </div>
    ),
  },
  {
    header: "Fecha de facturación",
    accessorKey: "invoicedAt",
    cell: (inv: Invoice) => (
      <div className="flex flex-col min-w-0">
        <span className="text-xs lg:text-sm text-gray-700 truncate">
          {fmtDateTime(inv.invoicedAt)}</span>
      </div>
    ),
  },
  {
    header: "Forms",
    accessorKey: "hasForms",
    cell: (inv: Invoice) => (
      <div className="flex w-[180px]">
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap
          ${inv.hasForms ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}`}
        >
          {inv.hasForms ? "Sí" : "No"}
        </span>
      </div>
    ),
  },
  {
    header: "Link",
    accessorKey: "link",
    cell: (inv: Invoice) => {
      const href = resolveLinkValue(inv.link);
      return href ? (
        <div className="flex flex-col min-w-0">
          <a
            href={href}
            target="_blank"
            rel="noreferrer"
            className="text-xs lg:text-sm text-blue-600 hover:underline truncate">
            Ver documentos
          </a>
        </div>
      ) : (
        <div className="flex flex-col min-w-0">
          <span className="text-xs lg:text-sm text-gray-400 truncate">
            Esperando Documento
          </span>
        </div>
      );
    },
  },
];

const getFormColumns = (router: ReturnType<typeof useRouter>, pedidoId: string) => [
  {
    header: "Índice",
    accessorKey: "indice",
    cell: (f: Formulario) =>
      <div className="flex flex-col min-w-0">
        <span className="text-sm font-medium">
          {f.indice}
        </span>
      </div>
  },
  {
    header: "Items",
    accessorKey: "items",
    cell: (f: Formulario) => (
      <div className="flex flex-col min-w-0">
        <span className="inline-flex items-center justify-center h-6 w-6 rounded-full border border-gray-300 text-sm">
          {f.items}
        </span>
      </div>
    ),
  },
  {
    header: "Valor",
    accessorKey: "valor",
    cell: (f: Formulario) =>
      <div className="flex flex-col min-w-0">
        <span className="text-xs lg:text-sm text-gray-700 truncate">
          {CLP.format(f.valor)}</span>
      </div>
  },
  {
    header: "Fecha de creación",
    accessorKey: "createdAt",
    cell: (f: Formulario) =>
      <div className="flex flex-col min-w-0">
        <span className="text-xs lg:text-sm text-gray-700 truncate">
          {fmtDateTime(f.createdAt)}
        </span>
      </div>
  },
  {
    header: "Modificado",
    accessorKey: "modificatedAt",
    cell: (f: Formulario) =>
      <div className="flex flex-col min-w-0">
        <span className="text-xs lg:text-sm text-gray-700 truncate">
          {fmtDateTime(f.modificatedAt)}
        </span>
      </div>
  },
  {
    header: "Usuario",
    accessorKey: "createdBy",
    cell: (f: Formulario) =>
      <div className="flex flex-col min-w-0">
        <span className="text-xs lg:text-sm text-gray-700 truncate">
          {f.createdBy}
        </span>
      </div>
  },
  {
    header: "Factura #",
    accessorKey: "factura",
    cell: (f: Formulario) =>
      <div className="flex flex-col min-w-0">
        <span className="text-sm text-blue-600">
          {f.factura}
        </span>
      </div>
  },
  {
    header: "Estado",
    accessorKey: "status",
    cell: (f: Formulario) => {
      const label = f.status?.charAt(0).toUpperCase() + f.status?.slice(1) || "-";
      const variant = resolveStatus(f.status, "formulario").variant;
      return (
        <div className="flex w-[180px]">
          <StatusBadge status={label} variant={variant as any} />
        </div>
      );
    },
  },
];

const getReturnColumns = (router: ReturnType<typeof useRouter>, pedidoId: string) => [
  {
    header: "Devolución",
    accessorKey: "id",
    cell: (r: Devolucion) =>
      <div className="flex flex-col min-w-0">
        <span className="text-xs lg:text-sm text-gray-700 truncate">
          {r.id}
        </span>
      </div>
  },
  {
    header: "Monto",
    accessorKey: "amount",
    cell: (r: Devolucion) =>
      <div className="flex flex-col min-w-0">
        <span className="text-xs lg:text-sm text-gray-700 truncate">
          {CLP.format(r.amount)}
        </span>
      </div>
  },
  {
    header: "Fecha de creación",
    accessorKey: "createdAt",
    cell: (r: Devolucion) =>
      <div className="flex flex-col min-w-0">
        <span className="text-xs lg:text-sm text-gray-700 truncate">
          {fmtDateTime(r.createdAt ?? "-")}
        </span>
      </div>
  },
  {
    header: "Procesado por",
    accessorKey: "processedBy",
    cell: (r: Devolucion) =>
      <div className="flex flex-col min-w-0">
        <span className="text-xs lg:text-sm text-gray-700 truncate">
          {r.processedBy ?? "-"}
        </span>
      </div>
  },
  {
    header: "Procesado en",
    accessorKey: "processedAt",
    cell: (r: Devolucion) =>
      <div className="flex flex-col min-w-0">
        <span className="text-xs lg:text-sm text-gray-700 truncate">
          {fmtDateTime(r.processedAt ?? "-")}
        </span>
      </div>
  },
];

const getNotasCreditoColumns = (
  onToggleComments: (rowKey: string) => void,
  isCommentsOpen: (rowKey: string) => boolean
) => [
    {
      header: "Número",
      accessorKey: "numero",
      cell: (n: ApiNotaCreditoRow) => (
        <div className="flex flex-col min-w-0">
          <span className="text-blue-600 text-sm font-medium">
            {n.numero ?? "—"}
          </span>
        </div>
      ),
    },
    {
      header: "Valor",
      accessorKey: "valor",
      cell: (n: ApiNotaCreditoRow) => (
        <div className="flex flex-col min-w-0">
          <span className="text-xs lg:text-sm text-gray-700 truncate">
            {CLP.format(n.valor)}
          </span>
        </div>
      ),
    },
    {
      header: "Fecha de creación",
      accessorKey: "fechaCreacion",
      cell: (n: ApiNotaCreditoRow) => (
        <div className="flex flex-col min-w-0">
          <span className="text-xs lg:text-sm text-gray-700 truncate">
            {formatBackendIso(n.fechaCreacion)}
          </span>
        </div>
      ),
    },
    {
      header: "Fecha documento",
      accessorKey: "fechaDocumento",
      cell: (n: ApiNotaCreditoRow) => {
        const raw = n.fechaDocumento;

        // Siempre solo fecha (sin hora, sin timezone)
        const dateOnly = raw
          ? raw.split("T")[0]
          : "-";

        return (
          <div className="flex flex-col min-w-0">
            <span className="text-xs lg:text-sm text-gray-700 truncate">

              {dateOnly}
            </span>
          </div>
        );
      },
    },
    {
      header: "Usuario creador",
      accessorKey: "usuarioCreador",
      cell: (n: ApiNotaCreditoRow) => (
        <div className="flex flex-col min-w-0">
          <span className="text-xs lg:text-sm text-gray-700 truncate">
            {n.usuarioCreador}
          </span>
        </div>
      ),
    },
    {
      header: "Estado",
      accessorKey: "estado",
      cell: (n: ApiNotaCreditoRow) => {
        const variant = resolveStatus(n.estado, "nota-credito").variant;
        return (
          <div className="flex w-[180px]">
            <StatusBadge status={n.estado} variant={variant as any} />
          </div>
        );
      },
    },
    {
      header: "Comentarios",
      accessorKey: "comentarios",
      cell: (n: ApiNotaCreditoRow) => {
        const hasComments = Boolean(n.comentarioCliente || n.comentarioInterno);
        return (
          <button
            type="button"
            disabled={!hasComments}
            onClick={() => hasComments && onToggleComments(n._rowKey)}
            className={`inline-flex items-center justify-center rounded p-1 ${hasComments
              ? "text-blue-600 hover:bg-blue-50"
              : "text-gray-300 cursor-not-allowed"
              }`}
            title={hasComments ? "Ver comentarios" : "Sin comentarios"}
            aria-label={hasComments ? "Ver comentarios" : "Sin comentarios"}
          >
            <EyeIcon className={`h-4 w-4 ${isCommentsOpen(n._rowKey) ? "text-blue-700" : ""}`} />
          </button>
        );
      },
    },
    {
      header: "Link",
      accessorKey: "links",
      cell: (n: ApiNotaCreditoRow) => {
        const href = resolveLinkValue(n.links);
        return href ? (
          <div className="flex flex-col min-w-0">
            <a
              href={href}
              target="_blank"
              rel="noreferrer"
              className="text-blue-600 hover:underline text-sm"
            >
              Ver documento
            </a>
          </div>
        ) : (
          <span className="text-gray-300">-</span>
        );
      },
    },
  ];

// TEXTO EXPANDIBLE 
function ExpandableText({
  label,
  text,
}: {
  label: string;
  text?: string | null;
}) {
  if (!text) return null;

  return (
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-sm text-gray-700 whitespace-pre-line">
        {text}
      </p>
    </div>
  );
}


/* ─────────────────────────────────────────────────────
   COMPONENTE PRINCIPAL FacturacionView
   ───────────────────────────────────────────────────── */
export function FacturacionView() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [selectedFilter, setSelectedFilter] = useState<
    "facturas" | "formulario" | "devoluciones" | "notas_credito"
  >("facturas");

  const {
    invoices,
    forms,
    returnsList,
    creditNotes,
    latestStatus,
    isLoading,
    error,
  } = useFacturacion(id);

  const [openCommentRows, setOpenCommentRows] = useState<Record<string, boolean>>({});

  const creditNotesRows = useMemo<ApiNotaCreditoRow[]>(
    () =>
      creditNotes.map((nc, idx) => ({
        ...nc,
        _rowKey: `${nc.numero ?? "sin-numero"}-${idx}`,
      })),
    [creditNotes]
  );

  const toggleComments = (rowKey: string) => {
    setOpenCommentRows((prev) => ({ ...prev, [rowKey]: !prev[rowKey] }));
  };

  const isCommentsOpen = (rowKey: string) => Boolean(openCommentRows[rowKey]);

  const [page, setPage] = useState(1);
  const PER_PAGE = 10;

  const totalPagesInvoices = Math.max(1, Math.ceil(invoices.length / PER_PAGE));
  const shownInvoices = invoices.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const totalPagesForms = Math.max(1, Math.ceil(forms.length / PER_PAGE));
  const shownForms = forms.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const totalPagesReturns = Math.max(1, Math.ceil(returnsList.length / PER_PAGE));
  const shownReturns = returnsList.slice((page - 1) * PER_PAGE, page * PER_PAGE);

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
    const raw = latestStatus || "Pendiente";
    return getStatusVariant(raw as PedidoStatus);
  }, [latestStatus]);

  usePageHeader(
    () => ({
      title: (
        <div>
          <div className="text-xs font-semibold uppercase text-blue-600 tracking-wider">PEDIDOS</div>
          <div className="text-2xl font-semibold text-gray-900">
            {`PEDIDO #${id ?? ""}`}
          </div>
        </div>
      ),
      action: headerActions,
      status: { text: latestStatus ?? "Pendiente", variant: statusVariant },
    }),
    [id, headerActions, latestStatus, statusVariant]
  );

  const FILTERS = [
    { id: "facturas" as const, label: "Facturas" },
    { id: "notas_credito" as const, label: "Notas de crédito" },
    { id: "formulario" as const, label: "Formulario", disabled: true },
    { id: "devoluciones" as const, label: "Devoluciones", disabled: true },
  ];

  const onSelectFilter = (f: (typeof FILTERS)[number]["id"]) => {
    setSelectedFilter(f);
    setPage(1);
  };

  return (
    <div className="pl-3 flex-1 bg-page-bg">
      {/* Filtros */}
      <div className="px-2 pt-1 pb-6">
        {/* Navegación con teclado (↍ →) */}
        <div
          role="tablist"
          aria-label="Selecciona sección de facturación"
          onKeyDown={(e) => {
            const order = ["facturas", "formulario", "devoluciones", "notas_credito"] as const;
            const idx = order.indexOf(selectedFilter);
            if (e.key === "ArrowRight") setSelectedFilter(order[(idx + 1) % order.length]);
            if (e.key === "ArrowLeft") setSelectedFilter(order[(idx - 1 + order.length) % order.length]);
          }}
          className="inline-flex flex-wrap items-center gap-2"
        >
          {FILTERS.map((f) => {
            const isActive = selectedFilter === f.id;
            return (
              <button
                key={f.id}
                role="tab"
                aria-selected={isActive}
                aria-disabled={f.disabled}
                disabled={f.disabled}
                onClick={() => {
                  if (f.disabled) return;
                  onSelectFilter(f.id);
                }}
                className={[
                  "group inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm shadow-sm",
                  "transition-all focus:outline-none focus:ring-2 focus:ring-blue-200",
                  f.disabled
                    ? "cursor-not-allowed bg-white opacity-50"
                    : isActive
                      ? "border-blue-500 bg-white text-blue-700"
                      : "border-gray-300 bg-white text-gray-700 hover:border-blue-400 hover:bg-gray-50",
                ].join(" ")}
              >

                {/* Marca circular */}
                <span
                  className={[
                    "inline-block h-2.5 w-2.5 rounded-full ring-2 transition-all",
                    isActive ? "bg-blue-600 ring-blue-600" : "bg-white ring-gray-300 group-hover:ring-blue-400"
                  ].join(" ")}
                />
                <span className="whitespace-nowrap font-medium">{f.label}</span>
              </button>
            );
          })}
        </div>

        <div className="mt-2 text-sm text-gray-600">
          Puedes alternar entre <strong>Facturas</strong>, <strong>Notas de crédito</strong>, <strong>Formulario</strong> y <strong>Devoluciones</strong>.
        </div>
      </div>

      {/* Estados de carga/errores */}
      {isLoading && (
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
      )}
      {error && (
        <div className="p-4 rounded-lg bg-red-50 text-red-600">{error}</div>
      )}

      {/* FACTURAS */}
      {!isLoading && !error && selectedFilter === "facturas" && (
        invoices.length === 0 ? (
          <div className="mt-2 text-sm text-gray-500">0 resultados</div>
        ) : (
          <>
            <div className="rounded-xl overflow-hidden">
              <DataTable
                data={shownInvoices}
                columns={getInvoiceColumns(router, id) as any}
                rowPaddingY={12}
                rowBgClass="bg-white"
                dataType="General"
                showStatusBorder={false}
              />
              {invoices.length > PER_PAGE && (
                <div className="mt-6 flex justify-center">
                  <Pagination currentPage={page} totalPages={totalPagesInvoices} onPageChange={setPage} />
                </div>
              )}
            </div>
            <div className="mt-2 text-sm text-gray-500">
              {invoices.length} resultado{invoices.length !== 1 && "s"}
            </div>
          </>
        )
      )}

      {/* FORMULARIO */}
      {!isLoading && !error && selectedFilter === "formulario" && (
        <div className="rounded-xl shadow-sm overflow-hidden">
          <DataTable
            data={shownForms}
            columns={getFormColumns(router, id) as any}
            rowPaddingY={12}
            rowBgClass="bg-white"
            dataType="General"
            showStatusBorder={false}
          />
          {forms.length > PER_PAGE && (
            <div className="mt-6 flex justify-center">
              <Pagination currentPage={page} totalPages={totalPagesForms} onPageChange={setPage} />
            </div>
          )}
          <div className="mt-2 text-sm text-gray-500">
            {forms.length} resultado{forms.length !== 1 && "s"}
          </div>
        </div>
      )}

      {/* DEVOLUCIONES */}
      {!isLoading && !error && selectedFilter === "devoluciones" && (
        <div className="rounded-xl shadow-sm overflow-hidden">
          <DataTable
            data={shownReturns}
            columns={getReturnColumns(router, id) as any}
            rowPaddingY={12}
            rowBgClass="bg-white"
            dataType="General"
            showStatusBorder={false}
          />
          {returnsList.length > PER_PAGE && (
            <div className="mt-6 flex justify-center">
              <Pagination currentPage={page} totalPages={totalPagesReturns} onPageChange={setPage} />
            </div>
          )}
          <div className="mt-2 text-sm text-gray-500">
            {returnsList.length} resultado{returnsList.length !== 1 && "s"}
          </div>
        </div>
      )}

      {/* NOTAS DE CRÉDITO */}
      {!isLoading && !error && selectedFilter === "notas_credito" && (
        creditNotesRows.length === 0 ? (
          <div className="mt-2 text-sm text-gray-500">
            Sin nota de crédito asociada.
          </div>
        ) : (
          <>
            {/* Tabla */}
            <div className="rounded-xl overflow-hidden">
              <DataTable
                data={creditNotesRows}
                columns={getNotasCreditoColumns(toggleComments, isCommentsOpen) as any}
                rowPaddingY={12}
                rowBgClass="bg-white"
                dataType="General"
                showStatusBorder={false}
              />
            </div>

            {/* Comentarios de Nota de Crédito */}
            <div className="mt-4 space-y-4">
              {creditNotesRows.map((nc) => (
                isCommentsOpen(nc._rowKey) && (nc.comentarioCliente || nc.comentarioInterno) && (
                  <div
                    key={`comments-${nc._rowKey}`}
                    className="rounded-xl border bg-white p-4"
                  >
                    <div className="text-sm font-medium text-gray-900 mb-2">
                      Comentarios — Nota de crédito {nc.numero ?? "—"}
                    </div>

                    <div className="space-y-3">
                      <ExpandableText
                        label="Cliente"
                        text={nc.comentarioCliente}
                      />
                      <ExpandableText
                        label="Interno"
                        text={nc.comentarioInterno}
                      />
                    </div>
                  </div>
                )
              ))}
            </div>

            <div className="mt-2 text-sm text-gray-500">
              {creditNotesRows.length} resultado{creditNotesRows.length !== 1 && "s"}
            </div>
          </>
        )
      )}

    </div>
  );
}

export default FacturacionView;

