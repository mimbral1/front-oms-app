"use client";
import React from "react";
import { HomeIcon, ArrowRightIcon } from "@heroicons/react/24/outline";
import Card from "@/components/ui/card/Card";
import { CollapsibleField } from "@/components/ui/collapsible/collapsiblefield";

interface Props {
  inventory: string;
  slot: string;
  estimatedFrom: string;
  estimatedTo: string;
  deliveryNote: string;
  invoice: string;
  supplier: string;
  assignedTo: string;
  onChange: {
    inventory?: (v: string) => void;
    slot?: (v: string) => void;
    estimatedFrom?: (v: string) => void;
    estimatedTo?: (v: string) => void;
    deliveryNote?: (v: string) => void;
    invoice?: (v: string) => void;
    supplier?: (v: string) => void;
    assignedTo?: (v: string) => void;
  };
  readOnly?: boolean;
}
export const OrderDetailSection: React.FC<Props> = ({
  inventory,
  slot,
  estimatedFrom,
  estimatedTo,
  deliveryNote,
  invoice,
  supplier,
  assignedTo,
  onChange,
  readOnly = true,
}) => (
  <Card title="DETALLE" icon={HomeIcon} hasTitleDivider>
    <div className="space-y-6">
      {/* Inventario + Slot */}
      <div className="flex items-center border-b border-gray-300 pb-2">
        <span className="w-28 text-sm text-gray-600">Inventario</span>
        <CollapsibleField
          label=""
          value={inventory}
          options={readOnly ? [] : ["A1", "B2", "C3"]}
          onChange={onChange.inventory || (() => {})}
        />
        <span className="mx-6 w-28 text-sm text-gray-600">
          Slot de descarga
        </span>
        <CollapsibleField
          label=""
          value={slot}
          options={readOnly ? [] : ["A1", "B2", "C3"]}
          onChange={onChange.slot || (() => {})}
        />
      </div>
      {/* Fecha estimada */}
      <div className="flex items-center border-b border-gray-300 pb-2">
        <div className="flex-1">
          <span className="block text-xs text-blue-600">Fecha estimada</span>
          <CollapsibleField
            label=""
            value={estimatedFrom}
            options={readOnly ? [] : [""]}
            onChange={onChange.estimatedFrom || (() => {})}
          />
        </div>
        <ArrowRightIcon className="h-5 w-5 text-gray-400 mx-4" />
        <div className="flex-1">
          <CollapsibleField
            label=""
            value={estimatedTo}
            options={readOnly ? [] : [""]}
            onChange={onChange.estimatedTo || (() => {})}
          />
        </div>
      </div>
      {/* Remito / Factura */}
      <div className="grid grid-cols-2 gap-6 border-b border-gray-300 pb-2">
        <div className="flex justify-between">
          <span className="text-sm text-gray-600">Remito #</span>
          {readOnly ? (
            <span className="text-sm font-medium text-gray-900">
              {deliveryNote}
            </span>
          ) : (
            <input
              className="w-1/2 text-sm text-gray-900"
              value={deliveryNote}
              onChange={(e) => onChange.deliveryNote?.(e.target.value)}
            />
          )}
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-gray-600">Factura #</span>
          {readOnly ? (
            <span className="text-sm font-medium text-gray-900">{invoice}</span>
          ) : (
            <input
              className="w-1/2 text-sm text-gray-900"
              value={invoice}
              onChange={(e) => onChange.invoice?.(e.target.value)}
            />
          )}
        </div>
      </div>
      {/* Proveedor / Asignado */}
      <div className="grid grid-cols-2 gap-6">
        <div className="flex justify-between border-b border-gray-300 pb-2">
          <span className="text-sm text-gray-600">Proveedor</span>
          <CollapsibleField
            label=""
            value={supplier}
            options={readOnly ? [] : ["FEMSA", "La Torre"]}
            onChange={onChange.supplier || (() => {})}
          />
        </div>
        <div className="flex justify-between border-b border-gray-300 pb-2">
          <span className="text-sm text-gray-600">Asignado</span>
          <CollapsibleField
            label=""
            value={assignedTo}
            options={readOnly ? [] : ["Usuario1", "Usuario2"]}
            onChange={onChange.assignedTo || (() => {})}
          />
        </div>
      </div>
    </div>
  </Card>
);
