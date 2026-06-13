// views\Almacen\Gestion\SolicitudTraslado\Componentes\SolicitudTrasladoFieldsResumen.tsx

"use client";

import Card from "@/components/ui/card/Card";
import { fmtDateTime } from "@/lib/format/date";
import {
    ClipboardDocumentListIcon,
    ListBulletIcon,
} from "@heroicons/react/24/outline";
import { CalendarIcon } from "lucide-react";

/* ---------- Tipos ---------- */
interface InventoryDocHeader {
    id: number | string;
    docType: string;
    fromWarehouseCode: string | null;
    toWarehouseCode: string | null;
    postingDate: string;
    reference: string;
    metaJson: string;
    status: string;
    externalRef: string;
    sapDocEntry: number | null;
    sapDocNum: number | null;
    sapSeries: number | null;
    createdAt: string;
    updatedAt: string;
}

interface InventoryDocLine {
    id: number;
    documentId: number;
    itemSku: string;
    fromWarehouseCode: string | null;
    toWarehouseCode: string | null;
    quantity: number;
    movementId: number;
    poDocEntry: number | null;
    poLineNum: number | null;
    createdAt: string;
    updatedAt: string;
}

export interface InventoryDocRecord {
    header: InventoryDocHeader;
    lines: InventoryDocLine[];
}

/* ---------- Helpers ---------- */
const formatDateTime = fmtDateTime;

const parseMetaJson = (raw?: string) => {
    if (!raw) return null;
    try {
        return JSON.parse(raw);
    } catch {
        return null;
    }
};

const mapTypeToEs = (raw?: string) => {
    const t = String(raw || "").trim().toLowerCase();
    if (t === "internaldistribution") return "Distribucion interna";
    if (t === "replenishment") return "Reposicion";
    if (t === "picking") return "Picking";
    if (t === "ingress" || t === "ingreso") return "Ingreso";
    return raw || "-";
};

const mapStatusToEs = (raw?: string) => {
    const s = String(raw || "").trim().toLowerCase();
    if (s === "pending") return "Pendiente";
    if (s === "queued") return "En cola";
    if (s === "started") return "Iniciado";
    if (s === "ended" || s === "posted") return "Finalizado";
    if (s === "rejected") return "Rechazado";
    if (s === "canceled" || s === "cancelled") return "Cancelado";
    return raw || "-";
};

/* ---------- Fields ---------- */
export function TrasladosFieldsResumen({ record }: { record: InventoryDocRecord }) {
    const { header, lines } = record;

    const parsedMeta = parseMetaJson(header.metaJson);

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-7">

                {/* ===================== IZQUIERDA ===================== */}
                <div className="lg:col-span-4 space-y-6">

                    {/* ===== DETALLE ===== */}
                    <Card
                        title="DETALLE"
                        icon={ClipboardDocumentListIcon}
                        noDefaultStyles
                        hasTitleDivider
                        className="rounded-xl p-6"
                    >
                        <div className="grid grid-cols-6 gap-4 text-sm">
                            <span className="col-span-1 font-bold text-gray-600">ID</span>
                            <div className="col-span-5">{header.externalRef || header.id}</div>

                            <span className="col-span-1 font-bold text-gray-600">Tipo</span>
                            <div className="col-span-5">{mapTypeToEs(header.docType)}</div>

                            <span className="col-span-1 font-bold text-gray-600">Origen</span>
                            <div className="col-span-5">{header.fromWarehouseCode ?? "—"}</div>

                            <span className="col-span-1 font-bold text-gray-600">Destino</span>
                            <div className="col-span-5">{header.toWarehouseCode ?? "—"}</div>

                            <span className="col-span-1 font-bold text-gray-600">Fecha</span>
                            <div className="col-span-5">{formatDateTime(header.postingDate)}</div>

                            <span className="col-span-1 font-bold text-gray-600">Referencia</span>
                            <div className="col-span-5">{header.reference}</div>

                            <span className="col-span-1 font-bold text-gray-600">Estado</span>
                            <div className="col-span-5">{mapStatusToEs(header.status)}</div>

                            {/* <span className="col-span-1 font-bold text-gray-600">External Ref</span>
                            <div className="col-span-5">{header.externalRef}</div>
                            */}
                        </div>
                    </Card>

                    {/* ===== LÍNEAS ===== */}
                    <Card
                        title="LÍNEAS"
                        icon={ListBulletIcon}
                        noDefaultStyles
                        hasTitleDivider
                        className="rounded-xl p-6"
                    >
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-sm">
                                <thead className="border-b text-gray-500">
                                    <tr>
                                        <th className="py-2 text-left">SKU</th>
                                        <th className="py-2 text-left">Origen</th>
                                        <th className="py-2 text-left">Destino</th>
                                        <th className="py-2 text-right w-32">Cantidad</th>
                                        <th className="py-2 text-right w-40">Movimiento</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {lines.map((l) => (
                                        <tr key={l.id} className="border-b last:border-b-0">
                                            <td className="py-2">{l.itemSku}</td>
                                            <td className="py-2">{l.fromWarehouseCode ?? "—"}</td>
                                            <td className="py-2">{l.toWarehouseCode ?? "—"}</td>
                                            <td className="py-2 text-right tabular-nums w-32">
                                                {l.quantity}
                                            </td>
                                            <td className="py-2 text-right tabular-nums w-40">
                                                {l.movementId}
                                            </td>

                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>

                    {/* ===== META JSON ===== */}
                    <Card
                        title="META JSON"
                        icon={ClipboardDocumentListIcon}
                        noDefaultStyles
                        hasTitleDivider
                        className="rounded-xl p-6"
                    >
                        <div className="space-y-4 text-sm text-gray-700">
                            <div>
                                <div className="text-xs font-semibold text-gray-600 mb-2">JSON formateado</div>
                                <pre className="w-full rounded-md border bg-slate-900 text-slate-100 p-3 text-xs overflow-auto min-h-[320px] max-h-[520px]">
                                    {parsedMeta ? JSON.stringify(parsedMeta, null, 2) : (header.metaJson || "{}")}
                                </pre>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* ===================== DERECHA ===================== */}
                <div className="lg:col-span-3 space-y-6">

                    <Card
                        title="SAP"
                        noDefaultStyles
                        hasTitleDivider
                        className="rounded-xl p-6"
                    >
                        <div className="grid grid-cols-4 gap-4 text-sm">
                            <span className="col-span-1 font-bold text-gray-600">DocEntry</span>
                            <span className="col-span-3">{header.sapDocEntry ?? "—"}</span>

                            <span className="col-span-1 font-bold text-gray-600">DocNum</span>
                            <span className="col-span-3">{header.sapDocNum ?? "—"}</span>

                            <span className="col-span-1 font-bold text-gray-600">Serie</span>
                            <span className="col-span-3">{header.sapSeries ?? "—"}</span>
                        </div>
                    </Card>

                    <Card
                        title="FECHAS"
                        icon={CalendarIcon}
                        noDefaultStyles
                        hasTitleDivider
                        className="rounded-xl p-6"
                    >
                        <div className="grid grid-cols-4 gap-4 text-sm">
                            <span className="col-span-1 font-bold text-gray-600">Creado:</span>
                            <span className="col-span-3">{formatDateTime(header.createdAt) ?? "—"}</span>
                            <span className="col-span-1 font-bold text-gray-600">Actualizado:</span>
                            <span className="col-span-3">{formatDateTime(header.updatedAt) ?? "—"}</span>
                        </div>
                    </Card>

                </div>
            </div>
        </div>
    );
}
