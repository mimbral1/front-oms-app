// views\Almacen\Gestion\SolicitudTraslado\Componentes\SolicitudTrasladoFieldsNuevo.tsx

"use client";

import { useEffect, useMemo } from "react";
import Card from "@/components/ui/card/Card";
import { ClipboardDocumentListIcon, ListBulletIcon } from "@heroicons/react/24/outline";
import { TrashIcon } from "@heroicons/react/24/outline";
import { useState } from "react";
import { SelectSearchInline } from "@/components/ui/collapsible/selectSearchInline";
import { useFetchWithAuthQA } from "@/app/fetchWithAuth/fetch-with-auth";
import type { MovementType } from "@/app/fetchWithAuth/api-traslados/inventory-docs";
import {
  BASE_ID_SERVICE,
  CATALOG_PRODUCTS_API,
  WAREHOUSE_API,
  WAREHOUSE_SKU_POSITION_API,
  WAREHOUSE_STOCK_API,
} from "@/lib/http/endpoints";

import { withAuthPlatformHeaders } from "@/features/almacenes/services/auth-headers";
const WAREHOUSE_URL = `${WAREHOUSE_API}?sortBy=referenceId&sortDirection=asc`;
const STOCK_BY_WAREHOUSE_URL = `${WAREHOUSE_STOCK_API}?filters[warehouse]=`;
const SKU_POSITION_BY_WAREHOUSE_URL = `${WAREHOUSE_SKU_POSITION_API}?filters[warehouseId]=`;
const USERS_URL = `${BASE_ID_SERVICE}/usuarios?page=1&pageSize=500`;
const CATALOG_PRODUCT_BY_SKU_URL = CATALOG_PRODUCTS_API;
const JANIS_HEADERS: Record<string, string> = withAuthPlatformHeaders({
  "janis-api-key": "test-key",
  "janis-api-secret": "test-secret",
  "janis-client": "test-client",
});

type StockProductRow = {
  sku?: string;
  itemSku?: string;
  ItemCode?: string;
  availableStock?: number;
  availableEffective?: number;
  name?: string;
  Name?: string;
  productName?: string;
  description?: string;
  Description?: string;
  onHandQty?: number;
  availableQty?: number;
  quantityAvailable?: number;
  available?: number;
};

type SkuPositionRow = {
  id?: string | number;
  positionId?: string | number;
  positionKey?: string;
  schemaType?: string;
  position?: {
    positionKey?: string;
    key?: string;
    schemaType?: string;
  };
};

