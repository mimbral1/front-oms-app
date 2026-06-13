// views\MonitoreoCompetencia\Pricing\PricingMonitorCompetenciaView.tsx

"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import type { Action } from "@/components/layout/page-header";
import { Pagination } from "@/components/ui/pagination";
import { exportToCsv } from "@/components/presets/export/export";
import {
    ArrowDownTrayIcon,
    ArrowRightIcon,
    ArrowPathIcon,
    ChevronDownIcon,
    ChevronUpIcon,
    ExclamationTriangleIcon,
    PlusIcon,
} from "@heroicons/react/24/outline";
import ScrollButton from "@/components/ui/scroll-button/ScrollButton";
import { CopyableText } from "@/components/ui/copyable-text";
import { BASE_ANALYSIS_SERVICE_CATALOGO } from "@/lib/http/endpoints";
import AgregarProductoModal from "./AgregarProductoModal";

/* ============================================================
   Config
============================================================ */

const PER_PAGE = 10;
const PRICING_BASE_URL = BASE_ANALYSIS_SERVICE_CATALOGO;
const PRICING_PRODUCTS_URL = `${PRICING_BASE_URL}/pricing/productos`;
const PRICING_PRODUCTS_SEARCH_URL = `${PRICING_BASE_URL}/pricing/productos/buscar`;
const PRICING_BRANDS_URL = `${PRICING_BASE_URL}/filtros/marcas`;
const PRICING_CATEGORIES_URL = `${PRICING_BASE_URL}/filtros/categorias`;
const PRICING_SUBCATEGORIES_URL = `${PRICING_BASE_URL}/filtros/subcategorias`;
const PRICING_CATEGORIES_N3_URL = `${PRICING_BASE_URL}/filtros/categorias-n3`;

/* ============================================================
   Tipos UI
============================================================ */

interface PricingRow {
    sku: string;
    nombre: string;
    marca: string;
    categoria: string;
    urlImagen: string | null;
    canales: CanalData[];
}

type SearchProductosResponse = {
    data?: Array<{ sku: string; nombre: string; label?: string; value?: string }>;
};

type SkuFilterOption = {
    label: string;
    value: string;
};

type BrandsResponse = {
    data?: string[];
};

type CategoriesResponse = {
    data?: string[];
};

type SubcategoriesResponse = {
    data?: string[];
};

type CategoriesN3Response = {
    data?: string[];
};

type CompetidorItem = {
    competidor: string;
    precioCompetencia?: number;
    posicion?: string;
    estadoCompetencia?: string;
};

type CanalData = {
    canalPropio: string;
    precioPropio: number | null;
    posicion: string;
    margenPorcentaje: number | null;
    margenPesos: number | null;
    comision?: number | null;
    costoEnvio?: number | null;
    masBarato: {
        competidor: string;
        precio: number;
    } | null;
    competidores: CompetidorItem[];
    tiendasGrandes?: CompetidorItem[];
};

type PricingApiRow = {
    sku: string;
    nombre: string;
    marca: string;
    categoria: string;
    urlImagen: string | null;
    canales: CanalData[];
};

type PricingApiResponse = {
    success: boolean;
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    data: PricingApiRow[];
    metadata?: {
        canalesConsiderados?: string[];
    };
};


/* ============================================================
   Helpers UI
============================================================ */

const formatMoney = (value?: number | null) => {
    if (value === null || value === undefined) return "--";
    return `$${value.toLocaleString("es-CL")}`;
};

const normalizeChannelName = (name: string) => name.trim().toUpperCase();

const normalizeLogoKey = (name: string) =>
    name
        .trim()
        .toUpperCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^A-Z0-9]/g, "");

const BRAND_LOGOS: Record<string, string> = {
    MIMBRAL: "/Mimbral.png",
    EASY: "/Easy.png",
    SODIMAC: "/Sodimac.png",
    VTEX: "/VTEX.png",
    FALABELLA: "/Falabella.png",
    MERCADOLIBRE: "/MercadoLibre.png",
};

const getLogoPath = (name: string) => BRAND_LOGOS[normalizeLogoKey(name)];

function LogoOrFallback({
    name,
    size = 18,
}: {
    name: string;
    size?: number;
}) {
    const key = normalizeLogoKey(name);
    const isMimbral = key === "MIMBRAL";
    const src = getLogoPath(name);
    if (src) {
        return (
            <img
                src={src}
                alt={name}
                width={size}
                height={size}
                className={`rounded-sm object-contain ${isMimbral ? "scale-[1.35]" : ""}`}
            />
        );
    }

    const initials = name
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((w) => w[0])
        .join("")
        .toUpperCase() || "?";

    return (
        <span
            className="inline-flex items-center justify-center rounded bg-gray-200 text-[10px] font-semibold text-gray-600"
            style={{ width: size, height: size }}
            title={name}
        >
            {initials}
        </span>
    );
}

const getBrandLogoSize = (name: string, base: number) => {
    const key = normalizeLogoKey(name);
    if (key === "MIMBRAL") return base + 14;
    if (key === "MERCADOLIBRE") return base + 8;
    if (key === "FALABELLA") return base + 7;
    if (key === "EASY") return base + 6;
    if (key === "SODIMAC") return base + 6;
    return base;
};

const marginColor = (margen?: number | null) => {
    if (margen === null || margen === undefined) return "bg-gray-300";
    if (margen >= 20) return "bg-green-500";
    if (margen >= 8) return "bg-amber-500";
    return "bg-red-500";
};

