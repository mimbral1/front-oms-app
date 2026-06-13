// components/SeccionEntrega.tsx
import React, { useEffect, useMemo, useState } from "react";
import { ActionButton } from "@/components/ui/button/action-button";
import { StoreIcon, TruckIcon } from "lucide-react";
import { PlusIcon } from "@heroicons/react/24/outline";
import { Input } from "@mui/material";
import { useFetchWithAuth } from "@/lib/http/client";
import { useAuth } from "@/app/context/auth/AuthContext";
import { SingleDateFilter } from "@/components/ui/single-date-filter/SingleDateFilter";
import { COMMERCE_SERVICE_SALES_CHANNELS_API } from "@/lib/http/endpoints";

type ProductDeliveryMode = "envio" | "retiro" | "mixta";
type ProductDeliverySelection = {
    deliveryId: string;
    sku: string;
    deliveryQty: number | "";
    mode: ProductDeliveryMode;
    addressTypeId: number | null;
    addressTypeName: string;
    shippingCost: number | "";
    branch: string;
    region: string;
    ciudad: string;
    calle: string;
    numero: string;
    referencia: string;
    mixedRetiroQty: number | "";
    mixedEnvioQty: number | "";
    fecha: { from: Date; to: Date } | null;
};

type AddressTypeOption = {
    id: number;
    name: string;
};

type BranchOption = {
    value: string;
    text: string;
};

const inferModeFromAddressType = (name: string): ProductDeliveryMode => {
    const normalized = String(name || "").toLowerCase();
    if (normalized.includes("mixta")) return "mixta";
    return normalized.includes("retiro") ? "retiro" : "envio";
};

const getMethodMeta = (name: string, mode: ProductDeliveryMode) => {
    if (mode === "retiro") {
        return {
            label: name,
            icon: <StoreIcon className="h-4 w-4 text-slate-600" />,
        };
    }

    return {
        label: name,
        icon: <TruckIcon className="h-4 w-4 text-slate-600" />,
    };
};

const normalizeAddressTypes = (payload: any): AddressTypeOption[] => {
    const source = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.rows)
            ? payload.rows
            : Array.isArray(payload?.data)
                ? payload.data
                : Array.isArray(payload?.items)
                    ? payload.items
                    : [];

    return source
        .map((item: any) => {
            const idRaw = item?.addressTypeID ?? item?.addressTypeId ?? item?.id;
            const id = Number(idRaw);
            const name = String(item?.name ?? item?.label ?? "").trim();
            if (!Number.isFinite(id) || !name) return null;
            return { id, name } as AddressTypeOption;
        })
        .filter((item: AddressTypeOption | null): item is AddressTypeOption => Boolean(item));
};

const normalizeSucursalBranchOptions = (payload: any): BranchOption[] => {
    const source = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.rows)
            ? payload.rows
            : Array.isArray(payload?.data)
                ? payload.data
                : Array.isArray(payload?.items)
                    ? payload.items
                    : [];

    return source
        .filter((item: any) => /^sucursal/i.test(String(item?.Name ?? item?.name ?? "").trim()))
        .map((item: any) => {
            const id = item?.Id ?? item?.id;
            const name = String(item?.Name ?? item?.name ?? "Sucursal").trim();
            if (id == null || !name) return null;
            return {
                value: String(id),
                text: name,
            } as BranchOption;
        })
        .filter((item: BranchOption | null): item is BranchOption => Boolean(item));
};

const extractSellerChannel = (payload: any): { id: string; name: string } | null => {
    const candidates = [
        payload?.channel,
        payload?.Channel,
        payload?.data?.channel,
        payload?.data?.Channel,
        payload?.data,
        payload,
    ];

    for (const c of candidates) {
        const name = String(c?.name ?? c?.Name ?? "").trim();
        const idRaw = c?.id ?? c?.Id ?? c?.channelId ?? c?.ChannelId ?? null;
        if (name) {
            const id = idRaw == null ? `seller-channel-${name.toLowerCase().replace(/\s+/g, "-")}` : String(idRaw);
            return { id, name };
        }
    }

    return null;
};

const pad2 = (n: number): string => String(n).padStart(2, "0");

const toDateInputValue = (range: { from: Date; to: Date } | null): string | null => {
    if (!range?.from || Number.isNaN(range.from.getTime())) return null;
    const y = range.from.getFullYear();
    const m = pad2(range.from.getMonth() + 1);
    const d = pad2(range.from.getDate());
    return `${y}-${m}-${d}`;
};

const buildWindowForDate = (dateStr: string | null): { from: Date; to: Date } | null => {
    if (!dateStr) return null;
    const [yRaw, mRaw, dRaw] = dateStr.split("-").map(Number);
    if (!yRaw || !mRaw || !dRaw) return null;
    return {
        from: new Date(yRaw, mRaw - 1, dRaw, 9, 0, 0, 0),
        to: new Date(yRaw, mRaw - 1, dRaw, 19, 0, 0, 0),
    };
};

