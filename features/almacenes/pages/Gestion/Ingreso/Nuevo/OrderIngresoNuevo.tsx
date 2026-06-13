// views\Almacen\Gestion\Ingreso\Nuevo\OrderIngresoNuevo.tsx

"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { usePageHeader } from "@/hooks/page-header/usePageHeader";
import type { Action, PageHeaderProps } from "@/components/layout/page-header";
import { OrderFields, Order } from "@/features/almacenes/components/gestion/ingreso/OrderFields";
import { ArrowDownOnSquareIcon, CheckCircleIcon, DocumentPlusIcon, XCircleIcon } from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";
import {
  BASE_ID_SERVICE,
  BASE_WAREHOUSES,
  CATALOG_PRODUCTS_API,
  WAREHOUSE_API,
  WAREHOUSE_SUPPLYING_API,
} from "@/lib/http/endpoints";
import CenteredLoading from "@/components/ui/loading/CenteredLoading";
import { getLoggedUserId } from "@/lib/auth/logged-user";


import { withAuthPlatformHeaders } from "@/features/almacenes/services/auth-headers";
type ItemLine = {
  itemSku: string;
  itemLabel?: string;
  itemImage?: string;
  orderedQty?: number;
  openQty?: number;
  lineNum: number;
  poDocEntry: number;
};

type PositionResponse = {
  id?: string;
  positionKey?: string;
};

type WarehouseResponse = {
  id?: string;
  warehouseId?: string;
  name?: string;
  referenceId?: string;
};

type ProductResponse = {
  id?: string;
  sku?: string;
  itemSku?: string;
  name?: string;
  Name?: string;
  productName?: string;
  description?: string;
  Description?: string;
  image?: string;
  imageUrl?: string;
  thumbnail?: string;
  photoUrl?: string;
};

