import React from "react";
import {
    customerCreate,
    customerUpdate,
    customerGet,
    customerAddressesGet,
    customerAddressesPut,
    type CustomerDTO,
    type CustomerCreatePayload,
} from "@/app/fetchWithAuth/api-clientes/clientes/customers";
import { useFetchWithAuth } from "@/lib/http/client";
import { SelectSearchInline } from "@/components/ui/collapsible/selectSearchInline";
import { ActionButton } from "@/components/ui/button/action-button";
import { CustomersFields, type CustomerRecord } from "@/features/customers/components/clientes/clientesFields";
import { cleanRut, computeDV, formatRut, isRutValid } from "@/features/customers/components/clientes/utils-rut";

type Mode = "create" | "edit";

type OptS = { label: string; value: string };

const createInitialRecord: CustomerRecord = {
    id: "",
    firstName: "",
    lastName: "",
    docType: "RUT",
    docNumber: "",
    mainEmail: "",
    phone: "",
    status: false,
    created: { name: "-", date: "-" },
    modified: { name: "-", date: "-" },
    isNew: true,
    partnerType: "C",
    groupCode: 100,
    groupNum: 1,
    payTermsGrpCode: 1,
    currency: "CLP",
    notes: "Particular",
    listNum: undefined as unknown as number,
    addressBilling: {
        code: "B1",
        name: "Facturacion",
        street: "",
        city: "",
        country: "CL",
        isActive: true,
    },
    addressShipping: {
        code: "S1",
        name: "Envio",
        street: "",
        city: "",
        country: "CL",
        isActive: true,
    },
    addressStreet: "",
    addressCity: "",
    addressCountry: "CL",
    addressActive: true,
};

// Helper para normalizar el id
function normalizeId(x?: string) {
    // elimina espacios/raros y mayusculiza
    return String(x ?? "").trim().replace(/\s+/g, "").toUpperCase();
}

// --- Dirección: normaliza a camelCase, acepta AddressXxx o addressXxx ---
function toCanonicalAddr(a: any) {
    return {
        addressCode: a?.addressCode ?? a?.AddressCode ?? "",
        addressName: a?.addressName ?? a?.AddressName ?? "",
        addressType: (a?.addressType ?? a?.AddressType ?? "").toUpperCase(),
        street: a?.street ?? a?.Street ?? "",
        city: a?.city ?? a?.City ?? "",
        country: a?.country ?? a?.Country ?? "",
        isActive: (a?.isActive ?? a?.IsActive ?? true) as boolean,
    };
}

function buildAddrFromState(
    type: "B" | "S",
    addressStreet: string,
    addressCity: string,
    addressCountry: string,
    addressActive: boolean
) {
    return {
        addressCode: type === "B" ? "B1" : "S1",
        addressName: type === "B" ? "Facturación" : "Envío",
        addressType: type,
        street: addressStreet || "",
        city: addressCity || "",
        country: addressCountry || "CL",
        isActive: Boolean(addressActive),
    };
}

function isEqual(a: any, b: any) {
    return JSON.stringify(a) === JSON.stringify(b);
}

// Snapshot desde el estado del modal (general + direcciones) para EDIT
function snapshotFromState(s: {
    rut: string;
    firstName: string;
    lastName: string;
    email: string;
    listNum: string;
    notes: string;
    partnerType: string;
    groupCode: string;
    groupNum: string;
    payTermsGrpCode: string;
    currency: string;
    addressStreet: string;
    addressCity: string;
    addressCountry: string;
    addressActive: boolean;
}) {
    const general = {
        // PATCH en camelCase (coherente con create)
        rut: s.rut,
        firstName: s.firstName,
        lastName: s.lastName,
        email: s.email || undefined,
        isActive: true, // si no quieres tocar estado, quítalo
        groupCode: Number(s.groupCode) || 100,
        groupNum: Number(s.groupNum) || 1,
        PayTermsGrpCode: Number(s.payTermsGrpCode) || 1,
        currency: s.currency || "CLP",
        notes: s.notes || undefined,
        listNum: s.listNum ? Number(s.listNum) : undefined,
        partnerType: s.partnerType || "C",
    };

    const B = buildAddrFromState("B", s.addressStreet, s.addressCity, s.addressCountry, s.addressActive);
    const S = buildAddrFromState("S", s.addressStreet, s.addressCity, s.addressCountry, s.addressActive);
    return { general, addresses: [B, S] };
}

