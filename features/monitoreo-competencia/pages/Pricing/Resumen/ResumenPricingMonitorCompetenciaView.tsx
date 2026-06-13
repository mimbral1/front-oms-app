"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Action, PageHeader } from "@/components/layout/page-header";
import {
    ArrowPathIcon,
    ClipboardDocumentListIcon,
    ExclamationTriangleIcon,
    EyeIcon,
    EyeSlashIcon,
    PencilSquareIcon,
    PlusIcon,
    TrashIcon,
    XCircleIcon,
    XMarkIcon,
} from "@heroicons/react/24/outline";

import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    CartesianGrid,
} from "recharts";
import { ANALYSIS_SERVICE_API } from "@/lib/http/endpoints";

type Competidor = {
    sourceId: number;
    originId: number;
    linkType: string;
    competidor: string;
    url: string;
    fechaActualizacion: string;
    precioCompetencia: number;
    posicion: string;
    estadoCompetencia: string;
    deltaPorcentual: number;
    isActive: boolean;
};

type ProductLink = {
    linkType: string;
    sourceId: number;
    originId: number;
    tienda: string;
    marketplace: string | null;
    vendedor: string | null;
    url: string;
    precio: number | null;
    isActive: boolean;
    updatedAt: string;
};

type ProductApiResponse = {
    exito: boolean;
    error?: string;
    datos?: {
        product?: {
            id: number;
            sku: string;
            nombre: string;
            marca: string;
            categoria: string;
            marketplace: string;
            notFound: boolean;
            updatedAt: string;
        };
        links?: ProductLink[];
        filtroEstado?: string;
        resumen?: {
            totalLinks: number;
            activeLinks: number;
            inactiveLinks: number;
        };
        fuente?: string;
    };
};

/* ============================================================
   Helpers
============================================================ */

