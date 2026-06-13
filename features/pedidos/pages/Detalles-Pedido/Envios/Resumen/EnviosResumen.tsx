/* // app/pedidos/[id]/envios/[id]/resumen/page.tsx
"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowDownOnSquareIcon, CheckCircleIcon, ClockIcon, DocumentDuplicateIcon, MapPinIcon, TruckIcon, XCircleIcon } from "@heroicons/react/24/outline";

import DetalleEntregaLayout from "@/app/pedidos/listado-pedidos/[id]/envios/[envioId]/layout";
import Card from "@/components/ui/card";
import { PageHeader, Action } from "@/components/layout/page-header";
import { fmtDateTimeParts } from "@/lib/format/date";
import { StatusPill } from "@/components/ui/status-pill/StatusPill";

/** Mock de la entrega 
const mockEntrega = {
  id: "231123-5BTXE",
  status: "Entregado" as const,
  statusVariant: "success" as const,
  startDate: "23/11/2023",
  startTime: "14:44",
  endDate: "23/11/2023",
  endTime: "15:44",
  carrier: "Express",
  route: "231123",
  routePending: false,
  pendingPackages: false,
  readyToPickup: true,
  ordersCount: "13781212-01",
  totalAmount: "4,40",
  currency: "GTQ",
  paymentMethod: "Vale",
  pickup: {
    company: "",
    docType: "",
    docNumber: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    postalCode: "",
    province: "",
    country: "",
  },
  dropoff: {
    name: "",
    surname: "",
    docType: "",
    docNumber: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    postalCode: "",
    province: "",
    country: "",
  },
  verification: {
    verified: false,
    failedAttempts: 0,
  },
  trackingHistory: [
    {
      trackingNumber: "231123-E3OYFIZ",
      events: [
        { status: "Creada", date: "23/11/2023", time: "14:44" },
        { status: "Programada", date: "23/11/2023", time: "21:50" },
        { status: "Iniciado", date: "24/11/2023", time: "09:10" },
        { status: "Arribado", date: "24/11/2023", time: "09:10" },
        {
          status: "Entregado",
          date: "24/11/2023",
          time: "09:11",
          receiver: "",
        },
      ],
    },
  ],
  signatureUrl:
    "https://www.consumer.es/app/uploads/fly-images/110784/img_firma-3-1200x550-cc.jpg",
};

/** Helper: formatea “2023-11-23” ó “2023-11-23 14:44” 
const fmtDateTime = fmtDateTimeParts;

interface FieldProps {
  label: string;
  value: React.ReactNode;
}
function Field({ label, value }: FieldProps) {
  return (
    <div className="flex justify-between">
      <span className="text-sm text-gray-600">{label}</span>
      <span className="text-sm font-medium text-gray-900">{value}</span>
    </div>
  );
}

export function ResumenEnvioPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  // en lugar de store, tiramos de mock:
  const e = mockEntrega;

  const headerActions: Action[] = [
    {
      label: "Aplicar",
      variant: "success",
      onClick: () => {},
      disabled: true,
        icon: <CheckCircleIcon className="h-5 w-5" />
    },
    { label: "Guardar", variant: "success", onClick: () => {}, icon: <ArrowDownOnSquareIcon className="h-5 w-5" /> },
    { label: "Guardar & Crear nuevo", variant: "success", onClick: () => {}, icon: <ArrowDownOnSquareIcon className="h-5 w-5" /> },
    { label: "Volver al listado", variant: "secondary", onClick: () => router.push(`/pedidos/${id}`), icon: <XCircleIcon className="h-5 w-5" /> },
  ];

  const headerComponent = (
    <PageHeader
      title={`ENTREGA ${e.id}`}
      status={{ text: e.status, variant: e.statusVariant }}
      action={headerActions}
    />
  );

  return (
    <DetalleEntregaLayout headerComponent={headerComponent}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/** 1. COLUMNA }
        <div className="space-y-6">
          <Card
            title="DETALLE"
            icon={ClockIcon}
            hasTitleDivider
            roundedClass="rounded-none"
          >
            <Field
              label="Inicio"
              value={fmtDateTime(e.startDate, e.startTime)}
            />
            <Field
              label="Finalización"
              value={fmtDateTime(e.endDate, e.endTime)}
            />
            <Field
              label="Transportista"
              value={
                <span className="text-blue-600 hover:underline cursor-pointer">
                  {e.carrier}
                </span>
              }
            />
            <Field
              label="Ruta"
              value={
                <span className="text-blue-600 hover:underline cursor-pointer">
                  {e.route}
                </span>
              }
            />
            <Field
              label="Ruta pendiente"
              value={
                e.routePending ? (
                  <span className="px-2 py-0.5 bg-green-500 text-white rounded">
                    Sí
                  </span>
                ) : (
                  <span className="px-2 py-0.5 bg-red-500 text-white rounded">
                    No
                  </span>
                )
              }
            />
            <Field
              label="Bultos pendientes"
              value={
                e.pendingPackages ? (
                  <span className="px-2 py-0.5 bg-green-500 text-white rounded">
                    Sí
                  </span>
                ) : (
                  <span className="px-2 py-0.5 bg-red-500 text-white rounded">
                    No
                  </span>
                )
              }
            />
            <Field
              label="Listo para retirar"
              value={
                e.readyToPickup ? (
                  <span className="px-2 py-0.5 bg-green-500 text-white rounded">
                    Sí
                  </span>
                ) : (
                  <span className="px-2 py-0.5 bg-red-500 text-white rounded">
                    No
                  </span>
                )
              }
            />
          </Card>

          <Card
            title="PEDIDOS"
            icon={DocumentDuplicateIcon}
            hasTitleDivider
            roundedClass="rounded-none"
          >
            <Field
              label="Pedidos"
              value={
                <span
                  className="text-blue-600 hover:underline cursor-pointer"
                  onClick={() => router.push(`/pedidos/${id}/envios/${e.id}`)}
                >
                  {e.ordersCount}
                </span>
              }
            />
            <Field
              label="Importe del pedido"
              value={`${e.totalAmount} ${e.currency}`}
            />
            <Field label="Método de pago" value={e.paymentMethod} />
          </Card>
        </div>

        {/** 2. COLUMNA }
        <div className="space-y-6">
          <Card
            title="PICKUP"
            icon={TruckIcon}
            hasTitleDivider
            roundedClass="rounded-none"
          >
            {(
              Object.entries(e.pickup) as [keyof typeof e.pickup, string][]
            ).map(([k, v]) => (
              <Field
                key={k}
                label={k.charAt(0).toUpperCase() + k.slice(1)}
                value={v || "-"}
              />
            ))}
          </Card>

          <Card
            title="DROPOFF"
            icon={MapPinIcon}
            hasTitleDivider
            roundedClass="rounded-none"
          >
            {(
              Object.entries(e.dropoff) as [keyof typeof e.dropoff, string][]
            ).map(([k, v]) => (
              <Field
                key={k}
                label={k.charAt(0).toUpperCase() + k.slice(1)}
                value={v || "-"}
              />
            ))}
          </Card>
        </div>

        {/** 3. COLUMNA }
        <div className="space-y-6">
          <Card
            title="VERIFICACIÓN DE ENTREGA"
            icon={CheckCircleIcon}
            hasTitleDivider
            roundedClass="rounded-none"
          >
            <Field
              label="Verificado"
              value={
                e.verification.verified ? (
                  <span className="px-2 py-0.5 bg-green-500 text-white rounded">
                    Sí
                  </span>
                ) : (
                  <span className="px-2 py-0.5 bg-red-500 text-white rounded">
                    No
                  </span>
                )
              }
            />
            <Field
              label="Intentos fallidos"
              value={e.verification.failedAttempts.toString()}
            />
          </Card>

          <Card
            title="SEGUIMIENTO"
            icon={DocumentDuplicateIcon}
            hasTitleDivider
            roundedClass="rounded-none"
          >
            {mockEntrega.trackingHistory.map((h) => (
              <div key={h.trackingNumber} className="space-y-4">
                {/* Tracking # }
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-600">
                    Tracking #
                  </span>
                  <span className="text-sm font-medium text-gray-900">
                    {h.trackingNumber}
                  </span>
                </div>

                {/* Primera línea divisoria }
                <hr className="border-t border-gray-200" />

                {/* Eventos }
                {h.events.map((ev, idx) => (
                  <div key={idx} className="space-y-2">
                    {/* Estado }
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-600">
                        Estado
                      </span>
                      <StatusPill status={ev.status} />
                    </div>

                    {/* Fecha }
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-600">
                        Fecha
                      </span>
                      <span className="text-sm text-gray-500">
                        {fmtDateTime(ev.date, ev.time)}
                      </span>
                    </div>

                    {/* Receptor (solo si existe) }
                    {ev.receiver && (
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-gray-600">
                          Receptor
                        </span>
                        <span className="text-sm text-gray-500">
                          {ev.receiver}
                        </span>
                      </div>
                    )}

                    {/* Divisor entre eventos (excepto después del último) }
                    {idx !== h.events.length - 1 && (
                      <hr className="border-t border-gray-100" />
                    )}
                  </div>
                ))}
                <hr className="border-t border-gray-200" />

                {/* BLOQUE DE FIRMA }
                <div className="mt-4 flex flex-col">
                  <span className="text-sm font-medium text-gray-600">
                    Firma
                  </span>
                  <img
                    src={mockEntrega.signatureUrl}
                    alt="Firma"
                    className="w-full h-12 mt-2 object-contain"
                  />
                </div>
              </div>
            ))}
          </Card>
        </div>
      </div>
    </DetalleEntregaLayout>
  );
}
 */

