"use client";

import { useFetchWithAuth } from "@/lib/http/client";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";
import { ActionButton } from "@/components/ui/button/action-button";

type UserProfile = {
    nombres?: string;
    apellidos?: string;
    email?: string;
};

type SalesChannelItem = {
    referenceId: string;
    isActive: boolean;
};

type TaskItem = {
    code: string;
    isActive: boolean;
};

type SellerItem = {
    sellerReferenceId: string;
    isActive: boolean;
};

type WarehouseRecord = {
    id: string | number;
    locationId?: string | number;
    name: string;
    referenceId: string;
    group?: string | null;
    status: string;
    dateCreatedCL?: string;
    dateModifiedCL?: string | null;
    userCreatedProfile?: UserProfile;
    userModifiedProfile?: UserProfile;
    salesChannels: SalesChannelItem[];
    tasks: TaskItem[];
    limitedToSellers: SellerItem[];
};

type WarehousePayload = {
    userModified: number;
    name: string;
    referenceId: string;
    group?: string | null;
    status: string;
    salesChannels: SalesChannelItem[];
    tasks: TaskItem[];
    limitedToSellers: SellerItem[];
};

type Props = {
    open: boolean;
    warehouse: WarehouseRecord;
    onClose: () => void;
    onSaved: () => void;
};


