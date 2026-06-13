"use client";

import React, { useEffect, useMemo, useState } from "react";
import Card from "@/components/ui/card/Card";
import {
  HomeIcon,
  MapPinIcon,
  CalendarIcon,
  ClockIcon,
  CubeIcon,
  TicketIcon,
  UserIcon,
} from "@heroicons/react/24/outline";
import { CollapsibleField } from "@/components/ui/collapsible/collapsiblefield";
import { BASE_WAREHOUSES, URL_BASE } from "@/lib/http/endpoints";
import { withAuthPlatformHeaders } from "@/features/almacenes/services/auth-headers";

export interface Order {
  sourceWarehouse: string;
  sourcePosition: string;
  destWarehouse: string;
  destPosition: string;
  dateStarted: string;
  timeStarted: string;
  dateEnded: string;
  timeEnded: string;
  order: string;
  packageCount: string;
  barcode: string;
  sku: string;
  quantity: string;
  assignee: string;
  receiver: string;
}

interface OrderFieldsProps {
  order: Order;
  readOnly?: boolean;
  onChange?: (field: keyof Order, value: string) => void;
}

type OptionItem = {
  id: string;
  label: string;
};

type WarehouseApi = {
  id?: string | number;
  warehouseId?: string | number;
  referenceId?: string | number;
  name?: string;
};

type PositionApi = {
  id?: string | number;
  positionKey?: string;
  code?: string;
  name?: string;
  referenceId?: string;
};

type UserApi = {
  id?: string | number;
  ID?: string | number;
  userId?: string | number;
  usuarioId?: string | number;
  username?: string;
  userName?: string;
  nombre?: string;
  name?: string;
  FIRSTNAME?: string;
  LASTNAME?: string;
  email?: string;
  EMAIL?: string;
};

const WAREHOUSES_URL = `${BASE_WAREHOUSES}/warehouse`;
const POSITIONS_BY_WAREHOUSE_URL = (warehouseId: string) => `${BASE_WAREHOUSES}/position?filters[warehouseId]=${encodeURIComponent(warehouseId)}`;
const USERS_URL = `${URL_BASE}/idservice/usuarios`;

const JANIS_HEADERS: Record<string, string> = withAuthPlatformHeaders({
  "janis-api-key": "test-key",
  "janis-api-secret": "test-secret",
  "janis-client": "test-client",
});

const normalizeArray = <T,>(payload: any): T[] => {
  if (Array.isArray(payload)) return payload as T[];
  if (Array.isArray(payload?.items)) return payload.items as T[];
  if (Array.isArray(payload?.data)) return payload.data as T[];
  if (Array.isArray(payload?.rows)) return payload.rows as T[];
  if (Array.isArray(payload?.results)) return payload.results as T[];
  return [];
};

const normalizeId = (value: unknown): string => String(value ?? "").trim();

