// app/views/Operaciones/Solicitudes/Detail/Resumen.tsx
"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";
import type { Action, PageHeaderProps } from "@/components/layout/page-header";
import {
    CheckCircleIcon,
    XCircleIcon,
    EllipsisHorizontalIcon,
    ArrowPathIcon,
} from "@heroicons/react/24/outline";
import SaveOutlined from "@mui/icons-material/SaveOutlined";
import { SolicitudesRmsFields, SolicitudRms } from "@/features/customers/components/logistica/solicitudesview/SolicitudesRmsFields";
import { useFetchWithAuth } from "@/lib/http/client";
import { useAuth } from "@/app/context/auth/AuthContext";
import { ActionButton } from "@/components/ui/button/action-button";

/* ---------- Tipos ---------- */
type Estado = "Procesando" | "Finalizada" | "Rechazada";

const EMPTY: SolicitudRms = {
    transportista: "",
    deadline: "",
    clienteNombre: "",
    clienteApellido: "",
    clienteEmail: "",
    flowName: "",
    permitirSustitucion: false,
    pickearNuevoPedido: false,
    facturarPedido: false,
    solicitarNotaCredito: false,
    creador: { nombre: "—", email: "—", fecha: "—" },
    modificador: { nombre: "—", email: "—", fecha: "—" },
};

/* ---------- Mock helper: trae el estado desde el listado (ids 1..5) ---------- */
/* Igual a los ids/estados usados en el View para que la navegación calce 1:1.  :contentReference[oaicite:3]{index=3} */
function getEstadoById(id: string | number): Estado {
    const n = Number(id);
    if (n === 1 || n === 3) return "Procesando";
    if (n === 2 || n === 4) return "Finalizada";
    return "Rechazada"; // id 5
}

