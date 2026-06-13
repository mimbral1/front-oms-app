// app/views/Almacen/Gestion/Ingreso/components/OrderFields.tsx
"use client";

import React from "react";
import Card from "@/components/ui/card/Card";
import {
  Cog6ToothIcon,
  PencilIcon,
  UserIcon,
} from "@heroicons/react/24/outline";
import { CollapsibleField } from "@/components/ui/collapsible/collapsiblefield";
import { FaClipboardList } from "react-icons/fa";
import { Flow } from "@/features/customers/pages/Logistica/FlujosView/Nuevo/FlujosNuevo";
import { Toggle } from "@/components/ui/togle/togle";
import { FileUserIcon } from "lucide-react";

/**
 * Este componente fue re‑maquetado para que **todos los campos** dentro de cada
 * `Card` aparezcan **en columna**, con la etiqueta arriba y el control/dato
 * debajo. Se eliminó la mezcla de `flex` horizontales y se sustituyó por
 * `flex‑col` y `space‑y‑4`, haciendo el layout más legible y consistente.
 */

export interface Order {
  id?: string;
  inventory: string;
  slot: string;
  estimatedFrom: string;
  estimatedTo: string;
  deliveryNote: string;
  invoice: string;
  supplier: string;
  assignedTo: string;
  status: "Active" | "Inactive";
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

interface FlowFieldsProps {
  flow: Flow;
  readOnly?: boolean;
  onChange?: <K extends keyof Flow>(field: K, value: Flow[K]) => void;
}

export const FlowFields: React.FC<FlowFieldsProps> = ({
  flow,
  readOnly = true,
  onChange,
}) => {
  const handle =
    <K extends keyof Flow>(field: K) =>
      (val: Flow[K]) =>
        onChange?.(field, val);

  const isNew = !flow.id;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 bg-white">
        {/* LEFT COLUMN */}
        <div className="lg:col-span-2 space-y-6">
          {/* DETAIL */}
          <Card
            title="DETALLE"
            icon={FaClipboardList}
            noDefaultStyles
            hasTitleDivider
            className="rounded-xl p-6"
          >
            <div className="flex flex-col  divide-gray-200 space-y-8">
              <FieldRow label="Nombre">
                {readOnly ? (
                  <span className="text-sm font-medium text-gray-900">
                    {flow.nombre}
                  </span>
                ) : (
                  <input
                    type="text"
                    value={flow.nombre}
                    onChange={(e) => handle("nombre")(e.target.value as any)}
                    className="w-full border-b border-gray-300 focus:outline-none text-sm font-medium text-gray-900"
                  />
                )}
              </FieldRow>

              <FieldRow label="Método">
                {readOnly ? (
                  <span className="text-sm font-medium text-gray-900">
                    {flow.metodo || "—"}
                  </span>
                ) : (
                  <CollapsibleField
                    inline
                    label=""
                    value={flow.metodo}
                    options={["Home", "Store"]}
                    onChange={(v) => handle("metodo")(v as Flow["metodo"])}
                  />
                )}
              </FieldRow>
            </div>
          </Card>

          {/* REQUEST */}
          <Card
            title="SOLICITUD"
            icon={FileUserIcon}
            noDefaultStyles
            hasTitleDivider
            className="rounded-xl p-6"
          >
            <div className="flex flex-col divide-gray-200  space-y-10">
              <FieldRow label="Tipo">
                {readOnly ? (
                  <span className="text-sm font-medium text-gray-900">
                    {flow.tipo || "—"}
                  </span>
                ) : (
                  <CollapsibleField
                    inline
                    label=""
                    value={flow.tipo}
                    options={[
                      "Reemplazo del producto",
                      "Descuento del producto",
                    ]}
                    onChange={(v) => handle("tipo")(v as Flow["tipo"])}
                  />
                )}
              </FieldRow>

              <ToggleRow
                label="Permitir sustitución"
                readOnly={readOnly}
                checked={flow.allowreplace === true}
                onChange={(checked) => handle("allowreplace")(checked as any)}
              />

              <ToggleRow
                label="Aprobar automática"
                readOnly={readOnly}
                checked={flow.automaticAprove === true}
                onChange={(checked) =>
                  handle("automaticAprove")(checked as any)
                }
              />

              <ToggleRow
                label="Pickear nuevo pedido"
                readOnly={readOnly}
                checked={flow.PickNewOrder === true}
                onChange={(checked) => handle("PickNewOrder")(checked as any)}
              />
            </div>
          </Card>
        </div>

        {/* RIGHT COLUMN */}
        <div className="space-y-6">
          {isNew ? (
            <ConfigCardNew flow={flow} readOnly={readOnly} handle={handle} />
          ) : (
            <ConfigCardsExisting
              flow={flow}
              readOnly={readOnly}
              handle={handle}
            />
          )}
        </div>
      </div>
    </div>
  );
};

