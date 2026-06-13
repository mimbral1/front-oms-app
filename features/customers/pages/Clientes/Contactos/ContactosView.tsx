"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";
import type { Action, PageHeaderProps } from "@/components/layout/page-header";
import { DataTable, type Column } from "@/components/ui/table";
import { ArrowPathIcon, PlusIcon } from "@heroicons/react/24/outline";
import { useCustomer } from "../hooks/useCustomer";
import { exportToCsv } from "@/components/presets/export/export";
import { ActionButton } from "@/components/ui/button/action-button";

import {
    // agrega estas funciones en customers.tsx (bloques más abajo)
    customerContactsGet,
    customerContactPost,
    customerContactPut,
    // (opcional) customerContactDelete, si luego te dan endpoint
} from "@/app/fetchWithAuth/api-clientes/clientes/customers";

// ===== Config =====
const PER_PAGE = 20;
type Estado = "Activo" | "Inactivo";
const getStatusColor = (s: Estado) => (s === "Activo" ? "bg-green-500" : "bg-gray-400");

// ===== Tipos UI =====
type ContactRow = {
    contactCode: string;
    name: string;
    position: string;
    email: string;
    phone1?: string | null;
    phone2?: string | null;
    mobile?: string | null;
    remarks?: string | null;
    status: Estado;
};

// ===== Columnas (paridad con Direcciones) =====
const columns = (onDeleteAsk?: (row: ContactRow) => void): Column<ContactRow>[] => [
    { header: "CÓDIGO", accessorKey: "contactCode" },
    { header: "NOMBRE", accessorKey: "name" },
    { header: "CARGO", accessorKey: "position", cell: (r) => r.position || "—" },
    { header: "EMAIL", accessorKey: "email", cell: (r) => r.email || "—" },
    { header: "TEL 1", accessorKey: "phone1", cell: (r) => r.phone1 || "—" },
    { header: "TEL 2", accessorKey: "phone2", cell: (r) => r.phone2 || "—" },
    { header: "MÓVIL", accessorKey: "mobile", cell: (r) => r.mobile || "—" },
    { header: "OBS", accessorKey: "remarks", cell: (r) => r.remarks || "—" },
    {
        header: "ESTADO",
        accessorKey: "status",
        cell: (r) => (
            <span
                className={`inline-flex items-center justify-center rounded-full px-4 py-1 text-xs font-medium text-white ${getStatusColor(
                    r.status
                )}`}
            >
                {r.status}
            </span>
        ),
    },
    // Si más adelante habilitas eliminar contacto, descomenta este bloque:
    // {
    //   header: "",
    //   accessorKey: "contactCode",
    //   cell: (r) => (
    //     <button
    //       onClick={(e) => {
    //         e.stopPropagation();
    //         onDeleteAsk?.(r);
    //       }}
    //       title="Eliminar contacto"
    //       className="ml-2 inline-flex items-center rounded-md px-2 py-1 text-red-600 hover:bg-red-50"
    //     >
    //       <TrashIcon className="h-5 w-5" />
    //     </button>
    //   ),
    // },
];

