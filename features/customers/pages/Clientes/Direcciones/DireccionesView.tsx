// views\Customers\Clientes\Direcciones\DireccionesView.tsx
"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";
import type { Action, PageHeaderProps } from "@/components/layout/page-header";
import { DataTable, type Column } from "@/components/ui/table";
import { exportToCsv } from "@/components/presets/export/export";
import { ArrowDownTrayIcon, ArrowPathIcon, TrashIcon } from "@heroicons/react/24/outline";
import { ActionButton } from "@/components/ui/button/action-button";

import {
    customerAddressesGet,
    customerAddressDelete,
    // funcion para POST en array + lowerCamelCase
    customerAddressesPost,
} from "@/app/fetchWithAuth/api-clientes/clientes/customers";
import { useCustomer } from "../hooks/useCustomer";

// ===== Config =====
const PER_PAGE = 20;
type Estado = "Activo" | "Inactivo";
const getStatusColor = (s: Estado) => (s === "Activo" ? "bg-green-500" : "bg-gray-400");

// ===== Tipos UI =====
type AddressRow = {
    addressCode: string;
    name: string;       // AddressName
    type: "B" | "S" | string;
    street: string;
    streetNo?: string;
    building?: string;
    block?: string;
    zip?: string;
    state?: string;
    county?: string;
    city: string;
    notes?: string;
    country: string;
    status: Estado;     // badge
};

// ===== Columnas =====
const columns = (onDeleteAsk: (row: AddressRow) => void): Column<AddressRow>[] => [
    { header: "NOMBRE", accessorKey: "name" },
    { header: "CÓDIGO", accessorKey: "addressCode" },
    { header: "TIPO", accessorKey: "type" },
    { header: "CALLE", accessorKey: "street", cell: (r) => r.street || "—" },
    { header: "NÚMERO", accessorKey: "streetNo", cell: (r) => r.streetNo || "—" },
    { header: "CÓDIGO POSTAL", accessorKey: "zip", cell: (r) => r.zip || "—" },
    { header: "REGIÓN", accessorKey: "state", cell: (r) => r.state || "—" },
    { header: "COMUNA", accessorKey: "county", cell: (r) => r.county || "—" },
    { header: "CIUDAD", accessorKey: "city", cell: (r) => r.city || "—" },
    { header: "COMPLEMENTO", accessorKey: "notes", cell: (r) => r.notes || "—" },
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
    {
        header: "",
        accessorKey: "status",
        cell: (r) => (
            <button
                onClick={(e) => { e.stopPropagation(); onDeleteAsk(r); }}
                title="Eliminar dirección"
                className="ml-2 inline-flex items-center rounded-md px-2 py-1 text-red-600 hover:bg-red-50"
            >
                <TrashIcon className="h-5 w-5" />
            </button>
        ),
    },

];

