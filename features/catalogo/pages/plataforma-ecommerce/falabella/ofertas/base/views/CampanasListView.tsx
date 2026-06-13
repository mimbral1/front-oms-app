// Lista de campañas de ofertas Falabella + creación inline.
// Falabella no tiene API de campañas: cada campaña es un constructo nuestro que
// al activarse aplica precio especial (SpecialPrice + vigencia) por SKU.

"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Clock, Flag, Plus, RefreshCw, Tag } from "lucide-react";

import { ActionButton, Input } from "@/components/ui";
import { Tabs, type TabItem } from "@/components/ui/tabs";
import { DataTable, type Column } from "@/components/ui/table";
import { FieldRow } from "../../../../_shared/ui/FieldRow";
import { EcommercePageHeader } from "../../../../_shared/ui";
import { useEcommercePlatform } from "@/app/catalogo/plataforma-ecommerce/_shared/ecommerce-platform-context";
import { useCampanasApi } from "../api/campanas-api";
import { CampanaStatusPill } from "../components/CampanaStatusPill";
import { fmtFecha } from "../helpers/format";
import type { Campana, CampanaStatus } from "../types/campana-types";

// Activas = lo vigente / por venir. Finalizadas = lo terminado (incl. error).
const ACTIVAS_STATUS = new Set<CampanaStatus>(["draft", "scheduled", "active", "finishing"]);
type ListTab = "activas" | "finalizadas";

