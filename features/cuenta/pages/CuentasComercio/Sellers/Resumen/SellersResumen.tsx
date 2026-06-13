// views\Cuenta\CuentasComercio\Sellers\Resumen\Resumen.tsx
"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";
import type { Action, PageHeaderProps } from "@/components/layout/page-header";
import { ArrowPathIcon, CheckCircleIcon, XCircleIcon } from "@heroicons/react/24/outline";
import SaveOutlined from "@mui/icons-material/SaveOutlined";
import { SellersFields, Seller, ExternalId } from "@/features/cuenta/components/cuentascomercio/sellers/SellersFields";
import { useFetchWithAuth } from "@/lib/http/client";
import { toast } from "react-hot-toast";

/* Shape de la API (detalle) */
type SellerDetailApi = {
    id: number | string;
    created?: string;
    name: string;
    firstName?: string | null;
    lastName?: string | null;
    email?: string | null;
    phone?: string | null;
    personalId?: string | null;
    externalIds?: Record<string, string | null> | null;
    statusId?: number | null;
    status: string;
    modifiedByUser?: { user?: string | null; email?: string | null } | null;
};

function mapApiToRecord(api: SellerDetailApi): Seller {
    const externalArray: ExternalId[] = api.externalIds
        ? Object.entries(api.externalIds).map(([k, v]) => ({ key: k, value: v ?? "" }))
        : [];

    return {
        id: String(api.id ?? ""),
        name: api.name ?? "",
        externalIds: externalArray,
        email: api.email ?? "",
        phone: api.phone ?? "",
        personalId: api.personalId ?? "",
        // logo no viene de la API -> placeholder en Fields
        logoUrl: "",
        status: api.status ?? "",
        created: {
            username: api.modifiedByUser?.user ?? "", // la API no trae “creador”, así que se muestra el modificador como referencia
            email: api.modifiedByUser?.email ?? "",
            date: api.created ?? "",
        },
    };
}

function mapRecordToApi(record: Seller): Partial<SellerDetailApi> {
    const externalObj = (record.externalIds || []).reduce<Record<string, string>>((acc, cur) => {
        const k = (cur.key || "").trim();
        if (k) acc[k] = (cur.value || "").trim();
        return acc;
    }, {});
    return {
        name: record.name,
        email: record.email,
        phone: record.phone,
        personalId: record.personalId,
        externalIds: externalObj,
        status: record.status,
    };
}

export default function SellersResumenView() {
    const router = useRouter();
    const { id } = useParams();
    const recordId = Array.isArray(id) ? id[0] : id;
    const { fetchWithAuth } = useFetchWithAuth();

    const [record, setRecord] = useState<Seller | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // carga el detalle desde la api 
    const loadDetail = useCallback(async () => {
        if (!recordId) return;
        setLoading(true);
        try {
            const data = await fetchWithAuth<any>(
                `oms-service/orders/seller/id/${encodeURIComponent(String(recordId))}`,
                { method: "GET" }
            );

            // Si viene { message: "Tu usuario no tiene permiso para esta ruta" }
            if (data && typeof data === "object" && "message" in data && !("id" in data)) {
                throw new Error(String(data.message || "No se pudo cargar el detalle"));
            }

            setRecord(mapApiToRecord(data as SellerDetailApi));
        } catch (e: any) {
            const msg =
                typeof e === "string"
                    ? e
                    : e?.message || "No se pudo cargar el detalle";
            toast.error(msg);
            setRecord(null);
        } finally {
            setLoading(false);
        }
    }, [fetchWithAuth, recordId]);

    useEffect(() => {
        loadDetail();
    }, [loadDetail]);

    const handleChange = (field: keyof Seller, value: any) => {
        setRecord((prev) => (prev ? { ...prev, [field]: value } : prev));
    };

    const doSave = useCallback(
        async (navigateAfter?: "back") => {
            if (!record) return;
            setSaving(true);
            try {
                const payload = mapRecordToApi(record);
                await fetchWithAuth(`oms-service/orders/seller/id/${encodeURIComponent(String(record.id))}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                });
                toast.success("Seller actualizado correctamente");

                if (navigateAfter === "back") router.push("/cuenta/cuentas-comercio/sellers");
            } catch (e: any) {
                toast.error(e?.message || "No se pudo guardar el seller");
            } finally {
                setSaving(false);
            }
        },
        [fetchWithAuth, record, router]
    );

    const headerActions = useMemo<Action[]>(
        () => [
            { label: "Aplicar", variant: "success", icon: <CheckCircleIcon className="h-5 w-5" />, onClick: () => doSave(), disabled: true },
            { label: "Guardar", variant: "success", icon: <SaveOutlined className="h-4 w-4" />, onClick: () => doSave("back"), disabled: true },
            { label: "Volver al listado", variant: "secondary", icon: <XCircleIcon className="h-5 w-5" />, onClick: () => router.push("/cuenta/cuentas-comercio/sellers"), disabled: true },
        ],
        [doSave, router]
    );

    usePageHeader(
        () =>
        ({
            title: (
                <div>
                    <div className="text-xs font-semibold uppercase text-blue-600 tracking-wider">Seller</div>
                    <div className="text-2xl font-semibold text-gray-900">{record?.name ?? "—"}</div>
                </div>
            ),
            action: headerActions,
            status: record
                ? {
                    text: record.status,
                    variant: record.status?.toLowerCase() === "activo" ? "success" : "warning",
                }
                : undefined,
        } as unknown as PageHeaderProps),
        [record?.name, record?.status, headerActions]
    );

    if (loading) {
        return (
            <div className="p-6">
                <div className="bg-white flex items-center justify-center px-4 py-6 text-center text-gray-500 text-sm">
                    <ArrowPathIcon className="h-5 w-5 inline animate-spin mr-2" />
                    Cargando…
                </div>
            </div>
        );
    }

    if (!record) return <p className="p-4 text-red-500">Registro no encontrado</p>;

    return (
        <div className="p-6 bg-white">
            <SellersFields record={record} readOnly={true} onChange={handleChange} />
            {saving && <p className="pt-4 text-sm text-gray-500">Guardando…</p>}
        </div>
    );

}
