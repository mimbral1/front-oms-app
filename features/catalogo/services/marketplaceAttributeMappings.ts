import { URL_MIMBRAL_MAPEOS } from "@/lib/http/endpoints";

const URL_PIM_BASE = `${URL_MIMBRAL_MAPEOS}/api/pim`;

export type AttributeMarketplaceKey = "mercadolibre" | "falabella" | "vtex";

export interface AttributeMappingNormalizedRow {
    apiId?: string | number;
    n3Id?: string | number;
    storeCategoryId: string;
    storeCategoryName: string;
    storeAttributeId: string;
    storeAttributeName: string;
    storeAttributeType: "string" | "number" | "list" | "boolean";
    marketplaceAttributeId: string;
    marketplaceAttributeName: string;
    marketplaceRequired: boolean;
    validado: boolean;
}

type QueryRecord = Record<string, string | number | boolean | null | undefined>;

function buildHeaders(token?: string | null, headers?: Record<string, string>): HeadersInit {
    const base: Record<string, string> = {
        "Content-Type": "application/json",
        ...(headers || {}),
    };

    if (token) {
        base.Authorization = `Bearer ${token}`;
    }
    return base;
}

function isRecord(value: unknown): value is Record<string, any> {
    return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function extractEnvelopeData<T = any>(payload: any): T {
    if (Array.isArray(payload)) return payload as T;
    if (isRecord(payload)) {
        if (Array.isArray(payload.data)) return payload.data as T;
        if (Array.isArray(payload.items)) return payload.items as T;
        if (Array.isArray(payload.rows)) return payload.rows as T;
    }
    return payload as T;
}

function pickValue(source: Record<string, any>, keys: string[]): unknown {
    for (const key of keys) {
        if (source[key] !== undefined && source[key] !== null) return source[key];
    }
    return undefined;
}

function asString(value: unknown): string {
    if (value === undefined || value === null) return "";
    const str = String(value).trim();
    return str;
}

function asBoolean(value: unknown): boolean {
    if (typeof value === "boolean") return value;
    if (typeof value === "number") return value !== 0;
    const normalized = asString(value).toLowerCase();
    if (!normalized) return false;
    return ["1", "true", "yes", "si", "y", "t"].includes(normalized);
}

function toIdValue(value: unknown): string | number | null {
    const raw = asString(value);
    if (!raw) return null;
    const num = Number(raw);
    if (!Number.isNaN(num)) return num;
    return raw;
}

function normalizeAttributeType(value: unknown): "string" | "number" | "list" | "boolean" {
    const normalized = asString(value).toLowerCase();
    if (["number", "numeric", "int", "integer", "float", "decimal"].includes(normalized)) {
        return "number";
    }
    if (["bool", "boolean"].includes(normalized)) {
        return "boolean";
    }
    if (["list", "array", "select", "enum", "options"].includes(normalized)) {
        return "list";
    }
    return "string";
}

export function resolveAttributeMarketplace(platformName?: string): AttributeMarketplaceKey {
    const normalized = (platformName || "").toLowerCase();
    if (normalized.includes("falabella")) return "falabella";
    if (normalized.includes("vtex")) return "vtex";
    return "mercadolibre";
}

export function normalizeAttributeMappingRow(raw: any): AttributeMappingNormalizedRow | null {
    if (!isRecord(raw)) return null;

    const apiId = pickValue(raw, ["id", "mapping_id", "mapeo_id", "map_id"]);
    const n3Id = pickValue(raw, ["n3_id", "n3Id", "categoria_id", "category_id"]);

    const storeAttributeId = asString(
        pickValue(raw, [
            "maestro_atributo_id",
            "maestroAtributoId",
            "master_attribute_id",
            "masterAttributeId",
            "atributo_id",
            "attribute_id",
            "store_attribute_id",
            "storeAttributeId",
        ])
    );

    const storeAttributeName = asString(
        pickValue(raw, [
            "maestro_atributo_nombre",
            "maestroAtributoNombre",
            "master_attribute_name",
            "masterAttributeName",
            "atributo_nombre",
            "attribute_name",
            "store_attribute_name",
            "storeAttributeName",
            "nombre",
            "name",
        ])
    );

    const storeCategoryId = asString(
        pickValue(raw, [
            "n3_id",
            "n3Id",
            "categoria_id",
            "category_id",
            "store_category_id",
            "storeCategoryId",
        ])
    );

    const storeCategoryName = asString(
        pickValue(raw, [
            "n3_nombre",
            "n3Nombre",
            "n3_name",
            "categoria_nombre",
            "category_name",
            "store_category_name",
            "storeCategoryName",
        ])
    );

    const marketplaceAttributeId = asString(
        pickValue(raw, [
            "marketplace_atributo_id",
            "marketplaceAtributoId",
            "marketplace_attribute_id",
            "marketplaceAttributeId",
            "meli_attribute_id",
            "meliAttributeId",
        ])
    );

    const marketplaceAttributeName = asString(
        pickValue(raw, [
            "marketplace_atributo_nombre",
            "marketplaceAtributoNombre",
            "marketplace_attribute_name",
            "marketplaceAttributeName",
            "meli_attribute_name",
            "meliAttributeName",
        ])
    );

    const storeAttributeType = normalizeAttributeType(
        pickValue(raw, [
            "maestro_atributo_tipo",
            "maestroAtributoTipo",
            "master_attribute_type",
            "masterAttributeType",
            "store_attribute_type",
            "storeAttributeType",
            "tipo",
            "type",
        ])
    );

    if (!storeAttributeId) return null;

    return {
        apiId: apiId as string | number | undefined,
        n3Id: (n3Id as string | number | undefined) ?? undefined,
        storeCategoryId,
        storeCategoryName,
        storeAttributeId,
        storeAttributeName: storeAttributeName || storeAttributeId,
        storeAttributeType,
        marketplaceAttributeId,
        marketplaceAttributeName,
        marketplaceRequired: asBoolean(
            pickValue(raw, [
                "marketplace_required",
                "marketplaceRequired",
                "marketplace_requerido",
                "marketplaceRequerido",
                "meli_required",
                "meliRequired",
                "required",
                "requerido",
            ])
        ),
        validado: asBoolean(pickValue(raw, ["validado", "validated", "is_validated"])),
    };
}

async function fetchPimJson<T = any>(
    path: string,
    options: RequestInit = {},
    token?: string | null
): Promise<T> {
    const url = `${URL_PIM_BASE}/${path.replace(/^\/+/, "")}`;
    const response = await fetch(url, {
        ...options,
        headers: buildHeaders(token, options.headers as Record<string, string>),
        cache: "no-store",
    });

    if (!response.ok) {
        const body = await response.text().catch(() => "");
        throw new Error(`HTTP ${response.status}${body ? ` - ${body}` : ""}`);
    }

    if (response.status === 204) {
        return null as T;
    }

    return response.json() as Promise<T>;
}

function buildQueryString(query: QueryRecord = {}): string {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) {
        if (value === undefined || value === null || value === "") continue;
        params.set(key, typeof value === "boolean" ? String(value) : String(value));
    }
    const qs = params.toString();
    return qs ? `?${qs}` : "";
}