// app/pedidos/[id]/envios/[eid]/page.tsx
// app/pedidos/[id]/envios/[envioId]/page.tsx
"use client";
import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowDownOnSquareIcon, CheckCircleIcon, XCircleIcon } from "@heroicons/react/24/outline";
import { Action } from "@/components/layout/page-header";
import ShipmentSummary from "@/features/pedidos/components/resumen-envio/resumen";
import { ResumenEnvio } from "@/features/pedidos/types/resumenenvio";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";
import { BASE_OMS } from "@/lib/http/endpoints";

type IssueSummaryEnvio = {
  envio: string;
  entrega: string;
  deliveryCompanyName?: string;
  destino?: string;
  pedidos?: string;
  status?: string;
};

type IssueSummaryResponse = {
  resumen?: {
    totales?: {
      total?: number;
    };
  };
  datosEntrega?: {
    direccion?: string;
    empresaDelivery?: string;
    fechaEntrega?: string;
  };
  envios?: IssueSummaryEnvio[];
};

const ISSUE_SUMMARY_BASE_URL = `${BASE_OMS}/orders`;

function toDateParts(input?: string): { date: string; time: string } {
  if (!input) return { date: "", time: "" };

  const normalized = input.includes("T") ? input : input.replace(" ", "T");
  const parsed = new Date(normalized);

  if (!Number.isNaN(parsed.getTime())) {
    const date = parsed.toLocaleDateString("es-CL");
    const time = parsed.toLocaleTimeString("es-CL", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    return { date, time };
  }

  const [datePart, timePart = ""] = input.split(" ");
  return { date: datePart || "", time: timePart.slice(0, 5) };
}

function mapEnvioStatus(status?: string): ResumenEnvio["status"] {
  if (status?.toLowerCase() === "activo") return "Programada";
  return "Programada";
}

function mapEnvioStatusVariant(status?: string): ResumenEnvio["statusVariant"] {
  if (status?.toLowerCase() === "activo") return "info";
  return "warning";
}

function mapIssueSummaryToResumenEnvio(data: IssueSummaryResponse): ResumenEnvio {
  const envio = data.envios?.[0];
  const entregaDate = envio?.entrega || data.datosEntrega?.fechaEntrega || "";
  const { date, time } = toDateParts(entregaDate);
  const status = mapEnvioStatus(envio?.status);

  return {
    id: envio?.envio || "-",
    status,
    statusVariant: mapEnvioStatusVariant(envio?.status),
    startDate: date,
    startTime: time,
    endDate: date,
    endTime: time,
    carrier: envio?.deliveryCompanyName || data.datosEntrega?.empresaDelivery || "-",
    route: envio?.envio || "-",
    routePending: false,
    pendingPackages: false,
    readyToPickup: false,
    ordersCount: envio?.pedidos || "-",
    totalAmount: String(data.resumen?.totales?.total ?? 0),
    currency: "CLP",
    paymentMethod: "-",
    pickup: {
      company: envio?.deliveryCompanyName || data.datosEntrega?.empresaDelivery || "-",
      docType: "",
      docNumber: "",
      phone: "",
      email: "",
      address: "",
      city: "",
      postalCode: "",
      province: "",
      country: "",
    },
    dropoff: {
      name: "",
      surname: "",
      docType: "",
      docNumber: "",
      phone: "",
      email: "",
      address: data.datosEntrega?.direccion || envio?.destino || "-",
      city: "",
      postalCode: "",
      province: "",
      country: "",
    },
    verification: {
      verified: false,
      failedAttempts: 0,
    },
    trackingHistory: [
      {
        trackingNumber: envio?.envio || "-",
        events: [
          {
            status,
            date,
            time,
          },
        ],
      },
    ],
    signatureUrl: "",
  };
}

export function ResumenEnvioPage() {
  const { id, envioId } = useParams<{ id: string; envioId: string }>();
  const router = useRouter();
  const [shipment, setShipment] = useState<ResumenEnvio | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadIssueSummary = async () => {
      try {
        setLoadError(null);
        const orderId = Number(id) || 2061;
        const endpoint = `${ISSUE_SUMMARY_BASE_URL}/${orderId}/issue-summary`;
        const response = await fetch(endpoint, { method: "GET" });

        if (!response.ok) {
          throw new Error(`Error ${response.status} al consultar resumen de envios`);
        }

        const data = (await response.json()) as IssueSummaryResponse;
        if (!isMounted) return;

        setShipment(mapIssueSummaryToResumenEnvio(data));
      } catch (error) {
        if (!isMounted) return;
        setLoadError(error instanceof Error ? error.message : "No se pudo cargar el resumen de envios");
      }
    };

    loadIssueSummary();

    return () => {
      isMounted = false;
    };
  }, [id, envioId]);

  /*   if (!shipment) return <div>Cargando...</div>; */

  const headerActions: Action[] = [
    {
      label: "Aplicar",
      variant: "secondary",
      onClick: () => { },
      disabled: true,
      icon: <CheckCircleIcon className="h-5 w-5" />
    },
    { label: "Guardar", variant: "success", onClick: () => { }, icon: <ArrowDownOnSquareIcon className="h-5 w-5" /> },
    { label: "Volver al listado", variant: "secondary", onClick: () => router.push(`/pedidos/${id}`), icon: <XCircleIcon className="h-5 w-5" /> },
  ];
  const actions: Action[] = useMemo(
    () => [
      {
        label: "Aplicar",
        variant: "success",
        disabled: true,
        onClick: () => { },
        icon: <CheckCircleIcon className="h-5 w-5" />
      },
      { label: "Guardar", variant: "success", onClick: () => { }, icon: <ArrowDownOnSquareIcon className="h-5 w-5" /> },
      { label: "Volver al listado", variant: "secondary", onClick: () => router.push(`/pedidos/${id}`), icon: <XCircleIcon className="h-5 w-5" /> },
    ],
    [router, id]
  );
  usePageHeader(
    () => ({
      title: shipment ? `ENTREGA #${shipment.id}` : "ENTREGA",
      action: actions,
      status: shipment
        ? { text: shipment.status, variant: shipment.statusVariant }
        : undefined, // mientras carga no mostramos badge
    }),
    [shipment?.id, shipment?.status, shipment?.statusVariant, actions]
  );

  if (loadError) {
    return <div className="py-12 text-center text-red-600">{loadError}</div>;
  }

  if (!shipment) return <div className="py-12 text-center">Cargando...</div>;

  return (
    <div className="p-6 pt-0 bg-page-bg min-h-screen">
      <ShipmentSummary shipment={shipment} />
    </div>
  );
}