export default function DetalleAlmacenesUbicacionesModal({
    open,
    onClose,
    onSaved,
    warehouse,
}: Props) {
    const [form, setForm] = useState<WarehouseRecord>(warehouse);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        setForm(warehouse);
    }, [warehouse]);

    // para editar 
    const buildPayload = (): WarehousePayload => ({
        userModified: 4, // luego lo sacas del contexto real

        name: form.name,
        referenceId: form.referenceId,
        group: form.group,
        status: form.status,

        salesChannels: form.salesChannels.map((c) => ({
            referenceId: c.referenceId,
            isActive: c.isActive,
        })),

        tasks: form.tasks.map((t) => ({
            code: t.code,
            isActive: t.isActive,
        })),

        limitedToSellers: form.limitedToSellers.map((s) => ({
            sellerReferenceId: s.sellerReferenceId,
            isActive: s.isActive,
        })),
    });

    const toggleSalesChannel = (list: SalesChannelItem[], referenceId: string) =>
        list.map((i) =>
            i.referenceId === referenceId ? { ...i, isActive: !i.isActive } : i
        );

    const toggleTask = (list: TaskItem[], code: string) =>
        list.map((i) =>
            i.code === code ? { ...i, isActive: !i.isActive } : i
        );

    const toggleSeller = (list: SellerItem[], sellerReferenceId: string) =>
        list.map((i) =>
            i.sellerReferenceId === sellerReferenceId ? { ...i, isActive: !i.isActive } : i
        );

    const { fetchWithAuth } = useFetchWithAuth();

    const handleSave = async () => {
        setSaving(true);

        try {
            await fetchWithAuth(
                `comerce-service/locations/warehouses/${form.id}`,
                {
                    method: "PATCH",
                    body: JSON.stringify(buildPayload()),
                }
            );

            onSaved();   // refresca
            onClose();   // cierra
        } catch (e) {
            console.error("Error actualizando almacén:", e);
        } finally {
            setSaving(false);
        }
    };

    if (!open) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
            onClick={onClose}
        >
            {/* Contenedor */}
            <div
                className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-xl bg-white p-6"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">
                        Almacén {warehouse.name}
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-700"
                    >
                        <XMarkIcon className="h-5 w-5" />
                    </button>
                </div>

                <div className="space-y-6 text-sm">
                    {/* Datos generales */}
                    <section>
                        <h4 className="mb-2 font-semibold">Datos generales</h4>
                        <ul className="space-y-1">
                            <li><b>ID:</b> {warehouse.id}</li>
                            <li><b>Location ID:</b> {warehouse.locationId}</li>
                            <li className="flex items-center gap-2">
                                <b className="w-32">Nombre:</b>
                                <input
                                    type="text"
                                    value={form.name}
                                    onChange={(e) =>
                                        setForm((p) => ({ ...p, name: e.target.value }))
                                    }
                                    className="flex-1 rounded-md border border-gray-300 px-2 py-1 text-sm outline-none"
                                />
                            </li>
                            <li className="flex items-center gap-2">
                                <b className="w-32">Referencia:</b>
                                <input
                                    type="text"
                                    value={form.referenceId}
                                    onChange={(e) =>
                                        setForm((p) => ({ ...p, referenceId: e.target.value }))
                                    }
                                    className="flex-1 rounded-md border border-gray-300 px-2 py-1 text-sm outline-none"
                                />
                            </li>
                            <li className="flex items-center gap-2">
                                <b className="w-32">Grupo:</b>
                                <input
                                    type="text"
                                    value={form.group ?? ""}
                                    onChange={(e) =>
                                        setForm((p) => ({ ...p, group: e.target.value }))
                                    }
                                    className="flex-1 rounded-md border border-gray-300 px-2 py-1 text-sm outline-none"
                                />
                            </li>
                            <li className="flex items-center gap-2">
                                <b className="w-32">Estado:</b>
                                <select
                                    value={form.status}
                                    onChange={(e) =>
                                        setForm((p) => ({ ...p, status: e.target.value }))
                                    }
                                    className="rounded-md border border-gray-300 px-2 py-1 text-sm outline-none"
                                >
                                    <option value="active">Activo</option>
                                    <option value="inactive">Inactivo</option>
                                </select>
                            </li>
                        </ul>
                    </section>

                    {/* Fechas */}
                    <section>
                        <h4 className="mb-2 font-semibold">Fechas</h4>
                        <ul className="space-y-1">
                            <li><b>Creado (CL):</b> {warehouse.dateCreatedCL}</li>
                            <li><b>Modificado (CL):</b> {warehouse.dateModifiedCL ?? "—"}</li>
                            {/* <li><b>Creado (UTC):</b> {warehouse.dateCreatedUtc}</li>
                            <li><b>Modificado (UTC):</b> {warehouse.dateModifiedUtc ?? "—"}</li>
                            <li><b>Creado raw:</b> {warehouse.dateCreated}</li>
                            <li><b>Modificado raw:</b> {warehouse.dateModified ?? "—"}</li> */}
                        </ul>
                    </section>

                    {/* Usuarios */}
                    <section>
                        <h4 className="mb-2 font-semibold">Usuarios</h4>
                        <ul className="space-y-1">
                            {/* <li><b>ID creador:</b> {warehouse.userCreated}</li>
                            <li><b>ID modificador:</b> {warehouse.userModified ?? "—"}</li> */}
                            <li>
                                <b>Usuario creador:</b>{" "}
                                {warehouse.userCreatedProfile
                                    ? `${warehouse.userCreatedProfile.nombres} ${warehouse.userCreatedProfile.apellidos} (${warehouse.userCreatedProfile.email})`
                                    : "—"}
                            </li>
                            <li>
                                <b>Usuario modificador:</b>{" "}
                                {warehouse.userModifiedProfile
                                    ? `${warehouse.userModifiedProfile.nombres} ${warehouse.userModifiedProfile.apellidos} (${warehouse.userModifiedProfile.email})`
                                    : "—"}
                            </li>
                        </ul>
                    </section>

                    {/* Canales */}
                    <div className="flex flex-wrap gap-2">
                        {form.salesChannels.map((c) => (
                            <button
                                key={c.referenceId}
                                type="button"
                                onClick={() =>
                                    setForm((p) => ({
                                        ...p,
                                        salesChannels: toggleSalesChannel(
                                            p.salesChannels,
                                            c.referenceId
                                        ),
                                    }))
                                }
                                className={`rounded-full px-2 py-0.5 text-xs border ${c.isActive
                                    ? "bg-green-100 text-green-700 border-green-200"
                                    : "bg-gray-100 text-gray-600 border-gray-200"
                                    }`}
                                title="Click para activar / desactivar"
                            >
                                {c.referenceId} ({c.isActive ? "activo" : "inactivo"})
                            </button>
                        ))}
                    </div>

                    {/* Tareas */}
                    <div className="flex flex-wrap gap-2">
                        {form.tasks.map((t) => (
                            <button
                                key={t.code}
                                type="button"
                                onClick={() =>
                                    setForm((p) => ({
                                        ...p,
                                        tasks: toggleTask(p.tasks, t.code),
                                    }))
                                }
                                className={`rounded-full px-2 py-0.5 text-xs border ${t.isActive
                                    ? "bg-green-100 text-green-700 border-green-200"
                                    : "bg-gray-100 text-gray-600 border-gray-200"
                                    }`}
                            >
                                {t.code} ({t.isActive ? "activo" : "inactivo"})
                            </button>
                        ))}
                    </div>

                    {/* Sellers */}
                    <div className="flex flex-wrap gap-2">
                        {form.limitedToSellers.map((s) => (
                            <button
                                key={s.sellerReferenceId}
                                type="button"
                                onClick={() =>
                                    setForm((p) => ({
                                        ...p,
                                        limitedToSellers: toggleSeller(
                                            p.limitedToSellers,
                                            s.sellerReferenceId
                                        ),
                                    }))
                                }
                                className={`rounded-full px-2 py-0.5 text-xs border ${s.isActive
                                    ? "bg-green-100 text-green-700 border-green-200"
                                    : "bg-gray-100 text-gray-600 border-gray-200"
                                    }`}
                            >
                                {s.sellerReferenceId} ({s.isActive ? "activo" : "inactivo"})
                            </button>
                        ))}
                    </div>

                    <div className="mt-6 flex justify-end gap-2">
                        <ActionButton
                            type="button"
                            variant="secondary"
                            onClick={onClose}
                        >
                            Cancelar
                        </ActionButton>

                        <ActionButton
                            type="button"
                            variant="primary"
                            onClick={handleSave}
                            disabled={saving}
                        >
                            {saving ? "Guardando…" : "Guardar cambios"}
                        </ActionButton>
                    </div>
                </div>
            </div>
        </div>
    );
}