export default function SolicitudesRmsResumenView() {
    const router = useRouter();
    const { id } = useParams();
    const recordId = Array.isArray(id) ? id[0] : id;

    const { fetchWithAuth } = useFetchWithAuth();
    const { user } = useAuth();

    const [record, setRecord] = useState<SolicitudRms | null>(null);
    const [estado, setEstado] = useState<Estado>("Procesando");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Modal de acciones (⋯) y modal de cancelación
    const [showActions, setShowActions] = useState(false);
    const [showCancelModal, setShowCancelModal] = useState(false);

    // Form de cancelación
    const [confirmCancel, setConfirmCancel] = useState(true);
    const [cancelMotivo, setCancelMotivo] = useState("Pedido de Cliente");
    const [cancelComentarios, setCancelComentarios] = useState("");

    /* Refs estables (patrón de tu Resumen)  :contentReference[oaicite:4]{index=4} */
    const recordRef = useRef(record);
    const userRef = useRef(user);
    useEffect(() => { recordRef.current = record; }, [record]);
    useEffect(() => { userRef.current = user; }, [user]);

    /* ---------- cargar detalle (MOCK) ---------- */
    useEffect(() => {
        let mounted = true;
        const load = async () => {
            try {
                setLoading(true);

                // Aquí iría: const res = await fetchWithAuth(...); mapeo desde API real.
                // MOCK consistente con la captura y usando el estado derivado del View.  :contentReference[oaicite:5]{index=5}
                const a = {
                    Id: recordId,
                    Transportista: "Retiro en tienda",
                    Deadline: "28/10/2023 15:07",
                    ClienteNombre: "Jona",
                    ClienteApellido: "Valera",
                    ClienteEmail: "jonathan.valera@fizzmod.com",
                    FlowName: "Reposición de item vencido",
                    PermitirSustitucion: 0,
                    PickearNuevoPedido: 1,
                    FacturarPedido: 1,
                    SolicitarNotaCredito: 0,
                    UserCreated: { name: "Ignacio Guggini", email: "ignacio.guggini@...", date: "27/10/2023 15:08:11" },
                    UserModified: { name: "Ignacio Guggini", email: "ignacio.guggini@...", date: "27/10/2023 15:08:11" },
                };

                if (!mounted) return;

                const mapped: SolicitudRms = {
                    id: String(a?.Id ?? recordId ?? ""),
                    transportista: a?.Transportista ?? "",
                    deadline: a?.Deadline ?? "",
                    clienteNombre: a?.ClienteNombre ?? "",
                    clienteApellido: a?.ClienteApellido ?? "",
                    clienteEmail: a?.ClienteEmail ?? "",
                    flowName: a?.FlowName ?? "",
                    permitirSustitucion: Boolean(a?.PermitirSustitucion),
                    pickearNuevoPedido: Boolean(a?.PickearNuevoPedido),
                    facturarPedido: Boolean(a?.FacturarPedido),
                    solicitarNotaCredito: Boolean(a?.SolicitarNotaCredito),
                    creador: {
                        nombre: a?.UserCreated?.name ?? "—",
                        email: a?.UserCreated?.email ?? "—",
                        fecha: a?.UserCreated?.date ?? "—",
                    },
                    modificador: {
                        nombre: a?.UserModified?.name ?? "—",
                        email: a?.UserModified?.email ?? "—",
                        fecha: a?.UserModified?.date ?? "—",
                    },
                };

                setRecord(mapped);
                setEstado(getEstadoById(recordId as string));
            } catch (err) {
                console.error("Error cargando solicitud RMS (mock):", err);
                setRecord({ ...EMPTY, id: String(recordId ?? "") });
            } finally {
                setLoading(false);
            }
        };

        if (recordId) load();
        return () => { mounted = false; };
    }, [recordId, fetchWithAuth]);

    /* ---------- handlers ---------- */
    const handleChange = (field: keyof SolicitudRms, value: any) => {
        setRecord((prev) => (prev ? { ...prev, [field]: value } : prev));
    };

    const handleSave = useCallback(async () => {
        const current = recordRef.current;
        const currentUser = userRef.current;
        if (!current) return;

        const body: any = {
            Transportista: current.transportista,
            Deadline: current.deadline,
            ClienteNombre: current.clienteNombre,
            ClienteApellido: current.clienteApellido,
            ClienteEmail: current.clienteEmail,
            FlowName: current.flowName,
            PermitirSustitucion: current.permitirSustitucion ? 1 : 0,
            PickearNuevoPedido: current.pickearNuevoPedido ? 1 : 0,
            FacturarPedido: current.facturarPedido ? 1 : 0,
            SolicitarNotaCredito: current.solicitarNotaCredito ? 1 : 0,
            UserModified: Number(currentUser?.id ?? 0),
        };

        setSaving(true);
        try {
            // await fetchWithAuth(`rms-service/requests/${current.id}`, { method: "PUT", body: JSON.stringify(body) });
            console.log("PUT (mock) body:", body);
        } catch (err) {
            console.error("Error al guardar RMS:", err);
        } finally {
            setSaving(false);
        }
    }, [fetchWithAuth]);

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
                icon: saving ? <ArrowPathIcon className="h-5 w-5 animate-spin" /> : <SaveOutlined className="h-5 w-5" />,
                onClick: handleSave,
                disabled: saving,
            },
            {
                label: "Volver al listado",
                variant: "secondary",
                icon: <XCircleIcon className="h-5 w-5" />,
                onClick: () => router.push("/customers/logistica/solicitudes-rms"),
                disabled: saving,
            },
            // Botón para abrir el modal de acciones 
            { label: "Más", variant: "gray", icon: <EllipsisHorizontalIcon className="h-5 w-5" />, onClick: () => setShowActions(true) },
        ],
        [router, handleSave, saving]
    );

    usePageHeader(
        () =>
        ({
            title: (
                <div>
                    <div className="text-xs font-semibold uppercase text-blue-600 tracking-wider">Request</div>
                    <div className="text-2xl font-semibold text-gray-900">{record?.id || "—"}</div>
                </div>
            ),
            action: headerActions,
            status: { text: estado, variant: estado === "Procesando" ? "warning" : estado === "Finalizada" ? "success" : "danger" },
        } as unknown as PageHeaderProps),
        [headerActions, record?.id, estado]
    );

    /* ---------- render ---------- */
    if (loading) return <div className="p-6">Cargando…</div>;
    if (!record) return <div className="p-6 text-red-600">No se encontró la solicitud.</div>;

    return (
        <div className="relative p-6 bg-white">
            {/* Formulario principal */}
            <SolicitudesRmsFields record={record} readOnly={false} onChange={handleChange} />

            {/* Modal: Request Actions (⋯)  — base idéntica, agregamos “Cancelar solicitud” solo si Procesando.  :contentReference[oaicite:6]{index=6} */}
            {showActions && (
                <div className="fixed inset-0 z-40 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/30" onClick={() => setShowActions(false)} />
                    <div className="relative z-50 w-[440px] rounded-xl bg-white p-6 shadow-xl">
                        <div className="mb-4 text-xs font-semibold text-gray-500">REQUEST ACTIONS</div>
                        <div className="flex flex-col gap-4">
                            {/* Rechazar */}
                            <button
                                type="button"
                                className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3 hover:bg-gray-50"
                                onClick={() => {
                                    console.log("Rechazar (mock)");
                                    setShowActions(false);
                                }}
                            >
                                <span className="flex items-center gap-2 text-blue-600">
                                    <XCircleIcon className="h-5 w-5" />
                                    Rechazar
                                </span>
                            </button>

                            {/* Aprobar */}
                            <button
                                type="button"
                                className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3 hover:bg-gray-50"
                                onClick={() => {
                                    console.log("Aprobar (mock)");
                                    setShowActions(false);
                                }}
                            >
                                <span className="flex items-center gap-2 text-blue-600">
                                    <CheckCircleIcon className="h-5 w-5" />
                                    Aprobar
                                </span>
                            </button>

                            {/* Cancelar solicitud — solo si está Procesando */}
                            {estado === "Procesando" && (
                                <button
                                    type="button"
                                    className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3 hover:bg-gray-50"
                                    onClick={() => {
                                        setShowActions(false);
                                        setShowCancelModal(true);
                                    }}
                                >
                                    <span className="flex items-center gap-2 text-blue-600">
                                        <XCircleIcon className="h-5 w-5" />
                                        Cancelar solicitud
                                    </span>
                                </button>
                            )}
                        </div>

                        <button
                            type="button"
                            className="absolute right-3 top-3 rounded-md p-1 text-gray-400 hover:bg-gray-100"
                            onClick={() => setShowActions(false)}
                            aria-label="Cerrar"
                        >
                            ✕
                        </button>
                    </div>
                </div>
            )}

            {/* Modal: Cancelación (según tu mock de “CANCEL”) */}
            {showCancelModal && (
                <div className="fixed inset-0 z-40 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/30" onClick={() => setShowCancelModal(false)} />
                    <div className="relative z-50 w-[560px] rounded-xl bg-white p-6 shadow-xl">
                        <div className="mb-4 text-sm font-semibold text-gray-600">CANCEL</div>

                        <div className="space-y-4">
                            {/* Confirmar cancelación */}
                            <label className="flex items-center gap-2 text-sm">
                                <input
                                    type="checkbox"
                                    className="h-4 w-4"
                                    checked={confirmCancel}
                                    onChange={(e) => setConfirmCancel(e.target.checked)}
                                />
                                Confirmar cancelación
                            </label>

                            {/* Motivo (simple input con adornos; visualmente similar a tu captura) */}
                            <div>
                                <div className="text-xs font-semibold text-blue-600 mb-1">Motivo</div>
                                <div className="relative">
                                    <input
                                        className="w-full border-b border-gray-300 text-sm outline-none pr-8"
                                        value={cancelMotivo}
                                        onChange={(e) => setCancelMotivo(e.target.value)}
                                    />
                                    <span className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 pr-1 text-gray-400">▾</span>
                                </div>
                            </div>

                            {/* Comentarios */}
                            <div>
                                <div className="text-xs font-semibold text-blue-600 mb-1">Comentarios</div>
                                <textarea
                                    rows={3}
                                    className="w-full border-b border-gray-300 text-sm outline-none"
                                    value={cancelComentarios}
                                    onChange={(e) => setCancelComentarios(e.target.value)}
                                    placeholder="El cliente anuló su solicitud de devolución."
                                />
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="mt-6 flex items-center justify-end gap-3">
                            <ActionButton
                                type="button"
                                variant="secondary"
                                onClick={() => setShowCancelModal(false)}
                            >
                                Cancelar
                            </ActionButton>
                            <ActionButton
                                type="button"
                                variant="primary"
                                disabled={!confirmCancel}
                                onClick={() => {
                                    console.log("Cancelar solicitud (mock):", {
                                        id: record?.id,
                                        motivo: cancelMotivo,
                                        comentarios: cancelComentarios,
                                    });
                                    setShowCancelModal(false);
                                }}
                            >
                                Aplicar
                            </ActionButton>
                        </div>

                        <button
                            type="button"
                            className="absolute right-3 top-3 rounded-md p-1 text-gray-400 hover:bg-gray-100"
                            onClick={() => setShowCancelModal(false)}
                            aria-label="Cerrar"
                        >
                            ✕
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
