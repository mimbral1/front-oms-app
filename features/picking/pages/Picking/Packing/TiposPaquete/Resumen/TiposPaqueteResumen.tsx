"use client";

import { ClipboardDocumentListIcon, MapPinIcon, XCircleIcon } from "@heroicons/react/24/outline";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import Card from "@/components/ui/card/Card";
import { Action } from "@/components/layout/page-header";
import { Chip, Input } from "@mui/material";
import { Toggle } from "@/components/ui/togle/togle";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";
import { FieldRows } from "@/components/ui/fieldrows/FieldRows";

// —– Modelo de estado —–
interface Dimensiones {
  ancho: number;
  altura: number;
  largo: number;
  cubage: number;
  pesoMaximo: number;
}

export interface PackageType {
  nombre: string;
  regla: string;
  valor: number;
  material: string;
  costoAdquisicion: number;
  retornable: boolean;
  categoriasIncompatibles: string[];
  isDefault: boolean;
  dimensiones: Dimensiones;
}

const mock: PackageType = {
  nombre: "Genérico",
  regla: "Regla A",
  valor: 0,
  material: "Mixto",
  costoAdquisicion: 100,
  retornable: true,
  categoriasIncompatibles: ["Frágil", "Voluminoso"],
  isDefault: true,
  dimensiones: {
    ancho: 10,
    altura: 20,
    largo: 30,
    cubage: 6000,
    pesoMaximo: 50,
  },
};

export function PackageTypeResumenView() {
  const router = useRouter();
  const { id } = useParams();
  const [data, setData] = useState<PackageType | null>(null);

  // Carga mock o fetch real usando id
  useEffect(() => {
    // Aquí podrías llamar a tu API con el id...
    setData(structuredClone(mock));
  }, [id]);

  // Header actions: Edit o volver
  const headerActions: Action[] = useMemo(
    () => [
      {
        label: "Editar",
        variant: "secondary",
        onClick: () => router.push(`/parametros/tipos-de-paquete/${id}/editar`),
      },
      { label: "Volver", variant: "secondary", onClick: () => router.push("/picking/packing/tipos-de-paquetes"), icon: <XCircleIcon className="h-5 w-5" /> },
    ],
    [router, id]
  );

  usePageHeader(
    () =>
      data
        ? {
          title: data.nombre,
          description: "TIPO DE PAQUETE",
          action: headerActions,
        }
        : { title: "Cargando…" },
    [data, headerActions]
  );

  if (!data) return <div className="p-6">Cargando…</div>;

  // Constantes de opciones
  const reglas = [data.regla];
  const categorias = data.categoriasIncompatibles;

  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 bg-white rounded-xl">
        {/* —– RESUMEN —– */}
        <Card
          title="RESUMEN"
          icon={ClipboardDocumentListIcon}
          hasTitleDivider
          noDefaultStyles
          className="p-6"
        >
          <div className="space-y-8">
            <FieldRows label="Nombre">
              <Input fullWidth value={data.nombre} disabled />
            </FieldRows>

            <FieldRows label="Regla">
              <Input fullWidth value={data.regla} disabled />
            </FieldRows>

            <FieldRows label="Valor">
              <Input fullWidth type="number" value={data.valor} disabled />
            </FieldRows>

            <FieldRows label="Material">
              <Input fullWidth value={data.material} disabled />
            </FieldRows>

            <FieldRows label="Costo de adquisición">
              <div className="flex items-center">
                <span className="mr-2 text-gray-600">$</span>
                <Input
                  fullWidth
                  type="number"
                  value={data.costoAdquisicion}
                  disabled
                />
              </div>
            </FieldRows>

            <FieldRows label="Retornable">
              <Toggle
                checked={data.retornable}
                disabled
                onCheckedChange={() => { }}
              />
            </FieldRows>

            <FieldRows label="Categorías incompatibles">
              <div className="flex flex-wrap gap-1">
                {data.categoriasIncompatibles.map((cat) => (
                  <Chip key={cat} label={cat} size="small" />
                ))}
              </div>
            </FieldRows>

            <FieldRows label="Default">
              <Toggle
                checked={data.isDefault}
                disabled
                onCheckedChange={() => { }}
              />
            </FieldRows>
          </div>
        </Card>

        {/* —– DIMENSIONES —– */}
        <Card
          title="DIMENSIONES"
          icon={MapPinIcon}
          hasTitleDivider
          noDefaultStyles
          className="p-6"
        >
          <div className="space-y-8">
            <FieldRows label="Ancho">
              <Input
                fullWidth
                type="number"
                value={data.dimensiones.ancho}
                disabled
              />
            </FieldRows>

            <FieldRows label="Altura">
              <Input
                fullWidth
                type="number"
                value={data.dimensiones.altura}
                disabled
              />
            </FieldRows>

            <FieldRows label="Largo">
              <Input
                fullWidth
                type="number"
                value={data.dimensiones.largo}
                disabled
              />
            </FieldRows>

            <FieldRows label="Cubage">
              <Input
                fullWidth
                type="number"
                value={data.dimensiones.cubage}
                disabled
              />
            </FieldRows>

            <FieldRows label="Peso máximo">
              <Input
                fullWidth
                type="number"
                value={data.dimensiones.pesoMaximo}
                disabled
              />
            </FieldRows>
          </div>
        </Card>
      </div>
    </div>
  );
}
