/* ------------------------------------------------------------------
    app/customers/[id]/page.tsx   ->  CustomerResumenView
-------------------------------------------------------------------*/
"use client";

import { ArrowDownOnSquareIcon, CheckCircleIcon, ClipboardDocumentListIcon, MapPinIcon, UserIcon, XCircleIcon } from "@heroicons/react/24/outline";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Action } from "@/components/layout/page-header";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";
import Card from "@/components/ui/card/Card";
import { Avatar } from "@/components/ui/user-avatar/initials";
import { Input } from "@mui/material";
import { Toggle } from "@/components/ui/togle/togle";
import {
  defaultAvatar,
  UserRow as User,
} from "../UsuariosPendientesView";
import { CollapsibleField } from "@/components/ui/collapsible/collapsiblefield";
import { FieldRows } from "@/components/ui/fieldrows/FieldRows";

const mock: User = {
  refId: "RUTCHL 22222222",
  firstName: "Flor",
  lastName: "KO",
  email: "flor.ko@example.com",
  idFuncionario: "22222222",
  perfil: "Cliente",
  totalAcces: true,
  motivo: "",
  userCreated: {
    name: "system",
    email: "system@example.com",
    avatar: defaultAvatar,
  },
  dateCreated: "2021-10-22T17:33:00Z",
  status: "Active",
};