const dedupeCompetitors = (items: CompetidorItem[] = []) => {
    const seen = new Set<string>();
    return items.filter((item) => {
        const key = `${item.competidor}-${item.precioCompetencia ?? "na"}-${item.posicion ?? "na"}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
};

const findCanalByName = (canales: CanalData[], channelName: string) =>
    canales.find(
        (c) => normalizeChannelName(c.canalPropio) === normalizeChannelName(channelName)
    );

const readNumberFallback = (source: unknown, keys: string[]): number | null => {
    if (!source || typeof source !== "object") return null;
    const rec = source as Record<string, unknown>;
    for (const key of keys) {
        const value = rec[key];
        if (typeof value === "number" && Number.isFinite(value)) return value;
    }
    return null;
};

const parseSkuTokens = (query: string) =>
    Array.from(
        new Set(
            query
                .split(/[\n,;]+/)
                .map((part) => part.trim())
                .filter(Boolean)
        )
    );

const looksLikeSkuTerm = (term: string) => {
    const clean = term.trim();
    if (!clean) return false;
    const hasSpace = /\s/.test(clean);
    const hasDigits = /\d/.test(clean);
    const alphaNumLike = /^[A-Za-z0-9_-]+$/.test(clean);
    return !hasSpace && hasDigits && alphaNumLike;
};

const uniqueByValue = (items: SkuFilterOption[]) =>
    Array.from(new Map(items.map((item) => [item.value, item])).values());

const uniqueStrings = (items: string[]) => Array.from(new Set(items.filter(Boolean)));

const extractPositionRank = (position?: string | null): number | null => {
    if (!position) return null;
    const match = position.match(/\d+/);
    if (!match) return null;

    const rank = Number.parseInt(match[0], 10);
    return Number.isFinite(rank) && rank > 0 ? rank : null;
};

const getPositionBadgeClass = (position?: string | null) => {
    const rank = extractPositionRank(position);

    if (rank === 1) {
        return "bg-emerald-100 text-emerald-800 ring-emerald-200";
    }

    if (rank !== null && rank <= 3) {
        return "bg-amber-100 text-amber-800 ring-amber-200";
    }

    if (rank !== null) {
        return "bg-rose-100 text-rose-800 ring-rose-200";
    }

    return "bg-gray-100 text-gray-600 ring-gray-200";
};

function PositionBadge({
    position,
}: {
    position?: string | null;
}) {
    const label = position || "Sin asociar";
    const rank = extractPositionRank(position);
    const isTop = rank === 1;

    return (
        <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ${isTop ? "gap-1" : ""} ${getPositionBadgeClass(position)}`}
            title={isTop ? "Mejor precio del canal" : "Posicion de precio"}
        >
            {isTop && <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />}
            {label}
        </span>
    );
}


/* ============================================================
   Página
============================================================ */

