// views/CatalogoView/categorias/Components/DetailFields.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import Card from "@/components/ui/card/Card";
import { FaClipboardList, FaPen } from "react-icons/fa";
import { FaUser } from "react-icons/fa";
import {
  FormControl,
  MenuItem,
  Select,
  Chip as MuiChip,
  SelectChangeEvent,
  TextField,
  Autocomplete,
} from "@mui/material";
import { FieldRows } from "@/components/ui/fieldrows/FieldRows";

import { useFetchWithAuth } from "@/lib/http/client";

// Interfaz para un elemento de categoría de la API
interface APICategoryItem {
  Code: string;
  Name: string;
}

type CategoryAPIResponse = APICategoryItem[];

export interface category {
  id: string;
  name: string;
  reference: string;
  parent: string;
  Icategories: string[]; // Múltiples categorías incompatibles (nombres)
  parentLink: string;
  accounts: string[]; // ESTO NO SE TOCA
  slug: string;
  status: "Active" | "Inactive";
  seoTitle?: string;
  seoKeywords?: string;
  seoDescription?: string;
  creatorUser: string;
  createdAt: string;
  updateAt: string;
}

interface DetailFieldsProps {
  category: category;
  readOnly?: boolean;
  onChange?: <K extends keyof category>(field: K, value: category[K]) => void;
}

const CustomChip = ({ text }: { text: string }) => (
  <span className="mr-2 inline-flex items-center rounded bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
    {text}
  </span>
);

