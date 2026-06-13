// api/customers/customers.tsx
// Centraliza todas las llamadas a la API de Clientes (SIN token, SIN x-plataforma-id)
// Base apuntando a la IP indicada 
import { URL_BASE } from "@/lib/http/endpoints";

/* =============================================================================
 * Tipos (ajustados a las respuestas/requests que compartiste)
 * ========================================================================== */

export type CustomerCreatePayload = {
    id: string;
    partnerType: "C" | string;
    rut?: string;
    firstName: string;
    lastName: string;
    email?: string;
    groupCode?: number;
    groupNum?: number;
    PayTermsGrpCode?: number;
    currency?: string;
    notes?: string;
    listNum?: number;
    addresses?: Array<{
        addressCode: string;
        addressName: string;
        addressType: "B" | "S" | string;
        street?: string;
        city?: string;
        country?: string;
        isActive?: boolean;
    }>;
};

export type CustomerDTO = {
    Id: string;
    PartnerType: "C" | "S" | string;
    RUT?: string | null;
    FirstName: string;
    LastName: string;
    Email?: string | null;
    Phone?: string | null;
    Address?: string | null;
    City?: string | null;
    Region?: string | null;
    Country?: string | null;
    IsActive: boolean;
    CreatedAt?: string | null;
    UpdatedAt?: string | null;
    DeletedAt?: string | null;
    GroupCode?: number | null;
    GroupNum?: number | null;
    ListNum?: number | null;
    Currency?: string | null;
    CreditLimit?: number | null;
    DiscountPercent?: number | null;
    DefaultBillToCode?: string | null;
    DefaultShipToCode?: string | null;
    DefaultContactCode?: string | null;
};

export type AddressDTO = {
    CustomerId: string;
    AddressCode: string;
    AddressName: string;
    AddressType: "B" | "S" | string;
    Street?: string | null;
    StreetNo?: string | null;
    Building?: string | null;
    Block?: string | null;
    City?: string | null;
    County?: string | null;
    State?: string | null;
    ZipCode?: string | null;
    Country?: string | null;
    Notes?: string | null;
    IsActive: boolean;
    CreatedAt?: string | null;
    UpdatedAt?: string | null;
};

export type ContactDTO = {
    CustomerId: string;
    LegacyContactCodeInt?: number | null;
    Name: string;
    Position?: string | null;
    EMail?: string | null;
    Phone1?: string | null;
    Phone2?: string | null;
    Mobile?: string | null;
    Remarks?: string | null;
    IsActive: boolean;
    CreatedAt?: string | null;
    UpdatedAt?: string | null;
    ContactCode: string;
};

/* =============================================================================
 * Helper: fetch wrapper sin auth
 * ========================================================================== */

// async function fetchJson<T = any>(input: RequestInfo | URL, init?: RequestInit): Promise<any> {
//     const res = await fetch(input, init);
//     try {
//         if (!res.ok) {
//             const text = await res.text().catch(() => "");
//             throw new Error(`HTTP ${res.status} ${res.statusText} — ${text}`);
//         }
//         // 204 No Content
//         if (res.status === 204) return undefined as unknown as T;
//         return (await res.json()) as T;
//     } catch (error) {
//         alert(error)
//     }
// }

// fetch wrapper sin alerts y con error estructurado
async function fetchJson<T = any>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
    const res = await fetch(input, init);

    // lee el cuerpo siempre (éxito o error)
    const raw = await res.text().catch(() => "");
    let payload: any = null;
    try {
        payload = raw ? JSON.parse(raw) : null;
    } catch {
        payload = raw || null;
    }

    if (!res.ok) {
        // error con metadatos 
        const err: any = new Error(
            (payload && (payload.message || payload.details)) || `HTTP ${res.status} ${res.statusText}`
        );
        err.status = res.status;
        err.code = payload?.error || payload?.code;      // p.ej. "CONTACT_EXISTS"
        err.details = payload?.details;                  // p.ej. "ContactCode ya existe: 20690798-3"
        err.data = payload;
        throw err;
    }

    // 204 No Content
    if (res.status === 204) return undefined as unknown as T;

    return payload as T;
}


/* =============================================================================
 * Endpoints Clientes
 * ========================================================================== */

// GET /customers/find?q=&page=&pageSize=&partnerType=C
export async function customersFind(params?: {
    q?: string;
    page?: number;
    pageSize?: number;
    partnerType?: string; // "C" por defecto
}): Promise<{ items: CustomerDTO[]; total: number }> {
    const { q = "", page = 1, pageSize = 20, partnerType = "C" } = params || {};
    const url = new URL(`${URL_BASE}/customers/find`);
    if (q) url.searchParams.set("q", q);
    url.searchParams.set("page", String(page));
    url.searchParams.set("pageSize", String(pageSize));
    url.searchParams.set("partnerType", partnerType);

    const res = await fetchJson<any>(url.toString(), { method: "GET" });
    const items: CustomerDTO[] = Array.isArray(res) ? res : (res?.items ?? []);
    const total: number = Array.isArray(res) ? items.length : (res?.total ?? items.length);
    return { items, total };
}


