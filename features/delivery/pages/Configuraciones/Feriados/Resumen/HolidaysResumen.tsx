// views\Delivery\Configuraciones\Feriados\Resumen\Resumen.tsx
"use client";

/* === Resumen Holiday (PUT) ===
   - GET /holidays/{id}
   - PUT /holidays/{id}
   - Header: Aplicar / Guardar / Eliminar / Cancelar
   - Confirmación de eliminación inline (sin alert), consistente con el estilo de la app
   - Pasa record al Fields (isCreate=false) para mostrar usuarios creador/modificador
*/

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";
import type { Action, PageHeaderProps } from "@/components/layout/page-header";
import { CheckCircleIcon, XCircleIcon, ArrowPathIcon, TrashIcon } from "@heroicons/react/24/outline";
import SaveOutlined from "@mui/icons-material/SaveOutlined";
import { HolidaysFields, HolidayRecord } from "@/features/delivery/components/configuraciones/feriados/HolidaysFields";
import { useFetchWithAuth } from "@/lib/http/client";
import { BASE_DELIVERY_SERVICE } from "@/lib/http/endpoints";

const HOLIDAY_ENDPOINT = `${BASE_DELIVERY_SERVICE}/holiday`;
const CARRIER_ENDPOINT = `${BASE_DELIVERY_SERVICE}/carrier`;

const EMPTY: HolidayRecord = {
    id: "",
    name: "",
    day: "",
    status: "active",
    target: { delivery: false },
    scope: { carrierIds: [], carrierReferenceIds: [] },
    description: "",
};

