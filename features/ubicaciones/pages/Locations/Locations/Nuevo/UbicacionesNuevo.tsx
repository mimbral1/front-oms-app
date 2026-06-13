// views\Ubicaciones\Locations\Locations\Nuevo\UbicacionesNuevo.tsx

"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";
import type { PageHeaderProps, Action } from "@/components/layout/page-header";
import { XCircleIcon } from "@heroicons/react/24/outline";
import SaveOutlined from "@mui/icons-material/SaveOutlined";
import { useFetchWithAuth } from "@/lib/http/client";
import LocationFields, { ApiLocation } from "@/features/ubicaciones/components/locations/locations/UbicacionesFields";
import { FaPlus } from "react-icons/fa";
import { toast } from "react-hot-toast";

const emptyRecord: ApiLocation = {
    storeId: 1,
    name: "",
    country: "",
    stateProvince: "",
    city: "",
    addressLine1: "",
    addressLine2: "",
    postalCode: "",
    status: "inactive",
    user: "1",
};

export default function LocationNuevo() {
    const router = useRouter();
    const { fetchWithAuth } = useFetchWithAuth();

    const [record, setRecord] = useState<ApiLocation>(emptyRecord);
    const [saving, setSaving] = useState(false);

    // Mantener referencia estable del record (mismo patrón que SalesChannels)
    const recordRef = useRef(record);

    useEffect(() => {
        recordRef.current = record;
    }, [record]);

    // ===== SELECT OPTIONS =====
    const [tasksOpts, setTasksOpts] = useState<{ label: string; value: string }[]>([]);
    const [sellersOpts, setSellersOpts] = useState<{ label: string; value: string }[]>([]);
    const [salesChannelsOpts, setSalesChannelsOpts] = useState<{ label: string; value: string }[]>([]);
    const [warehousesOpts, setWarehousesOpts] = useState<{ label: string; value: string }[]>([]);

    // ======== STORES ========
    const [storeOpts, setStoreOpts] = useState<{ label: string; value: string }[]>([
        { label: "Seleccione tienda…", value: "" }
    ]);
    const [storeSearch, setStoreSearch] = useState("");

    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                const res = await fetchWithAuth<{
                    ok: boolean;
                    data: { Id: number; Name: string }[];
                }>("comerce-service/store/get?status=1");

                if (!mounted) return;

                setStoreOpts([
                    { label: "Seleccione tienda…", value: "" },
                    ...(res?.data ?? []).map((s) => ({
                        value: String(s.Id),
                        label: s.Name,
                    })),
                ]);
            } catch (e) {
                console.error("Error cargando tiendas:", e);
            }
        })();

        return () => { mounted = false; };
    }, [fetchWithAuth]);

    // ===== LOAD TASKS =====
    useEffect(() => {
        let mounted = true;

        const loadTasks = async () => {
            try {
                const res = await fetchWithAuth<{
                    items: { code: string; name: string | null }[];
                }>("comerce-service/tasks", { method: "GET" });

                if (!mounted) return;

                setTasksOpts(
                    res?.items?.map((t) => ({
                        value: t.code,
                        label: t.name ?? t.code,
                    })) ?? []
                );
            } catch (e) {
                console.error("Error cargando tasks:", e);
            }
        };

        loadTasks();

        return () => {
            mounted = false;
        };
    }, [fetchWithAuth]);

    // ===== LOAD SELLERS =====
    useEffect(() => {
        let mounted = true;

        const loadSellers = async () => {
            try {
                const res = await fetchWithAuth<{
                    items: { id: number; name: string }[];
                }>(
                    "oms-service/orders/sellers?page=1&pageSize=100&q=&statusIds=",
                    { method: "GET" }
                );

                if (!mounted) return;

                setSellersOpts(
                    res?.items?.map((s) => ({
                        value: String(s.id),
                        label: s.name,
                    })) ?? []
                );
            } catch (e) {
                console.error("Error cargando sellers:", e);
            }
        };

        loadSellers();

        return () => {
            mounted = false;
        };
    }, [fetchWithAuth]);

    // ===== LOAD SALES CHANNELS =====
    useEffect(() => {
        let mounted = true;

        const loadSalesChannels = async () => {
            try {
                const res = await fetchWithAuth<{
                    data: { referenceId: string; name: string }[];
                }>(
                    "comerce-service/sales-channel/ListarSimple",
                    { method: "GET" }
                );

                if (!mounted) return;

                setSalesChannelsOpts(
                    res?.data?.map((c) => ({
                        value: c.referenceId,
                        label: c.name,
                    })) ?? []
                );
            } catch (e) {
                console.error("Error cargando sales channels:", e);
            }
        };

        loadSalesChannels();

        return () => {
            mounted = false;
        };
    }, [fetchWithAuth]);

    // ===== LOAD WAREHOUSES =====
    useEffect(() => {
        let mounted = true;

        const loadWarehouses = async () => {
            try {
                const res = await fetchWithAuth<
                    { code: string; name: string; isActive: boolean }[]
                >("warehouses", { method: "GET" });

                if (!mounted) return;

                setWarehousesOpts(
                    res
                        ?.filter((w) => w.isActive)
                        ?.map((w) => ({
                            value: w.code,
                            label: w.name,
                        })) ?? []
                );
            } catch (e) {
                console.error("Error cargando warehouses:", e);
            }
        };

        loadWarehouses();

        return () => {
            mounted = false;
        };
    }, [fetchWithAuth]);

    // ===== WAREHOUSE HELPERS =====
    const addWarehouse = () => {
        setRecord((prev) => ({
            ...prev,
            warehouses: [
                ...(prev.warehouses ?? []),
                {
                    code: "",
                    name: "",
                    status: "active",
                    tasks: [],
                    salesChannels: [],
                    limitedToSellers: [],
                },
            ],
        }));
    };

    const updateWarehouse = (
        index: number,
        field: "tasks" | "salesChannels" | "limitedToSellers",
        value: string[]
    ) => {
        setRecord((prev) => {
            if (!prev.warehouses) return prev;
            const copy = [...prev.warehouses];
            copy[index] = { ...copy[index], [field]: value };
            return { ...prev, warehouses: copy };
        });
    };

    const removeWarehouse = (index: number) => {
        setRecord((prev) => {
            if (!prev.warehouses) return prev;
            return {
                ...prev,
                warehouses: prev.warehouses.filter((_, i) => i !== index),
            };
        });
    };
    // ======================================

    const onChange = <K extends keyof ApiLocation>(field: K, value: ApiLocation[K]) =>
        setRecord((r) => ({ ...r, [field]: value }));

    // Crea una ubicación. Devuelve true si fue OK.
    const save = useCallback(async (): Promise<boolean> => {
        const current = recordRef.current;

        console.log("SAVE PAYLOAD PREVIEW", current);

        // Validación mínima según la API (NAME_REQUIRED)
        if (!current.name?.trim()) {
            console.warn("Nombre es requerido para crear la ubicación.");
            return false;
        }

        const payload = {
            storeId: current.storeId,
            name: current.name,
            country: current.country,
            stateProvince: current.stateProvince,
            city: current.city,
            addressLine1: current.addressLine1,
            addressLine2: current.addressLine2 ?? "",
            postalCode: current.postalCode,
            status: current.status,
            user: String(current.user ?? "1"),

            // ===== NUEVO =====
            warehouses: (current.warehouses ?? []).map((wh) => ({
                referenceId: wh.code,
                name: wh.name,
                status: wh.status ?? "active",
                tasks: wh.tasks ?? [],
                salesChannels: wh.salesChannels ?? [],
                limitedToSellers: wh.limitedToSellers ?? [],
            })),
        };

        try {
            setSaving(true);
            const res = await fetchWithAuth<{ id: string | number; message: string }>(
                "comerce-service/locations",
                { method: "POST", body: JSON.stringify(payload) }
            );
            // La doc devuelve { id, message }
            if (!res?.id) return false;

            toast.success("Ubicación creada correctamente");

            return true;
        } catch (e) {
            console.error("Error creando location", e);

            toast.error("Ocurrió un error al crear la ubicación");

            return false;
        } finally {
            setSaving(false);
        }
    }, [fetchWithAuth]);

    // Guardar => crea y va al listado
    const handleSaveAndGoList = useCallback(async () => {
        const ok = await save();
        if (ok) router.push("/ubicaciones/listado-ubicaciones");
    }, [router, save]);

    // Guardar & Crear nuevo => crea y limpia form
    const handleSaveAndCreateNew = useCallback(async () => {
        const ok = await save();
        if (ok) setRecord(emptyRecord);
    }, [save]);

    const headerActions: Action[] = useMemo(
        () => [
            {
                label: "Guardar",
                variant: "success",
                onClick: handleSaveAndGoList,
                disabled: saving,
                icon: <SaveOutlined className="h-4 w-4" />,
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
                onClick: handleSaveAndCreateNew, // ↍ antes no ejecutaba la función
                disabled: saving,
            },
            {
                label: "Volver al listado",
                variant: "secondary",
                onClick: () => router.push("/ubicaciones/listado-ubicaciones"),
                disabled: saving,
                icon: <XCircleIcon className="h-5 w-5" />,
            },
        ],
        [saving, handleSaveAndGoList, handleSaveAndCreateNew, router]
    );

    usePageHeader(
        () =>
        ({
            title: (
                <div>
                    <div className="text-xs font-semibold uppercase tracking-wider text-blue-600">
                        Ubicaciones
                    </div>
                    <div className="text-2xl font-semibold text-gray-900">Nueva ubicación</div>
                </div>
            ),
            action: headerActions,
            status: {
                text: record.status === "active" ? "Activo" : "Inactivo",
                variant: record.status === "active" ? "success" : "warning",
            },
        } as PageHeaderProps),
        [headerActions, record.status]
    );

    return (
        <div className="flex flex-col bg-white">
            <div className="p-6">
                <LocationFields
                    record={record}
                    onChange={onChange}
                    isNew={!record.id}

                    storeOpts={storeOpts}
                    storeSearch={storeSearch}
                    onStoreSearch={setStoreSearch}

                    warehousesOpts={warehousesOpts}
                    tasksOpts={tasksOpts}
                    sellersOpts={sellersOpts}
                    salesChannelsOpts={salesChannelsOpts}

                    onAddWarehouse={addWarehouse}
                    onRemoveWarehouse={removeWarehouse}
                    onUpdateWarehouse={updateWarehouse} />
            </div>
        </div>
    );
}