/**
 * Crea un atributo nuevo de la tienda y lo asigna a una categoría (o lo deja
 * global si `categoriaId` es null). El backend (POST /api/pim/atributos) hace
 * todo en una transacción:
 *
 *   1. INSERT en `maestro_atributos` con los metadatos
 *   2. Si `categoria_id` viene + `nivel_herencia !== 'global'`, INSERT en
 *      `maestro_atributo_categoria` para asociarlo a esa categoría
 *
 * @returns el `id` del nuevo atributo (number).
 */
export async function createStoreAttribute(params: {
    nombre: string;
    tipoDato: "string" | "number" | "list" | "boolean";
    categoriaId: string | number | null;
    esObligatorio?: boolean;
    nombreTecnico?: string;
    token?: string | null;
    userId?: string | number | null;
    userName?: string | null;
    userEmail?: string | null;
}): Promise<number> {
    const {
        nombre,
        tipoDato,
        categoriaId,
        esObligatorio = false,
        nombreTecnico,
        token,
        userId,
        userName,
        userEmail,
    } = params;

    // Auto-genera nombre_tecnico desde nombre si no se proveyó: snake_case
    // sin tildes ni símbolos. Ej. "Tipo de alimento" → "tipo_de_alimento".
    const autoTechName = (nombre || "")
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .replace(/[^a-z0-9\s_]/g, "")
        .replace(/\s+/g, "_")
        .replace(/^_+|_+$/g, "");

    const body = {
        nombre: nombre.trim(),
        nombre_tecnico: (nombreTecnico ?? autoTechName).trim(),
        tipo_dato: tipoDato,
        nivel_herencia: categoriaId != null ? "categoria" : "global",
        es_obligatorio: esObligatorio,
        ...(categoriaId != null ? { categoria_id: toIdValue(categoriaId) } : {}),
        ...(userId !== undefined && userId !== null && userId !== "" ? { userId: Number(userId) || userId } : {}),
        ...(userName ? { userName } : {}),
        ...(userEmail ? { userEmail } : {}),
    };

    const payload = await fetchPimJson<any>(
        "atributos",
        { method: "POST", body: JSON.stringify(body) },
        token,
    );

    // El controller wrapea con `wrapOk` → response shape { ok: true, data: { id } }.
    // Acepto varios shapes por defensa.
    const data = isRecord(payload?.data) ? payload.data : payload;
    const newId = Number(data?.id ?? data?.atributo_id ?? data);
    if (!Number.isFinite(newId)) {
        throw new Error("El backend no devolvió el id del atributo recién creado");
    }
    return newId;
}