export default function HolidaysResumenView() {
    const router = useRouter();
    const { id } = useParams();
    const recordId = Array.isArray(id) ? id[0] : id;
    const { fetchWithAuth } = useFetchWithAuth();

    const [record, setRecord] = useState<HolidayRecord | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // confirmación visual para eliminar
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleting, setDeleting] = useState(false);

    // referencias estables
    const recordRef = useRef(record);
    useEffect(() => {
        recordRef.current = record;
    }, [record]);

    // Cargar detalle
    useEffect(() => {
        let mounted = true;
        const load = async () => {
            try {
                setLoading(true);

                if (!BASE_DELIVERY_SERVICE) {
                    throw new Error("Falta NEXT_PUBLIC_BASE_URL_DELIVERY_SERVICE en variables de entorno");
                }

                const res = await fetchWithAuth<any>(`${HOLIDAY_ENDPOINT}/${recordId}`);
                const a = res || {};
                const carrierIds = Array.isArray(a?.scope?.carrierIds) ? a.scope.carrierIds : [];
                let carrierReferenceIds = Array.isArray(a?.scope?.carrierReferenceIds) ? a.scope.carrierReferenceIds : [];

                if (carrierIds.length > 0) {
                    try {
                        const carriersResponse = await fetchWithAuth<any>(CARRIER_ENDPOINT);
                        const carriers = Array.isArray(carriersResponse?.data) ? carriersResponse.data : [];
                        const nameById = new Map<string, string>(
                            carriers
                                .filter((carrier: any) => carrier?.id)
                                .map((carrier: any) => [String(carrier.id), String(carrier?.name ?? carrier?.refId ?? carrier.id)])
                        );
                        const resolvedNames = carrierIds
                            .map((carrierId: string | number) => nameById.get(String(carrierId)))
                            .filter((name: string | undefined): name is string => Boolean(name));

                        if (resolvedNames.length > 0) {
                            carrierReferenceIds = resolvedNames;
                        }
                    } catch (carrierError) {
                        console.error("GET carriers error:", carrierError);
                    }
                }

                try {
                    sessionStorage.setItem(`holiday-detail:${String(recordId ?? "")}`, JSON.stringify(a));
                } catch {
                    // ignore cache write errors
                }

                const mapped: HolidayRecord = {
                    id: String(a?.id ?? recordId ?? ""),
                    name: a?.name ?? "",
                    day: typeof a?.day === "string" ? a.day.substring(0, 10) : "",
                    status: String(a?.status ?? "").toLowerCase() === "active" ? "active" : "inactive",
                    target: { delivery: carrierIds.length > 0 },
                    scope: {
                        carrierIds,
                        carrierReferenceIds,
                    },
                    description: "",
                    created: {
                        user: a?.userCreated ?? "—",
                        date: a?.dateCreated ? new Date(a.dateCreated).toLocaleString("es-CL") : "—",
                    },
                    modified: {
                        user: a?.userModified ?? "—",
                        date: a?.dateModified ? new Date(a.dateModified).toLocaleString("es-CL") : "—",
                    },
                };
                if (mounted) setRecord(mapped);
            } catch (e) {
                console.error("GET holiday error:", e);
                if (mounted) setRecord({ ...EMPTY, id: String(recordId ?? "") });
            } finally {
                if (mounted) setLoading(false);
            }
        };
        if (recordId) load();
        return () => {
            mounted = false;
        };
    }, [recordId, fetchWithAuth]);

    const handleChange = (field: keyof HolidayRecord, value: any) =>
        setRecord((prev) => (prev ? { ...prev, [field]: value } : prev));

    const handleSave = useCallback(async () => {
        const current = recordRef.current;
        if (!current?.id) return;

        const payload = {
            name: current.name,
            day: current.day,
            status: current.status,
            target: { delivery: !!current.target?.delivery },
            scope: {
                carrierIds: current.scope?.carrierIds ?? [],
                carrierReferenceIds: current.scope?.carrierReferenceIds ?? [],
            },
            description: current.description ?? "",
            user: current.modified?.user ?? "JCS01",
        };

        setSaving(true);
        try {
            const resp = await fetchWithAuth<any>(`comerce-service/holidays/${current.id}`, {
                method: "PUT",
                body: JSON.stringify(payload),
            });
            console.log(resp?.message ?? "Holiday actualizada.");
        } catch (e) {
            console.error("PUT holiday error:", e);
        } finally {
            setSaving(false);
        }
    }, [fetchWithAuth]);

    // Eliminar por ID con confirmación inline
    const handleDeleteById = useCallback(async () => {
        const idToDelete = recordRef.current?.id ?? recordId;
        if (!idToDelete) {
            console.warn("No hay ID para eliminar.");
            return;
        }

        setDeleting(true);
        try {
            const resp = await fetchWithAuth<any>(`comerce-service/holidays/${idToDelete}`, {
                method: "DELETE",
            });
            console.log(resp?.message ?? "Holiday eliminada.");
            router.push("/delivery/configuraciones/feriados"); // volver al listado tras eliminar
        } catch (e) {
            console.error("DELETE holiday error:", e);
        } finally {
            setDeleting(false);
            setShowDeleteConfirm(false);
        }
    }, [fetchWithAuth, recordId, router]);

    const actions: Action[] = useMemo(
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
                onClick: async () => {
                    await handleSave();
                    router.push("/delivery/configuraciones/feriados");
                },
                disabled: saving,
            },
            {
                label: "Eliminar",
                variant: "error",
                icon: deleting ? <ArrowPathIcon className="h-5 w-5 animate-spin" /> : <TrashIcon className="h-5 w-5" />,
                onClick: () => setShowDeleteConfirm(true),
                disabled: deleting || saving,
            },
            {
                label: "Volver al listado",
                variant: "secondary",
                icon: <XCircleIcon className="h-5 w-5" />,
                onClick: () => router.push("/delivery/configuraciones/feriados"),
                disabled: saving,
            },
        ],
        [router, handleSave, saving, deleting]
    );

    usePageHeader(
        () =>
        ({
            title: (
                <div>
                    <div className="text-xs font-semibold uppercase text-blue-600 tracking-wider">Feriados</div>
                    <div className="text-2xl font-semibold text-gray-900">{record?.name} <span className="text-blue-600 text-lg align-middle">{record?.day}</span></div>
                </div>
            ),
            action: actions,
            status: record
                ? { text: record.status === "active" ? "Activo" : "Inactivo", variant: record.status === "active" ? "success" : "warning" }
                : undefined,
        } as unknown as PageHeaderProps),
        [actions, record?.status]
    );

    if (loading) return <div className="p-6">Cargando…</div>;
    if (!record) return <div className="p-6 text-red-600">No se encontró el feriado.</div>;

    return (
        <div className="p-6">
            {/* Barra de confirmación de eliminación (profesional, sin alert) */}
            {showDeleteConfirm && (
                <div className="mb-4 rounded-lg border border-red-300 bg-red-50 p-4 text-red-800">
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3">
                            <TrashIcon className="h-6 w-6 text-red-600 mt-0.5" />
                            <div>
                                <div className="font-semibold">Confirmar eliminación</div>
                                <div className="text-sm text-red-700">
                                    Estás a punto de eliminar el feriado{" "}
                                    <strong>{record?.name || `#${record?.id}`}</strong>. Esta acción es permanente y no se puede deshacer.
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleDeleteById}
                                disabled={deleting}
                                className={`rounded-md px-4 py-2 text-sm font-medium text-white ${deleting ? "bg-red-400" : "bg-red-600 hover:bg-red-700"
                                    }`}
                            >
                                {deleting ? "Eliminando…" : "Eliminar definitivamente"}
                            </button>
                            <button
                                onClick={() => setShowDeleteConfirm(false)}
                                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <HolidaysFields record={record} readOnly={false} onChange={handleChange} />
        </div>
    );
}