/* ------------------ Helpers ------------------ */
interface FieldRowProps {
  label: string;
  children: React.ReactNode;
}

const FieldRow: React.FC<FieldRowProps> = ({ label, children }) => (
  <div className="grid grid-cols-[160px_1fr] items-center py-2 gap-4">
    <span className="text-sm text-gray-600">{label}</span>
    <div className="w-full">{children}</div>
  </div>
);

interface ToggleRowProps {
  label: string;
  readOnly: boolean;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

// toggle
const ToggleRow: React.FC<ToggleRowProps> = ({
  label,
  readOnly,
  checked,
  onChange,
}) => (
  <FieldRow label={label}>
    {readOnly ? (
      <span className="text-sm font-medium text-gray-900">
        {checked ? "Sí" : "No"}
      </span>
    ) : (
      <Toggle checked={checked} onCheckedChange={onChange} />
    )}
  </FieldRow>
);

/* ----------- Right side cards ----------- */
interface RightProps {
  flow: Flow;
  readOnly: boolean;
  handle: <K extends keyof Flow>(field: K) => (val: Flow[K]) => void;
}

const ConfigCardNew: React.FC<RightProps> = ({ flow, readOnly, handle }) => (
  <Card
    title="CONFIGURACIÓN"
    icon={Cog6ToothIcon}
    noDefaultStyles
    hasTitleDivider
    className="rounded-xl p-6"
  >
    <div className="flex flex-col  divide-gray-200">
      <FieldRow label="Usuario creador">
        <input
          type="text"
          value={flow.createdBy.username}
          onChange={(e) =>
            handle("createdBy")({ ...flow.createdBy, username: e.target.value })
          }
          className="w-full border-b border-gray-300 focus:outline-none text-sm text-gray-900"
        />
      </FieldRow>
      <FieldRow label="Fecha creación">
        <input
          type="datetime-local"
          value={flow.createdAt}
          onChange={(e) => handle("createdAt")(e.target.value as any)}
          className="w-full border-b border-gray-300 focus:outline-none text-sm text-gray-900"
        />
      </FieldRow>
    </div>
  </Card>
);

const ConfigCardsExisting: React.FC<RightProps> = ({
  flow,
  readOnly,
  handle,
}) => (
  <>
    <Card
      title="OTROS"
      noDefaultStyles
      hasTitleDivider
      className="rounded-xl p-6"
    >
      <div className="flex flex-col divide-gray-200">
        <FieldRow label="Estado">
          <CollapsibleField
            inline
            label=""
            value={flow.status}
            options={["Active", "Inactive"]}
            onChange={(v) => handle("status")(v as Flow["status"])}
          />
        </FieldRow>
      </div>
    </Card>

    <Card
      title="USUARIO CREADOR"
      icon={UserIcon}
      noDefaultStyles
      hasTitleDivider
      className="rounded-xl p-6"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <img
            src="https://randomuser.me/api/portraits/men/1.jpg"
            alt="Avatar"
            className="w-8 h-8 rounded-full object-cover"
          />
          <div className="text-sm">
            <div className="font-semibold text-gray-900">Francisco Mato</div>
            <div className="text-xs text-gray-500">francisco@fizzmo.cl</div>
          </div>
        </div>
        <span className="text-xs text-gray-500">24/11/2021 15:58:44</span>
      </div>
    </Card>

    <Card
      title="ÚLTIMA MODIFICACIÓN"
      icon={PencilIcon}
      noDefaultStyles
      hasTitleDivider
      className="rounded-xl p-6"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <img
            src="https://randomuser.me/api/portraits/men/1.jpg"
            alt="Avatar"
            className="w-8 h-8 rounded-full object-cover"
          />
          <div className="text-sm">
            <div className="font-semibold text-gray-900">Francisco Mato</div>
            <div className="text-xs text-gray-500">francisco@fizzmo.cl</div>
          </div>
        </div>
        <span className="text-xs text-gray-500">24/11/2021 15:58:44</span>
      </div>
    </Card>
  </>
);
