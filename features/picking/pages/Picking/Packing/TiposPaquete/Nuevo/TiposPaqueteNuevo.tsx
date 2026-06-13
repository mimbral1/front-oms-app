"use client";

import { CheckCircleIcon, ClipboardDocumentListIcon, XCircleIcon } from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import Card from "@/components/ui/card/Card";
import { Action } from "@/components/layout/page-header";
import { Chip, FormControl, Input, MenuItem, Select } from "@mui/material";
import { Toggle } from "@/components/ui/togle/togle";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";
import { FieldRows } from "@/components/ui/fieldrows/FieldRows";
import { CollapsibleField } from "@/components/ui/collapsible/collapsiblefield";
import { Box } from "lucide-react";

// —– Modelo de estado —–
interface Dimensiones {
  ancho: number;
  altura: number;
  largo: number;
  cubage: number;
  pesoMaximo: number;
}

export interface PackageTypeDraft {
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

const initialState: PackageTypeDraft = {
  nombre: "",
  regla: "",
  valor: 0,
  material: "",
  costoAdquisicion: 0,
  retornable: false,
  categoriasIncompatibles: [],
  isDefault: false,
  dimensiones: {
    ancho: 0,
    altura: 0,
    largo: 0,
    cubage: 0,
    pesoMaximo: 0,
  },
};

export function PackageTypeCreateView() {
  const router = useRouter();
  const [draft, setDraft] = useState<PackageTypeDraft>(initialState);

  const update = <K extends keyof PackageTypeDraft>(
    key: K,
    value: PackageTypeDraft[K]
  ) => {
    setDraft((d) => ({ ...d, [key]: value }));
  };

  // —– Acciones del header —–
  const headerActions: Action[] = useMemo(
    () => [
      {
        label: "Aplicar",
        variant: "secondary",
        onClick: () => {
          /* aquí podrías aplicar sin salir */
        },
        icon: <CheckCircleIcon className="h-5 w-5" />,
      },
      {
        label: "Guardar",
        variant: "success",
        onClick: () => {
          console.log("Guardar payload:", draft);
          router.push("/parametros/tipos-de-paquete");
        },
      },
      {
        label: "Guardar & Crear nuevo",
        variant: "success",
        onClick: () => {
          console.log("Guardar y reiniciar:", draft);
          setDraft(initialState);
        },
      },
      {
        label: "Volver al listado",
        variant: "secondary",
        onClick: () => router.push("/picking/packing/tipos-de-paquetes"),
        icon: <XCircleIcon className="h-5 w-5" />,
      },
    ],
    [router, draft]
  );

  usePageHeader(
    () => ({
      title: "Nuevo",
      description: "TIPO DE PAQUETE",
      action: headerActions,
    }),
    [headerActions]
  );

  // Opciones de ejemplo para regla y categorías
  const reglas = ["Regla A", "Regla B", "Regla C"];
  const categorias = ["Frágil", "Peligroso", "Voluminoso"];

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
              <Input
                fullWidth
                value={draft.nombre}
                onChange={(e) => update("nombre", e.target.value)}
              />
            </FieldRows>

            <FieldRows label="Regla">
              <CollapsibleField
                inline
                label=""
                // pasamos directamente el array de strings, no objetos
                options={reglas}
                value={draft.regla}
                onChange={(v: string) => update("regla", v)}
              />
            </FieldRows>

            <FieldRows label="Valor">
              <Input
                fullWidth
                type="number"
                value={draft.valor}
                onChange={(e) => update("valor", Number(e.target.value) || 0)}
              />
            </FieldRows>

            <FieldRows label="Material">
              <Input
                fullWidth
                value={draft.material}
                onChange={(e) => update("material", e.target.value)}
              />
            </FieldRows>

            <FieldRows label="Costo de adquisición">
              <div className="flex items-center">
                <span className="mr-2 text-gray-600">$</span>
                <Input
                  fullWidth
                  type="number"
                  value={draft.costoAdquisicion}
                  onChange={(e) =>
                    update("costoAdquisicion", Number(e.target.value) || 0)
                  }
                />
              </div>
            </FieldRows>

            <FieldRows label="Retornable">
              <Toggle
                checked={draft.retornable}
                onCheckedChange={(v) => update("retornable", v)}
              />
            </FieldRows>

            <FieldRows label="Categorías incompatibles">
              <div className="flex items-center justify-between w-full">
                <FormControl variant="standard" fullWidth>
                  <Select
                    labelId="label-categorias"
                    multiple
                    value={draft.categoriasIncompatibles}
                    onChange={(e) =>
                      update(
                        "categoriasIncompatibles",
                        e.target.value as string[]
                      )
                    }
                    renderValue={(selected: string[]) => (
                      <div className="flex flex-wrap gap-1">
                        {selected.map((cat) => (
                          <Chip key={cat} label={cat} size="small" />
                        ))}
                      </div>
                    )}
                    disabled={false} // o tu flag de solo-lectura
                  >
                    {categorias.map((opt) => (
                      <MenuItem key={opt} value={opt}>
                        {opt}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </div>
            </FieldRows>

            <FieldRows label="Default">
              <Toggle
                checked={draft.isDefault}
                onCheckedChange={(v) => update("isDefault", v)}
              />
            </FieldRows>
          </div>
        </Card>

        {/* —– DIMENSIONES —– */}
        <Card
          title="DIMENSIONES"
          icon={Box}
          hasTitleDivider
          noDefaultStyles
          className="p-6"
        >
          <div className="space-y-8">
            <FieldRows label="Ancho">
              <Input
                fullWidth
                type="number"
                value={draft.dimensiones.ancho}
                onChange={(e) =>
                  update("dimensiones", {
                    ...draft.dimensiones,
                    ancho: Number(e.target.value) || 0,
                  })
                }
              />
            </FieldRows>

            <FieldRows label="Altura">
              <Input
                fullWidth
                type="number"
                value={draft.dimensiones.altura}
                onChange={(e) =>
                  update("dimensiones", {
                    ...draft.dimensiones,
                    altura: Number(e.target.value) || 0,
                  })
                }
              />
            </FieldRows>

            <FieldRows label="Largo">
              <Input
                fullWidth
                type="number"
                value={draft.dimensiones.largo}
                onChange={(e) =>
                  update("dimensiones", {
                    ...draft.dimensiones,
                    largo: Number(e.target.value) || 0,
                  })
                }
              />
            </FieldRows>

            <FieldRows label="Cubage">
              <Input
                fullWidth
                type="number"
                value={draft.dimensiones.cubage}
                onChange={(e) =>
                  update("dimensiones", {
                    ...draft.dimensiones,
                    cubage: Number(e.target.value) || 0,
                  })
                }
              />
            </FieldRows>

            <FieldRows label="Peso máximo">
              <Input
                fullWidth
                type="number"
                value={draft.dimensiones.pesoMaximo}
                onChange={(e) =>
                  update("dimensiones", {
                    ...draft.dimensiones,
                    pesoMaximo: Number(e.target.value) || 0,
                  })
                }
              />
            </FieldRows>
          </div>
        </Card>
      </div>
    </div>
  );
}