/** Muestra los campos de la categoría en 2 columnas */
export const DetailFields: React.FC<DetailFieldsProps> = ({
  category,
  readOnly = false,
  onChange,
}) => {
  const { fetchWithAuth } = useFetchWithAuth();

  const [allCategoriesOptions, setAllCategoriesOptions] = useState<{ label: string; value: string }[]>([]);
  const [selectedIncompatibleCategories, setSelectedIncompatibleCategories] = useState<{ label: string; value: string }[]>([]);

  const [selectedAccounts, setSelectedAccounts] = useState<string[]>(category.accounts);


  // Función para obtener todas las categorías (para el Autocomplete)
  const fetchAllCategories = useCallback(async () => {
    try {
      const url = `catalog/getcategory?pageSize=9999`;

      // 👇 Ahora usamos fetchWithAuth en vez de fetch normal
      const data: CategoryAPIResponse = await fetchWithAuth(url);

      if (!Array.isArray(data)) {
        console.error("La respuesta de la API no es un array válido para categorías:", data);
        setAllCategoriesOptions([]);
        setSelectedIncompatibleCategories([]);
        return;
      }

      const mappedOptions = data.map(item => ({
        label: item.Name,
        value: item.Code,
      }));

      const uniqueLabelsMap = new Map<string, number>();
      const optionsWithUniqueLabels = mappedOptions.map(option => {
        const count = uniqueLabelsMap.get(option.label) || 0;
        uniqueLabelsMap.set(option.label, count + 1);
        if (count > 0) {
          return {
            label: `${option.label} (${option.value})`,
            value: option.value,
          };
        }
        return option;
      });

      const sortedMappedOptions = [...optionsWithUniqueLabels].sort((a, b) => a.label.localeCompare(b.label));
      const uniqueOptionsByCode = Array.from(new Map(sortedMappedOptions.map(item => [item.value, item])).values());

      setAllCategoriesOptions(uniqueOptionsByCode);

      if (category.Icategories && category.Icategories.length > 0) {
        const initialSelected = category.Icategories
          .map(name => uniqueOptionsByCode.find(opt => opt.label === name))
          .filter(Boolean) as { label: string; value: string }[];
        setSelectedIncompatibleCategories(initialSelected);
      } else {
        setSelectedIncompatibleCategories([]);
      }

    } catch (err) {
      console.error("Error al cargar todas las categorías para el filtro de incompatibles:", err);
    }
  }, [category.Icategories, fetchWithAuth]);

  useEffect(() => {
    fetchAllCategories();
  }, [fetchAllCategories]);

  const handleIncompatibleCategoriesChange = (
    event: React.SyntheticEvent,
    newValue: { label: string; value: string }[]
  ) => {
    setSelectedIncompatibleCategories(newValue);
    onChange?.("Icategories", newValue.map(item => item.label));
  };

  const handleAccountsChange = (event: SelectChangeEvent<string[]>, child: React.ReactNode) => {
    const value = event.target.value as string[];
    setSelectedAccounts(value);
    onChange?.("accounts", value);
  };

  const hasChips = selectedIncompatibleCategories.length > 0;

  return (
    <div className="flex-1 bg-white p-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Columna izquierda (2/3) */}
        <div className="lg:col-span-2 space-y-6">
          {/* ─────────────── DETALLE ─────────────── */}
          <Card
            title="DETALLE"
            icon={FaClipboardList}
            noDefaultStyles
            hasTitleDivider
            className="rounded-xl bg-white p-6 shadow-sm"
          >
            <div className="space-y-10">
              {/* Nombre */}
              <div className="flex flex-col pb-2">
                <FieldRows label="Nombre" className="border-b border-gray-300">
                  <span className="text-sm font-medium text-gray-900">
                    {category.name}
                  </span>
                </FieldRows>
              </div>

              {/* Reference */}
              <div className="flex flex-col pb-2">
                <FieldRows
                  label="Reference"
                  className="border-b border-gray-300"
                >
                  <span className="text-sm font-medium text-gray-900">
                    {category.reference}
                  </span>
                </FieldRows>
              </div>
              <div className="flex flex-col pb-2">
                <FieldRows
                  label="Padre"
                  className="border-b border-gray-300"
                >
                  <span className="text-sm font-medium text-gray-900">
                    {category.parent}
                  </span>
                </FieldRows>
              </div>

              {/* Categorías incompatibles (AUTOCOMPLETE - AJUSTADO PARA USAR CODE COMO VALUE) */}
              <div className="flex flex-col w-full py-2">
                <FieldRows label="Categorías incompatibles">
                  <div className="w-full">
                    <Autocomplete
                      multiple
                      id="incompatible-categories-autocomplete"
                      options={allCategoriesOptions} // allCategoriesOptions contiene { label: Name, value: Code }
                      getOptionLabel={(option) => option.label} // Muestra el Name al usuario
                      // IMPORTANTE: Dice a Autocomplete que dos opciones son iguales si tienen el mismo `Code`
                      isOptionEqualToValue={(option, value) => option.value === value.value}
                      value={selectedIncompatibleCategories}
                      onChange={handleIncompatibleCategoriesChange}
                      renderTags={(tagValue, getTagProps) => {
                        // --- DEBUGGING: Corroborar keys de los chips renderizados ---
                        const renderedChipsData = tagValue.map((option, index) => {
                          const key = `${option.value}-${index}`;
                          // console.log(`Key: ${key}, Label: ${option.label}, Value: ${option.value}`);
                          return { option, index, key }; // Devuelve los datos para el renderizado
                        }).sort((a, b) => a.key.localeCompare(b.key)); // Opcional: ordenar para consola
                        // FIN DEBUGGING

                        return renderedChipsData.map(({ option, index, key }) => (
                          <MuiChip
                            label={option.label} // Muestra el Name en el chip
                            {...getTagProps({ index })}
                            key={key} // Usamos la key que generamos y depuramos
                            disabled={readOnly}
                          />
                        ));
                      }}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          variant="standard"
                          placeholder={
                            readOnly
                              ? (hasChips ? "" : "N/A")
                              : (hasChips ? "" : "Selecciona o escribe para filtrar...")
                          }
                          InputProps={{
                            ...params.InputProps,
                            readOnly: readOnly,
                          }}
                        />
                      )}
                      readOnly={readOnly}
                    />
                  </div>
                </FieldRows>
              </div>

              {/* Enlace principal */}
              <div className="flex justify-between border-gray-300 pb-2">
                <FieldRows label="Enlace principal">
                  <a className="text-sm font-medium text-blue-600">
                    {category.parentLink || "N/A"}
                  </a>
                </FieldRows>
              </div>

              {/* Cuentas (hardcodeada) */}
              <div className="flex flex-col justify-between py-2">
                <FieldRows label="Cuentas">
                  <div className="w-full">
                    <FormControl variant="standard" fullWidth>
                      <Select
                        labelId="label-accounts"
                        multiple
                        value={selectedAccounts}
                        onChange={handleAccountsChange}
                        renderValue={(selected: string[]) => (
                          <div className="flex flex-wrap gap-1">
                            {selected.map((n, index) => (
                              <MuiChip
                                key={`${n}-${index}`}
                                label={n}
                                onDelete={() => {
                                  if (readOnly) return;
                                  const newSelected = selectedAccounts.filter(
                                    (item) => item !== n
                                  );
                                  setSelectedAccounts(newSelected);
                                  onChange?.("accounts", newSelected);
                                }}
                                disabled={readOnly}
                              />
                            ))}
                          </div>
                        )}
                        disabled={readOnly}
                      >
                        {/* Opciones hardcodeadas para Cuentas */}
                        {["La Torre", "Husqvarna", "Otra Cuenta"].map((opt) => (
                          <MenuItem key={opt} value={opt}>
                            {opt}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </div>
                </FieldRows>
              </div>

              {/* Slug */}
              <div className="flex flex-col pb-2">
                <FieldRows label="Slug" className="border-b border-gray-300">
                  <span className="text-sm font-medium text-gray-900">
                    {category.slug || "--"}
                  </span>
                </FieldRows>
              </div>

              {/* Estado */}
              <div className="flex flex-col pb-2">
                <FieldRows label="Estado" className="border-b border-gray-300">
                  <FormControl variant="standard" fullWidth>
                    <Select
                      value={category.status}
                      onChange={(e) => onChange?.("status", e.target.value as "Active" | "Inactive")}
                      disabled={readOnly}
                    >
                      <MenuItem value="Active">Activo</MenuItem>
                      <MenuItem value="Inactive">Inactivo</MenuItem>
                    </Select>
                  </FormControl>
                </FieldRows>
              </div>
            </div>
          </Card>

          {/* ─────────────── SEO ─────────────── */}
          <Card
            title="SEO"
            icon={FaClipboardList}
            noDefaultStyles
            hasTitleDivider
            className="rounded-xl bg-white p-6 shadow-sm"
          >
            <div className="space-y-10">
              {/* Título */}
              <div className="flex flex-col pb-2">
                <FieldRows label="Título" className="border-b border-gray-300">
                  <span className="text-sm font-medium text-gray-900">
                    {category.seoTitle || "--"}
                  </span>
                </FieldRows>
              </div>

              {/* Palabras clave */}
              <div className="flex flex-col pb-2">
                <FieldRows label="Palabras clave" className="border-b border-gray-300">
                  <span className="text-sm font-medium text-gray-900">
                    {category.seoKeywords || "--"}
                  </span>
                </FieldRows>
              </div>

              {/* Descripción */}
              <div className="flex flex-col pb-2">
                <FieldRows label="Descripción" className="border-b border-gray-300">
                  <span className="text-sm font-medium text-gray-900">
                    {category.seoDescription || "--"}
                  </span>
                </FieldRows>
              </div>
            </div>
          </Card>
        </div>

        {/* Columna derecha (1/3) */}
        <div className="space-y-6">
          {/* USUARIO CREADOR */}
          <Card
            title="USUARIO CREADOR"
            icon={FaUser}
            noDefaultStyles
            hasTitleDivider
            className="rounded-xl bg-white p-6 shadow-sm"
          >
            <div className="flex flex-col space-y-4 text-sm text-gray-700">
              <div className="flex items-center justify-between">
                <span>Usuario</span>
                <span className="font-medium">{category.creatorUser || "--"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Fecha de creación</span>
                <span className="font-medium">{category.createdAt || "--"}</span>
              </div>
            </div>
          </Card>
          <Card
            title="ÚLTIMA MODIFICACIÓN"
            icon={FaPen}
            noDefaultStyles
            hasTitleDivider
            className="rounded-xl bg-white p-6 shadow-sm"
          >
            <div className="flex flex-col space-y-4 text-sm text-gray-700">
              <div className="flex items-center justify-between">
                <span>Fecha de última modificación</span>
                <span className="font-medium">{category.updateAt || "--"}</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};