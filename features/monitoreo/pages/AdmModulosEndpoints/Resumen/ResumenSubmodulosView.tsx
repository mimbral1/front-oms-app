// views\MonitoreoView\AdmModulosEndpoints\Resumen\ResumenSubmodulosView.tsx

"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";
import type { Action, PageHeaderProps } from "@/components/layout/page-header";
import { ArrowPathIcon, CheckCircleIcon, ChevronRightIcon, XCircleIcon, PencilSquareIcon } from "@heroicons/react/24/outline";
import SaveOutlined from "@mui/icons-material/SaveOutlined";
import { useFetchWithAuth } from "@/lib/http/client";
import DataTableExpandable from "@/components/ui/table/DataTableExpandable";
import type { Column } from "@/components/ui/table";
import { toast } from "react-hot-toast";
import { ActionButton } from "@/components/ui/button/action-button";

/* ===== Tipos ===== */
type ApiEndpoint = { id: number; metodoHttp: string; path: string; target: string; activo: boolean; };
type ApiSubmodulo = {
    id: number; moduloId: number; nombre: string; codigo: string; descripcion: string | null; ruta: string; endpoints?: ApiEndpoint[];
};
type ApiResponse = { submodulos: ApiSubmodulo[]; count: number; };

type Row = { id: number; nombre: string; codigo: string; ruta: string; descripcion: string; endpoints: number; };

const LIST_PATH = "/monitoreo/adm-modulos-endpoints";