type UserRow = {
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

const getRowSku = (row: StockProductRow): string =>
  String(row?.sku ?? row?.itemSku ?? row?.ItemCode ?? "").trim();

const getRowAvailable = (row: StockProductRow): number => {
  const value = Number(
    row?.availableStock ??
    row?.availableEffective ??
    row?.availableQty ??
    row?.quantityAvailable ??
    row?.available ??
    row?.onHandQty ??
    0
  );
  return Number.isFinite(value) ? value : 0;
};

const normalizeStockRows = (payload: any): StockProductRow[] => {
  if (Array.isArray(payload)) return payload as StockProductRow[];
  if (Array.isArray(payload?.data)) return payload.data as StockProductRow[];
  if (Array.isArray(payload?.items)) return payload.items as StockProductRow[];
  return [];
};

const normalizePositionRows = (payload: any): SkuPositionRow[] => {
  if (Array.isArray(payload)) return payload as SkuPositionRow[];
  if (Array.isArray(payload?.data)) return payload.data as SkuPositionRow[];
  if (Array.isArray(payload?.items)) return payload.items as SkuPositionRow[];
  if (Array.isArray(payload?.rows)) return payload.rows as SkuPositionRow[];
  if (Array.isArray(payload?.results)) return payload.results as SkuPositionRow[];
  if (Array.isArray(payload?.skuPositions)) return payload.skuPositions as SkuPositionRow[];
  if (payload && typeof payload === "object" && (payload.positionKey || payload.position?.key)) {
    return [payload as SkuPositionRow];
  }
  return [];
};

const getPositionKey = (row: SkuPositionRow): string =>
  String(row?.positionKey ?? row?.position?.positionKey ?? row?.position?.key ?? "").trim();

const getPositionSchemaType = (row: SkuPositionRow): string =>
  String(row?.schemaType ?? row?.position?.schemaType ?? "").trim();

const getPositionValue = (row: SkuPositionRow): string =>
  String(row?.positionId ?? row?.id ?? getPositionKey(row)).trim();

/* ---------- Tipos ---------- */
export interface TrasladoLine {
  itemSku: string;
  quantity: number | "";
}

export interface TrasladoRecord {
  header: {
    docType: "TT";
    movementType: MovementType;
    assigneeId: string;
    dispatcherId: string;
    receiverId: string;
    fromWh: string;
    fromPosition: string;
    toWh: string;
    toPosition: string;
    reference: string;
    docDate: string;
    externalRef: string;
  };
  lines: TrasladoLine[];
}

export function TrasladosFieldsNuevo({
  record,
  onChange,
  resetKey,
}: {
  record: TrasladoRecord;
  onChange: (record: TrasladoRecord) => void;
  resetKey: number;
}) {
  const { fetchWithAuthQA } = useFetchWithAuthQA();

  /* ---------- Warehouses ---------- */
  const [warehouses, setWarehouses] = useState<
    Array<{ id: string; code: string; name: string }>
  >([]);
  const [warehousesLoading, setWarehousesLoading] = useState(false);
  const [warehouseFromSearch, setWarehouseFromSearch] = useState("");
  const [warehouseToSearch, setWarehouseToSearch] = useState("");
  const [assigneeSearch, setAssigneeSearch] = useState("");
  const [dispatcherSearch, setDispatcherSearch] = useState("");
  const [receiverSearch, setReceiverSearch] = useState("");
  const [movementTypeSearch, setMovementTypeSearch] = useState("");
  const [fromPositionSearch, setFromPositionSearch] = useState("");
  const [toPositionSearch, setToPositionSearch] = useState("");
  const [fromPositionOptions, setFromPositionOptions] = useState<Array<{ value: string; label: string }>>([
    { value: "", label: "Seleccione posición..." },
  ]);
  const [toPositionOptions, setToPositionOptions] = useState<Array<{ value: string; label: string }>>([
    { value: "", label: "Seleccione posición..." },
  ]);
  const [fromPositionsLoading, setFromPositionsLoading] = useState(false);
  const [toPositionsLoading, setToPositionsLoading] = useState(false);

  const [productsLoading, setProductsLoading] = useState(false);
  const [stockLoading, setStockLoading] = useState(false);
  const [usersLoading, setUsersLoading] = useState(false);
  const [userOptions, setUserOptions] = useState<Array<{ value: string; label: string }>>([]);
  const [warehouseStockRows, setWarehouseStockRows] = useState<StockProductRow[]>([]);
  const [productOptions, setProductOptions] = useState<Array<{ value: string; label: string }>>([]);
  const [skuSearchByLine, setSkuSearchByLine] = useState<Record<number, string>>({});

  useEffect(() => {
    let mounted = true;

    const loadWarehouses = async () => {
      try {
        setWarehousesLoading(true);
        const res = await fetch(WAREHOUSE_URL, { method: "GET", headers: JANIS_HEADERS });
        const data = await res.json();

        if (!mounted) return;

        const warehouseRows = Array.isArray(data)
          ? data
          : Array.isArray(data?.data)
            ? data.data
            : Array.isArray(data?.rows)
              ? data.rows
              : Array.isArray(data?.items)
                ? data.items
                : [];

        setWarehouses(
          warehouseRows.map((w: any) => ({
            id: String(w.id || w.warehouseId || w.warehouse?.id || ""),
            code: String(w.referenceId || w.code || w.id || w.warehouseId || ""),
            name: String(w.name || w.referenceId || w.code || w.id || w.warehouseId || ""),
          }))
            .filter((w: { id: string; code: string; name: string }) => w.id && w.code)
        );
      } catch (e) {
        console.error("Error cargando almacenes:", e);
        setWarehouses([]);
      } finally {
        if (mounted) setWarehousesLoading(false);
      }
    };

    loadWarehouses();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    const normalizeUsers = (payload: any): UserRow[] => {
      if (Array.isArray(payload)) return payload as UserRow[];
      if (Array.isArray(payload?.data)) return payload.data as UserRow[];
      if (Array.isArray(payload?.items)) return payload.items as UserRow[];
      if (Array.isArray(payload?.rows)) return payload.rows as UserRow[];
      if (Array.isArray(payload?.results)) return payload.results as UserRow[];
      return [];
    };

    const loadUsers = async () => {
      try {
        setUsersLoading(true);
        const res = await fetch(USERS_URL, { method: "GET", headers: JANIS_HEADERS });
        if (!res.ok) throw new Error("No se pudo cargar usuarios");
        const payload = await res.json();

        if (!mounted) return;

        const options = Array.from(
          new Map(
            normalizeUsers(payload)
              .map((user) => {
                const value = String(user.id ?? user.ID ?? user.usuarioId ?? user.userId ?? "").trim();
                const fullName = `${String(user.FIRSTNAME ?? "").trim()} ${String(user.LASTNAME ?? "").trim()}`.trim();
                const username = String(user.username ?? user.userName ?? user.nombre ?? user.name ?? fullName).trim();
                const email = String(user.email ?? user.EMAIL ?? "").trim();
                if (!value) return null;
                const label = email && username ? `${username} (${email})` : username || email || value;
                return [value, { value, label }] as const;
              })
              .filter((entry): entry is readonly [string, { value: string; label: string }] => Boolean(entry))
          ).values()
        ).sort((a, b) => a.label.localeCompare(b.label));

        setUserOptions(options);
      } catch {
        if (!mounted) return;
        setUserOptions([]);
      } finally {
        if (mounted) setUsersLoading(false);
      }
    };

    loadUsers();
    return () => {
      mounted = false;
    };
  }, []);

  const warehouseOptions = useMemo(
    () => [
      { label: "Seleccione almacén...", value: "" },
      ...warehouses.map((w) => ({
        label: w.name,
        value: w.id,
      })),
    ],
    [warehouses]
  );

  const visibleWarehouseFromOptions = useMemo(() => {
    const q = warehouseFromSearch.trim().toLowerCase();
    if (!q) return warehouseOptions;
    return warehouseOptions.filter((o) => (o.label + " " + o.value).toLowerCase().includes(q));
  }, [warehouseOptions, warehouseFromSearch]);

  const visibleWarehouseToOptions = useMemo(() => {
    const q = warehouseToSearch.trim().toLowerCase();
    if (!q) return warehouseOptions;
    return warehouseOptions.filter((o) => (o.label + " " + o.value).toLowerCase().includes(q));
  }, [warehouseOptions, warehouseToSearch]);

  const movementTypeOptions: Array<{ label: string; value: MovementType }> = [
    { label: "Distribucion interna", value: "internalDistribution" },
    { label: "Abastecimiento", value: "supplying" },
    { label: "Reposicion", value: "replenishment" },
    { label: "Cancelacion", value: "canceling" },
  ];

  const visibleMovementTypeOptions = useMemo(() => {
    const q = movementTypeSearch.trim().toLowerCase();
    if (!q) return movementTypeOptions;
    return movementTypeOptions.filter((o) => (o.label + " " + o.value).toLowerCase().includes(q));
  }, [movementTypeOptions, movementTypeSearch]);

  const visibleAssigneeOptions = useMemo(() => {
    const q = assigneeSearch.trim().toLowerCase();
    if (!q) return userOptions;
    return userOptions.filter((o) => (o.label + " " + o.value).toLowerCase().includes(q));
  }, [userOptions, assigneeSearch]);

  const visibleDispatcherOptions = useMemo(() => {
    const q = dispatcherSearch.trim().toLowerCase();
    if (!q) return userOptions;
    return userOptions.filter((o) => (o.label + " " + o.value).toLowerCase().includes(q));
  }, [userOptions, dispatcherSearch]);

  const visibleReceiverOptions = useMemo(() => {
    const q = receiverSearch.trim().toLowerCase();
    if (!q) return userOptions;
    return userOptions.filter((o) => (o.label + " " + o.value).toLowerCase().includes(q));
  }, [userOptions, receiverSearch]);

  const selectedFromWarehouseId = useMemo(() => {
    if (!record.header.fromWh) return "";
    return warehouses.find((w) => w.id === record.header.fromWh || w.code === record.header.fromWh)?.id || record.header.fromWh;
  }, [record.header.fromWh, warehouses]);

  const selectedToWarehouseId = useMemo(() => {
    if (!record.header.toWh) return "";
    return warehouses.find((w) => w.id === record.header.toWh || w.code === record.header.toWh)?.id || record.header.toWh;
  }, [record.header.toWh, warehouses]);

  useEffect(() => {
    let mounted = true;

    const loadPositions = async (
      warehouseId: string,
      setOptions: React.Dispatch<React.SetStateAction<Array<{ value: string; label: string }>>>,
      setLoading: React.Dispatch<React.SetStateAction<boolean>>
    ) => {
      if (!warehouseId) {
        setOptions([{ value: "", label: "Seleccione posición..." }]);
        return;
      }

      try {
        setLoading(true);
        const res = await fetch(`${SKU_POSITION_BY_WAREHOUSE_URL}${encodeURIComponent(warehouseId)}`, {
          method: "GET",
          headers: JANIS_HEADERS,
        });
        if (!res.ok) throw new Error("No se pudo cargar posiciones");
        const payload = await res.json();
        const rows = normalizePositionRows(payload);

        const options = Array.from(
          new Map(
            rows
              .map((row) => {
                const positionKey = getPositionKey(row);
                const schemaType = getPositionSchemaType(row);
                const value = getPositionValue(row);
                if (!value || !positionKey) return null;
                const label = schemaType ? `${positionKey} - ${schemaType}` : positionKey;
                return [value, { value, label }] as const;
              })
              .filter((entry): entry is readonly [string, { value: string; label: string }] => Boolean(entry))
          ).values()
        );

        if (!mounted) return;
        setOptions([{ value: "", label: "Seleccione posición..." }, ...options]);
      } catch {
        if (!mounted) return;
        setOptions([{ value: "", label: "Seleccione posición..." }]);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadPositions(selectedFromWarehouseId, setFromPositionOptions, setFromPositionsLoading);
    return () => {
      mounted = false;
    };
  }, [selectedFromWarehouseId]);

  useEffect(() => {
    let mounted = true;

    const loadPositions = async (
      warehouseId: string,
      setOptions: React.Dispatch<React.SetStateAction<Array<{ value: string; label: string }>>>,
      setLoading: React.Dispatch<React.SetStateAction<boolean>>
    ) => {
      if (!warehouseId) {
        setOptions([{ value: "", label: "Seleccione posición..." }]);
        return;
      }

      try {
        setLoading(true);
        const res = await fetch(`${SKU_POSITION_BY_WAREHOUSE_URL}${encodeURIComponent(warehouseId)}`, {
          method: "GET",
          headers: JANIS_HEADERS,
        });
        if (!res.ok) throw new Error("No se pudo cargar posiciones");
        const payload = await res.json();
        const rows = normalizePositionRows(payload);

        const options = Array.from(
          new Map(
            rows
              .map((row) => {
                const positionKey = getPositionKey(row);
                const schemaType = getPositionSchemaType(row);
                const value = getPositionValue(row);
                if (!value || !positionKey) return null;
                const label = schemaType ? `${positionKey} - ${schemaType}` : positionKey;
                return [value, { value, label }] as const;
              })
              .filter((entry): entry is readonly [string, { value: string; label: string }] => Boolean(entry))
          ).values()
        );

        if (!mounted) return;
        setOptions([{ value: "", label: "Seleccione posición..." }, ...options]);
      } catch {
        if (!mounted) return;
        setOptions([{ value: "", label: "Seleccione posición..." }]);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadPositions(selectedToWarehouseId, setToPositionOptions, setToPositionsLoading);
    return () => {
      mounted = false;
    };
  }, [selectedToWarehouseId]);

  useEffect(() => {
    let mounted = true;

    const loadProductsFromStock = async () => {
      if (!selectedFromWarehouseId) {
        setWarehouseStockRows([]);
        setProductOptions([]);
        return;
      }

      try {
        setStockLoading(true);
        setProductsLoading(true);
        const res = await fetch(`${STOCK_BY_WAREHOUSE_URL}${encodeURIComponent(selectedFromWarehouseId)}`, {
          method: "GET",
          headers: JANIS_HEADERS,
        });
        if (!res.ok) throw new Error("No se pudo cargar productos por bodega");
        const payload = await res.json();
        const rows = normalizeStockRows(payload);
        setWarehouseStockRows(Array.isArray(rows) ? rows : []);

        const stockBySku = new Map<string, { available: number; fallbackName: string }>();
        for (const p of rows) {
          const sku = getRowSku(p);
          if (!sku) continue;
          const available = getRowAvailable(p);
          const fallbackName = String(
            p?.Name ?? p?.name ?? p?.productName ?? p?.description ?? p?.Description ?? ""
          ).trim();
          const prev = stockBySku.get(sku);
          stockBySku.set(sku, {
            available: (prev?.available ?? 0) + available,
            fallbackName: prev?.fallbackName || fallbackName,
          });
        }

        const uniqueSkus = Array.from(
          new Set(
            Array.from(stockBySku.entries())
              .filter(([, summary]) => summary.available > 0)
              .map(([sku]) => sku)
          )
        );

        const nameBySku = new Map<string, string>();
        await Promise.all(
          uniqueSkus.map(async (sku) => {
            try {
              const payload = await fetchWithAuthQA<any>(
                `${CATALOG_PRODUCT_BY_SKU_URL}/${encodeURIComponent(sku)}`,
                { method: "GET", cache: "no-store" }
              );
              const product = Array.isArray(payload)
                ? payload[0]
                : Array.isArray(payload?.data)
                  ? payload.data[0]
                  : payload?.data ?? payload;
              const name = String(
                product?.Name ??
                product?.name ??
                product?.productName ??
                product?.description ??
                product?.Description ??
                ""
              ).trim();
              if (name) nameBySku.set(sku, name);
            } catch {
              // Keep SKU without name when catalog lookup fails
            }
          })
        );

        if (!mounted) return;

        const unique = Array.from(stockBySku.entries())
          .filter(([, summary]) => summary.available > 0)
          .map(([sku, summary]) => {
            const name = String(nameBySku.get(sku) || summary.fallbackName || "").trim();
            return { value: sku, label: name ? `${sku} - ${name}` : sku };
          });

        setProductOptions(unique);
      } catch {
        if (mounted) setWarehouseStockRows([]);
        if (mounted) setProductOptions([]);
      } finally {
        if (mounted) setStockLoading(false);
        if (mounted) setProductsLoading(false);
      }
    };

    loadProductsFromStock();
    return () => {
      mounted = false;
    };
  }, [selectedFromWarehouseId, fetchWithAuthQA]);

  /////////////////////////

  // limpiar stock cuando cambia resetKey 
  useEffect(() => {
    setWarehouseStockRows([]);
    setProductOptions([]);
    setSkuSearchByLine({});
    setFromPositionSearch("");
    setToPositionSearch("");
    setFromPositionOptions([{ value: "", label: "Seleccione posición..." }]);
    setToPositionOptions([{ value: "", label: "Seleccione posición..." }]);
  }, [resetKey]);

  /////////////////////////

  const updateHeader = (field: string, value: any) => {
    onChange({
      ...record,
      header: { ...record.header, [field]: value },
    });
  };

  const visibleFromPositionOptions = useMemo(() => {
    const q = fromPositionSearch.trim().toLowerCase();
    if (!q) return fromPositionOptions;
    return fromPositionOptions.filter((o) => (o.label + " " + o.value).toLowerCase().includes(q));
  }, [fromPositionOptions, fromPositionSearch]);

  const visibleToPositionOptions = useMemo(() => {
    const q = toPositionSearch.trim().toLowerCase();
    if (!q) return toPositionOptions;
    return toPositionOptions.filter((o) => (o.label + " " + o.value).toLowerCase().includes(q));
  }, [toPositionOptions, toPositionSearch]);

  const updateLine = (idx: number, field: string, value: any) => {
    const newLines = [...record.lines];
    newLines[idx] = { ...newLines[idx], [field]: value };
    onChange({ ...record, lines: newLines });
  };

  const addLine = () =>
    onChange({
      ...record,
      lines: [...record.lines, { itemSku: "", quantity: 1 }],
    });

  const removeLine = (idx: number) => {
    const newLines = record.lines.filter((_, i) => i !== idx);
    onChange({ ...record, lines: newLines.length ? newLines : [{ itemSku: "", quantity: 1 }] });
  };

  const availableStockBySku = useMemo(() => {
    const map = new Map<string, number>();
    for (const row of warehouseStockRows) {
      const sku = getRowSku(row);
      if (!sku) continue;
      map.set(sku, (map.get(sku) ?? 0) + getRowAvailable(row));
    }
    return map;
  }, [warehouseStockRows]);

  const selectedItemsStock = useMemo(() => {
    return record.lines
      .map((line) => String(line.itemSku || "").trim())
      .filter(Boolean)
      .map((sku, idx) => ({
        key: `${sku}-${idx}`,
        sku,
        availableStock: availableStockBySku.get(sku) ?? 0,
      }));
  }, [record.lines, availableStockBySku]);

  const selectableSkus = useMemo(
    () => new Set(productOptions.map((opt) => opt.value).filter(Boolean)),
    [productOptions]
  );

  useEffect(() => {
    if (!record.lines.length || selectableSkus.size === 0) return;

    const hasInvalid = record.lines.some(
      (line) => line.itemSku && !selectableSkus.has(line.itemSku)
    );
    if (!hasInvalid) return;

    onChange({
      ...record,
      lines: record.lines.map((line) =>
        line.itemSku && !selectableSkus.has(line.itemSku)
          ? { ...line, itemSku: "" }
          : line
      ),
    });
  }, [selectableSkus, record, onChange]);


  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-7">
      <Card
        title="DETALLE"
        icon={ClipboardDocumentListIcon}
        noDefaultStyles
        hasTitleDivider
        className="rounded-xl bg-white p-6 lg:col-span-4"
      >
        <div className="grid grid-cols-6 gap-4 text-sm">
          <span className="col-span-1 font-bold text-gray-600">Tipo mov.</span>
          <div className="col-span-5">
            <SelectSearchInline
              id="movementType"
              label="Tipo de movimiento"
              value={record.header.movementType}
              options={visibleMovementTypeOptions}
              searchQuery={movementTypeSearch}
              loading={false}
              onSearch={setMovementTypeSearch}
              onChange={(val) => {
                updateHeader("movementType", val as MovementType);
              }}
              placeholderFromDefault
            />
          </div>

          <span className="col-span-1 font-bold text-gray-600">Asignado</span>
          <div className="col-span-5">
            <SelectSearchInline
              id="assigneeId"
              label="Asignado"
              value={record.header.assigneeId}
              options={visibleAssigneeOptions}
              searchQuery={assigneeSearch}
              loading={usersLoading}
              onSearch={setAssigneeSearch}
              onChange={(val) => {
                updateHeader("assigneeId", val);
              }}
              placeholderFromDefault
            />
          </div>

          <span className="col-span-1 font-bold text-gray-600">Despachador</span>
          <div className="col-span-5">
            <SelectSearchInline
              id="dispatcherId"
              label="Despachador"
              value={record.header.dispatcherId}
              options={visibleDispatcherOptions}
              searchQuery={dispatcherSearch}
              loading={usersLoading}
              onSearch={setDispatcherSearch}
              onChange={(val) => {
                updateHeader("dispatcherId", val);
              }}
              placeholderFromDefault
            />
          </div>

          <span className="col-span-1 font-bold text-gray-600">Receptor</span>
          <div className="col-span-5">
            <SelectSearchInline
              id="receiverId"
              label="Receptor"
              value={record.header.receiverId}
              options={visibleReceiverOptions}
              searchQuery={receiverSearch}
              loading={usersLoading}
              onSearch={setReceiverSearch}
              onChange={(val) => {
                updateHeader("receiverId", val);
              }}
              placeholderFromDefault
            />
          </div>

          <span className="col-span-1 font-bold text-gray-600">Origen</span>
          <div className="col-span-5">
            <SelectSearchInline
              id="fromWh"
              label="Origen"
              value={record.header.fromWh}
              options={visibleWarehouseFromOptions}
              searchQuery={warehouseFromSearch}
              loading={warehousesLoading}
              onSearch={setWarehouseFromSearch}
              onChange={(val) => {
                onChange({
                  ...record,
                  header: {
                    ...record.header,
                    fromWh: val,
                    fromPosition: "",
                  },
                });
              }}
              placeholderFromDefault
            />
          </div>

          <span className="col-span-1 font-bold text-gray-600">Posición origen</span>
          <div className="col-span-5">
            <SelectSearchInline
              id="fromPosition"
              label="Posición origen"
              value={record.header.fromPosition}
              options={visibleFromPositionOptions}
              searchQuery={fromPositionSearch}
              loading={fromPositionsLoading}
              onSearch={setFromPositionSearch}
              onChange={(val) => {
                updateHeader("fromPosition", val);
              }}
              placeholderFromDefault
            />
          </div>

          <span className="col-span-1 font-bold text-gray-600">Destino</span>
          <div className="col-span-5">
            <SelectSearchInline
              id="toWh"
              label="Destino"
              value={record.header.toWh}
              options={visibleWarehouseToOptions}
              searchQuery={warehouseToSearch}
              loading={warehousesLoading}
              onSearch={setWarehouseToSearch}
              onChange={(val) => {
                onChange({
                  ...record,
                  header: {
                    ...record.header,
                    toWh: val,
                    toPosition: "",
                  },
                });
              }}
              placeholderFromDefault
            />
          </div>

          <span className="col-span-1 font-bold text-gray-600">Posición destino</span>
          <div className="col-span-5">
            <SelectSearchInline
              id="toPosition"
              label="Posición destino"
              value={record.header.toPosition}
              options={visibleToPositionOptions}
              searchQuery={toPositionSearch}
              loading={toPositionsLoading}
              onSearch={setToPositionSearch}
              onChange={(val) => {
                updateHeader("toPosition", val);
              }}
              placeholderFromDefault
            />
          </div>

          {/* <span className="col-span-1 font-bold text-gray-600">Fecha</span>
              <div className="col-span-5">
                <SingleDateFilter
                  value={record.header.docDate || null}
                  onChange={(value) => updateHeader("docDate", value || "")}
                  label="Seleccionar fecha"
                />
              </div> */}

          {/* <span className="col-span-1 font-bold text-gray-600">External Ref</span>
              <div className="col-span-5">
                <input
                  className="w-full border-b bg-transparent outline-none"
                  value={record.header.externalRef}
                  onChange={(e) => updateHeader("externalRef", e.target.value)}
                />
              </div> */}
        </div>
      </Card>

      <Card
        title="STOCK"
        noDefaultStyles
        hasTitleDivider
        className="rounded-xl bg-white p-4 lg:col-span-3 lg:row-span-2 lg:sticky lg:top-4"
      >
        {stockLoading ? (
          <div className="text-sm text-gray-400">Cargando stock...</div>
        ) : selectedItemsStock.length === 0 ? (
          <div className="text-sm text-gray-400">Agrega items para ver su stock disponible</div>
        ) : (
          <table className="min-w-full text-xs">
            <thead className="border-b text-gray-500">
              <tr>
                <th className="py-1 text-left">SKU</th>
                <th className="py-1 text-right">Disponible</th>
              </tr>
            </thead>
            <tbody>
              {selectedItemsStock.map((row) => (
                <tr key={row.key} className="border-b last:border-b-0">
                  <td className="py-1 font-mono">{row.sku}</td>
                  <td className="py-1 text-right tabular-nums">{row.availableStock}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <Card
        title="Items"
        icon={ListBulletIcon}
        noDefaultStyles
        hasTitleDivider
        className="rounded-xl bg-white p-6 lg:col-span-4"
      >
        <div className="space-y-4">
          {record.lines.map((l, idx) => (
            <div key={idx}>
              {/* ===== Línea ===== */}
              <div className="grid grid-cols-7 gap-4 text-sm items-center">
                <span className="col-span-1 font-bold text-gray-600">SKU</span>
                <div className="col-span-3 min-w-0">
                  <SelectSearchInline
                    id={`sku-${idx}`}
                    label="SKU"
                    value={l.itemSku}
                    options={[{ label: "Seleccione SKU...", value: "" }, ...productOptions]}
                    searchQuery={skuSearchByLine[idx] || ""}
                    loading={productsLoading}
                    onSearch={(q) =>
                      setSkuSearchByLine((prev) => ({
                        ...prev,
                        [idx]: q,
                      }))
                    }
                    onChange={(val) => {
                      updateLine(idx, "itemSku", val);
                      setSkuSearchByLine((prev) => ({
                        ...prev,
                        [idx]: "",
                      }));
                    }}
                    placeholderFromDefault
                  />
                </div>

                <span className="col-span-1 font-bold text-gray-600">Cantidad</span>
                <div className="col-span-1">
                  <input
                    type="number"
                    min={1}
                    className="w-full border-b bg-transparent outline-none text-right"
                    value={l.quantity}
                    onChange={(e) => {
                      const raw = e.target.value;
                      updateLine(idx, "quantity", raw === "" ? "" : Number(raw));
                    }}
                  />
                </div>

                <div className="col-span-1 flex justify-end">
                  <button
                    type="button"
                    onClick={() => removeLine(idx)}
                    className="text-gray-400 hover:text-red-500"
                    title="Eliminar línea"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={addLine}
            className="text-sm text-blue-600 hover:underline"
          >
            + Agregar Item
          </button>
        </div>
      </Card>

    </div>
  );

}