export const OrderFields: React.FC<OrderFieldsProps> = ({
  order,
  readOnly = true,
  onChange,
}) => {
  const [warehouseOptions, setWarehouseOptions] = useState<OptionItem[]>([]);
  const [sourcePositionOptions, setSourcePositionOptions] = useState<OptionItem[]>([]);
  const [destPositionOptions, setDestPositionOptions] = useState<OptionItem[]>([]);
  const [userOptions, setUserOptions] = useState<OptionItem[]>([]);

  const warehouseLabelById = useMemo(
    () => new Map(warehouseOptions.map((option) => [option.id, option.label])),
    [warehouseOptions]
  );
  const warehouseIdByLabel = useMemo(
    () => new Map(warehouseOptions.map((option) => [option.label, option.id])),
    [warehouseOptions]
  );
  const sourcePositionLabelById = useMemo(
    () => new Map(sourcePositionOptions.map((option) => [option.id, option.label])),
    [sourcePositionOptions]
  );
  const sourcePositionIdByLabel = useMemo(
    () => new Map(sourcePositionOptions.map((option) => [option.label, option.id])),
    [sourcePositionOptions]
  );
  const destPositionLabelById = useMemo(
    () => new Map(destPositionOptions.map((option) => [option.id, option.label])),
    [destPositionOptions]
  );
  const destPositionIdByLabel = useMemo(
    () => new Map(destPositionOptions.map((option) => [option.label, option.id])),
    [destPositionOptions]
  );
  const userLabelById = useMemo(
    () => new Map(userOptions.map((option) => [option.id, option.label])),
    [userOptions]
  );
  const userIdByLabel = useMemo(
    () => new Map(userOptions.map((option) => [option.label, option.id])),
    [userOptions]
  );

  const sourceWarehouseId = String(order.sourceWarehouse || "").trim();
  const destWarehouseId = String(order.destWarehouse || "").trim();
  const sourceWarehouseValue = warehouseLabelById.get(sourceWarehouseId) || "Seleccionar";
  const destWarehouseValue = warehouseLabelById.get(destWarehouseId) || "Seleccionar";
  const sourcePositionValue = sourcePositionLabelById.get(String(order.sourcePosition || "").trim()) || "Seleccionar";
  const destPositionValue = destPositionLabelById.get(String(order.destPosition || "").trim()) || "Seleccionar";
  const assigneeValue = userLabelById.get(String(order.assignee || "").trim()) || "Seleccionar";
  const receiverValue = userLabelById.get(String(order.receiver || "").trim()) || "Seleccionar";

  const warehouseSelectOptions = useMemo(
    () => ["Seleccionar", ...warehouseOptions.map((option) => option.label)],
    [warehouseOptions]
  );
  const sourcePositionSelectOptions = useMemo(
    () => ["Seleccionar", ...sourcePositionOptions.map((option) => option.label)],
    [sourcePositionOptions]
  );
  const destPositionSelectOptions = useMemo(
    () => ["Seleccionar", ...destPositionOptions.map((option) => option.label)],
    [destPositionOptions]
  );
  const userSelectOptions = useMemo(
    () => ["Seleccionar", ...userOptions.map((option) => option.label)],
    [userOptions]
  );

  const handle = (field: keyof Order) => (val: string) =>
    onChange?.(field, val);

  useEffect(() => {
    let mounted = true;

    const loadWarehouses = async () => {
      try {
        const response = await fetch(WAREHOUSES_URL, {
          method: "GET",
          headers: JANIS_HEADERS,
          cache: "no-store",
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const payload = await response.json();
        const options = normalizeArray<WarehouseApi>(payload)
          .map((warehouse) => {
            const id = normalizeId(warehouse?.id ?? warehouse?.warehouseId);
            if (!id) return null;
            const name = String(warehouse?.name || "").trim();
            const referenceId = String(warehouse?.referenceId ?? "").trim();
            const label = name && referenceId ? `${name} (${referenceId})` : name || referenceId || id;
            return { id, label };
          })
          .filter((option): option is OptionItem => Boolean(option));

        if (mounted) setWarehouseOptions(options);
      } catch {
        if (mounted) setWarehouseOptions([]);
      }
    };

    const loadUsers = async () => {
      try {
        const response = await fetch(USERS_URL, {
          method: "GET",
          headers: JANIS_HEADERS,
          cache: "no-store",
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const payload = await response.json();
        const options = normalizeArray<UserApi>(payload)
          .map((user) => {
            const id = normalizeId(user?.id ?? user?.ID ?? user?.userId ?? user?.usuarioId);
            if (!id) return null;
            const fullName = `${String(user?.FIRSTNAME ?? "").trim()} ${String(user?.LASTNAME ?? "").trim()}`.trim();
            const name = String(user?.username ?? user?.userName ?? user?.nombre ?? user?.name ?? fullName).trim();
            const email = String(user?.email ?? user?.EMAIL ?? "").trim();
            const labelBase = name || email || id;
            const label = name && email ? `${name} (${email})` : labelBase;
            return { id, label };
          })
          .filter((option): option is OptionItem => Boolean(option));

        const unique = Array.from(new Map(options.map((option) => [option.id, option])).values());
        if (mounted) setUserOptions(unique);
      } catch {
        if (mounted) setUserOptions([]);
      }
    };

    void loadWarehouses();
    void loadUsers();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    if (!sourceWarehouseId) {
      setSourcePositionOptions([]);
      if (!readOnly && order.sourcePosition) onChange?.("sourcePosition", "");
      return;
    }

    const loadPositions = async () => {
      try {
        const response = await fetch(POSITIONS_BY_WAREHOUSE_URL(sourceWarehouseId), {
          method: "GET",
          headers: JANIS_HEADERS,
          cache: "no-store",
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const payload = await response.json();
        const options = normalizeArray<PositionApi>(payload)
          .map((position) => {
            const id = normalizeId(position?.id);
            if (!id) return null;
            const label = String(position?.positionKey || position?.code || position?.name || position?.referenceId || id).trim();
            return { id, label };
          })
          .filter((option): option is OptionItem => Boolean(option));

        if (mounted) {
          setSourcePositionOptions(options);
          const selectedExists = options.some((option) => option.id === String(order.sourcePosition || ""));
          if (!selectedExists && order.sourcePosition) onChange?.("sourcePosition", "");
        }
      } catch {
        if (mounted) setSourcePositionOptions([]);
      }
    };

    void loadPositions();

    return () => {
      mounted = false;
    };
  }, [sourceWarehouseId, readOnly, order.sourcePosition]);

  useEffect(() => {
    let mounted = true;
    if (!destWarehouseId) {
      setDestPositionOptions([]);
      if (!readOnly && order.destPosition) onChange?.("destPosition", "");
      return;
    }

    const loadPositions = async () => {
      try {
        const response = await fetch(POSITIONS_BY_WAREHOUSE_URL(destWarehouseId), {
          method: "GET",
          headers: JANIS_HEADERS,
          cache: "no-store",
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const payload = await response.json();
        const options = normalizeArray<PositionApi>(payload)
          .map((position) => {
            const id = normalizeId(position?.id);
            if (!id) return null;
            const label = String(position?.positionKey || position?.code || position?.name || position?.referenceId || id).trim();
            return { id, label };
          })
          .filter((option): option is OptionItem => Boolean(option));

        if (mounted) {
          setDestPositionOptions(options);
          const selectedExists = options.some((option) => option.id === String(order.destPosition || ""));
          if (!selectedExists && order.destPosition) onChange?.("destPosition", "");
        }
      } catch {
        if (mounted) setDestPositionOptions([]);
      }
    };

    void loadPositions();

    return () => {
      mounted = false;
    };
  }, [destWarehouseId, readOnly, order.destPosition]);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* ─── IZQUIERDA ──────────────────────────────────────────── */}
      <div className="space-y-6">
        {/** SOURCE */}
        <Card
          title="SOURCE"
          icon={HomeIcon}
          noDefaultStyles
          hasTitleDivider
          className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
        >
          <div className="grid grid-cols-4 gap-6">
            {/* Warehouse Label */}
            <div className="flex items-center gap-2">
              <HomeIcon className="h-5 w-5 text-gray-400" />
              <span className="text-sm text-gray-600">Warehouse</span>
            </div>
            {/* Warehouse Value */}
            <div>
              {readOnly ? (
                <span className="text-sm text-gray-900">
                  {warehouseLabelById.get(sourceWarehouseId) || "-"}
                </span>
              ) : (
                <CollapsibleField
                  inline
                  label=""
                  value={sourceWarehouseValue}
                  options={warehouseSelectOptions}
                  onChange={(value) => {
                    if (value === "Seleccionar") {
                      onChange?.("sourceWarehouse", "");
                      onChange?.("sourcePosition", "");
                      return;
                    }
                    onChange?.("sourceWarehouse", warehouseIdByLabel.get(value) || "");
                    onChange?.("sourcePosition", "");
                  }}
                />
              )}
            </div>

            {/* Position Label */}
            <div className="flex items-center gap-2">
              <MapPinIcon className="h-5 w-5 text-gray-400" />
              <span className="text-sm text-gray-600">Position</span>
            </div>
            {/* Position Value */}
            <div>
              {readOnly ? (
                <span className="text-sm text-gray-900">
                  {sourcePositionLabelById.get(String(order.sourcePosition || "")) || "-"}
                </span>
              ) : (
                <CollapsibleField
                  inline
                  label=""
                  value={sourcePositionValue}
                  options={sourcePositionSelectOptions}
                  onChange={(value) => onChange?.("sourcePosition", value === "Seleccionar" ? "" : (sourcePositionIdByLabel.get(value) || ""))}
                />
              )}
            </div>
          </div>
        </Card>

        {/** DESTINATION */}
        <Card
          title="DESTINATION"
          icon={CubeIcon}
          noDefaultStyles
          hasTitleDivider
          className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
        >
          <div className="grid grid-cols-4 gap-6">
            {/* Warehouse Label */}
            <div className="flex items-center gap-2">
              <HomeIcon className="h-5 w-5 text-gray-400" />
              <span className="text-sm text-gray-600">Warehouse</span>
            </div>
            {/* Warehouse Value */}
            <div>
              {readOnly ? (
                <span className="text-sm text-gray-900">
                  {warehouseLabelById.get(destWarehouseId) || "-"}
                </span>
              ) : (
                <CollapsibleField
                  inline
                  label=""
                  value={destWarehouseValue}
                  options={warehouseSelectOptions}
                  onChange={(value) => {
                    if (value === "Seleccionar") {
                      onChange?.("destWarehouse", "");
                      onChange?.("destPosition", "");
                      return;
                    }
                    onChange?.("destWarehouse", warehouseIdByLabel.get(value) || "");
                    onChange?.("destPosition", "");
                  }}
                />
              )}
            </div>

            {/* Position Label */}
            <div className="flex items-center gap-2">
              <MapPinIcon className="h-5 w-5 text-gray-400" />
              <span className="text-sm text-gray-600">Position</span>
            </div>
            {/* Position Value */}
            <div>
              {readOnly ? (
                <span className="text-sm text-gray-900">
                  {destPositionLabelById.get(String(order.destPosition || "")) || "-"}
                </span>
              ) : (
                <CollapsibleField
                  inline
                  label=""
                  value={destPositionValue}
                  options={destPositionSelectOptions}
                  onChange={(value) => onChange?.("destPosition", value === "Seleccionar" ? "" : (destPositionIdByLabel.get(value) || ""))}
                />
              )}
            </div>
          </div>
        </Card>

        {/** DATES */}
        <Card
          title="DATES"
          icon={CalendarIcon}
          noDefaultStyles
          hasTitleDivider
          className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
        >
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5 text-gray-400" />
                <span className="text-sm text-gray-600">Date started</span>
              </div>
              {readOnly ? (
                <span className="text-sm text-gray-900">
                  {order.dateStarted}
                </span>
              ) : (
                <input
                  type="date"
                  value={order.dateStarted}
                  onChange={(e) => handle("dateStarted")(e.target.value)}
                  className="w-full border-b border-gray-300 focus:outline-none text-sm text-gray-900"
                />
              )}
              {readOnly ? (
                <span className="text-sm text-gray-900">
                  {order.timeStarted}
                </span>
              ) : (
                <div className="flex items-center gap-2 mt-1">
                  <ClockIcon className="h-5 w-5 text-gray-400" />
                  <input
                    type="time"
                    value={order.timeStarted}
                    onChange={(e) => handle("timeStarted")(e.target.value)}
                    className="w-full border-b border-gray-300 focus:outline-none text-sm text-gray-900"
                  />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5 text-gray-400" />
                <span className="text-sm text-gray-600">Date ended</span>
              </div>
              {readOnly ? (
                <span className="text-sm text-gray-900">{order.dateEnded}</span>
              ) : (
                <input
                  type="date"
                  value={order.dateEnded}
                  onChange={(e) => handle("dateEnded")(e.target.value)}
                  className="w-full border-b border-gray-300 focus:outline-none text-sm text-gray-900"
                />
              )}
              {readOnly ? (
                <span className="text-sm text-gray-900">{order.timeEnded}</span>
              ) : (
                <div className="flex items-center gap-2 mt-1">
                  <ClockIcon className="h-5 w-5 text-gray-400" />
                  <input
                    type="time"
                    value={order.timeEnded}
                    onChange={(e) => handle("timeEnded")(e.target.value)}
                    className="w-full border-b border-gray-300 focus:outline-none text-sm text-gray-900"
                  />
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* ─── DERECHA ──────────────────────────────────────────────── */}
      <div className="space-y-6">
        {/** CONTENT */}
        <Card
          title="CONTENT"
          icon={TicketIcon}
          noDefaultStyles
          hasTitleDivider
          className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
        >
          <div className="grid grid-cols-2 gap-6">
            {[
              ["Order", "order"],
              ["Package", "packageCount"],
              ["Barcode", "barcode"],
              ["Sku", "sku"],
              ["Quantity", "quantity"],
            ].map(([label, field]) => (
              <React.Fragment key={field}>
                <span className="text-sm text-gray-600">{label}</span>
                {readOnly ? (
                  <span className="text-sm text-gray-900">
                    {(order as any)[field]}
                  </span>
                ) : (
                  <input
                    value={String((order as any)[field] || "")}
                    onChange={(e) => handle(field as keyof Order)(e.target.value)}
                    className="w-full border-b border-gray-300 pb-1 text-sm text-gray-900 focus:outline-none"
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        </Card>

        {/** USERS */}
        <Card
          title="USERS"
          icon={UserIcon}
          noDefaultStyles
          hasTitleDivider
          className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
        >
          <div className="grid grid-cols-2 gap-6">
            <span className="text-sm text-gray-600">Assignee</span>
            {readOnly ? (
              <span className="text-sm text-gray-900">
                {userLabelById.get(String(order.assignee || "")) || "-"}
              </span>
            ) : (
              <CollapsibleField
                label=""
                value={assigneeValue}
                options={userSelectOptions}
                onChange={(value) => onChange?.("assignee", value === "Seleccionar" ? "" : (userIdByLabel.get(value) || ""))}
              />
            )}

            <span className="text-sm text-gray-600">Receiver</span>
            {readOnly ? (
              <span className="text-sm text-gray-900">
                {userLabelById.get(String(order.receiver || "")) || "-"}
              </span>
            ) : (
              <CollapsibleField
                label=""
                value={receiverValue}
                options={userSelectOptions}
                onChange={(value) => onChange?.("receiver", value === "Seleccionar" ? "" : (userIdByLabel.get(value) || ""))}
              />
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};
