// views\Delivery\Transportistas\Transportista\AreaCobertura\AreaCoberturaView.tsx

"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";
import type { Action, PageHeaderProps } from "@/components/layout/page-header";
import {
    CheckCircleIcon,
    XCircleIcon,
    ArrowPathIcon,
    Cog6ToothIcon,
    UserIcon,
    PencilSquareIcon,
    PlusIcon,
    TrashIcon,
} from "@heroicons/react/24/outline";
import SaveOutlined from "@mui/icons-material/SaveOutlined";
import Card from "@/components/ui/card/Card";
import { CollapsibleField } from "@/components/ui/collapsible/collapsiblefield";
import { useFetchWithAuthDelivery } from "@/lib/http/client";
import { getCarrierCache, mergeCarrierCache } from "@/features/delivery/pages/Transportistas/Transportista/shared/carrier-cache";

interface CarrierCachedPayload {
    coverageAreaType?: string | null;
    coverageAreaData?: {
        type?: string | null;
        linearDistance?: Array<{ maxDistance?: string | number | null; cost?: string | number | null }> | null;
        linearDistanceConfiguration?: Array<{ maxDistance?: string | number | null; cost?: string | number | null }> | null;
        postalCodes?: Array<{ start?: string | null; end?: string | null; cost?: string | number | null }> | null;
        postalCodeConfiguration?: Array<{ start?: string | null; end?: string | null; cost?: string | number | null }> | null;
        polygon?: unknown[] | null;
        polygonConfiguration?: unknown[] | null;
        multiPolygon?: unknown[] | null;
        multiPolygonConfiguration?: unknown[] | null;
    } | null;
    userCreated?: string | { name?: string | null; email?: string | null } | null;
    userModified?: string | { name?: string | null; email?: string | null } | null;
    dateCreated?: string | null;
    dateModified?: string | null;
}

/* ------------------------------------------------------------
   Mock inicial 
   ------------------------------------------------------------ */
type Modality = "linearDistance" | "postalCode" | "polygon" | "multiPolygon";

type PostalCodeRange = { start: string; end: string; cost: string | number };
type LinearDistanceRange = { maxDistance: string | number; cost: string | number };
type Point = [number | string, number | string];
type PolygonShape = { points: Point[]; cost: string | number };
type UserInfo = { initials: string; name: string; email: string; date: string };

const CARRIER_ENDPOINT = "carrier";

interface CoverageAreaConfig {
    modality: Modality;
    linearDistance: LinearDistanceRange[];
    postalCodes: PostalCodeRange[];
    polygon: PolygonShape[];
    multiPolygon: PolygonShape[];
    createdBy: UserInfo;
    modifiedBy: UserInfo;
}

const INITIAL: CoverageAreaConfig = {
    modality: "linearDistance",
    linearDistance: [{ maxDistance: 1000000, cost: 1000000 }],
    postalCodes: [],
    polygon: [],
    multiPolygon: [],
    createdBy: {
        initials: "-",
        name: "-",
        email: "-",
        date: "-",
    },
    modifiedBy: {
        initials: "-",
        name: "-",
        email: "-",
        date: "-",
    },
};

const toText = (value: unknown): string => String(value ?? "").trim();

const getInitials = (name: string): string => {
    const clean = toText(name);
    if (!clean || clean === "-") return "-";
    return (
        clean
            .split(" ")
            .filter(Boolean)
            .map((n) => n[0])
            .join("")
            .toUpperCase() || "-"
    );
};

const parsePostalCodes = (value: unknown): PostalCodeRange[] => {
    if (!Array.isArray(value)) return [];
    return value.map((item) => {
        const record = item as { start?: unknown; end?: unknown; cost?: unknown };
        return {
            start: toText(record?.start),
            end: toText(record?.end),
            cost: record?.cost == null ? "" : String(record.cost),
        };
    });
};

const parseLinearDistance = (value: unknown): LinearDistanceRange[] => {
    if (!Array.isArray(value)) return [];
    return value.map((item) => {
        const record = item as { maxDistance?: unknown; cost?: unknown };
        return {
            maxDistance: record?.maxDistance == null ? "" : String(record.maxDistance),
            cost: record?.cost == null ? "" : String(record.cost),
        };
    });
};

