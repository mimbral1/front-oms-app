"use client";

import React, { useMemo } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
/* import { mockRondas } from "@/data/mocks/rondas"; // o usePickingStore() */
import { RondaPicking, RondaPickingDetalle } from "@/features/picking/types/rondas";

import { Action } from "@/components/layout/page-header";
import { ArrowLeftIcon, CheckCircleIcon, ClockIcon, DocumentIcon, EllipsisHorizontalIcon, PlusIcon, UserCircleIcon } from "@heroicons/react/24/outline";
import { useDetalleRonda } from "@/features/picking/stores/detalle-rondas";
import { useFetchRonda } from "@/features/picking/hooks/useFetchRonda";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";
import Card from "@/components/ui/card/Card";
import { FieldRows } from "@/components/ui/fieldrows/FieldRows";
import { CollapsibleField } from "@/components/ui/collapsible/collapsiblefield";
import { CalculatorIcon } from "lucide-react";

export function ResumenRonda() {

  const router = useRouter();
  const { id } = useParams();
  const searchParams = useSearchParams();
  const waveID = searchParams.get("waveID");

  useFetchRonda(id as string, waveID as string);

  const { ronda, setRonda } = useDetalleRonda();

  const pickerRawOptions: [string, string][] = [
    ["Marcelo Cancino", "mcancino@mimbral.com"],
    ["Jonathan Molina", "jmolina@mimbral.cl"],
  ];

  const pickerDisplayOptions = useMemo(
    () => pickerRawOptions.map(([name, _]) => name),
    []
  );

  const headerActions = useMemo<Action[]>(
    () => [
      {
        label: "Aplicar",
        variant: "primary",
        onClick: () => {
          console.log("Aplicar cambios:", ronda);
        },
        icon: <CheckCircleIcon className="h-5 w-5" />,
      },
      {
        label: "Guardar",
        variant: "success",
        onClick: () => {
          console.log("Guardar cambios:", ronda);
        },
        icon: <CheckCircleIcon className="h-5 w-5" />,
      },
      {
        label: "Guardar & Crear",
        variant: "success",
        onClick: () => { },
        icon: <PlusIcon className="h-5 w-5" />,
      },
      {
        label: "Volver al listado",
        variant: "secondary",
        onClick: () => router.push("/picking/rondas"),
        icon: <ArrowLeftIcon className="h-5 w-5" />,
      },
      {
        label: "...",
        variant: "secondary",
        onClick: () => { },
        icon: <EllipsisHorizontalIcon className="h-5 w-5" />,
      },
    ],
    [router, ronda] // Añadimos 'ronda' como dependencia para que las acciones usen el estado más reciente
  );

  usePageHeader(
    () => ({
      title: (
        <div>
          <div className="text-xs font-semibold uppercase text-blue-600 tracking-wider">
            Carrier
          </div>
          <div className="text-2xl font-semibold text-gray-900">RESUMEN RONDA {ronda?.id || ""}</div>
        </div>
      ),
      description: "Información detallada de la ronda",
      action: headerActions,
      status: {
        text: ronda?.status || "",
        variant: ronda?.status === "Pickeada" ? "success" : "warning",
      },
    }),
    [ronda?.id, ronda?.status, headerActions]
  );

  console.log("Arreglo de rondas: ", { ronda });
  console.log("id desde detalleview resumen: ", id);
  console.log("Rondabase: ", { ronda });

  if (!ronda) {
    return (
      <p className="p-4 text-center text-red-500">
        Ronda no encontrada o cargando...
      </p>
    );
  }

  const rondaapi: RondaPickingDetalle = {
    ...ronda,
    itemsRepickeados: false,
    usuarioCreador: {
      nombre: ronda.pickeruser?.picker || "Desconocido",
      fecha: ronda.creacion,
    },
    ultimaModificacion: {
      fecha: ronda.modificado,
    },
  };

  const handleChange = <K extends keyof RondaPicking>(
    field: K,
    value: RondaPicking[K]
  ) => {
    if (!ronda) return; // No hacer nada si la ronda es null
    setRonda({ ...ronda, [field]: value });
  };

  // Manejador específico para el cambio del picker en CollapsibleField
  const handlePickerUserChange = (selectedValue: string) => {
    // Buscar el picker seleccionado en las opciones originales (con nombre y email)
    const selectedPicker = pickerRawOptions.find(
      ([name, _]) => name === selectedValue
    );

    if (selectedPicker) {
      const [pickerName, pickerEmail] = selectedPicker;
      // Actualizar el objeto 'pickeruser' en el store
      handleChange("pickeruser", {
        picker: pickerName,
        pickerEmail: pickerEmail,
      });
      // También actualizar los campos 'picker' y 'pickerEmail' directamente
      // si se usan en otras partes de la UI o en la API de backend
      handleChange("picker", pickerName);
      handleChange("pickerEmail", pickerEmail);
    } else {
      console.warn(
        "Picker seleccionado no encontrado en las opciones:",
        selectedValue
      );
    }
  };

  const handle =
    <K extends keyof RondaPicking>(field: K) =>
      (value: RondaPicking[K]) => {
        handleChange(field, value);
      };

  return (
    <div className="flex-1 bg-white">
      <div className="flex-1 px-6 py-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Columna 1: Detalles y Totales */}
          <div className="space-y-6">
            {/* Detalle */}
            <Card
              title="Detalle"
              icon={DocumentIcon}
              hasTitleDivider
              noDefaultStyles
              className="p-6"
            >
              {/* picker */}
              <FieldRows label="Picker">
                <CollapsibleField
                  inline
                  label=""
                  value={`${ronda.pickeruser.picker} ${ronda.pickeruser.pickerEmail}`}
                  options={[
                    "Marcelo Cancino <mcancino@mimbral.com",
                    "Jonathan Molina <jmolina@mimbral.cl>",
                  ]}
                  onChange={(v) => {
                    const [picker, pickerEmail] = v
                      .split(/<|>/)
                      .map((s) => s.trim())
                      .filter(Boolean);
                    handle("pickeruser")({ picker, pickerEmail });
                  }}
                />
              </FieldRows>
              <FieldRows label="Picking Point">
                <span className="text-sm font-medium text-blue-500">
                  Belgrano
                </span>
              </FieldRows>
            </Card>
            {/* totales */}
            <Card
              title="TOTALES"
              icon={CalculatorIcon}
              noDefaultStyles
              hasTitleDivider
              className="p-6"
            >
              {/* pedidos */}
              <FieldRows label="Pedidos">
                <span className="rounded-full bg-white border border-gray-300 px-5 py-2 text-sm font-medium text-gray-900">
                  {rondaapi.pedidos}
                </span>
              </FieldRows>
              {/* productos */}
              <FieldRows label="Productos">
                <span className="rounded-full border bg-white border-gray-300 px-4 py-2 text-sm font-medium text-gray-900">
                  /{rondaapi.productos}
                </span>
              </FieldRows>
              {/* items */}
              <FieldRows label="Items">
                <span className="rounded-full border bg-white  border-gray-300 px-4 py-2 text-sm font-medium text-gray-900">
                  /{rondaapi.items}
                </span>
              </FieldRows>
            </Card>
          </div>

          <div className="space-y-6">
            {/* otros */}
            <Card title="Otros" hasTitleDivider noDefaultStyles className="p-6">
              <FieldRows label="Completado">
                <span className="rounded-full text-sm text-gray-900 border border-gray-300 bg-white font-medium px-3 py-2">
                  {rondaapi.completado ? "Sí" : "No"}
                </span>
              </FieldRows>
              {/* items repickeados */}
              <FieldRows label="Items Repickeados">
                <span className="rounded-full text-sm text-gray-900 border border-gray-300 bg-white font-medium px-3 py-2">
                  {rondaapi.itemsRepickeados ? "Sí" : "No"}
                </span>
              </FieldRows>
            </Card>
            {/* usuario creador */}
            <Card
              title="USUARIO CREADOR"
              icon={UserCircleIcon}
              hasTitleDivider
              noDefaultStyles
              className="pt-6"
            >
              <div className="flex items-center px-4 justify-between">
                <span className="text-sm font-medium text-gray-900">
                  {rondaapi.usuarioCreador.nombre}
                </span>
                <span className="text-sm text-gray-500">
                  {rondaapi.usuarioCreador.fecha}
                </span>
              </div>
            </Card>
            {/* Última Modificación */}
            <Card
              title="ÚLTIMA MODIFICACION"
              icon={ClockIcon}
              hasTitleDivider
              noDefaultStyles
              className="pt-6"
            >
              <span className="text-sm text-gray-500 px-4">
                {rondaapi.ultimaModificacion.fecha}
              </span>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