export default function ResumenSubmodulosView() {
    const router = useRouter();
    const params = useParams<{ id?: string }>();
    const moduloId = Number(params?.id ?? 0);
    const { fetchWithAuth } = useFetchWithAuth();

    const [rows, setRows] = useState<Row[]>([]);
    const [submods, setSubmods] = useState<ApiSubmodulo[]>([]);
    const [loading, setLoading] = useState(true);

    // fila expandida
    const [openId, setOpenId] = useState<number | null>(null);

    // --- Edición (modal) ---
    const [editSubmod, setEditSubmod] = useState<ApiSubmodulo | null>(null);
    const [editEndpoint, setEditEndpoint] = useState<ApiEndpoint | null>(null);
    const [savingEdit, setSavingEdit] = useState(false);

    // Helpers: abrir modales
    const onEditSubmodAsk = (id: number) => {
        const s = submods.find((x) => x.id === id) || null;
        setEditSubmod(s || null);
    };
    const onEditEndpointAsk = (endpointId: number) => {
        if (!selected?.endpoints) return;
        const e = selected.endpoints.find((x) => x.id === endpointId) || null;
        setEditEndpoint(e || null);
    };

    // Enviar PATCH: solo campos cambiados
    const submitEditSubmod = async (payload: Partial<ApiSubmodulo>) => {
        if (!editSubmod?.id) return;
        setSavingEdit(true);
        try {
            await fetchWithAuth(`idservice/submodulos/${editSubmod.id}`, {
                method: "PATCH",
                body: JSON.stringify(payload),
            });
            setEditSubmod(null);
            await fetchSubmods(); // recarga lista y mantiene el look and feel

            toast.success("Submódulo actualizado correctamente");
        } catch (err) {
            toast.error("No se pudo actualizar el submódulo");
        } finally {
            setSavingEdit(false);
        }
    };

    const submitEditEndpoint = async (payload: Partial<ApiEndpoint>) => {
        if (!editEndpoint?.id) return;
        setSavingEdit(true);
        try {
            await fetchWithAuth(`idservice/endpoints/patch/${editEndpoint.id}`, {
                method: "PATCH",
                body: JSON.stringify(payload),
            });
            setEditEndpoint(null);
            await fetchSubmods();

            toast.success("Endpoint actualizado correctamente");
        } catch (err) {
            toast.error("No se pudo actualizar el endpoint");
        } finally {
            setSavingEdit(false);
        }

    };

    const EndpointStatus = ({ active }: { active: boolean }) => (
        <span className={["inline-flex items-center justify-center rounded-full px-2.5 py-0.5 text-[11px] font-medium", active ? "bg-green-100 text-green-700" : "bg-gray-200 text-gray-600"].join(" ")}>
            {active ? "Activo" : "Inactivo"}
        </span>
    );
    const MethodBadge = ({ method }: { method: string }) => {
        const m = String(method || "").toUpperCase() as
            | "GET"
            | "POST"
            | "PUT"
            | "PATCH"
            | "DELETE";

        const cls =
            m === "GET"
                ? "bg-green-100 text-green-700 border-green-200"
                : m === "POST"
                    ? "bg-blue-100 text-blue-700 border-blue-200"
                    : m === "PUT"
                        ? "bg-violet-100 text-violet-700 border-violet-200" // lila
                        : m === "PATCH"
                            ? "bg-purple-100 text-purple-700 border-purple-200" // morado
                            : m === "DELETE"
                                ? "bg-red-100 text-red-700 border-red-200"
                                : "bg-gray-100 text-gray-700 border-gray-200";

        return (
            <span
                className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${cls}`}
            >
                {m}
            </span>
        );
    };


    const columns = useMemo<Column<Row>[]>(() => [
        { header: "Nombre", accessorKey: "nombre" },
        { header: "Código", accessorKey: "codigo" },
        { header: "Ruta", accessorKey: "ruta" },
        { header: "Descripción", accessorKey: "descripcion" },
        {
            header: "Endpoints",
            accessorKey: "endpoints",
            cell: (r) => (
                <div className="relative flex items-center justify-end">
                    {/* contador con ancho fijo */}
                    <span className="text-xs text-gray-600 mr-9 w-6 inline-block">
                        {r.endpoints}
                    </span>

                    {/* botón editar (lápiz) */}
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            onEditSubmodAsk(r.id);
                        }}
                        className="absolute right-6 top-1/2 -translate-y-1/2 inline-flex h-5 w-5 items-center justify-center text-gray-500 hover:text-blue-600"
                        title="Editar submódulo"
                    >
                        <PencilSquareIcon className="h-5 w-5" />
                    </button>

                    {/* chevron */}
                    <span className="absolute right-0 top-1/2 -translate-y-1/2 inline-flex w-5 justify-end">
                        <ChevronRightIcon
                            className={[
                                "h-5 w-5 transition-transform duration-200",
                                openId === r.id ? "rotate-90 text-blue-600" : "text-gray-500",
                            ].join(" ")}
                            aria-hidden
                        />
                    </span>
                </div>
            ),
        }
    ], [openId]);

    const fetchSubmods = useCallback(async () => {
        if (!moduloId) return;
        setLoading(true);
        try {
            const res = await fetchWithAuth<ApiResponse>(`idservice/detalle/${moduloId}?view=submodulos`);
            const list = Array.isArray(res?.submodulos) ? res.submodulos : [];
            const mapped: Row[] = list.map((s) => ({
                id: s.id,
                nombre: s.nombre ?? "",
                codigo: s.codigo ?? "",
                ruta: s.ruta ?? "",
                descripcion: s.descripcion ?? "",
                endpoints: Array.isArray(s.endpoints) ? s.endpoints.length : 0,
            }));
            setRows(mapped);
            setSubmods(list);
            setOpenId(null);
        } finally {
            setLoading(false);
        }
    }, [fetchWithAuth, moduloId]);

    useEffect(() => { void fetchSubmods(); }, [fetchSubmods]);

    const headerActions: Action[] = useMemo(() => [
        { label: "Aplicar", variant: "success", icon: <CheckCircleIcon className="h-5 w-5" />, onClick: () => { }, disabled: true },
        { label: "Guardar", variant: "success", icon: <SaveOutlined className="h-5 w-5" />, onClick: () => router.push(LIST_PATH), disabled: true },
        { label: "Volver al listado", variant: "secondary", icon: <XCircleIcon className="h-5 w-5" />, onClick: () => router.push(LIST_PATH) },
    ], [router]);

    usePageHeader(
        () => ({ title: (<div><div className="text-xs font-semibold uppercase text-blue-600 tracking-wider">Administración</div><div className="text-2xl font-semibold text-gray-900">Módulo #{moduloId} · Submódulos</div></div>), action: headerActions } as unknown as PageHeaderProps),
        [headerActions]
    );

    const selected = openId != null ? submods.find((s) => s.id === openId) : undefined;

    return (
        <div className="flex min-h-screen flex-col bg-[#e8eaf5]">
            <div className="flex-1">
                <div className="space-y-6">
                    <div className="bg-white rounded-xl border">
                        <div className="px-6 py-4">
                            <h2 className="text-xl font-semibold text-gray-900">Módulos · Submódulos</h2>
                            <p className="text-sm text-gray-500">Listado de submódulos asociados al módulo.</p>
                        </div>

                        <div className="px-6 pb-2">
                            {loading ? (
                                <table className="w-full border-collapse">
                                    <thead className="sr-only"><tr><th>Cargando…</th></tr></thead>
                                    <tbody>
                                        <tr>
                                            <td colSpan={8} className="px-4 py-6 text-center text-gray-500">
                                                <ArrowPathIcon className="h-5 w-5 inline animate-spin mr-2" />
                                                Cargando…
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            ) : rows.length === 0 ? (
                                <div className="px-4 py-8 text-center text-sm text-gray-500">
                                    Este módulo aún no tiene submódulos asociados.
                                </div>
                            ) : (
                                <DataTableExpandable<Row>
                                    data={rows}
                                    columns={columns}
                                    dataType="General"
                                    rowPaddingY={12}
                                    rowBgClass="bg-white"
                                    expandedId={openId}
                                    onToggle={(row) => setOpenId((prev) => (prev === row.id ? null : row.id))}
                                    getRowId={(row) => row.id}
                                    renderDetail={() => (
                                        <div className="rounded-lg border bg-gray-50">
                                            <div className="overflow-x-auto">
                                                {!selected || !selected.endpoints || selected.endpoints.length === 0 ? (
                                                    <div className="px-4 py-4 text-sm text-gray-500">Sin endpoints registrados.</div>
                                                ) : (
                                                    <table className="w-full table-fixed">
                                                        <thead>
                                                            <tr className="text-left text-xs text-gray-500">
                                                                <th className="w-24 px-3 py-2">Método</th>
                                                                <th className="px-3 py-2">Path</th>
                                                                <th className="px-3 py-2">Target</th>
                                                                <th className="w-24 px-3 py-2">Estado</th>
                                                                <th className="w-10 px-3 py-2 text-right"> </th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="text-sm text-gray-700">
                                                            {selected.endpoints.map((e) => (
                                                                <tr key={e.id} className="border-t">
                                                                    <td className="px-3 py-2 align-top"><MethodBadge method={e.metodoHttp} /></td>
                                                                    <td className="px-3 py-2 align-top font-mono text-[13px] break-all">{e.path}</td>
                                                                    <td className="px-3 py-2 align-top font-mono text-[13px] break-all">{e.target}</td>
                                                                    <td className="px-3 py-2 align-top"><EndpointStatus active={!!e.activo} /></td>
                                                                    <td className="px-3 py-2 align-top text-right">
                                                                        <button
                                                                            type="button"
                                                                            // onClick={(e) => {
                                                                            //     e.stopPropagation();
                                                                            //     onEditEndpointAsk(e as any); // ver nota: usamos el id del endpoint
                                                                            // }}
                                                                            onClick={(ev) => { ev.stopPropagation(); onEditEndpointAsk(e.id); }}
                                                                            className="inline-flex h-5 w-5 items-center justify-center text-gray-500 hover:text-blue-600"
                                                                            title="Editar endpoint"
                                                                        >
                                                                            <PencilSquareIcon className="h-5 w-5" />
                                                                        </button>
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                />
                            )}
                        </div>

                        {/* ===== MODAL: Editar Submódulo ===== */}
                        {editSubmod && (
                            <div className="fixed inset-0 z-[100] flex items-center justify-center">
                                <div className="absolute inset-0 bg-black/40" onClick={() => setEditSubmod(null)} aria-hidden />
                                <div className="relative z-[101] w-full max-w-2xl rounded-xl bg-white shadow-2xl">
                                    <div className="px-6 py-4 border-b">
                                        <div className="text-lg font-semibold text-gray-900">Editar submódulo</div>
                                        <div className="text-xs text-gray-500">Modifica solo los campos necesarios. Se enviarán únicamente los campos cambiados.</div>
                                    </div>

                                    <ModalEditSubmodContent
                                        initial={editSubmod}
                                        saving={savingEdit}
                                        onCancel={() => setEditSubmod(null)}
                                        onSubmit={(patch) => submitEditSubmod(patch)}
                                    />
                                </div>
                            </div>
                        )}

                        {/* ===== MODAL: Editar Endpoint ===== */}
                        {editEndpoint && (
                            <div className="fixed inset-0 z-[100] flex items-center justify-center">
                                <div className="absolute inset-0 bg-black/40" onClick={() => setEditEndpoint(null)} aria-hidden />
                                <div className="relative z-[101] w-full max-w-2xl rounded-xl bg-white shadow-2xl">
                                    <div className="px-6 py-4 border-b">
                                        <div className="text-lg font-semibold text-gray-900">Editar endpoint</div>
                                        <div className="text-xs text-gray-500">Modifica solo los campos necesarios. Se enviarán únicamente los campos cambiados.</div>
                                    </div>

                                    <ModalEditEndpointContent
                                        initial={editEndpoint}
                                        saving={savingEdit}
                                        onCancel={() => setEditEndpoint(null)}
                                        onSubmit={(patch) => submitEditEndpoint(patch)}
                                    />
                                </div>
                            </div>
                        )}

                    </div>
                </div>
            </div>
        </div>
    );
}

// ===== Componentes internos: contenidos de modal (estilo ApiKeyView) =====

function ModalEditSubmodContent({
    initial,
    saving,
    onCancel,
    onSubmit,
}: {
    initial: { id: number; nombre: string; codigo: string; ruta: string; descripcion: string | null };
    saving: boolean;
    onCancel: () => void;
    onSubmit: (patch: Partial<{ nombre: string; codigo: string; ruta: string; descripcion: string | null }>) => void;
}) {
    const [form, setForm] = useState({
        nombre: initial.nombre ?? "",
        codigo: initial.codigo ?? "",
        ruta: initial.ruta ?? "",
        descripcion: initial.descripcion ?? "",
    });

    const patch: any = {};
    if (form.nombre !== (initial.nombre ?? "")) patch.nombre = form.nombre;
    if (form.codigo !== (initial.codigo ?? "")) patch.codigo = form.codigo;
    if (form.ruta !== (initial.ruta ?? "")) patch.ruta = form.ruta;
    if ((form.descripcion ?? "") !== (initial.descripcion ?? "")) patch.descripcion = form.descripcion;

    return (
        <>
            <div className="p-6">
                <div className="grid grid-cols-6 gap-4">
                    <span className="col-span-1 text-sm text-gray-600 font-bold">Nombre</span>
                    <div className="col-span-5">
                        <input
                            className="w-full border-b border-gray-300 bg-transparent text-sm outline-none"
                            value={form.nombre}
                            onChange={(e) => setForm((p) => ({ ...p, nombre: e.target.value }))}
                            placeholder="Nombre del submódulo"
                        />
                    </div>

                    <span className="col-span-1 text-sm text-gray-600 font-bold">Código</span>
                    <div className="col-span-5">
                        <input
                            className="w-full border-b border-gray-300 bg-transparent text-sm outline-none"
                            value={form.codigo}
                            onChange={(e) => setForm((p) => ({ ...p, codigo: e.target.value }))}
                            placeholder="SUBMOD_CODE"
                        />
                    </div>

                    <span className="col-span-1 text-sm text-gray-600 font-bold">Ruta</span>
                    <div className="col-span-5">
                        <input
                            className="w-full border-b border-gray-300 bg-transparent text-sm outline-none"
                            value={form.ruta}
                            onChange={(e) => setForm((p) => ({ ...p, ruta: e.target.value }))}
                            placeholder="/submod/route"
                        />
                    </div>

                    <span className="col-span-1 text-sm text-gray-600 font-bold">Descripción</span>
                    <div className="col-span-5">
                        <textarea
                            className="w-full border rounded-md border-gray-300 bg-transparent text-sm outline-none px-2 py-1"
                            value={form.descripcion ?? ""}
                            onChange={(e) => setForm((p) => ({ ...p, descripcion: e.target.value }))}
                            rows={3}
                        />
                    </div>
                </div>
            </div>

            <div className="px-6 py-4 border-t flex items-center justify-end gap-2">
                <ActionButton variant="secondary" onClick={onCancel}>
                    Cancelar
                </ActionButton>
                <ActionButton
                    variant="primary"
                    onClick={() => onSubmit(patch)}
                    disabled={saving || Object.keys(patch).length === 0}
                >
                    {saving ? "Guardando…" : "Guardar"}
                </ActionButton>
            </div>
        </>
    );
}

function ModalEditEndpointContent({
    initial,
    saving,
    onCancel,
    onSubmit,
}: {
    initial: { id: number; metodoHttp: string; path: string; target: string; activo: boolean };
    saving: boolean;
    onCancel: () => void;
    onSubmit: (patch: Partial<{ metodoHttp: string; path: string; target: string; activo: boolean }>) => void;
}) {
    const [form, setForm] = useState({
        metodoHttp: (initial.metodoHttp || "GET").toUpperCase(),
        path: initial.path ?? "",
        target: initial.target ?? "",
        activo: !!initial.activo,
    });

    const patch: any = {};
    if (form.metodoHttp !== (initial.metodoHttp || "")) patch.metodoHttp = form.metodoHttp;
    if (form.path !== (initial.path ?? "")) patch.path = form.path;
    if (form.target !== (initial.target ?? "")) patch.target = form.target;
    if (Boolean(form.activo) !== Boolean(initial.activo)) patch.activo = form.activo;

    return (
        <>
            <div className="p-6">
                <div className="grid grid-cols-6 gap-4">
                    <span className="col-span-1 text-sm text-gray-600 font-bold">Método</span>
                    <div className="col-span-5">
                        <select
                            className="w-40 rounded-md border border-gray-300 bg-white px-2 py-1 text-sm"
                            value={form.metodoHttp}
                            onChange={(e) => setForm((p) => ({ ...p, metodoHttp: e.target.value }))}
                        >
                            {["GET", "POST", "PUT", "PATCH", "DELETE"].map((m) => (
                                <option key={m} value={m}>{m}</option>
                            ))}
                        </select>
                    </div>

                    <span className="col-span-1 text-sm text-gray-600 font-bold">Path</span>
                    <div className="col-span-5">
                        <input
                            className="w-full border-b border-gray-300 bg-transparent text-sm outline-none"
                            value={form.path}
                            onChange={(e) => setForm((p) => ({ ...p, path: e.target.value }))}
                            placeholder="/api/v1/endpoint"
                        />
                    </div>

                    <span className="col-span-1 text-sm text-gray-600 font-bold">Target</span>
                    <div className="col-span-5">
                        <input
                            className="w-full border-b border-gray-300 bg-transparent text-sm outline-none"
                            value={form.target}
                            onChange={(e) => setForm((p) => ({ ...p, target: e.target.value }))}
                            placeholder="http://service:3000/..."
                        />
                    </div>

                    <span className="col-span-1 text-sm text-gray-600 font-bold">Activo</span>
                    <div className="col-span-5">
                        <label className="inline-flex items-center gap-2">
                            <input
                                type="checkbox"
                                className="h-4 w-4"
                                checked={!!form.activo}
                                onChange={(e) => setForm((p) => ({ ...p, activo: e.target.checked }))}
                            />
                            <span className="text-xs text-gray-600">Activo</span>
                        </label>
                    </div>
                </div>
            </div>

            <div className="px-6 py-4 border-t flex items-center justify-end gap-2">
                <ActionButton variant="secondary" onClick={onCancel}>
                    Cancelar
                </ActionButton>
                <ActionButton
                    variant="primary"
                    onClick={() => onSubmit(patch)}
                    disabled={saving || Object.keys(patch).length === 0}
                >
                    {saving ? "Guardando…" : "Guardar"}
                </ActionButton>
            </div>
        </>
    );
}