export default function CustomerContactosView() {
    const params = useParams<{ id: string }>();
    const recordId = Array.isArray(params?.id) ? params!.id[0] : params?.id;

    // Header (idéntico a Direcciones): nombre/estado desde SWR semilla de Resumen
    const { data: headerCustomer } = useCustomer(recordId, { revalidateOnMount: false });
    const headerName =
        `${headerCustomer?.FirstName ?? ""} ${headerCustomer?.LastName ?? ""}`.trim() || "Contactos";
    const headerActive = headerCustomer?.IsActive ?? null;

    // Tabla
    const [rows, setRows] = useState<ContactRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);

    // Paginación local (mismo patrón)
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0);
    const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(n, max));

    // ========== Modal Crear/Editar ==========
    type EditForm = {
        contactCode: string;
        name: string;
        position: string;
        eMail: string; // ojo: backend usa eMail en lowerCamelCase con M mayúscula
        phone1: string;
        phone2: string;
        mobile: string;
        remarks: string;
        isActive: boolean;
    };

    const emptyForm: EditForm = {
        contactCode: "",
        name: "",
        position: "",
        eMail: "",
        phone1: "",
        phone2: "",
        mobile: "",
        remarks: "",
        isActive: true,
    };

    const [openEdit, setOpenEdit] = useState(false);
    const [openCreate, setOpenCreate] = useState(false);
    const [form, setForm] = useState<EditForm>(emptyForm);
    const [saving, setSaving] = useState(false);
    const [formErrors, setFormErrors] = useState<Partial<Record<keyof EditForm, string>>>({});
    const [formErrorMsg, setFormErrorMsg] = useState<string | null>(null);

    // ====== Cargar listado ======
    const fetchList = useCallback(async () => {
        if (!recordId) return;
        setLoading(true);
        setNotFound(false);
        try {
            const data = await customerContactsGet(recordId);
            // El endpoint devuelve PascalCase (Name, EMail, Phone1...), lo mapeamos
            const mapped: ContactRow[] = (Array.isArray(data) ? data : []).map((d: any) => ({
                contactCode: d?.ContactCode ?? "",
                name: d?.Name ?? "",
                position: d?.Position ?? "",
                email: d?.EMail ?? "",
                phone1: d?.Phone1 ?? null,
                phone2: d?.Phone2 ?? null,
                mobile: d?.Mobile ?? null,
                remarks: d?.Remarks ?? null,
                status: d?.IsActive ? "Activo" : "Inactivo",
            }));

            setRows(mapped);
            setTotalRecords(mapped.length);
            setTotalPages(Math.max(1, Math.ceil(mapped.length / PER_PAGE)));
            setCurrentPage(1);
        } catch (e) {
            console.error("Error listando contactos:", e);
            setRows([]);
            setTotalRecords(0);
            setTotalPages(1);
            setNotFound(true);
        } finally {
            setLoading(false);
        }
    }, [recordId]);

    useEffect(() => {
        fetchList();
    }, [fetchList]);

    // Export CSV (idéntico patrón)
    const handleExport = useCallback(() => {
        if (rows.length === 0) return;
        const headers = ["Código", "Nombre", "Cargo", "Email", "Tel 1", "Tel 2", "Móvil", "Obs", "Estado"];
        const data = rows.map((r) => [
            r.contactCode,
            r.name,
            r.position,
            r.email,
            r.phone1 ?? "",
            r.phone2 ?? "",
            r.mobile ?? "",
            r.remarks ?? "",
            r.status,
        ]);
        exportToCsv("contactos.csv", [headers, ...data]);
    }, [rows]);

    // Validación mínima (requeridos del POST/PUT que nos diste)
    function validateForm(f: EditForm) {
        const errs: Partial<Record<keyof EditForm, string>> = {};
        if (!f.contactCode?.trim()) errs.contactCode = "Requerido";
        if (!f.name?.trim()) errs.name = "Requerido";
        if (!f.eMail?.trim()) errs.eMail = "Requerido";
        return errs;
    }

    // Header actions (mismo estilo que Direcciones)
    const headerActions: Action[] = useMemo(
        () => [
            {
                label: "Nuevo contacto",
                variant: "success",
                icon: <PlusIcon className="h-5 w-5" />,
                onClick: () => {
                    setForm({ ...emptyForm });
                    setFormErrors({});
                    setFormErrorMsg(null);
                    setOpenCreate(true);
                },
            },
            // { label: "Exportar", variant: "primary", icon: <ArrowDownTrayIcon className="h-5 w-5" />, onClick: handleExport },
            {
                label: "Actualizar",
                variant: "secondary",
                icon: <ArrowPathIcon className="h-5 w-5" />,
                onClick: () => {
                    setCurrentPage(1);
                    fetchList();
                },
            },
        ],
        [fetchList, handleExport]
    );

    usePageHeader(
        () =>
        ({
            title: (
                <div>
                    <div className="text-xs font-semibold uppercase tracking-wider text-blue-600">Clientes</div>
                    <div className="text-2xl font-semibold text-gray-900">{headerName}</div>
                </div>
            ),
            action: headerActions,
            status:
                headerActive === null
                    ? undefined
                    : { text: headerActive ? "Activo" : "Inactivo", variant: headerActive ? "success" : "warning" },
        } as PageHeaderProps),
        [headerName, headerActive, headerActions]
    );

    // Click fila -> abrir modal edición (paridad con Direcciones)
    const onRowClick = useCallback(
        (r: ContactRow) => {
            setForm({
                contactCode: r.contactCode,
                name: r.name,
                position: r.position || "",
                eMail: r.email || "",
                phone1: r.phone1 || "",
                phone2: r.phone2 || "",
                mobile: r.mobile || "",
                remarks: r.remarks || "",
                isActive: r.status === "Activo",
            });
            setFormErrors({});
            setFormErrorMsg(null);
            setOpenEdit(true);
        },
        []
    );

    // Guardar edición (PUT lowerCamelCase)
    const submitEdit = useCallback(async () => {
        const errs = validateForm(form);
        setFormErrors(errs);
        setFormErrorMsg(null);
        if (Object.keys(errs).length > 0) return;
        if (!recordId) return;

        try {
            setSaving(true);
            await customerContactPut(recordId, {
                contactCode: form.contactCode,
                name: form.name,
                position: form.position,
                eMail: form.eMail,
                phone1: form.phone1 || undefined,
                phone2: form.phone2 || undefined,
                mobile: form.mobile || undefined,
                remarks: form.remarks || undefined,
                isActive: form.isActive,
            });
            setOpenEdit(false);
            await fetchList();
        } catch (e: any) {
            console.error("No se pudo actualizar el contacto:", e);
            const { code, message } = parseApiError(e);

            if (code === "CONTACT_EXISTS") {
                setFormErrors((prev) => ({ ...prev, contactCode: "Ya existe un contacto con este código." }));
            }

            setFormErrorMsg(message);
        } finally {
            setSaving(false);
        }
    }, [form, recordId, fetchList]);

    function parseApiError(e: any): { code?: string; message: string } {
        // intentamos varias formas comunes de error
        const code = e?.code || e?.error || e?.name;
        const details = e?.details || e?.data?.details || e?.message;
        const message = typeof details === "string" && details.length > 0
            ? details
            : "Ocurrió un error al procesar la solicitud.";
        return { code, message };
    }

    // Crear (POST lowerCamelCase)
    const submitCreate = useCallback(async () => {
        const errs = validateForm(form);
        setFormErrors(errs);
        setFormErrorMsg(null);
        if (Object.keys(errs).length > 0) return;
        if (!recordId) return;

        try {
            setSaving(true);
            await customerContactPost(recordId, {
                contactCode: form.contactCode,
                name: form.name,
                position: form.position,
                eMail: form.eMail,
                phone1: form.phone1 || undefined,
                phone2: form.phone2 || undefined,
                mobile: form.mobile || undefined,
                remarks: form.remarks || undefined,
                isActive: form.isActive,
            });
            setOpenCreate(false);
            await fetchList();
        } catch (e: any) {
            console.error("No se pudo crear el contacto:", e);
            const { code, message } = parseApiError(e);

            // Mapea códigos del backend a errores de UI
            if (code === "CONTACT_EXISTS") {
                setFormErrors((prev) => ({ ...prev, contactCode: "Ya existe un contacto con este código." }));
            }

            setFormErrorMsg(message); // banner rojo en el modal
        } finally {
            setSaving(false);
        }
    }, [form, recordId, fetchList]);

    // Slice page
    const pageRows = useMemo(() => {
        const start = (currentPage - 1) * PER_PAGE;
        return rows.slice(start, start + PER_PAGE);
    }, [rows, currentPage]);

    /* ---------- render ---------- */
    if (loading) return <div className="p-6">Cargando…</div>;
    if (notFound) return <div className="p-6 text-red-600">No se encontró el cliente.</div>;

    return (
        <div className="min-h-screen bg-[#e8eaf5]">
            {/* Tabla */}
            <div className="">
                <div className="space-y-6">
                    <DataTable
                        data={pageRows}
                        columns={columns()}
                        dataType="General2"
                        statusKey="status"
                        rowPaddingY={12}
                        showStatusBorder
                        rowBgClass="bg-white"
                        onRowClick={onRowClick}
                    />
                </div>
            </div>

            {/* ===== Modal Editar ===== */}
            {openEdit && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20">
                    <div className="w-full max-w-2xl rounded-xl bg-white p-6 shadow-xl">
                        <div className="mb-4 text-lg font-semibold">Editar contacto</div>

                        {formErrorMsg && (
                            <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{formErrorMsg}</div>
                        )}
                        <div className="grid grid-cols-6 gap-4">
                            <span className="col-span-1 text-sm font-bold text-gray-700">Rut</span>
                            <div className="col-span-5">
                                <input
                                    value={form.contactCode}
                                    onChange={(e) => setForm((f) => ({ ...f, contactCode: e.target.value }))}
                                    className="w-full border-b border-gray-300 bg-transparent py-1 text-sm outline-none"
                                />
                                {formErrors.contactCode && (
                                    <p className="mt-1 text-xs text-red-600">{formErrors.contactCode}</p>
                                )}
                            </div>

                            <span className="col-span-1 text-sm font-bold text-gray-700">Nombre</span>
                            <div className="col-span-5">
                                <input
                                    value={form.name}
                                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                                    className="w-full border-b border-gray-300 bg-transparent py-1 text-sm outline-none"
                                />
                                {formErrors.name && <p className="mt-1 text-xs text-red-600">{formErrors.name}</p>}
                            </div>

                            <span className="col-span-1 text-sm font-bold text-gray-700">Cargo</span>
                            <input
                                value={form.position}
                                onChange={(e) => setForm((f) => ({ ...f, position: e.target.value }))}
                                className="col-span-5 w-full border-b border-gray-300 bg-transparent py-1 text-sm outline-none"
                            />

                            <span className="col-span-1 text-sm font-bold text-gray-700">Email</span>
                            <div className="col-span-5">
                                <input
                                    value={form.eMail}
                                    onChange={(e) => setForm((f) => ({ ...f, eMail: e.target.value }))}
                                    className="w-full border-b border-gray-300 bg-transparent py-1 text-sm outline-none"
                                />
                                {formErrors.eMail && <p className="mt-1 text-xs text-red-600">{formErrors.eMail}</p>}
                            </div>

                            <span className="col-span-1 text-sm font-bold text-gray-700">Tel 1</span>
                            <input
                                value={form.phone1}
                                onChange={(e) => setForm((f) => ({ ...f, phone1: e.target.value }))}
                                className="col-span-5 w-full border-b border-gray-300 bg-transparent py-1 text-sm outline-none"
                            />

                            <span className="col-span-1 text-sm font-bold text-gray-700">Tel 2</span>
                            <input
                                value={form.phone2}
                                onChange={(e) => setForm((f) => ({ ...f, phone2: e.target.value }))}
                                className="col-span-5 w-full border-b border-gray-300 bg-transparent py-1 text-sm outline-none"
                            />

                            <span className="col-span-1 text-sm font-bold text-gray-700">Móvil</span>
                            <input
                                value={form.mobile}
                                onChange={(e) => setForm((f) => ({ ...f, mobile: e.target.value }))}
                                className="col-span-5 w-full border-b border-gray-300 bg-transparent py-1 text-sm outline-none"
                            />

                            <span className="col-span-1 text-sm font-bold text-gray-700">Obs</span>
                            <input
                                value={form.remarks}
                                onChange={(e) => setForm((f) => ({ ...f, remarks: e.target.value }))}
                                className="col-span-5 w-full border-b border-gray-300 bg-transparent py-1 text-sm outline-none"
                            />

                            <span className="col-span-1 text-sm font-bold text-gray-700">Activo</span>
                            <div className="col-span-5">
                                <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                                    <input
                                        type="checkbox"
                                        checked={Boolean(form.isActive)}
                                        onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                                    />
                                    <span>Contacto activo</span>
                                </label>
                            </div>
                        </div>

                        <div className="mt-6 flex items-center justify-end gap-2">
                            <ActionButton variant="secondary" onClick={() => setOpenEdit(false)}>
                                Cancelar
                            </ActionButton>
                            <ActionButton
                                variant="primary"
                                onClick={submitEdit}
                                disabled={saving}
                            >
                                {saving ? "Guardando…" : "Guardar"}
                            </ActionButton>
                        </div>
                    </div>
                </div>
            )}

            {/* ===== Modal Crear ===== */}
            {openCreate && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20">
                    <div className="w-full max-w-2xl rounded-xl bg-white p-6 shadow-xl">
                        <div className="mb-4 text-lg font-semibold">Nuevo contacto</div>

                        {formErrorMsg && <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{formErrorMsg}</div>}

                        {/* mismos campos que editar, con contactCode editable */}
                        <div className="grid grid-cols-6 gap-4">
                            <span className="col-span-1 text-sm font-bold text-gray-700">Rut</span>
                            <div className="col-span-5">
                                <input
                                    value={form.contactCode}
                                    onChange={(e) => setForm((f) => ({ ...f, contactCode: e.target.value }))}
                                    className="w-full border-b border-gray-300 bg-transparent py-1 text-sm outline-none"
                                />
                                {formErrors.contactCode && <p className="mt-1 text-xs text-red-600">{formErrors.contactCode}</p>}
                            </div>

                            <span className="col-span-1 text-sm font-bold text-gray-700">Nombre</span>
                            <div className="col-span-5">
                                <input
                                    value={form.name}
                                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                                    className="w-full border-b border-gray-300 bg-transparent py-1 text-sm outline-none"
                                />
                                {formErrors.name && <p className="mt-1 text-xs text-red-600">{formErrors.name}</p>}
                            </div>

                            <span className="col-span-1 text-sm font-bold text-gray-700">Cargo</span>
                            <input
                                value={form.position}
                                onChange={(e) => setForm((f) => ({ ...f, position: e.target.value }))}
                                className="col-span-5 w-full border-b border-gray-300 bg-transparent py-1 text-sm outline-none"
                            />

                            <span className="col-span-1 text-sm font-bold text-gray-700">Email</span>
                            <div className="col-span-5">
                                <input
                                    value={form.eMail}
                                    onChange={(e) => setForm((f) => ({ ...f, eMail: e.target.value }))}
                                    className="w-full border-b border-gray-300 bg-transparent py-1 text-sm outline-none"
                                />
                                {formErrors.eMail && <p className="mt-1 text-xs text-red-600">{formErrors.eMail}</p>}
                            </div>

                            <span className="col-span-1 text-sm font-bold text-gray-700">Tel 1</span>
                            <input
                                value={form.phone1}
                                onChange={(e) => setForm((f) => ({ ...f, phone1: e.target.value }))}
                                className="col-span-5 w-full border-b border-gray-300 bg-transparent py-1 text-sm outline-none"
                            />

                            <span className="col-span-1 text-sm font-bold text-gray-700">Tel 2</span>
                            <input
                                value={form.phone2}
                                onChange={(e) => setForm((f) => ({ ...f, phone2: e.target.value }))}
                                className="col-span-5 w-full border-b border-gray-300 bg-transparent py-1 text-sm outline-none"
                            />

                            <span className="col-span-1 text-sm font-bold text-gray-700">Móvil</span>
                            <input
                                value={form.mobile}
                                onChange={(e) => setForm((f) => ({ ...f, mobile: e.target.value }))}
                                className="col-span-5 w-full border-b border-gray-300 bg-transparent py-1 text-sm outline-none"
                            />

                            <span className="col-span-1 text-sm font-bold text-gray-700">Obs</span>
                            <input
                                value={form.remarks}
                                onChange={(e) => setForm((f) => ({ ...f, remarks: e.target.value }))}
                                className="col-span-5 w-full border-b border-gray-300 bg-transparent py-1 text-sm outline-none"
                            />

                            <span className="col-span-1 text-sm font-bold text-gray-700">Activo</span>
                            <div className="col-span-5">
                                <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                                    <input
                                        type="checkbox"
                                        checked={Boolean(form.isActive)}
                                        onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                                    />
                                    <span>Contacto activo</span>
                                </label>
                            </div>
                        </div>

                        <div className="mt-6 flex items-center justify-end gap-2">
                            <ActionButton variant="secondary" onClick={() => setOpenCreate(false)}>
                                Cancelar
                            </ActionButton>
                            <ActionButton
                                variant="primary"
                                onClick={submitCreate}
                                disabled={saving}
                            >
                                {saving ? "Creando…" : "Crear"}
                            </ActionButton>
                        </div>
                    </div>
                </div>
            )}


        </div>
    );
}
