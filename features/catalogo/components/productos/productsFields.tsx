// views\CatalogoView\productos\components\productsFields.tsx
"use client";

import React from "react";
import Card from "@/components/ui/card/Card";
import {
  DocumentTextIcon,
  AdjustmentsHorizontalIcon,
  EyeIcon,
  UserIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";
import {
  Select,
  MenuItem,
  FormControl,
  Autocomplete,
  TextField,
  Chip,
} from "@mui/material";
import { ActiveStatusToggle } from "@/components/ui/togle";

export interface Product {
  Image: string | null;
  Name: string;
  Reference: string;
  Slug: string;
  SKU: string;
  Category: string;
  Brand: string;
  TotalSalesChannel: string;
  SalesChannels: string[];
  DateModified: string | null;
  UserId: string;
  Status: "Activo" | "Inactivo" | "Y" | "N" | string;
  Eans: string | null;
  UpdatedByName: string | null;
  UpdatedByEmail: string | null;
  CreateDate: string;
  CreateTime: string;
  createdAtFormatted?: string;

  // Campos opcionales para SEO y creador
  seoTitle?: string;
  seoKeywords?: string;
  seoDescription?: string;
  updatedByName?: string | null;
}

export interface SelectOption {
  label: string;
  value: string;
}

interface ProductFieldsProps {
  product: Product;
  readOnly?: boolean;
  onChange?: (field: keyof Product, value: string) => void;
  onArrayChange?: (field: keyof Product, value: string[]) => void;
  isNew: boolean;
  brandOptions?: SelectOption[];
  categoryOptions?: SelectOption[];
  salesChannelOptions?: SelectOption[];
}

export const ProductFields: React.FC<ProductFieldsProps> = ({
  product,
  readOnly = true,
  onChange,
  onArrayChange,
  isNew,
  brandOptions = [],
  categoryOptions = [],
  salesChannelOptions = [],
}) => {
  const handleChange =
    (field: keyof Product) => (event: React.ChangeEvent<HTMLInputElement>) => {
      if (onChange) {
        onChange(field, event.target.value);
      }
    };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_380px]">
      <div className="space-y-6">
        {/* Columna Izquierda */}
        {/* Card: DETALLE */}
        <Card title="DETALLE" icon={DocumentTextIcon}>
          <div className="space-y-1">
            {/* Campo: Nombre */}
            <div className="grid grid-cols-[140px_1fr] items-center gap-4 border-b border-gray-100 py-3">
              <span className="text-sm text-gray-500">Nombre</span>
              {readOnly ? (
                <span className="text-sm font-medium text-gray-900 truncate">
                  {product.Name}
                </span>
              ) : (
                <input
                  type="text"
                  value={product.Name ?? ""}
                  onChange={handleChange("Name")}
                  placeholder="Nombre del producto"
                  className="w-full bg-transparent text-sm font-medium text-gray-900 placeholder-gray-400 focus:outline-none"
                />
              )}
            </div>

            {/* Campo: Referencia (SKU) */}
            <div className="grid grid-cols-[140px_1fr] items-center gap-4 border-b border-gray-100 py-3">
              <span className="text-sm text-gray-500">Referencia</span>
              {readOnly ? (
                <span className="text-sm font-medium text-gray-900 truncate">
                  {product.SKU || "--"}
                </span>
              ) : (
                <input
                  type="text"
                  value={product.SKU ?? ""}
                  onChange={handleChange("SKU")}
                  placeholder="SKU del producto"
                  className="w-full bg-transparent text-sm font-medium text-gray-900 placeholder-gray-400 focus:outline-none"
                />
              )}
            </div>

            {/* Campo: Slug */}
            <div className="grid grid-cols-[140px_1fr] items-center gap-4 border-b border-gray-100 py-3">
              <span className="text-sm text-gray-500">Slug</span>
              {readOnly ? (
                <span className="text-sm font-medium text-gray-900 truncate">
                  {product.Slug || "--"}
                </span>
              ) : (
                <input
                  type="text"
                  value={product.Slug ?? ""}
                  onChange={handleChange("Slug")}
                  placeholder="URL del producto en tienda"
                  className="w-full bg-transparent text-sm font-medium text-gray-900 placeholder-gray-400 focus:outline-none"
                />
              )}
            </div>

            {/* Campo: Marca */}
            <div className="grid grid-cols-[140px_1fr] items-center gap-4 border-b border-gray-100 py-3">
              <span className="text-sm text-gray-500">Marca</span>
              {readOnly ? (
                <span className="text-sm font-medium text-gray-900 truncate">
                  {product.Brand}
                </span>
              ) : brandOptions.length > 0 ? (
                <FormControl fullWidth variant="standard" size="small">
                  <Select
                    value={product.Brand ?? ""}
                    onChange={(e) => onChange?.("Brand", e.target.value)}
                    disableUnderline
                    displayEmpty
                    sx={{ fontSize: "0.875rem" }}
                    renderValue={(val) => (
                      <span className={`text-sm font-medium ${val ? "text-gray-900" : "text-gray-400"}`}>
                        {val || "Seleccionar marca"}
                      </span>
                    )}
                  >
                    {brandOptions.map((opt) => (
                      <MenuItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              ) : (
                <input
                  type="text"
                  value={product.Brand ?? ""}
                  onChange={handleChange("Brand")}
                  placeholder="Marca"
                  className="w-full bg-transparent text-sm font-medium text-gray-900 placeholder-gray-400 focus:outline-none"
                />
              )}
            </div>

            {/* Campo: Categoría */}
            <div className="grid grid-cols-[140px_1fr] items-center gap-4 border-b border-gray-100 py-3">
              <span className="text-sm text-gray-500">Categoría</span>
              {readOnly ? (
                <span className="text-sm font-medium text-gray-900 truncate">
                  {product.Category}
                </span>
              ) : categoryOptions.length > 0 ? (
                <FormControl fullWidth variant="standard" size="small">
                  <Select
                    value={product.Category ?? ""}
                    onChange={(e) => onChange?.("Category", e.target.value)}
                    disableUnderline
                    displayEmpty
                    sx={{ fontSize: "0.875rem" }}
                    renderValue={(val) => (
                      <span className={`text-sm font-medium ${val ? "text-gray-900" : "text-gray-400"}`}>
                        {val || "Seleccionar categoría"}
                      </span>
                    )}
                  >
                    {categoryOptions.map((opt) => (
                      <MenuItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              ) : (
                <input
                  type="text"
                  value={product.Category ?? ""}
                  onChange={handleChange("Category")}
                  placeholder="Categoría"
                  className="w-full bg-transparent text-sm font-medium text-gray-900 placeholder-gray-400 focus:outline-none"
                />
              )}
            </div>

            {/* Campo: Canales de venta */}
            <div className="grid grid-cols-[140px_1fr] items-center gap-4 border-b border-gray-100 py-3">
              <span className="text-sm text-gray-500">Canales de venta</span>
              {readOnly ? (
                <span className="text-sm font-medium text-gray-900 truncate">
                  {product.SalesChannels?.length
                    ? product.SalesChannels.join(", ")
                    : product.TotalSalesChannel || "--"}
                </span>
              ) : salesChannelOptions.length > 0 ? (
                <Autocomplete
                  multiple
                  size="small"
                  options={salesChannelOptions}
                  getOptionLabel={(opt) => opt.label}
                  value={salesChannelOptions.filter((o) =>
                    (product.SalesChannels || []).includes(o.value)
                  )}
                  onChange={(_, selected) => {
                    onArrayChange?.("SalesChannels", selected.map((s) => s.value));
                  }}
                  renderTags={(tagValue, getTagProps) =>
                    tagValue.map((option, index) => {
                      const { key, ...restProps } = getTagProps({ index });
                      return (
                        <Chip
                          key={key}
                          label={option.label}
                          size="small"
                          {...restProps}
                        />
                      );
                    })
                  }
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      variant="standard"
                      placeholder="Seleccionar canales"
                      InputProps={{ ...params.InputProps, disableUnderline: true }}
                    />
                  )}
                  fullWidth
                  disableCloseOnSelect
                />
              ) : (
                <input
                  type="text"
                  value={product.TotalSalesChannel ?? ""}
                  onChange={handleChange("TotalSalesChannel")}
                  placeholder="Canales de venta"
                  className="w-full bg-transparent text-sm font-medium text-gray-900 placeholder-gray-400 focus:outline-none"
                />
              )}
            </div>

            {/* Campo: Estado */}
            <div className="grid grid-cols-[140px_1fr] items-center gap-4 py-3">
              <span className="text-sm text-gray-500">Estado</span>
              {readOnly ? (
                <div className="flex items-center gap-2">
                  <span className={`inline-block h-2.5 w-2.5 rounded-full ${product.Status === "Activo" ? "bg-green-500" : "bg-red-400"}`} />
                  <span className="text-sm font-medium text-gray-900">
                    {product.Status}
                  </span>
                </div>
              ) : (
                <ActiveStatusToggle
                  active={product.Status === "Activo"}
                  onActiveChange={(active) => onChange?.("Status", active ? "Activo" : "Inactivo")}
                  showStateLabel={false}
                />
              )}
            </div>
          </div>
        </Card>

        {/* Card: SEO */}
        <Card title="SEO" icon={AdjustmentsHorizontalIcon}>
          <div className="space-y-1">
            {/* Campo: Título */}
            <div className="grid grid-cols-[140px_1fr] items-center gap-4 border-b border-gray-100 py-3">
              <span className="text-sm text-gray-500">Título</span>
              {readOnly ? (
                <span className="text-sm font-medium text-gray-900 truncate">
                  {product.seoTitle || "--"}
                </span>
              ) : (
                <input
                  type="text"
                  value={product.seoTitle ?? ""}
                  onChange={handleChange("seoTitle")}
                  placeholder="Título SEO del producto"
                  className="w-full bg-transparent text-sm font-medium text-gray-900 placeholder-gray-400 focus:outline-none"
                />
              )}
            </div>

            {/* Campo: Palabras clave */}
            <div className="grid grid-cols-[140px_1fr] items-center gap-4 border-b border-gray-100 py-3">
              <span className="text-sm text-gray-500">Palabras clave</span>
              {readOnly ? (
                <span className="text-sm font-medium text-gray-900 truncate">
                  {product.seoKeywords || "--"}
                </span>
              ) : (
                <input
                  type="text"
                  value={product.seoKeywords ?? ""}
                  onChange={handleChange("seoKeywords")}
                  placeholder="Palabras clave separadas por coma"
                  className="w-full bg-transparent text-sm font-medium text-gray-900 placeholder-gray-400 focus:outline-none"
                />
              )}
            </div>

            {/* Campo: Descripción */}
            <div className="grid grid-cols-[140px_1fr] items-center gap-4 py-3">
              <span className="text-sm text-gray-500">Descripción</span>
              {readOnly ? (
                <span className="text-sm font-medium text-gray-900 truncate">
                  {product.seoDescription || "--"}
                </span>
              ) : (
                <input
                  type="text"
                  value={product.seoDescription ?? ""}
                  onChange={handleChange("seoDescription")}
                  placeholder="Descripción para buscadores"
                  className="w-full bg-transparent text-sm font-medium text-gray-900 placeholder-gray-400 focus:outline-none"
                />
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* Columna Derecha */}
      {!isNew && (
        <div className="space-y-6">
          {/* Card: VISTA PREVIA */}
          <Card title="VISTA PREVIA" icon={EyeIcon}>
            <div className="flex flex-col items-center gap-3 py-2">
              <div className="flex h-44 w-44 items-center justify-center overflow-hidden rounded-lg border border-gray-100 bg-gray-50 p-2">
                <img
                  src={product.Image || "https://tumayorferretero.net/22457-large_default/producto-generico.jpg"}
                  alt={product.Name}
                  className="max-h-full max-w-full object-contain"
                />
              </div>
              <span className="text-sm font-medium text-gray-900">
                {product.Name || ""}
              </span>
            </div>
          </Card>

          {/* Card: USUARIO CREADOR */}
          <Card title="USUARIO CREADOR" icon={UserIcon}>
            <div className="space-y-1">
              <div className="flex items-center justify-end py-2">
                <span className="text-xs text-gray-400 italic">
                  {product.createdAtFormatted || ""}
                </span>
              </div>
            </div>
          </Card>

          {/* Card: ÚLTIMA MODIFICACIÓN */}
          <Card title="ÚLTIMA MODIFICACIÓN" icon={ClockIcon}>
            <div className="flex items-center justify-end py-2">
              <span className="text-xs text-gray-400 italic">
                {product.DateModified || "Sin modificaciones"}
              </span>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
