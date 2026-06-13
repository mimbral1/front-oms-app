// views\Cuenta\CuentasComercio\CanalesVenta\Resumen\Resumen.tsx

"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";
import type { Action, PageHeaderProps } from "@/components/layout/page-header";
import { CheckCircleIcon, XCircleIcon, ArrowPathIcon, ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import SaveOutlined from "@mui/icons-material/SaveOutlined";
import { SalesChannelFields, SalesChannel } from "@/features/cuenta/components/cuentascomercio/canalesventa/SalesChannelsFields";
import { useFetchWithAuth } from "@/lib/http/client";
import { useAuth } from "@/app/context/auth/AuthContext";
import { toast } from "react-hot-toast";

/* ---------- estado inicial (solo para tipado) ---------- */
const EMPTY: SalesChannel = {
    id: "",
    nombre: "",
    idCorto: "",
    refId: "",
    moneda: "",
    pickingExterno: false,
    capturaAutoPostPicking: false,
    asociadas: { catalogo: "", precios: "", stock: "", pedidos: "", entrega: "" },
    status: "Activo",
    created: { username: "—", email: "—", date: "—" },
    // companyId/companyName opcionales (se completan desde API)
};

export default function SalesChannelsResumenView() {
    const router = useRouter();
    const { id } = useParams();
    const recordId = Array.isArray(id) ? id[0] : id;

    const { fetchWithAuth } = useFetchWithAuth();
    const { user } = useAuth();

    const [record, setRecord] = useState<SalesChannel | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // manejo de errores
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    /* Mantener refs estables para evitar loops en header */
    const recordRef = useRef(record);
    const userRef = useRef(user);
    useEffect(() => { recordRef.current = record; }, [record]);
    useEffect(() => { userRef.current = user; }, [user]);

    /* ---------- cargar detalle desde la API ---------- */
    useEffect(() => {
        let mounted = true;
        const load = async () => {
            try {
                setLoading(true);
                setErrorMessage(null);

                const res = await fetchWithAuth<any>(
                    `comerce-service/sales-channel/${recordId}`
                );
                if (!mounted) return;

                // Si la API responde { message: "Tu usuario no tiene permiso..." }
                if (res && typeof res === "object" && "message" in res && !("data" in res)) {
                    const msg = String(res.message || "Error al cargar el canal de venta.");
                    toast.error(msg);
                    setRecord(null);
                    return;
                }

                const a = (res as { ok?: boolean; data?: any })?.data || {};

                // ───────── USUARIO CREADOR ─────────
                const createdUserId = a?.UserCreated ? String(a.UserCreated) : null;
                let creador;
                if (createdUserId) {
                    try {
                        const u = await fetchWithAuth<any>(`idservice/perfiles/${createdUserId}`);
                        creador = {
                            nombre: [u?.Nombres, u?.Apellidos].filter(Boolean).join(" "),
                            email: u?.Email ?? "",
                            avatar: u?.URLImagenPerfil ?? "",
                        };
                    } catch {
                        creador = undefined;
                    }
                }

                // ───────── USUARIO MODIFICADOR ─────────
                const modifiedUserId = a?.UserModified ? String(a.UserModified) : null;
                let modificador;
                if (modifiedUserId) {
                    try {
                        const u = await fetchWithAuth<any>(`idservice/perfiles/${modifiedUserId}`);
                        modificador = {
                            nombre: [u?.Nombres, u?.Apellidos].filter(Boolean).join(" "),
                            email: u?.Email ?? "",
                            avatar: u?.URLImagenPerfil ?? "",
                        };
                    } catch {
                        modificador = undefined;
                    }
                }

                // ───────── FECHAS ─────────
                const creadorFecha = a?.CreatedAt
                    ? new Date(a.CreatedAt).toLocaleString("es-CL")
                    : "—";

                const modificadorFecha = a?.UpdatedAt
                    ? new Date(a.UpdatedAt).toLocaleString("es-CL")
                    : "—";

                // mappeo
                const mapped: SalesChannel = {
                    id: String(a?.Id ?? recordId ?? ""),
                    nombre: a?.Name ?? "",
                    idCorto: a?.IdCorto ?? "",           // si backend no lo envía, queda vacío
                    refId: a?.ReferenceId ?? "",
                    moneda: "",                          // UI-only aquí
                    pickingExterno: Boolean(a?.ExternalDelivery),
                    capturaAutoPostPicking: false,       // UI-only aquí
                    asociadas: { catalogo: "", precios: "", stock: "", pedidos: "", entrega: "" },
                    status: a?.IsActive ? "Activo" : "Inactivo",
                    created: {
                        username: "",                      // si luego hay endpoint de usuarios, lo traemos
                        email: "",
                        date: a?.CreatedAt ? new Date(a.CreatedAt).toLocaleString("es-CL") : "—",
                    },
                    companyId: typeof a?.CompanyId === "number" ? a.CompanyId : undefined,
                    companyName: a?.CompanyName ?? undefined,
                    priceLists: Array.isArray(a?.priceLists)
                        ? a.priceLists.map((pl: any) => ({
                            priceListNum: Number(pl.priceListNum),
                            priceListName: String(pl.priceListName ?? ""),
                            isActive: Boolean(pl.isActive),
                        }))
                        : [],
                    creador,
                    creadorFecha: a?.CreatedAt
                        ? new Date(a.CreatedAt).toLocaleString("es-CL")
                        : "—",
                    modificador,
                    modificadorFecha
                };

                setRecord(mapped);
            } catch (err) {
                console.error("Error cargando Sales Channel:", (err as any)?.payload ?? err);
                if (!mounted) return;

                const msg =
                    typeof err === "string"
                        ? err
                        : (err as any)?.message || "Error al cargar el canal de venta.";

                setErrorMessage(msg);
                setRecord(null);
            } finally {
                if (mounted) setLoading(false);
            }
        };

        if (recordId) load();
        return () => { mounted = false; };
    }, [recordId, fetchWithAuth]);

    /* ---------- handlers ---------- */
    const handleChange = (field: keyof SalesChannel, value: any) => {
        setRecord((prev) => (prev ? { ...prev, [field]: value } : prev));
    };

    // handleSave
    const handleSave = useCallback(
        async (goBack: boolean = false) => {
            const current = recordRef.current;
            const currentUser = userRef.current;
            if (!current) return;

            const validPriceLists = (current.priceLists || []).filter(
                (pl) => typeof pl.priceListNum === "number" && pl.priceListNum > 0
            );

            const body = {
                Name: current.nombre,
                ExternalDelivery: current.pickingExterno ? 1 : 0,
                IsActive: current.status === "Activo" ? 1 : 0,
                UserModified: Number(currentUser?.id ?? 0),
                priceLists: validPriceLists.map((pl) => ({
                    priceListNum: pl.priceListNum,
                    isActive: pl.isActive ? 1 : 0,
                })),
            };

            setSaving(true);
            try {
                await fetchWithAuth(
                    `comerce-service/sales-channel/${current.id}`,
                    {
                        method: "PATCH",
                        body: JSON.stringify(body),
                    }
                );
                toast.success("Canal de venta actualizado correctamente");

                //  solo guardar vuelve atrás
                if (goBack) {
                    router.push("/cuenta/cuentas-comercio/canales-venta");
                }
            } catch (err) {
                console.error(err);
                toast.error("Ocurrió un error al guardar el canal de venta");
            }
            finally {
                setSaving(false);
            }
        },
        [fetchWithAuth, router]
    );


    /* ---------- acciones header (estables) ---------- */
    const headerActions: Action[] = useMemo(
        () => [
            {
                label: "Aplicar",
                variant: "success",
                icon: saving
                    ? <ArrowPathIcon className="h-5 w-5 animate-spin" />
                    : <CheckCircleIcon className="h-5 w-5" />,
                onClick: () => handleSave(false),
                disabled: saving,
            },
            {
                label: "Guardar",
                variant: "success",
                icon: saving
                    ? <ArrowPathIcon className="h-5 w-5 animate-spin" />
                    : <SaveOutlined className="h-5 w-5" />,
                onClick: () => handleSave(true),
                disabled: saving,
            },
            {
                label: "Volver al listado",
                variant: "secondary",
                icon: <XCircleIcon className="h-5 w-5" />,
                onClick: () => router.push('/cuenta/cuentas-comercio/canales-venta'),
                disabled: saving
            },
        ],
        [router, handleSave, saving]
    );

    usePageHeader(
        () =>
        ({
            title: (
                <div>
                    <div className="text-xs font-semibold uppercase text-blue-600 tracking-wider">Canales de venta</div>
                    <div className="text-2xl font-semibold text-gray-900">Resumen</div>
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
    );

    /* ---------- render ---------- */
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

    if (errorMessage && !loading) {
        return (
            <div className="p-6">
                <div
                    className="bg-red-50 border-l-4 border-red-400 p-4 text-red-700 rounded-md shadow-sm"
                    role="alert"
                >
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <ExclamationTriangleIcon
                                className="h-5 w-5 text-red-400"
                                aria-hidden="true"
                            />
                        </div>
                        <div className="ml-3">
                            <h3 className="text-sm font-medium">
                                Error al cargar el canal de venta
                            </h3>
                            <p className="mt-2 text-sm">
                                {errorMessage}
                            </p>
                            <div className="mt-4">
                                <div className="-mx-2 -my-1.5 flex">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setErrorMessage(null);
                                            setLoading(true);
                                            // fuerza re-ejecución del effect
                                            router.refresh();
                                        }}
                                        className="rounded-md bg-red-50 px-2 py-1.5 text-sm font-medium text-red-800 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2 focus:ring-offset-red-50"
                                    >
                                        Reintentar
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!record) return null;

    return (
        <div className="p-6 bg-white">
            {/* En Resumen NO pasamos isCreate, así Ref ID es read-only y se muestran tarjetas de usuario */}
            <SalesChannelFields
                record={record}
                readOnly={false}
                onChange={handleChange}
                blockRenderUntilReady
            />
            {/* {saving && <div className="mt-2 text-sm text-gray-500">Guardando…</div>} */}
        </div>
    );

}