export function CampanasListView() {
    const platform = useEcommercePlatform();
    const router = useRouter();
    const api = useCampanasApi();

    const [rows, setRows] = useState<Campana[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [saving, setSaving] = useState(false);
    const [tab, setTab] = useState<ListTab>("activas");

    // Form state
    const [nombre, setNombre] = useState("");
    const [descripcion, setDescripcion] = useState("");
    const [descuento, setDescuento] = useState("");
    const [desde, setDesde] = useState("");
    const [hasta, setHasta] = useState("");

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            setRows(await api.list());
        } catch (e: any) {
            setError(e?.message || "No se pudieron cargar las campañas");
        } finally {
            setLoading(false);
        }
    }, [api]);

    useEffect(() => {
        load();
    }, [load]);

    const goToDetail = useCallback(
        (c: Campana) => router.push(`${platform.basePath}/ofertas/${encodeURIComponent(c.id)}`),
        [platform.basePath, router],
    );

    const handleCreate = useCallback(async () => {
        if (!nombre.trim() || !desde || !hasta) {
            setError("Nombre, inicio y fin son obligatorios");
            return;
        }
        setSaving(true);
        setError(null);
        try {
            const created = await api.create({
                nombre: nombre.trim(),
                descripcion: descripcion.trim() || undefined,
                discount_pct: descuento ? Number(descuento) : null,
                starts_at: desde,
                ends_at: hasta,
            });
            setShowForm(false);
            setNombre(""); setDescripcion(""); setDescuento(""); setDesde(""); setHasta("");
            goToDetail(created);
        } catch (e: any) {
            setError(e?.message || "No se pudo crear la campaña");
        } finally {
            setSaving(false);
        }
    }, [api, nombre, descripcion, descuento, desde, hasta, goToDetail]);

    const activas = useMemo(() => rows.filter((c) => ACTIVAS_STATUS.has(c.status)), [rows]);
    const finalizadas = useMemo(() => rows.filter((c) => !ACTIVAS_STATUS.has(c.status)), [rows]);
    const visibleRows = tab === "activas" ? activas : finalizadas;

    const tabs: TabItem[] = [
        { id: "activas", label: "Activas", icon: Flag, badgeCount: activas.length },
        { id: "finalizadas", label: "Finalizadas", icon: Clock, badgeCount: finalizadas.length },
    ];

    const columns: Column<Campana>[] = [
        { header: "Campaña", accessorKey: "nombre", cell: (c) => (
            <div className="min-w-0">
                <div className="font-semibold text-gray-800 truncate">{c.nombre}</div>
                {c.descripcion ? <div className="text-xs text-gray-500 truncate">{c.descripcion}</div> : null}
            </div>
        ) },
        { header: "Estado", accessorKey: "status", cell: (c) => <CampanaStatusPill status={c.status} /> },
        { header: "Vigencia", accessorKey: "starts_at", cell: (c) => (
            <span className="text-xs text-gray-600 tabular-nums">{fmtFecha(c.starts_at)} → {fmtFecha(c.ends_at)}</span>
        ) },
        { header: "Descuento", accessorKey: "discount_pct", cell: (c) => (
            c.discount_pct != null ? <span className="font-medium text-gray-700">-{c.discount_pct}%</span> : <span className="text-gray-400">—</span>
        ) },
        { header: "SKUs", accessorKey: "items_count", cell: (c) => (
            <span className="tabular-nums text-gray-700">{c.items_count ?? 0}</span>
        ) },
    ];

    return (
        <div className="flex flex-col min-h-[calc(100vh-120px)]">
            <EcommercePageHeader
                eyebrow={`${platform.name} · Ofertas`}
                title="Campañas de ofertas"
                badge={!loading && rows.length > 0 ? { label: `${rows.length} campañas`, tone: "live" } : undefined}
                actions={
                    <>
                        <ActionButton variant="secondary" size="sm" onClick={load} disabled={loading}>
                            <RefreshCw className="w-4 h-4" />
                            {loading ? "Cargando…" : "Refrescar"}
                        </ActionButton>
                        <ActionButton variant="primary" size="sm" onClick={() => setShowForm((s) => !s)}>
                            <Plus className="w-4 h-4" />
                            Nueva campaña
                        </ActionButton>
                    </>
                }
            />

            <div className="bg-white px-6 border-b border-gray-200">
                <Tabs tabs={tabs} value={tab} onChange={(id) => setTab(id as ListTab)} />
            </div>

            <div className="flex-1 bg-gray-100 px-6 py-6 space-y-4">
                {error && (
                    <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">{error}</div>
                )}

                {showForm && (
                    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                        <div className="flex items-center gap-2 mb-3 text-gray-700">
                            <Tag className="w-4 h-4" />
                            <h3 className="font-semibold text-sm">Nueva campaña</h3>
                        </div>
                        <div className="divide-y divide-gray-100">
                            <FieldRow label="Nombre *">
                                <Input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej: Cyber Mimbral" />
                            </FieldRow>
                            <FieldRow label="Descripción">
                                <Input value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />
                            </FieldRow>
                            <FieldRow label="Descuento global (%)">
                                <Input type="number" min={1} max={99} value={descuento} onChange={(e) => setDescuento(e.target.value)} placeholder="opcional" />
                            </FieldRow>
                            <FieldRow label="Inicio *">
                                <Input type="datetime-local" value={desde} onChange={(e) => setDesde(e.target.value)} />
                            </FieldRow>
                            <FieldRow label="Fin *">
                                <Input type="datetime-local" value={hasta} onChange={(e) => setHasta(e.target.value)} />
                            </FieldRow>
                        </div>
                        <div className="mt-4 flex justify-end gap-2">
                            <ActionButton variant="secondary" size="sm" onClick={() => setShowForm(false)} disabled={saving}>Cancelar</ActionButton>
                            <ActionButton variant="primary" size="sm" onClick={handleCreate} disabled={saving}>
                                {saving ? "Creando…" : "Crear campaña"}
                            </ActionButton>
                        </div>
                    </div>
                )}

                {loading ? (
                    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
                        <CampanasSkeleton rows={5} />
                    </div>
                ) : visibleRows.length === 0 && !showForm ? (
                    <div className="rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center text-gray-500">
                        {rows.length === 0
                            ? "No hay campañas todavía. Crea una con “Nueva campaña”."
                            : tab === "activas"
                                ? "No hay campañas activas."
                                : "No hay campañas finalizadas."}
                    </div>
                ) : (
                    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
                        <DataTable
                            data={visibleRows}
                            columns={columns}
                            onRowClick={goToDetail}
                            showStatusBorder={false}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}

/** Skeleton de carga — filas grises animadas mientras se cargan las campañas. */
function CampanasSkeleton({ rows }: { rows: number }) {
    const headCell =
        "px-2 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500";
    const widths = ["w-48", "w-20", "w-40", "w-16", "w-10"];
    return (
        <table className="w-full table-auto border-collapse">
            <thead className="bg-[#E8EAF7]">
                <tr>
                    <th className={headCell}>Campaña</th>
                    <th className={headCell}>Estado</th>
                    <th className={headCell}>Vigencia</th>
                    <th className={headCell}>Descuento</th>
                    <th className={headCell}>SKUs</th>
                </tr>
            </thead>
            <tbody>
                {Array.from({ length: rows }).map((_, i) => (
                    <tr key={i} className="border-b border-gray-100 last:border-b-0 animate-pulse">
                        {widths.map((w, c) => (
                            <td key={c} className="px-2 py-3 align-middle">
                                <div className={`h-4 ${w} rounded bg-gray-200`} />
                            </td>
                        ))}
                    </tr>
                ))}
            </tbody>
        </table>
    );
}
