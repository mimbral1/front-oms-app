// views\Customers\Clientes\Nuevo\Nuevo.tsx
"use client";

import React, { useMemo, useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";
import type { Action, PageHeaderProps } from "@/components/layout/page-header";
import { XCircleIcon } from "@heroicons/react/24/outline";
import SaveOutlined from "@mui/icons-material/SaveOutlined";
import { FaPlus } from "react-icons/fa";
import { CustomersFields, CustomerRecord } from "@/features/customers/components/clientes/clientesFields";
import { customerCreate } from "@/app/fetchWithAuth/api-clientes/clientes/customers";
import { isRutValid, formatRut, cleanRut, computeDV } from "@/features/customers/components/clientes/utils-rut";
import { toast } from "react-hot-toast";

/* ================================
 * Estado inicial (alineado con CustomersFields actualizado)
 * ================================ */
const initialRecord: CustomerRecord = {
  id: "",
  firstName: "",
  lastName: "",
  docType: "RUT",
  docNumber: "",
  mainEmail: "",
  phone: "",
  status: false,
  created: { name: "—", date: "—" },
  modified: { name: "—", date: "—" },
  isNew: true,

  // comerciales
  partnerType: "C",
  groupCode: 100,
  groupNum: 1,
  payTermsGrpCode: 1,
  currency: "CLP",
  notes: "Particular",
  listNum: undefined as unknown as number, // el usuario debe elegir “Listas” (ListNum) en el select

  // direcciones fijas (códigos/nombres) + comunes
  addressBilling: {
    code: "B1",
    name: "Facturación",
    street: "",
    city: "",
    country: "CL",
    isActive: true,
  },
  addressShipping: {
    code: "S1",
    name: "Envío",
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

function deriveIdFromRut(rut?: string) {
  if (!rut) return "";
  const { base } = cleanRut(rut); //  cuerpo sin DV
  return base ? `${base}C` : "";
}

export default function CustomerNuevoView() {
  const router = useRouter();
  const [record, setRecord] = useState<CustomerRecord>({ ...initialRecord });

  // Campos requeridos en el formulario
  const REQUIRED_FIELDS: (keyof CustomerRecord)[] = [
    "firstName",
    "lastName",
    "docType",
    "docNumber",
    "phone",
  ];

  // Errores por campo y “tocado” por campo para controlar cuándo mostrar rojo
  type FieldErrors = Partial<Record<keyof CustomerRecord, string>>;
  type TouchedMap = Partial<Record<keyof CustomerRecord, boolean>>;

  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<TouchedMap>({});
  const [submitted, setSubmitted] = useState(false); // para mostrar errores tras intentar guardar



  function validateRequired(rec: CustomerRecord): FieldErrors {
    const errs: FieldErrors = {};
    for (const key of REQUIRED_FIELDS) {
      const val = rec[key];
      const isEmpty =
        val == null ||
        (typeof val === "string" && !val.trim());
      if (isEmpty) errs[key] = "Este campo es requerido";
    }
    return errs;
  }

  // mapear errores de API a campos
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
            doc_type: "docType",
            rut: "docNumber",
            phone: "phone",
          } as Record<string, keyof CustomerRecord>)[rawKey] ?? (rawKey as keyof CustomerRecord);
        out[key] = String(errors[rawKey] ?? "Dato inválido");
      }
    }
    return out;
  }

  // Helpers para marcar touched
  const markTouched = <K extends keyof CustomerRecord>(k: K) =>
    setTouched((t) => ({ ...t, [k]: true }));

  // para manejar errores en el rut 
  const [rutError, setRutError] = useState<string | null>(null);

  const recordRef = useRef(record);
  useEffect(() => {
    recordRef.current = record;
  }, [record]);

  // 1) handler: NO formateea ni valides por tecla
  const handleChange = <K extends keyof CustomerRecord>(field: K, value: CustomerRecord[K]) => {
    // marcar touched al escribir
    markTouched(field);

    if (field === "docNumber") {
      const raw = String(value ?? "");
      setRecord(prev => ({ ...prev, docNumber: raw })); //  solo guarda lo escrito

      // validar requerido en vivo (sin alert) para pintar línea roja si corresponde
      setFieldErrors(prev => {
        const next = { ...prev };
        if (!raw.trim()) next.docNumber = "Este campo es requerido";
        else delete next.docNumber;
        return next;
      });

      setRutError(null); // no muestres error de RUT mientras escribe
    } else {
      // otros campos
      setRecord(prev => ({ ...prev, [field]: value }));

      // requerido en vivo
      if (REQUIRED_FIELDS.includes(field)) {
        const asStr = typeof value === "string" ? value : String(value ?? "");
        setFieldErrors(prev => {
          const next = { ...prev };
          if (!asStr.trim()) next[field] = "Este campo es requerido";
          else delete next[field];
          return next;
        });
      }
    }
  };

  // 2) debounce para validar RUT sin tocar record
  useEffect(() => {
    const v = record.docNumber ?? "";
    const t = setTimeout(() => {
      // Solo validar/pintar si el usuario ya interactuó o intentó enviar
      if (!(touched.docNumber || submitted)) return;

      if (!v.trim()) {
        // setRutError("RUT requerido");
        setFieldErrors(prev => ({ ...prev, docNumber: "Este campo es requerido" }));
        return;
      }
      // valida con lo que haya, sin formatear el value en el input
      const maybeFormatted = formatRut(v);
      const ok = isRutValid(maybeFormatted);
      setRutError(ok ? null : "RUT inválido");
      setFieldErrors(prev => {
        const next = { ...prev };
        if (!ok) next.docNumber = "RUT inválido";
        else delete next.docNumber;
        return next;
      });
    }, 400);
    return () => clearTimeout(t);
     
  }, [record.docNumber, touched.docNumber, submitted]);

  /* ================================
   * Crear (POST /customers)
   * ================================ */
  const doCreate = useCallback(async (): Promise<string | null> => {
    const r = recordRef.current;
    if (!r) return null;

    // activar modo "intenté guardar" para que muestre errores
    setSubmitted(true);

    // 1) Requeridos vacíos
    const reqErrs = validateRequired(r);

    // 2) RUT inválido -> error de campo, sin throw
    if (!r.docNumber || !isRutValid(formatRut(r.docNumber))) {
      reqErrs.docNumber = reqErrs.docNumber || "RUT inválido";
      setRutError("RUT inválido");
    } else {
      setRutError(null);
    }

    // Si hay errores, setear y NO postear
    if (Object.keys(reqErrs).length > 0) {
      setFieldErrors(reqErrs);
      // (opcional) scroll al primer error
      const firstKey = Object.keys(reqErrs)[0] as keyof CustomerRecord;
      const el = document.getElementById(`error-${String(firstKey)}`);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
      // mensaje general opcional
      toast.error("Revisa los campos requeridos antes de guardar");

      return null; // no posteamos
    }

    // id desde RUT base + "C"
    const id = (r.id?.trim() || deriveIdFromRut(r.docNumber));
    if (!id) {
      // debería estar cubierto por docNumber requerido, pero por las dudas:
      setFieldErrors(prev => ({ ...prev, docNumber: "Este campo es requerido" }));
      toast.success("ID del cliente no válido.");
      return null;
    }

    // Dirección común -> duplicar en B1 y S1
    const street = r.addressStreet || r.addressBilling.street || r.addressShipping.street || "";
    const city = r.addressCity || r.addressBilling.city || r.addressShipping.city || "";
    const country = r.addressCountry || r.addressBilling.country || r.addressShipping.country || "CL";
    const active = Boolean(r.addressActive ?? true);

    // Normalizar y formatear RUT ANTES de enviar (base-dv)
    const { base: rutBase, dv: rutDv } = cleanRut(r.docNumber || "");
    const rutFmt = rutBase ? `${rutBase}-${rutDv || computeDV(rutBase)}` : undefined;

    try {
      await customerCreate({
        id,
        partnerType: r.partnerType || "C",
        rut: rutFmt, // ↍ ahora va "base-dv"
        firstName: r.firstName,
        lastName: r.lastName,
        email: r.mainEmail || undefined,

        groupCode: r.groupCode ?? 100,
        groupNum: r.groupNum ?? 1,
        PayTermsGrpCode: r.payTermsGrpCode ?? 1,
        currency: r.currency || "CLP",
        notes: r.notes || "Particular",
        listNum: r.listNum, // viene del SelectSearchInline “Listas”

        addresses: [
          {
            addressCode: "B1",
            addressName: "Facturación",
            addressType: "B",
            street, city, country,
            isActive: active,
          },
          {
            addressCode: "S1",
            addressName: "Envío",
            addressType: "S",
            street, city, country,
            isActive: active,
          },
        ],
      });

      toast.success(`Cliente creado correctamente (${id})`);

      return id;
    } catch (err: any) {
      console.error(err);
      const mapped = mapApiErrorsToFields(err);
      if (Object.keys(mapped).length) {
        setFieldErrors(mapped);
        toast.success("Hay errores de validación en el formulario.");

        return null;
      }

      toast.success("No se pudo crear el cliente.");

      return null;
    }
  }, []);

  /* ================================
   * Header actions 
   * ================================ */
  const headerActions: Action[] = useMemo(
    () => [
      {
        label: "Guardar",
        variant: "success",
        icon: <SaveOutlined className="h-4 w-4" />,
        onClick: async () => {
          const newId = await doCreate();
          if (!newId) return;
          // navegar al resumen del creado
          router.push(`/customers/clientes/`);
        },
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
        onClick: async () => {
          const newId = await doCreate();
          if (!newId) return; // validación: no limpiar si falló
          setRecord({ ...initialRecord }); // limpiar para nuevo registro
          setFieldErrors({});
          setTouched({});
          setSubmitted(false);
          setRutError(null);
        },
      },
      {
        label: "Volver al listado",
        variant: "secondary",
        icon: <XCircleIcon className="h-5 w-5" />,
        onClick: () => router.push("/customers/clientes"),
      },
    ],
    [router, doCreate]
  );

  usePageHeader(
    () =>
    ({
      title: (
        <div>
          <div className="text-xs font-semibold uppercase text-blue-600 tracking-wider">
            Clientes
          </div>
          <div className="text-2xl font-semibold text-gray-900">Nuevo</div>
        </div>
      ),
      action: headerActions,
    } as unknown as PageHeaderProps),
    [headerActions]
  );


  /* ================================
   * Render
   * ================================ */
  // Solo mostrar errores en UI cuando el campo fue tocado o tras intentar guardar
  const errorsForUI: FieldErrors = useMemo(() => {
    const out: FieldErrors = {};
    for (const k of Object.keys(fieldErrors) as (keyof CustomerRecord)[]) {
      if (submitted || touched[k]) out[k] = fieldErrors[k]!;
    }
    return out;
  }, [fieldErrors, submitted, touched]);

  return (
    <div className="p-6 bg-white">
      <CustomersFields
        record={record}
        readOnly={false}
        onChange={handleChange}
        rutError={submitted || touched.docNumber ? rutError : null}
        errors={errorsForUI}
      />
    </div>
  );
}
