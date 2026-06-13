// views\PedidosView\Configuraciones\PerfilesFulfillment\Resumen\PerfilesFulfillmentResumen.tsx
"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";
import type { Action, PageHeaderProps } from "@/components/layout/page-header";
import { CheckCircleIcon, XCircleIcon, ArrowPathIcon } from "@heroicons/react/24/outline";
import SaveOutlined from "@mui/icons-material/SaveOutlined";
import { PerfilesFulfillmentFields, FulfillmentProfile } from "@/features/pedidos/components/configuraciones/perfilesfulfillment/PerfilesFulfillmentFields";

/* Estado inicial (mocks para tipado y carga) */
const EMPTY: FulfillmentProfile = {
    nombre: "Store pickup - Consolidar",
    motor: "Advanced",
    tiposEntrega: ["drive_through"],
    restriccionEntrega: "Shipping type",
    atribucionOlas: "As soon as possible",
    crearEnviosInternos: true,
    tipoDistribucionInterna: "Movements",
    priorizarPickingEnAlmacenEntrega: true,
    onlyPreferredWithStock: false,
    usarPickUpPoint: false,
    factorFoundRateFactor: "Quantity",
    factorFoundRateValor: "Found-rate (valor)",
    factorFoundRatePercent: 0,
    prioridadTransporte: "Lower shipping cost",
    atribucionTimeSlot: "Ignore quota",
    permitirSplit: true,
    tipoSplit: "Order",
    splitMax: 3,
    valorMinimo: "",
    consolidarEntrega: true,
    recalcularTransportista: false,
    status: "Activo",
    created: { username: "—", email: "—", date: "—" },
    updatedAt: "—",

    saltearOlaPickingExpress: false,
    usuarioCreadorNombre: "Ariel Mikowski",
    usuarioCreadorEmail: "ariel_mikowski@example.com",
    fechaCreacion: "13/08/2024 17:12:58",
    usuarioModificadorNombre: "Ariel Mikowski",
    usuarioModificadorEmail: "ariel_mikowski@example.com",
    ultimaModificacion: "05/09/2025 11:24:07",

};

export default function PerfilesFulfillmentResumenView() {
    const router = useRouter();
    const { id } = useParams();
    const recordId = Array.isArray(id) ? id[0] : id;

    const [record, setRecord] = useState<FulfillmentProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // refs estables para header
    const recordRef = useRef(record);
    useEffect(() => { recordRef.current = record; }, [record]);

    /* Carga de detalle (mock por ahora) */
    useEffect(() => {
        let mounted = true;
        const load = async () => {
            try {
                setLoading(true);
                // cuando exista endpoint, reemplazar por fetchWithAuth(...)
                const detalle = { ...EMPTY, id: String(recordId ?? "") };
                if (!mounted) return;
                setRecord(detalle);
            } catch (e) {
                console.error("Error cargando perfil de fulfillment:", e);
                setRecord({ ...EMPTY, id: String(recordId ?? "") });
            } finally {
                if (mounted) setLoading(false);
            }
        };
        if (recordId) load();
        return () => { mounted = false; };
    }, [recordId]);

    const handleChange = (field: keyof FulfillmentProfile, value: any) => {
        setRecord((prev) => (prev ? { ...prev, [field]: value } : prev));
    };

    const handleSave = useCallback(async () => {
        const current = recordRef.current;
        if (!current) return;
        try {
            setSaving(true);
            // aquí PUT real cuando esté disponible
            console.log("Guardar Fulfillment Profile (payload)", current);
        } catch (e) {
            console.error("Error al guardar:", e);
        } finally {
            setSaving(false);
        }
    }, []);

    /* headerActions (mismo patrón que Resumen de Canales) */
    const headerActions: Action[] = useMemo(
        () => [
            {
                label: "Aplicar",
                variant: "success",
                icon: saving ? <ArrowPathIcon className="h-5 w-5 animate-spin" /> : <CheckCircleIcon className="h-5 w-5" />,
                onClick: handleSave,
                disabled: saving,
            },
            {
                label: "Guardar",
                variant: "success",
                icon: saving ? <ArrowPathIcon className="h-5 w-5 animate-spin" /> : <SaveOutlined className="h-4 w-4" />,
                onClick: handleSave,
                disabled: saving,
            },
            { label: "Volver al listado", variant: "secondary", icon: <XCircleIcon className="h-5 w-5" />, onClick: () => router.push("/pedidos/configuraciones/perfiles-fulfillment"), disabled: saving },
        ],
        [router, handleSave, saving]
    ); // :contentReference[oaicite:11]{index=11}

    usePageHeader(
        () =>
        ({
            title: (
                <div>
                    <div className="text-xs font-semibold uppercase text-blue-600 tracking-wider">Perfiles de Fulfillment</div>
                    <div className="text-2xl font-semibold text-gray-900">{record?.nombre || id}</div>
                </div>
            ),
            action: headerActions,
            status: saving
                ? { text: "Guardando…", variant: "info" }
                : record
                    ? { text: record.status!, variant: record.status === "Activo" ? "success" : "warning" }
                    : undefined,
        } as unknown as PageHeaderProps),
        [headerActions, saving, record?.status]
    ); // :contentReference[oaicite:12]{index=12}

    if (loading) return <div className="p-6">Cargando…</div>;
    if (!record) return <div className="p-6 text-red-600">No se encontró el perfil.</div>;

    return (
        <div className="p-6 bg-white">
            <PerfilesFulfillmentFields record={record} readOnly={false} onChange={handleChange} />
        </div>
    );
}
