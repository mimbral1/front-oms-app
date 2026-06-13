// views\PickingView\configuraciones\multipicking\sectores\Resumen\SectoresPickingResumen.tsx
"use client";

import React, { useMemo, useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";
import type { Action, PageHeaderProps } from "@/components/layout/page-header";
import {
    CheckCircleIcon,
    XCircleIcon,
    ArrowPathIcon,
    ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import SaveOutlined from "@mui/icons-material/SaveOutlined";
import SectoresPickingFields, {
    SectorPicking,
} from "@/features/picking/components/pickingview/configuraciones/multipicking/sectores/SectoresPickingFields";
import { useApiSectoresPicking } from "@/app/fetchWithAuth/picking/configuraciones/multipicking/sectores-picking/api-sectores-picking";
import { useAuth } from "@/app/context/auth/AuthContext";
import { useFetchWithAuth } from "@/lib/http/client";
import { toast } from "react-hot-toast";

// ===============================
// Lookup de categorías (Code -> Name)
// ===============================
const categoryNameByCode = new Map<string, string>();
// Cache SKU -> Nombre (inyectado desde Fields)
const skuNameByCode = new Map<string, string>();

const toStr = (v: any) => String(v ?? "").trim();
const firstNonEmpty = (...values: any[]) => {
    for (const v of values) {
        const s = toStr(v);
        if (s) return s;
    }
    return "";
};

const registerCategoryName = (target: Record<string, string>, row: any) => {
    const name = firstNonEmpty(row?.Name, row?.name, row?.Nombre, row?.descripcion, row?.description);
    if (!name) return;

    const keys = [row?.Code, row?.code, row?.id, row?._id, row?.ID, row?.categoryId].map(toStr).filter(Boolean);
    keys.forEach((k) => {
        target[k] = name;
        categoryNameByCode.set(k, name);
    });
};

const registerSkuName = (target: Record<string, string>, row: any, fallbackKey?: string) => {
    const name = firstNonEmpty(row?.Name, row?.name, row?.Nombre, row?.Descripcion, row?.description);
    if (!name) return;

    const keys = [
        row?.ItemCode,
        row?.itemCode,
        row?.Code,
        row?.code,
        row?.id,
        row?._id,
        row?.ID,
        row?.productId,
        fallbackKey,
    ]
        .map(toStr)
        .filter(Boolean);

    keys.forEach((k) => {
        target[k] = name;
        skuNameByCode.set(k, name);
    });
};

export default function SectoresPickingResumen() {

    const [record, setRecord] = useState<SectorPicking | null>(null);

    const recordRef = React.useRef<SectorPicking | null>(null);

    useEffect(() => {
        recordRef.current = record;
    }, [record]);

    const router = useRouter();
    const params = useParams<{ id: string }>();
    const id = Array.isArray(params?.id) ? params!.id[0] : params?.id;

    const { user } = useAuth();
    const { fetchWithAuth } = useFetchWithAuth();

    const [saving, setSaving] = useState(false);

    const { getZoneById, updateZone } = useApiSectoresPicking();

    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);


    const load = async () => {
        if (!id) return;

        setLoading(true);
        setErrorMessage(null);

        try {
            const res = await getZoneById(id);
            const data = res.data;

            const categoryNames: Record<string, string> = {};
            const skuNames: Record<string, string> = {};

            const categoryRows = [
                ...(Array.isArray(data?.categories) ? data.categories : []),
                ...(Array.isArray(data?.assignments?.categories) ? data.assignments.categories : []),
            ];
            categoryRows.forEach((c: any) => registerCategoryName(categoryNames, c));

            const skuRows = [
                ...(Array.isArray(data?.skus) ? data.skus : []),
                ...(Array.isArray(data?.products) ? data.products : []),
                ...(Array.isArray(data?.assignments?.skus) ? data.assignments.skus : []),
            ];
            skuRows.forEach((s: any) => registerSkuName(skuNames, s));

            setRecord({
                id: data.id,
                name: data.name,
                categoryIds: data.categoryIds ?? [],
                categoryNames,
                skuIds: data.skuIds ?? [],
                skuNames,
                maxQuantityOrders: data.maxQuantityOrders,
                maxQuantityItems: data.maxQuantityItems,
                status: data.status,
                isActive: data.isActive,

                created: data.createdByUser?.profile
                    ? {
                        username: `${data.createdByUser.profile.nombres} ${data.createdByUser.profile.apellidos}`,
                        email: data.createdByUser.profile.email ?? "",
                        avatar: data.createdByUser.profile.urlImagenPerfil ?? "",
                        date: data.dateCreatedCL,
                    }
                    : undefined,

                modified: data.updatedByUser?.profile
                    ? {
                        username: `${data.updatedByUser.profile.nombres} ${data.updatedByUser.profile.apellidos}`,
                        email: data.updatedByUser.profile.email ?? "",
                        avatar: data.updatedByUser.profile.urlImagenPerfil ?? "",
                        date: data.dateModifiedCL,
                    }
                    : undefined,

            });
        } catch (e: any) {
            console.error("Error cargando sector:", e);
            setErrorMessage(
                e?.message || "No se pudo cargar el sector de picking."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, [id]);

    // ===============================
    // Hidratar nombres de SKUs (al cargar resumen)
    // ===============================
    useEffect(() => {
        if (!record?.skuIds || record.skuIds.length === 0) return;

        const missingSkus = record.skuIds.filter(
            (sku) => !record.skuNames?.[sku]
        );

        if (missingSkus.length === 0) return;

        let mounted = true;

        const loadSkuNames = async () => {
            const skuNames: Record<string, string> = {
                ...(record.skuNames ?? {}),
            };

            try {
                for (const sku of missingSkus) {
                    const queries = [
                        `catalog/products?page=1&pageSize=1&itemCode=${encodeURIComponent(sku)}`,
                        `catalog/products?page=1&pageSize=1&id=${encodeURIComponent(sku)}`,
                    ];

                    let hydrated = false;

                    for (const query of queries) {
                        const res = await fetchWithAuth<any>(query, { method: "GET" });

                        const list =
                            (Array.isArray(res?.data) && res.data) ||
                            (Array.isArray(res?.items) && res.items) ||
                            (Array.isArray(res?.data?.items) && res.data.items) ||
                            [];

                        const product = list[0];
                        if (!product) continue;

                        registerSkuName(skuNames, product, sku);
                        hydrated = !!skuNames[sku];
                        if (hydrated) break;
                    }
                }

                if (!mounted) return;

                setRecord((prev) =>
                    prev
                        ? {
                            ...prev,
                            skuNames,
                        }
                        : prev
                );
            } catch (e) {
                console.warn("No se pudieron hidratar nombres de SKUs", e);
            }
        };

        loadSkuNames();

        return () => {
            mounted = false;
        };
    }, [record?.skuIds]);

    // ===============================
    // Cargar catálogo de categorías (una vez)
    // ===============================
    useEffect(() => {
        let mounted = true;

        const loadCategories = async () => {
            try {
                const res = await fetchWithAuth<any[]>(
                    "catalog/getcategory",
                    { method: "GET" }
                );

                if (!mounted || !Array.isArray(res)) return;

                res.forEach((c) => {
                    registerCategoryName({}, c);
                });

                setRecord((prev) => {
                    if (!prev?.categoryIds?.length) return prev;

                    const mapped = { ...(prev.categoryNames ?? {}) };
                    prev.categoryIds.forEach((id) => {
                        const name = categoryNameByCode.get(String(id));
                        if (name) mapped[String(id)] = name;
                    });

                    return {
                        ...prev,
                        categoryNames: mapped,
                    };
                });
            } catch (e) {
                console.warn("No se pudieron cargar categorías", e);
            }
        };

        loadCategories();

        return () => {
            mounted = false;
        };
    }, [fetchWithAuth]);

    // guardar
    const handleSave = React.useCallback(
        async (goBack = false) => {
            const current = recordRef.current;
            if (!current || !id) return;

            setSaving(true);

            try {
                const resp = await updateZone(id, {
                    name: current.name,
                    categoryIds: current.categoryIds,
                    skuIds: current.skuIds,
                    maxQuantityOrders: current.maxQuantityOrders,
                    maxQuantityItems: current.maxQuantityItems,
                    updatedBy: Number(user?.id ?? 0),
                });

                const messages: string[] = [];

                // ===============================
                // Categorías rechazadas
                // ===============================
                const rejectedCategories = resp?.assignments?.categories?.rejected ?? [];
                rejectedCategories.forEach((r: any) => {
                    const categoryName =
                        categoryNameByCode.get(String(r.id)) ?? r.id;

                    messages.push(
                        `La categoría "${categoryName}" ya está asignada al sector "${r.associatedZone.zoneName}".`
                    );
                });

                // ===============================
                // SKUs rechazados
                // ===============================
                const rejectedSkus = resp?.assignments?.skus?.rejected ?? [];
                rejectedSkus.forEach((r: any) => {
                    const skuCode = String(r.id);
                    const skuName = record?.skuNames?.[skuCode];

                    const label = skuName
                        ? `${skuCode} – ${skuName}`
                        : skuCode;

                    messages.push(
                        `El SKU "${label}" ya está asignado al sector "${r.associatedZone.zoneName}".`
                    );
                });

                // ===============================
                // Resultado final
                // ===============================
                if (messages.length > 0) {
                    toast.error(messages.join("\n"));
                } else {
                    toast.success("Sector de picking actualizado correctamente");
                }

                const perfil = await fetchUsuarioModificador(Number(user?.id));

                setRecord((prev) =>
                    prev
                        ? {
                            ...prev,
                            modified: {
                                ...perfil,
                                date: new Date().toLocaleString("es-CL"),
                            },
                        }
                        : prev
                );

                if (goBack) {
                    router.push("/picking/configuraciones/multipicking/sectores");
                }
            } catch (error) {
                const message =
                    (error as any)?.message ||
                    "Ocurrió un error al guardar el sector de picking";

                toast.error(message);
            } finally {
                setSaving(false);
            }
        },
        [record, id, user, router]
    );


    // helper usuario modificador 
    const fetchUsuarioModificador = async (userId: number) => {
        try {
            const perfil = await fetchWithAuth<any>(
                `idservice/perfiles/${userId}`,
                { method: "GET" }
            );

            const nombreCompleto = [perfil?.Nombres, perfil?.Apellidos]
                .filter(Boolean)
                .join(" ")
                .trim();

            return {
                username: nombreCompleto || "—",
                email: perfil?.Email ?? "—",
                avatar: perfil?.URLImagenPerfil ?? undefined,
            };
        } catch {
            return {
                username: user?.nombre || "—",
                email: user?.email || "—",
                avatar: undefined,
            };
        }
    };


    const handle = <K extends keyof SectorPicking>(
        field: K,
        value: SectorPicking[K]
    ) => setRecord((p) => (p ? { ...p, [field]: value } : p));

    const headerActions = useMemo<Action[]>(
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
                icon: <SaveOutlined className="h-4 w-4" />,
                onClick: () => handleSave(true),
                disabled: saving,
            },
            {
                label: "Volver al listado",
                variant: "secondary",
                icon: <XCircleIcon className="h-5 w-5" />,
                onClick: () => router.push("/picking/configuraciones/multipicking/sectores"),
            },
        ],
        [saving, router]
    );

    const statusLabel =
        record?.status === "active"
            ? "Activo"
            : record?.status === "inactive"
                ? "Inactivo"
                : record?.status;

    usePageHeader(
        () =>
        ({
            title: (
                <div>
                    <div className="text-xs font-semibold uppercase text-blue-600 tracking-wider">Sectores de Picking</div>
                    <div className="text-2xl font-semibold text-gray-900">{record?.name ?? `#${id}`}</div>
                </div>
            ),
            action: headerActions,
            status: saving
                ? { text: "Guardando…", variant: "info" }
                : record
                    ? {
                        text: statusLabel!,
                        variant: record.status === "active" ? "success" : "warning",
                    }
                    : undefined,
        } as unknown as PageHeaderProps),
        [headerActions, saving, record?.status, record?.name]
    );

    if (loading) {
        return (
            <div className="mt-6 overflow-x-auto border rounded-md bg-white">
                <table className="min-w-full text-sm">
                    <tbody>
                        <tr>
                            <td className="px-4 py-6 text-center text-gray-500">
                                <ArrowPathIcon className="h-5 w-5 inline animate-spin mr-2" />
                                Cargando…
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        );
    }

    if (errorMessage) {
        return (
            <div className="mt-6 bg-red-50 border-l-4 border-red-400 p-4 text-red-700 rounded-md shadow-sm">
                <div className="flex">
                    <div className="flex-shrink-0">
                        <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
                    </div>
                    <div className="ml-3">
                        <h3 className="text-sm font-medium">
                            Error al cargar el sector de picking
                        </h3>
                        <p className="mt-2 text-sm">
                            {errorMessage}
                        </p>
                        <div className="mt-4">
                            <button
                                type="button"
                                onClick={() => {
                                    setErrorMessage(null);
                                    load();
                                }}
                                className="rounded-md bg-red-50 px-2 py-1.5 text-sm font-medium text-red-800 hover:bg-red-100"
                            >
                                Reintentar
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!record) return null;

    return (
        <div className="p-6 bg-white">
            <SectoresPickingFields
                record={record}
                readOnly={false}
                onChange={handle}
            />
        </div>
    );
}
