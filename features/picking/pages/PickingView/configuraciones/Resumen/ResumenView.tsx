"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  CheckCircleIcon,
  DocumentDuplicateIcon,
  XCircleIcon,
  EllipsisHorizontalIcon,
  UserIcon,
  ClipboardDocumentListIcon,
  PencilIcon,
} from "@heroicons/react/24/outline";
import { Action } from "@/components/layout/page-header";
import Card from "@/components/ui/card/Card"; // Ajusta la ruta a tu componente "Card"
// Ajusta la ruta a tu layout
import { useGetPicker } from "@/features/picking/stores/use-picker-details";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";
import { Avatar } from "@/components/ui/user-avatar/initials";
import { MultiSelect } from "@/components/ui/multiselect/multiselect";

export function DetallePicker() {
  const router = useRouter();
  const { id } = useParams();
  // ‘id’ puede ser string | string[] | undefined

  // Sanitizar:
  const idAsString = Array.isArray(id) ? id[0] : id ?? "";

  // Ahora ‘idAsString’ es string seguro
  const { data: picker, loading, error } = useGetPicker(idAsString);
  useEffect(() => {
    if (picker) {
      setAllowed(picker.sectorsAllowed);
      setRestricted(picker.sectorsRestricted);
    }
  }, [picker]);
  const ALL_SECTORS = ["Yogurt", "Vino", "Audio", "Snacks"];

  const [sectorsAllowed, setAllowed] = useState<string[]>(
    picker?.sectorsAllowed ?? []
  );
  const [sectorsRestricted, setRestricted] = useState<string[]>(
    picker?.sectorsRestricted ?? []
  );

  const headerActions = useMemo<Action[]>(() => {
    if (!picker) return [];

    return [
      {
        label: "Aplicar",
        variant: "secondary",
        onClick: () => { },
        icon: <CheckCircleIcon className="h-5 w-5" />,
        disabled: true,
      },
      {
        label: "Guardar",
        variant: "secondary",
        onClick: () => { },
        icon: <DocumentDuplicateIcon className="h-5 w-5" />,
        disabled: true,
      },
      {
        label: "Guardar & Crear",
        variant: "secondary",
        onClick: () => { },
        icon: <DocumentDuplicateIcon className="h-5 w-5" />,
        disabled: true,
      },
      {
        label: "Volver al listado",
        variant: "secondary",
        onClick: () => router.push("/picking/configuraciones/pickers"),
        icon: <XCircleIcon className="h-5 w-5" />,
      },
      {
        label: "...",
        variant: "secondary",
        onClick: () => console.log("Más opciones"),
        icon: <EllipsisHorizontalIcon className="h-5 w-5" />,
      },
    ];
  }, [picker, router]);

  usePageHeader(() => {
    const title = picker
      ? `${picker.name} ${picker.lastname}`
      : "Cargando picker...";
    const statusVariant: "success" | "error" =
      picker?.status === "Active" ? "success" : "error";

    return {
      title,
      action: picker ? headerActions : [],
      status: {
        text: picker?.status ?? "Cargando...",
        variant: statusVariant,
      },
    };
  }, [picker, headerActions]);

  // Simulamos la obtención del Picker (en un caso real usarías un hook o store).
  // Acciones del header
  if (!picker) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <p className="text-xl text-gray-600">No se ha encontrado el picker.</p>
        {/* Aquí podrías poner un botón para volver a la lista */}
      </div>
    );
  }

  const Row = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <div className="flex">
      <span className="text-gray-900 font-medium text-sm min-w-[130px]">
        {label}
      </span>
      <span className="text-gray-600 font-medium flex-1 pl-2">{value}</span>
    </div>
  );

  // Header con título, estado y acciones
  /* const headerComponent = (
    <PageHeader
      title={`${picker.name} ${picker.lastname}`}
      status={{
        text: picker.status,
        variant: picker.status === "Active" ? "success" : "error",
      }}
      action={headerActions}
    />
  ); */

  return (
    <div className="p-7">
      {/* En pantallas grandes: 2 columnas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* COLUMNA IZQUIERDA: DETALLE */}
        <Card
          title="DETALLE"
          icon={ClipboardDocumentListIcon}
          hasTitleDivider
          noDefaultStyles
          className="bg-white rounded-xl p-6"
        >
          <div className="space-y-8 text-gray-700">
            {/* Imagen */}
            <Row
              label="Imagen"
              value={
                picker.avatarUrl ? (
                  <img
                    src={picker.avatarUrl}
                    className="h-20 w-20 rounded-full"
                  />
                ) : (
                  <Avatar name={`${picker.name} ${picker.lastname}`} />
                )
              }
            />
            <Row label="Nombre" value={`${picker.name} ${picker.lastname}`} />
            <Row label="Perfil" value={picker.profile} />
            {/* Ubicaciones + email en línea */}
            <Row
              label="Ubicaciones"
              value={
                <>
                  {picker.location}
                  <span className="mx-3 text-gray-400">|</span>
                  {picker.email}
                </>
              }
            />
            <Row label="ID Funcionario" value={picker.rut} />
            <Row label="Transportistas" value={picker.carriers.join(", ")} />
            <Row label="Modalidad de entrega" value={picker.deliveryMode} />
            <Row
              label="Sectores habilitados"
              value={
                <MultiSelect
                  options={ALL_SECTORS}
                  value={sectorsAllowed}
                  onChange={setAllowed}
                  placeholder="Sin sectores"
                />
              }
            />
            <Row
              label="Sectores restringidos"
              value={
                <MultiSelect
                  options={ALL_SECTORS}
                  value={sectorsRestricted}
                  onChange={setRestricted}
                  placeholder="Sin restricciones"
                />
              }
            />
          </div>
        </Card>

        {/* COLUMNA DERECHA: OTROS / USUARIO CREADOR / ÚLTIMA MODIFICACIÓN */}
        <div className="flex flex-col gap-6">
          {/* OTROS */}
          {/* border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md */}
          <Card
            title="OTROS"
            hasOptions
            hasTitleDivider
            noDefaultStyles
            className="bg-white /* p-7  */"
          >
            <div className="space-y-3 text-gray-700">
              <div className="flex">
                <span className="text-gray-900 font-medium text-sm min-w-[130px]">
                  Estado:
                </span>
                <span className="text-gray-600 font-medium flex-1">
                  {picker.status}
                </span>
              </div>
            </div>
          </Card>

          {/* USUARIO CREADOR */}
          {/* border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md */}
          <Card
            title="USUARIO CREADOR"
            icon={UserIcon}
            hasOptions
            hasTitleDivider
            noDefaultStyles
            className="bg-white /* p-7 */"
          >
            <div className="space-y-10 text-gray-700">
              <div className="flex">
                <span className="text-gray-900 font-medium text-sm min-w-[130px]">
                  {picker.createdBy.name}
                </span>
                <span className="text-gray-600 font-medium flex-1">
                  {picker.createdBy.email}
                </span>
              </div>
              <div className="flex">
                <span className="text-gray-900 font-medium text-sm min-w-[130px]">
                  Fecha
                </span>
                <span className="text-gray-600 font-medium flex-1">
                  {new Date(picker.dateCreated).toLocaleString("es-CL", {
                    dateStyle: "short",
                    timeStyle: "short",
                  })}
                </span>
              </div>
            </div>
          </Card>

          {/* ÚLTIMA MODIFICACIÓN */}
          {/* border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md */}
          <Card
            title="ÚLTIMA MODIFICACIÓN"
            icon={PencilIcon}
            hasOptions
            hasTitleDivider
            noDefaultStyles
            className="bg-white /* p-7 */"
          >
            <div className="space-y-10 text-gray-700">
              <div className="flex">
                <span className="text-gray-900 font-medium text-sm min-w-[130px]">
                  {picker.createdBy.name}
                </span>
                <span className="text-gray-600 font-medium flex-1">
                  {picker.createdBy.email}
                </span>
              </div>
              <div className="flex">
                <span className="text-gray-900 font-medium text-sm min-w-[130px]">
                  Fecha
                </span>
                <span className="text-gray-600 font-medium flex-1">
                  {new Date(picker.dateModified).toLocaleString("es-CL", {
                    dateStyle: "short",
                    timeStyle: "short",
                  })}
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