const isPoint = (value: unknown): value is Point => {
    return Array.isArray(value)
        && value.length === 2
        && typeof value[0] === "number"
        && typeof value[1] === "number";
};

const parsePolygonEntry = (entry: unknown): PolygonShape => {
    const asRecord = (entry && typeof entry === "object" ? entry : {}) as {
        coordinates?: unknown;
        points?: unknown;
        polygon?: unknown;
        cost?: unknown;
    };

    const coordinates =
        Array.isArray(asRecord.coordinates)
            ? asRecord.coordinates
            : Array.isArray(asRecord.points)
                ? asRecord.points
                : Array.isArray(asRecord.polygon)
                    ? asRecord.polygon
                    : Array.isArray(entry)
                        ? entry
                        : [];

    return {
        points: coordinates.filter(isPoint),
        cost: asRecord.cost == null ? "" : String(asRecord.cost),
    };
};

const parsePolygonLike = (value: unknown): PolygonShape[] => {
    if (Array.isArray(value)) {
        return value.map(parsePolygonEntry);
    }

    if (value && typeof value === "object") {
        const asRecord = value as { polygons?: unknown };
        if (Array.isArray(asRecord.polygons)) {
            return asRecord.polygons.map(parsePolygonEntry);
        }
        return [parsePolygonEntry(value)];
    }

    return [];
};

const toNumeric = (value: string | number): number | string => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : String(value);
};

const toNumberOrNull = (value: string | number): number | null => {
    if (value === "") return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
};

const normalizePointsForPayload = (points: Point[]): Array<[number, number]> => {
    return points
        .map((point) => {
            const longitude = toNumberOrNull(point[0]);
            const latitude = toNumberOrNull(point[1]);
            if (longitude == null || latitude == null) return null;
            return [longitude, latitude] as [number, number];
        })
        .filter(Boolean) as Array<[number, number]>;
};

const toGeometryObject = (shape: PolygonShape) => ({
    cost: toNumeric(shape.cost),
    polygon: normalizePointsForPayload(shape.points),
});

const buildCoverageAreaPayload = (record: CoverageAreaConfig) => {
    if (record.modality === "linearDistance") {
        const values = record.linearDistance.map((item) => ({
            maxDistance: toNumeric(item.maxDistance),
            cost: toNumeric(item.cost),
        }));

        return {
            coverageArea: {
                type: "linearDistance",
                linearDistanceConfiguration: values,
                linearDistance: values,
            },
        };
    }

    if (record.modality === "postalCode") {
        const values = record.postalCodes.map((item) => ({
            start: item.start,
            end: item.end,
            cost: toNumeric(item.cost),
        }));

        return {
            coverageArea: {
                type: "postalCode",
                postalCodeConfiguration: values,
                postalCodes: values,
            },
        };
    }

    if (record.modality === "polygon") {
        const values = record.polygon.map(toGeometryObject);
        const polygonConfiguration = values.length <= 1
            ? (values[0] ?? { cost: 0, polygon: [] })
            : { polygons: values };

        return {
            coverageArea: {
                type: "polygon",
                polygonConfiguration,
                polygon: values,
            },
        };
    }

    const values = record.multiPolygon.map(toGeometryObject);
    const multiPolygonConfiguration = values.length <= 1
        ? (values[0] ?? { cost: 0, polygon: [] })
        : { polygons: values };

    return {
        coverageArea: {
            type: "multiPolygon",
            multiPolygonConfiguration,
            multiPolygon: values,
        },
    };
};

