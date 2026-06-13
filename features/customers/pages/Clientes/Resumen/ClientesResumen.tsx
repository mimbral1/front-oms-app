// views\Customers\Clientes\Resumen\Resumen.tsx
"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";
import type { Action, PageHeaderProps } from "@/components/layout/page-header";
import { CheckCircleIcon, XCircleIcon, ArrowPathIcon } from "@heroicons/react/24/outline";
import SaveOutlined from "@mui/icons-material/SaveOutlined";
import { CustomersFields, CustomerRecord } from "@/features/customers/components/clientes/clientesFields";
import {
  customerGet,
  customerUpdate,
  type CustomerDTO,
  customerAddressesGet,
  customerAddressesPut,
  customerAddressDelete
} from "@/app/fetchWithAuth/api-clientes/clientes/customers";
import { isRutValid, formatRut } from "@/features/customers/components/clientes/utils-rut";
import { useSWRConfig } from "swr";
import { toast } from "react-hot-toast";

// para manejar errores en los campos vacios 
type FieldErrors = Partial<Record<keyof CustomerRecord, string>>;

/* ================================
 * Mapeo API -> UI
 * ================================ */
function mapDtoToRecord(dto: CustomerDTO): CustomerRecord {
  const street = dto.Address ?? "";
  const city = dto.City ?? "";
  const country = dto.Country ?? "CL";

  return {
    id: dto.Id,
    firstName: dto.FirstName ?? "",
    lastName: dto.LastName ?? "",
    docType: "RUT",
    docNumber: dto.RUT ?? "",
    mainEmail: dto.Email ?? "",
    phone: dto.Phone ?? "",
    status: dto.IsActive,
    created: {
      name: "—",
      date: dto.CreatedAt ? new Date(dto.CreatedAt).toLocaleString("es-CL") : "—",
    },
    modified: {
      name: "—",
      date: dto.UpdatedAt ? new Date(dto.UpdatedAt).toLocaleString("es-CL") : "—",
    },

    // comerciales / precios (si vienen, sinó defaults visuales)
    partnerType: (dto as any).PartnerType ?? "C",
    groupCode: dto.GroupCode ?? 100,
    groupNum: dto.GroupNum ?? 1,
    payTermsGrpCode: (dto as any).PayTermsGrpCode ?? 1, // si el backend lo retorna
    currency: dto.Currency ?? "CLP",
    notes: (dto as any).Notes ?? "Particular",
    listNum: dto.ListNum ?? (undefined as unknown as number),

    // direcciones: defaults seguros (duplicadas en UI)
    addressBilling: {
      code: "B1",
      name: "Facturación",
      street,
      city,
      country,
      isActive: true,
    },
    addressShipping: {
      code: "S1",
      name: "Envío",
      street,
      city,
      country,
      isActive: true,
    },
    addressStreet: street,
    addressCity: city,
    addressCountry: country,
    addressActive: true,
  };
}

// === Helpers: snapshot y diffs ===
function snapshotFromRecord(r: CustomerRecord) {
  const general = {
    // >>> llaves en minúsculas para PATCH <<<
    firstName: r.firstName || "",
    lastName: r.lastName || "",
    email: r.mainEmail || "",
    phone: r.phone || "",
    rut: r.docNumber || "",
    isActive: r.status || "",
    groupCode: r.groupCode || "",
    groupNum: r.groupNum || "",
    currency: r.currency || "",
    listNum: r.listNum || "",
    notes: r.notes || "",
    PayTermsGrpCode: r.payTermsGrpCode || "",
    partnerType: r.partnerType || "C",
  };

  const street = r.addressStreet || r.addressBilling.street || r.addressShipping.street || "";
  const city = r.addressCity || r.addressBilling.city || r.addressShipping.city || "";
  const country = r.addressCountry || r.addressBilling.country || r.addressShipping.country || "CL";
  const active = Boolean(r.addressActive ?? r.addressBilling.isActive ?? r.addressShipping.isActive ?? true);

  const B = {
    // Las direcciones se mantienen en PascalCase porque tu cliente las define así
    CustomerId: r.id,
    AddressCode: r.addressBilling.code || "B1",
    AddressName: r.addressBilling.name || "Facturación",
    AddressType: "B",
    Street: street,
    City: city,
    Country: country,
    IsActive: active,
  };
  const S = {
    CustomerId: r.id,
    AddressCode: r.addressShipping.code || "S1",
    AddressName: r.addressShipping.name || "Envío",
    AddressType: "S",
    Street: street,
    City: city,
    Country: country,
    IsActive: active,
  };

  return { general, addresses: [B, S] };
}