export default function PricingMonitorCompetenciaView() {
    const router = useRouter();

    const goToCatalogProductDetail = useCallback(
        (sku: string) => router.push(`/catalogo/productos/details/${encodeURIComponent(sku)}`),
        [router]
    );

    const goToProductDetail = useCallback(
        (sku: string) => router.push(`/monitor-competidores/pricing/${encodeURIComponent(sku)}`),
        [router]
    );

    const goToBrandDetail = useCallback(
        (brand: string) => router.push(`/catalogo/marcas/${encodeURIComponent(brand)}`),
        [router]
    );

    const goToSkuDetail = useCallback(
        (sku: string) => router.push(`/catalogo/skus/${encodeURIComponent(sku)}`),
        [router]
    );

    const [rows, setRows] = useState<PricingRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [showAddProduct, setShowAddProduct] = useState(false);

    const [currentPage, setCurrentPage] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0);
    const [channels, setChannels] = useState<string[]>(["VTEX", "MERCADOLIBRE", "FALABELLA"]);
    const [expandedCompetitors, setExpandedCompetitors] = useState<Record<string, boolean>>({});

    const [filters, setFilters] = useState({
        marca: "",          // string serializado (ej: "makita,einhell")
        categoria: "",
        subcategoria: "",
        categoriaN3: "",
        sku: "",            // string serializado (ej: "026004164,028006002")
    });

    // Multi SKU
    const [skuOptions, setSkuOptions] = useState<SkuFilterOption[]>([]);
    const [skuLabelsByValue, setSkuLabelsByValue] = useState<Record<string, string>>({});
    const [skuSearch, setSkuSearch] = useState("");

    // Multi Marca
    const [brandOptions, setBrandOptions] = useState<{ label: string; value: string }[]>([]);
    const [brandSearch, setBrandSearch] = useState("");

    // Multi Categoria
    const [categoryOptions, setCategoryOptions] = useState<{ label: string; value: string }[]>([]);
    const [categorySearch, setCategorySearch] = useState("");

    // Multi Subcategoria
    const [subcategoryOptions, setSubcategoryOptions] = useState<{ label: string; value: string }[]>([]);
    const [subcategorySearch, setSubcategorySearch] = useState("");

    // Multi Categoria N3
    const [categoryN3Options, setCategoryN3Options] = useState<{ label: string; value: string }[]>([]);
    const [categoryN3Search, setCategoryN3Search] = useState("");

    const selectedSkus = useMemo(
        () => (filters.sku ? filters.sku.split(",") : []),
        [filters.sku]
    );

    const selectedBrands = useMemo(
        () => (filters.marca ? filters.marca.split(",") : []),
        [filters.marca]
    );

    const selectedCategories = useMemo(
        () => (filters.categoria ? filters.categoria.split(",") : []),
        [filters.categoria]
    );

    const selectedSubcategories = useMemo(
        () => (filters.subcategoria ? filters.subcategoria.split(",") : []),
        [filters.subcategoria]
    );

    const selectedCategoriesN3 = useMemo(
        () => (filters.categoriaN3 ? filters.categoriaN3.split(",") : []),
        [filters.categoriaN3]
    );

    const shouldShowSubcategoryFilter = selectedCategories.length > 0;
    const shouldShowCategoryN3Filter = selectedSubcategories.length > 0;

    const mergeSkuLabels = useCallback((optionsToMerge: SkuFilterOption[]) => {
        if (!optionsToMerge.length) return;
        setSkuLabelsByValue((prev) => {
            const next = { ...prev };
            for (const item of optionsToMerge) {
                if (item.value && item.label) {
                    next[item.value] = item.label;
                }
            }
            return next;
        });
    }, []);

    const skuFilterOptions = useMemo(() => {
        const merged = [...skuOptions];
        selectedSkus.forEach((sku) => {
            if (!merged.some((opt) => opt.value === sku)) {
                merged.push({
                    value: sku,
                    label: skuLabelsByValue[sku] || sku,
                });
            }
        });

        return uniqueByValue(merged);
    }, [selectedSkus, skuLabelsByValue, skuOptions]);

    const parseJsonResponse = useCallback(async <T,>(res: Response, context: string): Promise<T> => {
        const contentType = res.headers.get("content-type") ?? "";
        const text = await res.text();

        if (!res.ok) {
            throw new Error(`${context}: ${res.status} ${res.statusText}`);
        }

        if (!contentType.toLowerCase().includes("application/json")) {
            throw new Error(`${context}: el servidor devolvio una respuesta no JSON.`);
        }

        try {
            return JSON.parse(text) as T;
        } catch {
            throw new Error(`${context}: respuesta JSON invalida.`);
        }
    }, []);

    const fetchProductOptionsByQuery = useCallback(
        async (query: string) => {
            const res = await fetch(
                `${PRICING_PRODUCTS_SEARCH_URL}?q=${encodeURIComponent(query)}`,
                { cache: "no-store" }
            );

            const json = await parseJsonResponse<SearchProductosResponse>(
                res,
                "Error buscando productos"
            );

            return (json.data || []).map((p) => ({
                sku: p.sku,
                nombre: p.nombre,
                label: p.label || `${p.sku} - ${p.nombre}`,
                value: p.value || p.sku,
            }));
        },
        [parseJsonResponse]
    );

    const fetchFilterStringValues = useCallback(
        async <T extends { data?: string[] }>(endpoint: string, context: string, params?: Record<string, string>) => {
            const query = new URLSearchParams();
            if (params) {
                Object.entries(params).forEach(([key, value]) => {
                    if (value) query.set(key, value);
                });
            }

            const url = query.toString() ? `${endpoint}?${query.toString()}` : endpoint;
            const res = await fetch(url, { cache: "no-store" });
            const json = await parseJsonResponse<T>(res, context);
            return uniqueStrings(json?.data || []);
        },
        [parseJsonResponse]
    );

    const searchProductos = useCallback(async (query: string) => {
        const tokens = parseSkuTokens(query);

        if (!query.trim()) {
            setSkuOptions([]);
            return;
        }

        if (tokens.length > 1) {
            try {
                const tokenLimit = 15;
                const tokensToSearch = tokens.slice(0, tokenLimit);
                const preferSkuLabel = tokensToSearch.every(looksLikeSkuTerm);
                const mergedResults = await fetchProductOptionsByQuery(tokensToSearch.join(","));
                const deduped = uniqueByValue(
                    mergedResults.map((item) => ({
                        value: item.value,
                        label: preferSkuLabel ? item.sku : (item.nombre || item.sku),
                    }))
                );

                if (deduped.length > 0) {
                    setSkuOptions(deduped);
                    mergeSkuLabels(deduped);
                    setCurrentPage(1);
                    setFilters((prev) => ({
                        ...prev,
                        sku: deduped.map((item) => item.value).join(","),
                    }));
                    return;
                }

                // Fallback: si el backend no encontro por nombre, se asume que son SKUs directos.
                const mappedTokens = tokensToSearch.map((sku) => ({
                    label: sku,
                    value: sku,
                }));
                setSkuOptions(mappedTokens);
                mergeSkuLabels(mappedTokens);
                setCurrentPage(1);
                setFilters((prev) => ({ ...prev, sku: tokensToSearch.join(",") }));
            } catch (err) {
                console.error("Error resolviendo busqueda multiple de productos:", err);
                const mappedTokens = tokens.map((sku) => ({
                    label: sku,
                    value: sku,
                }));
                setSkuOptions(mappedTokens);
                mergeSkuLabels(mappedTokens);
                setCurrentPage(1);
                setFilters((prev) => ({ ...prev, sku: tokens.join(",") }));
            }
            return;
        }

        try {
            const searchTerm = tokens[0] || query;
            const preferSkuLabel = looksLikeSkuTerm(searchTerm);

            const mappedResults = await fetchProductOptionsByQuery(searchTerm);
            if (!mappedResults.length) {
                setSkuOptions([]);
                return;
            }

            const mappedOptions: SkuFilterOption[] = mappedResults.map((item) => ({
                value: item.value,
                label: preferSkuLabel ? item.sku : (item.nombre || item.sku),
            }));

            setSkuOptions(mappedOptions);
            mergeSkuLabels(mappedOptions);

        } catch (err) {
            console.error("Error buscando productos:", err);
            setSkuOptions([]);
        }

    }, [fetchProductOptionsByQuery, mergeSkuLabels]);

    const pageFilters = useMemo(() => {
        const filtersList: any[] = [
            {
                id: "sku",
                label: "Productos",
                type: "multi-select-search",
                value: filters.sku,
                values: selectedSkus,
                options: skuFilterOptions,
                searchQuery: skuSearch,
                onSearch: (q: string) => {
                    setSkuSearch(q);
                    searchProductos(q);
                },
                compact: true,
                colSpan: "lg:col-span-2 md:col-span-1",
            },
            {
                id: "marca",
                label: "Marca",
                type: "multi-select-search",
                value: filters.marca,
                values: selectedBrands,
                options: brandOptions.filter((b) =>
                    b.label.toLowerCase().includes(brandSearch.toLowerCase())
                ),
                searchQuery: brandSearch,
                onSearch: setBrandSearch,
                compact: true,
                colSpan: "lg:col-span-2 md:col-span-1",
            },
            {
                id: "categoria",
                label: "Categoría primer nivel",
                type: "multi-select-search",
                value: filters.categoria,
                values: selectedCategories,
                options: categoryOptions.filter((category) =>
                    category.label.toLowerCase().includes(categorySearch.toLowerCase())
                ),
                searchQuery: categorySearch,
                onSearch: setCategorySearch,
                compact: true,
                colSpan: "lg:col-span-2 md:col-span-1",
            },
        ];

        if (shouldShowSubcategoryFilter) {
            filtersList.push({
                id: "subcategoria",
                label: "Categoría segundo nivel",
                type: "multi-select-search",
                value: filters.subcategoria,
                values: selectedSubcategories,
                options: subcategoryOptions.filter((subcategory) =>
                    subcategory.label.toLowerCase().includes(subcategorySearch.toLowerCase())
                ),
                searchQuery: subcategorySearch,
                onSearch: setSubcategorySearch,
                compact: true,
                colSpan: "lg:col-span-2 md:col-span-1",
            });
        }

        if (shouldShowCategoryN3Filter) {
            filtersList.push({
                id: "categoriaN3",
                label: "Categoría tercer nivel",
                type: "multi-select-search",
                value: filters.categoriaN3,
                values: selectedCategoriesN3,
                options: categoryN3Options.filter((categoryN3) =>
                    categoryN3.label.toLowerCase().includes(categoryN3Search.toLowerCase())
                ),
                searchQuery: categoryN3Search,
                onSearch: setCategoryN3Search,
                compact: true,
                colSpan: "lg:col-span-2 md:col-span-1",
            });
        }

        return filtersList;
    }, [
        filters,
        selectedSkus,
        skuFilterOptions,
        skuSearch,
        searchProductos,
        selectedBrands,
        brandOptions,
        brandSearch,
        selectedCategories,
        categoryOptions,
        categorySearch,
        shouldShowSubcategoryFilter,
        selectedSubcategories,
        subcategoryOptions,
        subcategorySearch,
        shouldShowCategoryN3Filter,
        selectedCategoriesN3,
        categoryN3Options,
        categoryN3Search,
    ]);

    useEffect(() => {
        const loadCategories = async () => {
            try {
                const values = await fetchFilterStringValues<CategoriesResponse>(
                    PRICING_CATEGORIES_URL,
                    "Error cargando categorias"
                );

                if (!values.length) {
                    setCategoryOptions([]);
                    return;
                }

                const mapped = values.map((category: string) => ({
                    label: category,
                    value: category,
                }));

                setCategoryOptions(mapped);

            } catch (err) {
                console.error("Error cargando categorias:", err);
                setCategoryOptions([]);
            }
        };

        loadCategories();
    }, [fetchFilterStringValues]);

    useEffect(() => {
        const loadSubcategories = async () => {
            try {
                const categories = uniqueStrings(selectedCategories);
                if (!categories.length) {
                    setSubcategoryOptions([]);
                    return;
                }

                const results = await Promise.all(
                    categories.map((categoria) =>
                        fetchFilterStringValues<SubcategoriesResponse>(
                            PRICING_SUBCATEGORIES_URL,
                            "Error cargando subcategorias",
                            { categoria }
                        )
                    )
                );

                const merged = uniqueStrings(results.flat());
                setSubcategoryOptions(
                    merged.map((subcategoria) => ({ label: subcategoria, value: subcategoria }))
                );
            } catch (err) {
                console.error("Error cargando subcategorias:", err);
                setSubcategoryOptions([]);
            }
        };

        loadSubcategories();
    }, [fetchFilterStringValues, selectedCategories]);

    useEffect(() => {
        const loadCategoriesN3 = async () => {
            try {
                const categories = uniqueStrings(selectedCategories);
                const subcategories = uniqueStrings(selectedSubcategories);

                if (!subcategories.length) {
                    setCategoryN3Options([]);
                    return;
                }

                if (!categories.length) {
                    setCategoryN3Options([]);
                    return;
                }

                const queryPairs: Array<Record<string, string>> = [];

                categories.forEach((categoria) => {
                    subcategories.forEach((subcategoria) => {
                        queryPairs.push({ categoria, subcategoria });
                    });
                });

                const results = await Promise.all(
                    queryPairs.map((params) =>
                        fetchFilterStringValues<CategoriesN3Response>(
                            PRICING_CATEGORIES_N3_URL,
                            "Error cargando categorias N3",
                            params
                        )
                    )
                );

                const merged = uniqueStrings(results.flat());
                setCategoryN3Options(
                    merged.map((categoriaN3) => ({ label: categoriaN3, value: categoriaN3 }))
                );
            } catch (err) {
                console.error("Error cargando categorias N3:", err);
                setCategoryN3Options([]);
            }
        };

        loadCategoriesN3();
    }, [fetchFilterStringValues, selectedCategories, selectedSubcategories]);

    useEffect(() => {
        const loadBrands = async () => {
            try {
                const categories = uniqueStrings(selectedCategories);
                const subcategories = uniqueStrings(selectedSubcategories);
                const n3s = uniqueStrings(selectedCategoriesN3);
                const brandQueries: Array<Record<string, string>> = [];

                if (n3s.length) {
                    n3s.forEach((categoriaN3) => {
                        brandQueries.push({
                            categoria: categories[0] || "",
                            subcategoria: subcategories[0] || "",
                            categoriaN3,
                        });
                    });
                } else if (subcategories.length) {
                    subcategories.forEach((subcategoria) => {
                        brandQueries.push({
                            categoria: categories[0] || "",
                            subcategoria,
                        });
                    });
                } else if (categories.length) {
                    categories.forEach((categoria) => {
                        brandQueries.push({ categoria });
                    });
                } else {
                    brandQueries.push({});
                }

                const results = await Promise.all(
                    brandQueries.map((params) =>
                        fetchFilterStringValues<BrandsResponse>(
                            PRICING_BRANDS_URL,
                            "Error cargando marcas",
                            params
                        )
                    )
                );

                const merged = uniqueStrings(results.flat());
                setBrandOptions(
                    merged.map((brand: string) => ({
                        label: brand,
                        value: brand.toLowerCase(),
                    }))
                );
            } catch (err) {
                console.error("Error cargando marcas:", err);
                setBrandOptions([]);
            }
        };

        loadBrands();
    }, [fetchFilterStringValues, selectedCategories, selectedSubcategories, selectedCategoriesN3]);

    useEffect(() => {
        if (!shouldShowSubcategoryFilter) {
            setSubcategorySearch("");
            setCategoryN3Search("");
        }
    }, [shouldShowSubcategoryFilter]);

    useEffect(() => {
        if (!shouldShowCategoryN3Filter) {
            setCategoryN3Search("");
        }
    }, [shouldShowCategoryN3Filter]);

    /* ============================================================
       Fetch Listado
    ============================================================ */

    const fetchList = useCallback(async () => {
        setLoading(true);
        setErrorMessage(null);

        try {
            const query = new URLSearchParams();
            query.set("page", String(currentPage));
            query.set("pageSize", String(PER_PAGE));
            if (filters.marca) query.set("marca", filters.marca);
            if (filters.categoria) query.set("categoria", filters.categoria);
            if (filters.subcategoria) query.set("subcategoria", filters.subcategoria);
            if (filters.categoriaN3) query.set("categoriaN3", filters.categoriaN3);
            if (filters.sku) query.set("sku", filters.sku);

            const res = await fetch(
                `${PRICING_PRODUCTS_URL}?${query.toString()}`,
                { cache: "no-store" }
            );

            const json = await parseJsonResponse<PricingApiResponse>(
                res,
                "Error cargando pricing"
            );

            const mapped: PricingRow[] = (json.data || []).map((p) => ({
                sku: p.sku,
                nombre: p.nombre,
                marca: p.marca,
                categoria: p.categoria,
                urlImagen: p.urlImagen,
                canales: Array.isArray(p.canales) ? p.canales : [],
            }));

            setRows(mapped);
            setTotalRecords(json.total || 0);

            const apiChannels = (json.metadata?.canalesConsiderados || [])
                .map(normalizeChannelName)
                .filter(Boolean);
            if (apiChannels.length) {
                setChannels(apiChannels);
            }

        } catch (err: any) {
            console.error("Error cargando pricing:", err);
            setRows([]);
            setTotalRecords(0);
            setErrorMessage(
                err?.message || "Error al cargar productos de pricing."
            );
        } finally {
            setLoading(false);
        }
    }, [currentPage, filters, parseJsonResponse]);

    useEffect(() => {
        fetchList();
    }, [fetchList]);

    /* ============================================================
       Export
    ============================================================ */

    const handleExport = useCallback(() => {
        const headers = [
            "SKU",
            "Producto",
            "Marca",
            "Categoría",
            ...channels.flatMap((ch) => [
                `${ch} Precio Mimbral`,
                `${ch} Posición`,
                `${ch} Más Barato`,
                `${ch} Precio Más Barato`,
            ]),
        ];

        const data = rows.map((r) => [
            r.sku,
            r.nombre,
            r.marca,
            r.categoria,
            ...channels.flatMap((channelName) => {
                const canal = findCanalByName(r.canales, channelName);
                return [
                    canal?.precioPropio ?? "",
                    canal?.posicion ?? "N/A",
                    canal?.masBarato?.competidor ?? "",
                    canal?.masBarato?.precio ?? "",
                ];
            }),
        ]);

        exportToCsv("pricing-productos.csv", [headers, ...data]);
    }, [rows, channels]);

    /* ============================================================
       Header Actions
    ============================================================ */

    const headerActions: Action[] = useMemo(
        () => [
            {
                label: "Agregar producto",
                variant: "primary",
                onClick: () => setShowAddProduct(true),
                icon: <PlusIcon className="h-5 w-5" />,
            },
            {
                label: "Exportar",
                variant: "secondary",
                onClick: handleExport,
                icon: <ArrowDownTrayIcon className="h-5 w-5" />,
            },
            {
                label: "Actualizar",
                variant: "secondary",
                onClick: () => fetchList(),
                icon: <ArrowPathIcon className="h-5 w-5" />,
            },
        ],
        [handleExport, fetchList]
    );

    const renderChannelCell = (row: PricingRow, channelName: string) => {
        const channelKey = `${row.sku}__${normalizeChannelName(channelName)}`;
        const canal = findCanalByName(row.canales, channelName);

        if (!canal || canal.precioPropio === null) {
            return <div className="text-xs text-gray-400">Sin datos</div>;
        }

        const competitors = dedupeCompetitors(canal.competidores).slice(0, 4);
        const isCompetitorsExpanded = Boolean(expandedCompetitors[channelKey]);
        const visibleCompetitors = isCompetitorsExpanded ? competitors : competitors.slice(0, 1);
        const tiendas = dedupeCompetitors(canal.tiendasGrandes || []).slice(0, 2);
        const margin = Math.max(0, Math.min(100, canal.margenPorcentaje ?? 0));
        const comision =
            canal.comision ??
            readNumberFallback(canal, ["comisionVenta", "commission"]);
        const costoEnvio =
            canal.costoEnvio ??
            readNumberFallback(canal, ["shippingCost", "costo_despacho"]);

        return (
            <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-2 font-semibold text-gray-700">
                        <LogoOrFallback name="MIMBRAL" size={getBrandLogoSize("MIMBRAL", 16)} />
                        MIMBRAL
                        <span className="ml-1">
                            <PositionBadge position={canal.posicion} />
                        </span>
                    </span>
                    <span className="text-base font-semibold text-gray-900">{formatMoney(canal.precioPropio)}</span>
                </div>

                <div className="space-y-1.5">
                    {competitors.length ? (
                        visibleCompetitors.map((comp, idx) => (
                            <div key={`${row.sku}-${channelName}-${comp.competidor}-${idx}`} className="flex items-center justify-between gap-3">
                                <span className="inline-flex min-w-0 items-center gap-2">
                                    <LogoOrFallback name={comp.competidor} size={getBrandLogoSize(comp.competidor, 14)} />
                                    <span className="truncate text-sm text-gray-600">{comp.competidor}</span>
                                    <PositionBadge position={comp.posicion} />
                                </span>
                                <div className="inline-flex items-center gap-1.5">
                                    <span className="text-sm font-medium text-gray-800">
                                        {formatMoney(comp.precioCompetencia)}
                                    </span>
                                    {competitors.length > 1 && idx === 0 && (
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setExpandedCompetitors((prev) => ({
                                                    ...prev,
                                                    [channelKey]: !prev[channelKey],
                                                }))
                                            }
                                            className="inline-flex items-center justify-center rounded p-0.5 text-blue-600 transition hover:bg-blue-50 hover:text-blue-700"
                                            title={isCompetitorsExpanded ? "Ver menos competidores" : `Ver ${competitors.length - 1} competidor(es) más`}
                                            aria-label={isCompetitorsExpanded ? "Ver menos competidores" : `Ver ${competitors.length - 1} competidor(es) más`}
                                        >
                                            {isCompetitorsExpanded ? (
                                                <ChevronUpIcon className="h-4 w-4" />
                                            ) : (
                                                <ChevronDownIcon className="h-4 w-4" />
                                            )}
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-gray-400">Sin competidores asociados</div>
                    )}
                </div>

                {tiendas.length > 0 && (
                    <div className="space-y-1.5 border-t border-gray-100 pt-2">
                        {tiendas.map((t, idx) => (
                            <div key={`${row.sku}-${channelName}-big-${t.competidor}-${idx}`} className="flex items-center justify-between gap-3 text-sm">
                                <span className="inline-flex min-w-0 items-center gap-2">
                                    <LogoOrFallback name={t.competidor} size={getBrandLogoSize(t.competidor, 14)} />
                                    <span className="truncate font-medium text-gray-600">{t.competidor}</span>
                                    <PositionBadge position={t.posicion} />
                                </span>
                                <span className="font-medium text-gray-700">
                                    {t.estadoCompetencia || formatMoney(t.precioCompetencia)}
                                </span>
                            </div>
                        ))}
                    </div>
                )}

                <div className="group relative">
                    <div className="mb-1.5 flex items-center justify-between text-sm text-gray-600">
                        <span className="font-medium">Margen</span>
                        <span className="font-semibold text-gray-700">{canal.margenPorcentaje != null ? `${canal.margenPorcentaje}%` : "N/A"}</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
                        <div
                            className={`h-full ${marginColor(canal.margenPorcentaje)}`}
                            style={{ width: `${margin}%` }}
                        />
                    </div>

                    <div className="pointer-events-none absolute bottom-full left-0 z-20 mb-2 hidden min-w-[220px] rounded-md border border-gray-200 bg-white p-2 text-xs shadow-lg group-hover:block">
                        <div className="mb-1 font-semibold text-gray-700">Detalle margen</div>
                        <div className="flex items-center justify-between gap-3">
                            <span className="text-gray-500">Comisión</span>
                            <span className="font-medium text-gray-800">{formatMoney(comision)}</span>
                        </div>
                        <div className="mt-1 flex items-center justify-between gap-3">
                            <span className="text-gray-500">Costo envío</span>
                            <span className="font-medium text-gray-800">{formatMoney(costoEnvio)}</span>
                        </div>
                        <div className="mt-1 flex items-center justify-between gap-3">
                            <span className="text-gray-500">Margen</span>
                            <span className="font-medium text-gray-800">
                                {canal.margenPorcentaje != null
                                    ? `${canal.margenPorcentaje}% (${formatMoney(canal.margenPesos)})`
                                    : "N/A"}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="flex min-h-screen flex-col bg-[#e8eaf5]">
            <PageHeader
                sticky
                stickyTop={0}
                title="Pricing"
                description="Análisis de precios por producto"
                action={headerActions}
                filters={pageFilters}
                onFilterChange={(id, value) => {
                    setCurrentPage(1);
                    setFilters((prev) => {
                        if (id === "categoria") {
                            return {
                                ...prev,
                                categoria: value,
                                subcategoria: "",
                                categoriaN3: "",
                            };
                        }
                        if (id === "subcategoria") {
                            return {
                                ...prev,
                                subcategoria: value,
                                categoriaN3: "",
                            };
                        }
                        return { ...prev, [id]: value };
                    });
                }}
                filterTitle={false}
                filtersGridClassName="gap-2 py-2 lg:grid-cols-12 lg:pr-6"
            />

            <div className="flex-1 px-3 py-3 sm:px-6">
                <div className="space-y-6">

                    {loading ? (
                        <div className="mt-6 overflow-x-auto border rounded-md bg-white">
                            <table className="min-w-full text-sm">
                                <tbody>
                                    <tr>
                                        <td className="px-4 py-6 text-center text-gray-500">
                                            <ArrowPathIcon className="h-5 w-5 inline animate-spin mr-2" />
                                            Cargando productos…
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    ) : errorMessage ? (
                        <div
                            className="mt-6 bg-red-50 border-l-4 border-red-400 p-4 text-red-700 rounded-md shadow-sm"
                            role="alert"
                        >
                            <div className="flex">
                                <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mr-2" />
                                <div>
                                    <h3 className="text-sm font-medium">
                                        Error al cargar productos
                                    </h3>
                                    <p className="mt-2 text-sm">{errorMessage}</p>
                                    <button
                                        onClick={() => {
                                            setErrorMessage(null);
                                            fetchList();
                                        }}
                                        className="mt-3 rounded-md bg-red-50 px-2 py-1.5 text-sm font-medium text-red-800 hover:bg-red-100"
                                    >
                                        Reintentar
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* Desktop / Tablet */}
                            <div className="hidden overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm md:block">
                                <table className="min-w-[1400px] w-full table-fixed">
                                    <thead className="border-b border-gray-200 bg-gray-50">
                                        <tr>
                                            <th className="w-[340px] px-5 py-4 text-left text-sm font-semibold uppercase tracking-wide text-gray-500">
                                                Items
                                            </th>
                                            {channels.map((ch) => (
                                                <th
                                                    key={ch}
                                                    className="px-5 py-4 text-left text-sm font-semibold uppercase tracking-wide text-gray-500"
                                                >
                                                    <span className="inline-flex items-center gap-2">
                                                        <LogoOrFallback name={ch} size={getBrandLogoSize(ch, 16)} />
                                                        {ch}
                                                    </span>
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>

                                    <tbody className="divide-y divide-gray-200">
                                        {rows.map((row) => (
                                            <tr key={row.sku} className="hover:bg-gray-50/70">
                                                <td
                                                    className="group cursor-pointer px-5 py-5 align-top transition-colors hover:bg-blue-50/40"
                                                    onClick={() => goToProductDetail(row.sku)}
                                                >
                                                    <div className="flex items-start gap-4">
                                                        <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center overflow-hidden rounded-md bg-gray-100">
                                                            {row.urlImagen ? (
                                                                <img
                                                                    src={row.urlImagen}
                                                                    alt={row.nombre}
                                                                    className="h-full w-full object-contain"
                                                                />
                                                            ) : (
                                                                <span className="text-xs text-gray-500">Sin imagen</span>
                                                            )}
                                                        </div>

                                                        <div className="min-w-0 space-y-1">
                                                            <button
                                                                type="button"
                                                                onClick={(event) => {
                                                                    event.stopPropagation();
                                                                    goToCatalogProductDetail(row.sku);
                                                                }}
                                                                className="line-clamp-2 text-left text-base font-semibold text-gray-900 hover:text-blue-700 hover:underline"
                                                            >
                                                                {row.nombre}
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={(event) => {
                                                                    event.stopPropagation();
                                                                    goToBrandDetail(row.marca);
                                                                }}
                                                                className="block text-left text-sm text-gray-500 hover:text-blue-700 hover:underline"
                                                            >
                                                                {row.marca}
                                                            </button>
                                                            <CopyableText text={row.sku} className="text-sm text-gray-700">
                                                                <button
                                                                    type="button"
                                                                    onClick={(event) => {
                                                                        event.stopPropagation();
                                                                        goToSkuDetail(row.sku);
                                                                    }}
                                                                    className="block text-left text-sm text-gray-700 hover:text-blue-700 hover:underline"
                                                                >
                                                                    SKU: {row.sku}
                                                                </button>
                                                            </CopyableText>

                                                            <button
                                                                type="button"
                                                                onClick={(event) => {
                                                                    event.stopPropagation();
                                                                    goToProductDetail(row.sku);
                                                                }}
                                                                className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 transition hover:bg-blue-100"
                                                            >
                                                                Ver extracción de datos
                                                                <ArrowRightIcon className="h-3.5 w-3.5" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </td>

                                                {channels.map((ch) => (
                                                    <td key={`${row.sku}-${ch}`} className="px-5 py-5 align-top">
                                                        {renderChannelCell(row, ch)}
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Mobile */}
                            <div className="space-y-3 md:hidden">
                                {rows.length === 0 ? (
                                    <div className="rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-500">
                                        Sin resultados para los filtros seleccionados.
                                    </div>
                                ) : (
                                    rows.map((row) => (
                                        <div key={`mobile-${row.sku}`} className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                                            <div
                                                className="w-full cursor-pointer border-b border-gray-100 px-4 py-4 text-left"
                                                onClick={() => goToProductDetail(row.sku)}
                                            >
                                                <div className="flex items-start gap-3">
                                                    <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center overflow-hidden rounded-md bg-gray-100">
                                                        {row.urlImagen ? (
                                                            <img
                                                                src={row.urlImagen}
                                                                alt={row.nombre}
                                                                className="h-full w-full object-contain"
                                                            />
                                                        ) : (
                                                            <span className="text-xs text-gray-500">Sin imagen</span>
                                                        )}
                                                    </div>

                                                    <div className="min-w-0 space-y-1">
                                                        <button
                                                            type="button"
                                                            onClick={(event) => {
                                                                event.stopPropagation();
                                                                goToCatalogProductDetail(row.sku);
                                                            }}
                                                            className="line-clamp-2 text-left text-base font-semibold text-gray-900 hover:text-blue-700 hover:underline"
                                                        >
                                                            {row.nombre}
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={(event) => {
                                                                event.stopPropagation();
                                                                goToBrandDetail(row.marca);
                                                            }}
                                                            className="block text-left text-sm text-gray-500 hover:text-blue-700 hover:underline"
                                                        >
                                                            {row.marca}
                                                        </button>
                                                        <CopyableText text={row.sku} className="text-sm text-gray-700">
                                                            <button
                                                                type="button"
                                                                onClick={(event) => {
                                                                    event.stopPropagation();
                                                                    goToSkuDetail(row.sku);
                                                                }}
                                                                className="block text-left text-sm text-gray-700 hover:text-blue-700 hover:underline"
                                                            >
                                                                SKU: {row.sku}
                                                            </button>
                                                        </CopyableText>

                                                        <button
                                                            type="button"
                                                            onClick={(event) => {
                                                                event.stopPropagation();
                                                                goToProductDetail(row.sku);
                                                            }}
                                                            className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 transition hover:bg-blue-100"
                                                        >
                                                            Ver resumen
                                                            <ArrowRightIcon className="h-3.5 w-3.5" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="divide-y divide-gray-100">
                                                {channels.map((ch) => (
                                                    <div key={`mobile-${row.sku}-${ch}`} className="px-4 py-3">
                                                        <div className="mb-2 inline-flex items-center gap-2 rounded-md bg-gray-50 px-2 py-1 text-xs font-semibold uppercase tracking-wide text-gray-600">
                                                            <LogoOrFallback name={ch} size={getBrandLogoSize(ch, 15)} />
                                                            {ch}
                                                        </div>
                                                        {renderChannelCell(row, ch)}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </>
                    )}

                    {!loading && !errorMessage && (
                        <Pagination
                            currentPage={currentPage}
                            totalRecords={totalRecords}
                            pageSize={PER_PAGE}
                            onPageChange={setCurrentPage}
                        />
                    )}
                </div>
                {/* Botón global flotante */}
                {!loading && !errorMessage && rows.length > 0 && (
                    <ScrollButton />
                )}
            </div>

            <AgregarProductoModal
                open={showAddProduct}
                onClose={() => setShowAddProduct(false)}
                onSuccess={async (newSku) => {
                    // Trae el producto recién agregado por sku (sin importar filtros
                    // activos) y lo pone primero en el listado actual. No refresca
                    // toda la lista para no perder el contexto del usuario.
                    try {
                        const res = await fetch(
                            `${PRICING_PRODUCTS_URL}?sku=${encodeURIComponent(newSku)}&page=1&pageSize=1`,
                            { cache: "no-store" }
                        );
                        const json = await res.json();
                        const apiRow = json?.data?.[0];
                        if (apiRow) {
                            const newRow: PricingRow = {
                                sku: apiRow.sku,
                                nombre: apiRow.nombre,
                                marca: apiRow.marca,
                                categoria: apiRow.categoria,
                                urlImagen: apiRow.urlImagen,
                                canales: Array.isArray(apiRow.canales) ? apiRow.canales : [],
                            };
                            setRows((prev) => [
                                newRow,
                                ...prev.filter((r) => r.sku !== newRow.sku),
                            ]);
                            return;
                        }
                    } catch (_) {
                        // Si el fetch puntual falla, caemos al refetch completo.
                    }
                    fetchList();
                }}
            />
        </div>
    );
}