/* Chip de usuario (mismo look & feel que usas para personas) */
function UserChip({ u }: { u: CoverageAreaConfig["createdBy"] }) {
    const isEmpty = u.name === "-" && u.email === "-";
    return (
        <div className="inline-flex max-w-[290px] items-center gap-2 rounded-full border border-slate-200 bg-white px-2 py-1 shadow-sm">
            <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold text-white ${isEmpty ? "bg-slate-400" : "bg-orange-500"}`}>
                {u.initials}
            </div>
            <div className="flex flex-col overflow-hidden">
                <span className="truncate text-sm font-medium text-slate-800">{u.name}</span>
                <span className="truncate text-xs text-slate-500">{u.email}</span>
            </div>
        </div>
    );
}

export default function AreaCoberturaView() {
    const { id } = useParams();
    const recordId = Array.isArray(id) ? id[0] : id;
    const { fetchWithAuthDelivery } = useFetchWithAuthDelivery();
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const cachedCarrier = useMemo(
        () => (isMounted ? getCarrierCache<CarrierCachedPayload>(String(recordId || "")) : undefined),
        [isMounted, recordId]
    );

        const createdNameRaw =
        typeof cachedCarrier?.userCreated === "string"
            ? cachedCarrier.userCreated
            : (cachedCarrier?.userCreated?.name ?? "");
        const createdEmailRaw =
        typeof cachedCarrier?.userCreated === "object" && cachedCarrier?.userCreated
            ? (cachedCarrier.userCreated.email ?? "")
            : "";

        const modifiedNameRaw =
        typeof cachedCarrier?.userModified === "string"
            ? cachedCarrier.userModified
            : (cachedCarrier?.userModified?.name ?? "");
        const modifiedEmailRaw =
        typeof cachedCarrier?.userModified === "object" && cachedCarrier?.userModified
            ? (cachedCarrier.userModified.email ?? "")
            : "";

        const createdName = toText(createdNameRaw) || "-";
        const createdEmail = toText(createdEmailRaw) || "-";
        const modifiedName = toText(modifiedNameRaw) || "-";
        const modifiedEmail = toText(modifiedEmailRaw) || "-";

    const mapCoverageTypeToModality = (value?: string | null): Modality => {
        const normalized = String(value || "").trim().toLowerCase();
        if (normalized === "postalcode") return "postalCode";
        if (normalized === "polygon") return "polygon";
        if (normalized === "multipolygon") return "multiPolygon";
        return "linearDistance";
    };

    const cachedCoverageType =
        cachedCarrier?.coverageAreaData?.type
        ?? cachedCarrier?.coverageAreaType
        ?? null;

    const cachedLinearDistance = parseLinearDistance(cachedCarrier?.coverageAreaData?.linearDistance);
    const cachedLinearDistanceConfiguration = parseLinearDistance(cachedCarrier?.coverageAreaData?.linearDistanceConfiguration);
    const cachedPostalCodes = parsePostalCodes(cachedCarrier?.coverageAreaData?.postalCodes);
    const cachedPostalCodeConfiguration = parsePostalCodes(cachedCarrier?.coverageAreaData?.postalCodeConfiguration);
    const cachedPolygon = parsePolygonLike(cachedCarrier?.coverageAreaData?.polygon);
    const cachedPolygonConfiguration = parsePolygonLike(cachedCarrier?.coverageAreaData?.polygonConfiguration);
    const cachedMultiPolygon = parsePolygonLike(cachedCarrier?.coverageAreaData?.multiPolygon);
    const cachedMultiPolygonConfiguration = parsePolygonLike(cachedCarrier?.coverageAreaData?.multiPolygonConfiguration);

    const initialRecord: CoverageAreaConfig = useMemo(
        () => ({
            ...INITIAL,
            modality: mapCoverageTypeToModality(cachedCoverageType),
            linearDistance:
                cachedLinearDistance.length > 0
                    ? cachedLinearDistance
                    : cachedLinearDistanceConfiguration.length > 0
                        ? cachedLinearDistanceConfiguration
                        : INITIAL.linearDistance,
            postalCodes: cachedPostalCodes.length > 0 ? cachedPostalCodes : cachedPostalCodeConfiguration,
            polygon: cachedPolygon.length > 0 ? cachedPolygon : cachedPolygonConfiguration,
            multiPolygon: cachedMultiPolygon.length > 0 ? cachedMultiPolygon : cachedMultiPolygonConfiguration,
            createdBy: {
                initials: getInitials(createdName),
                name: createdName,
                email: createdEmail,
                date: cachedCarrier?.dateCreated ? new Date(cachedCarrier.dateCreated).toLocaleString("es-CL") : "-",
            },
            modifiedBy: {
                initials: getInitials(modifiedName),
                name: modifiedName,
                email: modifiedEmail,
                date: cachedCarrier?.dateModified ? new Date(cachedCarrier.dateModified).toLocaleString("es-CL") : "-",
            },
        }),
        [
            cachedCarrier?.dateCreated,
            cachedCarrier?.dateModified,
            cachedCoverageType,
            cachedLinearDistance,
            cachedLinearDistanceConfiguration,
            cachedMultiPolygon,
            cachedMultiPolygonConfiguration,
            cachedPolygon,
            cachedPolygonConfiguration,
            cachedPostalCodeConfiguration,
            cachedPostalCodes,
            createdEmail,
            createdName,
            modifiedEmail,
            modifiedName,
        ]
    );

    const [saving, setSaving] = useState(false);
    const [record, setRecord] = useState<CoverageAreaConfig>(initialRecord);

    useEffect(() => {
        if (!isMounted) return;
        setRecord(initialRecord);
        // Rehidrata solo al montar/cambiar de carrier; evita loop por objetos derivados inestables.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isMounted, recordId]);

    /* Acciones del header (calcadas del patrón de Resumen) */
    const handleSave = useCallback(async () => {
        if (!recordId) {
            alert("Carrier id inválido");
            return;
        }

        setSaving(true);
        try {
            const payload = buildCoverageAreaPayload(record);
            const response = await fetchWithAuthDelivery<CarrierCachedPayload>(`${CARRIER_ENDPOINT}/${encodeURIComponent(recordId)}`, {
                method: "PATCH",
                body: JSON.stringify(payload),
            });

            const responseCoverage = response?.coverageAreaData;
            const mergedCoverageAreaData = {
                ...(responseCoverage || {}),
                type: responseCoverage?.type ?? record.modality,
                linearDistance:
                    responseCoverage?.linearDistance
                    ?? responseCoverage?.linearDistanceConfiguration
                    ?? record.linearDistance,
                postalCodes:
                    responseCoverage?.postalCodes
                    ?? responseCoverage?.postalCodeConfiguration
                    ?? record.postalCodes,
                polygon:
                    responseCoverage?.polygon
                    ?? responseCoverage?.polygonConfiguration
                    ?? record.polygon,
                multiPolygon:
                    responseCoverage?.multiPolygon
                    ?? responseCoverage?.multiPolygonConfiguration
                    ?? record.multiPolygon,
            };

            mergeCarrierCache<CarrierCachedPayload>(String(recordId), {
                ...(response || {}),
                coverageAreaType: response?.coverageAreaType ?? record.modality,
                coverageAreaData: mergedCoverageAreaData,
            });
        } finally {
            setSaving(false);
        }
    }, [fetchWithAuthDelivery, record, recordId]);

    const addPostalCodeRow = () => {
        setRecord((prev) => ({
            ...prev,
            postalCodes: [...prev.postalCodes, { start: "", end: "", cost: "" }],
        }));
    };

    const updatePostalCodeRow = (index: number, key: keyof PostalCodeRange, value: string) => {
        setRecord((prev) => ({
            ...prev,
            postalCodes: prev.postalCodes.map((item, itemIndex) =>
                itemIndex === index ? { ...item, [key]: value } : item
            ),
        }));
    };

    const removePostalCodeRow = (index: number) => {
        setRecord((prev) => ({
            ...prev,
            postalCodes: prev.postalCodes.filter((_, itemIndex) => itemIndex !== index),
        }));
    };

    const updateShapeCollection = (
        key: "polygon" | "multiPolygon",
        updater: (shapes: PolygonShape[]) => PolygonShape[]
    ) => {
        setRecord((prev) => ({
            ...prev,
            [key]: updater(prev[key]),
        }));
    };

    const addShape = (key: "polygon" | "multiPolygon") => {
        updateShapeCollection(key, (shapes) => [...shapes, { cost: "0", points: [] }]);
    };

    const removeShape = (key: "polygon" | "multiPolygon", shapeIndex: number) => {
        updateShapeCollection(key, (shapes) => shapes.filter((_, index) => index !== shapeIndex));
    };

    const updateShapeCost = (key: "polygon" | "multiPolygon", shapeIndex: number, cost: string) => {
        const normalizedCost = cost === "" ? "0" : cost;
        updateShapeCollection(key, (shapes) =>
            shapes.map((shape, index) => (index === shapeIndex ? { ...shape, cost: normalizedCost } : shape))
        );
    };

    const addShapePoint = (key: "polygon" | "multiPolygon", shapeIndex: number) => {
        updateShapeCollection(key, (shapes) =>
            shapes.map((shape, index) =>
                index === shapeIndex ? { ...shape, points: [...shape.points, ["", ""]] } : shape
            )
        );
    };

    const updateShapePoint = (
        key: "polygon" | "multiPolygon",
        shapeIndex: number,
        pointIndex: number,
        axis: 0 | 1,
        rawValue: string
    ) => {
        updateShapeCollection(key, (shapes) =>
            shapes.map((shape, index) => {
                if (index !== shapeIndex) return shape;
                const nextPoints = shape.points.map((point, innerIndex) => {
                    if (innerIndex !== pointIndex) return point;
                    const nextPoint: Point = [...point] as Point;
                    nextPoint[axis] = rawValue;
                    return nextPoint;
                });
                return { ...shape, points: nextPoints };
            })
        );
    };

    const removeShapePoint = (key: "polygon" | "multiPolygon", shapeIndex: number, pointIndex: number) => {
        updateShapeCollection(key, (shapes) =>
            shapes.map((shape, index) => {
                if (index !== shapeIndex) return shape;
                return {
                    ...shape,
                    points: shape.points.filter((_, innerIndex) => innerIndex !== pointIndex),
                };
            })
        );
    };

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
            { label: "Volver al listado", variant: "secondary", icon: <XCircleIcon className="h-5 w-5" />, onClick: () => history.back(), disabled: saving },
        ],
        [saving, handleSave]
    );

    usePageHeader(
        () =>
        ({
            title: (
                <div>
                    <div className="text-xs font-semibold uppercase text-blue-600 tracking-wider">Transportistas</div>
                    <div className="text-2xl font-semibold text-gray-900">Resumen</div>
                </div>
            ),
            action: headerActions,
        } as PageHeaderProps),
        [headerActions]
    );

    /* Opciones del dropdown “Modalidad” (CollapsibleField inline) */
    const modalityOptions: Modality[] = ["linearDistance", "postalCode", "polygon", "multiPolygon"];

    const modalityLabel: Record<Modality, string> = {
        linearDistance: "linearDistance",
        postalCode: "postalCode",
        polygon: "polygon",
        multiPolygon: "multiPolygon",
    };

    const shapeCollectionKey = record.modality === "multiPolygon" ? "multiPolygon" : "polygon";
    const currentShapes = record.modality === "multiPolygon" ? record.multiPolygon : record.polygon;
    const inputClassName = "h-9 w-full rounded-md border border-slate-300 bg-white px-2 text-sm text-slate-800 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100";
    const addIconButtonClassName = "inline-flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-white shadow-sm transition hover:bg-blue-700";
    const deleteIconButtonClassName = "inline-flex h-8 w-8 items-center justify-center rounded-full border border-rose-200 bg-rose-50 text-rose-600 transition hover:bg-rose-100";

    return (
        <div className="p-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-7">
                {/* IZQUIERDA: CONFIGURACIONES */}
                <div className="lg:col-span-4 space-y-6">
                    <Card
                        title="CONFIGURACIONES"
                        icon={Cog6ToothIcon}
                        noDefaultStyles
                        hasTitleDivider
                        className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
                    >
                        <div className="grid grid-cols-6 gap-y-6 gap-x-4">
                            {/* Modalidad */}
                            <span className="col-span-1 text-sm font-bold text-slate-600">Modalidad</span>
                            <div className="col-span-5">
                                <CollapsibleField
                                    label=""
                                    value={record.modality}
                                    options={modalityOptions.map((m) => modalityLabel[m])}
                                    onChange={(v) => setRecord((r) => ({ ...r, modality: String(v) as Modality }))}
                                    inline
                                />
                            </div>

                            {record.modality === "linearDistance" && (
                                <>
                                    <span className="col-span-1 text-sm font-bold text-slate-600">Distancia máxima</span>
                                    <div className="col-span-5">
                                        <input
                                            className={inputClassName}
                                            type="number"
                                            min={0}
                                            value={record.linearDistance[0]?.maxDistance ?? ""}
                                            onChange={(e) =>
                                                setRecord((r) => ({
                                                    ...r,
                                                    linearDistance: [{
                                                        maxDistance: e.target.value,
                                                        cost: r.linearDistance[0]?.cost ?? "",
                                                    }],
                                                }))
                                            }
                                            placeholder=""
                                        />
                                        <div className="mt-3">
                                            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Costo</span>
                                            <input
                                                className={inputClassName}
                                                type="number"
                                                min={0}
                                                value={record.linearDistance[0]?.cost ?? ""}
                                                onChange={(e) =>
                                                    setRecord((r) => ({
                                                        ...r,
                                                        linearDistance: [{
                                                            maxDistance: r.linearDistance[0]?.maxDistance ?? "",
                                                            cost: e.target.value,
                                                        }],
                                                    }))
                                                }
                                                placeholder=""
                                            />
                                        </div>
                                    </div>

                                    <span className="col-span-1 text-sm font-bold text-slate-600">Costo</span>
                                    <div className="col-span-5 hidden">
                                        <input
                                            className={inputClassName}
                                            type="number"
                                            min={0}
                                            value={record.linearDistance[0]?.cost ?? ""}
                                            onChange={(e) =>
                                                setRecord((r) => ({
                                                    ...r,
                                                    linearDistance: [{
                                                        maxDistance: r.linearDistance[0]?.maxDistance ?? "",
                                                        cost: e.target.value,
                                                    }],
                                                }))
                                            }
                                            placeholder=""
                                        />
                                    </div>
                                </>
                            )}

                            {record.modality === "postalCode" && (
                                <>
                                    <span className="col-span-1 text-sm font-bold text-slate-600">Codigos postales</span>
                                    <div className="col-span-5 space-y-3">
                                        {record.postalCodes.length === 0 ? (
                                            <div className="rounded-md border border-dashed border-slate-300 px-3 py-2 text-sm text-slate-500">
                                                Sin codigos postales.
                                            </div>
                                        ) : (
                                            record.postalCodes.map((postalCode, index) => (
                                                <div key={`${postalCode.start}-${postalCode.end}-${index}`} className="grid grid-cols-4 gap-2 rounded-lg border border-slate-200 bg-white p-2">
                                                    <input
                                                        className={inputClassName}
                                                        type="text"
                                                        placeholder="Desde"
                                                        value={postalCode.start}
                                                        onChange={(e) => updatePostalCodeRow(index, "start", e.target.value)}
                                                    />
                                                    <input
                                                        className={inputClassName}
                                                        type="text"
                                                        placeholder="Hasta"
                                                        value={postalCode.end}
                                                        onChange={(e) => updatePostalCodeRow(index, "end", e.target.value)}
                                                    />
                                                    <input
                                                        className={inputClassName}
                                                        type="number"
                                                        min={0}
                                                        placeholder="Costo"
                                                        value={postalCode.cost}
                                                        onChange={(e) => updatePostalCodeRow(index, "cost", e.target.value)}
                                                    />
                                                    <div className="flex justify-end">
                                                        <button
                                                            type="button"
                                                            onClick={() => removePostalCodeRow(index)}
                                                            className={deleteIconButtonClassName}
                                                            title="Quitar codigo"
                                                            aria-label="Quitar codigo"
                                                        >
                                                            <TrashIcon className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                        <div className="flex justify-end">
                                            <button
                                                type="button"
                                                onClick={addPostalCodeRow}
                                                className={addIconButtonClassName}
                                                title="Agregar codigo"
                                                aria-label="Agregar codigo"
                                            >
                                                <PlusIcon className="h-6 w-6 stroke-[2.5]" />
                                            </button>
                                        </div>
                                    </div>
                                </>
                            )}

                            {(record.modality === "polygon" || record.modality === "multiPolygon") && (
                                <>
                                    <span className="col-span-1 text-sm font-bold text-slate-600">Geometrias</span>
                                    <div className="col-span-5 space-y-4">
                                        {currentShapes.length === 0 ? (
                                            <div className="rounded-md border border-dashed border-slate-300 px-3 py-2 text-sm text-slate-500">
                                                Sin coordenadas para esta modalidad.
                                            </div>
                                        ) : (
                                            currentShapes.map((shape, shapeIndex) => (
                                                <div key={`shape-${shapeIndex}`} className="rounded-lg border border-slate-200 bg-white p-4 space-y-4">
                                                    <div>
                                                        <div className="flex-1">
                                                            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                                                                Costo de cobertura
                                                            </span>
                                                            <input
                                                                className={inputClassName}
                                                                type="number"
                                                                min={0}
                                                                placeholder="Costo"
                                                                value={shape.cost}
                                                                onChange={(e) => updateShapeCost(shapeCollectionKey, shapeIndex, e.target.value)}
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="space-y-3">
                                                        {shape.points.length === 0 ? (
                                                            <div className="text-sm text-slate-500">Sin puntos.</div>
                                                        ) : (
                                                            <>
                                                                <div className="grid grid-cols-[1fr_1fr_auto] gap-2">
                                                                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Longitud</span>
                                                                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Latitud</span>
                                                                    <span />
                                                                </div>
                                                                {shape.points.map((point, pointIndex) => (
                                                                    <div key={`point-${shapeIndex}-${pointIndex}`} className="grid grid-cols-[1fr_1fr_auto] items-center gap-2">
                                                                        <input
                                                                            className={inputClassName}
                                                                            type="number"
                                                                            placeholder="Longitud"
                                                                            value={point[0]}
                                                                            onChange={(e) => updateShapePoint(shapeCollectionKey, shapeIndex, pointIndex, 0, e.target.value)}
                                                                        />
                                                                        <input
                                                                            className={inputClassName}
                                                                            type="number"
                                                                            placeholder="Latitud"
                                                                            value={point[1]}
                                                                            onChange={(e) => updateShapePoint(shapeCollectionKey, shapeIndex, pointIndex, 1, e.target.value)}
                                                                        />
                                                                    <div className="flex justify-center">
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => removeShapePoint(shapeCollectionKey, shapeIndex, pointIndex)}
                                                                            className={deleteIconButtonClassName}
                                                                            title="Quitar punto"
                                                                            aria-label="Quitar punto"
                                                                        >
                                                                            <TrashIcon className="h-4 w-4" />
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                                ))}
                                                            </>
                                                        )}
                                                        <div className="mt-2 flex justify-end">
                                                            <button
                                                                type="button"
                                                                onClick={() => addShapePoint(shapeCollectionKey, shapeIndex)}
                                                                className={addIconButtonClassName}
                                                                title="Agregar punto"
                                                                aria-label="Agregar punto"
                                                            >
                                                                <PlusIcon className="h-6 w-6 stroke-[2.5]" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                        <div className="flex justify-end">
                                            <button
                                                type="button"
                                                onClick={() => addShape(shapeCollectionKey)}
                                                className={addIconButtonClassName}
                                                title="Agregar geometria"
                                                aria-label="Agregar geometria"
                                            >
                                                <PlusIcon className="h-6 w-6 stroke-[2.5]" />
                                            </button>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </Card>
                </div>

                {/* DERECHA: USUARIO CREADOR y ÚLTIMA MODIFICACIÓN */}
                <div className="lg:col-span-3 space-y-6">
                    <Card
                        title="USUARIO CREADOR"
                        icon={UserIcon}
                        noDefaultStyles
                        hasTitleDivider
                        className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
                    >
                        <div className="flex items-center justify-between">
                            <UserChip u={record.createdBy} />
                            <span className="text-sm font-medium text-slate-600">{record.createdBy.date}</span>
                        </div>
                    </Card>

                    <Card
                        title="ÚLTIMA MODIFICACIÓN"
                        icon={PencilSquareIcon}
                        noDefaultStyles
                        hasTitleDivider
                        className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
                    >
                        <div className="flex items-center justify-between">
                            <UserChip u={record.modifiedBy} />
                            <span className="text-sm font-medium text-slate-600">{record.modifiedBy.date}</span>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