// GET /customers/ 
// lista todos los clientes 
export async function customersAll(): Promise<{ items: CustomerDTO[]; total: number }> {
    const url = `${URL_BASE}/customers`;
    const res = await fetch(url, { method: "GET" });
    if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`HTTP ${res.status} ${res.statusText} — ${text}`);
    }
    return (await res.json()) as { items: CustomerDTO[]; total: number };
}

// GET /customers/:id
export async function customerGet(id: string) {
    return fetchJson<CustomerDTO>(`${URL_BASE}/customers/${encodeURIComponent(id)}`, {
        method: "GET",
    });
}

// POST /customers
export async function customerCreate(payload: CustomerCreatePayload) {
    return fetchJson(`${URL_BASE}/customers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });
}

// PATCH /customers/:id
export async function customerUpdate(id: string, patch: Partial<CustomerDTO> & { isActive?: boolean }) {
    // console.log("patch: ", JSON.stringify(patch))
    return fetchJson(`${URL_BASE}/customers/${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
    });
}

/* =============================================================================
 * Direcciones
 * ========================================================================== */

// GET /customers/:id/addresses
export async function customerAddressesGet(id: string) {
    return fetchJson<AddressDTO[]>(
        `${URL_BASE}/customers/${encodeURIComponent(id)}/addresses`,
        { method: "GET" }
    );
}

// PUT /customers/:id/addresses  (reemplazo/actualización masiva)
export async function customerAddressesPut(id: string, addresses: AddressDTO[]) {
    return fetchJson<AddressDTO[]>(
        `${URL_BASE}/customers/${encodeURIComponent(id)}/addresses`,
        {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(addresses),
        }
    );
}

// POST /customers/:id/addresses?onConflict=error|ignore|replace
export async function customerAddressCreate(
    id: string,
    address: Omit<AddressDTO, "CustomerId"> & { onConflict?: "error" | "ignore" | "replace" }
) {
    const { onConflict = "error", ...body } = address;
    const url = new URL(`${URL_BASE}/customers/${encodeURIComponent(id)}/addresses`);
    url.searchParams.set("onConflict", onConflict);
    return fetchJson<AddressDTO>(url.toString(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...body }),
    });
}

// DELETE /customers/:id/addresses/:addressCode
export async function customerAddressDelete(id: string, addressCode: string) {
    await fetchJson(
        `${URL_BASE}/customers/${encodeURIComponent(id)}/addresses/${encodeURIComponent(addressCode)}`,
        { method: "DELETE" }
    );
    return true;
}

/* =============================================================================
 * Contactos
 * ========================================================================== */

// PUT /customers/:id/contacts  (reemplazo/actualización masiva)
export async function customerContactsPut(id: string, contacts: ContactDTO[]) {
    return fetchJson<ContactDTO[]>(
        `${URL_BASE}/customers/${encodeURIComponent(id)}/contacts`,
        {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(contacts),
        }
    );
}

// POST /customers/:id/contacts  (crear uno)
export async function customerContactCreate(
    id: string,
    contact: Omit<ContactDTO, "CustomerId" | "CreatedAt" | "UpdatedAt">
) {
    return fetchJson<ContactDTO>(
        `${URL_BASE}/customers/${encodeURIComponent(id)}/contacts`,
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(contact),
        }
    );
}

// Trae TODAS las páginas de /customers/find acumulando resultados
export async function customersFindAll(params: {
    q: string;
    partnerType?: string;       // por defecto "C"
    pageSize?: number;          // override si el backend permite >100
    maxTotal?: number;          // guarda un límite de seguridad
}): Promise<{ items: CustomerDTO[]; total: number }> {
    const {
        q,
        partnerType = "C",
        pageSize = 100,           // muchos APIs capean a 100
        maxTotal = 5000,          // evita traer el universo
    } = params;

    let page = 1;
    const acc: CustomerDTO[] = [];

    while (acc.length < maxTotal) {
        const { items } = await customersFind({ q, page, pageSize, partnerType });
        const batch = Array.isArray(items) ? items : [];
        if (batch.length === 0) break;

        acc.push(...batch);

        // si el backend capea a 100, cuando devuelva < pageSize ya no hay más
        if (batch.length < pageSize) break;
        page += 1;
    }

    return { items: acc, total: acc.length };
}