export async function fetchAllMarketplaceAttributeMappings(params: {
    marketplace: AttributeMarketplaceKey;
    token?: string | null;
    pageSize?: number;
    maxPages?: number;
    query?: QueryRecord;
}): Promise<AttributeMappingNormalizedRow[]> {
    const { marketplace, token, pageSize = 200, maxPages = 30, query = {} } = params;
    const safePageSize = Math.max(1, Math.min(200, Number(pageSize) || 200));
    const safeMaxPages = Math.max(1, Number(maxPages) || 30);
    const allRows: AttributeMappingNormalizedRow[] = [];

    let page = 1;
    let totalPages = 1;
    let safety = 0;
    let previousPageSignature = "";

    do {
        const qs = buildQueryString({
            page,
            pageSize: safePageSize,
            ...query,
        });
        const payload = await fetchPimJson<any>(
            `mapeos-atributos/${marketplace}${qs}`,
            { method: "GET" },
            token
        );

        const rows = extractEnvelopeData<any[]>(payload);
        const normalizedRows = (Array.isArray(rows) ? rows : [])
            .map(normalizeAttributeMappingRow)
            .filter(Boolean) as AttributeMappingNormalizedRow[];

        const currentSignature = normalizedRows
            .slice(0, 5)
            .map((row) => `${row.apiId ?? "na"}:${row.storeAttributeId}:${row.marketplaceAttributeId}`)
            .join("|") + `::${normalizedRows.length}`;

        if (currentSignature && currentSignature === previousPageSignature) {
            break;
        }
        previousPageSignature = currentSignature;

        allRows.push(...normalizedRows);

        const nextTotalPages = Number(
            payload?.totalPages ??
            payload?.total_pages ??
            payload?.pagination?.totalPages ??
            payload?.meta?.totalPages ??
            1
        );
        totalPages = Number.isFinite(nextTotalPages) && nextTotalPages > 0 ? nextTotalPages : 1;

        if (!Array.isArray(rows) || rows.length === 0) break;
        if (Array.isArray(rows) && rows.length < safePageSize) break;

        page += 1;
        safety += 1;
    } while (page <= totalPages && safety < safeMaxPages);

    const deduped = new Map<string, AttributeMappingNormalizedRow>();
    for (const row of allRows) {
        const key = `${row.storeCategoryId || "none"}::${row.storeAttributeId}`;
        const prev = deduped.get(key);
        if (!prev) {
            deduped.set(key, row);
            continue;
        }
        const prevHasMap = Boolean(prev.marketplaceAttributeId);
        const currentHasMap = Boolean(row.marketplaceAttributeId);
        if (!prevHasMap && currentHasMap) {
            deduped.set(key, row);
        }
    }

    return Array.from(deduped.values());
}