function isEqual(a: any, b: any) {
  return JSON.stringify(a) === JSON.stringify(b);
}

function pickChangedFields(prev: Record<string, any> | null, curr: Record<string, any>) {
  if (!prev) {
    // primera vez: devuelve todo lo "definido"
    const out: Record<string, any> = {};
    Object.keys(curr).forEach(k => {
      const v = (curr as any)[k];
      if (v !== undefined && v !== null) out[k] = v;
    });
    return out;
  }
  const out: Record<string, any> = {};
  Object.keys(curr).forEach(k => {
    const cv = (curr as any)[k];
    const pv = (prev as any)[k];
    // solo si cambió y el valor es definido 
    if (!isEqual(cv, pv) && cv !== undefined && cv !== null) {
      out[k] = cv;
    }
  });
  return out;
}

function pickChangedAddresses(prev: any[] | null, curr: any[]) {
  // Normaliza ambas listas a camelCase
  const prevCanon = (prev ?? []).map(toCanonicalAddr);
  const currCanon = (curr ?? []).map(toCanonicalAddr);

  // helper para buscar por addressCode o por tipo
  const byCode = (arr: any[], code: string) =>
    arr.find(a => (a.addressCode ?? "").toUpperCase() === code.toUpperCase());
  const byType = (arr: any[], type: "B" | "S") =>
    arr.find(a => (a.addressType ?? "").toUpperCase() === type);

  const Bprev = byCode(prevCanon, "B1") || byType(prevCanon, "B");
  const Sprev = byCode(prevCanon, "S1") || byType(prevCanon, "S");
  const Bcurr = byCode(currCanon, "B1") || byType(currCanon, "B");
  const Scurr = byCode(currCanon, "S1") || byType(currCanon, "S");

  const changed: any[] = [];
  if (!isEqual(Bprev, Bcurr) && Bcurr) changed.push(Bcurr);
  if (!isEqual(Sprev, Scurr) && Scurr) changed.push(Scurr);

  // Devuelve camelCase listo para PUT
  return changed;
}

// --- Helpers para normalizar direcciones ---
// Acepta AddressXxx o addressXxx y devuelve SIEMPRE camelCase
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

// Construye una dirección camelCase desde tu record + tipo ("B" o "S")
function buildServerAddrFromRecord(r: CustomerRecord, type: "B" | "S") {
  const street = r.addressStreet || r.addressBilling.street || r.addressShipping.street || "";
  const city = r.addressCity || r.addressBilling.city || r.addressShipping.city || "";
  const country = r.addressCountry || r.addressBilling.country || r.addressShipping.country || "CL";
  const active = Boolean(r.addressActive ?? r.addressBilling.isActive ?? r.addressShipping.isActive ?? true);

  const base = {
    addressCode: type === "B" ? (r.addressBilling.code || "B1") : (r.addressShipping.code || "S1"),
    addressName: type === "B" ? (r.addressBilling.name || "Facturación") : (r.addressShipping.name || "Envío"),
    addressType: type,
    street,
    city,
    country,
    isActive: active,
  };
  return base;
}




/* ================================
 * Página
 * ================================ */
