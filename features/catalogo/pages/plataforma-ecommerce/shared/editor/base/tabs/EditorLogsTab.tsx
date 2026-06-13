// features/catalogo/pages/plataforma-ecommerce/shared/editor/base/tabs/EditorLogsTab.tsx
//
// Tab "Logs" del editor — bitácora del producto.
//
// Sigue el estilo de la plataforma (mismo patrón que components/presets/logs/
// LogsBase): tabla global `DataTable` + `Pagination` + modal de detalle. Lo
// EXCLUSIVO de Falabella (que el LogsBase genérico no tiene) se agrega acá:
//   - columna "Estado Falabella" (ok / error / sin-id)
//   - 4ª tab en el modal: respuesta del marketplace (payload enviado y
//     respuesta cruda).
//
// Fuente: GET /api/pim/productos/:sku/audit?marketplace=<marketplace>.

"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronDownIcon, RefreshCw, AlertTriangle, X } from "lucide-react";

import { DataTable, type Column } from "@/components/ui/table";
import { Pagination } from "@/components/ui/pagination";
import { useEditorApi } from "../api/editor-api";
import type { EditorAuditEntry } from "../types/editor-types";
import { eventMeta } from "../../../bitacora/base/components/bitacora-format";
import type { BitacoraEventType } from "../../../bitacora/base/types/bitacora-types";

/* ── helpers ───────────────────────────────────────────────── */

/** Parsea un campo JSON que llega como string NVARCHAR del backend. */
function parseJson(value: unknown): any {
    if (value == null) return null;
    if (typeof value !== "string") return value;
    try {
        return JSON.parse(value);
    } catch {
        return value; // si no es JSON válido, lo mostramos tal cual
    }
}

/** "2026-05-25 15:52:54.281" → "25-05-2026 15:52:54" (ya viene en hora Chile). */
function fmtFecha(raw: string): string {
    if (!raw) return "—";
    const m = String(raw).match(
        /(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2}):(\d{2})/,
    );
    if (!m) return String(raw);
    const [, y, mo, d, h, mi, s] = m;
    return `${d}-${mo}-${y} ${h}:${mi}:${s}`;
}

const ACTION_STYLES: Record<string, string> = {
    CREATE: "bg-green-100 text-green-700",
    INSERT: "bg-green-100 text-green-700",
    UPDATE: "bg-blue-100 text-blue-700",
    DELETE: "bg-red-100 text-red-700",
    PUBLISH: "bg-purple-100 text-purple-700",
};

function ActionBadge({ action }: { action: string }) {
    const a = String(action || "").toUpperCase();
    return (
        <span
            className={[
                "inline-flex items-center justify-center rounded-md px-2.5 py-0.5 text-[11px] font-medium",
                ACTION_STYLES[a] ?? "bg-gray-200 text-gray-600",
            ].join(" ")}
        >
            {a || "—"}
        </span>
    );
}

const FALA_STATUS_STYLES: Record<string, string> = {
    ok: "bg-emerald-100 text-emerald-700",
    error: "bg-rose-100 text-rose-700",
    "sin-id": "bg-amber-100 text-amber-700",
};

function FalaStatusBadge({ status }: { status?: string | null }) {
    if (!status) return <span className="text-gray-400 text-sm">—</span>;
    const s = String(status).toLowerCase();
    return (
        <span
            className={[
                "inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium",
                FALA_STATUS_STYLES[s] ?? "bg-gray-100 text-gray-600",
            ].join(" ")}
        >
            {status}
        </span>
    );
}

function Pre({ data, raw }: { data?: any; raw?: string | null }) {
    if (raw) {
        return (
            <pre className="whitespace-pre-wrap break-words rounded-md bg-gray-50 p-3 text-xs text-gray-800">
                {raw}
            </pre>
        );
    }
    if (!data || (typeof data === "object" && Object.keys(data).length === 0)) {
        return (
            <div className="text-sm text-gray-500">
                No hay información para mostrar.
            </div>
        );
    }
    return (
        <pre className="whitespace-pre-wrap break-words rounded-md bg-gray-50 p-3 text-xs text-gray-800">
            {typeof data === "string" ? data : JSON.stringify(data, null, 2)}
        </pre>
    );
}

/* ── modal de detalle ──────────────────────────────────────────────────── */