// GET /customers?q=&page=&pageSize=&partnerType=
// - q: puede ser RUT (con o sin puntos/guión) o email/parte del email
// - page/pageSize: paginación server-side
// - partnerType: "C" | "P" | ... (opcional)
export async function customersAllPaged(params?: {
    q?: string;
    page?: number;
    pageSize?: number;
    partnerType?: string;
    signal?: AbortSignal;
    timeoutMs?: number;
}): Promise<{ items: CustomerDTO[]; total: number }> {
    type CustomersPagedResult = { items: CustomerDTO[]; total: number };
    const CACHE_TTL_MS = 5000;
    const g = globalThis as any;
    const cache: Map<string, { expiresAt: number; data: CustomersPagedResult }> =
        g.__customersAllPagedCache || (g.__customersAllPagedCache = new Map());
    const inflight: Map<string, Promise<CustomersPagedResult>> =
        g.__customersAllPagedInflight || (g.__customersAllPagedInflight = new Map());

    const { q = "", page = 1, pageSize = 20, partnerType, signal, timeoutMs = 12000 } = params || {};

    const qTrim = q.trim();
    const url = new URL(`${URL_BASE}/customers`);
    if (qTrim !== "") url.searchParams.set("q", qTrim);
    url.searchParams.set("page", String(page));
    url.searchParams.set("pageSize", String(pageSize));
    if (partnerType && partnerType !== "") url.searchParams.set("partnerType", partnerType);

    const finalUrl = url.toString().replace(/\+/g, "%20");

    const now = Date.now();
    const cached = cache.get(finalUrl);
    if (cached && cached.expiresAt > now) {
        return cached.data;
    }

    const pending = inflight.get(finalUrl);
    if (pending) {
        return pending;
    }

    const request = (async () => {
        const timeoutController = new AbortController();
        const onAbort = () => timeoutController.abort();
        if (signal) {
            if (signal.aborted) timeoutController.abort();
            else signal.addEventListener("abort", onAbort, { once: true });
        }

        const timeoutId = setTimeout(() => timeoutController.abort(), Math.max(1000, timeoutMs));
        let res: Response;
        try {
            res = await fetch(finalUrl, { method: "GET", signal: timeoutController.signal });
        } catch (err: any) {
            if (signal) signal.removeEventListener("abort", onAbort);
            clearTimeout(timeoutId);
            if (err?.name === "AbortError") {
                throw new Error("Timeout consultando clientes. Intenta con un filtro mas especifico.");
            }
            throw err;
        }

        if (signal) signal.removeEventListener("abort", onAbort);
        clearTimeout(timeoutId);

        if (!res.ok) {
            const text = await res.text().catch(() => "");
            throw new Error(`HTTP ${res.status} ${res.statusText} — ${text}`);
        }

        const json = await res.json();
        // Normalizamos a contrato { items, total }
        const items: CustomerDTO[] = Array.isArray(json) ? json : (json?.items ?? []);
        const total: number = Array.isArray(json) ? items.length : (json?.total ?? items.length);
        const data: CustomersPagedResult = { items, total };
        cache.set(finalUrl, { expiresAt: Date.now() + CACHE_TTL_MS, data });
        return data;
    })();

    inflight.set(finalUrl, request);
    try {
        return await request;
    } finally {
        inflight.delete(finalUrl);
    }
}


// Tipado único para crear/editar direcciones (POST /customers/:id/addresses)
export type CustomerAddressUpsert = {
    // requeridos por el backend
    addressCode: string;
    addressName: string;
    addressType: "B" | "S" | "O" | string;
    street: string;
    city: string;
    country: string;

    // opcionales
    customerId?: string;
    streetNo?: string;
    building?: string;
    block?: string;
    county?: string;
    state?: string;
    zipCode?: string;
    notes?: string;
    isActive?: boolean;
};

// POST /customers/:id/addresses  (crear/actualizar 1+ direcciones)
// Usa onConflict: "error" | "ignore" | "replace"
export async function customerAddressesPost(
    id: string,
    addresses: CustomerAddressUpsert[],
    onConflict: "error" | "ignore" | "replace" = "error"
) {
    const url = new URL(`${URL_BASE}/customers/${encodeURIComponent(id)}/addresses`);
    url.searchParams.set("onConflict", onConflict);
    return fetchJson(url.toString(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(addresses), // array en lowerCamelCase
    });
}

// ===== CONTACTOS =====

export type CustomerContactUpsert = {
    contactCode: string;
    name: string;
    position?: string;
    eMail: string;
    phone1?: string | null;
    phone2?: string | null;
    mobile?: string | null;
    remarks?: string | null;
    isActive?: boolean;
};

export async function customerContactsGet(id: string) {
    const url = `${URL_BASE}/customers/${encodeURIComponent(id)}/contacts`;
    return fetchJson(url, { method: "GET" });
}

export async function customerContactPost(id: string, payload: CustomerContactUpsert) {
    const url = `${URL_BASE}/customers/${encodeURIComponent(id)}/contacts`;
    return fetchJson(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });
}

export async function customerContactPut(id: string, payload: CustomerContactUpsert) {
    const url = `${URL_BASE}/customers/${encodeURIComponent(id)}/contacts`;
    return fetchJson(url, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });
}