export default function CustomerAddressesView() {
    const router = useRouter();
    const params = useParams<{ id: string }>();
    const recordId = Array.isArray(params?.id) ? params!.id[0] : params?.id;

    // Header desde SWR (sin 2da llamada si vienes de Resumen)
    const { data: headerCustomer } = useCustomer(recordId, { revalidateOnMount: false });
    const headerName =
        `${headerCustomer?.FirstName ?? ""} ${headerCustomer?.LastName ?? ""}`.trim() || "Direcciones";
    const headerActive = headerCustomer?.IsActive ?? null;

    const [rows, setRows] = useState<AddressRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);

    // Modal: editar / crear
    type EditForm = {
        customerId: string;
        addressCode: string;
        addressName: string;
        addressType: "B" | "S" | "O" | string;
        street: string;
        streetNo: string;
        building: string;
        block: string;
        city: string;
        county: string;
        state: string;
        zipCode: string;
        country: string;
        notes: string;
        isActive: boolean;
    };

    const emptyForm: EditForm = {
        customerId: recordId || "",
        addressCode: "",
        addressName: "",
        addressType: "B",
        street: "",
        streetNo: "",
        building: "",
        block: "",
        city: "",
        county: "",
        state: "",
        zipCode: "",
        country: "CL",
        notes: "",
        isActive: true,
    };

    const [openEdit, setOpenEdit] = useState(false);
    const [openCreate, setOpenCreate] = useState(false);
    const [form, setForm] = useState<EditForm>(emptyForm);
    const [saving, setSaving] = useState(false);
    const [formErrors, setFormErrors] = useState<Partial<Record<keyof EditForm, string>>>({});
    const [formErrorMsg, setFormErrorMsg] = useState<string | null>(null); // banner rojo

    // Modal: eliminar
    const [openDelete, setOpenDelete] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<{ code: string; name: string } | null>(null);
    const [deleteErrorMsg, setDeleteErrorMsg] = useState<string | null>(null);
    const [deleting, setDeleting] = useState(false);

    // paginación local
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0);
    const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(n, max));

    // cargar listado
    const fetchList = useCallback(async () => {
        if (!recordId) return;
        setLoading(true);
        setNotFound(false);
        try {
            const data = await customerAddressesGet(recordId);

            const mapped: AddressRow[] = (Array.isArray(data) ? data : []).map((d: any) => ({
                addressCode: d?.AddressCode || "",
                name: d?.AddressName || "",
                type: (d?.AddressType || "") as any,
                street: d?.Street || "",
                streetNo: d?.StreetNo || "",
                building: d?.Building || "",
                block: d?.Block || "",
                zip: d?.ZipCode || "",
                state: d?.State || "",
                county: d?.County || "",
                city: d?.City || "",
                notes: d?.Notes || "",
                country: d?.Country || "CL",
                status: d?.IsActive ? "Activo" : "Inactivo",
            }));

            setRows(mapped);
            setTotalRecords(mapped.length);
            setTotalPages(Math.max(1, Math.ceil(mapped.length / PER_PAGE)));
            setCurrentPage(1);
        } catch (e) {
            console.error("Error listando direcciones:", e);
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

    // Export CSV
    const handleExport = useCallback(() => {
        if (rows.length === 0) return;
        exportToCsv(
            "direcciones.csv",
            rows.map((r) => ({
                Código: r.addressCode,
                Nombre: r.name,
                Tipo: r.type,
                Calle: r.street,
                Ciudad: r.city,
                País: r.country,
                Estado: r.status,
            }))
        );
    }, [rows]);

    // Header actions
    const headerActions: Action[] = useMemo(
        () => [
            {
                label: "Nueva dirección",
                variant: "success",
                icon: <ArrowDownTrayIcon className="h-5 w-5 rotate-180" />,
                onClick: () => {
                    setForm({ ...emptyForm, customerId: recordId || "" });
                    setFormErrors({});
                    setFormErrorMsg(null);
                    setOpenCreate(true);
                },
            },
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
        [handleExport, fetchList]
    );

    // Header con nombre/estado (desde SWR)
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

    // abrir modal de edición al click en fila
    const onRowClick = useCallback((r: AddressRow) => {
        setForm({
            customerId: recordId || "",
            addressCode: r.addressCode,
            addressName: r.name,
            addressType: (r.type as "B" | "S" | "O") || "B",
            street: r.street || "",
            streetNo: r.streetNo || "",
            building: r.building || "",
            block: r.block || "",
            city: r.city || "",
            county: r.county || "",
            state: r.state || "",
            zipCode: r.zip || "",
            country: r.country || "CL",
            notes: r.notes || "",
            isActive: r.status === "Activo",
        });
        setFormErrors({});
        setFormErrorMsg(null);
        setOpenEdit(true);
    }, [recordId]);


    // Abrir modal eliminar
    const onDeleteAsk = useCallback((r: AddressRow) => {
        setDeleteTarget({ code: r.addressCode, name: r.name || r.addressCode });
        setDeleteErrorMsg(null);
        setOpenDelete(true);
    }, []);

    // Validación local de formulario (crear/editar)
    function validateForm(f: EditForm) {
        const errs: Partial<Record<keyof EditForm, string>> = {};
        if (!f.addressCode?.trim()) errs.addressCode = "Requerido";
        if (!f.addressName?.trim()) errs.addressName = "Requerido";
        if (!f.addressType?.trim()) errs.addressType = "Requerido";
        if (!f.street?.trim()) errs.street = "Requerido";
        if (!f.city?.trim()) errs.city = "Requerido";
        if (!f.country?.trim()) errs.country = "Requerido";
        return errs;
    }


    // Guardar edición (PUT objeto) — sin alerts
    const submitEdit = useCallback(async () => {
        const errs = validateForm(form);
        setFormErrors(errs);
        setFormErrorMsg(null);
        if (Object.keys(errs).length > 0) return;
        if (!recordId) return;

        try {
            setSaving(true);
            await customerAddressesPost(
                recordId,
                [
                    {
                        customerId: form.customerId || recordId,
                        addressCode: form.addressCode,
                        addressName: form.addressName,
                        addressType: form.addressType,
                        street: form.street,
                        streetNo: form.streetNo,
                        building: form.building,
                        block: form.block,
                        city: form.city,
                        county: form.county,
                        state: form.state,
                        zipCode: form.zipCode,
                        country: form.country,
                        notes: form.notes,
                        isActive: form.isActive,
                    },
                ],
                "replace" //  asegura update de la existente (no crear otra)
            );
            setOpenEdit(false);
            await fetchList();
        } catch (e: any) {
            console.error("No se pudo actualizar la dirección:", e);
            setFormErrorMsg(e?.message || "No se pudo actualizar la dirección.");
        } finally {
            setSaving(false);
        }
    }, [recordId, form, fetchList]);



    // Crear nueva (POST array) — sin alerts
    const submitCreate = useCallback(async () => {
        const errs = validateForm(form);
        setFormErrors(errs);
        setFormErrorMsg(null);
        if (Object.keys(errs).length > 0) return;
        if (!recordId) return;

        try {
            setSaving(true);
            await customerAddressesPost(
                recordId,
                [
                    {
                        customerId: form.customerId || recordId,
                        addressCode: form.addressCode,
                        addressName: form.addressName,
                        addressType: form.addressType,
                        street: form.street,
                        streetNo: form.streetNo,
                        building: form.building,
                        block: form.block,
                        city: form.city,
                        county: form.county,
                        state: form.state,
                        zipCode: form.zipCode,
                        country: form.country,
                        notes: form.notes,
                        isActive: form.isActive,
                    },
                ],
                "error" // respeta flujo actual de conflicto para crear
            );
            setOpenCreate(false);
            await fetchList();
        } catch (e: any) {
            console.error("No se pudo crear la dirección:", e);
            setFormErrorMsg(e?.message || "No se pudo crear la dirección.");
        } finally {
            setSaving(false);
        }
    }, [recordId, form, fetchList]);


    // Confirmar eliminación — sin alerts
    const submitDelete = useCallback(async () => {
        if (!recordId || !deleteTarget?.code) return;
        try {
            setDeleting(true);
            await customerAddressDelete(recordId, deleteTarget.code);
            setOpenDelete(false);
            setDeleteTarget(null);
            await fetchList();
        } catch (e: any) {
            console.error("No se pudo eliminar la dirección:", e);
            setDeleteErrorMsg(e?.message || "No se pudo eliminar la dirección.");
        } finally {
            setDeleting(false);
        }
    }, [recordId, deleteTarget, fetchList]);

    // slice paginado
    const pageRows = useMemo(() => {
        const start = (currentPage - 1) * PER_PAGE;
        return rows.slice(start, start + PER_PAGE);
    }, [rows, currentPage]);

    /* ---------- render (calcado al de Resumen) ---------- */
    if (loading) return <div className="p-6">Cargando…</div>;
    if (notFound) return <div className="p-6 text-red-600">No se encontró el cliente.</div>;

    return (
        <div className="min-h-screen bg-[#e8eaf5]">
            {/* Tabla */}
            <div className="">
                <div className="space-y-6">
                    <DataTable
                        data={pageRows}
                        columns={columns(onDeleteAsk)}
                        dataType="General2"
                        statusKey="status"
                        rowPaddingY={12}
                        showStatusBorder
                        rowBgClass="bg-white"
                        onRowClick={onRowClick}
                    />
                </div>
            </div>

            {/* ===== Modal Edición ===== */}
            {openEdit && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20">
                    <div className="w-full max-w-2xl rounded-xl bg-white p-6 shadow-xl">
                        <div className="mb-4 text-lg font-semibold">Editar dirección</div>

                        {formErrorMsg && (
                            <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{formErrorMsg}</div>
                        )}

                        {/* === BLOQUE DE CAMPOS (EDITAR/CREAR) === */}
                        <div className="grid grid-cols-6 gap-4">
                            <span className="col-span-1 text-sm font-bold text-gray-700">Código</span>
                            <div className="col-span-5">
                                <input
                                    value={form.addressCode}
                                    disabled
                                    onChange={(e) => setForm((f) => ({ ...f, addressCode: e.target.value }))}
                                    className="w-full border-b border-gray-300 bg-transparent py-1 text-sm outline-none"
                                />
                                {formErrors.addressCode && <p className="mt-1 text-xs text-red-600">{formErrors.addressCode}</p>}
                            </div>

                            <span className="col-span-1 text-sm font-bold text-gray-700">Nombre</span>
                            <div className="col-span-5">
                                <input
                                    value={form.addressName}
                                    onChange={(e) => setForm((f) => ({ ...f, addressName: e.target.value }))}
                                    className="w-full border-b border-gray-300 bg-transparent py-1 text-sm outline-none"
                                />
                                {formErrors.addressName && <p className="mt-1 text-xs text-red-600">{formErrors.addressName}</p>}
                            </div>

                            <span className="col-span-1 text-sm font-bold text-gray-700">Tipo</span>
                            <div className="col-span-5">
                                <select
                                    value={form.addressType}
                                    onChange={(e) => setForm((f) => ({ ...f, addressType: e.target.value as "B" | "S" | "O" }))}
                                    className="w-full border-b border-gray-300 bg-transparent py-1 text-sm outline-none"
                                >
                                    <option value="B">Facturación</option>
                                    <option value="S">Envío</option>
                                    {/* <option value="O">O</option> */}
                                </select>
                                {formErrors.addressType && <p className="mt-1 text-xs text-red-600">{formErrors.addressType}</p>}
                            </div>

                            <span className="col-span-1 text-sm font-bold text-gray-700">Calle</span>
                            <div className="col-span-5">
                                <input
                                    value={form.street}
                                    onChange={(e) => setForm((f) => ({ ...f, street: e.target.value }))}
                                    className="w-full border-b border-gray-300 bg-transparent py-1 text-sm outline-none"
                                />
                                {formErrors.street && <p className="mt-1 text-xs text-red-600">{formErrors.street}</p>}
                            </div>

                            <span className="col-span-1 text-sm font-bold text-gray-700">Número</span>
                            <input
                                value={form.streetNo}
                                onChange={(e) => setForm((f) => ({ ...f, streetNo: e.target.value }))}
                                className="col-span-5 w-full border-b border-gray-300 bg-transparent py-1 text-sm outline-none"
                            />

                            <span className="col-span-1 text-sm font-bold text-gray-700">Edificio</span>
                            <input
                                value={form.building}
                                onChange={(e) => setForm((f) => ({ ...f, building: e.target.value }))}
                                className="col-span-5 w-full border-b border-gray-300 bg-transparent py-1 text-sm outline-none"
                            />

                            <span className="col-span-1 text-sm font-bold text-gray-700">Block</span>
                            <input
                                value={form.block}
                                onChange={(e) => setForm((f) => ({ ...f, block: e.target.value }))}
                                className="col-span-5 w-full border-b border-gray-300 bg-transparent py-1 text-sm outline-none"
                            />

                            <span className="col-span-1 text-sm font-bold text-gray-700">Ciudad</span>
                            <div className="col-span-5">
                                <input
                                    value={form.city}
                                    onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                                    className="w-full border-b border-gray-300 bg-transparent py-1 text-sm outline-none"
                                />
                                {formErrors.city && <p className="mt-1 text-xs text-red-600">{formErrors.city}</p>}
                            </div>

                            <span className="col-span-1 text-sm font-bold text-gray-700">Comuna</span>
                            <input
                                value={form.county}
                                onChange={(e) => setForm((f) => ({ ...f, county: e.target.value }))}
                                className="col-span-5 w-full border-b border-gray-300 bg-transparent py-1 text-sm outline-none"
                            />

                            <span className="col-span-1 text-sm font-bold text-gray-700">Región</span>
                            <input
                                value={form.state}
                                onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))}
                                className="col-span-5 w-full border-b border-gray-300 bg-transparent py-1 text-sm outline-none"
                            />

                            <span className="col-span-1 text-sm font-bold text-gray-700">Código Postal</span>
                            <input
                                value={form.zipCode}
                                onChange={(e) => setForm((f) => ({ ...f, zipCode: e.target.value }))}
                                className="col-span-5 w-full border-b border-gray-300 bg-transparent py-1 text-sm outline-none"
                            />

                            <span className="col-span-1 text-sm font-bold text-gray-700">País</span>
                            <div className="col-span-5">
                                <input
                                    value={form.country}
                                    onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))}
                                    className="w-full border-b border-gray-300 bg-transparent py-1 text-sm outline-none"
                                />
                                {formErrors.country && <p className="mt-1 text-xs text-red-600">{formErrors.country}</p>}
                            </div>

                            <span className="col-span-1 text-sm font-bold text-gray-700">Notas</span>
                            <input
                                value={form.notes}
                                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                                className="col-span-5 w-full border-b border-gray-300 bg-transparent py-1 text-sm outline-none"
                            />

                            <span className="col-span-1 text-sm font-bold text-gray-700">Activa</span>
                            <div className="col-span-5">
                                <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                                    <input
                                        type="checkbox"
                                        checked={Boolean(form.isActive)}
                                        onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                                    />
                                    <span>Usar dirección activa</span>
                                </label>
                            </div>
                        </div>


                        <div className="mt-6 flex items-center justify-end gap-2">
                            <ActionButton
                                variant="secondary"
                                onClick={() => setOpenEdit(false)}
                            >
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
                        <div className="mb-4 text-lg font-semibold">Nueva dirección</div>

                        {formErrorMsg && (
                            <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{formErrorMsg}</div>
                        )}

                        {/* === BLOQUE DE CAMPOS (EDITAR/CREAR) === */}
                        <div className="grid grid-cols-6 gap-4">
                            <span className="col-span-1 text-sm font-bold text-gray-700">Código</span>
                            <div className="col-span-5">
                                <input
                                    value={form.addressCode}
                                    onChange={(e) => setForm((f) => ({ ...f, addressCode: e.target.value }))}
                                    className="w-full border-b border-gray-300 bg-transparent py-1 text-sm outline-none"
                                />
                                {formErrors.addressCode && <p className="mt-1 text-xs text-red-600">{formErrors.addressCode}</p>}
                            </div>

                            <span className="col-span-1 text-sm font-bold text-gray-700">Nombre</span>
                            <div className="col-span-5">
                                <input
                                    value={form.addressName}
                                    onChange={(e) => setForm((f) => ({ ...f, addressName: e.target.value }))}
                                    className="w-full border-b border-gray-300 bg-transparent py-1 text-sm outline-none"
                                />
                                {formErrors.addressName && <p className="mt-1 text-xs text-red-600">{formErrors.addressName}</p>}
                            </div>

                            <span className="col-span-1 text-sm font-bold text-gray-700">Tipo</span>
                            <div className="col-span-5">
                                <select
                                    value={form.addressType}
                                    onChange={(e) => setForm((f) => ({ ...f, addressType: e.target.value as "B" | "S" | "O" }))}
                                    className="w-full border-b border-gray-300 bg-transparent py-1 text-sm outline-none"
                                >
                                    <option value="B">Facturación</option>
                                    <option value="S">Envío</option>
                                    {/* <option value="O">O</option> */}
                                </select>
                                {formErrors.addressType && <p className="mt-1 text-xs text-red-600">{formErrors.addressType}</p>}
                            </div>

                            <span className="col-span-1 text-sm font-bold text-gray-700">Calle</span>
                            <div className="col-span-5">
                                <input
                                    value={form.street}
                                    onChange={(e) => setForm((f) => ({ ...f, street: e.target.value }))}
                                    className="w-full border-b border-gray-300 bg-transparent py-1 text-sm outline-none"
                                />
                                {formErrors.street && <p className="mt-1 text-xs text-red-600">{formErrors.street}</p>}
                            </div>

                            <span className="col-span-1 text-sm font-bold text-gray-700">Número</span>
                            <input
                                value={form.streetNo}
                                onChange={(e) => setForm((f) => ({ ...f, streetNo: e.target.value }))}
                                className="col-span-5 w-full border-b border-gray-300 bg-transparent py-1 text-sm outline-none"
                            />

                            <span className="col-span-1 text-sm font-bold text-gray-700">Edificio</span>
                            <input
                                value={form.building}
                                onChange={(e) => setForm((f) => ({ ...f, building: e.target.value }))}
                                className="col-span-5 w-full border-b border-gray-300 bg-transparent py-1 text-sm outline-none"
                            />

                            <span className="col-span-1 text-sm font-bold text-gray-700">Block</span>
                            <input
                                value={form.block}
                                onChange={(e) => setForm((f) => ({ ...f, block: e.target.value }))}
                                className="col-span-5 w-full border-b border-gray-300 bg-transparent py-1 text-sm outline-none"
                            />

                            <span className="col-span-1 text-sm font-bold text-gray-700">País</span>
                            <input
                                value={form.county}
                                onChange={(e) => setForm((f) => ({ ...f, county: e.target.value }))}
                                className="col-span-5 w-full border-b border-gray-300 bg-transparent py-1 text-sm outline-none"
                            />

                            <span className="col-span-1 text-sm font-bold text-gray-700">Región</span>
                            <input
                                value={form.state}
                                onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))}
                                className="col-span-5 w-full border-b border-gray-300 bg-transparent py-1 text-sm outline-none"
                            />

                            <span className="col-span-1 text-sm font-bold text-gray-700">Ciudad</span>
                            <div className="col-span-5">
                                <input
                                    value={form.city}
                                    onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                                    className="w-full border-b border-gray-300 bg-transparent py-1 text-sm outline-none"
                                />
                                {formErrors.city && <p className="mt-1 text-xs text-red-600">{formErrors.city}</p>}
                            </div>

                            <span className="col-span-1 text-sm font-bold text-gray-700">Código Postal</span>
                            <input
                                value={form.zipCode}
                                onChange={(e) => setForm((f) => ({ ...f, zipCode: e.target.value }))}
                                className="col-span-5 w-full border-b border-gray-300 bg-transparent py-1 text-sm outline-none"
                            />

                            <span className="col-span-1 text-sm font-bold text-gray-700">País</span>
                            <div className="col-span-5">
                                <input
                                    value={form.country}
                                    onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))}
                                    className="w-full border-b border-gray-300 bg-transparent py-1 text-sm outline-none"
                                />
                                {formErrors.country && <p className="mt-1 text-xs text-red-600">{formErrors.country}</p>}
                            </div>

                            <span className="col-span-1 text-sm font-bold text-gray-700">Notas</span>
                            <input
                                value={form.notes}
                                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                                className="col-span-5 w-full border-b border-gray-300 bg-transparent py-1 text-sm outline-none"
                            />

                            <span className="col-span-1 text-sm font-bold text-gray-700">Activa</span>
                            <div className="col-span-5">
                                <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                                    <input
                                        type="checkbox"
                                        checked={Boolean(form.isActive)}
                                        onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                                    />
                                    <span>Usar dirección activa</span>
                                </label>
                            </div>
                        </div>


                        <div className="mt-6 flex items-center justify-end gap-2">
                            <ActionButton
                                variant="secondary"
                                onClick={() => setOpenCreate(false)}
                            >
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

            {/* ===== Modal Confirmar Eliminación ===== */}
            {openDelete && deleteTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20">
                    <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
                        <div className="mb-2 text-lg font-semibold">Eliminar dirección</div>
                        <p className="text-sm text-gray-700">
                            ¿Seguro que deseas eliminar la dirección <b>{deleteTarget.name}</b> (código: <b>{deleteTarget.code}</b>)?
                        </p>

                        {deleteErrorMsg && (
                            <div className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{deleteErrorMsg}</div>
                        )}

                        <div className="mt-6 flex items-center justify-end gap-2">
                            <button
                                onClick={() => {
                                    setOpenDelete(false);
                                    setDeleteTarget(null);
                                    setDeleteErrorMsg(null);
                                }}
                                className="rounded-md bg-gray-100 px-4 py-2 text-sm text-gray-700 hover:bg-gray-200"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={submitDelete}
                                disabled={deleting}
                                className="rounded-md bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700 disabled:opacity-50"
                            >
                                {deleting ? "Eliminando…" : "Eliminar"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
