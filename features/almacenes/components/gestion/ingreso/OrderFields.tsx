// views\Almacen\Gestion\Ingreso\components\OrderFields.tsx

"use client";

import React from "react";
import Card from "@/components/ui/card/Card";
import {
  HomeIcon,
  TagIcon,
  UserIcon,
  PencilIcon,
} from "@heroicons/react/24/outline";
import { SelectSearchInline } from "@/components/ui/collapsible/selectSearchInline";
import { DateRangeFilter, type DateRange } from "@/components/ui/date-range-picker";
import { FaClipboardList } from "react-icons/fa";

export interface Order {
  id?: string;
  inventory: string;
  slot: string;
  estimatedFrom: string;
  estimatedTo: string;
  deliveryNote: string;
  invoice: string;
  vendorName: string;
  vendorCode: string;
  assignedTo: string;
  docStatus: "O" | "C";
  items: {
    sku: string;
    quantity: string;
    batch?: string;
    elabDate?: string;
    expDate?: string;
  };
  created: { username: string; email: string; date: string };
  modified?: { username: string; email: string; date: string };
  comments?: string;
}

type OpenLineLite = {
  itemSku: string;
  itemLabel?: string;
  itemImage?: string;
  orderedQty?: number;
  openQty?: number;
};

type OpenLineFull = OpenLineLite & { lineNum: number; poDocEntry: number };

type SupplierOption = {
  value: string;
  label: string;
  vendorName: string;
  vendorCode: string;
};

type AssignedOption = {
  value: string;
  label: string;
};

interface OrderFieldsProps {
  order: Order;
  readOnly?: boolean;
  readOnlyInventory?: boolean;
  readOnlyEstimatedDate?: boolean;
  showDetailInventory?: boolean;
  showDetailSlot?: boolean;
  showDetailEstimatedDate?: boolean;
  showDetailDeliveryNote?: boolean;
  showDetailInvoice?: boolean;
  showDetailSupplier?: boolean;
  readOnlySupplier?: boolean;
  showDetailAssignedTo?: boolean;
  readOnlySlot?: boolean;
  readOnlyAssignedTo?: boolean;
  onChange?: (field: keyof Order, value: string) => void;
  lines?: OpenLineFull[];
  inventoryOptions?: Array<{ value: string; label: string }>;
  slotOptions?: Array<{ value: string; label: string }>;
  assignedOptions?: AssignedOption[];
  supplierOptions?: SupplierOption[];
  skuOptions?: Array<{ value: string; label: string }>;
  showEntradaMercancia?: boolean;
  showCreationSection?: boolean;
  // ▼▼ NUEVO
  emHeader?: EMHeader;
  onEmChange?: (field: keyof EMHeader, value: string | number) => void;
  onLineQtyChange?: (lineNum: number, qty: number) => void;
  onLineSkuChange?: (lineNum: number, sku: string) => void;
  onAddItemLine?: () => void;
  onRemoveItemLine?: (lineNum: number) => void;
  showRemoveItemLineButton?: boolean;
  getLineQty?: (lineNum: number) => number;
  // ▲▲
}

// interface OrderFieldsProps {
//   order: Order;
//   readOnly?: boolean;
//   onChange?: (field: keyof Order, value: string) => void;
//   lines?: OpenLineLite[];
// }

type EMHeader = {
  docType: "EP";
  toWh: string;
  reference: string;
  user: string;
  source: string;
  series: string;
  indicator: number | string;
  prefix: string;
  folioNumber: number | string;
  externalRef: string;
  comments: string;
  cardCode?: string;
};