export async function createMarketplaceAttributeMapping(params: {
    marketplace: AttributeMarketplaceKey;
    token?: string | null;
    userId?: string | number | null;
    /** Patrón de auditoría: snapshot del nombre del usuario al momento del create. */
    userName?: string | null;
    userEmail?: string | null;
    n3Id: string | number;
    storeAttributeId: string;
    marketplaceAttributeId: string;
    marketplaceAttributeName: string;
    validado?: boolean;
}): Promise<string | number | undefined> {
    const {
        marketplace,
        token,
        userId,
        userName,
        userEmail,
        n3Id,
        storeAttributeId,
        marketplaceAttributeId,
        marketplaceAttributeName,
        validado = true,
    } = params;

    const body = {
        n3_id: toIdValue(n3Id),
        maestro_atributo_id: toIdValue(storeAttributeId),
        marketplace_atributo_id: marketplaceAttributeId,
        marketplace_atributo_nombre: marketplaceAttributeName,
        validado,
        ...(userId !== undefined && userId !== null && userId !== "" ? { userId: Number(userId) || userId } : {}),
        ...(userName ? { userName } : {}),
        ...(userEmail ? { userEmail } : {}),
    };

    const payload = await fetchPimJson<any>(
        `mapeos-atributos/${marketplace}`,
        {
            method: "POST",
            body: JSON.stringify(body),
        },
        token
    );

    const data = extractEnvelopeData<any>(payload);
    return (
        data?.id ??
        data?.mapping_id ??
        data?.mapeo_id ??
        payload?.id ??
        payload?.mapping_id ??
        payload?.mapeo_id ??
        undefined
    );
}

export async function updateMarketplaceAttributeMapping(params: {
    marketplace: AttributeMarketplaceKey;
    token?: string | null;
    userId?: string | number | null;
    userName?: string | null;
    userEmail?: string | null;
    mappingId: string | number;
    marketplaceAttributeId: string;
    marketplaceAttributeName: string;
    validado?: boolean;
}): Promise<void> {
    const {
        marketplace,
        token,
        userId,
        userName,
        userEmail,
        mappingId,
        marketplaceAttributeId,
        marketplaceAttributeName,
        validado = true,
    } = params;

    const body = {
        marketplace_atributo_id: marketplaceAttributeId,
        marketplace_atributo_nombre: marketplaceAttributeName,
        validado,
        ...(userId !== undefined && userId !== null && userId !== "" ? { userId: Number(userId) || userId } : {}),
        ...(userName ? { userName } : {}),
        ...(userEmail ? { userEmail } : {}),
    };

    await fetchPimJson(
        `mapeos-atributos/${marketplace}/${encodeURIComponent(String(mappingId))}`,
        {
            method: "PUT",
            body: JSON.stringify(body),
        },
        token
    );
}

export async function deleteMarketplaceAttributeMapping(params: {
    marketplace: AttributeMarketplaceKey;
    token?: string | null;
    userId?: string | number | null;
    userName?: string | null;
    userEmail?: string | null;
    mappingId: string | number;
}): Promise<void> {
    const { marketplace, token, userId, userName, userEmail, mappingId } = params;
    const qs = buildQueryString({
        userId: userId !== undefined && userId !== null && userId !== "" ? Number(userId) || userId : undefined,
        userName: userName ?? undefined,
        userEmail: userEmail ?? undefined,
    });
    await fetchPimJson(
        `mapeos-atributos/${marketplace}/${encodeURIComponent(String(mappingId))}${qs}`,
        { method: "DELETE" },
        token
    );
}