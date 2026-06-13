// views\Almacen\Gestion\Ingreso\Resumen\OrderIngresoResumenView.tsx

"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/app/context/auth/AuthContext";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";
import type { Action, PageHeaderProps } from "@/components/layout/page-header";
import { OrderActionBar } from "@/features/almacenes/components/gestion/ingreso/OrderActionBar";
import { OrderFields, Order } from "@/features/almacenes/components/gestion/ingreso/OrderFields";
import {
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  UserPlusIcon,
  NoSymbolIcon,
  PaperAirplaneIcon,
  PlayCircleIcon,
  InboxArrowDownIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";
import { warehousesAll } from "@/app/fetchWithAuth/api-almacenes/warehouses";
import { useFetchWithAuthQA } from "@/app/fetchWithAuth/fetch-with-auth";
import { customerGet } from "@/app/fetchWithAuth/api-clientes/clientes/customers";
import { fmtDateTime } from "@/lib/format/date";
import { BASE_ID_SERVICE, BASE_WAREHOUSES, CATALOG_PRODUCTS_API } from "@/lib/http/endpoints";


import { withAuthPlatformHeaders } from "@/features/almacenes/services/auth-headers";
// util local
const ts = () => {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
};

// fmtDateTime imported from @/lib/format/date

// ResumenView.tsx

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
  cardCode: string;
};

type SupplyingDetail = {
  id: string;
  displayId: string;
  warehouseId: string | null;
  supplierId: string | null;
  supplierName?: string | null;
  packingSlip: string | null;
  invoiceNumber: string | null;
  assigneeId: string | null;
  unloadingPositionId?: string | null;
  estimatedDate?: {
    from?: string | null;
    to?: string | null;
  } | null;
  items?: Array<{
    skuId?: string | null;
    skuReferenceId?: string | null;
    quantity?: number | null;
  }>;
  status: string;
  sapOporDocEntry?: number | null;
  folioNumber?: number | null;
  folioPrefixString?: string | null;
  dateCreated: string;
  dateModified: string;
  userCreated: string | null;
  userModified: string | null;
};

type FormLine = {
  itemSku: string;
  itemLabel?: string;
  itemImage?: string;
  orderedQty: number;
  openQty: number;
  lineNum: number;
  poDocEntry: number;
};

type CatalogProductResponse = {
  sku?: string | null;
  SKU?: string | null;
  name?: string | null;
  Name?: string | null;
  description?: string | null;
  Description?: string | null;
  itemName?: string | null;
  productName?: string | null;
  image?: string | null;
  Image?: string | null;
  imageUrl?: string | null;
  ImageUrl?: string | null;
  mainImage?: string | null;
  MainImage?: string | null;
};

type StockMovementMotive = {
  id?: string | null;
  refId?: string | null;
  code?: string | null;
  name?: string | null;
  status?: string | null;
};

type ReceiveItemForm = {
  skuId: string;
  productName?: string;
  quantityReceived: number;
};

type InboundPositionResponse = {
  id?: string | number;
  refId?: string | number;
  positionId?: string | number;
  positionKey?: string;
  code?: string;
  name?: string;
  label?: string;
  positionName?: string;
};

type AssignedUserResponse = {
  id?: string | number;
  ID?: string | number;
  usuarioId?: string | number;
  userId?: string | number;
  username?: string;
  userName?: string;
  FIRSTNAME?: string;
  LASTNAME?: string;
  nombre?: string;
  name?: string;
  email?: string;
  EMAIL?: string;
};

const SUPPLYING_URL = `${BASE_WAREHOUSES}/supplying`;
const STOCK_MOVEMENT_MOTIVE_URL = `${BASE_WAREHOUSES}/stock-movement-motive`;
const INBOUND_POSITION_URL = `${BASE_WAREHOUSES}/position?filters[schemaType]=inbound`;
const CATALOG_PRODUCT_BY_SKU_URL = `${CATALOG_PRODUCTS_API}/SKU`;
const USERS_QA_URL = `${BASE_ID_SERVICE}/usuarios?page=1&pageSize=500`;
const JANIS_HEADERS: Record<string, string> = withAuthPlatformHeaders({
  "janis-api-key": "test-key",
  "janis-api-secret": "test-secret",
  "janis-client": "test-client",
});

const resolveProductName = (payload: unknown): string => {
  const asObject = (payload && typeof payload === "object" ? payload : {}) as CatalogProductResponse;
  return String(
    asObject.Name ??
    asObject.name ??
    asObject.itemName ??
    asObject.productName ??
    asObject.description ??
    asObject.Description ??
    ""
  ).trim();
};

const resolveProductImage = (payload: unknown): string => {
  const asObject = (payload && typeof payload === "object" ? payload : {}) as CatalogProductResponse;
  return String(
    asObject.ImageUrl ??
    asObject.imageUrl ??
    asObject.MainImage ??
    asObject.mainImage ??
    asObject.Image ??
    asObject.image ??
    ""
  ).trim();
};

const mapDocStatus = (status?: string): "O" | "C" => {
  const s = String(status || "").toLowerCase();
  if (s === "approved" || s === "received") return "C";
  return "O";
};