const buildTodayWindow = (): { from: Date; to: Date } => {
    const now = new Date();
    return {
        from: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 9, 0, 0, 0),
        to: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 19, 0, 0, 0),
    };
};

const generateDeliveryId = (): string =>
    `delivery-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const formatShippingCost = (value: number | ""): string => {
    const n = value === "" ? 0 : Number(value || 0);
    if (n <= 0) return "Gratis";
    return new Intl.NumberFormat("es-CL", {
        style: "currency",
        currency: "CLP",
        maximumFractionDigits: 0,
    }).format(n);
};

const formatDeliveryDate = (range: { from: Date; to: Date } | null): string => {
    if (!range?.from || Number.isNaN(range.from.getTime())) return "Sin fecha definida";
    const dayName = range.from.toLocaleDateString("es-CL", { weekday: "long" });
    const datePart = range.from.toLocaleDateString("es-CL", {
        day: "2-digit",
        month: "short",
    });
    const fromHour = range.from.toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit", hour12: false });
    const toHour = range.to?.toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit", hour12: false }) ?? "19:00";
    return `${dayName}, ${datePart} de ${fromHour} a ${toHour}`;
};

export default function SeccionEntrega({
    products,
    deliverySelections,
    onDeliverySelectionsChange,
    slotsMock,
}: {
    products: Array<{ sku: string; name: string; cantidad: number; img?: string }>;
    deliverySelections: ProductDeliverySelection[];
    onDeliverySelectionsChange: (rows: ProductDeliverySelection[]) => void;
    slotsMock: any;
}) {
    const { user } = useAuth();
    const { fetchWithAuth } = useFetchWithAuth();
    const [addressTypes, setAddressTypes] = useState<AddressTypeOption[]>([]);
    const [loadingAddressTypes, setLoadingAddressTypes] = useState(false);
    const [sucursalOptions, setSucursalOptions] = useState<BranchOption[]>([]);
    const [loadingSucursales, setLoadingSucursales] = useState(false);
    const [immediateBranchOption, setImmediateBranchOption] = useState<BranchOption | null>(null);
    const [loadingImmediateBranch, setLoadingImmediateBranch] = useState(false);
    const [qtyDraft, setQtyDraft] = useState<Record<string, string>>({});

    useEffect(() => {
        let mounted = true;
        (async () => {
            setLoadingAddressTypes(true);
            try {
                const response = await fetchWithAuth<any>("oms-service/address-type", { method: "GET" });
                const normalized = normalizeAddressTypes(response);
                if (mounted) setAddressTypes(normalized);
            } catch {
                if (mounted) {
                    setAddressTypes([
                        { id: 1, name: "A Domicilio" },
                        { id: 6, name: "Retiro en Sucursal" },
                    ]);
                }
            } finally {
                if (mounted) setLoadingAddressTypes(false);
            }
        })();
        return () => {
            mounted = false;
        };
    }, [fetchWithAuth]);

    useEffect(() => {
        let mounted = true;
        (async () => {
            setLoadingSucursales(true);
            try {
                const response = await fetch(COMMERCE_SERVICE_SALES_CHANNELS_API, { method: "GET" });
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                const payload = await response.json();
                const normalized = normalizeSucursalBranchOptions(payload);
                if (mounted) setSucursalOptions(normalized);
            } catch {
                if (mounted) {
                    setSucursalOptions([]);
                }
            } finally {
                if (mounted) setLoadingSucursales(false);
            }
        })();
        return () => {
            mounted = false;
        };
    }, []);

    useEffect(() => {
        let mounted = true;
        const userId = String(user?.id || "").trim();
        if (!userId) {
            setImmediateBranchOption(null);
            return () => {
                mounted = false;
            };
        }

        (async () => {
            setLoadingImmediateBranch(true);
            try {
                const payload = await fetchWithAuth<any>(`oms-service/orders/seller/user/${encodeURIComponent(userId)}`, {
                    method: "GET",
                });
                const sellerChannel = extractSellerChannel(payload);
                if (mounted) {
                    setImmediateBranchOption(
                        sellerChannel ? { value: sellerChannel.id, text: sellerChannel.name } : null
                    );
                }
            } catch {
                if (mounted) setImmediateBranchOption(null);
            } finally {
                if (mounted) setLoadingImmediateBranch(false);
            }
        })();

        return () => {
            mounted = false;
        };
    }, [fetchWithAuth, user?.id]);

    const defaultAddressType = addressTypes[0] ?? null;

    const buildBaseRow = (
        sku: string,
        productQty: number,
        seed?: Partial<ProductDeliverySelection>
    ): ProductDeliverySelection => {
        const effectiveAddressTypeId = seed?.addressTypeId ?? defaultAddressType?.id ?? null;
        const effectiveAddressTypeName =
            seed?.addressTypeName ??
            addressTypes.find((opt) => opt.id === effectiveAddressTypeId)?.name ??
            defaultAddressType?.name ??
            "";
        const normalizedMode = inferModeFromAddressType(effectiveAddressTypeName);
        const safeMode = normalizedMode === "mixta" ? "envio" : normalizedMode;
        return {
            deliveryId: seed?.deliveryId ?? generateDeliveryId(),
            sku,
            deliveryQty:
                seed?.deliveryQty === ""
                    ? ""
                    : Number.isFinite(seed?.deliveryQty)
                        ? Math.max(0, Math.floor(Number(seed?.deliveryQty)))
                        : productQty,
            mode: seed?.mode === "mixta" ? safeMode : (seed?.mode ?? safeMode),
            addressTypeId: effectiveAddressTypeId,
            addressTypeName: effectiveAddressTypeName,
            shippingCost:
                seed?.shippingCost === ""
                    ? ""
                    : Number.isFinite(seed?.shippingCost)
                        ? Number(seed?.shippingCost)
                        : 0,
            branch: seed?.branch ?? "",
            region: seed?.region ?? "",
            ciudad: seed?.ciudad ?? "",
            calle: seed?.calle ?? "",
            numero: seed?.numero ?? "",
            referencia: seed?.referencia ?? "",
            mixedRetiroQty:
                seed?.mixedRetiroQty === ""
                    ? ""
                    : Number.isFinite(seed?.mixedRetiroQty)
                        ? Number(seed?.mixedRetiroQty)
                        : 0,
            mixedEnvioQty:
                seed?.mixedEnvioQty === ""
                    ? ""
                    : Number.isFinite(seed?.mixedEnvioQty)
                        ? Number(seed?.mixedEnvioQty)
                        : productQty,
            fecha: seed?.fecha ?? null,
        };
    };

    const productQtyBySku = useMemo(() => new Map(products.map((p) => [p.sku, p.cantidad])), [products]);

    const normalizedSelections = useMemo<ProductDeliverySelection[]>(() => {
        const allowedSkus = new Set(products.map((p) => p.sku));
        return (deliverySelections || [])
            .filter((row) => allowedSkus.has(row.sku))
            .map((row) => {
                const productQty = productQtyBySku.get(row.sku) ?? 1;
                return buildBaseRow(row.sku, productQty, row);
            });
    }, [products, deliverySelections, productQtyBySku, addressTypes, defaultAddressType]);

    const primaryDeliveryId = useMemo(
        () => normalizedSelections[0]?.deliveryId ?? "delivery-main",
        [normalizedSelections]
    );

    const getRowsForSku = (sku: string, productQty: number): ProductDeliverySelection[] => {
        const rows = normalizedSelections.filter((r) => r.sku === sku);
        if (rows.length > 0) return rows;
        return [
            buildBaseRow(sku, productQty, {
                deliveryId: primaryDeliveryId,
                deliveryQty: productQty,
            }),
        ];
    };

    const effectiveSelections = useMemo(
        () => products.flatMap((p) => getRowsForSku(p.sku, p.cantidad)),
        [products, normalizedSelections, primaryDeliveryId, addressTypes, defaultAddressType]
    );

    const deliveryIds = useMemo(() => {
        const ids = Array.from(new Set(effectiveSelections.map((row) => row.deliveryId).filter(Boolean)));
        return ids.length > 0 ? ids : [primaryDeliveryId];
    }, [effectiveSelections, primaryDeliveryId]);

    const commitRows = (rows: ProductDeliverySelection[]) => {
        const normalized = rows
            .filter((row) => productQtyBySku.has(row.sku))
            .map((row) => buildBaseRow(row.sku, productQtyBySku.get(row.sku) ?? 1, row))
            .filter((row) => (Number(row.deliveryQty) || 0) > 0);
        onDeliverySelectionsChange(normalized);
    };

    const sharedHomeDeliveryData = useMemo(() => {
        const firstHomeRow = effectiveSelections.find((row) => row.mode === "envio");
        return {
            region: firstHomeRow?.region ?? "",
            ciudad: firstHomeRow?.ciudad ?? "",
            calle: firstHomeRow?.calle ?? "",
            numero: firstHomeRow?.numero ?? "",
            referencia: firstHomeRow?.referencia ?? "",
        };
    }, [effectiveSelections]);

    const hasAnyHomeDelivery = useMemo(
        () => effectiveSelections.some((row) => row.mode === "envio"),
        [effectiveSelections]
    );

    const upsertAllHomeDeliveryRows = (patch: Partial<ProductDeliverySelection>) => {
        const next = effectiveSelections.map((row) => (row.mode === "envio" ? { ...row, ...patch } : row));
        commitRows(next);
    };

    const upsertDeliveryRows = (deliveryId: string, patch: Partial<ProductDeliverySelection>) => {
        const next = effectiveSelections.map((row) => {
            if (row.deliveryId !== deliveryId) return row;
            const updated = { ...row, ...patch };
            if (updated.mode === "envio") updated.branch = "";
            return updated;
        });
        commitRows(next);
    };

    useEffect(() => {
        if (!immediateBranchOption) return;
        const next = effectiveSelections.map((row) => {
            const isImmediatePickup = row.mode === "retiro" && /inmediat/i.test(String(row.addressTypeName || ""));
            if (!isImmediatePickup) return row;
            if (String(row.branch || "").trim()) return row;
            return { ...row, branch: immediateBranchOption.value };
        });

        const changed = next.some((row, idx) => row !== effectiveSelections[idx]);
        if (changed) {
            commitRows(next);
        }
    }, [immediateBranchOption, effectiveSelections]);

    const upsertRow = (
        sku: string,
        productQty: number,
        deliveryId: string,
        patch: Partial<ProductDeliverySelection>
    ) => {
        let matched = false;
        const next = effectiveSelections.map((row) => {
            if (row.sku !== sku || row.deliveryId !== deliveryId) return row;
            matched = true;
            const updated: ProductDeliverySelection = { ...row, ...patch };
            if (updated.mode === "envio") updated.branch = "";
            return updated;
        });

        if (!matched) {
            const base = buildBaseRow(sku, productQty, { deliveryId });
            const updated: ProductDeliverySelection = { ...base, ...patch };
            if (updated.mode === "envio") updated.branch = "";
            next.push(updated);
        }

        commitRows(next);
    };

    const rebalanceSkuQtyAcrossDeliveries = (
        sku: string,
        deliveryId: string,
        requestedQty: number
    ) => {
        const totalQty = Math.max(1, Number(productQtyBySku.get(sku) ?? 1));
        const skuRows = effectiveSelections.filter((row) => row.sku === sku);
        const target = skuRows.find((row) => row.deliveryId === deliveryId);
        if (!target) return;

        const others = skuRows.filter((row) => row.deliveryId !== deliveryId);
        if (others.length === 0) {
            upsertRow(sku, totalQty, deliveryId, { deliveryQty: totalQty });
            return;
        }

        let nextTargetQty = Math.max(1, Math.floor(requestedQty));
        nextTargetQty = Math.min(nextTargetQty, totalQty);

        const currentTargetQty = Number(target.deliveryQty) || 0;
        let delta = nextTargetQty - currentTargetQty;

        const next = [...effectiveSelections];

        if (delta > 0) {
            for (const other of others) {
                if (delta <= 0) break;
                const idx = next.findIndex((row) => row.sku === sku && row.deliveryId === other.deliveryId);
                if (idx < 0) continue;
                const current = Number(next[idx].deliveryQty) || 0;
                const take = Math.min(current, delta);
                next[idx] = { ...next[idx], deliveryQty: current - take };
                delta -= take;
            }

            if (delta > 0) {
                nextTargetQty -= delta;
            }
        } else if (delta < 0) {
            const add = Math.abs(delta);
            const receiver = others[0];
            const idx = next.findIndex((row) => row.sku === sku && row.deliveryId === receiver.deliveryId);
            if (idx >= 0) {
                const current = Number(next[idx].deliveryQty) || 0;
                next[idx] = { ...next[idx], deliveryQty: current + add };
            }
        }

        const targetIdx = next.findIndex((row) => row.sku === sku && row.deliveryId === deliveryId);
        if (targetIdx >= 0) {
            next[targetIdx] = { ...next[targetIdx], deliveryQty: nextTargetQty };
        }

        commitRows(next);
    };

    const toggleProductInDelivery = (sku: string, deliveryId: string, checked: boolean) => {
        const productQty = productQtyBySku.get(sku) ?? 1;
        const targetRow = effectiveSelections.find((row) => row.sku === sku && row.deliveryId === deliveryId);
        const skuRows = effectiveSelections.filter((row) => row.sku === sku);

        if (checked) {
            if (targetRow) return;

            const donorRows = skuRows.filter((row) => row.deliveryId !== deliveryId);
            if (donorRows.length === 0) return;

            const donor = [...donorRows]
                .sort((a, b) => (Number(b.deliveryQty) || 0) - (Number(a.deliveryQty) || 0))
                .find((row) => (Number(row.deliveryQty) || 0) > 0);
            if (!donor) return;

            const deliveryTemplate = effectiveSelections.find((row) => row.deliveryId === deliveryId);
            const next = effectiveSelections.flatMap((row) => {
                if (row.sku !== sku || row.deliveryId !== donor.deliveryId) return [row];
                const nextQty = (Number(row.deliveryQty) || 0) - 1;
                if (nextQty <= 0) return [];
                return [{ ...row, deliveryQty: nextQty }];
            });

            const newRow = buildBaseRow(sku, productQty, {
                ...(deliveryTemplate ?? donor),
                sku,
                deliveryId,
                deliveryQty: 1,
            });
            if (newRow.mode === "envio") newRow.branch = "";

            commitRows([...next, newRow]);
            return;
        }

        if (!targetRow) return;
        const otherRows = skuRows.filter((row) => row.deliveryId !== deliveryId);
        const fallback = otherRows[0];
        if (!fallback) return;

        const qtyToMove = Number(targetRow.deliveryQty) || 0;
        const next = effectiveSelections.flatMap((row) => {
            if (row.sku === sku && row.deliveryId === deliveryId) return [];
            if (row.sku === sku && row.deliveryId === fallback.deliveryId) {
                return [{ ...row, deliveryQty: (Number(row.deliveryQty) || 0) + qtyToMove }];
            }
            return [row];
        });
        commitRows(next);
    };

    const addDeliveryGroup = () => {
        const canMoveOneUnitFromRow = (row: ProductDeliverySelection): boolean => {
            const qty = Number(row.deliveryQty) || 0;
            if (qty > 1) return true;

            const rowsInSameDelivery = effectiveSelections.filter((candidate) => candidate.deliveryId === row.deliveryId);
            return rowsInSameDelivery.length > 1;
        };

        const donor = [...effectiveSelections]
            .sort((a, b) => (Number(b.deliveryQty) || 0) - (Number(a.deliveryQty) || 0))
            .find((row) => canMoveOneUnitFromRow(row));
        if (!donor) return;

        const productQty = productQtyBySku.get(donor.sku) ?? 1;
        const newDeliveryId = generateDeliveryId();
        const next = effectiveSelections.flatMap((row) => {
            if (row.sku !== donor.sku || row.deliveryId !== donor.deliveryId) return [row];
            const nextQty = (Number(row.deliveryQty) || 0) - 1;
            if (nextQty <= 0) return [];
            return [{ ...row, deliveryQty: nextQty }];
        });

        const newRow = buildBaseRow(donor.sku, productQty, {
            ...donor,
            deliveryId: newDeliveryId,
            deliveryQty: 1,
        });

        commitRows([...next, newRow]);
    };

    const removeDeliveryGroup = (deliveryId: string) => {
        if (deliveryIds.length <= 1) return;
        const fallbackDeliveryId = deliveryIds.find((id) => id !== deliveryId);
        if (!fallbackDeliveryId) return;

        const rowsToMove = effectiveSelections.filter((row) => row.deliveryId === deliveryId);
        if (rowsToMove.length === 0) return;

        let next = effectiveSelections.filter((row) => row.deliveryId !== deliveryId);

        rowsToMove.forEach((removedRow) => {
            const qtyToMove = Number(removedRow.deliveryQty) || 0;
            if (qtyToMove <= 0) return;

            const idx = next.findIndex(
                (row) => row.deliveryId === fallbackDeliveryId && row.sku === removedRow.sku
            );

            if (idx >= 0) {
                next[idx] = { ...next[idx], deliveryQty: (Number(next[idx].deliveryQty) || 0) + qtyToMove };
                return;
            }

            const productQty = productQtyBySku.get(removedRow.sku) ?? 1;
            next.push(
                buildBaseRow(removedRow.sku, productQty, {
                    ...removedRow,
                    deliveryId: fallbackDeliveryId,
                    deliveryQty: qtyToMove,
                })
            );
        });

        commitRows(next);
    };

    const canAddDeliveryGroup = useMemo(() => {
        return effectiveSelections.some((row) => {
            const qty = Number(row.deliveryQty) || 0;
            if (qty > 1) return true;
            const rowsInSameDelivery = effectiveSelections.filter((candidate) => candidate.deliveryId === row.deliveryId);
            return qty > 0 && rowsInSameDelivery.length > 1;
        });
    }, [effectiveSelections]);

    const getQtyDraftKey = (deliveryId: string, sku: string) => `${deliveryId}::${sku}`;

    const commitRowQty = (deliveryId: string, sku: string, maxAllowedForRow: number) => {
        const key = getQtyDraftKey(deliveryId, sku);
        const raw = qtyDraft[key];
        if (raw == null) return;

        const parsed = Math.floor(Number(raw));
        const productQty = productQtyBySku.get(sku) ?? 1;

        if (Number.isFinite(parsed) && parsed >= 1) {
            rebalanceSkuQtyAcrossDeliveries(
                sku,
                deliveryId,
                Math.min(parsed, Math.max(1, maxAllowedForRow))
            );
        }

        setQtyDraft((prev) => {
            const next = { ...prev };
            delete next[key];
            return next;
        });
    };

    return (
        <div className="space-y-4">
            {products.length === 0 ? (
                <div className="rounded-md border border-dashed border-gray-300 px-3 py-4 text-sm text-gray-500">
                    Agrega productos para configurar métodos de entrega.
                </div>
            ) : (
                <div className="space-y-5">
                    {hasAnyHomeDelivery ? (
                        <div className="rounded-xl border border-slate-300 bg-white p-4">
                            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
                                <div>
                                    <p className="text-sm font-semibold text-slate-800">Dirección para envíos a domicilio</p>
                                    <p className="mt-0.5 text-xs text-gray-500">
                                        Esta dirección se comparte para todos los productos con envío a domicilio.
                                    </p>
                                </div>
                            </div>

                            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
                                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                                    <div>
                                        <label className="mb-1 block text-xs font-medium text-slate-600">Región</label>
                                        <Input
                                            fullWidth
                                            value={sharedHomeDeliveryData.region}
                                            onChange={(e) => upsertAllHomeDeliveryRows({ region: e.target.value })}
                                            placeholder="Ej: Metropolitana"
                                            className="[&>input]:bg-white [&>input]:p-2"
                                        />
                                    </div>

                                    <div>
                                        <label className="mb-1 block text-xs font-medium text-slate-600">Ciudad</label>
                                        <Input
                                            fullWidth
                                            value={sharedHomeDeliveryData.ciudad}
                                            onChange={(e) => upsertAllHomeDeliveryRows({ ciudad: e.target.value })}
                                            placeholder="Ej: Santiago"
                                            className="[&>input]:bg-white [&>input]:p-2"
                                        />
                                    </div>

                                    <div className="md:col-span-2">
                                        <label className="mb-1 block text-xs font-medium text-slate-600">Calle</label>
                                        <Input
                                            fullWidth
                                            value={sharedHomeDeliveryData.calle}
                                            onChange={(e) => upsertAllHomeDeliveryRows({ calle: e.target.value })}
                                            placeholder="Ej: Av. Providencia"
                                            className="[&>input]:bg-white [&>input]:p-2"
                                        />
                                    </div>

                                    <div>
                                        <label className="mb-1 block text-xs font-medium text-slate-600">Número</label>
                                        <Input
                                            fullWidth
                                            value={sharedHomeDeliveryData.numero}
                                            onChange={(e) => upsertAllHomeDeliveryRows({ numero: e.target.value })}
                                            placeholder="Ej: 1234"
                                            className="[&>input]:bg-white [&>input]:p-2"
                                        />
                                    </div>

                                    <div className="md:col-span-3">
                                        <label className="mb-1 block text-xs font-medium text-slate-600">Referencia</label>
                                        <Input
                                            fullWidth
                                            value={sharedHomeDeliveryData.referencia}
                                            onChange={(e) => upsertAllHomeDeliveryRows({ referencia: e.target.value })}
                                            placeholder="Ej: Casa esquina, portón negro"
                                            className="[&>input]:bg-white [&>input]:p-2"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : null}

                    {deliveryIds.map((deliveryId, deliveryIdx) => {
                        const deliveryRows = effectiveSelections.filter((row) => row.deliveryId === deliveryId);
                        const methodRow = deliveryRows[0];
                        const isRetiro = methodRow?.mode === "retiro";

                        return (
                            <div key={deliveryId} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-4">
                                <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2">
                                    <div>
                                        <p className="text-sm font-semibold text-slate-700">Entrega {deliveryIdx + 1}</p>
                                        <p className="text-xs text-slate-500">Selecciona los productos que irán en esta entrega.</p>
                                    </div>
                                    {deliveryIds.length > 1 ? (
                                        <ActionButton variant="error" onClick={() => removeDeliveryGroup(deliveryId)}>
                                            Quitar entrega
                                        </ActionButton>
                                    ) : null}
                                </div>

                                <div className="rounded-xl border border-slate-200 bg-white p-3 space-y-2">
                                    {products.map((p) => {
                                        const selectedRow = deliveryRows.find((row) => row.sku === p.sku);
                                        const checked = Boolean(selectedRow);
                                        const maxAllowedForRow = p.cantidad;
                                        const draftKey = getQtyDraftKey(deliveryId, p.sku);
                                        const displayQty = qtyDraft[draftKey] ?? String(selectedRow?.deliveryQty ?? "");
                                        const numericQty = Math.max(1, Math.floor(Number(displayQty) || 1));

                                        return (
                                            <div key={`${deliveryId}-${p.sku}`} className="rounded-lg border border-slate-200 px-3 py-2">
                                                <div className="flex items-center justify-between gap-3">
                                                    <label className="flex items-center gap-3 cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            className="accent-blue-600"
                                                            checked={checked}
                                                            onChange={(e) => toggleProductInDelivery(p.sku, deliveryId, e.target.checked)}
                                                        />
                                                        {p.img ? (
                                                            <img
                                                                src={p.img}
                                                                alt={p.name}
                                                                className="h-10 w-10 rounded-md border border-slate-200 object-cover"
                                                                loading="lazy"
                                                                referrerPolicy="no-referrer"
                                                                onError={(e) => {
                                                                    (e.currentTarget as HTMLImageElement).style.display = "none";
                                                                }}
                                                            />
                                                        ) : null}
                                                        <div>
                                                            <p className="text-xs font-semibold text-slate-700">{p.name}</p>
                                                            <p className="text-xs text-gray-500">SKU: {p.sku} · Total carrito: {p.cantidad}</p>
                                                        </div>
                                                    </label>

                                                    {checked ? (
                                                        <div className="flex flex-col items-end gap-1">
                                                            <div className="flex items-center overflow-hidden rounded-lg border border-slate-300 bg-white shadow-sm">
                                                                <button
                                                                    type="button"
                                                                    className="h-8 w-8 border-r border-slate-200 text-slate-600 hover:bg-slate-100"
                                                                    onClick={() => {
                                                                        const nextQty = Math.max(1, numericQty - 1);
                                                                        rebalanceSkuQtyAcrossDeliveries(p.sku, deliveryId, nextQty);
                                                                        setQtyDraft((prev) => {
                                                                            const next = { ...prev };
                                                                            delete next[draftKey];
                                                                            return next;
                                                                        });
                                                                    }}
                                                                >
                                                                    -
                                                                </button>

                                                                <input
                                                                    type="text"
                                                                    inputMode="numeric"
                                                                    value={displayQty}
                                                                    onChange={(e) => {
                                                                        const raw = e.target.value;
                                                                        if (!/^\d*$/.test(raw)) return;
                                                                        setQtyDraft((prev) => ({
                                                                            ...prev,
                                                                            [draftKey]: raw,
                                                                        }));
                                                                    }}
                                                                    onBlur={() => commitRowQty(deliveryId, p.sku, maxAllowedForRow)}
                                                                    onKeyDown={(e) => {
                                                                        if (e.key === "Enter") {
                                                                            (e.currentTarget as HTMLInputElement).blur();
                                                                        }
                                                                    }}
                                                                    className="h-8 w-14 border-0 text-center text-sm font-semibold text-slate-700 focus:outline-none"
                                                                    placeholder="1"
                                                                />

                                                                <button
                                                                    type="button"
                                                                    className="h-8 w-8 border-l border-slate-200 text-slate-600 hover:bg-slate-100"
                                                                    onClick={() => {
                                                                        const nextQty = Math.min(maxAllowedForRow, numericQty + 1);
                                                                        rebalanceSkuQtyAcrossDeliveries(p.sku, deliveryId, nextQty);
                                                                        setQtyDraft((prev) => {
                                                                            const next = { ...prev };
                                                                            delete next[draftKey];
                                                                            return next;
                                                                        });
                                                                    }}
                                                                >
                                                                    +
                                                                </button>
                                                            </div>
                                                            <p className="text-[11px] text-slate-500">Max {maxAllowedForRow}</p>
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs text-slate-500">No incluido</span>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {methodRow ? (
                                    <div className={`rounded-xl border p-3 ${isRetiro ? "border-slate-300 bg-white" : "border-gray-200 bg-white"}`}>
                                        <div className="mb-2 flex items-center justify-between">
                                            <p className="text-sm font-medium">Método de entrega</p>
                                            <span className="text-xs font-semibold text-slate-500">{isRetiro ? "Retiro" : "Domicilio"}</span>
                                        </div>
                                        <div className="space-y-2">
                                            {addressTypes
                                                .filter((opt) => inferModeFromAddressType(opt.name) !== "mixta")
                                                .map((opt) => {
                                                    const checked = methodRow.addressTypeId === opt.id;
                                                    const optionMode = inferModeFromAddressType(opt.name);
                                                    const isRetiroInmediatoOption = optionMode === "retiro" && /inmediat/i.test(opt.name);
                                                    const methodMeta = getMethodMeta(opt.name, optionMode);
                                                    return (
                                                        <div
                                                            key={opt.id}
                                                            className={`rounded-lg border px-3 py-2 ${checked ? "border-slate-500 bg-slate-50" : "border-gray-200 bg-white"}`}
                                                        >
                                                            <div className="flex items-center justify-between gap-2">
                                                                <label className="flex items-center gap-2 text-sm cursor-pointer">
                                                                    <input
                                                                        type="radio"
                                                                        name={`address-type-${deliveryId}`}
                                                                        className="accent-blue-600"
                                                                        checked={checked}
                                                                        onChange={() =>
                                                                            upsertDeliveryRows(deliveryId, {
                                                                                addressTypeId: opt.id,
                                                                                addressTypeName: opt.name,
                                                                                mode: optionMode,
                                                                                branch: isRetiroInmediatoOption
                                                                                    ? (immediateBranchOption?.value ?? "")
                                                                                    : methodRow.branch,
                                                                                fecha: isRetiroInmediatoOption ? buildTodayWindow() : methodRow.fecha,
                                                                            })
                                                                        }
                                                                    />
                                                                    <span className="flex items-center gap-2">
                                                                        {methodMeta.icon}
                                                                        {methodMeta.label}
                                                                    </span>
                                                                </label>
                                                                <span className={`text-xs font-semibold ${optionMode === "retiro" ? "text-green-700" : "text-slate-700"}`}>
                                                                    {optionMode === "retiro" ? "Gratis" : formatShippingCost(methodRow.shippingCost)}
                                                                </span>
                                                            </div>

                                                            {checked ? (
                                                                <p className="mt-2 text-xs text-slate-600">
                                                                    {optionMode === "retiro"
                                                                        ? `Disponible para retiro: ${formatDeliveryDate(methodRow.fecha)}`
                                                                        : `Llega: ${formatDeliveryDate(methodRow.fecha)}`}
                                                                </p>
                                                            ) : null}

                                                            {optionMode === "retiro" ? (
                                                                <div className={`mt-3 space-y-2 ${checked ? "" : "opacity-80"}`}>
                                                                    {(() => {
                                                                        const isRetiroInmediato = /inmediat/i.test(opt.name);
                                                                        const options = isRetiroInmediato
                                                                            ? (immediateBranchOption ? [immediateBranchOption] : [])
                                                                            : sucursalOptions;
                                                                        return (
                                                                            <>
                                                                                <p className="text-xs font-medium text-gray-700">
                                                                                    {isRetiroInmediato ? "Sucursal del vendedor (retiro inmediato)" : "Sucursal para retiro"}
                                                                                </p>
                                                                                {options.map((b) => {
                                                                                    const branchChecked = methodRow.branch === b.value;
                                                                                    return (
                                                                                        <label
                                                                                            key={b.value}
                                                                                            className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2 cursor-pointer"
                                                                                        >
                                                                                            <div className="flex items-center gap-2 text-sm">
                                                                                                <input
                                                                                                    type="radio"
                                                                                                    name={`retiro-${deliveryId}`}
                                                                                                    className="accent-blue-600"
                                                                                                    checked={branchChecked}
                                                                                                    disabled={!checked}
                                                                                                    onChange={() => upsertDeliveryRows(deliveryId, { branch: b.value })}
                                                                                                />
                                                                                                <span>{b.text}</span>
                                                                                            </div>
                                                                                            <span className="text-sm font-medium text-green-700">Gratis</span>
                                                                                        </label>
                                                                                    );
                                                                                })}
                                                                                {isRetiroInmediato && loadingImmediateBranch ? (
                                                                                    <p className="text-xs text-gray-500">Cargando sucursal del vendedor...</p>
                                                                                ) : null}
                                                                                {isRetiroInmediato && !loadingImmediateBranch && options.length === 0 ? (
                                                                                    <p className="text-xs text-gray-500">No se encontró sucursal del vendedor.</p>
                                                                                ) : null}
                                                                                {!isRetiroInmediato && loadingSucursales ? (
                                                                                    <p className="text-xs text-gray-500">Cargando sucursales...</p>
                                                                                ) : null}
                                                                                {!isRetiroInmediato && !loadingSucursales && options.length === 0 ? (
                                                                                    <p className="text-xs text-gray-500">No hay sucursales disponibles.</p>
                                                                                ) : null}
                                                                            </>
                                                                        );
                                                                    })()}
                                                                </div>
                                                            ) : null}
                                                        </div>
                                                    );
                                                })}
                                            {loadingAddressTypes ? (
                                                <p className="text-xs text-gray-500">Cargando tipos de entrega...</p>
                                            ) : null}
                                            {!loadingAddressTypes && addressTypes.length === 0 ? (
                                                <p className="text-xs text-gray-500">No hay tipos de entrega disponibles.</p>
                                            ) : null}
                                        </div>
                                    </div>
                                ) : null}

                                {methodRow ? (
                                    <div className="rounded-xl border border-gray-200 bg-white p-3">
                                        <p className="text-sm font-medium mb-2">Fecha de entrega</p>
                                        <SingleDateFilter
                                            value={toDateInputValue(methodRow.fecha)}
                                            onChange={(dateStr) => {
                                                upsertDeliveryRows(deliveryId, { fecha: buildWindowForDate(dateStr) });
                                            }}
                                            label="Selecciona fecha"
                                        />
                                        <p className="mt-2 text-xs text-gray-500">Horario de entrega permitido: 9:00 AM a 7:00 PM.</p>
                                    </div>
                                ) : null}
                            </div>
                        );
                    })}

                    <div className="rounded-xl border border-slate-200 bg-white p-3 space-y-3">
                        <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-slate-700">Distribución total por producto</p>
                            <ActionButton variant="primary" onClick={addDeliveryGroup} disabled={!canAddDeliveryGroup}>
                                <PlusIcon className="h-4 w-4" />
                                Agregar entrega adicional
                            </ActionButton>
                        </div>

                        <div className="space-y-1">
                            {products.map((p) => {
                                const allocatedQty = effectiveSelections
                                    .filter((row) => row.sku === p.sku)
                                    .reduce((acc, row) => acc + (Number(row.deliveryQty) || 0), 0);
                                const remainingQty = Math.max(0, p.cantidad - allocatedQty);
                                if (remainingQty <= 0) return null;
                                return (
                                    <p key={`alloc-${p.sku}`} className="text-xs text-amber-700">
                                        {p.name}: falta asignar {remainingQty} de {p.cantidad}
                                    </p>
                                );
                            })}

                            {!products.some((p) => {
                                const allocatedQty = effectiveSelections
                                    .filter((row) => row.sku === p.sku)
                                    .reduce((acc, row) => acc + (Number(row.deliveryQty) || 0), 0);
                                return allocatedQty < p.cantidad;
                            }) ? (
                                <p className="text-xs text-slate-600">Todos los productos están correctamente asignados.</p>
                            ) : null}
                        </div>

                        {!canAddDeliveryGroup ? (
                            <p className="text-xs text-slate-500">
                                Para agregar otra entrega, al menos un producto debe tener cantidad mayor a 1 para poder dividirse.
                            </p>
                        ) : null}
                    </div>
                </div>
            )}
        </div>
    );
}