// Devuelve solo campos cambiados y definidos
function pickChangedFields(prev: Record<string, any> | null, curr: Record<string, any>) {
    if (!prev) {
        const out: Record<string, any> = {};
        Object.keys(curr).forEach(k => {
            const v = (curr as any)[k];
            if (v !== undefined) out[k] = v;
        });
        return out;
    }
    const out: Record<string, any> = {};
    Object.keys(curr).forEach(k => {
        const cv = (curr as any)[k];
        const pv = (prev as any)[k];
        if (!isEqual(cv, pv) && cv !== undefined) {
            out[k] = cv;
        }
    });
    return out;
}

// Diff de direcciones en camelCase
function pickChangedAddresses(prev: any[] | null, curr: any[]) {
    const prevCanon = (prev ?? []).map(toCanonicalAddr);
    const currCanon = (curr ?? []).map(toCanonicalAddr);

    const byCode = (arr: any[], code: string) =>
        arr.find(a => (a.addressCode ?? "").toUpperCase() === code.toUpperCase());
    const byType = (arr: any[], t: "B" | "S") =>
        arr.find(a => (a.addressType ?? "").toUpperCase() === t);

    const Bprev = byCode(prevCanon, "B1") || byType(prevCanon, "B");
    const Sprev = byCode(prevCanon, "S1") || byType(prevCanon, "S");
    const Bcurr = byCode(currCanon, "B1") || byType(currCanon, "B");
    const Scurr = byCode(currCanon, "S1") || byType(currCanon, "S");

    const changed: any[] = [];
    if (!isEqual(Bprev, Bcurr) && Bcurr) changed.push(Bcurr);
    if (!isEqual(Sprev, Scurr) && Scurr) changed.push(Scurr);
    return changed;
}

// por si el GET tarda un poquito 
async function getWithRetry(id: string, tries = 2) {
    let lastErr: any;
    for (let i = 0; i < tries; i++) {
        try { return await customerGet(id); } catch (e) { lastErr = e; }
    }
    throw lastErr;
}