export function UserPendingResumenView() {
  const { id } = useParams();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  //const [status, setStatus] = useState<User["status"]>(user.status);
  const [status, setStatus] = useState<User["status"]>("Inactive");

  /* carga (mock) */
  /* useEffect(() => setUser(mock), []); */

  useEffect(() => setUser(structuredClone(mock)), []);
  const update = <K extends keyof User>(key: K, value: User[K]) =>
    setUser((c) => (c ? { ...c, [key]: value } : c));

  /* Opciones para selects */
  const statusOptions: User["status"][] = ["Active", "Inactive"];

  const headerActions: Action[] = useMemo(
    () => [
      { label: "Apply", variant: "success", disabled: true, icon: <CheckCircleIcon className="h-5 w-5" /> },
      {
        label: "Save",
        variant: "success",
        onClick: () => alert("?? Guardar en API (simulado)"),
        icon: <ArrowDownOnSquareIcon className="h-5 w-5" />,
      },
      { label: "Save and create", variant: "success", onClick: () => { }, icon: <ArrowDownOnSquareIcon className="h-5 w-5" /> },
      { label: "Cancel", variant: "secondary", onClick: () => router.push("/cuenta/usuarios/listado-usuarios"), icon: <XCircleIcon className="h-5 w-5" /> },
    ],
    [router]
  );

  /* inyectar PageHeader */
  usePageHeader(
    () =>
      user
        ? {
          title: `${user.firstName} ${user.lastName}`,
          description: "CUSTOMER",
          action: headerActions,
          status: {
            text: user.status,
            variant: user.status === "Active" ? "success" : "error",
          },
        }
        : { title: "Loading..." },
    [user, headerActions]
  );

  if (!user) return <div className="p-6">Loading...</div>;
  const handleChange = <K extends keyof User>(field: K, value: User[K]) => {
    setUser((prev) => (prev ? { ...prev, [field]: value } : prev));
  };

  const handle =
    <K extends keyof User>(field: K) =>
      (value: User[K]) => {
        handleChange?.(field, value);
      };

  return (
    <div className="p-6 space-y-6 bg-white">
      {/* ========== MAIN FORM SECTION ========== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card
          title="DETAIL"
          icon={ClipboardDocumentListIcon}
          hasTitleDivider
          noDefaultStyles
          className="bg-white rounded-xl p-6 "
        >
          {/* -------- Columna izquierda -------- */}
          <div className="space-y-10">
            {/* <Row label="Firstname" value={user.firstName} />
            <Row label="Lastname" value={user.lastName} />
            <Row label="Document type" value={user.docType} />
            <Row label="Document number" value={user.docNumber} />
            <Row label="Main email" value={user.mainEmail} />

            {user.extraEmails.map((mail, idx) => (
              <Row key={idx} label="Email" value={mail} />
            
						<Row label="Firstname">
              <Input
                value={user.firstName}
                onChange={(e) => update("firstName", e.target.value)}
              />
            </Row>))} */}
            <div className="flex flex-col w-full pb-2">
              <FieldRows label="Email">
                <Input
                  type="email"
                  value={user.email}
                  onChange={(e) => update("email", e.target.value)}
                  fullWidth
                />
              </FieldRows>
            </div>
            <FieldRows label="Nombre">
              <Input
                value={user.firstName}
                onChange={(e) => update("firstName", e.target.value)}
                fullWidth
              />
            </FieldRows>
            <FieldRows label="Apellido">
              <Input
                value={user.lastName}
                onChange={(e) => update("lastName", e.target.value)}
                fullWidth
              />
            </FieldRows>
            {/* <Row label="Document type">
              <Select
                value={user.docType}
                onValueChange={(val: string) => update("docType", val)}
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
                value={user.refId}
                onChange={(e) => update("refId", e.target.value)}
                fullWidth
              />
            </FieldRows>
            <FieldRows label="ID Funcionario">
              <Input
                value={user.idFuncionario}
                onChange={(e) => update("idFuncionario", e.target.value)}
                fullWidth
              />
            </FieldRows>
            {/* <Row label="Perfil">
              <Input
                value={user.perfil}
                onChange={(e) => update("perfil", e.target.value)}
              />
            </Row> */}
            <FieldRows label="Perfil">
              {/* <Select
                value={user.perfil}
                onValueChange={(val: string) => update("perfil", val)}
                options={[
                  { value: "Admin", label: "Admin" },
                  { value: "RegularUser", label: "Usuario Regular" },
                ]}
								
              /> */}
              <CollapsibleField
                inline
                label=""
                value={user.perfil}
                options={["Admin", "Usuario Regular", "Cliente"]}
                onChange={(v) => handle("perfil")(v as User["perfil"])}
              />
            </FieldRows>
            <FieldRows label="Motivo">
              <Input
                value={user.motivo}
                onChange={(e) => update("motivo", e.target.value)}
                fullWidth
              />
            </FieldRows>

            {/* {user.extraEmails.map((mail, idx) => (
              <Row key={idx} label={idx === 0 ? "Extra emails" : ""}>
                <EmailRow
                  value={mail}
                  onChange={(v) => {
                    const next = [...user.extraEmails];
                    next[idx] = v;
                    update("extraEmails", next);
                  }}
                  onDelete={() => {
                    const next = user.extraEmails.filter((_, i) => i !== idx);
                    update("extraEmails", next);
                  }}
                />
              </Row>
            ))} */}
            {/* <Row label="">
              <button
                type="button"
                onClick={() => update("extraEmails", [...user.extraEmails, ""])}
                className="inline-flex items-center gap-1 rounded-md bg-blue-600 px-2 py-1 text-xs font-medium text-white hover:bg-blue-700"
              >
                <PlusIcon className="h-4 w-4" />
                Add email
              </button>
            </Row> */}
          </div>

          {/* -------- Columna derecha ("OTHERS") -------- */}
        </Card>
        <div>
          <Card
            title="OTHERS"
            icon={MapPinIcon}
            hasTitleDivider
            noDefaultStyles
            className="border-none shadow-none p-6"
          >
            <div className="space-y-10">
              <FieldRows label="Status">
                <CollapsibleField
                  label=""
                  inline
                  value={user.status}
                  options={["Active", "Inactive"]}
                  onChange={(v) => update("status", v as User["status"])}
                />
              </FieldRows>
              <FieldRows label="Accseso Total">
                <Toggle
                  checked={user.totalAcces}
                  onCheckedChange={(v: boolean) => update("totalAcces", v)}
                />
              </FieldRows>
              {/*               <Row label="Employee">
                <Input
                  type="employee"
                  value={user.Employee}
                  onChange={(e) => update("Employee", e.target.value)}
                />
              </Row>
              <Row label="Black listed">
                <Toggle
                  checked={user.isBlacklisted}
                  onCheckedChange={(v: boolean) => update("isBlacklisted", v)}
                />
              </Row>
              <Row label="Is new">
                <Toggle
                  checked={user.isNew}
                  onCheckedChange={(v: boolean) => update("isNew", v)}
                />
              </Row> */}
            </div>
          </Card>
          <Card
            title="CREATOR USER"
            icon={UserIcon}
            hasTitleDivider
            noDefaultStyles
            className="bg-white rounded-xl p-6"
          >
            <div className="flex items-center gap-3">
              <Avatar name={user.userCreated.avatar} />
              <div className="flex flex-col">
                <span className="text-sm font-medium text-gray-900">
                  {user.userCreated.name}
                </span>
                <span className="text-xs text-gray-500">
                  {user.userCreated.email}
                </span>
              </div>
            </div>
          </Card>

          {/* {user.modified && (
            <Card
              title="LAST MODIFICATION"
              icon={PencilIcon}
              hasTitleDivider
              noDefaultStyles
              className="bg-white rounded-xl p-6"
            >
              <div className="flex items-center gap-3">
                <Avatar name={user.modified.name} className="bg-red-500" />
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-gray-900">
                    {user.modified.name}
                  </span>
                  <span className="text-xs text-gray-500">
                    {user.modified.date}
                  </span>
                </div>
              </div>
            </Card>
          )} */}
        </div>
      </div>

      {/* <div className="grid grid-cols-1 lg:grid-cols-2 gap-6"></div> */}
    </div>
  );
}