type DetalleTab = "cambios" | "antes" | "despues" | "falabella";

function EditorLogDetalleModal({
    entry,
    marketplaceKey,
    onClose,
}: {
    entry: EditorAuditEntry;
    marketplaceKey: string;
    onClose: () => void;
}) {
    const [tab, setTab] = useState<DetalleTab>("cambios");
    const valuesOld = useMemo(() => parseJson(entry.values_old), [entry]);
    const valuesNew = useMemo(() => parseJson(entry.values_new), [entry]);
    const responseRaw = useMemo(() => parseJson(entry.response_raw), [entry]);
    const sentPayloadLabel =
        marketplaceKey === "falabella" ? "XML enviado" : "JSON enviado";

    const tabs: { id: DetalleTab; label: string }[] = [
        { id: "cambios", label: "Cambios" },
        { id: "antes", label: "Antes" },
        { id: "despues", label: "Después" },
        { id: "falabella", label: "Respuesta del marketplace" },
    ];

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
            onClick={onClose}
        >
            <div
                className="w-full max-w-3xl rounded-xl bg-white shadow-xl"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between border-b px-4 py-3">
                    <h3 className="text-sm font-semibold text-gray-800">
                        Detalle del cambio · {fmtFecha(entry.created_at)}
                    </h3>
                    <button
                        onClick={onClose}
                        className="rounded-md p-1 text-gray-500 hover:bg-gray-100"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="flex gap-2 border-b px-4 py-2">
                    {tabs.map((t) => (
                        <button
                            key={t.id}
                            type="button"
                            onClick={() => setTab(t.id)}
                            className={[
                                "rounded-md px-3 py-1.5 text-sm font-medium",
                                tab === t.id
                                    ? "bg-blue-100 text-blue-700"
                                    : "text-gray-600 hover:bg-gray-100",
                            ].join(" ")}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>

                <div className="max-h-[60vh] overflow-auto p-4 space-y-3">
                    {tab === "cambios" && <Pre data={valuesNew} />}
                    {tab === "antes" && <Pre data={valuesOld} />}
                    {tab === "despues" && <Pre data={valuesNew} />}
                    {tab === "falabella" && (
                        <>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                                <Field label="Acción" value={entry.fala_action} />
                                <Field label="Estado" value={entry.fala_status} />
                                <Field label="Feed ID" value={entry.fala_feed_id} />
                                <Field
                                    label="Request ID"
                                    value={entry.fala_request_id}
                                />
                            </div>
                            {entry.fala_error && (
                                <div className="rounded-md bg-rose-50 border border-rose-200 px-3 py-2 text-xs text-rose-700">
                                    <strong>Error:</strong> {entry.fala_error}
                                </div>
                            )}
                            <div>
                                <div className="text-xs font-semibold text-gray-600 mb-1">
                                    {sentPayloadLabel}
                                </div>
                                <Pre raw={entry.payload_xml ?? null} />
                            </div>
                            <div>
                                <div className="text-xs font-semibold text-gray-600 mb-1">
                                    Respuesta cruda
                                </div>
                                <Pre data={responseRaw} />
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

function Field({ label, value }: { label: string; value?: string | null }) {
    return (
        <div className="rounded-md border border-gray-200 px-2.5 py-1.5">
            <div className="text-[10px] uppercase tracking-wide text-gray-400">
                {label}
            </div>
            <div className="text-gray-800 break-all">{value || "—"}</div>
        </div>
    );
}

/* ── tab principal ─────────────────────────────────────────── */

export interface EditorLogsTabProps {
    sku: string;
    /** "ml" | "falabella" | "vtex" — resuelto del platform en EditorView. */
    marketplaceKey: string;
}

const PER_PAGE = 10;

export function EditorLogsTab({ sku, marketplaceKey }: EditorLogsTabProps) {
    const api = useEditorApi();
    // Falabella (fal_product_audit) y MercadoLibre (ml_event_log) tienen bitácora;
    // VTEX todavía no → empty-state.
    const hasBitacora = marketplaceKey === "falabella" || marketplaceKey === "ml";

    const [rows, setRows] = useState<EditorAuditEntry[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [selected, setSelected] = useState<EditorAuditEntry | null>(null);

    const load = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await api.fetchAuditLog(sku, {
                limit: 200,
                includePayload: true,
            });
            setRows(data);
            setPage(1);
        } catch (e) {
            setError((e as Error)?.message || "No se pudo cargar la bitácora.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (hasBitacora && sku) void load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sku, hasBitacora]);

    const columns: Column<EditorAuditEntry>[] = useMemo(
        () => [
            {
                header: "Fecha",
                accessorKey: "created_at",
                cell: (r) => (
                    <span className="text-sm tabular-nums">
                        {fmtFecha(r.created_at)}
                    </span>
                ),
            },
            {
                header: "Evento",
                accessorKey: "event_type",
                cell: (r) => {
                    const meta = eventMeta(
                        (r.event_type as BitacoraEventType | null) ?? null,
                        r.action,
                    );
                    return (
                        <span
                            className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-0.5 text-[11px] font-medium bg-gray-50 ring-1 ring-inset ${meta.ring} ${meta.text}`}
                        >
                            <meta.Icon className="w-3 h-3" />
                            {meta.label}
                        </span>
                    );
                },
            },
            {
                header: "Acción",
                accessorKey: "action",
                cell: (r) => <ActionBadge action={r.action} />,
            },
            {
                header: "Estado",
                accessorKey: "fala_status",
                cell: (r) => <FalaStatusBadge status={r.fala_status} />,
            },
            {
                header: "Usuario",
                accessorKey: "user_name",
                cell: (r) => (
                    <div className="leading-tight">
                        <div className="text-sm text-gray-900">
                            {r.user_name ||
                                (r.user_id != null ? `#${r.user_id}` : "—")}
                        </div>
                        {r.user_email && (
                            <div className="text-xs text-gray-500">
                                {r.user_email}
                            </div>
                        )}
                    </div>
                ),
            },
            {
                header: "Detalle",
                accessorKey: "id",
                cell: (r) => (
                    <button
                        type="button"
                        onClick={() => setSelected(r)}
                        className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
                    >
                        <span>Ver detalle</span>
                        <ChevronDownIcon className="h-4 w-4" />
                    </button>
                ),
            },
        ],
        [],
    );

    const totalPages = Math.max(1, Math.ceil(rows.length / PER_PAGE));
    const shown = rows.slice((page - 1) * PER_PAGE, page * PER_PAGE);

    // ── canales sin bitácora (ej. VTEX) ──
    if (!hasBitacora) {
        return (
            <div className="px-6 pt-6 pb-10">
                <div className="rounded-md bg-white border border-gray-200 p-6 text-center text-sm text-gray-500">
                    La bitácora no está disponible para este canal.
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="px-6 pt-6 pb-10">
                <div className="rounded-md bg-white border border-gray-200 p-6 text-center text-gray-500 text-sm">
                    <RefreshCw className="h-5 w-5 inline animate-spin mr-2" />
                    Cargando bitácora…
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="px-6 pt-6 pb-10">
                <div className="bg-rose-50 border-l-4 border-rose-400 p-4 text-rose-700 rounded-md">
                    <div className="flex">
                        <AlertTriangle className="h-5 w-5 text-rose-400" />
                        <div className="ml-3">
                            <h3 className="text-sm font-medium">
                                Error al cargar la bitácora
                            </h3>
                            <p className="mt-1 text-sm">{error}</p>
                            <button
                                onClick={() => void load()}
                                className="mt-3 rounded-md bg-rose-100 px-2 py-1.5 text-sm font-medium text-rose-800 hover:bg-rose-200"
                            >
                                Reintentar
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="px-6 pt-6 pb-10">
            {rows.length === 0 ? (
                <div className="rounded-md bg-white border border-gray-200 p-6 text-center text-sm text-gray-500">
                    Sin movimientos registrados para este SKU.
                </div>
            ) : (
                <>
                    <DataTable
                        data={shown}
                        columns={columns}
                        dataType="Bitácora"
                        statusKey="fala_status"
                        rowPaddingY={12}
                        rowBgClass="bg-white"
                    />
                    {totalPages > 1 && (
                        <Pagination
                            currentPage={page}
                            totalRecords={rows.length}
                            pageSize={PER_PAGE}
                            onPageChange={setPage}
                        />
                    )}
                </>
            )}

            {selected && (
                <EditorLogDetalleModal
                    entry={selected}
                    marketplaceKey={marketplaceKey}
                    onClose={() => setSelected(null)}
                />
            )}
        </div>
    );
}
