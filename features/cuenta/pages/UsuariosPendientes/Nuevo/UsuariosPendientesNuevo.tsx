/* ------------------------------------------------------------------
    app/customers/new/page.tsx ·  CustomerCreateView
-------------------------------------------------------------------*/
"use client";

import { ArrowDownOnSquareIcon, CheckCircleIcon, ClipboardDocumentListIcon, MapPinIcon, XCircleIcon } from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import Card from "@/components/ui/card/Card";
import { Action } from "@/components/layout/page-header";
import {
  Input,
} from "@mui/material";
import { Toggle } from "@/components/ui/togle/togle";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";
import { isValidEmail } from "@/utils/validate";
import { defaultAvatar, UserRow } from "../UsuariosPendientesView";
import { FieldRows } from "@/components/ui/fieldrows/FieldRows";
import { CollapsibleField } from "@/components/ui/collapsible/collapsiblefield";

const initialState: UserRow = {
  refId: "",
  firstName: "",
  lastName: "",
  email: "",
  idFuncionario: "",
  perfil: "",
  totalAcces: false,
  motivo: "",
  userCreated: {
    name: "",
    email: "",
    avatar: defaultAvatar,
  },
  dateCreated: "",
  status: "Active",
};

function downloadTxt(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/* ╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍
    3 ‑ Componente principal
   ╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍ */
export function PendingUserCreateView() {
  const router = useRouter();
  const [draft, setDraft] = useState<UserRow>(initialState);

  const update = <K extends keyof UserRow>(k: K, v: UserRow[K]) => {
    setDraft((c) => ({ ...c, [k]: v }));
    // validación email
    if (k === "email") {
      setErrors((e) => ({
        ...e,
        mainEmail: isValidEmail(v as string) ? undefined : "E-mail inválido",
      }));
    }
    // validación RUT solo si docType es "RUT"
    /* if (k === "docNumber" || k === "docType") {
      const type = k === "docType" ? (v as string) : draft.docType;
      const num = k === "docNumber" ? (v as string) : draft.docNumber;
      if (type === "RUT") {
        setErrors((e) => ({
          ...e,
          docNumber: isValidRUT(num) ? undefined : "RUT inválido",
        }));
      } else {
        setErrors((e) => ({ ...e, docNumber: undefined }));
      }
    } */
  };
  type UserRowErrors = {
    refId?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    idFuncionario?: string;
    perfil?: string;
    motivo?: string;
    userCreated?: {
      name?: string;
      email?: string;
    };
    dateCreated?: string;
  };

  const [errors, setErrors] = useState<UserRowErrors>({});
  const hasErrors =
    !!errors.refId ||
    !!errors.firstName ||
    !!errors.lastName ||
    !!errors.email ||
    !!errors.idFuncionario ||
    !!errors.perfil ||
    !!errors.motivo ||
    !!errors.userCreated?.name ||
    !!errors.userCreated?.email ||
    !!errors.dateCreated;

  const headerActions: Action[] = useMemo(
    () => [
      { label: "Apply", variant: "success", disabled: true, icon: <CheckCircleIcon className="h-5 w-5" /> },
      {
        label: "Save",
        variant: "success",
        disabled: hasErrors,
        /* onClick: () =>
          alert(
            "💾 Aquí llamarías a tu endpoint POST /customers con el payload:\n\n" +
              JSON.stringify(draft, null, 2)
          ), */
        onClick: () => {
          const filename = `${draft.firstName || "customer"}_${Date.now()}.txt`;
          downloadTxt(filename, JSON.stringify(draft, null, 2));
          router.push("/cuenta/usuarios/listado-usuarios");
        },
        icon: <ArrowDownOnSquareIcon className="h-5 w-5" />,
      },
      /* {
        label: "Save and create",
        variant: "success",
        onClick: () => {
          alert("Guardar y limpiar formulario (simulado)");
          setDraft(initialState);
        },
      }, */
      { label: "Cancel", variant: "secondary", onClick: () => router.push("/cuenta/usuarios/listado-usuarios"), icon: <XCircleIcon className="h-5 w-5" /> },
    ],
    [router, draft]
  );
  usePageHeader(
    () => ({
      title: "Nuevo",
      description: "CLIENTE",
      action: headerActions,
    }),
    [headerActions]
  );

  const handleChange = <K extends keyof UserRow>(
    field: K,
    value: UserRow[K]
  ) => {
    setDraft((prev) => (prev ? { ...prev, [field]: value } : prev));
  };

  const handle =
    <K extends keyof UserRow>(field: K) =>
      (value: UserRow[K]) => {
        handleChange?.(field, value);
      };
  return (
    <div className="p-6 space-y-6 ">
      {/* ‑‑‑ Sección principal ‑‑‑ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 bg-white">
        {/* DETAIL */}
        <Card
          title="DETALLES"
          icon={ClipboardDocumentListIcon}
          hasTitleDivider
          noDefaultStyles
          className="bg-white rounded-xl p-6"
        >
          <div className="space-y-10">
            <FieldRows label="Email">
              <Input
                type="email"
                value={draft.email}
                onChange={(e) => update("email", e.target.value)}
                fullWidth
              />
            </FieldRows>
            <FieldRows label="Nombre">
              <Input
                value={draft.firstName}
                onChange={(e) => update("firstName", e.target.value)}
                fullWidth
              />
            </FieldRows>
            {/*  <Row label="Firstname">
              <Input
                value={draft.firstName}
                onChange={(e) => update("firstName", e.target.value)}
              />
            </Row> */}
            <FieldRows label="Apellido">
              <Input
                value={draft.lastName}
                onChange={(e) => update("lastName", e.target.value)}
                fullWidth
              />
            </FieldRows>
            {/* <Row label="Lastname">
              <Input
                value={draft.lastName}
                onChange={(e) => update("lastName", e.target.value)}
              />
            </Row> */}
            {/*  <Row label="Document type">
              <SelectCustom
                value={draft.docType}
                onValueChange={(v) => update("docType", v)}
                options={[
                  { value: "DNI", label: "DNI" },
                  { value: "RUT", label: "RUT" },
                  { value: "CUIT", label: "CUIT" },
                  { value: "Passport", label: "Passport" },
                ]}
              />
            </Row> */}
            <FieldRows label="Ref ID">
              <Input
                value={draft.refId}
                onChange={(e) => update("refId", e.target.value)}
                error={!!errors.refId}
                fullWidth
              />
            </FieldRows>
            <FieldRows label="ID Funcionario">
              <Input
                value={draft.idFuncionario}
                onChange={(e) => update("idFuncionario", e.target.value)}
                fullWidth
              />
            </FieldRows>
            <FieldRows label="Perfil">
              <CollapsibleField
                inline
                label=""
                value={draft.perfil}
                options={["Admin", "Usuario Regular", "Cliente"]}
                onChange={(v) => handle("perfil")(v as UserRow["perfil"])}
              />
            </FieldRows>

            <FieldRows label="Motivo">
              <Input
                value={draft.motivo}
                onChange={(e) => update("motivo", e.target.value)}
                fullWidth
              />
            </FieldRows>
          </div>
        </Card>

        {/* OTHERS */}
        <Card
          title="OTROS"
          icon={MapPinIcon}
          hasTitleDivider
          noDefaultStyles
          className="border-none shadow-none p-6"
        >
          <div className="space-y-10">
            {/*             <Row label="Points card">
              <Input
                value={draft.pointsCard}
                onChange={(e) => update("pointsCard", e.target.value)}
              />
            </Row>

            <Row label="Clusters">
              {/* <Select
                value="clusters"
                placeholder="Select clusters…"
                options={[
                  {
                    value: "Premium",
                    label: " Clientes premium con alto gasto",
                  },
                  {
                    value: "Compradores frecuentes",
                    label: "Compradores frecuentes pero sensibles al precio",
                  },
                ]} // TODO: populate dinámicamente
              /> 
              <div className="w-full pl-2">
                <FormControl variant="standard" fullWidth>
                  <Select
                    label="label-nombres"
                    multiple
                    value={draft.clusters}
                    onChange={(e) =>
                      update("clusters", e.target.value as string[])
                    }
                    renderValue={(selected: string[]) => (
                      <div className="flex flex-wrap gap-1">
                        {selected.map((n) => (
                          <Chip key={n} label={n} />
                        ))}
                      </div>
                    )}
                    /* disabled={isReadOnly} 
                  >
                    {[
                      {
                        value: "Premium",
                        label: "Clientes premium con alto gasto",
                      },
                      {
                        value: "Compradores frecuentes",
                        label:
                          "Compradores frecuentes pero sensibles al precio",
                      },
                    ].map((opt) => (
                      <MenuItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </div>
            </Row>

            <Row label="Associate">
              <Toggle
                checked={draft.isAssociate}
                onCheckedChange={(v) => update("isAssociate", v)}
              />
            </Row>
            <Row label="Employee">
              <Input
                type="employee"
                value={draft.Employee}
                onChange={(e) => update("Employee", e.target.value)}
              />
            </Row>
            <Row label="Black listed">
              <Toggle
                checked={draft.isBlacklisted}
                onCheckedChange={(v) => update("isBlacklisted", v)}
              />
            </Row>
            <Row label="Is new">
              <Toggle
                checked={draft.isNew}
                onCheckedChange={(v) => update("isNew", v)}
              />
            </Row> */}
            <FieldRows label="Status">
              <CollapsibleField
                label=""
                inline
                value={draft.status}
                options={["Active", "Inactive"]}
                onChange={(v) => update("status", v as UserRow["status"])}
              />
            </FieldRows>
            <FieldRows label="Accseso Total">
              <Toggle
                checked={draft.totalAcces}
                onCheckedChange={(v: boolean) => update("totalAcces", v)}
              />
            </FieldRows>
          </div>
        </Card>
      </div>
    </div>
  );
}
