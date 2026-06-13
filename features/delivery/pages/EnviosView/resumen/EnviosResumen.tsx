// app/delivery/envios/[envioId]/page.tsx
"use client";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Action } from "@/components/layout/page-header";
import ShipmentSummary from "@/features/pedidos/components/resumen-envio/resumen";
import { ResumenEnvio } from "@/features/pedidos/types/resumenenvio";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";
import SaveOutlined from "@mui/icons-material/SaveOutlined";
import { formatDateTime } from "@/lib/format/date";
import { useFetchWithAuthDelivery } from "@/lib/http/client";

import { CheckCircleIcon, XCircleIcon } from "@heroicons/react/24/outline";

type ApiShippingOrder = {
  id?: string | number | null;
  totalAmount?: string | number | null;
  currency?: string | null;
};

type ApiShippingParty = {
  fullname?: string | null;
  documentType?: string | null;
  documentNumber?: string | null;
  document?: string | null;
  phone?: string | null;
  email?: string | null;
  companyName?: string | null;
};

type ApiShippingResponse = {
  id?: string;
  refId?: string | null;
  displayId?: string | null;
  scheduleStart?: string | null;
  scheduleEnd?: string | null;
  carrierName?: string | null;
  carrierId?: string | null;
  routeId?: string | null;
  routePending?: boolean | null;
  packagePending?: boolean | null;
  readyForPickup?: boolean | null;
  orders?: ApiShippingOrder[] | ApiShippingOrder | null;
  status?: string | null;
  failedDeliveries?: number | null;
  dropoffGeoVerified?: boolean | null;
  pickupStreet?: string | null;
  pickupNumber?: string | null;
  pickupCity?: string | null;
  pickupPostalCode?: string | null;
  pickupState?: string | null;
  pickupCountry?: string | null;
  dropoffStreet?: string | null;
  dropoffNumber?: string | null;
  dropoffCity?: string | null;
  dropoffPostalCode?: string | null;
  dropoffState?: string | null;
  dropoffCountry?: string | null;
  senderFullname?: string | null;
  senderDocumentType?: string | null;
  senderDocument?: string | null;
  senderPhone?: string | null;
  senderEmail?: string | null;
  sender?: ApiShippingParty | null;
  receiver?: ApiShippingParty | null;
  pickupLat?: number | string | null;
  pickupLng?: number | string | null;
  dropoffLat?: number | string | null;
  dropoffLng?: number | string | null;
  pickup?: { lat?: number | string | null; lng?: number | string | null; geoVerified?: boolean | null } | null;
  dropoff?: { lat?: number | string | null; lng?: number | string | null; geoVerified?: boolean | null } | null;
};

type ApiCarrierItem = {
  id?: string | number | null;
  name?: string | null;
  fullname?: string | null;
  businessName?: string | null;
  companyName?: string | null;
};

type ApiCarrierResponse = {
  data?: ApiCarrierItem[] | null;
};

type ShippingPatchPayload = {
  refId?: string;
  carrierId?: string;
  schedule?: { start?: string; end?: string };
  readyForPickup?: boolean;
  sender?: {
    companyName?: string;
    documentType?: string;
    documentNumber?: string;
    document?: string;
    phone?: string;
    email?: string;
  };
  receiver?: {
    fullname?: string;
    documentType?: string;
    documentNumber?: string;
    document?: string;
    phone?: string;
    email?: string;
  };
  pickup?: {
    country?: string;
    state?: string;
    city?: string;
    street?: string;
    number?: string;
    postalCode?: string;
    lat?: number;
    lng?: number;
    geoVerified?: boolean;
  };
  dropoff?: {
    country?: string;
    state?: string;
    city?: string;
    street?: string;
    number?: string;
    postalCode?: string;
    lat?: number;
    lng?: number;
    geoVerified?: boolean;
  };
};

const GOOGLE_MAPS_API_KEY = String(process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "").trim();

const toNullable = (value: unknown) => {
  const text = String(value ?? "").trim();
  return text && text !== "-" ? text : undefined;
};