export function OrderResumenPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { fetchWithAuthQA } = useFetchWithAuthQA();
  const [order, setOrder] = useState<Order | null>(null);
  const [supplyingStatus, setSupplyingStatus] = useState<string>("pending");
  const [formLines, setFormLines] = useState<FormLine[]>([]);
  const [emToWhId, setEmToWhId] = useState<string>("");
  const [loading, setLoading] = useState(true);

  // para mostrar mensaje de posteo correcto 
  const [posting, setPosting] = useState(false);
  const [emMessage, setEmMessage] = useState<{
    type: "success" | "error" | "info";
    text: string;
  } | null>(null);

  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelSubmitting, setCancelSubmitting] = useState(false);
  const [motiveLoading, setMotiveLoading] = useState(false);
  const [motiveOptions, setMotiveOptions] = useState<Array<{ value: string; label: string }>>([]);
  const [selectedMotiveRefId, setSelectedMotiveRefId] = useState("");

  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [requestSubmitting, setRequestSubmitting] = useState(false);
  const [requestComment, setRequestComment] = useState("");

  const [receiveModalOpen, setReceiveModalOpen] = useState(false);
  const [receiveSubmitting, setReceiveSubmitting] = useState(false);
  const [unloadingPositionId, setUnloadingPositionId] = useState("");
  const [unloadingPositionOptions, setUnloadingPositionOptions] = useState<Array<{ value: string; label: string }>>([]);
  const [unloadingPositionLoading, setUnloadingPositionLoading] = useState(false);
  const [folioNumber, setFolioNumber] = useState<string>("");
  const [folioDocType, setFolioDocType] = useState<"GE" | "FE">("GE");
  const [receiveItems, setReceiveItems] = useState<ReceiveItemForm[]>([{ skuId: "", quantityReceived: 1 }]);
  const [assignedOptions, setAssignedOptions] = useState<Array<{ value: string; label: string }>>([]);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [assignModalSelectedUser, setAssignModalSelectedUser] = useState("");
  const [assignModalSubmitting, setAssignModalSubmitting] = useState(false);;

  const recordId = Array.isArray(id) ? id[0] : id;
  const supplyingId = recordId ? String(recordId) : "";

  const loggedUserId = useMemo(() => {
    const fromContext = String((user as any)?.id ?? (user as any)?.ID ?? (user as any)?.userId ?? "").trim();
    if (fromContext) return fromContext;

    try {
      const authState = JSON.parse(localStorage.getItem("authState") || "{}");
      const fallback = String(
        authState?.user?.id ?? authState?.user?.ID ?? authState?.user?.userId ?? authState?.user?.usuarioId ?? ""
      ).trim();
      return fallback;
    } catch {
      return "";
    }
  }, [user]);

  // ?? NUEVO: estado para el formulario de Entrada de Mercanca y cantidades por lnea
  const [emHeader, setEmHeader] = useState<EMHeader>({
    docType: "EP",
    toWh: "",               // from OC
    reference: "",          // "OC-<poDocEntry>"
    user: "",               // editable
    source: "OMS",          // editable
    series: "Primario",     // editable
    indicator: 52,    // editable
    prefix: "EM",           // editable
    folioNumber: "",  // from OC
    externalRef: "",        // autogenerado con timestamp
    comments: "",           // textarea editable
    cardCode: "",           // vendorCode (por si lo ocupas luego)
  });

  // cantidades por lnea (key = lineNum)
  const [lineQty, setLineQty] = useState<Record<number, number>>({});
  // ??

  const normalizeAssignedUser = React.useCallback((user: AssignedUserResponse) => {
    const value = String(user.id ?? user.ID ?? user.usuarioId ?? user.userId ?? "").trim();
    const fullName = `${String(user.FIRSTNAME ?? "").trim()} ${String(user.LASTNAME ?? "").trim()}`.trim();
    const username = String(user.username ?? user.userName ?? user.nombre ?? user.name ?? fullName).trim();
    const email = String(user.email ?? user.EMAIL ?? "").trim();

    if (!value) return null;

    const labelBase = username || email || value;
    const label = email && username ? `${username} (${email})` : labelBase;
    return { value, label };
  }, []);

  const onOrderFieldChange = React.useCallback((field: keyof Order, value: string) => {
    setOrder((prev) => {
      if (!prev) return prev;
      return { ...prev, [field]: value };
    });
  }, []);

  const fetchProductMetaBySkus = React.useCallback(async (skus: string[]): Promise<Map<string, { name: string; image: string }>> => {
    const uniqueSkus = Array.from(new Set(skus.map((sku) => String(sku || "").trim()).filter(Boolean)));
    const entries = await Promise.all(
      uniqueSkus.map(async (sku) => {
        try {
          const url = CATALOG_PRODUCT_BY_SKU_URL.replace(/SKU$/, encodeURIComponent(sku));
          const json = await fetchWithAuthQA<any>(url, { method: "GET", cache: "no-store" });
          const productPayload = Array.isArray(json)
            ? json[0]
            : Array.isArray(json?.data)
              ? json.data[0]
              : json?.data ?? json;
          const name = resolveProductName(productPayload);
          const image = resolveProductImage(productPayload);
          return [sku, { name, image }] as const;
        } catch {
          return [sku, { name: "", image: "" }] as const;
        }
      })
    );

    return new Map(entries.filter(([, meta]) => Boolean(meta.name || meta.image)));
  }, [fetchWithAuthQA]);

  // Cargar detalle desde supplying/{id}
  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        setLoading(true);

        if (!supplyingId) {
          if (mounted) {
            setOrder(null);
            setFormLines([]);
            setLoading(false);
          }
          return;
        }

        const [detailRes, warehousesRes, usersResp] = await Promise.all([
          fetch(`${SUPPLYING_URL}/${encodeURIComponent(supplyingId)}`, {
            method: "GET",
            headers: JANIS_HEADERS,
          }),
          warehousesAll({ page: 1, pageSize: 500 }),
          fetchWithAuthQA<any>(USERS_QA_URL, { method: "GET" }),
        ]);

        if (!detailRes.ok) throw new Error(`HTTP ${detailRes.status}`);

        const detail = (await detailRes.json()) as SupplyingDetail;
        const normalizedStatus = String(detail.status || "").toLowerCase();
        const warehouseById = new Map(
          (warehousesRes.items ?? []).map((wh) => [String(wh.id).toUpperCase(), wh.name])
        );
        const usersPayload = (Array.isArray(usersResp?.data) ? usersResp.data : usersResp) as AssignedUserResponse[];
        const uniqueAssigned = Array.from(
          new Map(
            (Array.isArray(usersPayload) ? usersPayload : [])
              .map(normalizeAssignedUser)
              .filter(Boolean)
              .map((user) => [user!.value, user!] as const)
          ).values()
        ).sort((a, b) => a.label.localeCompare(b.label));
        const itemSkus = (detail.items ?? []).map((item) => String(item.skuReferenceId || item.skuId || "").trim());
        const skuMetaBySku = await fetchProductMetaBySkus(itemSkus);
        const warehouseName = warehouseById.get(String(detail.warehouseId || "").toUpperCase()) || "";
        const supplierId = String(detail.supplierId || "").trim();
        let supplierDisplayName = String(detail.supplierName || "").trim();

        if (!supplierDisplayName && supplierId) {
          try {
            const supplier = await customerGet(supplierId);
            supplierDisplayName =
              `${String(supplier.FirstName || "").trim()} ${String(supplier.LastName || "").trim()}`.trim() ||
              String(supplier.Email || "").trim() ||
              String(supplier.RUT || supplier.Id || "").trim();
          } catch {
            supplierDisplayName = "";
          }
        }

        const lineItems: FormLine[] = (detail.items ?? []).map((item, idx) => {
          const qty = Number(item.quantity ?? 0);
          const sku = String(item.skuReferenceId || item.skuId || "").trim();
          const skuMeta = skuMetaBySku.get(sku);
          const skuName = String(skuMeta?.name || "").trim();
          const skuImage = String(skuMeta?.image || "").trim();
          return {
            itemSku: sku,
            itemLabel: skuName ? `${sku} - ${skuName}` : sku,
            itemImage: skuImage,
            orderedQty: qty,
            openQty: qty,
            lineNum: idx,
            poDocEntry: Number(detail.sapOporDocEntry ?? 0),
          };
        });

        const docStatus = mapDocStatus(detail.status);
        const mapped: Order = {
          id: detail.id,
          inventory: warehouseById.get(String(detail.warehouseId || "").toUpperCase()) || "",
          slot: detail.unloadingPositionId ? String(detail.unloadingPositionId) : "",
          estimatedFrom: detail.estimatedDate?.from ? fmtDateTime(detail.estimatedDate.from) : "",
          estimatedTo: detail.estimatedDate?.to ? fmtDateTime(detail.estimatedDate.to) : "",
          deliveryNote: detail.folioNumber != null ? String(detail.folioNumber) : "",
          invoice: detail.invoiceNumber || "",
          vendorName: supplierDisplayName || supplierId || "",
          vendorCode: detail.supplierId || "",
          assignedTo: detail.assigneeId || "",
          docStatus,
          items: {
            sku: lineItems[0]?.itemSku || "",
            quantity: String(lineItems[0]?.orderedQty ?? ""),
          },
          created: {
            username: detail.userCreated || "",
            email: "-",
            date: fmtDateTime(detail.dateCreated),
          },
          modified: {
            username: detail.userModified || "",
            email: "-",
            date: fmtDateTime(detail.dateModified),
          },
          comments: "",
        };

        if (mounted) {
          setSupplyingStatus(normalizedStatus);
          setAssignedOptions(uniqueAssigned);
          setOrder(mapped);
          const initialDocType = String(detail.folioPrefixString || "").toUpperCase() === "FE" ? "FE" : "GE";
          const initialFolioByType =
            initialDocType === "FE"
              ? String(detail.invoiceNumber || "")
              : String(detail.folioNumber ?? "");
          setFolioDocType(initialDocType);
          setFolioNumber(initialFolioByType);
          setUnloadingPositionId(detail.unloadingPositionId ? String(detail.unloadingPositionId) : "");
          setFormLines(lineItems);
          setLineQty({});
          setReceiveItems(
            lineItems.length > 0
              ? lineItems.map((line) => ({
                skuId: line.itemSku,
                productName: line.itemLabel
                  ? line.itemLabel.replace(new RegExp(`^${line.itemSku}\\s*-\\s*`), "")
                  : "",
                quantityReceived: Number(line.openQty ?? line.orderedQty ?? 0),
              }))
              : [{ skuId: "", quantityReceived: 1 }]
          );
          setEmToWhId(String(detail.warehouseId || ""));
          setEmHeader((prev) => ({
            ...prev,
            toWh: warehouseName,
            reference: detail.displayId || `OC-${String(detail.sapOporDocEntry ?? "")}`,
            user: detail.userCreated || "",
            source: "OMS",
            folioNumber: detail.folioNumber != null ? Number(detail.folioNumber) : "",
            prefix: detail.folioPrefixString || "EM",
            externalRef: `${detail.displayId || detail.id}-${ts()}`,
            cardCode: detail.supplierId || "",
            comments: detail.packingSlip || "",
          }));
        }
      } catch {
        if (mounted) {
          setSupplyingStatus("pending");
          setAssignedOptions([]);
          setOrder(null);
          setFormLines([]);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [recordId, fetchProductMetaBySkus, fetchWithAuthQA, normalizeAssignedUser]);

  // Auto-limpiar mensaje de EM despus de 30 segundos
  useEffect(() => {
    if (!emMessage) return;

    const timeoutId = setTimeout(() => {
      setEmMessage(null);
    }, 30000);

    return () => clearTimeout(timeoutId);
  }, [emMessage]);

  // ?? NUEVO: handlers para EM
  const onEmChange = (field: keyof EMHeader, value: string | number) =>
    setEmHeader((p) => ({ ...p, [field]: value }));

  const onLineQtyChange = (lineNum: number, qty: number) =>
    setLineQty((p) => ({ ...p, [lineNum]: qty < 0 ? 0 : qty })); // clamp >= 0
  // ??

  const openCancelModal = async () => {
    if (!supplyingId) {
      setEmMessage({ type: "error", text: "No se encontró el id del movimiento." });
      return;
    }

    setCancelModalOpen(true);
    if (motiveOptions.length > 0) return;

    setMotiveLoading(true);
    try {
      const response = await fetch(STOCK_MOVEMENT_MOTIVE_URL, {
        method: "GET",
        headers: JANIS_HEADERS,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const payload = (await response.json()) as StockMovementMotive[];
      const active = (payload || []).filter((m) => String(m.status || "").toLowerCase() === "active");
      const source = active.length > 0 ? active : payload || [];
      const options = source
        .map((m) => ({
          value: String(m.refId ?? m.code ?? m.id ?? "").trim(),
          label: String(m.name ?? m.code ?? m.refId ?? m.id ?? "").trim(),
        }))
        .filter((m) => m.value && m.label);

      setMotiveOptions(options);
      setSelectedMotiveRefId(options[0]?.value || "");
    } catch (error: any) {
      setEmMessage({ type: "error", text: error?.message || "No se pudieron cargar motivos de cancelación." });
    } finally {
      setMotiveLoading(false);
    }
  };

  const handleCancelSupplying = async () => {
    if (!supplyingId) {
      setEmMessage({ type: "error", text: "No se encontró el id del movimiento." });
      return;
    }

    if (!selectedMotiveRefId) {
      setEmMessage({ type: "error", text: "Debes seleccionar un motivo para cancelar." });
      return;
    }

    setCancelSubmitting(true);
    try {
      const response = await fetch(`${SUPPLYING_URL}/${encodeURIComponent(supplyingId)}/cancel`, {
        method: "POST",
        headers: {
          ...JANIS_HEADERS,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ motiveRefId: selectedMotiveRefId || null }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      setCancelModalOpen(false);
      setEmMessage({ type: "success", text: "Movimiento cancelado correctamente." });
    } catch (error: any) {
      setEmMessage({ type: "error", text: error?.message || "No se pudo cancelar el movimiento." });
    } finally {
      setCancelSubmitting(false);
    }
  };

  const handleStartSupplying = async () => {
    if (!supplyingId) {
      setEmMessage({ type: "error", text: "No se encontró el id del movimiento." });
      return;
    }

    if (!loggedUserId) {
      setEmMessage({ type: "error", text: "No se encontró el userId del usuario logueado." });
      return;
    }

    try {
      const response = await fetch(`${SUPPLYING_URL}/${encodeURIComponent(supplyingId)}/start`, {
        method: "POST",
        headers: {
          ...JANIS_HEADERS,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId: loggedUserId }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      setSupplyingStatus("started");
      window.dispatchEvent(
        new CustomEvent("supplying-status-changed", {
          detail: { id: supplyingId, status: "started" },
        })
      );
      setEmMessage({ type: "success", text: "Iniciar ejecutado correctamente." });
    } catch (error: any) {
      setEmMessage({ type: "error", text: error?.message || "No se pudo ejecutar iniciar." });
    }
  };

  const handleApproveSupplying = async () => {
    if (!supplyingId) {
      setEmMessage({ type: "error", text: "No se encontró el id del movimiento." });
      return;
    }

    if (!loggedUserId) {
      setEmMessage({ type: "error", text: "No se encontró el userId del usuario logueado." });
      return;
    }

    try {
      const response = await fetch(`${SUPPLYING_URL}/${encodeURIComponent(supplyingId)}/approve`, {
        method: "POST",
        headers: {
          ...JANIS_HEADERS,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId: loggedUserId }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      setEmMessage({ type: "success", text: "Aprobar ejecutado correctamente." });
    } catch (error: any) {
      setEmMessage({ type: "error", text: error?.message || "No se pudo ejecutar aprobar." });
    }
  };

  const handleAssignSupplying = () => {
    if (!supplyingId) {
      setEmMessage({ type: "error", text: "No se encontró el id del movimiento." });
      return;
    }
    // Pre-select currently assigned user if any
    setAssignModalSelectedUser(String(order?.assignedTo || "").trim());
    setAssignModalOpen(true);
  };

  const openRequestModal = () => {
    if (!supplyingId) {
      setEmMessage({ type: "error", text: "No se encontró el id del movimiento." });
      return;
    }
    setRequestComment("");
    setRequestModalOpen(true);
  };

  const handleRequestSupplying = async () => {
    if (!supplyingId) {
      setEmMessage({ type: "error", text: "No se encontró el id del movimiento." });
      return;
    }

    if (!loggedUserId) {
      setEmMessage({ type: "error", text: "No se encontró el userId del usuario logueado." });
      return;
    }

    const comment = String(requestComment || "").trim();
    if (!comment) {
      setEmMessage({ type: "error", text: "Debes ingresar un comentario para solicitar." });
      return;
    }

    setRequestSubmitting(true);
    try {
      const response = await fetch(`${SUPPLYING_URL}/${encodeURIComponent(supplyingId)}/request`, {
        method: "POST",
        headers: {
          ...JANIS_HEADERS,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          date: new Date().toISOString(),
          userId: loggedUserId,
          comment,
        }),
      });

      if (!response.ok) {
        let message = `HTTP ${response.status}`;
        try {
          const errorPayload = await response.json();
          message = String(errorPayload?.message || errorPayload?.error || "").trim() || message;
        } catch {
          // ignore
        }
        throw new Error(message);
      }

      setRequestModalOpen(false);
      setEmMessage({ type: "success", text: "Solicitud enviada correctamente." });
    } catch (error: any) {
      setEmMessage({ type: "error", text: error?.message || "No se pudo solicitar el movimiento." });
    } finally {
      setRequestSubmitting(false);
    }
  };

  const handleConfirmAssign = async () => {
    if (!assignModalSelectedUser) {
      setEmMessage({ type: "error", text: "Debes seleccionar un usuario." });
      return;
    }
    setAssignModalSubmitting(true);
    try {
      const response = await fetch(`${SUPPLYING_URL}/${encodeURIComponent(supplyingId)}/assign`, {
        method: "POST",
        headers: { ...JANIS_HEADERS, "Content-Type": "application/json" },
        body: JSON.stringify({ userId: assignModalSelectedUser }),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      // Update displayed field
      setOrder((prev) => prev ? { ...prev, assignedTo: assignModalSelectedUser } : prev);
      setEmMessage({ type: "success", text: "Asignación ejecutada correctamente." });
      setAssignModalOpen(false);
    } catch (error: any) {
      setEmMessage({ type: "error", text: error?.message || "No se pudo ejecutar asignar." });
    } finally {
      setAssignModalSubmitting(false);
    }
  };

  const openReceiveModal = () => {
    if (supplyingStatus === "pending") {
      setEmMessage({ type: "info", text: "Debes iniciar el movimiento antes de recibir." });
      return;
    }

    setReceiveModalOpen(true);
    void loadInboundPositions();
  };

  const updateReceiveItem = (index: number, field: keyof ReceiveItemForm, value: string | number) => {
    setReceiveItems((prev) =>
      prev.map((item, idx) =>
        idx === index
          ? {
            ...item,
            [field]: field === "quantityReceived"
              ? (value === "" ? Number.NaN : Number(value))
              : String(value),
          }
          : item
      )
    );
  };

  const loadInboundPositions = React.useCallback(async () => {
    if (unloadingPositionOptions.length > 0 || unloadingPositionLoading) return;

    setUnloadingPositionLoading(true);
    try {
      const response = await fetch(INBOUND_POSITION_URL, {
        method: "GET",
        headers: JANIS_HEADERS,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const payload = (await response.json()) as InboundPositionResponse[] | { data?: InboundPositionResponse[] };
      const rows = Array.isArray(payload) ? payload : Array.isArray(payload?.data) ? payload.data : [];

      const options = Array.from(
        new Map(
          rows
            .map((row) => {
              const value = String(row.id ?? row.refId ?? row.positionId ?? "").trim();
              const label = String(row.positionKey ?? row.name ?? row.positionName ?? row.label ?? row.code ?? value).trim();
              if (!value) return null;
              return [value, { value, label: label || value }] as const;
            })
            .filter(Boolean) as Array<readonly [string, { value: string; label: string }]>
        ).values()
      );

      setUnloadingPositionOptions(options);
    } catch (error: any) {
      setEmMessage({ type: "error", text: error?.message || "No se pudieron cargar los slots de descarga." });
    } finally {
      setUnloadingPositionLoading(false);
    }
  }, [unloadingPositionLoading, unloadingPositionOptions.length]);

  const handleReceiveSupplying = async () => {
    if (!supplyingId) {
      setEmMessage({ type: "error", text: "No se encontró el id del movimiento." });
      return;
    }

    if (!loggedUserId) {
      setEmMessage({ type: "error", text: "No se encontró el userId del usuario logueado." });
      return;
    }

    const parsedFolio = Number(folioNumber);
    const comment = String(emHeader.comments || "").trim() || "Recepcion desde OMS";

    if (!unloadingPositionId.trim()) {
      setEmMessage({ type: "error", text: "Debes ingresar unloadingPositionId." });
      return;
    }
    if (!Number.isFinite(parsedFolio) || parsedFolio <= 0) {
      setEmMessage({ type: "error", text: "Debes ingresar un folio válido." });
      return;
    }

    const normalizedReceiveItems = receiveItems
      .map((item) => ({
        skuId: String(item.skuId || "").trim(),
        quantityReceived: Number(item.quantityReceived),
      }))
      .filter((item) => item.skuId && Number.isFinite(item.quantityReceived) && item.quantityReceived > 0);

    if (normalizedReceiveItems.length === 0) {
      setEmMessage({ type: "error", text: "Debes tener al menos un item con cantidad recibida válida." });
      return;
    }

    setReceiveSubmitting(true);
    try {
      const incomeControlBody = {
        items: normalizedReceiveItems.map((item) => ({
          skuId: item.skuId,
          variation: {},
          supplyingResult: {
            quantity: item.quantityReceived,
            positions: [
              {
                positionId: unloadingPositionId.trim(),
                quantity: item.quantityReceived,
              },
            ],
            date: new Date().toISOString(),
            userId: loggedUserId,
            comment,
            motiveRefId: null,
            status: "received",
          },
        })),
      };

      const incomeControlResponse = await fetch(`${SUPPLYING_URL}/${encodeURIComponent(supplyingId)}/income-control`, {
        method: "POST",
        headers: {
          ...JANIS_HEADERS,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(incomeControlBody),
      });

      const incomeControlText = await incomeControlResponse.text();
      let incomeControlPayload: any = null;
      if (incomeControlText) {
        try {
          incomeControlPayload = JSON.parse(incomeControlText);
        } catch {
          incomeControlPayload = null;
        }
      }

      if (!incomeControlResponse.ok) {
        const errorDetail = String(
          incomeControlPayload?.message ?? incomeControlPayload?.error ?? incomeControlText ?? ""
        ).trim();
        throw new Error(
          errorDetail
            ? `income-control HTTP ${incomeControlResponse.status}: ${errorDetail}`
            : `income-control HTTP ${incomeControlResponse.status}`
        );
      }

      const receiptId = String(
        incomeControlPayload?.receiptId ??
        incomeControlPayload?.data?.receiptId ??
        incomeControlPayload?.result?.receiptId ??
        ""
      ).trim();

      if (!receiptId) {
        throw new Error("income-control no devolvió receiptId.");
      }

      const response = await fetch(`${SUPPLYING_URL}/${encodeURIComponent(supplyingId)}/receive`, {
        method: "POST",
        headers: {
          ...JANIS_HEADERS,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          receiptId,
          unloadingPositionId: unloadingPositionId.trim(),
          folioNumber: parsedFolio,
          folioPrefixString: folioDocType,
          comment,
        }),
      });

      if (!response.ok) {
        let errorDetail = "";
        try {
          const errorPayload = await response.json();
          errorDetail = String(errorPayload?.message ?? errorPayload?.error ?? "").trim();
        } catch {
          try {
            errorDetail = String(await response.text()).trim();
          } catch {
            errorDetail = "";
          }
        }
        throw new Error(errorDetail ? `HTTP ${response.status}: ${errorDetail}` : `HTTP ${response.status}`);
      }

      setSupplyingStatus("received");
      window.dispatchEvent(
        new CustomEvent("supplying-status-changed", {
          detail: { id: supplyingId, status: "received" },
        })
      );
      setReceiveModalOpen(false);
      setEmMessage({ type: "success", text: "Recepción registrada correctamente." });
    } catch (error: any) {
      setEmMessage({ type: "error", text: error?.message || "No se pudo registrar la recepción." });
    } finally {
      setReceiveSubmitting(false);
    }
  };


  // Acciones de fila (idnticas al original)
  const rowActions = useMemo<Action[]>(
    () => [
      {
        label: "Asignar",
        variant: "primary",
        onClick: handleAssignSupplying,
        icon: <UserPlusIcon className="h-5 w-5" />,
      },
      {
        label: "Cancelar",
        variant: "error",
        onClick: openCancelModal,
        icon: <NoSymbolIcon className="h-5 w-5" />,
      },
      {
        label: "Solicitar",
        variant: "primary",
        onClick: openRequestModal,
        icon: <PaperAirplaneIcon className="h-5 w-5" />,
      },
      ...(supplyingStatus === "pending"
        ? [
          {
            label: "Iniciar",
            variant: "primary" as const,
            onClick: handleStartSupplying,
            icon: <PlayCircleIcon className="h-5 w-5" />,
          },
        ]
        : []),
      {
        label: "Recibir",
        variant: "primary",
        onClick: openReceiveModal,
        icon: <InboxArrowDownIcon className="h-5 w-5" />,
        disabled: supplyingStatus === "pending",
      },
      {
        label: "Aprobar",
        variant: "success",
        onClick: handleApproveSupplying,
        icon: <CheckCircleIcon className="h-5 w-5" />,
      },
    ],
    [openCancelModal, openRequestModal, openReceiveModal, handleStartSupplying, handleApproveSupplying, handleAssignSupplying, supplyingStatus]
  );

  // Acciones de header (idnticas al original)
  const headerActions = useMemo<Action[]>(
    () => [
      {
        label: "Volver al listado",
        variant: "secondary",
        onClick: () => { router.push("/almacen/gestion/ordenes-compra"); },
        icon: <XCircleIcon className="h-5 w-5" />,
      },
    ],
    [router]
  );


  // Inyecta header con el mismo estilo original (usa title = order.id como antes)
  usePageHeader(
    () =>
    ({
      title: (
        <div>
          <div className="text-xs font-semibold uppercase text-blue-600 tracking-wider">
            Movimientos de mercadería
          </div>
          <div className="text-2xl font-semibold text-gray-900">
            #{order?.id ?? ""}
          </div>
        </div>
      ),
      action: headerActions,
      status: {
        text: order?.docStatus === "O" ? "Abierto" : "Cerrado",
        variant: order?.docStatus === "O" ? "success" : "info",
      },
      messageBadge: emMessage
        ? (
          <span
            className={
              `rounded-full px-3 py-1 text-xs font-semibold text-white ${emMessage.type === "error"
                ? "bg-red-500"
                : "bg-blue-500"
              }`
            }
          >
            {emMessage.text}
          </span>
        )
        : undefined,
    } as PageHeaderProps),
    [order?.id, order?.docStatus, headerActions, emMessage]
  );

  if (loading) {
    return (
      <>
        <OrderActionBar actions={rowActions} />
        <div className="p-6 bg-white space-y-6">
          <div className="overflow-x-auto border rounded-md">
            <table className="min-w-full text-sm">
              <tbody>
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-6 text-center text-gray-500"
                  >
                    <ArrowPathIcon className="h-5 w-5 inline animate-spin mr-2" />
                    Cargando movimiento de mercadería
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </>
    );
  }

  if (!order) {
    return (
      <>
        <OrderActionBar actions={rowActions} />
        <div className="p-6 bg-white space-y-6">
          <div className="overflow-x-auto border rounded-md">
            <table className="min-w-full text-sm">
              <tbody>
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-6 text-center text-gray-500"
                  >
                    Orden no encontrada.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </>
    );
  }

  return (
    // <>
    //   <OrderActionBar actions={rowActions} />
    //   <div className="p-6 bg-white space-y-6">
    //     {/* Ahora editable para permitir entrada en Slot, Gua, Factura y Asignado */}
    //     <OrderFields order={order} readOnly={false} lines={rows ?? []} />
    //   </div>
    // </>
    <>
      <OrderActionBar actions={rowActions} />
      <div className="p-6 bg-white space-y-6">
        <OrderFields
          order={order}
          readOnly={false}
          readOnlySupplier
          readOnlyInventory
          readOnlyEstimatedDate
          readOnlySlot
          readOnlyAssignedTo
          assignedOptions={assignedOptions}
          onChange={onOrderFieldChange}
          lines={formLines}
          showEntradaMercancia={false}
          // ?? NUEVO: pasar form EM y handlers
          emHeader={emHeader}
          onEmChange={onEmChange}
          onLineQtyChange={onLineQtyChange}
          showRemoveItemLineButton={false}
          getLineQty={(lineNum) => lineQty[lineNum]}
        // ??
        />
      </div>

      {cancelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center gap-2">
              <ExclamationTriangleIcon className="h-5 w-5 text-amber-500" />
              <h3 className="text-lg font-semibold text-slate-900">Cancelar movimiento</h3>
            </div>
            <p className="mb-4 text-sm text-slate-600">Selecciona el motivo de cancelación.</p>

            <select
              className="mb-6 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              value={selectedMotiveRefId}
              onChange={(e) => setSelectedMotiveRefId(e.target.value)}
              disabled={motiveLoading || cancelSubmitting}
            >
              {motiveOptions.length === 0 && <option value="">Sin motivos disponibles</option>}
              {motiveOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm"
                onClick={() => setCancelModalOpen(false)}
                disabled={cancelSubmitting}
              >
                Cerrar
              </button>
              <button
                type="button"
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
                onClick={handleCancelSupplying}
                disabled={cancelSubmitting || motiveLoading}
              >
                {cancelSubmitting ? "Cancelando..." : "Confirmar cancelación"}
              </button>
            </div>
          </div>
        </div>
      )}

      {requestModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center gap-2">
              <PaperAirplaneIcon className="h-5 w-5 text-blue-500" />
              <h3 className="text-lg font-semibold text-slate-900">Solicitar movimiento</h3>
            </div>
            <p className="mb-3 text-sm text-slate-600">Ingresa un comentario para la solicitud.</p>

            <textarea
              className="mb-6 min-h-[110px] w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              placeholder="Ej: Solicitar revisión y autorización"
              value={requestComment}
              onChange={(e) => setRequestComment(e.target.value)}
              disabled={requestSubmitting}
            />

            <div className="flex justify-end gap-2">
              <button
                type="button"
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm"
                onClick={() => setRequestModalOpen(false)}
                disabled={requestSubmitting}
              >
                Cerrar
              </button>
              <button
                type="button"
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
                onClick={handleRequestSupplying}
                disabled={requestSubmitting}
              >
                {requestSubmitting ? "Solicitando..." : "Confirmar solicitud"}
              </button>
            </div>
          </div>
        </div>
      )}

      {assignModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center gap-2">
              <UserPlusIcon className="h-5 w-5 text-blue-500" />
              <h3 className="text-lg font-semibold text-slate-900">Asignar usuario</h3>
            </div>
            <p className="mb-4 text-sm text-slate-600">Selecciona el usuario a asignar al movimiento.</p>

            <select
              className="mb-6 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              value={assignModalSelectedUser}
              onChange={(e) => setAssignModalSelectedUser(e.target.value)}
              disabled={assignModalSubmitting}
            >
              <option value="">-- Selecciona un usuario --</option>
              {assignedOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm"
                onClick={() => setAssignModalOpen(false)}
                disabled={assignModalSubmitting}
              >
                Cerrar
              </button>
              <button
                type="button"
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
                onClick={handleConfirmAssign}
                disabled={assignModalSubmitting || !assignModalSelectedUser}
              >
                {assignModalSubmitting ? "Asignando..." : "Confirmar asignación"}
              </button>
            </div>
          </div>
        </div>
      )}

      {receiveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl bg-white shadow-xl">
            <div className="border-b border-slate-200 px-6 py-4">
              <h3 className="text-lg font-semibold text-slate-900">Recibir movimiento</h3>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5">

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">Slot de descarga</label>
                  <select
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    value={unloadingPositionId}
                    onChange={(e) => setUnloadingPositionId(e.target.value)}
                    disabled={unloadingPositionLoading || receiveSubmitting}
                  >
                    <option value="">
                      {unloadingPositionLoading ? "Cargando slots..." : "Selecciona slot de descarga"}
                    </option>
                    {unloadingPositionOptions.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">Tipo documento</label>
                  <select
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    value={folioDocType}
                    onChange={(e) => {
                      const nextType = e.target.value === "FE" ? "FE" : "GE";
                      setFolioDocType(nextType);
                      if (nextType === "FE") {
                        setFolioNumber(String(order?.invoice || ""));
                        return;
                      }
                      setFolioNumber(String(emHeader?.folioNumber ?? ""));
                    }}
                  >
                    <option value="GE">Guía de despacho (GE)</option>
                    <option value="FE">Factura (FE)</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">Número de folio</label>
                  <input
                    type="number"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    value={folioNumber}
                    onChange={(e) => setFolioNumber(e.target.value)}
                    placeholder="Ej: 107601"
                  />
                </div>
              </div>

              <div className="mt-5">
                <div className="mb-2 flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-slate-800">Items</h4>
                </div>

                <div className="space-y-2">
                  {receiveItems.map((item, idx) => (
                    <div key={idx} className="grid grid-cols-1 gap-2 md:grid-cols-[1fr_180px]">
                      <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900">
                        <div className="font-medium">{item.skuId || "-"}</div>
                        <div className="text-xs text-slate-500">{item.productName || "Sin nombre"}</div>
                      </div>
                      <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900">
                        {Number.isFinite(item.quantityReceived) ? item.quantityReceived : ""}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            <div className="flex justify-end gap-2 border-t border-slate-200 px-6 py-4">
              <button
                type="button"
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm"
                onClick={() => setReceiveModalOpen(false)}
                disabled={receiveSubmitting}
              >
                Cerrar
              </button>
              <button
                type="button"
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
                onClick={handleReceiveSupplying}
                disabled={receiveSubmitting}
              >
                {receiveSubmitting ? "Enviando..." : "Confirmar recepción"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