export const OrderFields: React.FC<OrderFieldsProps> = ({
  order,
  readOnly = true,
  readOnlyInventory = false,
  readOnlyEstimatedDate = false,
  showDetailInventory = true,
  showDetailSlot = true,
  showDetailEstimatedDate = true,
  showDetailDeliveryNote = true,
  showDetailInvoice = true,
  showDetailSupplier = true,
  readOnlySupplier = false,
  showDetailAssignedTo = true,
  readOnlySlot = false,
  readOnlyAssignedTo = false,
  onChange,
  lines = [],
  inventoryOptions = [],
  slotOptions = [],
  assignedOptions = [],
  supplierOptions = [],
  skuOptions = [],
  showEntradaMercancia = true,
  showCreationSection = true,
  //
  emHeader,
  onEmChange,
  onLineQtyChange,
  onLineSkuChange,
  onAddItemLine,
  onRemoveItemLine,
  showRemoveItemLineButton = true,
  getLineQty
}) => {
  const handle = (field: keyof Order) => (val: string) => onChange?.(field, val);
  const showRightColumn = showCreationSection && (Boolean(order.created) || Boolean(order.modified));
  const labelClass = "col-span-2 text-sm font-medium text-slate-600";
  const fieldShellClass = "col-span-4 rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-sm";
  const inputClass = "w-full bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none";
  const [inventorySearchQuery, setInventorySearchQuery] = React.useState("");
  const [slotSearchQuery, setSlotSearchQuery] = React.useState("");
  const [supplierSearchQuery, setSupplierSearchQuery] = React.useState("");
  const [assignedSearchQuery, setAssignedSearchQuery] = React.useState("");
  const [lineQtyDraft, setLineQtyDraft] = React.useState<Record<number, string>>({});

  const toDateOnly = (value?: string) => {
    if (!value) return "";
    return String(value).split("T")[0] || "";
  };

  const estimatedRange: DateRange | null =
    order.estimatedFrom && order.estimatedTo
      ? { start: toDateOnly(order.estimatedFrom), end: toDateOnly(order.estimatedTo) }
      : null;

  const displayLines = React.useMemo<OpenLineFull[]>(() => {
    if ((lines ?? []).length > 0) return lines;

    const sku = String(order.items?.sku ?? "").trim();
    const qtyRaw = String(order.items?.quantity ?? "").trim();
    if (!sku && !qtyRaw) {
      if (readOnly) return [];
      return [
        {
          itemSku: "-",
          orderedQty: 0,
          openQty: 0,
          lineNum: 0,
          poDocEntry: 0,
        },
      ];
    }

    const qty = Number(qtyRaw);
    const safeQty = Number.isFinite(qty) ? qty : 0;

    return [
      {
        itemSku: sku || "-",
        orderedQty: safeQty,
        openQty: safeQty,
        lineNum: 0,
        poDocEntry: 0,
      },
    ];
  }, [lines, order.items?.sku, order.items?.quantity, readOnly]);

  const canEditLineQty = Boolean(onLineQtyChange);
  const canEditLineSku = Boolean(onLineSkuChange);
  const isInventoryReadOnly = readOnly || readOnlyInventory;
  const isEstimatedDateReadOnly = readOnly || readOnlyEstimatedDate;
  const isSupplierReadOnly = readOnly || readOnlySupplier;
  const selectedInventoryLabel = React.useMemo(() => {
    if (!order.inventory) return "";

    const selectedInventory = inventoryOptions.find((option) => option.value === order.inventory);
    return selectedInventory?.label || order.inventory;
  }, [inventoryOptions, order.inventory]);

  const selectedSupplierValue = React.useMemo(() => {
    if (!supplierOptions.length) return "";

    const byCode = supplierOptions.find((supplier) => supplier.vendorCode === order.vendorCode);
    if (byCode) return byCode.value;

    const byName = supplierOptions.find((supplier) => supplier.vendorName === order.vendorName);
    return byName?.value || "";
  }, [supplierOptions, order.vendorCode, order.vendorName]);

  const selectedSlotLabel = React.useMemo(() => {
    if (!order.slot) return "";

    const selectedSlot = slotOptions.find((option) => option.value === order.slot);
    return selectedSlot?.label || order.slot;
  }, [slotOptions, order.slot]);

  const selectedAssignedLabel = React.useMemo(() => {
    if (!order.assignedTo) return "";

    const selectedAssigned = assignedOptions.find((option) => option.value === order.assignedTo);
    return selectedAssigned?.label || order.assignedTo;
  }, [assignedOptions, order.assignedTo]);

  return (
    <div className="space-y-6">
      {/* ─── DETALLE ─── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card
            title="DETALLE"
            icon={FaClipboardList}
            noDefaultStyles
            hasTitleDivider
            className="rounded-xl bg-white p-6"
          >
            {/* Grilla 12 cols => 2 campos por fila (cada campo = label 1 + control 5) */}
            <div className="grid grid-cols-12 gap-x-6 gap-y-6">
              {/* Inventario */}
              {showDetailInventory && (
                <>
                  <span className={labelClass}>Inventario</span>
                  <div className={isInventoryReadOnly ? `${fieldShellClass} flex items-center gap-2` : "col-span-4"}>
                    {isInventoryReadOnly ? (
                      <>
                        <HomeIcon className="h-4 w-4 text-slate-400" />
                        <span className="truncate text-sm font-medium text-slate-900">{selectedInventoryLabel || "-"}</span>
                      </>
                    ) : (
                      <SelectSearchInline
                        id="inventory"
                        label="Inventario"
                        value={order.inventory}
                        options={inventoryOptions}
                        searchQuery={inventorySearchQuery}
                        onSearch={setInventorySearchQuery}
                        onChange={(value) => handle("inventory")(value)}
                      />
                    )}
                  </div>
                </>
              )}

              {/* Slot de descarga */}
              {showDetailSlot && (
                <>
                  <span className={labelClass}>Slot de descarga</span>
                  <div className={(readOnly || readOnlySlot) ? `${fieldShellClass} flex items-center gap-2` : "col-span-4"}>
                    {(readOnly || readOnlySlot) ? (
                      <>
                        <TagIcon className="h-4 w-4 text-slate-400" />
                        <span className="text-sm font-medium text-slate-900">{selectedSlotLabel || "-"}</span>
                      </>
                    ) : (
                      <SelectSearchInline
                        id="slot"
                        label="Slot de descarga"
                        value={order.slot}
                        options={slotOptions}
                        searchQuery={slotSearchQuery}
                        onSearch={setSlotSearchQuery}
                        onChange={(value) => handle("slot")(value)}
                      />
                    )}
                  </div>
                </>
              )}

              {/* Fecha estimada (rango from/to estilo filtros) */}
              {showDetailEstimatedDate && (
                <>
                  <span className={labelClass}>Fecha estimada</span>
                  <div className="col-span-4 max-w-[460px]">
                    {isEstimatedDateReadOnly ? (
                      order.estimatedFrom || order.estimatedTo ? (
                        <div className="grid grid-cols-1 gap-2 rounded-lg border border-slate-200 bg-white p-2 shadow-sm sm:grid-cols-2">
                          <div className="rounded-md bg-slate-50 px-3 py-2">
                            <span className="block text-[11px] font-semibold uppercase tracking-wide text-slate-500">Desde</span>
                            <span className="block text-sm font-semibold text-slate-900">{order.estimatedFrom || "-"}</span>
                          </div>
                          <div className="rounded-md bg-slate-50 px-3 py-2">
                            <span className="block text-[11px] font-semibold uppercase tracking-wide text-slate-500">Hasta</span>
                            <span className="block text-sm font-semibold text-slate-900">{order.estimatedTo || "-"}</span>
                          </div>
                        </div>
                      ) : (
                        <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-500 shadow-sm">
                          Sin rango definido
                        </div>
                      )
                    ) : (
                      <DateRangeFilter
                        label="Seleccionar rango de fechas estimada"
                        value={estimatedRange}
                        onChange={(range) => {
                          if (!range) {
                            onChange?.("estimatedFrom", "");
                            onChange?.("estimatedTo", "");
                            return;
                          }
                          onChange?.("estimatedFrom", range.start);
                          onChange?.("estimatedTo", range.end);
                        }}
                      />
                    )}
                  </div>
                </>
              )}

              {/* Guía de despacho # */}
              {showDetailDeliveryNote && (
                <>
                  <span className={labelClass}>Guía de despacho #</span>
                  <div className={fieldShellClass}>
                    {readOnly ? (
                      <span className="text-sm font-medium text-slate-900">{order.deliveryNote || "-"}</span>
                    ) : (
                      <input
                        value={order.deliveryNote}
                        onChange={(e) => handle("deliveryNote")(e.target.value)}
                        className={inputClass}
                        placeholder="Ingresa guía de despacho"
                      />
                    )}
                  </div>
                </>
              )}

              {/* Factura # */}
              {showDetailInvoice && (
                <>
                  <span className={labelClass}>Factura #</span>
                  <div className={fieldShellClass}>
                    {readOnly ? (
                      <span className="text-sm font-medium text-slate-900">{order.invoice || "-"}</span>
                    ) : (
                      <input
                        value={order.invoice}
                        onChange={(e) => handle("invoice")(e.target.value)}
                        className={inputClass}
                        placeholder="Ingresa número de factura"
                      />
                    )}
                  </div>
                </>
              )}

              {/* Proveedor */}
              {showDetailSupplier && (
                <>
                  <span className={labelClass}>Proveedor</span>
                  <div className={isSupplierReadOnly ? fieldShellClass : "col-span-4"}>
                    {isSupplierReadOnly ? (
                      <span className="block text-sm font-medium text-slate-900">
                        {`${order.vendorName || ""}${order.vendorCode ? ` - ${order.vendorCode}` : ""}` || "-"}
                      </span>
                    ) : (
                      <SelectSearchInline
                        id="supplier"
                        label="Proveedor"
                        value={selectedSupplierValue}
                        options={supplierOptions.map((supplier) => ({ value: supplier.value, label: supplier.label }))}
                        searchQuery={supplierSearchQuery}
                        onSearch={setSupplierSearchQuery}
                        onChange={(value) => {
                          const selected = supplierOptions.find((supplier) => supplier.value === value);
                          if (!selected) {
                            onChange?.("vendorName", "");
                            onChange?.("vendorCode", "");
                            return;
                          }

                          onChange?.("vendorName", selected.vendorName);
                          onChange?.("vendorCode", selected.vendorCode);
                        }}
                      />
                    )}
                  </div>
                </>
              )}

              {/* Asignado */}
              {showDetailAssignedTo && (
                <>
                  <span className={labelClass}>Asignado</span>
                  <div className={fieldShellClass}>
                    {(readOnly || readOnlyAssignedTo) ? (
                      <span className="text-sm font-medium text-slate-900">{selectedAssignedLabel || "-"}</span>
                    ) : (
                      <SelectSearchInline
                        id="assigned-to"
                        label="Asignado"
                        value={order.assignedTo}
                        options={assignedOptions}
                        searchQuery={assignedSearchQuery}
                        onSearch={setAssignedSearchQuery}
                        onChange={(value) => handle("assignedTo")(value)}
                      />
                    )}
                  </div>
                </>
              )}
            </div>
          </Card>

          {/* ─── ENTRADA DE MERCANCÍA ─── */}
          {showEntradaMercancia && (
            <Card
              title="ENTRADA DE MERCANCÍA"
              icon={TagIcon}
              noDefaultStyles
              hasTitleDivider
              className="rounded-xl p-6"
            >
              <div className="grid grid-cols-12 gap-x-6 gap-y-6">
                {/* toWh (readonly, desde OC)
              <span className="col-span-1 text-sm text-gray-600">Inventario destino</span>
              <div className="col-span-5">
                <div className="w-full border-b border-gray-300 pb-2">
                  <span className="block text-sm text-gray-900">{emHeader?.toWh ?? ""}</span>
                </div>
              </div> */}
                {/* toWh (readonly, desde OC) */}
                <span className="col-span-1 text-sm text-gray-600">Inventario destino</span>
                <div className="col-span-5">
                  <div className="w-full border-b-2 border-indigo-400 pb-2">
                    <span className="block text-sm text-gray-900">{emHeader?.toWh ?? ""}</span>
                  </div>
                </div>

                {/* Usuario (editable) */}
                <span className="col-span-1 text-sm text-gray-600">Usuario</span>
                <div className="col-span-5">
                  <input
                    value={emHeader?.user ?? ""}
                    onChange={(e) => onEmChange?.("user", e.target.value)}
                    className="w-full border-b border-gray-300 focus:outline-none text-sm text-gray-900"
                    placeholder="usuario"
                  />
                </div>

                {/* Reference (readonly)
              <span className="col-span-1 text-sm text-gray-600">Referencia</span>
              <div className="col-span-5">
                <div className="w-full border-b border-gray-300 pb-2">
                  <span className="block text-sm text-gray-900">{emHeader?.reference ?? ""}</span>
                </div>
              </div> */}
                {/* Reference (readonly) */}
                <span className="col-span-1 text-sm text-gray-600">Referencia</span>
                <div className="col-span-5">
                  <div className="w-full border-b-2 border-indigo-400 pb-2">
                    <span className="block text-sm text-gray-900">{emHeader?.reference ?? ""}</span>
                  </div>
                </div>

                {/* Source (editable) */}
                <span className="col-span-1 text-sm text-gray-600">Fuente</span>
                <div className="col-span-5">
                  <input
                    value={emHeader?.source ?? ""}
                    onChange={(e) => onEmChange?.("source", e.target.value)}
                    className="w-full border-b border-gray-300 focus:outline-none text-sm text-gray-900"
                    placeholder="OMS"
                  />
                </div>

                {/* Prefix (editable)
              <span className="col-span-1 text-sm text-gray-600">Prefijo</span>
              <div className="col-span-5">
                <input
                  value={emHeader?.prefix ?? ""}
                  onChange={(e) => onEmChange?.("prefix", e.target.value)}
                  className="w-full border-b border-gray-300 focus:outline-none text-sm text-gray-900"
                  placeholder="EM"
                />
              </div> */}
                {/* Prefix (editable) */}
                <span className="col-span-1 text-sm text-gray-600">Prefijo</span>
                <div className="col-span-5">
                  <input
                    value={emHeader?.prefix ?? ""}
                    onChange={(e) => onEmChange?.("prefix", e.target.value)}
                    className="w-full border-b-2 border-indigo-400 pb-2 text-sm"
                    placeholder="EM"
                  />
                </div>

                {/* Series (editable) */}
                <span className="col-span-1 text-sm text-gray-600">Serie</span>
                <div className="col-span-5">
                  <input
                    value={emHeader?.series ?? ""}
                    onChange={(e) => onEmChange?.("series", e.target.value)}
                    className="w-full border-b border-gray-300 focus:outline-none text-sm text-gray-900"
                    placeholder="Primario"
                  />
                </div>

                {/* FolioNumber (readonly) */}
                <span className="col-span-1 text-sm text-gray-600">Folio #</span>
                <div className="col-span-5">
                  <div className="w-full border-b border-gray-300 pb-2">
                    <span className="block text-sm text-gray-900">{emHeader?.folioNumber ?? ""}</span>
                  </div>
                </div>

                {/* Indicator (editable) */}
                <span className="col-span-1 text-sm text-gray-600">Indicador</span>
                <div className="col-span-5">
                  <input
                    type="number"
                    value={String(emHeader?.indicator ?? "")}
                    onChange={(e) => onEmChange?.("indicator", Number(e.target.value))}
                    className="w-full border-b border-gray-300 focus:outline-none text-sm text-gray-900"
                    placeholder="52"
                  />
                </div>

                {/* ExternalRef (readonly autogenerado) */}
                <span className="col-span-1 text-sm text-gray-600">External Ref</span>
                <div className="col-span-5">
                  <div className="w-full border-b border-gray-300 pb-2">
                    <span className="block text-sm text-gray-900">{emHeader?.externalRef ?? ""}</span>
                  </div>
                </div>

                {/* Comments (textarea editable) */}
                <span className="col-span-1 text-sm text-gray-600">Comentarios</span>
                <div className="col-span-5">
                  <textarea
                    value={emHeader?.comments ?? ""}
                    onChange={(e) => onEmChange?.("comments", e.target.value)}
                    className="w-full border-b border-gray-300 focus:outline-none text-sm text-gray-900 resize-y"
                    rows={2}
                    placeholder="Entrada de mercancía desde pedido de compras"
                  />
                </div>
              </div>
            </Card>
          )}

          <Card
            title="ITEMS"
            icon={TagIcon}
            noDefaultStyles
            hasTitleDivider
            className="rounded-xl bg-white p-6"
          >
            {/* Cada fila = 2 campos (SKU y CANTIDAD). Patrón: label 1 / campo 5 */}
            <div className="space-y-2">
              {!readOnly && Boolean(onAddItemLine) && (
                <div className="mb-3 flex justify-end">
                  <button
                    type="button"
                    onClick={() => onAddItemLine?.()}
                    className="rounded-md border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100"
                  >
                    Agregar ítem
                  </button>
                </div>
              )}

              {displayLines
                .filter((ln) =>
                  !!ln &&
                  ((typeof ln.itemSku === "string" && ln.itemSku.trim().length > 0) ||
                    ln.orderedQty != null || ln.openQty != null)
                )
                .map((ln, idx) => {
                  // cantidad mostrada = estado controlado (getLineQty), fallback a openQty
                  const qtyValue = getLineQty?.(ln.lineNum) ?? ln.openQty ?? 0;
                  const qtyDraftValue = lineQtyDraft[ln.lineNum];
                  const qtyInputValue = qtyDraftValue !== undefined ? qtyDraftValue : String(qtyValue);
                  const skuDisplay =
                    String(ln.itemLabel || "").trim() ||
                    String(ln.itemSku || "").trim() ||
                    "—";
                  return (
                    <div
                      key={`${ln.itemSku ?? "sku"}-${idx}`}
                      className="grid grid-cols-12 gap-x-6 gap-y-2 py-1"
                    >
                      {/* SKU
                      <span className="col-span-1 text-sm text-gray-600">SKU</span>
                      <div className="col-span-5">
                        <div className="w-full border-b border-gray-300">
                          <span className="block text-sm text-gray-900">
                            {ln.itemSku ?? "—"}
                          </span>
                        </div>
                      </div> */}

                      {/* SKU */}
                      <span className="col-span-1 text-sm text-gray-600">SKU</span>
                      <div className="col-span-5">
                        {readOnly ? (
                          <div className="flex items-center gap-2 border-b-2 border-indigo-400 pb-1">
                            {ln.itemImage ? (
                              <img
                                src={ln.itemImage}
                                alt={ln.itemSku || "Producto"}
                                className="h-8 w-8 rounded object-cover"
                              />
                            ) : null}
                            <span className="block text-sm text-gray-900">{skuDisplay}</span>
                          </div>
                        ) : (
                          <>
                            <input
                              list={`sku-options-${ln.lineNum}`}
                              value={ln.itemSku === "-" ? "" : ln.itemSku}
                              onChange={(e) => onLineSkuChange?.(ln.lineNum, e.target.value)}
                              disabled={!canEditLineSku}
                              placeholder="Escribe o selecciona SKU"
                              className="w-full border-b-2 border-indigo-400 bg-transparent text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none"
                            />
                            {!!ln.itemLabel && ln.itemLabel !== ln.itemSku && (
                              <span className="mt-1 block text-xs text-slate-500">{ln.itemLabel}</span>
                            )}
                            <datalist id={`sku-options-${ln.lineNum}`}>
                              {skuOptions.map((option) => (
                                <option key={option.value} value={option.value} label={option.label} />
                              ))}
                            </datalist>
                          </>
                        )}
                      </div>

                      {/* CANTIDAD (editable, obligatorio, sólo números)
                      <span className="col-span-1 text-sm text-gray-600">CANTIDAD</span>
                      <div className="col-span-5">
                        <input
                          type="number"
                          required
                          inputMode="numeric"
                          min={0}
                          step={1}
                          value={String(qtyValue)}
                          onChange={(e) =>
                            onLineQtyChange?.(ln.lineNum, Number(e.target.value))
                          }
                          className="w-full border-b border-gray-300 bg-transparent text-sm text-gray-900 focus:outline-none focus:border-blue-500"
                          placeholder="0"
                          aria-label={`Cantidad para SKU ${ln.itemSku}`}
                        />
                      </div> */}

                      {/* CANTIDAD (editable, obligatorio, sólo números) */}
                      <span className="col-span-1 text-sm text-gray-600">CANTIDAD</span>
                      <div className="col-span-5">
                        <input
                          type="number"
                          required
                          inputMode="numeric"
                          min={0}
                          step={1}
                          value={qtyInputValue}
                          onChange={(e) => {
                            const raw = e.target.value;
                            setLineQtyDraft((prev) => ({ ...prev, [ln.lineNum]: raw }));

                            if (raw === "") return;

                            const parsed = Number(raw);
                            if (!Number.isFinite(parsed)) return;

                            onLineQtyChange?.(ln.lineNum, parsed);
                          }}
                          onBlur={() => {
                            setLineQtyDraft((prev) => {
                              if (!(ln.lineNum in prev)) return prev;
                              const next = { ...prev };
                              delete next[ln.lineNum];
                              return next;
                            });
                          }}
                          readOnly={!canEditLineQty}
                          className="w-full border-b-2 border-indigo-400 bg-transparent text-sm text-gray-900 focus:outline-none focus:border-indigo-500 read-only:cursor-default read-only:border-slate-300"
                          placeholder="0"
                          aria-label={`Cantidad para SKU ${ln.itemSku}`}
                        />
                      </div>
                      {!readOnly && showRemoveItemLineButton && displayLines.length > 1 && (
                        <div className="col-span-1 flex items-center justify-end">
                          <button
                            type="button"
                            onClick={() => onRemoveItemLine?.(ln.lineNum)}
                            className="rounded-md border border-red-200 bg-red-50 px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-100"
                          >
                            Quitar
                          </button>
                        </div>
                      )}
                      {/* Info de apoyo (opcional) */}

                    </div>
                  );
                })}

              {displayLines.length === 0 && (
                <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
                  Sin ítems abiertos
                </div>
              )}
            </div>

          </Card>


        </div>
        {showRightColumn && <div className="space-y-6">
          <Card
            title="USUARIO CREADOR"
            icon={UserIcon}
            noDefaultStyles
            hasTitleDivider
            className="rounded-xl p-6"
          >
            <div className="flex justify-between items-start">
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-xs text-gray-500">
                  {(order.created.username || "-").charAt(0).toUpperCase()}
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-gray-900">
                    {order.created.username || "-"}
                  </span>
                  <span className="text-xs text-gray-500">
                    {order.created.email || "-"}
                  </span>
                </div>
              </div>
              <span className="text-xs text-gray-500">
                {order.created.date || "-"}
              </span>
            </div>
          </Card>

          {order.modified && (
            <Card
              title="ÚLTIMA MODIFICACIÓN"
              icon={PencilIcon}
              noDefaultStyles
              hasTitleDivider
              className="rounded-xl p-6 "
            >
              <div className="flex justify-between items-start">
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-full bg-red-500 flex items-center justify-center text-xs font-medium text-white">
                    {order.modified.username.charAt(0).toUpperCase()}
                  </div>

                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-900">
                      {order.modified.username}
                    </span>
                    <span className="text-xs text-gray-500">
                      {order.modified.email}
                    </span>
                  </div>
                </div>
                <span className="text-xs text-gray-500">
                  {order.modified.date}
                </span>
              </div>
            </Card>
          )}
        </div>}
      </div>
    </div>
  );
};
