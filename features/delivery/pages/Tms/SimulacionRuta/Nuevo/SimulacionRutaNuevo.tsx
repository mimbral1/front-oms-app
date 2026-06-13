// views\Delivery\Tms\SimulacionRuta\Nuevo\Nuevo.tsx
"use client";

import React, { useMemo, useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";
import type { Action, PageHeaderProps } from "@/components/layout/page-header";
import { XCircleIcon } from "@heroicons/react/24/outline";
import SaveOutlined from "@mui/icons-material/SaveOutlined";
import { FaPlus } from "react-icons/fa";
import { SimulacionRuta, SimulacionRutaFields } from "@/features/delivery/components/tms/simulacionruta/SimulacionRutaFields";
import { useAuth } from "@/app/context/auth/AuthContext";
import { useFetchWithAuth } from "@/lib/http/client";

import SimularRutasPanel from "@/features/delivery/components/tms/simulacionruta/SimularRutasPanel";

/* ---------- Registro inicial vacío (tipado) ---------- */
const INITIAL: SimulacionRuta = {
    envio: "",
    fecha_entrega_desde: "",
    fecha_entrega_hasta: "",
    fecha_creacion: "",
    fecha_envio: "",
    tipo_entrega: "",
    tipo_vehiculo: "",
    inventario: "",
    rutas: "",
    entregas: "",
    estado: "Borrador",
    usuario_creador: { iniciales: "—", nombre: "—", email: "—" },
};

export default function SimulacionRutaNuevoView() {
    const router = useRouter();
    const { user } = useAuth();
    const { fetchWithAuth } = useFetchWithAuth();

    const [record, setRecord] = useState<SimulacionRuta>({ ...INITIAL });

    const handleChange = <K extends keyof SimulacionRuta>(field: K, value: SimulacionRuta[K]) =>
        setRecord((prev) => ({ ...prev, [field]: value }));

    /* Mantener refs estables para evitar loops en header */
    const recordRef = useRef(record);
    const userRef = useRef(user);
    useEffect(() => {
        recordRef.current = record;
    }, [record]);
    useEffect(() => {
        userRef.current = user;
    }, [user]);

    /* ---------- Crear simulación (mock/POST) ----------
       Si luego con endpoint real, solo reemplazar la URL y payload */
    const handleCreate = useCallback(async () => {
        const current = recordRef.current;
        const currentUser = userRef.current;

        // Validaciones mínimas (fechas e inventario)
        const errors: string[] = [];
        if (!current.fecha_entrega_desde || !current.fecha_entrega_hasta) errors.push("Falta rango de agendamiento.");
        if (!current.inventario) errors.push("Falta seleccionar inventario.");
        if (errors.length) {
            console.warn("Validación antes de crear Simulación:", errors);
            return;
        }

        // Payload base (ajustar nombres cuando esté definido por backend)
        const payload: any = {
            From: current.fecha_entrega_desde,
            To: current.fecha_entrega_hasta,
            Inventory: current.inventario,
            DeliveryTypes: String(current.tipo_entrega || ""), // CSV
            VehicleCounts: current.tipo_vehiculo || "", // futuro: objeto/CSV
            UserCreated: Number((currentUser as any)?.id ?? 0),
        };

        try {
            // MOCK: comentar/ajustar cuando exista endpoint real
            // const resp = await fetchWithAuth<{ ok: boolean; data?: any }>(
            //   "tms-service/route-simulation/create",
            //   { method: "POST", body: JSON.stringify(payload) }
            // );
            console.log("POST (mock) /tms-service/route-simulation/create", payload);

            // limpiar y quedar listo para otro registro (mismo patrón que Nuevo de canales)  :contentReference[oaicite:1]{index=1}
            setRecord({ ...INITIAL });
            // Si quieres navegar al listado:
            // router.push("/tms/simulacion-ruta");
        } catch (err: any) {
            console.error("Error creando Simulación de ruta:", err?.payload ?? err);
        }
    }, [fetchWithAuth]);

    /* ---------- Acciones Header (Guardar / Guardar & Crear nuevo / Cancelar) ----------
       Calcadas al patrón de Nuevo en SalesChannels. */
    const headerActions: Action[] = useMemo(
        () => [
            {
                label: "Guardar",
                variant: "success",
                icon: <SaveOutlined className="h-4 w-4" />,
                onClick: handleCreate,
            },
            {
                label: "Guardar & Crear nuevo",
                variant: "success",
                icon: (
                    <div className="relative flex h-5 w-5 items-center justify-center">
                        <SaveOutlined className="h-4 w-4 text-current" />
                        <div className="absolute -bottom-0.5 -right-0.5 rounded-full bg-white p-[1px]">
                            <FaPlus className="h-2.5 w-2.5 text-blue-500" />
                        </div>
                    </div>
                ),
                onClick: () => {
                    handleCreate();
                    // limpiar se hace dentro de handleCreate si todo OK
                },
            },
            {
                label: "Volver al listado",
                variant: "secondary",
                icon: <XCircleIcon className="h-5 w-5" />,
                onClick: () => router.push("/delivery/tms/simulacion-ruta"),
            },
        ],
        [router, handleCreate]
    );

    /* ---------- PageHeader ----------
       Mismo esquema: título compuesto y acciones. */
    usePageHeader(
        () =>
        ({
            title: (
                <div>
                    <div className="text-xs font-semibold uppercase text-blue-600 tracking-wider">TMS</div>
                    <div className="text-2xl font-semibold text-gray-900">Simular rutas</div>
                </div>
            ),
            action: headerActions,
        } as unknown as PageHeaderProps),
        [headerActions]
    );

    // dentro del componente Nuevo
    type RequestSim = {
        fechaDesde: string;
        fechaHasta: string;
        inventario: string;
        tiposEntregaCsv: string;
        tiposVehiculoCsv?: string;
    };

    const [simReq, setSimReq] = useState<RequestSim | null>(null);

    // lo usaremos como callback desde el Fields
    const handleSimular = useCallback(() => {
        const params = new URLSearchParams({
            from: record.fecha_entrega_desde || "",
            to: record.fecha_entrega_hasta || "",
            inv: record.inventario || "",
            entrega: Array.isArray(record.tipo_entrega)
                ? record.tipo_entrega.join(",")
                : String(record.tipo_entrega || ""),
            vehiculo: Array.isArray(record.tipo_vehiculo)
                ? record.tipo_vehiculo.join(",")
                : String(record.tipo_vehiculo || ""),
        });

        // navega a la vista de simulación
        router.push(`/delivery/tms/simulacion-ruta/nuevo/simular?${params.toString()}`);
    }, [router, record]);

    /* ---------- Render ---------- */
    return (
        <div className="p-6 bg-white">
            {/* Fields de Simulación de ruta (editable). Mantener estructura y grid mostrada en Fields.  */}
            <SimulacionRutaFields
                record={record}
                readOnly={false}
                onChange={handleChange}
                onSimular={handleSimular}
            />

            {simReq && <SimularRutasPanel request={simReq} />}

        </div>
    );
}