type SupplierResponse = {
  id?: string;
  supplierId?: string;
  vendorId?: string;
  code?: string;
  vendorCode?: string;
  supplierCode?: string;
  rut?: string;
  RUT?: string;
  name?: string;
  supplierName?: string;
  vendorName?: string;
  companyName?: string;
  firstName?: string;
  lastName?: string;
  FirstName?: string;
  LastName?: string;
  email?: string;
  Email?: string;
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

type CreateSupplyingPayload = {
  warehouseId: string;
  supplierId: string;
  packingSlip: string;
  invoiceNumber: string;
  assigneeId: string;
  usuarioCreadorId?: number;
  unloadingPositionId: string;
  estimatedDate: {
    from: string;
    to: string;
  };
  items: Array<{
    skuId: string;
    quantity: number;
  }>;
};

const SUPPLYING_URL = WAREHOUSE_SUPPLYING_API;
const CATALOG_PRODUCTS_URL = CATALOG_PRODUCTS_API;
const WAREHOUSES_OPTIONS_URL = `${WAREHOUSE_API}?sortBy=referenceId&sortDirection=asc`;
const INBOUND_POSITION_URL = `${BASE_WAREHOUSES}/position?filters[schemaType]=inbound`;
const SUPPLIERS_OPTIONS_URL = WAREHOUSE_SUPPLYING_API;
const USERS_QA_URL = `${BASE_ID_SERVICE}/usuarios?page=1&pageSize=500`;
const JANIS_HEADERS: Record<string, string> = withAuthPlatformHeaders({
  "janis-api-key": "test-key",
  "janis-api-secret": "test-secret",
  "janis-client": "test-client",
  "Content-Type": "application/json",
});

const INITIAL_ORDER: Order = {
  inventory: "",
  slot: "",
  estimatedFrom: "",
  estimatedTo: "",
  deliveryNote: "",
  invoice: "",
  vendorName: "",
  vendorCode: "",
  assignedTo: "",
  docStatus: "O",
  items: { sku: "", quantity: "" },
  created: { username: "", email: "", date: "" },
};

export function OrderNuevoPage() {
  const [order, setOrder] = useState<Order>(INITIAL_ORDER);
  const [itemLines, setItemLines] = useState<ItemLine[]>([
    { itemSku: "", orderedQty: 0, openQty: 0, lineNum: 0, poDocEntry: 0 },
  ]);
  const [lineQty, setLineQty] = useState<Record<number, number>>({ 0: 0 });
  const [inventoryOptions, setInventoryOptions] = useState<Array<{ value: string; label: string }>>([]);
  const [slotOptions, setSlotOptions] = useState<Array<{ value: string; label: string }>>([]);
  const [assignedOptions, setAssignedOptions] = useState<Array<{ value: string; label: string }>>([]);
  const [skuOptions, setSkuOptions] = useState<Array<{ value: string; label: string }>>([]);
  const [supplierOptions, setSupplierOptions] = useState<
    Array<{ value: string; label: string; vendorName: string; vendorCode: string }>
  >([]);
  const [optionsLoading, setOptionsLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const skuLookupSeqRef = useRef<Record<number, number>>({});
  const router = useRouter();

  const normalizeArrayPayload = <T,>(payload: any): T[] => {
    if (Array.isArray(payload)) return payload as T[];
    if (Array.isArray(payload?.data)) return payload.data as T[];
    if (Array.isArray(payload?.items)) return payload.items as T[];
    if (Array.isArray(payload?.rows)) return payload.rows as T[];
    if (Array.isArray(payload?.results)) return payload.results as T[];
    return [];
  };

  const fetchJson = async <T,>(url: string): Promise<T[]> => {
    const response = await fetch(url, {
      method: "GET",
      headers: JANIS_HEADERS,
      cache: "no-store",
    });
    if (!response.ok) return [];
    const payload = await response.json();
    return normalizeArrayPayload<T>(payload);
  };

  const getProductSku = (product: ProductResponse): string =>
    String(product.sku ?? product.itemSku ?? product.id ?? "").trim();

  const getProductName = (product: ProductResponse): string =>
    String(
      product.name ??
      product.Name ??
      product.productName ??
      product.description ??
      product.Description ??
      ""
    ).trim();

  const getProductImage = (product: ProductResponse): string =>
    String(product.image ?? product.imageUrl ?? product.thumbnail ?? product.photoUrl ?? "").trim();

  const toIsoUtcStart = (value: string) => {
    const raw = String(value || "").trim();
    if (!raw) return "";
    if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return `${raw}T00:00:00Z`;
    const d = new Date(raw);
    if (Number.isNaN(d.getTime())) return "";
    return d.toISOString();
  };

  const toIsoUtcEnd = (value: string) => {
    const raw = String(value || "").trim();
    if (!raw) return "";
    if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return `${raw}T23:59:59Z`;
    const d = new Date(raw);
    if (Number.isNaN(d.getTime())) return "";
    return d.toISOString();
  };

  const buildPayload = (): CreateSupplyingPayload => {
    const invoiceNumber = String(order.invoice || "").trim();
    const assigneeId = String(order.assignedTo || "").trim();
    const unloadingPositionId = String(order.slot || "").trim();
    const estimatedFrom = toIsoUtcStart(order.estimatedFrom);
    const estimatedTo = toIsoUtcEnd(order.estimatedTo);

    const items = itemLines
      .map((line) => {
        const skuId = String(line.itemSku || "").trim();
        const qty = Number(lineQty[line.lineNum] ?? line.openQty ?? line.orderedQty ?? 0);
        return {
          skuId,
          quantity: Number.isFinite(qty) ? qty : 0,
        };
      })
      .filter((line) => line.skuId && line.quantity > 0);

    if (!String(order.inventory || "").trim()) throw new Error("Debes seleccionar inventario.");
    if (!String(order.vendorCode || "").trim()) throw new Error("Debes seleccionar proveedor.");
    if (!assigneeId) throw new Error("Debes seleccionar asignado.");
    if (!unloadingPositionId) throw new Error("Debes seleccionar slot de descarga.");
    if (!invoiceNumber) throw new Error("Debes ingresar Factura #.");
    if (!estimatedFrom || !estimatedTo) throw new Error("Debes ingresar Fecha estimada desde/hasta.");
    if (items.length === 0) throw new Error("Debes ingresar al menos un item con cantidad mayor a 0.");

    return {
      warehouseId: String(order.inventory).trim(),
      supplierId: String(order.vendorCode).trim(),
      packingSlip: `SAP-OC-${invoiceNumber}`,
      invoiceNumber,
      assigneeId,
      usuarioCreadorId: getLoggedUserId(),
      unloadingPositionId,
      estimatedDate: {
        from: estimatedFrom,
        to: estimatedTo,
      },
      items,
    };
  };

  const createSupplying = async (): Promise<void> => {
    const payload = buildPayload();
    const response = await fetch(SUPPLYING_URL, {
      method: "POST",
      headers: JANIS_HEADERS,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
  };

  // Handler genérico para cualquier campo
  const handleChange = (field: keyof Order, value: string) => {
    setOrder((prev) => ({ ...prev, [field]: value }));
  };

  const normalizeAssignedUser = (user: AssignedUserResponse) => {
    const value = String(user.id ?? user.ID ?? user.usuarioId ?? user.userId ?? "").trim();
    const fullName = `${String(user.FIRSTNAME ?? "").trim()} ${String(user.LASTNAME ?? "").trim()}`.trim();
    const username = String(user.username ?? user.userName ?? user.nombre ?? user.name ?? fullName).trim();
    const email = String(user.email ?? user.EMAIL ?? "").trim();

    if (!value) return null;

    const labelBase = username || email || value;
    const label = email && username ? `${username} (${email})` : labelBase;
    return { value, label };
  };

  useEffect(() => {
    let mounted = true;

    (async () => {
      setOptionsLoading(true);
      try {
        const [warehouseRes, supplierRes, positionsRes, productsRes, usersResp] = await Promise.allSettled([
          fetchJson<WarehouseResponse>(WAREHOUSES_OPTIONS_URL),
          fetchJson<SupplierResponse>(SUPPLIERS_OPTIONS_URL),
          fetchJson<PositionResponse>(INBOUND_POSITION_URL),
          fetchJson<ProductResponse>(CATALOG_PRODUCTS_URL),
          fetchJson<AssignedUserResponse>(USERS_QA_URL),
        ]);

        if (!mounted) return;

        const warehouses = warehouseRes.status === "fulfilled"
          ? Array.from(
            new Map(
              warehouseRes.value
                .map((warehouse) => {
                  const value = String(warehouse.id ?? warehouse.warehouseId ?? "").trim();
                  const name = String(warehouse.name ?? "").trim();
                  const referenceId = String(warehouse.referenceId ?? "").trim();
                  if (!value) return null;
                  return [
                    value,
                    {
                      value,
                      label: name || referenceId || value,
                    },
                  ] as const;
                })
                .filter(Boolean) as Array<readonly [string, { value: string; label: string }]>
            ).values()
          )
          : [];

        const suppliers = supplierRes.status === "fulfilled"
          ? Array.from(
            new Map(
              supplierRes.value.map((supplier) => {
                const fullName = `${String(supplier.firstName ?? supplier.FirstName ?? "").trim()} ${String(supplier.lastName ?? supplier.LastName ?? "").trim()}`.trim();
                const vendorName =
                  String(
                    supplier.supplierName ??
                    supplier.vendorName ??
                    supplier.companyName ??
                    supplier.name ??
                    fullName ??
                    supplier.email ??
                    supplier.Email ??
                    ""
                  ).trim();
                const displayCode = String(
                  supplier.vendorCode ??
                  supplier.supplierCode ??
                  supplier.code ??
                  supplier.rut ??
                  supplier.RUT ??
                  supplier.id ??
                  ""
                ).trim();
                const vendorCode = String(
                  supplier.supplierId ??
                  supplier.vendorId ??
                  supplier.id ??
                  displayCode
                ).trim();
                const value = vendorCode || displayCode;
                const label = displayCode ? `${vendorName} - ${displayCode}` : vendorName;

                if (!value || !vendorName) return null;

                return [
                  value,
                  {
                    value,
                    label,
                    vendorName,
                    vendorCode: value,
                  },
                ] as const;
              })
                .filter(Boolean) as Array<
                  readonly [
                    string,
                    {
                      value: string;
                      label: string;
                      vendorName: string;
                      vendorCode: string;
                    }
                  ]
                >
            ).values()
          ).filter((supplier) => supplier.value && supplier.vendorName)
          : [];

        const positionRows = positionsRes.status === "fulfilled" ? positionsRes.value : [];

        const uniqueSlots = Array.from(
          new Map(
            positionRows
              .map((row: PositionResponse) => {
                const value = String(row.id || "").trim();
                const label = String(row.positionKey || "").trim();
                if (!value || !label) return null;
                return [value, { value, label }] as const;
              })
              .filter(Boolean) as Array<readonly [string, { value: string; label: string }]>
          ).values()
        ).sort((a, b) => a.label.localeCompare(b.label));

        const uniqueProducts = productsRes.status === "fulfilled"
          ? Array.from(
            new Map(
              productsRes.value
                .map((product) => {
                  const sku = getProductSku(product);
                  const name = getProductName(product);
                  if (!sku) return null;
                  return [
                    sku,
                    {
                      value: sku,
                      label: name ? `${sku} - ${name}` : sku,
                    },
                  ] as const;
                })
                .filter(Boolean) as Array<readonly [string, { value: string; label: string }]>
            ).values()
          ).sort((a, b) => a.value.localeCompare(b.value))
          : [];

        const usersPayload = usersResp.status === "fulfilled"
          ? usersResp.value
          : [];
        const uniqueAssigned = Array.from(
          new Map(
            (Array.isArray(usersPayload) ? usersPayload : [])
              .map(normalizeAssignedUser)
              .filter(Boolean)
              .map((user) => [user!.value, user!] as const)
          ).values()
        ).sort((a, b) => a.label.localeCompare(b.label));

        setInventoryOptions(warehouses);
        setSlotOptions(uniqueSlots);
        setAssignedOptions(uniqueAssigned);
        setSupplierOptions(suppliers);
        setSkuOptions(uniqueProducts);
      } finally {
        if (mounted) setOptionsLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const onLineQtyChange = (lineNum: number, qty: number) => {
    const safeQty = Number.isFinite(qty) ? Math.max(0, qty) : 0;
    setLineQty((prev) => ({ ...prev, [lineNum]: safeQty }));
    setItemLines((prev) =>
      prev.map((line) => (line.lineNum === lineNum ? { ...line, openQty: safeQty, orderedQty: safeQty } : line))
    );
  };

  const onLineSkuChange = async (lineNum: number, sku: string) => {
    setItemLines((prev) =>
      prev.map((line) =>
        line.lineNum === lineNum ? { ...line, itemSku: sku, itemLabel: "", itemImage: "" } : line
      )
    );

    const normalizedSku = String(sku || "").trim();
    if (!normalizedSku) return;

    const currentSeq = (skuLookupSeqRef.current[lineNum] ?? 0) + 1;
    skuLookupSeqRef.current[lineNum] = currentSeq;

    try {
      const response = await fetch(`${CATALOG_PRODUCTS_URL}/${encodeURIComponent(normalizedSku)}`, {
        method: "GET",
        headers: JANIS_HEADERS,
        cache: "no-store",
      });
      if (!response.ok) return;

      const payload = await response.json();
      const product = (
        Array.isArray(payload)
          ? payload[0]
          : Array.isArray(payload?.data)
            ? payload.data[0]
            : payload?.data ?? payload
      ) as ProductResponse | undefined;

      if (!product) return;
      if (skuLookupSeqRef.current[lineNum] !== currentSeq) return;

      const resolvedSku = getProductSku(product) || normalizedSku;
      const resolvedLabel = getProductName(product);
      const resolvedImage = getProductImage(product);

      setItemLines((prev) =>
        prev.map((line) =>
          line.lineNum === lineNum
            ? {
              ...line,
              itemSku: resolvedSku,
              itemLabel: resolvedLabel,
              itemImage: resolvedImage,
            }
            : line
        )
      );

      setSkuOptions((prev) => {
        const exists = prev.some((option) => option.value === resolvedSku);
        if (exists) return prev;
        return [
          ...prev,
          {
            value: resolvedSku,
            label: resolvedLabel ? `${resolvedSku} - ${resolvedLabel}` : resolvedSku,
          },
        ].sort((a, b) => a.value.localeCompare(b.value));
      });
    } catch {
      // Keep typed SKU when catalog lookup fails.
    }
  };

  const onAddItemLine = () => {
    setItemLines((prev) => {
      const nextLineNum = prev.length ? Math.max(...prev.map((l) => l.lineNum)) + 1 : 0;
      return [
        ...prev,
        { itemSku: "", itemLabel: "", itemImage: "", orderedQty: 0, openQty: 0, lineNum: nextLineNum, poDocEntry: 0 },
      ];
    });
  };

  const onRemoveItemLine = (lineNum: number) => {
    setItemLines((prev) => {
      const next = prev.filter((line) => line.lineNum !== lineNum);
      return next.length
        ? next
        : [{ itemSku: "", itemLabel: "", itemImage: "", orderedQty: 0, openQty: 0, lineNum: 0, poDocEntry: 0 }];
    });

    setLineQty((prev) => {
      const next = { ...prev };
      delete next[lineNum];
      return next;
    });
  };

  // Acciones del header idénticas a tu vista de resumen
  const headerActions = useMemo<Action[]>(
    () => [
      {
        label: "Aplicar",
        variant: "primary",
        onClick: async () => {
          try {
            setSubmitting(true);
            await createSupplying();
            alert("Movimiento creado correctamente.");
          } catch (error: any) {
            alert(error?.message || "No se pudo crear el movimiento.");
          } finally {
            setSubmitting(false);
          }
        },
        icon: <ArrowDownOnSquareIcon className="h-5 w-5" />,
        disabled: submitting,
      },
      {
        label: "Guardar",
        variant: "success",
        onClick: async () => {
          try {
            setSubmitting(true);
            await createSupplying();
            router.push("/almacen/gestion/ordenes-compra");
          } catch (error: any) {
            alert(error?.message || "No se pudo crear el movimiento.");
          } finally {
            setSubmitting(false);
          }
        },
        icon: <CheckCircleIcon className="h-5 w-5" />,
        disabled: submitting,
      },
      {
        label: "Guardar & Crear nuevo",
        variant: "primary",
        onClick: async () => {
          try {
            setSubmitting(true);
            await createSupplying();
            setOrder(INITIAL_ORDER);
            setItemLines([{ itemSku: "", itemLabel: "", itemImage: "", orderedQty: 0, openQty: 0, lineNum: 0, poDocEntry: 0 }]);
            setLineQty({ 0: 0 });
          } catch (error: any) {
            alert(error?.message || "No se pudo crear el movimiento.");
          } finally {
            setSubmitting(false);
          }
        },
        icon: <DocumentPlusIcon className="h-5 w-5" />,
        disabled: submitting,
      },
      {
        label: "Volver al listado",
        variant: "secondary",
        onClick: () => { router.push("/almacen/gestion/ordenes-compra"); },
        icon: <XCircleIcon className="h-5 w-5" />,
        disabled: submitting,
      },
    ],
    [order, itemLines, lineQty, router, submitting]
  );

  // Inyectamos el header (título + acciones)
  usePageHeader(
    () =>
    ({
      title: "Crear Orden",
      action: headerActions,
    } as PageHeaderProps),
    [headerActions]
  );

  return (
    <div className="p-6">
      {optionsLoading ? (
        <CenteredLoading label="Cargando opciones..." />
      ) : (
        <>
          {/* Aquí pasamos readOnly={false} y nuestro handleChange */}
          <div className="transition-opacity">
            <OrderFields
              order={order}
              readOnly={false}
              onChange={handleChange}
              lines={itemLines}
              inventoryOptions={inventoryOptions}
              slotOptions={slotOptions}
              assignedOptions={assignedOptions}
              supplierOptions={supplierOptions}
              skuOptions={skuOptions}
              onLineQtyChange={onLineQtyChange}
              onLineSkuChange={onLineSkuChange}
              onAddItemLine={onAddItemLine}
              onRemoveItemLine={onRemoveItemLine}
              getLineQty={(lineNum) => lineQty[lineNum] ?? 0}
              showDetailDeliveryNote={false}
              showDetailAssignedTo={true}
              showCreationSection={false}
              showEntradaMercancia={false}
            />
          </div>
        </>
      )}
    </div>
  );
}
