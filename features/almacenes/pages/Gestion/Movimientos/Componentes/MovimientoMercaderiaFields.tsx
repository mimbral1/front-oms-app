"use client";

import React from "react";
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

export const OrderFields: React.FC<OrderFieldsProps> = ({
  order,
  readOnly = true,
  onChange,
}) => {
  const handle = (field: keyof Order) => (val: string) =>
    onChange?.(field, val);

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
          className="rounded-xl p-6"
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
                  {order.sourceWarehouse}
                </span>
              ) : (
                <CollapsibleField
                  inline
                  label=""
                  value={order.sourceWarehouse}
                  options={["PAK", "INV1", "PAL"]}
                  onChange={handle("sourceWarehouse")}
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
                  {order.sourcePosition}
                </span>
              ) : (
                <CollapsibleField
                  inline
                  label=""
                  value={order.sourcePosition}
                  options={["1-001-2", "B-1-05", "C-2-10"]}
                  onChange={handle("sourcePosition")}
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
          className="rounded-xl p-6"
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
                  {order.destWarehouse}
                </span>
              ) : (
                <CollapsibleField
                  inline
                  label=""
                  value={order.destWarehouse}
                  options={["PAK", "INV1", "PAL"]}
                  onChange={handle("destWarehouse")}
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
                  {order.destPosition}
                </span>
              ) : (
                <CollapsibleField
                  inline
                  label=""
                  value={order.destPosition}
                  options={["1-001-2", "B-1-05", "C-2-10"]}
                  onChange={handle("destPosition")}
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
          className="rounded-xl p-6"
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
          className="rounded-xl p-6"
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
                  <CollapsibleField
                    label=""
                    value={(order as any)[field]}
                    options={[]}
                    onChange={handle(field as keyof Order)}
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
          className="rounded-xl p-6"
        >
          <div className="grid grid-cols-2 gap-6">
            <span className="text-sm text-gray-600">Assignee</span>
            {readOnly ? (
              <span className="text-sm text-gray-900">
                {order.sourceWarehouse}
              </span>
            ) : (
              <CollapsibleField
                label=""
                value={order.assignee}
                options={["Alice", "Bob", "Charlie"]}
                onChange={handle("assignee")}
              />
            )}

            <span className="text-sm text-gray-600">Receiver</span>
            {readOnly ? (
              <span className="text-sm text-gray-900">
                {order.sourceWarehouse}
              </span>
            ) : (
              <CollapsibleField
                label=""
                value={order.receiver}
                options={["Alice", "Bob", "Charlie"]}
                onChange={handle("receiver")}
              />
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};