export default function CustomerResumenView() {

  // para conseguir datos del resumen para el page header 
  const { mutate } = useSWRConfig();

  const router = useRouter();
  const { id } = useParams();
  if (!id) throw new Error("ID de cliente no especificado en la ruta");
  const recordId: string = Array.isArray(id) ? id[0] : id;

  const [record, setRecord] = useState<CustomerRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);



  // para manejar errores de campos vacios 
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  // define qué campos son requeridos
  const REQUIRED_FIELDS: (keyof CustomerRecord)[] = [
    "firstName",
    "lastName",
    "docType",
    "docNumber",
    "phone",
  ];

  // Valida campos en blanco antes de enviar
  function validateBeforeSave(rec: CustomerRecord): FieldErrors {
    const errs: FieldErrors = {};
    for (const k of REQUIRED_FIELDS) {
      const v = (rec[k] ?? "") as unknown as string;
      if (typeof v === "string" && !v.trim()) {
        errs[k] = "Este campo es requerido";
      }
    }
    return errs;
  }

  // Mapea posibles errores del backend a nuestros nombres de campo
  function mapApiErrorsToFields(err: any): FieldErrors {
    const out: FieldErrors = {};
    const errors = err?.response?.data?.errors ?? err?.errors ?? null;
    if (errors && typeof errors === "object") {
      for (const rawKey of Object.keys(errors)) {
        const key =
          ({
            apellido: "lastName",
            last_name: "lastName",
            firstname: "firstName",
            first_name: "firstName",
            email: "mainEmail",
            rut: "docNumber",
          } as Record<string, keyof CustomerRecord>)[rawKey] ?? (rawKey as keyof CustomerRecord);
        out[key] = String(errors[rawKey] ?? "Dato inválido");
      }
    }
    return out;
  }

  // estados para error de rut
  const [rutError, setRutError] = useState<string | null>(null);

  const recordRef = useRef(record);
  useEffect(() => {
    recordRef.current = record;
  }, [record]);

  useEffect(() => {
    // Inicializa baseline cuando ya cargó y hay record, solo una vez
    if (!loading && record && !lastSavedRef.current) {
      lastSavedRef.current = snapshotFromRecord(record);
    }
  }, [loading, record]);

  // para gestionar cambios de campos o direcciones
  const lastSavedRef = useRef<{ general: any; addresses: any[] } | null>(null);

  // cargar detalle
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        // efecto donde se hace customerGet(recordId)
        const dto = await customerGet(recordId); // GET /customers/:id 
        // inmediatamente después para sembrar cache de SWR:
        mutate(`customers/${recordId}`, dto, { revalidate: false });
        if (!mounted) return;
        setRecord(mapDtoToRecord(dto));

        try {
          const addrs = await customerAddressesGet(recordId);
          // normalizamos a camelCase
          const canon = (addrs ?? []).map(toCanonicalAddr);
          const b = canon.find((a: { addressType: string; }) => a.addressType === "B") || canon.find((a: { addressCode: any; }) => (a.addressCode ?? "").toUpperCase() === "B1");
          const s = canon.find((a: { addressType: string; }) => a.addressType === "S") || canon.find((a: { addressCode: any; }) => (a.addressCode ?? "").toUpperCase() === "S1");

          if (mounted) {
            setRecord(prev => {
              if (!prev) return prev;

              const street = b?.street ?? s?.street ?? prev.addressBilling.street ?? "";
              const city = b?.city ?? s?.city ?? prev.addressBilling.city ?? "";
              const country = b?.country ?? s?.country ?? prev.addressBilling.country ?? "CL";
              const active = (b?.isActive ?? s?.isActive ?? true) as boolean;

              return {
                ...prev,
                addressBilling: {
                  code: b?.addressCode ?? "B1",
                  name: b?.addressName ?? "Facturación",
                  street: b?.street ?? street ?? "",
                  city: b?.city ?? city ?? "",
                  country: b?.country ?? country ?? "CL",
                  isActive: b?.isActive ?? active ?? true,
                },
                addressShipping: {
                  code: s?.addressCode ?? "S1",
                  name: s?.addressName ?? "Envío",
                  street: s?.street ?? street ?? "",
                  city: s?.city ?? city ?? "",
                  country: s?.country ?? country ?? "CL",
                  isActive: s?.isActive ?? active ?? true,
                },
                // campos comunes
                addressStreet: street ?? "",
                addressCity: city ?? "",
                addressCountry: country ?? "CL",
                addressActive: Boolean(active),
              };
            });
          }
        } catch (e) {
          console.error("No se pudieron cargar direcciones del cliente:", e);
        }

        const f = formatRut(dto.RUT ?? "");
        setRecord((prev) => prev ? { ...prev, docNumber: f } : prev);
        setRutError(f && isRutValid(f) ? null : "RUT inválido");

      } catch (e: any) {
        console.error(e);
        if (mounted) {
          setRecord(null);
          toast.error(`Error al cargar el cliente`);

        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [recordId]);

  const handleChange = <K extends keyof CustomerRecord>(field: K, value: CustomerRecord[K]) => {
    if (field === "docNumber") {
      const raw = String(value ?? "");
      setRecord(prev => (prev ? { ...prev, docNumber: raw } : prev));
      setRutError(null);
    } else {
      setRecord(prev => (prev ? { ...prev, [field]: value } : prev));
    }
  };

  useEffect(() => {
    if (!record) return;
    const v = record.docNumber ?? "";
    const t = setTimeout(() => {
      if (!v.trim()) { setRutError("RUT requerido"); return; }
      const maybeFormatted = formatRut(v);
      setRutError(isRutValid(maybeFormatted) ? null : "RUT inválido");
    }, 400);
    return () => clearTimeout(t);
  }, [record?.docNumber]);

  // Guardar: PATCH /customers/:id (solo campos soportados por DTO)
  const handleSaveFull = useCallback(async () => {
    if (!recordRef.current) return;
    const r = recordRef.current;

    try {
      // === PATCH COMPLETO (tal como lo tenías) ===
      await customerUpdate(r.id, {
        firstName: r.firstName,
        lastName: r.lastName,
        email: r.mainEmail,
        phone: r.phone || undefined,
        rut: r.docNumber,
        isActive: r.status,
        groupCode: r.groupCode,
        groupNum: r.groupNum,
        currency: r.currency,
        listNum: r.listNum,
        partnerType: r.partnerType || "C",
        ...(r.notes ? { notes: r.notes } : null),
        ...(r.payTermsGrpCode ? { PayTermsGrpCode: r.payTermsGrpCode as any } : null),
      } as any);


      // === PUT COMPLETO (B1/S1) tal como lo tenías ===
      const street = r.addressStreet || r.addressBilling.street || r.addressShipping.street || "";
      const city = r.addressCity || r.addressBilling.city || r.addressShipping.city || "";
      const country = r.addressCountry || r.addressBilling.country || r.addressShipping.country || "CL";
      const active = Boolean(r.addressActive ?? r.addressBilling.isActive ?? r.addressShipping.isActive ?? true);

      await customerAddressesPut(r.id, [
        {
          CustomerId: r.id,
          AddressCode: r.addressBilling.code || "B1",
          AddressName: r.addressBilling.name || "Facturación",
          AddressType: "B",
          Street: street,
          City: city,
          Country: country,
          IsActive: active,
        },
        {
          CustomerId: r.id,
          AddressCode: r.addressShipping.code || "S1",
          AddressName: r.addressShipping.name || "Envío",
          AddressType: "S",
          Street: street,
          City: city,
          Country: country,
          IsActive: active,
        },
      ]);

      // baseline actualizado al “todo guardado”
      lastSavedRef.current = snapshotFromRecord(r);

      // si "Guardar" debe volver al listado, eso lo hacemos en el botón
      toast.success("Cliente actualizado correctamente");

    } catch (e: any) {
      console.error("Error al guardar cliente y direcciones:", e);
      toast.error(
        e?.response?.data?.message ||
        e?.message ||
        "No se pudo guardar los cambios."
      );

    }
  }, []);

  // para controlar modal de confirmacion delete 
  const [openDelete, setOpenDelete] = useState(false);
  const handleOpenDelete = useCallback(() => setOpenDelete(true), []);

  const handleApply = useCallback(async () => {
    if (!recordRef.current) return;
    const r = recordRef.current;

    // Validación previa de campos vacíos 
    const localErrs = validateBeforeSave(recordRef.current);
    if (Object.keys(localErrs).length) {
      setFieldErrors(localErrs);
      // (opcional) scroll al primer error:
      const firstKey = Object.keys(localErrs)[0];
      const el = document.getElementById(`error-${firstKey}`);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    setSaving(true);
    setFieldErrors({}); // limpia errores previos
    try {
      const snap = snapshotFromRecord(r);
      const prev = lastSavedRef.current;

      // 1) PATCH parcial (general camelCase)
      const patchPayload = pickChangedFields(prev?.general ?? null, snap.general);
      if (Object.keys(patchPayload).length > 0) {
        await customerUpdate(r.id, patchPayload);
      }

      // 2) PUT solo direcciones cambiadas (camelCase) — una por request
      const changedAddrs = pickChangedAddresses(prev?.addresses ?? null, snap.addresses);
      for (const addr of changedAddrs) {
        await customerAddressesPut(r.id, addr);
      }

      // 3) baseline
      lastSavedRef.current = snapshotFromRecord(r);

      toast.success("Cambios aplicados correctamente");

    } catch (e: any) {
      console.error("Error en Aplicar (diff):", e);
      toast.error(
        e?.response?.data?.message ||
        e?.message ||
        "No se pudo aplicar los cambios."
      );

    } finally {
      setSaving(false);
    }
  }, []);

  // modal confirmar delete direccion 
  const handleDeleteAddress = useCallback(async (code: string) => {
    if (!recordRef.current || !code) return;
    try {
      await customerAddressDelete(recordRef.current.id, code);
      const addrs = await customerAddressesGet(recordRef.current.id);
      const b = addrs?.find((a: { AddressType: any; }) => (a.AddressType ?? "").toUpperCase() === "B");
      const s = addrs?.find((a: { AddressType: any; }) => (a.AddressType ?? "").toUpperCase() === "S");
      setRecord(prev => prev ? {
        ...prev,
        addressBilling: {
          code: b?.AddressCode ?? "B1",
          name: b?.AddressName ?? "Facturación",
          street: b?.Street ?? "",
          city: b?.City ?? "",
          country: b?.Country ?? "CL",
          isActive: Boolean(b?.IsActive ?? true),
        },
        addressShipping: {
          code: s?.AddressCode ?? "S1",
          name: s?.AddressName ?? "Envío",
          street: s?.Street ?? "",
          city: s?.City ?? "",
          country: s?.Country ?? "CL",
          isActive: Boolean(s?.IsActive ?? true),
        },
        addressStreet: "",
        addressCity: "",
        addressCountry: "CL",
        addressActive: true,
      } : prev);
    } catch (e: any) {
      console.error("No se pudo eliminar la dirección:", e);
      toast.success("No se pudo eliminar la dirección.");

    }
  }, []);

  /* ---------- acciones header (estables) ---------- */
  const headerActions: Action[] = useMemo(
    () => [
      {
        label: "Aplicar",
        variant: "success",
        icon: saving ? <ArrowPathIcon className="h-5 w-5 animate-spin" /> : <CheckCircleIcon className="h-5 w-5" />,
        onClick: async () => {
          await handleApply();
        },
        disabled: saving,
      },
      {
        label: "Guardar",
        variant: "success",
        icon: saving ? <ArrowPathIcon className="h-5 w-5 animate-spin" /> : <SaveOutlined className="h-4 w-4" />,
        onClick: async () => {
          await handleApply();
          router.push("/customers/clientes");
        },
        disabled: saving,
      },
      { label: "Volver al listado", variant: "secondary", icon: <XCircleIcon className="h-5 w-5" />, onClick: () => router.push("/customers/clientes"), disabled: saving },
    ],
    [router, handleApply, saving, handleOpenDelete]
  );

  usePageHeader(
    () =>
    ({
      title: (
        <div>
          <div className="text-xs font-semibold uppercase text-blue-600 tracking-wider">
            Clientes
          </div>
          <div className="text-2xl font-semibold text-gray-900">
            {record
              ? `${record.firstName} ${record.lastName}`.trim() || "Resumen"
              : "Resumen"}
          </div>
        </div>
      ),
      action: headerActions,
      status: saving
        ? { text: "Guardando…", variant: "info" }
        : record
          ? {
            text: record.status ? "Activo" : "Inactivo",
            variant: record.status ? "success" : "warning",
          }
          : undefined,
    } as unknown as PageHeaderProps),
    [headerActions, saving, record?.status, record?.firstName, record?.lastName]
  );


  /* ---------- render ---------- */
  if (loading) {
    return (
      <div className="flex w-full items-center justify-center py-10">
        <ArrowPathIcon className="mr-2 h-5 w-5 animate-spin text-gray-500" />
        <span className="text-gray-500">Cargando…</span>
      </div>
    );
  }

  if (!record) {
    return (
      <p className="p-4 text-center text-gray-500">
        Cliente no encontrado o no disponible.
      </p>
    );
  }


  return (
    <div className="p-6 bg-white">
      <CustomersFields
        record={record}
        readOnly={false}
        onChange={handleChange}
        rutError={rutError}
        errors={fieldErrors}
      />
    </div>

  );
}