export function CustomerUpsertModal({
    open,
    mode,
    customerId,
    onClose,
    onSaved,
}: {
    open: boolean;
    mode: Mode;
    customerId?: string;           // requerido si mode === "edit"
    onClose: () => void;
    onSaved: (dto: CustomerDTO) => void;
}) {
    const { fetchWithAuth } = useFetchWithAuth();

    const [loading, setLoading] = React.useState(false);
    const [saving, setSaving] = React.useState(false);
    // baseline para diffs en modo edición
    const lastSavedRef = React.useRef<{ general: any; addresses: any[] } | null>(null);

    const [createRecord, setCreateRecord] = React.useState<CustomerRecord>({ ...createInitialRecord });
    const [createFieldErrors, setCreateFieldErrors] = React.useState<Partial<Record<keyof CustomerRecord, string>>>({});
    const [createTouched, setCreateTouched] = React.useState<Partial<Record<keyof CustomerRecord, boolean>>>({});
    const [createSubmitted, setCreateSubmitted] = React.useState(false);
    const [createRutError, setCreateRutError] = React.useState<string | null>(null);

    // Básicos
    const [rut, setRut] = React.useState("");
    const [firstName, setFirstName] = React.useState("");
    const [lastName, setLastName] = React.useState("");
    const [email, setEmail] = React.useState("");

    // Comerciales fijos
    const [partnerType, setPartnerType] = React.useState("C");
    const [groupCode, setGroupCode] = React.useState("100");
    const [groupNum, setGroupNum] = React.useState("1");
    const [payTermsGrpCode, setPayTermsGrpCode] = React.useState("1");
    const [currency, setCurrency] = React.useState("CLP");
    const [notes, setNotes] = React.useState("Particular"); // "Giros"

    // Listas (desde API) — SelectSearchInline exige strings
    const [listNum, setListNum] = React.useState<string>(""); // ej: "2"
    const [plOpts, setPlOpts] = React.useState<OptS[]>([{ label: "Seleccione lista…", value: "" }]);
    const [plSearch, setPlSearch] = React.useState("");
    const [plLoading, setPlLoading] = React.useState(false);

    // Dirección común (se duplica en B/S)
    const [addressStreet, setAddressStreet] = React.useState("");
    const [addressCity, setAddressCity] = React.useState("");
    const [addressCountry, setAddressCountry] = React.useState("CL");
    const [addressActive, setAddressActive] = React.useState(true);

    // helper para limpiar el formulario
    const clearForm = React.useCallback(() => {
        setRut("");
        setFirstName("");
        setLastName("");
        setEmail("");
        setPartnerType("C");
        setGroupCode("100");
        setGroupNum("1");
        setPayTermsGrpCode("1");
        setCurrency("CLP");
        setNotes("Particular");
        setListNum("");
        setAddressStreet("");
        setAddressCity("");
        setAddressCountry("CL");
        setAddressActive(true);
    }, []);

    // Cargar listas de precios
    React.useEffect(() => {
        if (!open) return;
        let mounted = true;
        (async () => {
            try {
                setPlLoading(true);
                const res = await fetchWithAuth<any>("catalog/price-lists?page=1&pageSize=100");
                const rows = Array.isArray(res?.data) ? res.data : [];
                const opts: OptS[] = [{ label: "Seleccione lista…", value: "" }].concat(
                    rows.map((r: any) => ({
                        label: `Lista ${r?.ListNum ?? ""}`, // T1->Lista 1, T2->Lista 2, etc.
                        value: String(r?.ListNum ?? ""),
                    }))
                );
                if (mounted) setPlOpts(opts);
            } catch (e) {
                console.error("No se pudo cargar price-lists:", e);
                if (mounted) setPlOpts([{ label: "Seleccione lista…", value: "" }]);
            } finally {
                if (mounted) setPlLoading(false);
            }
        })();
        return () => { mounted = false; };
    }, [open, fetchWithAuth]);

    // Limpiar al entrar en "create"
    React.useEffect(() => {
        if (!open) return;
        if (mode === "create") {
            setLoading(false);
            clearForm();
            setCreateRecord({ ...createInitialRecord });
            setCreateFieldErrors({});
            setCreateTouched({});
            setCreateSubmitted(false);
            setCreateRutError(null);
        }
    }, [open, mode, clearForm]);

    const createRequiredFields: (keyof CustomerRecord)[] = [
        "firstName",
        "lastName",
        "docType",
        "docNumber",
        "phone",
    ];

    function validateCreateRequired(rec: CustomerRecord) {
        const errs: Partial<Record<keyof CustomerRecord, string>> = {};
        for (const key of createRequiredFields) {
            const val = rec[key];
            const isEmpty = val == null || (typeof val === "string" && !val.trim());
            if (isEmpty) errs[key] = "Este campo es requerido";
        }
        if (!(typeof rec.listNum === "number" && Number.isFinite(rec.listNum))) {
            errs.listNum = "Selecciona una lista de precios";
        }
        return errs;
    }

    const handleCreateChange = React.useCallback(
        <K extends keyof CustomerRecord>(field: K, value: CustomerRecord[K]) => {
            setCreateTouched((prev) => ({ ...prev, [field]: true }));
            setCreateRecord((prev) => ({ ...prev, [field]: value }));

            if (field === "docNumber") {
                const raw = String(value ?? "");
                if (!raw.trim()) {
                    setCreateFieldErrors((prev) => ({ ...prev, docNumber: "Este campo es requerido" }));
                    setCreateRutError("RUT requerido");
                    return;
                }
                const ok = isRutValid(formatRut(raw));
                setCreateRutError(ok ? null : "RUT invalido");
                setCreateFieldErrors((prev) => {
                    const next = { ...prev };
                    if (!ok) next.docNumber = "RUT invalido";
                    else delete next.docNumber;
                    return next;
                });
                return;
            }

            if (createRequiredFields.includes(field)) {
                const asStr = typeof value === "string" ? value : String(value ?? "");
                setCreateFieldErrors((prev) => {
                    const next = { ...prev };
                    if (!asStr.trim()) next[field] = "Este campo es requerido";
                    else delete next[field];
                    return next;
                });
            }
        },
        []
    );

    const createErrorsForUI = React.useMemo(() => {
        const out: Partial<Record<keyof CustomerRecord, string>> = {};
        (Object.keys(createFieldErrors) as (keyof CustomerRecord)[]).forEach((k) => {
            if (createSubmitted || createTouched[k]) out[k] = createFieldErrors[k];
        });
        return out;
    }, [createFieldErrors, createSubmitted, createTouched]);

    // Cargar datos cuando es edición
    React.useEffect(() => {
        let mounted = true;
        (async () => {
            if (!open || mode !== "edit" || !customerId) return;
            setLoading(true);
            try {
                const dto = await customerGet(customerId); // GET /customers/:id
                if (!mounted) return;

                setRut(dto.RUT || "");
                setFirstName(dto.FirstName || "");
                setLastName(dto.LastName || "");
                setEmail(dto.Email || "");
                setListNum(typeof dto.ListNum === "number" ? String(dto.ListNum) : "");
                setNotes((dto as any)?.Notes ?? "Particular");
                // Puedes mapear más campos si tu backend los devuelve en GET

                // === Cargar direcciones y normalizar a camelCase ===
                try {
                    const addrs = await customerAddressesGet(customerId);
                    const canon = (addrs ?? []).map(toCanonicalAddr);
                    const b = canon.find((a: { addressType: string; }) => a.addressType === "B") || canon.find((a: { addressCode: any; }) => (a.addressCode ?? "").toUpperCase() === "B1");
                    const s = canon.find((a: { addressType: string; }) => a.addressType === "S") || canon.find((a: { addressCode: any; }) => (a.addressCode ?? "").toUpperCase() === "S1");

                    const street = b?.street ?? s?.street ?? "";
                    const city = b?.city ?? s?.city ?? "";
                    const country = b?.country ?? s?.country ?? "CL";
                    const active = (b?.isActive ?? s?.isActive ?? true) as boolean;

                    setAddressStreet(street);
                    setAddressCity(city);
                    setAddressCountry(country);
                    setAddressActive(Boolean(active));

                    // === Baseline inicial calculado desde DTO + direcciones ===
                    const baseline = {
                        general: {
                            rut: dto.RUT || "",
                            firstName: dto.FirstName || "",
                            lastName: dto.LastName || "",
                            email: dto.Email || "",
                            isActive: dto.IsActive ?? true,
                            groupCode: dto.GroupCode ?? 100,
                            groupNum: dto.GroupNum ?? 1,
                            PayTermsGrpCode: (dto as any)?.PayTermsGrpCode ?? 1,
                            currency: dto.Currency ?? "CLP",
                            notes: (dto as any)?.Notes ?? undefined,
                            listNum: typeof dto.ListNum === "number" ? dto.ListNum : undefined,
                            partnerType: (dto as any)?.PartnerType ?? "C",
                        },
                        addresses: [
                            b ?? { addressCode: "B1", addressName: "Facturación", addressType: "B", street, city, country, isActive: active },
                            s ?? { addressCode: "S1", addressName: "Envío", addressType: "S", street, city, country, isActive: active },
                        ],
                    };
                    lastSavedRef.current = baseline;
                } catch (e) {
                    console.error("No se pudieron cargar direcciones:", e);
                    // baseline sin direcciones explícitas
                    lastSavedRef.current = {
                        general: {
                            rut: dto.RUT || "",
                            firstName: dto.FirstName || "",
                            lastName: dto.LastName || "",
                            email: dto.Email || "",
                            isActive: dto.IsActive ?? true,
                            groupCode: dto.GroupCode ?? 100,
                            groupNum: dto.GroupNum ?? 1,
                            PayTermsGrpCode: (dto as any)?.PayTermsGrpCode ?? 1,
                            currency: dto.Currency ?? "CLP",
                            notes: (dto as any)?.Notes ?? undefined,
                            listNum: typeof dto.ListNum === "number" ? dto.ListNum : undefined,
                            partnerType: (dto as any)?.PartnerType ?? "C",
                        },
                        addresses: [],
                    };
                }


                // === Inicializar baseline de edición ===
                lastSavedRef.current = snapshotFromState({
                    rut, firstName, lastName, email,
                    listNum, notes,
                    partnerType, groupCode, groupNum, payTermsGrpCode, currency,
                    addressStreet, addressCity, addressCountry, addressActive
                });
            } catch (e) {
                console.error("Error cargando cliente:", e);
            } finally {
                if (mounted) setLoading(false);
            }
        })();
        return () => { mounted = false; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, mode, customerId]);

    React.useEffect(() => {
        if (!open || mode !== "edit" || !customerId) return;
        // baseline cuando todos los states ya están seteados
        lastSavedRef.current = snapshotFromState({
            rut, firstName, lastName, email,
            listNum, notes,
            partnerType, groupCode, groupNum, payTermsGrpCode, currency,
            addressStreet, addressCity, addressCountry, addressActive
        });
         
    }, [open, mode, customerId, rut, firstName, lastName, email, listNum, notes, partnerType, groupCode, groupNum, payTermsGrpCode, currency, addressStreet, addressCity, addressCountry, addressActive]);

    const deriveIdFromRut = (rutStr: string) => {
        const { base } = cleanRut(rutStr || "");
        return base ? `${base}C` : "";
    };

    const handleSave = async () => {
        if (saving) return;
        setSaving(true);
        try {
            if (mode === "create") {
                const rec = createRecord;
                setCreateSubmitted(true);

                const reqErrs = validateCreateRequired(rec);
                if (!rec.docNumber || !isRutValid(formatRut(rec.docNumber))) {
                    reqErrs.docNumber = reqErrs.docNumber || "RUT invalido";
                    setCreateRutError("RUT invalido");
                } else {
                    setCreateRutError(null);
                }

                if (Object.keys(reqErrs).length > 0) {
                    setCreateFieldErrors(reqErrs);
                    alert("Revisa los campos requeridos antes de guardar.");
                    setSaving(false);
                    return;
                }

                const id = normalizeId(String(rec.id || deriveIdFromRut(rec.docNumber)));
                if (!id) {
                    setCreateFieldErrors((prev) => ({ ...prev, docNumber: "Este campo es requerido" }));
                    alert("ID del cliente no valido.");
                    setSaving(false);
                    return;
                }

                const street = rec.addressStreet || rec.addressBilling?.street || rec.addressShipping?.street || "";
                const city = rec.addressCity || rec.addressBilling?.city || rec.addressShipping?.city || "";
                const country = rec.addressCountry || rec.addressBilling?.country || rec.addressShipping?.country || "CL";
                const active = Boolean(rec.addressActive ?? true);

                const { base: rutBase, dv: rutDv } = cleanRut(rec.docNumber || "");
                const rutFmt = rutBase ? `${rutBase}-${rutDv || computeDV(rutBase)}` : undefined;

                const payload: CustomerCreatePayload = {
                    id,
                    partnerType: rec.partnerType || "C",
                    rut: rutFmt,
                    firstName: rec.firstName,
                    lastName: rec.lastName,
                    email: rec.mainEmail || undefined,
                    groupCode: rec.groupCode ?? 100,
                    groupNum: rec.groupNum ?? 1,
                    PayTermsGrpCode: rec.payTermsGrpCode ?? 1,
                    currency: rec.currency || "CLP",
                    notes: rec.notes || "Particular",
                    listNum: rec.listNum,
                    addresses: [
                        { addressCode: "B1", addressName: "Facturación", addressType: "B", street, city, country, isActive: active },
                        { addressCode: "S1", addressName: "Envío", addressType: "S", street, city, country, isActive: active },
                    ],
                };

                const res = await customerCreate(payload);

                // Asegurar SIEMPRE un DTO para el padre (aunque el GET falle)
                const ret: any = res || {};
                const returnedId = normalizeId(ret.Id ?? ret.id ?? payload.id);

                let dto: CustomerDTO | null = null;
                try {
                    dto = await getWithRetry(returnedId); // o usa: await customerGet(returnedId)
                } catch {
                    // Fallback armado con lo que tenemos (sincrónico, evita undefined)
                    dto = {
                        Id: returnedId,
                        FirstName: ret.FirstName ?? ret.firstName ?? payload.firstName,
                        LastName: ret.LastName ?? ret.lastName ?? payload.lastName,
                        Email: ret.Email ?? ret.email ?? (payload.email ?? ""),
                        ListNum: ret.ListNum ?? ret.listNum ?? payload.listNum,
                        IsActive: true,
                        RUT: ret.RUT ?? ret.rut ?? (payload.rut ?? ""),
                        GroupCode: ret.GroupCode ?? ret.groupCode ?? payload.groupCode,
                        GroupNum: ret.GroupNum ?? ret.groupNum ?? payload.groupNum,
                        Currency: ret.Currency ?? ret.currency ?? payload.currency,
                    } as any;
                }

                onSaved(dto!);
                onClose();

            } else {
                if (!customerId) {
                    alert("Falta customerId para editar.");
                    setSaving(false);
                    return;
                }

                // 1) Snapshot actual del form
                const curr = snapshotFromState({
                    rut, firstName, lastName, email,
                    listNum, notes,
                    partnerType, groupCode, groupNum, payTermsGrpCode, currency,
                    addressStreet, addressCity, addressCountry, addressActive
                });
                const prev = lastSavedRef.current;

                // 2) PATCH parcial camelCase
                const patchPayload = pickChangedFields(prev?.general ?? null, curr.general);
                if (Object.keys(patchPayload).length > 0) {
                    await customerUpdate(customerId, patchPayload);
                }

                // 3) PUT direcciones solo si cambiaron (una por request)
                const changedAddrs = pickChangedAddresses(prev?.addresses ?? null, curr.addresses);
                for (const addr of changedAddrs) {
                    await customerAddressesPut(customerId, addr);
                }

                // 4) Refrescar DTO y cerrar
                const dto = await customerGet(customerId);
                onSaved(dto);
                onClose();

                // 5) baseline actualizado
                lastSavedRef.current = curr;
            }


        } catch (e) {
            console.error("No se pudo guardar cliente:", e);
            alert("No se pudo guardar el cliente. Inténtalo nuevamente.");
        } finally {
            setSaving(false);
        }
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-6xl max-h-[92vh] rounded-2xl bg-white shadow-xl outline-none flex flex-col">
                {/* Header */}
                <div className="px-6 py-4 border-b">
                    <h3 className="text-base font-semibold">
                        {mode === "create" ? "Nuevo cliente" : "Editar cliente"}
                    </h3>
                </div>

                {/* Body (campos necesarios) */}
                <div className="px-6 py-6 overflow-y-auto">
                    {loading ? (
                        <p className="text-sm text-gray-600">Cargando…</p>
                    ) : (
                        mode === "create" ? (
                            <CustomersFields
                                record={createRecord}
                                readOnly={false}
                                onChange={handleCreateChange}
                                rutError={createSubmitted || createTouched.docNumber ? createRutError : null}
                                errors={createErrorsForUI}
                                hideAuditCards
                            />
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Columna izquierda: básicos + dirección */}
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-sm text-gray-600 font-semibold">Nombre</label>
                                        <input
                                            className="w-full border-b border-gray-300 text-sm outline-none"
                                            value={firstName}
                                            onChange={(e) => setFirstName(e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm text-gray-600 font-semibold">Apellido</label>
                                        <input
                                            className="w-full border-b border-gray-300 text-sm outline-none"
                                            value={lastName}
                                            onChange={(e) => setLastName(e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm text-gray-600 font-semibold">Documento (RUT)</label>
                                        <input
                                            className="w-full border-b border-gray-300 text-sm outline-none"
                                            value={rut}
                                            onChange={(e) => setRut(e.target.value)}
                                            placeholder="12345678-9"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm text-gray-600 font-semibold">Email</label>
                                        <input
                                            className="w-full border-b border-gray-300 text-sm outline-none"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            type="email"
                                        />
                                    </div>

                                    {/* Dirección común (se replica en B/S) */}
                                    <div className="pt-2">
                                        <p className="text-sm font-semibold text-gray-800">Dirección</p>
                                        <div className="mt-2 space-y-3">
                                            <div>
                                                <label className="text-xs text-gray-600">Calle</label>
                                                <input
                                                    className="w-full border-b border-gray-300 text-sm outline-none"
                                                    value={addressStreet}
                                                    onChange={(e) => setAddressStreet(e.target.value)}
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs text-gray-600">Ciudad</label>
                                                <input
                                                    className="w-full border-b border-gray-300 text-sm outline-none"
                                                    value={addressCity}
                                                    onChange={(e) => setAddressCity(e.target.value)}
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs text-gray-600">País</label>
                                                <input
                                                    className="w-full border-b border-gray-300 text-sm outline-none"
                                                    value={addressCountry}
                                                    onChange={(e) => setAddressCountry(e.target.value)}
                                                />
                                            </div>
                                            <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                                                <input
                                                    type="checkbox"
                                                    checked={addressActive}
                                                    onChange={(e) => setAddressActive(e.target.checked)}
                                                />
                                                <span>Activa (aplica a Facturación y Envío)</span>
                                            </label>
                                        </div>
                                    </div>
                                </div>

                                {/* Columna derecha: comerciales + listas */}
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-sm text-gray-600 font-semibold">Tipo de socio</label>
                                        <select
                                            className="w-full border-b border-gray-300 text-sm outline-none bg-transparent"
                                            value={partnerType}
                                            onChange={(e) => setPartnerType(e.target.value)}
                                        >
                                            <option value="C">C</option>
                                        </select>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-sm text-gray-600 font-semibold">Group Code</label>
                                            <select
                                                className="w-full border-b border-gray-300 text-sm outline-none bg-transparent"
                                                value={groupCode}
                                                onChange={(e) => setGroupCode(e.target.value)}
                                            >
                                                <option value="100">100</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-sm text-gray-600 font-semibold">Group Num</label>
                                            <select
                                                className="w-full border-b border-gray-300 text-sm outline-none bg-transparent"
                                                value={groupNum}
                                                onChange={(e) => setGroupNum(e.target.value)}
                                            >
                                                <option value="1">1</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-sm text-gray-600 font-semibold">Plazo de pago</label>
                                            <select
                                                className="w-full border-b border-gray-300 text-sm outline-none bg-transparent"
                                                value={payTermsGrpCode}
                                                onChange={(e) => setPayTermsGrpCode(e.target.value)}
                                            >
                                                <option value="1">1</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-sm text-gray-600 font-semibold">Moneda</label>
                                            <select
                                                className="w-full border-b border-gray-300 text-sm outline-none bg-transparent"
                                                value={currency}
                                                onChange={(e) => setCurrency(e.target.value)}
                                            >
                                                <option value="CLP">CLP</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-sm text-gray-600 font-semibold">Giros</label>
                                        <select
                                            className="w-full border-b border-gray-300 text-sm outline-none bg-transparent"
                                            value={notes}
                                            onChange={(e) => setNotes(e.target.value)}
                                        >
                                            <option value="Particular">Particular</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="text-sm text-gray-600 font-semibold">Lista de precios</label>
                                        <SelectSearchInline
                                            id="listNum"
                                            label=""
                                            value={listNum}
                                            options={plOpts}
                                            searchQuery={plSearch}
                                            loading={plLoading}
                                            onSearch={setPlSearch}
                                            onChange={(v) => setListNum(v)}
                                            placeholderFromDefault
                                        />
                                    </div>
                                </div>
                            </div>
                        )
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t flex flex-col sm:flex-row gap-2 justify-end">
                    <ActionButton variant="secondary" onClick={onClose}>Cancelar</ActionButton>

                    {/* {mode === "create" ? (
                        <ActionButton variant="error" onClick={clearForm}>Vaciar formulario</ActionButton>
                    ) : (
                        <ActionButton variant="error" onClick={openDeleteModal}>Eliminar</ActionButton>
                    )} */}

                    <ActionButton
                        variant="primary"
                        onClick={handleSave}
                        disabled={
                            saving ||
                            (mode === "create"
                                ? !createRecord.docNumber || !createRecord.firstName || !createRecord.lastName || !(typeof createRecord.listNum === "number" && Number.isFinite(createRecord.listNum))
                                : !rut || !firstName || !lastName)
                        }
                    >
                        Guardar
                    </ActionButton>
                </div>
            </div>
        </div>
    );
}

function ConfirmDialog({
    open,
    title = "Confirmar",
    message,
    confirmText = "Confirmar",
    cancelText = "Cancelar",
    onConfirm,
    onCancel,
}: {
    open: boolean;
    title?: string;
    message: string | React.ReactNode;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
    onCancel: () => void;
}) {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
            <div className="relative z-10 w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
                <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
                <div className="mt-3 text-sm text-gray-700">{message}</div>
                <div className="mt-6 flex justify-end gap-3">
                    <button
                        type="button"
                        className="rounded-xl border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        onClick={onCancel}
                    >
                        {cancelText}
                    </button>
                    <button
                        type="button"
                        className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
                        onClick={onConfirm}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}