const toFiniteNumber = (value: unknown): number | undefined => {
  const num = Number(value);
  return Number.isFinite(num) ? num : undefined;
};

const buildAddressQuery = (address?: string, city?: string, state?: string, country?: string) =>
  [address, city, state, country || "Chile"].map((v) => String(v ?? "").trim()).filter(Boolean).join(", ");

const geocodeAddress = async (query: string): Promise<{ lat?: number; lng?: number }> => {
  if (!query || !GOOGLE_MAPS_API_KEY) return {};

  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)}&key=${GOOGLE_MAPS_API_KEY}`;
    const response = await fetch(url, { method: "GET" });
    if (!response.ok) return {};

    const data = await response.json();
    const first = Array.isArray(data?.results) ? data.results[0] : null;
    const lat = toFiniteNumber(first?.geometry?.location?.lat);
    const lng = toFiniteNumber(first?.geometry?.location?.lng);
    return { lat, lng };
  } catch {
    return {};
  }
};

const resolveAddressCoordinates = async (
  current: { lat?: number; lng?: number },
  addressData: { address?: string; city?: string; state?: string; country?: string },
) => {
  if (current.lat !== undefined && current.lng !== undefined) return current;

  const query = buildAddressQuery(addressData.address, addressData.city, addressData.state, addressData.country);
  const geocoded = await geocodeAddress(query);
  return { lat: geocoded.lat, lng: geocoded.lng };
};

const splitStreetAndNumber = (value?: string) => {
  const raw = String(value ?? "").trim();
  if (!raw) return { street: undefined as string | undefined, number: undefined as string | undefined };

  const match = raw.match(/^(.*?)(?:\s+#?\s*(\d+[A-Za-z0-9-]*))$/);
  if (!match) return { street: raw, number: undefined };

  const street = String(match[1] ?? "").trim() || raw;
  const number = String(match[2] ?? "").trim() || undefined;
  return { street, number };
};

function hasOwnKeys(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && Object.keys(value as Record<string, unknown>).length > 0;
}

function buildShippingPatchPayloadFromChanges(
  shipment: ResumenEnvio,
  source: ApiShippingResponse | null,
  scheduleStart?: string,
  scheduleEnd?: string,
  pickupCoords?: { lat?: number; lng?: number },
  dropoffCoords?: { lat?: number; lng?: number },
): ShippingPatchPayload {
  const pickupAddress = splitStreetAndNumber(shipment.pickup.address);
  const dropoffAddress = splitStreetAndNumber(shipment.dropoff.address);

  const payload: ShippingPatchPayload = {};

  const nextScheduleStart = toNullable(scheduleStart);
  const nextScheduleEnd = toNullable(scheduleEnd);
  const currentScheduleStart = toNullable(source?.scheduleStart);
  const currentScheduleEnd = toNullable(source?.scheduleEnd);
  if (nextScheduleStart !== currentScheduleStart || nextScheduleEnd !== currentScheduleEnd) {
    payload.schedule = {
      start: nextScheduleStart,
      end: nextScheduleEnd,
    };
  }

  const currentReadyForPickup = Boolean(source?.readyForPickup);
  if (shipment.readyToPickup !== currentReadyForPickup) {
    payload.readyForPickup = shipment.readyToPickup;
  }

  const nextCarrierId = toNullable(shipment.carrierId);
  const currentCarrierId = toNullable(source?.carrierId);
  if (nextCarrierId !== currentCarrierId) {
    payload.carrierId = nextCarrierId;
  }

  const nextSenderCompany = toNullable(shipment.pickup.company);
  const currentSenderCompany = toNullable(source?.senderFullname ?? source?.sender?.companyName);
  const nextSenderDocumentType = toNullable(shipment.pickup.docType);
  const nextSenderDocument = toNullable(shipment.pickup.docNumber);
  const nextSenderPhone = toNullable(shipment.pickup.phone);
  const nextSenderEmail = toNullable(shipment.pickup.email);
  const currentSenderDocumentType = toNullable(source?.senderDocumentType ?? source?.sender?.documentType);
  const currentSenderDocument = toNullable(source?.senderDocument ?? source?.sender?.documentNumber ?? source?.sender?.document);
  const currentSenderPhone = toNullable(source?.senderPhone ?? source?.sender?.phone);
  const currentSenderEmail = toNullable(source?.senderEmail ?? source?.sender?.email);
  const senderPatch: ShippingPatchPayload["sender"] = {};
  if (nextSenderCompany !== currentSenderCompany) senderPatch.companyName = nextSenderCompany;
  if (nextSenderDocumentType !== currentSenderDocumentType) senderPatch.documentType = nextSenderDocumentType;
  if (nextSenderDocument !== currentSenderDocument) {
    senderPatch.documentNumber = nextSenderDocument;
    senderPatch.document = nextSenderDocument;
  }
  if (nextSenderPhone !== currentSenderPhone) senderPatch.phone = nextSenderPhone;
  if (nextSenderEmail !== currentSenderEmail) senderPatch.email = nextSenderEmail;
  if (hasOwnKeys(senderPatch)) payload.sender = senderPatch;

  const nextReceiverFullname = toNullable(shipment.dropoff.name);
  const nextReceiverDocumentType = toNullable(shipment.dropoff.docType);
  const nextReceiverDocument = toNullable(shipment.dropoff.docNumber);
  const nextReceiverPhone = toNullable(shipment.dropoff.phone);
  const nextReceiverEmail = toNullable(shipment.dropoff.email);
  const currentReceiverFullname = toNullable(source?.receiver?.fullname);
  const currentReceiverDocumentType = toNullable(source?.receiver?.documentType);
  const currentReceiverDocument = toNullable(source?.receiver?.documentNumber ?? source?.receiver?.document);
  const currentReceiverPhone = toNullable(source?.receiver?.phone);
  const currentReceiverEmail = toNullable(source?.receiver?.email);
  const receiverPatch: ShippingPatchPayload["receiver"] = {};
  if (nextReceiverFullname !== currentReceiverFullname) receiverPatch.fullname = nextReceiverFullname;
  if (nextReceiverDocumentType !== currentReceiverDocumentType) receiverPatch.documentType = nextReceiverDocumentType;
  if (nextReceiverDocument !== currentReceiverDocument) {
    receiverPatch.documentNumber = nextReceiverDocument;
    receiverPatch.document = nextReceiverDocument;
  }
  if (nextReceiverPhone !== currentReceiverPhone) receiverPatch.phone = nextReceiverPhone;
  if (nextReceiverEmail !== currentReceiverEmail) receiverPatch.email = nextReceiverEmail;
  if (hasOwnKeys(receiverPatch)) payload.receiver = receiverPatch;

  const pickupPatch: ShippingPatchPayload["pickup"] = {};
  const nextPickupCountry = toNullable(shipment.pickup.country);
  const nextPickupState = toNullable(shipment.pickup.province);
  const nextPickupCity = toNullable(shipment.pickup.city);
  const nextPickupStreet = toNullable(pickupAddress.street);
  const nextPickupNumber = toNullable(pickupAddress.number);
  const nextPickupPostalCode = toNullable(shipment.pickup.postalCode);
  const nextPickupLat = toFiniteNumber(pickupCoords?.lat);
  const nextPickupLng = toFiniteNumber(pickupCoords?.lng);

  if (nextPickupCountry !== toNullable(source?.pickupCountry)) pickupPatch.country = nextPickupCountry;
  if (nextPickupState !== toNullable(source?.pickupState)) pickupPatch.state = nextPickupState;
  if (nextPickupCity !== toNullable(source?.pickupCity)) pickupPatch.city = nextPickupCity;
  if (nextPickupStreet !== toNullable(source?.pickupStreet)) pickupPatch.street = nextPickupStreet;
  if (nextPickupNumber !== toNullable(source?.pickupNumber)) pickupPatch.number = nextPickupNumber;
  if (nextPickupPostalCode !== toNullable(source?.pickupPostalCode)) pickupPatch.postalCode = nextPickupPostalCode;
  if (nextPickupLat !== toFiniteNumber(source?.pickupLat ?? source?.pickup?.lat)) pickupPatch.lat = nextPickupLat;
  if (nextPickupLng !== toFiniteNumber(source?.pickupLng ?? source?.pickup?.lng)) pickupPatch.lng = nextPickupLng;
  if (hasOwnKeys(pickupPatch)) payload.pickup = pickupPatch;

  const dropoffPatch: ShippingPatchPayload["dropoff"] = {};
  const nextDropoffCountry = toNullable(shipment.dropoff.country);
  const nextDropoffState = toNullable(shipment.dropoff.province);
  const nextDropoffCity = toNullable(shipment.dropoff.city);
  const nextDropoffStreet = toNullable(dropoffAddress.street);
  const nextDropoffNumber = toNullable(dropoffAddress.number);
  const nextDropoffPostalCode = toNullable(shipment.dropoff.postalCode);
  const nextDropoffLat = toFiniteNumber(dropoffCoords?.lat);
  const nextDropoffLng = toFiniteNumber(dropoffCoords?.lng);

  if (nextDropoffCountry !== toNullable(source?.dropoffCountry)) dropoffPatch.country = nextDropoffCountry;
  if (nextDropoffState !== toNullable(source?.dropoffState)) dropoffPatch.state = nextDropoffState;
  if (nextDropoffCity !== toNullable(source?.dropoffCity)) dropoffPatch.city = nextDropoffCity;
  if (nextDropoffStreet !== toNullable(source?.dropoffStreet)) dropoffPatch.street = nextDropoffStreet;
  if (nextDropoffNumber !== toNullable(source?.dropoffNumber)) dropoffPatch.number = nextDropoffNumber;
  if (nextDropoffPostalCode !== toNullable(source?.dropoffPostalCode)) dropoffPatch.postalCode = nextDropoffPostalCode;
  if (nextDropoffLat !== toFiniteNumber(source?.dropoffLat ?? source?.dropoff?.lat)) dropoffPatch.lat = nextDropoffLat;
  if (nextDropoffLng !== toFiniteNumber(source?.dropoffLng ?? source?.dropoff?.lng)) dropoffPatch.lng = nextDropoffLng;
  if (hasOwnKeys(dropoffPatch)) payload.dropoff = dropoffPatch;

  return payload;
}

type ApiTrackingEvent = {
  status?: string | null;
  date?: string | null;
  dateCreated?: string | null;
  createdAt?: string | null;
  receiver?: string | null;
  receivedBy?: string | null;
};

type ApiTrackingItem = {
  trackingNumber?: string | null;
  refId?: string | null;
  events?: ApiTrackingEvent[] | null;
};

type ApiTrackingResponse = {
  data?: ApiTrackingItem[] | ApiTrackingItem | null;
};

const toDash = (value: unknown) => {
  const text = String(value ?? "").trim();
  return text || "-";
};

function toDateTimeParts(value?: string | null) {
  if (!value) return { date: "-", time: "" };
  const parts = formatDateTime(value, { locale: "es-CL", timeZone: "America/Santiago" });
  const date = parts?.date && parts.date !== "Sin datos" && parts.date !== "Fecha no válida" ? parts.date : "-";
  const time = parts?.time && parts.time !== "Sin datos" && parts.time !== "Fecha no válida" ? parts.time.slice(0, 5) : "";
  return { date, time };
}

function mapStatus(statusRaw?: string | null): ResumenEnvio["status"] {
  const status = String(statusRaw ?? "").trim().toLowerCase();
  if (status === "created") return "Creada";
  if (status === "scheduled") return "Programada";
  if (status === "started" || status === "in_progress" || status === "inprogress") return "Iniciado";
  if (status === "arrived") return "Arribado";
  if (status === "delivered") return "Entregado";
  return "Creada";
}

function mapStatusVariant(statusRaw?: string | null): ResumenEnvio["statusVariant"] {
  const status = String(statusRaw ?? "").trim().toLowerCase();
  if (status === "delivered") return "success";
  if (status === "created") return "info";
  if (status === "scheduled" || status === "started" || status === "in_progress") return "warning";
  return "info";
}

function mapTrackingHistory(trackingResponse: ApiTrackingResponse | null | undefined, shippingId: string, displayId: string) {
  const trackingData = trackingResponse?.data;
  const list = Array.isArray(trackingData)
    ? trackingData
    : trackingData
      ? [trackingData]
      : [];

  if (list.length === 0) {
    return [
      {
        trackingNumber: displayId,
        events: [] as ResumenEnvio["trackingHistory"][number]["events"],
      },
    ];
  }

  return list.map((item, index) => {
    const events = (Array.isArray(item?.events) ? item.events : []).map((ev) => {
      const dt = toDateTimeParts(ev?.date ?? ev?.dateCreated ?? ev?.createdAt);
      return {
        status: mapStatus(ev?.status),
        date: dt.date,
        time: dt.time,
        receiver: toDash(ev?.receiver ?? ev?.receivedBy),
      };
    });

    return {
      trackingNumber: toDash(item?.trackingNumber ?? item?.refId ?? (index === 0 ? displayId : `${shippingId}-${index + 1}`)),
      events,
    };
  });
}

export function GlobalEnvioView() {
  const params = useParams<{ id?: string; envioId?: string }>();
  const shippingId = params?.id ?? params?.envioId ?? "";
  const router = useRouter();
  const { fetchWithAuthDelivery, token } = useFetchWithAuthDelivery();
  const [shipment, setShipment] = useState<ResumenEnvio | null>(null);
  const [shippingRaw, setShippingRaw] = useState<ApiShippingResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>("");
  const [carrierOptions, setCarrierOptions] = useState<Array<{ id: string; name: string }>>([]);

  useEffect(() => {
    if (!token || !shippingId) return;
    let mounted = true;

    const loadShipment = async () => {
      if (mounted) {
        setLoading(true);
        setError("");
      }

      try {
        const [shippingRes, trackingRes] = await Promise.all([
          fetchWithAuthDelivery<ApiShippingResponse>(`shipping/${shippingId}`, { method: "GET" }),
          fetchWithAuthDelivery<ApiTrackingResponse>(`shipping/${shippingId}/tracking`, { method: "GET" }),
        ]);

        try {
          const carrierRes = await fetchWithAuthDelivery<ApiCarrierResponse | ApiCarrierItem[]>("carrier", { method: "GET" });
          const rawItems = Array.isArray(carrierRes)
            ? carrierRes
            : Array.isArray(carrierRes?.data)
              ? carrierRes.data
              : [];

          const normalized = rawItems
            .map((item) => {
              const id = String(item?.id ?? "").trim();
              const name = String(
                item?.name ?? item?.fullname ?? item?.businessName ?? item?.companyName ?? ""
              ).trim();
              return id && name ? { id, name } : null;
            })
            .filter((item): item is { id: string; name: string } => Boolean(item));

          if (mounted) setCarrierOptions(normalized);
        } catch {
          if (mounted) setCarrierOptions([]);
        }

        const start = toDateTimeParts(shippingRes?.scheduleStart);
        const end = toDateTimeParts(shippingRes?.scheduleEnd);

        const orderList = Array.isArray(shippingRes?.orders)
          ? shippingRes.orders
          : shippingRes?.orders
            ? [shippingRes.orders]
            : [];
        const firstOrder = orderList[0] ?? {};

        const mapped: ResumenEnvio = {
          id: toDash(shippingRes?.displayId ?? shippingRes?.refId ?? shippingRes?.id ?? shippingId),
          scheduleStart: shippingRes?.scheduleStart ?? undefined,
          scheduleEnd: shippingRes?.scheduleEnd ?? undefined,
          carrierId: toNullable(shippingRes?.carrierId),
          status: mapStatus(shippingRes?.status),
          statusVariant: mapStatusVariant(shippingRes?.status),
          startDate: start.date,
          startTime: start.time,
          endDate: end.date,
          endTime: end.time,
          carrier: toDash(shippingRes?.carrierName ?? shippingRes?.carrierId),
          route: toDash(shippingRes?.routeId),
          routePending: Boolean(shippingRes?.routePending),
          pendingPackages: Boolean(shippingRes?.packagePending),
          readyToPickup: Boolean(shippingRes?.readyForPickup),
          ordersCount: toDash(firstOrder?.id),
          totalAmount: toDash(firstOrder?.totalAmount),
          currency: toDash(firstOrder?.currency ?? "CLP"),
          paymentMethod: "-",
          pickup: {
            company: toDash(shippingRes?.senderFullname ?? shippingRes?.sender?.companyName),
            docType: toDash(shippingRes?.senderDocumentType ?? shippingRes?.sender?.documentType),
            docNumber: toDash(shippingRes?.senderDocument ?? shippingRes?.sender?.documentNumber ?? shippingRes?.sender?.document),
            phone: toDash(shippingRes?.senderPhone ?? shippingRes?.sender?.phone),
            email: toDash(shippingRes?.senderEmail ?? shippingRes?.sender?.email),
            address: toDash(`${shippingRes?.pickupStreet ?? ""} ${shippingRes?.pickupNumber ?? ""}`.trim()),
            city: toDash(shippingRes?.pickupCity),
            postalCode: toDash(shippingRes?.pickupPostalCode),
            province: toDash(shippingRes?.pickupState),
            country: toDash(shippingRes?.pickupCountry),
          },
          dropoff: {
            name: toDash(shippingRes?.receiver?.fullname),
            surname: "-",
            docType: toDash(shippingRes?.receiver?.documentType),
            docNumber: toDash(shippingRes?.receiver?.documentNumber ?? shippingRes?.receiver?.document),
            phone: toDash(shippingRes?.receiver?.phone),
            email: toDash(shippingRes?.receiver?.email),
            address: toDash(`${shippingRes?.dropoffStreet ?? ""} ${shippingRes?.dropoffNumber ?? ""}`.trim()),
            city: toDash(shippingRes?.dropoffCity),
            postalCode: toDash(shippingRes?.dropoffPostalCode),
            province: toDash(shippingRes?.dropoffState),
            country: toDash(shippingRes?.dropoffCountry),
          },
          verification: {
            verified: Boolean(shippingRes?.dropoffGeoVerified),
            failedAttempts: Number(shippingRes?.failedDeliveries ?? 0),
          },
          trackingHistory: mapTrackingHistory(
            trackingRes,
            String(shippingRes?.id ?? shippingId),
            toDash(shippingRes?.displayId ?? shippingRes?.refId ?? shippingRes?.id ?? shippingId)
          ),
          signatureUrl: "",
        };

        if (mounted) {
          setShippingRaw(shippingRes ?? null);
          setShipment(mapped);
        }
      } catch (error) {
        console.error("Error obteniendo resumen de envío:", error);
        if (mounted) {
          setShipment(null);
          setError("No se pudo cargar el envío.");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadShipment();
    return () => {
      mounted = false;
    };
  }, [shippingId, fetchWithAuthDelivery, token]);

  const handleSaveShipment = useCallback(async () => {
    if (!shipment) return;
    const targetId = String(shippingRaw?.id ?? shippingId ?? "").trim();
    if (!targetId) {
      setError("No se encontró el id interno del envío para actualizar.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const scheduleStart = shipment.scheduleStart ?? shippingRaw?.scheduleStart ?? undefined;
      const scheduleEnd = shipment.scheduleEnd ?? shippingRaw?.scheduleEnd ?? undefined;
      if (!scheduleStart || !scheduleEnd) {
        throw new Error("Debes completar Inicio y Finalización antes de guardar.");
      }

      const currentPickupCoords = {
        lat: toFiniteNumber(shippingRaw?.pickupLat ?? shippingRaw?.pickup?.lat),
        lng: toFiniteNumber(shippingRaw?.pickupLng ?? shippingRaw?.pickup?.lng),
      };
      const currentDropoffCoords = {
        lat: toFiniteNumber(shippingRaw?.dropoffLat ?? shippingRaw?.dropoff?.lat),
        lng: toFiniteNumber(shippingRaw?.dropoffLng ?? shippingRaw?.dropoff?.lng),
      };

      const [pickupCoords, dropoffCoords] = await Promise.all([
        resolveAddressCoordinates(currentPickupCoords, {
          address: shipment.pickup.address,
          city: shipment.pickup.city,
          state: shipment.pickup.province,
          country: shipment.pickup.country,
        }),
        resolveAddressCoordinates(currentDropoffCoords, {
          address: shipment.dropoff.address,
          city: shipment.dropoff.city,
          state: shipment.dropoff.province,
          country: shipment.dropoff.country,
        }),
      ]);

      if (pickupCoords.lat === undefined || pickupCoords.lng === undefined) {
        throw new Error("No se pudieron obtener pickup.lat y pickup.lng desde la dirección de Pickup.");
      }

      if (dropoffCoords.lat === undefined || dropoffCoords.lng === undefined) {
        throw new Error("No se pudieron obtener dropoff.lat y dropoff.lng desde la dirección de Dropoff.");
      }

      const payload = buildShippingPatchPayloadFromChanges(
        shipment,
        shippingRaw,
        scheduleStart,
        scheduleEnd,
        pickupCoords,
        dropoffCoords,
      );

      if (!hasOwnKeys(payload)) {
        return;
      }

      await fetchWithAuthDelivery(`shipping/${encodeURIComponent(targetId)}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
    } catch (e: any) {
      setError(String(e?.message || e));
    } finally {
      setSaving(false);
    }
  }, [shipment, shippingRaw, shippingId, fetchWithAuthDelivery]);

  const headerActions: Action[] = useMemo(
    () => [
      {
        label: "Aplicar",
        variant: "success",
        icon: <CheckCircleIcon className="h-5 w-5" />,
        onClick: () => { void handleSaveShipment(); },
        disabled: saving || loading || !shipment,
      },
      {
        label: "Guardar",
        variant: "success",
        icon: <SaveOutlined className="h-5 w-5" />,
        onClick: () => { void handleSaveShipment(); },
        disabled: saving || loading || !shipment,
      },
      {
        label: "Volver al listado",
        variant: "secondary",
        icon: <XCircleIcon className="h-5 w-5" />,
        onClick: () => router.push("/delivery/envios"),
        disabled: saving,
      },
    ],
    [handleSaveShipment, loading, router, saving, shipment]
  );

  const headerTitle = useMemo(
    () => (
      <span className="inline-flex flex-col items-start leading-tight">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-sky-600">
          Entregas
        </span>
        <span className="text-xl font-semibold text-gray-900">
          {shipment?.id || "-"}
        </span>
      </span>
    ),
    [shipment?.id]
  );

  usePageHeader(
    () => ({
      title: headerTitle,
      action: headerActions,
      status: shipment
        ? { text: shipment.status, variant: shipment.statusVariant }
        : undefined,          // mientras carga no mostramos badge
    }),
    [headerTitle, shipment?.status, shipment?.statusVariant, headerActions]
  );
  if (loading) return <div>Cargando...</div>;
  if (error) return <div>{error}</div>;
  if (!shipment) return <div>No hay información del envío.</div>;

  return (

    // <div className="p-6 bg-page-bg min-h-screen">
    <div className="pb-8">
      <ShipmentSummary shipment={shipment} editable onChange={setShipment} carrierOptions={carrierOptions} />
    </div>
  );
}