const MONTHS = [
    "enero", "febrero", "marzo", "abril", "mayo", "junio",
    "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

const hashString = (value: string) => {
    let hash = 0;
    for (let i = 0; i < value.length; i++) {
        hash = value.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash);
};

const generateDistinctColor = (name: string, index = 0) => {
    const normalized = name.trim().toLowerCase();
    const hash = hashString(normalized);

    // Distribuye tonos con golden angle para separar al maximo cada serie,
    // incluso cuando se agregan muchas tiendas.
    const goldenAngle = 137.508;
    const hue = Math.round((index * goldenAngle + (hash % 23)) % 360);

    // Alterna saturacion y luminosidad para evitar colores parecidos entre vecinos.
    const saturationSteps = [78, 70, 84, 74];
    const lightnessSteps = [42, 50, 38, 46];
    const saturation = saturationSteps[index % saturationSteps.length];
    const lightness = lightnessSteps[index % lightnessSteps.length];

    return `hsl(${hue} ${saturation}% ${lightness}%)`;
};

// Base del analysis-service: lee de env (NEXT_PUBLIC_BASE_ANALYSIS_SERVICE) y
// cae al túnel productivo cuando no está seteada. Permite probar contra una
// instancia local sobreescribiendo .env.local sin tocar el código.
const ANALYSIS_SERVICE_BASE = ANALYSIS_SERVICE_API;
const LINKS_API_BASE = `${ANALYSIS_SERVICE_BASE}/links`;
const PRODUCT_LINKS_API_BASE = `${LINKS_API_BASE}/productos`;
const EXTERNAL_LINKS_API = `${LINKS_API_BASE}/externos`;
const MIMBRAL_LINKS_API = `${LINKS_API_BASE}/mimbral`;
const LINK_URL_PATCH_API = `${LINKS_API_BASE}/url`;
const LINK_ACTIVATE_API = `${LINKS_API_BASE}/activate`;
const LINK_DEACTIVATE_API = LINKS_API_BASE;
const PRICING_HISTORIAL_API = `${ANALYSIS_SERVICE_BASE}/pricing/productos`;

const getDisplayCompanyName = (link: ProductLink) => {
    const rawStore = (link.tienda || "Competidor").trim();
    if (link.linkType === "MIMBRAL_MARKETPLACE") {
        return `${rawStore} (Mimbral)`;
    }
    if (link.linkType === "MIMBRAL_WEB") {
        return "Mimbral";
    }
    return rawStore;
};

const mapLinksToCompetitors = (links: ProductLink[], mimbralPrice: number) => {
    const sortedByPrice = [...links]
        .filter((link) => typeof link.precio === "number")
        .sort((a, b) => Number(a.precio) - Number(b.precio));

    const positionMap = new Map<number, number>();
    sortedByPrice.forEach((link, index) => {
        positionMap.set(link.sourceId, index + 1);
    });

    // Disambiguate duplicate display names by appending a counter
    const nameCount = new Map<string, number>();
    return links
        .map((link) => {
            const hasPrice = typeof link.precio === "number" && Number.isFinite(link.precio);
            const price = hasPrice ? Number(link.precio) : 0;
            const safeBase = mimbralPrice > 0 ? mimbralPrice : Math.max(price, 1);
            const delta = hasPrice
                ? Number((((price - safeBase) / safeBase) * 100).toFixed(2))
                : 0;

            let estadoCompetencia = "Sin Precio";
            if (hasPrice) {
                estadoCompetencia = "Igual";
                if (price < safeBase) estadoCompetencia = "Más Barato";
                if (price > safeBase) estadoCompetencia = "Más Caro";
            }

            const baseName = getDisplayCompanyName(link);
            const seen = (nameCount.get(baseName) ?? 0) + 1;
            nameCount.set(baseName, seen);
            const competidor = seen > 1 ? `${baseName} (${seen})` : baseName;

            return {
                sourceId: link.sourceId,
                originId: link.originId,
                linkType: link.linkType,
                competidor,
                url: link.url || "",
                fechaActualizacion: link.updatedAt,
                precioCompetencia: price,
                posicion: String(positionMap.get(link.sourceId) ?? "-"),
                estadoCompetencia,
                deltaPorcentual: delta,
                isActive: link.isActive,
            };
        });
};

export default function ResumenPricingMonitorCompetenciaView() {

    const router = useRouter();
    const { sku } = useParams() as { sku: string };

    const [producto, setProducto] = useState<any>(null);
    const [competidores, setCompetidores] = useState<Competidor[]>([]);
    const [analisis, setAnalisis] = useState<any>(null);
    const [historialGlobal, setHistorialGlobal] = useState<any[]>([]);
    const [logsByCompany, setLogsByCompany] = useState<Record<string, string[]>>({});
    const [selectedCompanyLogs, setSelectedCompanyLogs] = useState<string | null>(null);
    const [showAddCompanyModal, setShowAddCompanyModal] = useState(false);
    const [showEditProductUrlModal, setShowEditProductUrlModal] = useState(false);
    const [editableProductUrl, setEditableProductUrl] = useState("");
    const [isSavingProductUrl, setIsSavingProductUrl] = useState(false);
    const [editProductUrlFeedback, setEditProductUrlFeedback] = useState<string | null>(null);
    const [newCompanyUrls, setNewCompanyUrls] = useState<string[]>([""]);
    const [isAddingCompany, setIsAddingCompany] = useState(false);
    const [addCompanyFeedback, setAddCompanyFeedback] = useState<string | null>(null);
    const [addCompanyFeedbackType, setAddCompanyFeedbackType] = useState<"success" | "error" | null>(null);
    const [updatingCompetitorIds, setUpdatingCompetitorIds] = useState<number[]>([]);
    const [deletingCompetitorIds, setDeletingCompetitorIds] = useState<number[]>([]);
    const [togglingCompetitorIds, setTogglingCompetitorIds] = useState<number[]>([]);

    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const appendCompanyLog = useCallback((company: string, message: string) => {
        const logLine = `${new Date().toLocaleString("es-CL")} - ${message}`;
        setLogsByCompany((prev) => ({
            ...prev,
            [company]: [logLine, ...(prev[company] ?? [])],
        }));
    }, []);

    /* ===================== Carga automática ===================== */

    const loadData = useCallback(async () => {
        if (!sku) return;

        setLoading(true);
        setErrorMessage(null);

        try {
            // Intenta live primero (precios frescos), fallback al caché SQL Server
            let data: ProductApiResponse;
            const encodedSku = encodeURIComponent(sku);

            try {
                const liveRes = await fetch(
                    `${PRODUCT_LINKS_API_BASE}/${encodedSku}/live`,
                    { method: "GET", headers: { Accept: "application/json" }, cache: "no-store" }
                );
                const liveJson: ProductApiResponse = await liveRes.json();
                if (liveRes.ok && liveJson.exito) {
                    data = liveJson;
                } else {
                    throw new Error();
                }
            } catch {
                const fallbackRes = await fetch(
                    `${PRODUCT_LINKS_API_BASE}/${encodedSku}`,
                    { method: "GET", headers: { Accept: "application/json" }, cache: "no-store" }
                );
                if (!fallbackRes.ok) {
                    throw new Error(`No fue posible obtener links del producto (${fallbackRes.status}).`);
                }
                data = await fallbackRes.json();
            }

            if (!data?.exito || !data?.datos?.product) {
                throw new Error(data?.error || "La respuesta del endpoint no contiene datos válidos del producto.");
            }

            const apiProduct = data.datos.product;
            const links = data.datos.links ?? [];
            const mimbralWebLink = links.find((link) => link.linkType === "MIMBRAL_WEB");
            const mimbralBasePrice = Number(mimbralWebLink?.precio ?? 0);
            const mappedCompetitors = mapLinksToCompetitors(links, mimbralBasePrice);

            setProducto({
                sku: apiProduct.sku,
                nombre: apiProduct.nombre,
                marca: apiProduct.marca,
                categoria: apiProduct.categoria,
                precio: mimbralBasePrice,
                posicion: 1,
                totalVentas: 0,
                marketplace: apiProduct.marketplace || "—",
                stockML: "—",
                margenPesos: 0,
                margenPorcentaje: 0,
                fechaActualizacionML: apiProduct.updatedAt,
                urlMimbral: mimbralWebLink?.url || "",
                productUrlLinkType: mimbralWebLink?.linkType || null,
                productUrlSourceId: mimbralWebLink?.sourceId ?? null,
                urlImagen: "https://via.placeholder.com/900x420/e5e7eb/374151?text=Sin+Imagen",
            });
            setCompetidores(mappedCompetitors);
            setAnalisis({
                discount: 0,
                stock: 0,
            });

            // Obtener historial real de dispersión de precios
            try {
                const historialRes = await fetch(
                    `${PRICING_HISTORIAL_API}/${encodedSku}/historial`,
                    { method: "GET", headers: { Accept: "application/json" }, cache: "no-store" }
                );
                if (historialRes.ok) {
                    const historialJson = await historialRes.json();
                    if (historialJson?.success && Array.isArray(historialJson?.data)) {
                        setHistorialGlobal(historialJson.data);
                    } else {
                        setHistorialGlobal([]);
                    }
                } else {
                    setHistorialGlobal([]);
                }
            } catch {
                setHistorialGlobal([]);
            }

            setLogsByCompany({});
            setSelectedCompanyLogs(null);
        } catch (err: any) {
            setErrorMessage(
                err?.message || "Error cargando información del producto"
            );
            setProducto(null);
            setCompetidores([]);
            setAnalisis(null);
            setHistorialGlobal([]);
        } finally {
            setLoading(false);
        }
    }, [sku]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    /* ===================== Transform gráfico ===================== */

    const chartData = useMemo(() => {
        if (!historialGlobal.length) return [];

        return MONTHS.map((month) => {
            const row: any = { mes: month };
            let hasAnyValue = false;
            historialGlobal.forEach((store: any) => {
                const val = store[month];
                if (val != null) {
                    row[store.tienda] = val;
                    hasAnyValue = true;
                }
            });
            return hasAnyValue ? row : null;
        }).filter(Boolean);
    }, [historialGlobal]);

    const tiendas = useMemo(() => {
        if (!historialGlobal.length) return [];
        return historialGlobal.map((s: any) => s.tienda);
    }, [historialGlobal]);

    const colorByStore = useMemo(() => {
        const uniqueStores = Array.from(new Set(tiendas));
        const palette: Record<string, string> = {};

        uniqueStores.forEach((store, index) => {
            palette[store] = generateDistinctColor(store, index);
        });

        return palette;
    }, [tiendas]);

    const getColorByName = (name: string) =>
        colorByStore[name] || generateDistinctColor(name);

    const handleActualizarCompetidor = useCallback(async (company: Competidor) => {
        if (updatingCompetitorIds.includes(company.sourceId)) return;

        setUpdatingCompetitorIds((prev) => [...prev, company.sourceId]);

        try {
            let endpoint = "";

            if (company.linkType === "COMPETITOR") {
                endpoint = `${EXTERNAL_LINKS_API}/${company.sourceId}/scrape`;
            } else if (company.linkType === "MIMBRAL_WEB" || company.linkType === "MIMBRAL_MARKETPLACE") {
                endpoint = `${MIMBRAL_LINKS_API}/${company.sourceId}/scrape?type=${company.linkType}`;
            } else {
                throw new Error(`Tipo de link no soportado para scrape: ${company.linkType}`);
            }

            const response = await fetch(endpoint, {
                method: "POST",
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json",
                },
                // Enviamos la URL que ya tenemos (de /live). El backend la usa como
                // fallback cuando el id no existe en su tabla local (competidores
                // consolidados por el sync, cuyo id solo vive en back-pricing).
                body: JSON.stringify({ url: company.url || "" }),
            });

            if (!response.ok) {
                throw new Error(`No se pudo re-scrapear (${response.status}).`);
            }

            const payload = await response.json();
            if (!payload?.exito) {
                throw new Error(payload?.error || "El servicio respondió sin éxito al re-scrapear.");
            }

            appendCompanyLog(company.competidor, "INFO: Re-scrape ejecutado correctamente.");
            await loadData();
        } catch (error: any) {
            appendCompanyLog(company.competidor, `ERROR: ${error?.message || "Falló el re-scrape."}`);
        } finally {
            setUpdatingCompetitorIds((prev) => prev.filter((id) => id !== company.sourceId));
        }
    }, [appendCompanyLog, loadData, updatingCompetitorIds]);

    const handleEliminarCompetidor = useCallback(async (company: Competidor) => {
        if (deletingCompetitorIds.includes(company.sourceId)) return;

        if (company.linkType !== "COMPETITOR") {
            appendCompanyLog(company.competidor, "ERROR: Solo se pueden eliminar links de tipo COMPETITOR.");
            return;
        }

        setDeletingCompetitorIds((prev) => [...prev, company.sourceId]);

        try {
            const response = await fetch(`${EXTERNAL_LINKS_API}/${company.originId ?? company.sourceId}`, {
                method: "DELETE",
                headers: {
                    Accept: "application/json",
                },
            });

            if (!response.ok) {
                throw new Error(`No se pudo eliminar el competidor (${response.status}).`);
            }

            appendCompanyLog(company.competidor, "INFO: Competidor eliminado correctamente.");
            await loadData();
        } catch (error: any) {
            appendCompanyLog(company.competidor, `ERROR: ${error?.message || "Falló la eliminación del competidor."}`);
        } finally {
            setDeletingCompetitorIds((prev) => prev.filter((id) => id !== company.sourceId));
        }
    }, [appendCompanyLog, deletingCompetitorIds, loadData]);

    const handleToggleActivoCompetidor = useCallback(async (company: Competidor) => {
        if (togglingCompetitorIds.includes(company.sourceId)) return;

        setTogglingCompetitorIds((prev) => [...prev, company.sourceId]);

        try {
            if (company.isActive) {
                const response = await fetch(LINK_DEACTIVATE_API, {
                    method: "DELETE",
                    headers: {
                        "Content-Type": "application/json",
                        Accept: "application/json",
                    },
                    body: JSON.stringify({
                        linkType: company.linkType,
                        sourceId: company.sourceId,
                        syncRemote: true,
                    }),
                });

                if (!response.ok) {
                    throw new Error(`No se pudo desactivar el link (${response.status}).`);
                }

                const payload = await response.json();
                if (!payload?.exito) {
                    throw new Error(payload?.error || "El servicio respondió sin éxito al desactivar.");
                }

                appendCompanyLog(company.competidor, "INFO: Link desactivado correctamente.");
            } else {
                const response = await fetch(LINK_ACTIVATE_API, {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                        Accept: "application/json",
                    },
                    body: JSON.stringify({
                        linkType: company.linkType,
                        sourceId: company.sourceId,
                        syncRemote: true,
                    }),
                });

                if (!response.ok) {
                    throw new Error(`No se pudo activar el link (${response.status}).`);
                }

                const payload = await response.json();
                if (!payload?.exito) {
                    throw new Error(payload?.error || "El servicio respondió sin éxito al activar.");
                }

                appendCompanyLog(company.competidor, "INFO: Link activado correctamente.");
            }

            await loadData();
        } catch (error: any) {
            appendCompanyLog(company.competidor, `ERROR: ${error?.message || "Falló al cambiar estado del link."}`);
        } finally {
            setTogglingCompetitorIds((prev) => prev.filter((id) => id !== company.sourceId));
        }
    }, [appendCompanyLog, loadData, togglingCompetitorIds]);

    const resetAddCompanyForm = useCallback(() => {
        setNewCompanyUrls([""]);
        setAddCompanyFeedback(null);
        setAddCompanyFeedbackType(null);
    }, []);

    const updateUrlInput = useCallback((index: number, value: string) => {
        setNewCompanyUrls((prev) => {
            const next = [...prev];
            next[index] = value;
            return next;
        });
    }, []);

    const addUrlInput = useCallback(() => {
        setNewCompanyUrls((prev) => [...prev, ""]);
    }, []);

    const removeUrlInput = useCallback((index: number) => {
        setNewCompanyUrls((prev) => {
            if (prev.length === 1) return [""];
            return prev.filter((_, currentIndex) => currentIndex !== index);
        });
    }, []);

    const getCompanyNameFromUrl = useCallback((rawUrl: string, fallbackIndex: number) => {
        try {
            const normalized = /^https?:\/\//i.test(rawUrl) ? rawUrl : `https://${rawUrl}`;
            const hostname = new URL(normalized).hostname.replace(/^www\./i, "");
            const brand = hostname.split(".")[0] || `competidor-${fallbackIndex + 1}`;
            return brand.charAt(0).toUpperCase() + brand.slice(1);
        } catch {
            return `competidor-${fallbackIndex + 1}`;
        }
    }, []);

    const handleAddCompany = useCallback(async () => {
        const urls = newCompanyUrls
            .map((url) => url.trim())
            .filter(Boolean);

        if (urls.length === 0) {
            setAddCompanyFeedbackType("error");
            setAddCompanyFeedback("Debes ingresar al menos una URL válida.");
            return;
        }

        const urlMimbral = (producto?.urlMimbral || "").trim();
        if (!urlMimbral) {
            setAddCompanyFeedbackType("error");
            setAddCompanyFeedback("Debes definir la URL de Mimbral antes de enviar URLs externas.");
            return;
        }

        setIsAddingCompany(true);
        setAddCompanyFeedback(null);
        setAddCompanyFeedbackType(null);

        try {
            const response = await fetch(EXTERNAL_LINKS_API, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
                body: JSON.stringify({
                    url_mimbral: urlMimbral,
                    urls,
                }),
            });

            if (!response.ok) {
                const errBody = await response.json().catch(() => null);
                throw new Error(errBody?.error || `No se pudo agregar URL externa (${response.status}).`);
            }

            if (response.status === 200) {
                setAddCompanyFeedbackType("success");
                setAddCompanyFeedback("Respuesta exitosa 200.");
            } else {
                setAddCompanyFeedbackType("success");
                setAddCompanyFeedback("URLs enviadas correctamente.");
            }

            await loadData();

            setTimeout(() => {
                setShowAddCompanyModal(false);
                resetAddCompanyForm();
            }, 600);
        } catch (error: any) {
            setAddCompanyFeedbackType("error");
            setAddCompanyFeedback(error?.message || "Ocurrió un error al enviar las URLs.");
        } finally {
            setIsAddingCompany(false);
        }
    }, [loadData, newCompanyUrls, producto?.urlMimbral, resetAddCompanyForm]);

    /* ===================== Tabla resumen dinámica ===================== */

    const resumenData = useMemo(() => {
        if (!producto) return [];
        return [{ producto, competidores }];
    }, [producto, competidores]);

    const resumenColumns = useMemo(() => {
        if (!producto) return [];

        const baseColumns: any[] = [
            {
                header: "ITEMS",
                accessorKey: "producto",
                disableRowClick: true,
                cell: (row: any) => {
                    const p = row.producto;
                    return (
                        <div className="flex gap-4 items-start">
                            <div className="w-20 h-20 bg-gray-100 rounded flex items-center justify-center overflow-hidden">
                                {p.urlImagen ? (
                                    <img
                                        src={p.urlImagen}
                                        alt={p.nombre}
                                        className="object-contain max-h-full"
                                    />
                                ) : (
                                    <span className="text-xs text-gray-400">
                                        Sin imagen
                                    </span>
                                )}
                            </div>

                            <div className="space-y-1 text-xs">
                                <p className="font-semibold text-gray-900">{p.nombre}</p>
                                <p className="text-gray-500">{p.marca}</p>
                                <p>SKU: {p.sku}</p>
                                <p>Precio: ${p.precio?.toLocaleString("es-CL")}</p>
                            </div>
                        </div>
                    );
                },
            },
            {
                header: "MIMBRAL",
                accessorKey: "producto",
                disableRowClick: true,
                cell: (row: any) => {
                    const p = row.producto;
                    return (
                        <div className="text-xs space-y-1">
                            <p className="font-semibold text-gray-900">
                                ${p.precio?.toLocaleString("es-CL")}
                            </p>
                            <p>Posición: {p.posicion}</p>
                            <p>Margen: {p.margenPorcentaje}%</p>
                        </div>
                    );
                },
            },
        ];

        const competidorColumns = competidores.map((c: any) => ({
            header: c.competidor,
            accessorKey: "competidores",
            disableRowClick: true,
            cell: () => (
                <div className="text-xs space-y-1">
                    <p className="font-semibold text-gray-900">
                        ${c.precioCompetencia?.toLocaleString("es-CL")}
                    </p>
                    <p>Posición: {c.posicion}</p>
                    <div className="h-2 bg-gray-200 rounded">
                        <div
                            className="h-2 bg-green-500 rounded"
                            style={{
                                width: `${Math.min(Math.abs(c.deltaPorcentual), 100)}%`,
                            }}
                        />
                    </div>
                </div>
            ),
        }));

        return [...baseColumns, ...competidorColumns];
    }, [producto, competidores]);

    /* ===================== Header actions ===================== */

    const headerActions: Action[] = useMemo(
        () => [
            {
                label: "Volver a pricing",
                variant: "secondary",
                icon: <XCircleIcon className="h-5 w-5" />,
                onClick: () => router.push('/monitor-competidores/pricing'),
            },
        ],
        [router]
    );

    const handleProductInfoUrlChange = useCallback((value: string) => {
        setProducto((prev: any) => {
            if (!prev) return prev;
            return {
                ...prev,
                urlMimbral: value,
            };
        });
    }, []);

    const handleOpenEditProductUrlModal = useCallback(() => {
        setEditableProductUrl(producto?.urlMimbral || "");
        setEditProductUrlFeedback(null);
        setShowEditProductUrlModal(true);
    }, [producto?.urlMimbral]);

    const handleSaveProductInfoUrl = useCallback(async () => {
        const nextUrl = editableProductUrl.trim();
        if (!nextUrl) {
            setEditProductUrlFeedback("Debes ingresar una URL válida.");
            return;
        }

        const sourceId = Number(producto?.productUrlSourceId);
        const linkType = (producto?.productUrlLinkType || "").trim();
        if (!sourceId || !linkType) {
            setEditProductUrlFeedback("No se encontró sourceId/linkType para actualizar la URL.");
            return;
        }

        setIsSavingProductUrl(true);
        setEditProductUrlFeedback(null);

        try {
            const response = await fetch(LINK_URL_PATCH_API, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
                body: JSON.stringify({
                    linkType,
                    sourceId,
                    url: nextUrl,
                    syncRemote: true,
                }),
            });

            if (!response.ok) {
                const errBody = await response.json().catch(() => null);
                throw new Error(errBody?.error || `No se pudo actualizar la URL (${response.status}).`);
            }

            handleProductInfoUrlChange(nextUrl);

            // Flujo recomendado: tras cambiar URL, re-scrapear automáticamente
            try {
                let scrapeEndpoint = "";
                if (linkType === "COMPETITOR") {
                    scrapeEndpoint = `${EXTERNAL_LINKS_API}/${sourceId}/scrape`;
                } else if (linkType === "MIMBRAL_WEB" || linkType === "MIMBRAL_MARKETPLACE") {
                    scrapeEndpoint = `${MIMBRAL_LINKS_API}/${sourceId}/scrape?type=${linkType}`;
                }
                if (scrapeEndpoint) {
                    await fetch(scrapeEndpoint, {
                        method: "POST",
                        headers: { Accept: "application/json" },
                    });
                }
            } catch {
                // Si el re-scrape falla, no bloqueamos el flujo
            }

            setShowEditProductUrlModal(false);
            await loadData();
        } catch (error: any) {
            setEditProductUrlFeedback(error?.message || "Ocurrió un error al actualizar la URL.");
        } finally {
            setIsSavingProductUrl(false);
        }
    }, [editableProductUrl, handleProductInfoUrlChange, loadData, producto?.productUrlLinkType, producto?.productUrlSourceId]);

    /* ===================== Render ===================== */

    return (
        <div className="flex min-h-screen flex-col bg-[#e8eaf5]">
            <PageHeader
                sticky
                stickyTop={0}
                title="Pricing"
                description={`Análisis de precios producto ${sku}`}
                action={headerActions}
            />

            <div className="flex-1 p-6">
                <div className="space-y-6">

                    {loading && (
                        <div className="overflow-x-auto border rounded-md bg-white">
                            <table className="min-w-full text-sm">
                                <tbody>
                                    <tr>
                                        <td className="px-4 py-6 text-center text-gray-500">
                                            <ArrowPathIcon className="h-5 w-5 inline animate-spin mr-2" />
                                            Cargando información…
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    )}

                    {errorMessage && !loading && (
                        <div className="bg-red-50 border-l-4 border-red-400 p-4 text-red-700 rounded-md shadow-sm">
                            <div className="flex">
                                <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mr-2" />
                                <div>
                                    <p className="text-sm font-medium">
                                        Error al cargar datos
                                    </p>
                                    <p className="text-sm">{errorMessage}</p>
                                    <button
                                        onClick={loadData}
                                        className="mt-3 rounded-md bg-red-50 px-2 py-1.5 text-sm font-medium text-red-800 hover:bg-red-100"
                                    >
                                        Reintentar
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ===================== RESUMEN VISUAL PRODUCTO ===================== */}
                    {/* {producto && !loading && (
                        <div className="rounded-xl shadow-sm">
                            <DataTable
                                data={resumenData}
                                columns={resumenColumns}
                                dataType="General"
                                showStatusBorder={false}
                                rowPaddingY={16}
                                rowGap={8}
                                rowBgClass="bg-white"
                            />
                        </div>
                    )} */}

                    {/* ===================== TABLA COMPETENCIA ===================== */}
                    {producto && !loading && (
                        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                            <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
                                <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-600">
                                    Competencia
                                </h3>
                                <button
                                    type="button"
                                    onClick={() => setShowAddCompanyModal(true)}
                                    className="inline-flex items-center gap-1 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
                                >
                                    <PlusIcon className="h-4 w-4" />
                                    Agregar compañía
                                </button>
                            </div>
                            {/* <div className="px-6 py-4 border-b bg-[#E8EAF7] text-blue-600 font-semibold">
                                Competencia
                            </div> */}

                            {competidores.length === 0 ? (
                                <div className="p-6 text-gray-400 text-sm">
                                    No hay competidores registrados
                                </div>
                            ) : (
                                <table className="min-w-full text-sm">
                                    <thead className="bg-[#F3F4FA] text-blue-600">
                                        <tr>
                                            <th className="px-4 py-3 text-left">Compañía</th>
                                            <th className="px-4 py-3 text-left">Fecha</th>
                                            <th className="px-4 py-3 text-right">Precio</th>
                                            <th className="px-4 py-3 text-left">Posición</th>
                                            <th className="px-4 py-3 text-left">Estado</th>
                                            <th className="px-4 py-3 text-left">Opciones</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {competidores.map((c: Competidor, i: number) => {
                                            const estadoLabel = c.isActive ? "Activo" : "Inactivo";
                                            const estadoClass = c.isActive
                                                ? "bg-green-100 text-green-700"
                                                : "bg-gray-200 text-gray-700";

                                            return (
                                                <tr key={i} className={`border-t transition ${c.isActive ? "hover:bg-gray-50" : "bg-gray-50 opacity-60"}`}>
                                                    <td className="px-4 py-3 font-medium text-blue-600">
                                                        <div className="flex items-center gap-2">
                                                            {c.url ? (
                                                                <a
                                                                    href={c.url}
                                                                    target="_blank"
                                                                    rel="noreferrer"
                                                                    className="hover:underline"
                                                                >
                                                                    {c.competidor}
                                                                </a>
                                                            ) : (
                                                                c.competidor
                                                            )}
                                                            {!c.isActive && (
                                                                <span className="rounded-full bg-gray-200 px-2 py-0.5 text-[10px] font-medium text-gray-500">
                                                                    Inactivo
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 text-gray-500">
                                                        {c.fechaActualizacion
                                                            ? new Date(c.fechaActualizacion).toLocaleString("es-CL")
                                                            : "—"}
                                                    </td>
                                                    <td className="px-4 py-3 text-right font-semibold">
                                                        ${c.precioCompetencia?.toLocaleString("es-CL")}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        {c.posicion}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span
                                                            className={`px-3 py-1 rounded-full text-xs font-medium ${estadoClass}`}
                                                        >
                                                            {estadoLabel}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div className="inline-flex items-center gap-2 text-blue-600">
                                                            <button
                                                                type="button"
                                                                onClick={() => handleActualizarCompetidor(c)}
                                                                disabled={updatingCompetitorIds.includes(c.sourceId) || !c.isActive}
                                                                className="rounded-md p-1.5 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
                                                                title="Re-scrapear"
                                                            >
                                                                <ArrowPathIcon className={`h-5 w-5 ${updatingCompetitorIds.includes(c.sourceId) ? "animate-spin" : ""}`} />
                                                            </button>
                                                            {!c.isActive && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleToggleActivoCompetidor(c)}
                                                                    disabled={togglingCompetitorIds.includes(c.sourceId)}
                                                                    className="rounded-md p-1.5 text-green-600 hover:bg-green-50 disabled:cursor-not-allowed disabled:opacity-60"
                                                                    title="Activar"
                                                                >
                                                                    <EyeIcon className={`h-5 w-5 ${togglingCompetitorIds.includes(c.sourceId) ? "animate-pulse" : ""}`} />
                                                                </button>
                                                            )}
                                                            {c.isActive && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleToggleActivoCompetidor(c)}
                                                                    disabled={togglingCompetitorIds.includes(c.sourceId)}
                                                                    className="rounded-md p-1.5 text-yellow-600 hover:bg-yellow-50 disabled:cursor-not-allowed disabled:opacity-60"
                                                                    title="Desactivar"
                                                                >
                                                                    <EyeSlashIcon className={`h-5 w-5 ${togglingCompetitorIds.includes(c.sourceId) ? "animate-pulse" : ""}`} />
                                                                </button>
                                                            )}
                                                            {c.linkType === "COMPETITOR" && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleEliminarCompetidor(c)}
                                                                    disabled={deletingCompetitorIds.includes(c.sourceId)}
                                                                    className="rounded-md p-1.5 text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                                                                    title="Eliminar (permanente)"
                                                                >
                                                                    <TrashIcon className={`h-5 w-5 ${deletingCompetitorIds.includes(c.sourceId) ? "animate-pulse" : ""}`} />
                                                                </button>
                                                            )}
                                                            <button
                                                                type="button"
                                                                onClick={() => setSelectedCompanyLogs(c.competidor)}
                                                                className="rounded-md p-1.5 hover:bg-blue-50"
                                                                title="Logs"
                                                            >
                                                                <ClipboardDocumentListIcon className="h-5 w-5" />
                                                            </button>

                                                            {updatingCompetitorIds.includes(c.sourceId) && (
                                                                <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700">
                                                                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-blue-600" />
                                                                    Re-scrapeando...
                                                                </span>
                                                            )}
                                                            {togglingCompetitorIds.includes(c.sourceId) && (
                                                                <span className="inline-flex items-center gap-1 rounded-full bg-yellow-50 px-2 py-0.5 text-[11px] font-medium text-yellow-700">
                                                                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-yellow-600" />
                                                                    {c.isActive ? "Desactivando..." : "Activando..."}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    )}

                    {/* ===================== Gráfico ===================== */}
                    {analisis && !loading && (<div className="bg-white rounded-xl shadow-sm p-6">
                        <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                                <div className="h-8 w-1 rounded-full bg-blue-600" />
                                <h3 className="text-base font-semibold text-gray-800">
                                    Dispersión de Precios con la Competencia
                                </h3>
                            </div>
                            {producto && (
                                <span className="rounded-md bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                                    {tiendas.length} {tiendas.length === 1 ? "competidor" : "competidores"}
                                </span>
                            )}
                        </div>
                        <p className="mb-5 ml-3 text-xs text-gray-400">
                            Evolución mensual de precios por tienda. Pasa el cursor sobre el gráfico para ver valores exactos.
                        </p>

                        <div className="mb-4 flex flex-wrap gap-2">
                            {tiendas.map((tienda) => (
                                <span
                                    key={`legend-chip-${tienda}`}
                                    className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 shadow-sm transition-all hover:shadow-md hover:border-gray-300"
                                >
                                    <span
                                        className="h-3 w-3 rounded-full ring-2 ring-white"
                                        style={{ backgroundColor: getColorByName(tienda) }}
                                    />
                                    {tienda}
                                </span>
                            ))}
                        </div>

                        {chartData.length === 0 ? (
                            <div className="flex h-[320px] items-center justify-center rounded-lg border-2 border-dashed border-gray-200 bg-gray-50">
                                <div className="text-center">
                                    <ExclamationTriangleIcon className="mx-auto h-8 w-8 text-gray-300" />
                                    <p className="mt-2 text-sm text-gray-400">Sin datos históricos para mostrar</p>
                                </div>
                            </div>
                        ) : (
                            <div className="h-[380px] rounded-lg border border-gray-100 bg-gray-50/30 p-3">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                                        <XAxis
                                            dataKey="mes"
                                            tick={{ fontSize: 11, fill: "#9ca3af" }}
                                            tickLine={false}
                                            axisLine={{ stroke: "#e5e7eb" }}
                                            dy={8}
                                        />
                                        <YAxis
                                            tick={{ fontSize: 11, fill: "#9ca3af" }}
                                            tickLine={false}
                                            axisLine={false}
                                            tickFormatter={(v: number) =>
                                                v >= 1_000_000
                                                    ? `$${(v / 1_000_000).toFixed(1)}M`
                                                    : v >= 1_000
                                                        ? `$${(v / 1_000).toFixed(0)}K`
                                                        : `$${v}`
                                            }
                                            width={65}
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: "rgba(255,255,255,0.97)",
                                                border: "1px solid #e5e7eb",
                                                borderRadius: "10px",
                                                boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                                                padding: "10px 14px",
                                                fontSize: "12px",
                                            }}
                                            labelStyle={{ fontWeight: 600, color: "#374151", marginBottom: 6, textTransform: "capitalize" }}
                                            formatter={((value: any, name: any) => [
                                                `$${(Number(value) || 0).toLocaleString("es-CL")}`,
                                                name ?? "",
                                            ]) as any}
                                            cursor={{ stroke: "#d1d5db", strokeDasharray: "4 4" }}
                                        />
                                        {tiendas.map((t) => (
                                            <Line
                                                key={t}
                                                dataKey={t}
                                                type="monotone"
                                                stroke={getColorByName(t)}
                                                strokeWidth={2.5}
                                                dot={{ r: 3, strokeWidth: 2, fill: "#fff" }}
                                                activeDot={{ r: 6, strokeWidth: 2, fill: "#fff", stroke: getColorByName(t) }}
                                                animationDuration={800}
                                                animationEasing="ease-out"
                                            />
                                        ))}
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                    </div>)}

                    {/* ===================== FICHA PRODUCTO ===================== */}
                    {false && !loading && !errorMessage && (
                        <div className="bg-white rounded-xl shadow-sm p-6">

                            {!producto ? (
                                <div className="text-center text-gray-400">
                                    Sin datos.
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                                    <div className="rounded-lg bg-gray-100 p-4">
                                        <div className="flex min-h-[320px] items-center justify-center overflow-hidden rounded-md bg-white">
                                            {producto.urlImagen ? (
                                                <img
                                                    src={producto.urlImagen}
                                                    alt={producto.nombre}
                                                    className="max-h-[300px] object-contain"
                                                />
                                            ) : (
                                                <div className="h-[250px] flex items-center text-gray-400">
                                                    Sin imagen disponible
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="space-y-5">
                                        <h2 className="text-lg font-semibold text-blue-600">
                                            {producto.nombre}
                                        </h2>

                                        <div className="grid grid-cols-1 gap-5 text-sm md:grid-cols-2">
                                            <div className="space-y-1">
                                                <p><strong>SKU:</strong> {producto.sku}</p>
                                                <p><strong>Marca:</strong> {producto.marca}</p>
                                                <p><strong>Categoría:</strong> {producto.categoria}</p>
                                                <p><strong>Precio:</strong> ${producto.precio?.toLocaleString("es-CL")}</p>
                                                <p><strong>Posición:</strong> {producto.posicion}</p>
                                            </div>

                                            <div className="space-y-1">
                                                <p><strong>Marketplace:</strong> {producto.marketplace || "—"}</p>

                                                {producto.fechaActualizacionML && (
                                                    <p>
                                                        <strong>Actualización ML:</strong>{" "}
                                                        {new Date(producto.fechaActualizacionML).toLocaleString("es-CL")}
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <div>
                                                <div className="mb-1 flex items-center justify-between gap-2">
                                                    <p className="font-semibold text-black">
                                                        URL Información del Producto:
                                                    </p>
                                                    <button
                                                        type="button"
                                                        onClick={handleOpenEditProductUrlModal}
                                                        className="inline-flex items-center gap-1 rounded-md border border-gray-300 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
                                                        title="Editar URL"
                                                    >
                                                        <PencilSquareIcon className="h-4 w-4" />
                                                        Editar
                                                    </button>
                                                </div>
                                                <p className="truncate rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700">
                                                    {producto.urlMimbral || "Sin URL"}
                                                </p>
                                            </div>

                                            {producto.urlMimbral && (
                                                <a
                                                    href={producto.urlMimbral}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="inline-block text-blue-600 hover:underline"
                                                >
                                                    Abrir información del producto
                                                </a>
                                            )}

                                            {producto.urlImagen && (
                                                <div>
                                                    <p className="font-semibold text-black">
                                                        URL Imagen del Producto:
                                                    </p>
                                                    <a
                                                        href={producto.urlImagen}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="text-blue-600 hover:underline"
                                                    >
                                                        Imagen del Producto
                                                    </a>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>)}

                    {showAddCompanyModal && (
                        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
                            <div
                                className="absolute inset-0 bg-black/40"
                                onClick={() => {
                                    setShowAddCompanyModal(false);
                                    resetAddCompanyForm();
                                }}
                            />
                            <div className="relative z-10 w-full max-w-md rounded-xl bg-white p-5 shadow-xl">
                                <div className="mb-4 flex items-start justify-between">
                                    <h3 className="text-lg font-semibold text-gray-900">Agregar competidor</h3>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowAddCompanyModal(false);
                                            resetAddCompanyForm();
                                        }}
                                        className="rounded p-1 text-gray-500 hover:bg-gray-100"
                                    >
                                        <XMarkIcon className="h-5 w-5" />
                                    </button>
                                </div>

                                <div className="space-y-3">
                                    <label className="block text-sm font-medium text-gray-700">
                                        URLs para scraping
                                    </label>
                                    <div className="space-y-2">
                                        {newCompanyUrls.map((url, index) => (
                                            <div key={`url-input-${index}`} className="flex items-center gap-2">
                                                <input
                                                    type="url"
                                                    value={url}
                                                    onChange={(event) => updateUrlInput(index, event.target.value)}
                                                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                                                    placeholder="https://www.ejemplo.cl/producto"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => removeUrlInput(index)}
                                                    className="rounded p-1 text-red-600 hover:bg-red-50"
                                                    title="Quitar URL"
                                                    aria-label="Quitar URL"
                                                >
                                                    <TrashIcon className="h-4 w-4" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={addUrlInput}
                                        disabled={isAddingCompany}
                                        className="inline-flex items-center gap-1 rounded-md border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100"
                                    >
                                        <PlusIcon className="h-4 w-4" />
                                        Añadir URL
                                    </button>

                                    {isAddingCompany && (
                                        <div className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-700">
                                            <ArrowPathIcon className="mr-1 inline h-4 w-4 animate-spin" />
                                            Agregando nueva URL de competidor y ejecutando scraping inmediato...
                                        </div>
                                    )}

                                    {addCompanyFeedback && (
                                        <p
                                            className={`text-xs ${addCompanyFeedbackType === "success" ? "text-green-700" : "text-red-600"}`}
                                        >
                                            {addCompanyFeedback}
                                        </p>
                                    )}
                                </div>

                                <div className="mt-5 flex justify-end gap-2">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowAddCompanyModal(false);
                                            resetAddCompanyForm();
                                        }}
                                        disabled={isAddingCompany}
                                        className="rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleAddCompany}
                                        disabled={isAddingCompany}
                                        className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
                                    >
                                        {isAddingCompany ? "Enviando..." : "Agregar"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {selectedCompanyLogs && (
                        <div className="fixed inset-0 z-[85] flex items-center justify-center p-4">
                            <div
                                className="absolute inset-0 bg-black/40"
                                onClick={() => setSelectedCompanyLogs(null)}
                            />
                            <div className="relative z-10 w-full max-w-lg rounded-xl bg-white p-5 shadow-xl">
                                <div className="mb-4 flex items-start justify-between">
                                    <h3 className="text-lg font-semibold text-gray-900">
                                        Logs: {selectedCompanyLogs}
                                    </h3>
                                    <button
                                        type="button"
                                        onClick={() => setSelectedCompanyLogs(null)}
                                        className="rounded p-1 text-gray-500 hover:bg-gray-100"
                                    >
                                        <XMarkIcon className="h-5 w-5" />
                                    </button>
                                </div>

                                <div className="max-h-[320px] space-y-2 overflow-y-auto rounded-md border border-gray-200 bg-gray-50 p-3 text-sm">
                                    {(logsByCompany[selectedCompanyLogs] ?? []).length === 0 ? (
                                        <p className="text-gray-500">Sin logs registrados.</p>
                                    ) : (
                                        (logsByCompany[selectedCompanyLogs] ?? []).map((line, index) => (
                                            <p
                                                key={`${selectedCompanyLogs}-log-${index}`}
                                                className={`rounded px-2 py-1 ${line.includes("ERROR") ? "bg-red-50 text-red-700" : "bg-white text-gray-700"}`}
                                            >
                                                {line}
                                            </p>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {showEditProductUrlModal && (
                        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
                            <div
                                className="absolute inset-0 bg-black/40"
                                onClick={() => setShowEditProductUrlModal(false)}
                            />
                            <div className="relative z-10 w-full max-w-lg rounded-xl bg-white p-5 shadow-xl">
                                <div className="mb-4 flex items-start justify-between">
                                    <h3 className="text-lg font-semibold text-gray-900">
                                        Editar URL Información del Producto
                                    </h3>
                                    <button
                                        type="button"
                                        onClick={() => setShowEditProductUrlModal(false)}
                                        disabled={isSavingProductUrl}
                                        className="rounded p-1 text-gray-500 hover:bg-gray-100"
                                    >
                                        <XMarkIcon className="h-5 w-5" />
                                    </button>
                                </div>

                                <div>
                                    <label className="mb-1 block text-sm font-medium text-gray-700">URL</label>
                                    <input
                                        type="url"
                                        value={editableProductUrl}
                                        onChange={(event) => setEditableProductUrl(event.target.value)}
                                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                                        placeholder="https://www.ejemplo.com/producto"
                                        disabled={isSavingProductUrl}
                                    />
                                </div>

                                {editProductUrlFeedback && (
                                    <p className="mt-2 text-xs text-red-600">{editProductUrlFeedback}</p>
                                )}

                                {isSavingProductUrl && (
                                    <p className="mt-2 text-xs text-blue-700">
                                        <ArrowPathIcon className="mr-1 inline h-4 w-4 animate-spin" />
                                        Actualizando URL y sincronizando...
                                    </p>
                                )}

                                <div className="mt-5 flex justify-end gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setShowEditProductUrlModal(false)}
                                        disabled={isSavingProductUrl}
                                        className="rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleSaveProductInfoUrl}
                                        disabled={isSavingProductUrl}
                                        className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
                                    >
                                        {isSavingProductUrl ? "Guardando..." : "Guardar"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}


                </div>
            </div>
        </div>
    );
}
