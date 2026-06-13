// views\Delivery\Rutas\components\DriverVehicleModal.tsx
"use client";
import { useEffect, useState } from "react";
import { ActionButton } from "@/components/ui/button/action-button";
import { SelectSearchInline } from "@/components/ui/collapsible/selectSearchInline";
import { useFetchWithAuthDelivery } from "@/lib/http/client";

type ApiListResponse<T> = {
    data?: T[];
    items?: T[];
    rows?: T[];
    results?: T[];
};

type ApiDriverItem = {
    id?: string | null;
    driverId?: string | null;
    externalId?: string | null;
    name?: string | null;
    firstName?: string | null;
    first_name?: string | null;
    firstname?: string | null;
    lastName?: string | null;
    last_name?: string | null;
    lastname?: string | null;
};

type ApiDeliveryManItem = {
    id?: string | null;
    deliveryManId?: string | null;
    helperId?: string | null;
    externalId?: string | null;
    name?: string | null;
    firstName?: string | null;
    first_name?: string | null;
    firstname?: string | null;
    lastName?: string | null;
    last_name?: string | null;
    lastname?: string | null;
};

type ApiVehicleItem = {
    id?: string | null;
    vehicleId?: string | null;
    externalId?: string | null;
    name?: string | null;
    refId?: string | null;
    referenceId?: string | null;
    plate?: string | null;
    patent?: string | null;
    licensePlate?: string | null;
};

type SelectOption = { value: string; label: string };

const normalizeRows = <T,>(payload: ApiListResponse<T> | T[] | null | undefined): T[] => {
    if (!payload) return [];
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload.data)) return payload.data;
    if (Array.isArray(payload.items)) return payload.items;
    if (Array.isArray(payload.rows)) return payload.rows;
    if (Array.isArray(payload.results)) return payload.results;
    return [];
};

const toDriverOptions = (rows: ApiDriverItem[]): SelectOption[] => {
    const map = new Map<string, SelectOption>();

    for (const item of rows) {
        const id = String(item?.id ?? item?.driverId ?? item?.externalId ?? "").trim();
        if (!id) continue;

        const name = String(item?.name ?? "").trim();
        const firstName = String(item?.firstName ?? item?.first_name ?? item?.firstname ?? "").trim();
        const lastName = String(item?.lastName ?? item?.last_name ?? item?.lastname ?? "").trim();
        const fullName = [firstName, lastName].filter(Boolean).join(" ").trim();
        const label = name || fullName || id;
        map.set(id, { value: id, label });
    }

    return Array.from(map.values());
};

const toDeliveryManOptions = (rows: ApiDeliveryManItem[]): SelectOption[] => {
    const map = new Map<string, SelectOption>();

    for (const item of rows) {
        const id = String(item?.id ?? item?.deliveryManId ?? item?.helperId ?? item?.externalId ?? "").trim();
        if (!id) continue;

        const name = String(item?.name ?? "").trim();
        const firstName = String(item?.firstName ?? item?.first_name ?? item?.firstname ?? "").trim();
        const lastName = String(item?.lastName ?? item?.last_name ?? item?.lastname ?? "").trim();
        const fullName = [firstName, lastName].filter(Boolean).join(" ").trim();
        const label = name || fullName || id;
        map.set(id, { value: id, label });
    }

    return Array.from(map.values());
};

const toVehicleOptions = (rows: ApiVehicleItem[]): SelectOption[] => {
    const map = new Map<string, SelectOption>();

    for (const item of rows) {
        const id = String(item?.id ?? item?.vehicleId ?? item?.externalId ?? "").trim();
        if (!id) continue;

        const name = String(item?.name ?? "").trim();
        const refId = String(item?.refId ?? item?.referenceId ?? "").trim();
        const plate = String(item?.plate ?? item?.patent ?? item?.licensePlate ?? "").trim();

        const label = name || refId || plate || id;
        map.set(id, { value: id, label });
    }

    return Array.from(map.values()).sort((a, b) => a.label.localeCompare(b.label, "es", { sensitivity: "base" }));
};

