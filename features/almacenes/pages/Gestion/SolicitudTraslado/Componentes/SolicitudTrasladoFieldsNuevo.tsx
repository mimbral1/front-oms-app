// views\Almacen\Gestion\SolicitudTraslado\Componentes\SolicitudTrasladoFieldsNuevo.tsx

"use client";

import { useEffect, useMemo } from "react";
import Card from "@/components/ui/card/Card";
import { ClipboardDocumentListIcon, ListBulletIcon } from "@heroicons/react/24/outline";
import { TrashIcon } from "@heroicons/react/24/outline";
import { useRef, useState } from "react";
import {
  inventoryStockByWarehouse,
  type StockByWarehouseReal,
} from "@/app/fetchWithAuth/api-inventory/inventory";
import { SelectSearchInline } from "@/components/ui/collapsible/selectSearchInline";
import { WAREHOUSE_API } from "@/lib/http/endpoints";
import { withAuthPlatformHeaders } from "@/features/almacenes/services/auth-headers";

/* ---------- Tipos ---------- */
export interface TrasladoLine {
  itemSku: string;
  quantity: number;
}

export interface TrasladoRecord {
  header: {
    docType: "TT";
    fromWh: string;
    toWh: string;
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

  // para manejar stock por sku 
  const [activeSku, setActiveSku] = useState<string | null>(null);

  const [stockBySku, setStockBySku] = useState<
    Record<string, StockByWarehouseReal[]>
  >({});

  const loadingSkuRef = useRef<Record<string, boolean>>({});

  /* ---------- Warehouses ---------- */
  const [warehouses, setWarehouses] = useState<
    Array<{ code: string; name: string }>
  >([]);
  const [warehousesLoading, setWarehousesLoading] = useState(false);
  const [warehouseSearch, setWarehouseSearch] = useState("");

  useEffect(() => {
    let mounted = true;

  const loadWarehouses = async () => {
      try {
        setWarehousesLoading(true);
        const res = await fetch(
          `${WAREHOUSE_API}?sortBy=referenceId&sortDirection=asc`,
          {
            method: "GET",
            headers: withAuthPlatformHeaders({
              "Content-Type": "application/json",
            }),
          }
        );
        const data = await res.json();

        if (!mounted) return;

        setWarehouses(
          (data || []).map((w: any) => ({
            code: String(w.referenceId ?? w.code ?? w.id ?? ""),
            name: String(w.name ?? w.referenceId ?? w.code ?? w.id ?? ""),
          }))
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

  const warehouseOptions = useMemo(
    () => [
      { label: "Seleccione almacén…", value: "" },
      ...warehouses.map((w) => ({
        label: w.name,
        value: w.code,
      })),
    ],
    [warehouses]
  );

  const visibleWarehouseOptions = useMemo(() => {
    const q = warehouseSearch.trim().toLowerCase();
    if (!q) return warehouseOptions;
    return warehouseOptions.filter((o) =>
      (o.label + " " + o.value).toLowerCase().includes(q)
    );
  }, [warehouseOptions, warehouseSearch]);

  /////////////////////////

  // limpiar stock cuando cambia resetKey 
  useEffect(() => {
    // limpiar stock cacheado al crear un nuevo traslado
    setStockBySku({});
    loadingSkuRef.current = {};
  }, [resetKey]);

  /////////////////////////

  const updateHeader = (field: string, value: any) => {
    onChange({
      ...record,
      header: { ...record.header, [field]: value },
    });
  };

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

  const loadStockForSku = async (sku: string) => {
    if (!sku || stockBySku[sku] || loadingSkuRef.current[sku]) return;

    try {
      loadingSkuRef.current[sku] = true;
      const data = await inventoryStockByWarehouse({ sku });
      setStockBySku((prev) => ({ ...prev, [sku]: data }));
    } catch {
      setStockBySku((prev) => ({ ...prev, [sku]: [] }));
    } finally {
      loadingSkuRef.current[sku] = false;
    }
  };


  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-7">

        {/* ================= IZQUIERDA ================= */}
        <div className="lg:col-span-4 space-y-6">

          <Card
            title="DETALLE"
            icon={ClipboardDocumentListIcon}
            noDefaultStyles
            hasTitleDivider
            className="rounded-xl p-6"
          >
            <div className="grid grid-cols-6 gap-4 text-sm">
              <span className="col-span-1 font-bold text-gray-600">Origen</span>
              <div className="col-span-5">
                <SelectSearchInline
                  id="fromWh"
                  label="Origen"
                  value={record.header.fromWh}
                  options={visibleWarehouseOptions}
                  searchQuery={warehouseSearch}
                  loading={warehousesLoading}
                  onSearch={setWarehouseSearch}
                  onChange={(val) => {
                    updateHeader("fromWh", val);
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
                  options={visibleWarehouseOptions}
                  searchQuery={warehouseSearch}
                  loading={warehousesLoading}
                  onSearch={setWarehouseSearch}
                  onChange={(val) => {
                    updateHeader("toWh", val);
                  }}
                  placeholderFromDefault
                />
              </div>

              <span className="col-span-1 font-bold text-gray-600">Referencia</span>
              <div className="col-span-5">
                <input
                  className="w-full border-b bg-transparent outline-none"
                  value={record.header.reference}
                  onChange={(e) => updateHeader("reference", e.target.value)}
                />
              </div>

              <span className="col-span-1 font-bold text-gray-600">Fecha</span>
              <div className="col-span-5">
                <input
                  type="date"
                  className="w-full border-b bg-transparent outline-none"
                  value={record.header.docDate}
                  onChange={(e) => updateHeader("docDate", e.target.value)}
                />
              </div>

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
            title="LÍNEAS"
            icon={ListBulletIcon}
            noDefaultStyles
            hasTitleDivider
            className="rounded-xl p-6"
          >
            <div className="space-y-4">
              {record.lines.map((l, idx) => (
                <div key={idx}>
                  {/* ===== Línea ===== */}
                  <div className="grid grid-cols-7 gap-4 text-sm items-center">
                    <span className="col-span-1 font-bold text-gray-600">SKU</span>
                    <div className="col-span-3">
                      <input
                        className="w-full border-b bg-transparent outline-none"
                        value={l.itemSku}
                        onChange={(e) => {
                          const value = e.target.value;
                          updateLine(idx, "itemSku", value);

                          if (value?.trim()) {
                            setActiveSku(value.trim());
                            loadStockForSku(value.trim());
                          }
                        }}
                        onFocus={() => {
                          if (l.itemSku) setActiveSku(l.itemSku);
                        }}

                      />
                    </div>

                    <span className="col-span-1 font-bold text-gray-600">Cantidad</span>
                    <div className="col-span-1">
                      <input
                        type="number"
                        min={1}
                        className="w-full border-b bg-transparent outline-none text-right"
                        value={l.quantity}
                        onChange={(e) =>
                          updateLine(idx, "quantity", Number(e.target.value))
                        }
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
                + Agregar línea
              </button>
            </div>
          </Card>
        </div>
        {/* ================= DERECHA ================= */}
        <div className="lg:col-span-3">
          <Card
            title="STOCK"
            noDefaultStyles
            hasTitleDivider
            className="rounded-xl p-4 sticky top-4"
          >
            {!activeSku ? (
              <div className="text-sm text-gray-400">
                Selecciona una línea para ver stock
              </div>
            ) : !stockBySku[activeSku] ? (
              <div className="text-sm text-gray-400">
                Cargando stock…
              </div>
            ) : stockBySku[activeSku].length === 0 ? (
              <div className="text-sm text-gray-400">
                No se pudo cargar stock
              </div>
            ) : (
              <>
                <div className="mb-2 text-xs text-gray-500">
                  SKU: <span className="font-mono">{activeSku}</span>
                </div>

                <table className="min-w-full text-xs">
                  <thead className="border-b text-gray-500">
                    <tr>
                      <th className="py-1 text-left">Bodega</th>
                      <th className="py-1 text-right">Disponible</th>
                      <th className="py-1 text-right">Comprom.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stockBySku[activeSku].map((s) => (
                      <tr
                        key={`${s.itemSku}-${s.warehouseCode}`}
                        className="border-b last:border-b-0"
                      >
                        <td className="py-1">{s.warehouseCode}</td>
                        <td className="py-1 text-right tabular-nums">
                          {s.availableEffective ?? s.onHandQty}
                        </td>
                        <td className="py-1 text-right tabular-nums">
                          {s.salesCommitQty}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
          </Card>
        </div>

      </div>
    </div>
  );

}