export default function DriverVehicleModal({
    open,
    onClose,
    initial,
    onApply,
}: {
    open: boolean;
    onClose: () => void;
    initial?: { driverId?: string; helperId?: string; vehicleId?: string };
    onApply: (data: { driverId?: string; helperId?: string; vehicleId?: string }) => void;
}) {
    const { fetchWithAuthDelivery } = useFetchWithAuthDelivery();
    const [driverId, setDriverId] = useState(initial?.driverId ?? "");
    const [helperId, setHelperId] = useState(initial?.helperId ?? "");
    const [vehicleId, setVehicleId] = useState(initial?.vehicleId ?? "");
    const [driverOptions, setDriverOptions] = useState<SelectOption[]>([]);
    const [helperOptions, setHelperOptions] = useState<SelectOption[]>([]);
    const [vehicleOptions, setVehicleOptions] = useState<SelectOption[]>([]);
    const [loadingOptions, setLoadingOptions] = useState(false);
    const [driverSearch, setDriverSearch] = useState("");
    const [helperSearch, setHelperSearch] = useState("");
    const [vehicleSearch, setVehicleSearch] = useState("");

    useEffect(() => {
        if (!open) return;
        setDriverId(initial?.driverId ?? "");
        setHelperId(initial?.helperId ?? "");
        setVehicleId(initial?.vehicleId ?? "");
        setDriverSearch("");
        setHelperSearch("");
        setVehicleSearch("");
    }, [open, initial?.driverId, initial?.helperId, initial?.vehicleId]);

    useEffect(() => {
        if (!open) return;

        let mounted = true;

        const loadOptions = async () => {
            try {
                setLoadingOptions(true);

                const [driverPayload, helperPayload, vehiclePayload] = await Promise.all([
                    fetchWithAuthDelivery<ApiListResponse<ApiDriverItem>>("driver", { method: "GET", cache: "no-store" }),
                    fetchWithAuthDelivery<ApiListResponse<ApiDeliveryManItem>>("delivery-man", { method: "GET", cache: "no-store" }),
                    fetchWithAuthDelivery<ApiListResponse<ApiVehicleItem>>("vehicle", { method: "GET", cache: "no-store" }),
                ]);

                if (!mounted) return;

                setDriverOptions(toDriverOptions(normalizeRows(driverPayload)));
                setHelperOptions(toDeliveryManOptions(normalizeRows(helperPayload)));
                setVehicleOptions(toVehicleOptions(normalizeRows(vehiclePayload)));
            } catch (error) {
                if (!mounted) return;
                console.error("Error cargando conductor/repartidor/vehiculo:", error);
                setDriverOptions([]);
                setHelperOptions([]);
                setVehicleOptions([]);
            } finally {
                if (mounted) setLoadingOptions(false);
            }
        };

        loadOptions();

        return () => {
            mounted = false;
        };
    }, [fetchWithAuthDelivery, open]);

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="w-full max-w-lg rounded-2xl bg-white p-4 shadow-xl">
                <div className="mb-3 flex items-center justify-between">
                    <div className="text-lg font-semibold">Datos de vehículo y conductor</div>
                    <button onClick={onClose} className="rounded-md px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100">Cerrar</button>
                </div>

                <div className="space-y-4">
                    <div>
                        <div className="mb-1 text-sm font-medium text-gray-700">Conductor</div>
                        <SelectSearchInline
                            id="driverId"
                            label="Conductor"
                            value={driverId}
                            options={[{ value: "", label: "" }, ...driverOptions]}
                            searchQuery={driverSearch}
                            loading={loadingOptions}
                            onSearch={setDriverSearch}
                            onChange={(value) => setDriverId(value)}
                            placeholderFromDefault={false}
                        />
                    </div>

                    <div>
                        <div className="mb-1 text-sm font-medium text-gray-700">Repartidor</div>
                        <SelectSearchInline
                            id="helperId"
                            label="Repartidor"
                            value={helperId}
                            options={[{ value: "", label: "" }, ...helperOptions]}
                            searchQuery={helperSearch}
                            loading={loadingOptions}
                            onSearch={setHelperSearch}
                            onChange={(value) => setHelperId(value)}
                            placeholderFromDefault={false}
                        />
                    </div>

                    <div>
                        <div className="mb-1 text-sm font-medium text-gray-700">Vehículo</div>
                        <SelectSearchInline
                            id="vehicleId"
                            label="Vehículo"
                            value={vehicleId}
                            options={[{ value: "", label: "" }, ...vehicleOptions]}
                            searchQuery={vehicleSearch}
                            loading={loadingOptions}
                            onSearch={setVehicleSearch}
                            onChange={(value) => setVehicleId(value)}
                            placeholderFromDefault={false}
                        />
                    </div>
                </div>

                <div className="mt-4 flex justify-end gap-3">
                    <ActionButton variant="secondary" onClick={onClose}>Cancelar</ActionButton>
                    <ActionButton variant="primary" onClick={() => onApply({ driverId, helperId, vehicleId })}>
                        Aceptar
                    </ActionButton>
                </div>
            </div>
        </div>
    );
}
