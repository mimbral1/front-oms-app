// views\PedidosView\Nuevo-Pedido\CrearPedidoBaseView.tsx

"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Button,
  Input,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import EditIcon from "@mui/icons-material/Edit";
import { PageHeader } from "@/components/layout/page-header";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import Card from "@/components/ui/card";
import { FieldRows } from "@/components/ui/fieldrows/FieldRows";
import {
  ClipboardIcon,
  Search,
  SparklesIcon,
  UserIcon,
} from "lucide-react";
import { ArrowDownOnSquareIcon, ExclamationTriangleIcon, TrashIcon, XCircleIcon } from "@heroicons/react/24/outline";
import { ActionButton } from "@/components/ui/button/action-button";
import { Plus } from "lucide-react";
import { clp } from "@/lib/format/money";
import JsBarcode from "jsbarcode";
// llamadas a apis
import { useFetchWithAuth, useFetchWithAuthInventory, useFetchWithAuthQA } from "@/lib/http/client";
import { useAuth } from "@/app/context/auth/AuthContext";
import { type CustomerDTO } from "@/app/fetchWithAuth/api-clientes/clientes/customers";
// componentes para listar 
import { SelectSearchInline } from "@/components/ui/collapsible/selectSearchInline";
// modal para crear clientes 
import { CustomerUpsertModal } from "@/features/pedidos/components/nuevo-pedido/CustomerUpsertModal";
import { buildMockSlots } from "@/features/pedidos/components/nuevo-pedido/TimeSlotSelect";

// === Stock Modal ===
import StockModal from "@/features/pedidos/components/nuevo-pedido/StockModal";

// items
import SeccionEntrega from "@/features/pedidos/components/nuevo-pedido/SeccionEntrega";
import SeccionPagos from "@/features/pedidos/components/nuevo-pedido/SeccionPagos";
import ResumenCompra from "@/features/pedidos/components/nuevo-pedido/ResumenCompra";
import {
  ModalCambiarCliente,
  useDebounced,
} from "@/features/pedidos/components/nuevo-pedido/CrearPedidoHelpers";
import {
  CATALOG_PRODUCTS_LIST_API,
  COMMERCE_SERVICE_SALES_CHANNELS_SIMPLE_API,
  CUSTOMERS_FIND_API,
  PRE_ORDER_API,
  PRE_ORDER_ISSUE_SUMMARY_API,
  URL_INVENTORY_STOCK,
} from "@/lib/http/endpoints";
const SELLER_BY_USER_URL = "oms-service/orders/seller/user";

type PreOrderCreateResponseLike = {
  success?: boolean;
  preOrderID?: string | number;
  preOrderCode?: string;
  pedido?: string;
  barCode?: string;
  barcode?: string;
  preOrder?: {
    preOrderID?: string | number;
    preOrderCode?: string;
    barCode?: string;
    barcode?: string;
    pedido?: string;
  };
  datosPedido?: {
    preOrderID?: string | number;
    preOrderCode?: string;
    pedido?: string;
  };
  data?: {
    preOrderID?: string | number;
    preOrderCode?: string;
    pedido?: string;
    barCode?: string;
    barcode?: string;
    datosPedido?: {
      preOrderID?: string | number;
      preOrderCode?: string;
      pedido?: string;
    };
    preOrder?: {
      preOrderID?: string | number;
      preOrderCode?: string;
      barCode?: string;
      barcode?: string;
      pedido?: string;
    };
  };
};

const getErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === "string" && error.trim()) return error;
  return fallback;
};

const isAbortError = (error: unknown) =>
  error instanceof Error && error.name === "AbortError";

const getErrorPayload = (error: unknown): Record<string, unknown> | null => {
  if (!error || typeof error !== "object" || !("payload" in error)) return null;
  const payload = (error as { payload?: unknown }).payload;
  return payload && typeof payload === "object" ? payload as Record<string, unknown> : null;
};

const escapeTicketHtml = (value: unknown): string =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");

const INVALID_PREORDER_CODES = new Set([
  "",
  "-",
  "SIN-CODIGO",
  "SIN_CODIGO",
  "N/A",
  "NULL",
  "UNDEFINED",
]);

const normalizeTicketCandidate = (value: unknown): string => {
  const raw = String(value ?? "").trim();
  if (!raw) return "";
  if (INVALID_PREORDER_CODES.has(raw.toUpperCase())) return "";
  return raw;
};

const findDeepFirstByKeys = (
  input: unknown,
  keys: string[],
  maxDepth = 6,
): string => {
  if (!input || typeof input !== "object") return "";

  const keySet = new Set(keys.map((k) => k.toLowerCase()));
  const queue: Array<{ node: unknown; depth: number }> = [{ node: input, depth: 0 }];
  const seen = new Set<unknown>();

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) continue;
    const { node, depth } = current;

    if (!node || typeof node !== "object") continue;
    if (seen.has(node)) continue;
    seen.add(node);
    if (depth > maxDepth) continue;

    if (Array.isArray(node)) {
      node.forEach((child) => queue.push({ node: child, depth: depth + 1 }));
      continue;
    }

    const obj = node as Record<string, unknown>;
    for (const [key, value] of Object.entries(obj)) {
      if (keySet.has(key.toLowerCase())) {
        const candidate = normalizeTicketCandidate(value);
        if (candidate) return candidate;
      }
    }

    Object.values(obj).forEach((child) => {
      if (child && typeof child === "object") {
        queue.push({ node: child, depth: depth + 1 });
      }
    });
  }

  return "";
};

const resolveCreatedPreOrderCode = (payload: PreOrderCreateResponseLike | null | undefined): string => {
  const source = payload?.data ?? payload;

  const explicitPreOrderCode = normalizeTicketCandidate((source as PreOrderCreateResponseLike | undefined)?.preOrder?.preOrderCode);
  if (explicitPreOrderCode) return explicitPreOrderCode;

  const code = findDeepFirstByKeys(source, [
    "pedido",
    "preOrderCode",
    "barCode",
    "barcode",
    "code",
  ]);
  if (code) return code;

  return findDeepFirstByKeys(source, ["preOrderID", "id"]);
};

const resolveCreatedPreOrderBarcode = (payload: PreOrderCreateResponseLike | null | undefined): string => {
  const source = payload?.data ?? payload;

  const explicitBarCode = normalizeTicketCandidate((source as PreOrderCreateResponseLike | undefined)?.preOrder?.barCode);
  if (explicitBarCode) return explicitBarCode;

  const barcode = findDeepFirstByKeys(source, ["barCode", "barcode", "pedido"]);
  if (barcode) return barcode;

  return resolveCreatedPreOrderCode(payload);
};

const resolveCreatedPreOrderId = (payload: PreOrderCreateResponseLike | null | undefined): string => {
  const source = payload?.data ?? payload;

  const id = findDeepFirstByKeys(source, ["preOrderID", "id"]);
  if (id) return id;

  return findDeepFirstByKeys(source, ["preOrderCode", "pedido", "barCode", "barcode"]);
};

const buildBarcodeSvg = (value: string): string => {
  const barcodeValue = String(value || "").trim();
  if (!barcodeValue) return "";

  try {
    const svgNode = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    JsBarcode(svgNode, barcodeValue, {
      format: "CODE128",
      displayValue: true,
      fontSize: 14,
      height: 48,
      width: 1.8,
      margin: 0,
      background: "#ffffff",
    });
    return svgNode.outerHTML;
  } catch {
    return "";
  }
};

async function printCreatedPreOrderTicket(params: {
  preOrderCode: string;
  barcodeValue: string;
  customerName: string;
  createdAt: string;
  status: string;
  items: Array<{ sku: string; name: string; quantity: number; total: number }>;
  totalAmount: number;
}) {
  if (typeof window === "undefined") return;

  const barcodeSvg = buildBarcodeSvg(params.barcodeValue || params.preOrderCode);
  const rows = params.items
    .map((item) => `
      <tr>
        <td>${escapeTicketHtml(item.name || "Sin descripción")}</td>
        <td>${escapeTicketHtml(item.sku || "-")}</td>
        <td style="text-align:right;">${escapeTicketHtml(item.quantity)}</td>
        <td style="text-align:right;">${escapeTicketHtml(clp.format(item.total || 0))}</td>
      </tr>`)
    .join("");

  const ticketMarkup = `
    <div class="preventa-ticket">
      <h1>Ticket de Preventa</h1>
      <div class="meta">
        <div><strong>Preventa:</strong> ${escapeTicketHtml(params.preOrderCode)}</div>
        <div><strong>Codigo barras:</strong> ${escapeTicketHtml(params.barcodeValue || "-")}</div>
        <div><strong>Estado:</strong> ${escapeTicketHtml(params.status)}</div>
        <div><strong>Fecha:</strong> ${escapeTicketHtml(params.createdAt)}</div>
        <div><strong>Cliente:</strong> ${escapeTicketHtml(params.customerName)}</div>
      </div>
      <div class="barcode-wrap">${barcodeSvg || ""}</div>
      <table>
        <thead>
          <tr>
            <th>Producto</th>
            <th>SKU</th>
            <th>Cant.</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
      <div class="total">TOTAL: ${escapeTicketHtml(clp.format(params.totalAmount || 0))}</div>
    </div>
  `;

  const ticketStyles = `
    .preventa-ticket {
      font-family: Arial, sans-serif;
      margin: 16px;
      color: #111827;
    }
    .preventa-ticket h1 {
      font-size: 18px;
      margin: 0 0 8px;
    }
    .preventa-ticket .meta {
      font-size: 12px;
      margin-bottom: 10px;
    }
    .preventa-ticket .meta div {
      margin: 2px 0;
    }
    .preventa-ticket .barcode-wrap {
      margin: 8px 0 12px;
      text-align: center;
    }
    .preventa-ticket table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12px;
    }
    .preventa-ticket th,
    .preventa-ticket td {
      border-bottom: 1px solid #e5e7eb;
      padding: 6px 4px;
    }
    .preventa-ticket th {
      text-align: left;
      background: #f8fafc;
    }
    .preventa-ticket .total {
      margin-top: 10px;
      text-align: right;
      font-size: 14px;
      font-weight: 700;
    }
  `;

  const PRINT_ROOT_ID = "__preventa_ticket_create_print_root";
  const PRINT_STYLE_ID = "__preventa_ticket_create_print_style";

  const oldRoot = document.getElementById(PRINT_ROOT_ID);
  if (oldRoot?.parentNode) oldRoot.parentNode.removeChild(oldRoot);

  const oldStyle = document.getElementById(PRINT_STYLE_ID);
  if (oldStyle?.parentNode) oldStyle.parentNode.removeChild(oldStyle);

  const printRoot = document.createElement("div");
  printRoot.id = PRINT_ROOT_ID;
  printRoot.innerHTML = ticketMarkup;
  printRoot.style.display = "none";
  document.body.appendChild(printRoot);

  const printStyle = document.createElement("style");
  printStyle.id = PRINT_STYLE_ID;
  printStyle.textContent = `
    @media print {
      body * { visibility: hidden !important; }
      #${PRINT_ROOT_ID}, #${PRINT_ROOT_ID} * { visibility: visible !important; }
      #${PRINT_ROOT_ID} {
        display: block !important;
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
        background: white;
        z-index: 999999;
      }
      #${PRINT_ROOT_ID} ${ticketStyles}
    }
  `;
  document.head.appendChild(printStyle);

  const cleanup = () => {
    const root = document.getElementById(PRINT_ROOT_ID);
    if (root?.parentNode) root.parentNode.removeChild(root);
    const style = document.getElementById(PRINT_STYLE_ID);
    if (style?.parentNode) style.parentNode.removeChild(style);
  };

  await new Promise<void>((resolve) => {
    let settled = false;
    const done = () => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve();
    };

    const onAfterPrint = () => done();
    window.addEventListener("afterprint", onAfterPrint, { once: true });

    window.print();
    setTimeout(done, 2500);
  });
}

export interface Cliente {
  CanalVenta: string;
  Cliente: string;
  Empresa: string;
}
const emptyClient: Cliente = {
  CanalVenta: "",
  Cliente: "",
  Empresa: "",
};

type ItemsFlags = {
  picked: boolean;
  empty: boolean;
};

type Product = {
  sku: string;
  name: string;
  img: string;
  price: number;
  itemCode?: string;
  itemName?: string;
};
type PedidoLine = { sku: string; cantidad: number };

type PreOrderShipmentItem = {
  uniqueId: string;
  sku: string;
  quantity: number;
  warehouses: Array<{
    warehouseCode: string;
    assignedQty: number;
  }>;
};

type PreOrderShipment = {
  code: string;
  deliveryCompanyName: string;
  deliveryCompanyId: number;
  shippingId: number;
  timeSlotId: number;
  deliveryDate: string;
  addressTypeID: number;
  items: PreOrderShipmentItem[];
};

type TipoEntrega = "Envío a domicilio" | "Retiro en sucursal" | "Entrega mixta";
type Transportista = "Envío programado" | "Envío express" | "Moto inmediata";
type PickingPoint = "Punto de picking 1" | "Punto de picking 2" | "Punto de picking 3";

interface RangoFecha {
  from: Date;
  to: Date;
}

interface Entrega {
  tipoEntrega: TipoEntrega;
  direccion: string;
  transportista: Transportista;
  shippingCost: number;
  fecha: RangoFecha;
  pickupPoint?: string,
  productDeliveries: Array<{
    deliveryId: string;
    sku: string;
    deliveryQty: number | "";
    mode: "envio" | "retiro" | "mixta";
    addressTypeId: number | null;
    addressTypeName: string;
    shippingCost: number | "";
    branch: string;
    region: string;
    ciudad: string;
    calle: string;
    numero: string;
    referencia: string;
    mixedRetiroQty: number | "";
    mixedEnvioQty: number | "";
    fecha: { from: Date; to: Date } | null;
  }>;
}

// productos desde api
interface ProductsAPIResponse {
  page?: number;
  pageSize?: number;
  totalRecords?: number;
  totalPages?: number;
  data: any[]; // items vienen dentro de "data"
}

/* =================== Tipos para stock =================== */
type InventoryV2Response = {
  sku: string;
  nombre: string;
  u_imagen?: string;
  u_name?: string;
  createdate?: string;
  updatedate?: string;
  activo?: string;
  totalDisponible?: number;
  almacenes: StockApiItem[];
};

type StockApiItem = {
  sku?: string;
  id_almacen: number;
  nombre: string;
  ubicacion: string;
  status?: string;
  disponible: number;
  stock_fisico: number;
  en_nota_venta: number;
  en_orden_compra: number;
  units?: number; // <- opcional y lo rellenamos con disponible para compatibilidad
};
type InventoryResponse = { data: StockApiItem[] };

/* ===== Shape crudo del endpoint by-warehouse (igual al view de stock) ===== */
type StockByWarehouseApiRow = {
  warehouse: string;   // código/nombre de almacén
  Disponible: number;  // disponible
  OnHand: number;      // stock físico
  NV: number;          // en nota de venta
  OC: number;          // en orden de compra
};

type SellerPriceList = {
  id: number;
  name: string;
};

type SellerByUserResponse = {
  externalIds?: {
    sap?: string | number;
    idService?: number | string;
  };
};

export type CrearPedidoMode = "pedido" | "preventa";

interface CrearPedidoBaseViewProps {
  mode: CrearPedidoMode;
}


/* =============================================================== */

export default function CrearPedidoBaseView({ mode }: CrearPedidoBaseViewProps) {

  // token y x-plataforma-id
  const { token, user } = useAuth();
  const { fetchWithAuth } = useFetchWithAuth();
  const { fetchWithAuthQA } = useFetchWithAuthQA();
  const { fetchWithAuthInventory } = useFetchWithAuthInventory();

  // listado productos desde api
  const [catalogo, setCatalogo] = useState<Product[]>([]);

  // === error global ===
  const [globalError, setGlobalError] = useState<string[] | null>(null);

  // === estado de reintento ===
  const [retrying, setRetrying] = useState(false);
  const [submittingPreOrder, setSubmittingPreOrder] = useState(false);
  const [creditReviewRequired, setCreditReviewRequired] = useState(false);
  const [creditReviewMessage, setCreditReviewMessage] = useState<string | null>(null);
  const [searchPriceListNum, setSearchPriceListNum] = useState<number>(1);
  const [sellerSapId, setSellerSapId] = useState<number | null>(null);

  // agrega errores al estado global, acumulando los existentes
  const pushError = useCallback((msg: string) => {
    setGlobalError(prev => {
      if (!prev) return [msg];

      // evitar duplicados exactos
      if (prev.includes(msg)) return prev;

      return [...prev, msg];
    });
  }, []);

  // === carga de productos ===
  const mapProductRows = useCallback((rows: any[]): Product[] => {
    return rows.map((p: any) => ({
      sku: p.itemCode ?? p.ItemCode ?? p.SKU ?? p.sku ?? p.Code ?? "",
      name: p.descripcion ?? p.Name ?? p.ItemName ?? p.name ?? "",
      img: p.u_imagen ?? p.Image ?? p.image ?? "",
      price: Number(
        p.PriceIVA
        ?? p.Price
        ?? p.price
        ?? p?.precios?.[0]?.precioConIva
        ?? p?.precios?.[0]?.precio
        ?? 0
      ) || 0,
      itemCode: p.itemCode ?? p.ItemCode ?? p.SKU ?? p.sku ?? p.Code ?? "",
      itemName: p.descripcion ?? p.ItemName ?? p.Name ?? p.name ?? "",
    }));
  }, []);

  const fetchProducts = useCallback(async (query: string = "", listNum: number = 1) => {
    try {
      const url = new URL(CATALOG_PRODUCTS_LIST_API);
      url.searchParams.set("list", String(listNum));
      url.searchParams.set("q", query);

      const response = await fetch(url.toString(), {
        method: "GET",
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(`Error al cargar catálogo (${response.status})`);
      }

      const payload = await response.json();
      const rows = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.data)
          ? payload.data
          : Array.isArray(payload?.items)
            ? payload.items
            : Array.isArray(payload?.results)
              ? payload.results
              : [];

      const productos = mapProductRows(rows);

      setCatalogo(productos);
    } catch (error: unknown) {
      console.error("Error al cargar productos:", error);
      const payload = getErrorPayload(error);

      pushError(
        String(payload?.message ?? "").trim() ||
        getErrorMessage(error, "") ||
        "No se pudieron cargar los productos."
      );

      setCatalogo([]);
    }
  }, [mapProductRows, pushError]);

  useEffect(() => {
    fetchProducts("", searchPriceListNum);
  }, [fetchProducts, searchPriceListNum]);

  useEffect(() => {
    let mounted = true;
    const userId = Number(user?.id);

    if (!Number.isFinite(userId) || userId <= 0) {
      setSellerSapId(null);
      return () => {
        mounted = false;
      };
    }

    (async () => {
      try {
        const seller = await fetchWithAuth<SellerByUserResponse>(
          `${SELLER_BY_USER_URL}/${encodeURIComponent(String(userId))}`,
          { method: "GET" }
        );

        const parsedSap = Number(seller?.externalIds?.sap);
        if (!mounted) return;

        setSellerSapId(Number.isFinite(parsedSap) && parsedSap > 0 ? Math.floor(parsedSap) : null);
      } catch {
        if (!mounted) return;
        setSellerSapId(null);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [fetchWithAuth, user?.id]);

  //////////////////////////

  const router = useRouter();
  const isPreVentaMode = mode === "preventa";
  const [canal, setCanal] = useState("");
  const [items, setItems] = useState([{ sku: "", cantidad: 1 }]);
  const [metodo, setMetodo] = useState("");
  const [cliente, setCliente] = useState<Cliente>(emptyClient);


  const [currentItem, setCurrentItem] = useState<Product | null>(null);
  const [previewUnitPrice, setPreviewUnitPrice] = useState<number | null>(null);
  const [previewUnitPriceIVA, setPreviewUnitPriceIVA] = useState<number | null>(null);
  const [previewPriceLoading, setPreviewPriceLoading] = useState(false);
  const [previewPriceError, setPreviewPriceError] = useState<string | null>(null);

  const [itemsFlags, setItemsFlags] = useState<ItemsFlags>({
    picked: false,
    empty: false,
  });

  const [pedidoLines, setPedidoLines] = useState<PedidoLine[]>([]);

  const [quantity, setQuantity] = useState<number>(1);
  const [quantityDraft, setQuantityDraft] = useState<string>("1");
  const [subCriteria, setSubCriteria] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  // productos: búsqueda por SKU o nombre
  const [productSearch, setProductSearch] = useState("");
  const debouncedProductSearch = useDebounced(productSearch, 250);
  const [remoteItemCodeRows, setRemoteItemCodeRows] = useState<Product[]>([]);
  const [itemCodeLoading, setItemCodeLoading] = useState(false);
  const productsLoading =
    (productSearch.trim().length > 0 &&
      productSearch.trim() !== debouncedProductSearch.trim()) ||
    itemCodeLoading;

  useEffect(() => {
    let mounted = true;

    (async () => {
      const query = debouncedProductSearch.trim();
      if (!query) {
        if (mounted) setRemoteItemCodeRows([]);
        return;
      }

      try {
        setItemCodeLoading(true);

        const url = new URL(CATALOG_PRODUCTS_LIST_API);
        url.searchParams.set("list", String(searchPriceListNum));
        url.searchParams.set("q", query);

        const resp = await fetch(url.toString(), {
          method: "GET",
          cache: "no-store",
        });

        if (!resp.ok) {
          throw new Error(`HTTP ${resp.status} al buscar productos`);
        }

        const payload = await resp.json();
        const rows = Array.isArray(payload)
          ? payload
          : Array.isArray(payload?.data)
            ? payload.data
            : Array.isArray(payload?.items)
              ? payload.items
              : Array.isArray(payload?.results)
                ? payload.results
                : [];

        const parsed = mapProductRows(rows);

        if (mounted) setRemoteItemCodeRows(parsed);
      } catch (e) {
        if (mounted) setRemoteItemCodeRows([]);
      } finally {
        if (mounted) setItemCodeLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [debouncedProductSearch, mapProductRows, searchPriceListNum]);

  const searchableProducts = useMemo(() => {
    const q = debouncedProductSearch.trim().toLowerCase();
    const localMatches = q
      ? catalogo.filter((p) => {
        const itemName = String(p.itemName ?? p.name ?? "").toLowerCase();
        const itemCode = String(p.itemCode ?? p.sku ?? "").toLowerCase();
        return itemName.includes(q) || itemCode.includes(q);
      })
      : catalogo;

    const mergedBySku = new Map<string, Product>();
    remoteItemCodeRows.forEach((p) => {
      if (p?.sku) mergedBySku.set(p.sku, p);
    });
    localMatches.forEach((p) => {
      if (p?.sku && !mergedBySku.has(p.sku)) mergedBySku.set(p.sku, p);
    });

    return Array.from(mergedBySku.values());
  }, [catalogo, debouncedProductSearch, remoteItemCodeRows]);

  const productOptions = useMemo(() => {
    const base = searchableProducts;

    const opts = base.slice(0, 100).map((p) => ({
      label: `${p.sku} - ${p.name}`,
      value: p.sku,
      image: p.img || undefined,
    }));

    if (currentItem && !opts.some((o) => o.value === currentItem.sku)) {
      opts.unshift({
        label: `${currentItem.sku} - ${currentItem.name}`,
        value: currentItem.sku,
        image: currentItem.img || undefined,
      });
    }

    return [{ label: "Seleccione producto...", value: "" }, ...opts];
  }, [searchableProducts, currentItem]);

  const normalizedQuantity = useMemo(() => {
    const n = Number(quantityDraft);
    if (!Number.isFinite(n)) return 0;
    return Math.floor(n);
  }, [quantityDraft]);

  const livePreviewQuantity = useMemo(() => {
    const n = Number(quantityDraft);
    if (!Number.isFinite(n)) return 0;
    return Math.max(0, Math.floor(n));
  }, [quantityDraft]);

  // === CLIENTE: estados de selección (guardamos id para el Select y el label en tu estado existente) ===
  const [canalVentaId, setCanalVentaId] = useState<string>("");
  const [empresaId, setEmpresaId] = useState<string>("");
  const [clienteId, setClienteId] = useState<string>("");

  const [documentoTipo, setDocumentoTipo] = useState<"Boleta" | "Factura" | "">("");
  const [razonSocial, setRazonSocial] = useState<string>("");
  const [giroComercial, setGiroComercial] = useState<string>("");

  const documentoOptions = useMemo(
    () => [
      { label: "Seleccione documento…", value: "" },
      { label: "Boleta", value: "Boleta" },
      { label: "Factura", value: "Factura" },
    ],
    []
  );

  // === Opciones y búsquedas para SelectSearchInline ===
  type Opt = { label: string; value: string };

  const [channels, setChannels] = useState<Opt[]>([{ label: "Seleccione canal…", value: "" }]);
  const [channelsLoading, setChannelsLoading] = useState(false);
  const [channelSearch, setChannelSearch] = useState("");

  const [companies, setCompanies] = useState<Opt[]>([{ label: "Seleccione empresa…", value: "" }]);
  const [companiesLoading, setCompaniesLoading] = useState(false);
  const [companySearch, setCompanySearch] = useState("");

  const [customers, setCustomers] = useState<Opt[]>([{ label: "Seleccione cliente…", value: "" }]);
  const [customersLoading, setCustomersLoading] = useState(false);
  const [customerSearch, setCustomerSearch] = useState("");

  // Opciones fijas para "Tipo de venta" (con placeholder como primera opción)
  const tipoVentaOptions: Opt[] = useMemo(
    () => [
      { label: "Seleccione tipo de venta…", value: "" }, // <- el placeholder que verá SelectSearchInline
      { label: "Preventa", value: "preventa" },
      { label: "Cotización", value: "cotizacion" },
    ],
    []
  );

  // === Helpers de filtrado local (por si quieres filtrar además del server) ===
  const visibleChannels = useMemo(() => {
    const q = channelSearch.trim().toLowerCase();
    if (!q) return channels;
    return channels.filter(o => (o.label + " " + o.value).toLowerCase().includes(q));
  }, [channels, channelSearch]);

  const visibleCompanies = useMemo(() => {
    const q = companySearch.trim().toLowerCase();
    if (!q) return companies;
    return companies.filter(o => (o.label + " " + o.value).toLowerCase().includes(q));
  }, [companies, companySearch]);

  const visibleCustomers = useMemo(() => {
    const q = customerSearch.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter(o => (o.label + " " + o.value).toLowerCase().includes(q));
  }, [customers, customerSearch]);

  // === Carga inicial de Canales de venta (fetch-with-auth) ===
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setChannelsLoading(true);
        const resp = await fetch(COMMERCE_SERVICE_SALES_CHANNELS_SIMPLE_API, {
          method: "GET",
          cache: "no-store",
        });

        if (!resp.ok) {
          throw new Error(`HTTP ${resp.status} al cargar canales de venta`);
        }

        const res = await resp.json();
        const rows = Array.isArray(res?.data) ? res.data : [];
        const opts: Opt[] = [{ label: "Seleccione canal…", value: "" }, ...rows.map((r: any) => ({
          label: String(r?.name ?? r?.Name ?? r?.referenceId ?? "Canal sin nombre"),
          value: String(r?.referenceId ?? r?.ReferenceId ?? r?.id ?? r?.Id ?? ""),
        }))];
        if (mounted) setChannels(opts);
      } catch (error: unknown) {
        console.error("Error cargando canales:", error);
        pushError(
          typeof getErrorMessage(error, "") === "string" && getErrorMessage(error, "")
            ? getErrorMessage(error, "")
            : "No se pudieron cargar los canales de venta."
        );
        if (mounted) setChannels([{ label: "Seleccione canal…", value: "" }]);
      }
      finally {
        if (mounted) setChannelsLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // === Carga inicial de Empresas (fetch-with-auth) ===
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setCompaniesLoading(true);
        const res = await fetchWithAuth<any>("comerce-service/company");
        const rows = Array.isArray(res?.data) ? res.data : [];
        const opts: Opt[] = [{ label: "Seleccione empresa…", value: "" }, ...rows.map((c: any) => ({
          label: String(c?.BusinessName ?? c?.LegalName ?? `#${c?.Id ?? ""}`),
          value: String(c?.Id ?? ""),
        }))];
        if (mounted) setCompanies(opts);
      } catch (error: unknown) {
        console.error("Error cargando empresas:", error);
        const payload = getErrorPayload(error);
        const msg =
          String(payload?.message ?? "").trim() ||
          getErrorMessage(error, "") ||
          "No se pudieron cargar las empresas.";
        pushError(msg);
        if (mounted) setCompanies([{ label: "Seleccione empresa…", value: "" }]);
      }
      finally {
        if (mounted) setCompaniesLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [fetchWithAuth]);

  // === Búsqueda de Clientes (server-side con /customers?q=...) ===
  const customerQuery = useDebounced(customerSearch, 600);
  const lastCustomerErrorQueryRef = useRef<string>("");

  // Helper para construir etiqueta visible de un customer
  const labelFrom = (c: any) => {
    const cardName = String(c?.CardName ?? c?.cardName ?? c?.Name ?? c?.name ?? c?.RazonSocial ?? c?.razonSocial ?? "").trim();
    const fallbackName = String(
      c?.FullName ??
      c?.fullName ??
      `${String(c?.FirstName ?? c?.firstName ?? "")} ${String(c?.LastName ?? c?.lastName ?? "")}`
    ).trim();
    const email = String(c?.Email ?? c?.email ?? "").trim();
    const code = String(c?.CardCode ?? c?.cardCode ?? c?.Id ?? c?.id ?? "").trim();

    const base = cardName || fallbackName || code || "Cliente sin nombre";
    return `${base}${email ? " — " + email : ""}`.trim();
  };

  const normalizeSearch = (value: string) =>
    String(value || "")
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");

  const customerMatchesSearch = useCallback((c: any, query: string) => {
    const q = normalizeSearch(query);
    if (!q) return true;

    const rut = normalizeSearch(c?.RUT ?? c?.Rut ?? "");
    const cardName = normalizeSearch(c?.CardName ?? "");
    const fullName = normalizeSearch(`${c?.FirstName ?? ""} ${c?.LastName ?? ""}`);
    const id = normalizeSearch(c?.Id ?? "");

    return rut.includes(q) || cardName.includes(q) || fullName.includes(q) || id.includes(q);
  }, []);

  // Mantiene la opción actualmente seleccionada en la lista para que NO se "desaparezca"
  function ensureSelectedOnTop(opts: { label: string; value: string }[]) {
    if (!clienteId) return opts;
    if (opts.some(o => o.value === clienteId)) return opts;
    const sel = customersMap[clienteId];
    const safeLabel = labelFrom(sel) || (cliente?.Cliente ?? "");
    if (!safeLabel) return opts;
    return [{ label: safeLabel, value: clienteId }, ...opts];
  }

  useEffect(() => {
    let mounted = true;
    const controller = new AbortController();
    (async () => {
      try {
        const query = customerQuery.trim();

        if (query.length === 0) {
          if (mounted) {
            setCustomers([{ label: "Seleccione cliente…", value: "" }, ...ensureSelectedOnTop([])]);
            setCustomersLoading(false);
          }
          return;
        }

        // Evita golpear el endpoint con términos demasiado cortos.
        if (query.length < 3) {
          if (mounted) {
            setCustomers([{ label: "Seleccione cliente…", value: "" }, ...ensureSelectedOnTop([])]);
            setCustomersLoading(false);
          }
          return;
        }

        setCustomersLoading(true);

        let items: CustomerDTO[] = [];

        // Búsqueda unificada: solo endpoint /customers/find por RUT.
        const url = new URL(CUSTOMERS_FIND_API);
        url.searchParams.set("rut", query);
        url.searchParams.set("partnerType", "C");

        const resp = await fetch(url.toString(), { method: "GET", signal: controller.signal });
        if (!resp.ok) {
          throw new Error(`HTTP ${resp.status} al buscar clientes por RUT`);
        }

        const json = await resp.json();
        items = Array.isArray(json)
          ? json
          : Array.isArray(json?.data)
            ? json.data
            : Array.isArray(json?.items)
              ? json.items
              : json && typeof json === "object"
                ? [json]
                : [];

        // validación local explícita por RUT y CardName
        const filteredItems = query
          ? items.filter((c) => customerMatchesSearch(c, query))
          : items;

        // map opciones
        const baseOpts = filteredItems
          .map((c) => {
            const value = String((c as any)?.Id ?? (c as any)?.id ?? (c as any)?.CardCode ?? (c as any)?.cardCode ?? "").trim();
            return {
              label: labelFrom(c),
              value,
            };
          })
          .filter((o) => Boolean(o.value));

        // asegura el seleccionado actual en el tope (si no vino en la respuesta)
        const opts = [{ label: "Seleccione cliente…", value: "" }, ...ensureSelectedOnTop(baseOpts)];
        if (mounted) setCustomers(opts);

        // refresca el mapa (Id -> datos básicos + ListNum) con lo que llegó
        // mantenemos lo ya conocido para no perder el seleccionado
        const nextMap = { ...customersMap };
        filteredItems.forEach((c) => {
          const customerId = String((c as any)?.Id ?? (c as any)?.id ?? (c as any)?.CardCode ?? (c as any)?.cardCode ?? "").trim();
          if (!customerId) return;

          const rawListNum = (c as any)?.ListNum ?? (c as any)?.listNum ?? null;
          const parsedListNum = rawListNum == null ? null : Number(rawListNum);
          const rawGroupNum = (c as any)?.GroupNum ?? (c as any)?.groupNum ?? null;
          const parsedGroupNum = rawGroupNum == null ? null : Number(rawGroupNum);
          const rawCreditLimit =
            (c as any)?.CreditLimit ??
            (c as any)?.creditLimit ??
            (c as any)?.credit_limit ??
            null;
          const parsedCreditLimit = rawCreditLimit == null ? null : Number(rawCreditLimit);
          const rawCreditUsed =
            (c as any)?.CreditUsed ??
            (c as any)?.creditUsed ??
            (c as any)?.CreditUtilized ??
            (c as any)?.creditUtilized ??
            (c as any)?.CreditConsumed ??
            (c as any)?.creditConsumed ??
            null;
          const parsedCreditUsed = rawCreditUsed == null ? null : Number(rawCreditUsed);

          nextMap[customerId] = {
            Id: customerId,
            CardCode: String((c as any)?.CardCode ?? (c as any)?.cardCode ?? customerId),
            Rut: String(
              (c as any)?.RUT ??
              (c as any)?.Rut ??
              (c as any)?.rut ??
              (c as any)?.TaxId ??
              (c as any)?.taxId ??
              (c as any)?.Document ??
              (c as any)?.document ??
              ""
            ).trim(),
            Phone: String(
              (c as any)?.Phone ??
              (c as any)?.phone ??
              (c as any)?.Telefono ??
              (c as any)?.telefono ??
              (c as any)?.CellPhone ??
              (c as any)?.cellPhone ??
              (c as any)?.Mobile ??
              (c as any)?.mobile ??
              ""
            ).trim(),
            FirstName: (c as any)?.FirstName ?? (c as any)?.firstName,
            LastName: (c as any)?.LastName ?? (c as any)?.lastName,
            CardName: (c as any)?.CardName ?? (c as any)?.cardName ?? (c as any)?.Name ?? (c as any)?.name,
            Notes: String((c as any)?.Notes ?? (c as any)?.notes ?? "").trim(),
            Email: (c as any)?.Email ?? (c as any)?.email ?? undefined,
            ListNum: Number.isFinite(parsedListNum as number) ? parsedListNum : null,
            GroupNum: Number.isFinite(parsedGroupNum as number) ? parsedGroupNum : null,
            CreditLimit: Number.isFinite(parsedCreditLimit as number) ? parsedCreditLimit : null,
            CreditUsed: Number.isFinite(parsedCreditUsed as number) ? parsedCreditUsed : null,
          };
        });
        if (mounted) setCustomersMap(nextMap);
        lastCustomerErrorQueryRef.current = "";
      } catch (error: unknown) {
        if (isAbortError(error)) return;

        if (lastCustomerErrorQueryRef.current !== customerQuery) {
          console.error("Error buscando clientes:", error);
          pushError("No se pudieron cargar los clientes.");
          lastCustomerErrorQueryRef.current = customerQuery;
        }

        if (mounted) setCustomers([{ label: "Seleccione cliente…", value: "" }]);
      } finally {
        if (mounted) setCustomersLoading(false);
      }
    })();
    return () => {
      mounted = false;
      controller.abort();
    };
  }, [customerQuery, customerMatchesSearch]); // recarga sólo al cambiar la búsqueda


  /* =================== Estado para modal de stock =================== */
  const [stockOpen, setStockOpen] = useState(false);
  const [stockRows, setStockRows] = useState<StockApiItem[]>([]);
  const [stockLoading, setStockLoading] = useState(false);
  const [stockError, setStockError] = useState<string | null>(null);
  /* ======================================================================== */

  // === estado para usar StockModal ===
  const [isStockOpen, setIsStockOpen] = useState(false);
  const [skuActual, setSkuActual] = useState<string>("");

  const [entrega, setEntrega] = useState<Entrega>({
    tipoEntrega: "Envío a domicilio",
    direccion: "",
    transportista: "Envío programado",
    shippingCost: 0,
    fecha: {
      from: new Date(),
      to: new Date(),
    },
    pickupPoint: "",
    productDeliveries: [],
  });

  ////////////////////// Carga de stock usando fetchWithAuth 
  // const fetchStock = useCallback(
  //   async (sku: string) => {
  //     setStockLoading(true);
  //     setStockError(null);
  //     try {
  //       const res = await inventoryStockByWarehouse({ sku }); // StockByWarehouseItem[]

  //       // Adaptación al shape que tu estado espera (StockApiItem)
  //       const rows = (Array.isArray(res) ? res : []).map((r: StockByWarehouseItem) => ({
  //         id_almacen: Number(r.warehouse),      // Convertimos a número para cumplir con el tipo
  //         nombre: r.warehouse,                  // no hay "nombre" †’ mostramos el código
  //         ubicacion: "—",                       // el endpoint no trae ubicación
  //         disponible: r.Disponible ?? 0,
  //         units: r.Disponible ?? 0,             // por compatibilidad con tu render antiguo
  //         stock_fisico: r.OnHand ?? 0,
  //         en_nota_venta: r.NV ?? 0,
  //         en_orden_compra: r.OC ?? 0,
  //         // puedes guardar updatedAt si tu tipo lo permite:
  //         // updatedAt: r.updatedAt,
  //       }));

  //       setStockRows(rows);
  //     } catch (error: unknown) {
  //       setStockRows([]);

  //       // Mensaje más claro para el caso típico de CORS / contenido mixto
  //       const raw = (e?.message ?? "").toString();
  //       const friendly =
  //         raw === "Failed to fetch"
  //           ? "No se pudo obtener el stock. Posible bloqueo del navegador (CORS o contenido mixto HTTP/HTTPS)."
  //           : "No se pudo obtener el stock. " + raw;

  //       setStockError(friendly);
  //     } finally {

  //       setStockLoading(false);
  //     }
  //   },
  //   []
  // );

  // === Stock modal: llamada directa al endpoint by-warehouse ===
  const fetchStock = useCallback(
    async (sku: string) => {
      setStockLoading(true);
      setStockError(null);
      try {
        // MISMA llamada que en el view de stock
        const url = `${URL_INVENTORY_STOCK}/stock/by-warehouse?sku=${encodeURIComponent(
          sku
        )}`;
        const resp = await fetch(url, { method: "GET" });

        if (!resp.ok) {
          // status != 2xx
          throw new Error(`HTTP ${resp.status} al consultar stock`);
        }

        const data: StockByWarehouseApiRow[] = await resp.json();

        // Adaptamos al shape que ya usa el modal y ORDENAMOS POR ALMACÁ‰N
        const rows: StockApiItem[] = (Array.isArray(data) ? data : [])
          .map((r) => ({
            id_almacen: Number.isFinite(Number(r.warehouse))
              ? Number(r.warehouse)
              : NaN,                     // si tu UI no usa el número, no afecta
            nombre: r.warehouse || "—",  // mostramos el código/alias
            ubicacion: "—",
            disponible: r.Disponible ?? 0,
            units: r.Disponible ?? 0,    // por compatibilidad con tu render
            stock_fisico: r.OnHand ?? 0,
            en_nota_venta: r.NV ?? 0,
            en_orden_compra: r.OC ?? 0,
          }))
          .sort((a, b) => String(a.nombre).localeCompare(String(b.nombre), "es"));

        setStockRows(rows);
      } catch (error: unknown) {
        console.error("Error obteniendo stock:", error);
        pushError(
          getErrorMessage(error, "No se pudo obtener el stock del producto.")
        );
        setStockRows([]);
      }
      finally {
        setStockLoading(false);
      }
    },
    []
  );

  // para mostrar el modal de stock 
  function handleMostrarStock() {
    if (!currentItem?.sku) return;

    // Abrimos el modal; la consulta de stock ocurre dentro de StockModal
    setSkuActual(currentItem.sku);
    setIsStockOpen(true);
  }

  //////////////////////

  // --- Pagos ---
  type Pago = { metodo: string; importe: number };
  const [pagos, setPagos] = useState<Pago[]>([]);
  const [pagoMetodo, setPagoMetodo] = useState<string>("Efectivo");
  const [pagoImporte, setPagoImporte] = useState<number>(0);

  // ====== NAV / WIZARD ======
  const [clienteGateLocked, setClienteGateLocked] = useState(true);
  const [itemsGateLocked, setItemsGateLocked] = useState(true);
  const [pagosGateLocked, setPagosGateLocked] = useState(true);

  const [itemsExpanded, setItemsExpanded] = useState(false);
  const [entregaExpanded, setEntregaExpanded] = useState(false);
  const [pagosExpanded, setPagosExpanded] = useState(false);
  const [clienteExpanded, setClienteExpanded] = useState(true);

  // --- DESARROLLO: quitar candados temporalmente ---
  const DEV_BYPASS_GATES = true; // se pone en false cuando termina el desarrollo 

  // ====== CLIENTE / LISTA DE PRECIOS ======
  // Mapa de clientes (Id -> datos básicos, incluyendo ListNum)
  type CustomerLite = {
    Id: string;
    CardCode?: string;
    Rut?: string;
    Phone?: string;
    FirstName?: string;
    LastName?: string;
    CardName?: string;
    Notes?: string;
    Email?: string;
    ListNum?: number | null;
    GroupNum?: number | null;
    CreditLimit?: number | null;
    CreditUsed?: number | null;
  };
  const [customersMap, setCustomersMap] = useState<Record<string, CustomerLite>>({});
  const [customerListNum, setCustomerListNum] = useState<number | null>(null);
  const [customerGroupNum, setCustomerGroupNum] = useState<number | null>(null);
  const [customerCreditLimit, setCustomerCreditLimit] = useState<number | null>(null);
  const [customerCreditUsed, setCustomerCreditUsed] = useState<number | null>(null);
  const [customerAvailableCredit, setCustomerAvailableCredit] = useState<number | null>(null);
  const [loadingCustomerAvailableCredit, setLoadingCustomerAvailableCredit] = useState(false);
  const [customerAvailableCreditMessage, setCustomerAvailableCreditMessage] = useState<string | null>(null);
  const [customerHasCreditLine, setCustomerHasCreditLine] = useState<boolean | null>(null);
  const [sellerAllowedPriceLists, setSellerAllowedPriceLists] = useState<SellerPriceList[] | null>(null);
  const [loadingSellerPriceLists, setLoadingSellerPriceLists] = useState(false);
  const [selectedPriceListBySku, setSelectedPriceListBySku] = useState<Record<string, number | null>>({});

  // Para manejar selección pendiente cuando hay carrito y cambia el cliente
  const [pendingClient, setPendingClient] = useState<{
    id: string;
    label: string;
    cardName: string;
    notes: string;
    listNum: number | null;
    groupNum: number | null;
    creditLimit: number | null;
    creditUsed: number | null;
  } | null>(null);

  // ====== CARRITO / PRECIOS ======
  type CartLine = {
    sku: string;
    name: string;
    img?: string;
    cantidad: number;
    priceListNum: number | null;
    price: number;     // unitario SIN IVA
    priceIVA: number;  // unitario CON IVA
    stock: number;
    priceError?: string | null; // marca líneas con error de precio
  };
  const [cart, setCart] = useState<CartLine[]>([]);
  const [qtyDraft, setQtyDraft] = useState<Record<string, string>>({});

  useEffect(() => {
    let mounted = true;
    const userId = String(user?.id || "").trim();
    if (!userId) {
      setSellerAllowedPriceLists(null);
      return () => {
        mounted = false;
      };
    }

    (async () => {
      try {
        setLoadingSellerPriceLists(true);
        const payload = await fetchWithAuth<any>(`oms-service/orders/sellers/user/${encodeURIComponent(userId)}/price-lists`, {
          method: "GET",
        });

        const rawPriceLists = Array.isArray(payload?.data?.priceLists)
          ? payload.data.priceLists
          : [];

        const lists: SellerPriceList[] = rawPriceLists
          .map((pl: { id?: string | number; name?: string }) => {
            const parsedId = Number(pl?.id);
            if (!Number.isFinite(parsedId) || parsedId <= 0) return null;
            return {
              id: Math.floor(parsedId),
              name: String(pl?.name || `PriceList ${parsedId}`),
            };
          })
          .filter((pl: SellerPriceList | null): pl is SellerPriceList => Boolean(pl));

        if (mounted) {
          setSellerAllowedPriceLists(lists.length > 0 ? lists : null);
        }
      } catch {
        if (mounted) {
          setSellerAllowedPriceLists(null);
        }
      } finally {
        if (mounted) setLoadingSellerPriceLists(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [fetchWithAuth, user?.id]);

  const itemPriceListOptions = useMemo<Opt[]>(() => {
    const sellerLists = Array.isArray(sellerAllowedPriceLists) ? sellerAllowedPriceLists : [];

    if (sellerLists.length > 0) {
      return [
        { label: "Seleccione PriceList…", value: "" },
        ...sellerLists.map((list) => ({
          label: list.name,
          value: String(list.id),
        })),
      ];
    }

    if (typeof customerListNum === "number" && !Number.isNaN(customerListNum)) {
      return [
        { label: "Seleccione PriceList…", value: "" },
        { label: `PriceList ${customerListNum}`, value: String(customerListNum) },
      ];
    }

    return [{ label: "Seleccione PriceList…", value: "" }];
  }, [sellerAllowedPriceLists, customerListNum]);

  const defaultPriceListNum = useMemo(() => {
    const sellerListIds = Array.isArray(sellerAllowedPriceLists)
      ? sellerAllowedPriceLists.map((list) => list.id)
      : [];

    if (sellerListIds.length > 0) {
      if (typeof customerListNum === "number" && sellerListIds.includes(customerListNum)) {
        return customerListNum;
      }
      return sellerListIds[0];
    }

    if (typeof customerListNum === "number" && !Number.isNaN(customerListNum)) {
      return customerListNum;
    }

    return null;
  }, [sellerAllowedPriceLists, customerListNum]);

  const currentPriceListNum = useMemo(() => {
    if (!currentItem?.sku) return null;
    const selected = selectedPriceListBySku[currentItem.sku];
    if (typeof selected === "number" && !Number.isNaN(selected)) return selected;
    return defaultPriceListNum;
  }, [currentItem?.sku, selectedPriceListBySku, defaultPriceListNum]);

  useEffect(() => {
    if (typeof currentPriceListNum === "number" && !Number.isNaN(currentPriceListNum)) {
      setSearchPriceListNum(currentPriceListNum);
      return;
    }

    if (typeof defaultPriceListNum === "number" && !Number.isNaN(defaultPriceListNum)) {
      setSearchPriceListNum(defaultPriceListNum);
    }
  }, [currentPriceListNum, defaultPriceListNum]);

  useEffect(() => {
    if (!currentItem?.sku) return;
    if (selectedPriceListBySku[currentItem.sku] != null) return;
    if (defaultPriceListNum == null) return;

    setSelectedPriceListBySku((prev) => ({
      ...prev,
      [currentItem.sku]: defaultPriceListNum,
    }));
  }, [currentItem?.sku, selectedPriceListBySku, defaultPriceListNum]);

  useEffect(() => {
    if (!currentItem?.sku || currentPriceListNum == null) {
      setPreviewUnitPrice(null);
      setPreviewUnitPriceIVA(null);
      setPreviewPriceLoading(false);
      setPreviewPriceError(null);
      return;
    }

    const controller = new AbortController();
    let mounted = true;

    (async () => {
      try {
        setPreviewPriceLoading(true);
        setPreviewPriceError(null);

        const res = await fetchWithAuth<any>(
          `catalog/listprices/${encodeURIComponent(currentItem.sku)}/${encodeURIComponent(String(currentPriceListNum))}`,
          { signal: controller.signal }
        );

        if (!mounted) return;
        setPreviewUnitPrice(Number(res?.Price) || 0);
        setPreviewUnitPriceIVA(Number(res?.PriceIVA) || 0);
      } catch (error: unknown) {
        if (!mounted || isAbortError(error)) return;
        setPreviewUnitPrice(null);
        setPreviewUnitPriceIVA(null);
        setPreviewPriceError(getErrorMessage(error, "No se pudo obtener el precio de la PriceList."));
      } finally {
        if (mounted) setPreviewPriceLoading(false);
      }
    })();

    return () => {
      mounted = false;
      controller.abort();
    };
  }, [currentItem?.sku, currentPriceListNum, fetchWithAuth]);

  const previewPriceToShow = previewUnitPriceIVA ?? Number(currentItem?.price || 0);
  const previewTaxPct = useMemo(() => {
    if (typeof previewUnitPrice === "number" && previewUnitPrice > 0 && typeof previewUnitPriceIVA === "number") {
      return Math.max(0, Math.round(((previewUnitPriceIVA / previewUnitPrice) - 1) * 100));
    }
    return 19;
  }, [previewUnitPrice, previewUnitPriceIVA]);

  useEffect(() => {
    if (documentoTipo !== "Factura") return;

    const selected = customersMap[clienteId || ""];
    const cardName = String(selected?.CardName || "").trim();
    const notes = String(selected?.Notes || "").trim();
    if (cardName) {
      setRazonSocial(cardName);
    }
    setGiroComercial(notes);
  }, [documentoTipo, clienteId, customersMap]);

  useEffect(() => {
    const selected = customersMap[clienteId || ""];
    const cardCode = String(selected?.CardCode || "").trim();

    if (!cardCode) {
      setCustomerAvailableCredit(null);
      setCustomerHasCreditLine(null);
      setCustomerAvailableCreditMessage(null);
      setLoadingCustomerAvailableCredit(false);
      return;
    }

    let mounted = true;
    const controller = new AbortController();

    (async () => {
      try {
        setCustomerHasCreditLine(null);
        setCustomerAvailableCredit(null);
        setLoadingCustomerAvailableCredit(true);
        setCustomerAvailableCreditMessage(null);

        const res = await fetchWithAuth<{
          creditId?: string;
          hasCreditLine?: boolean;
          availableAmount?: number;
          message?: string;
        }>(
          `customer-credit/credits/available?cardCode=${encodeURIComponent(cardCode)}`,
          { method: "GET", signal: controller.signal }
        );

        if (!mounted) return;

        setCustomerHasCreditLine(Boolean(res?.hasCreditLine));
        setCustomerAvailableCredit(
          typeof res?.availableAmount === "number" && Number.isFinite(res.availableAmount)
            ? res.availableAmount
            : 0
        );
        setCustomerAvailableCreditMessage(res?.message || null);
      } catch (error: unknown) {
        if (!mounted || isAbortError(error)) return;
        setCustomerAvailableCredit(null);
        setCustomerHasCreditLine(null);
        setCustomerAvailableCreditMessage("No se pudo obtener el credito disponible.");
      } finally {
        if (mounted) setLoadingCustomerAvailableCredit(false);
      }
    })();

    return () => {
      mounted = false;
      controller.abort();
    };
  }, [clienteId, customersMap, fetchWithAuth]);

  const subtotalSinIVA = useMemo(() => cart.reduce((acc, l) => acc + l.price * l.cantidad, 0), [cart]);
  const subtotalConIVA = useMemo(() => cart.reduce((acc, l) => acc + l.priceIVA * l.cantidad, 0), [cart]);
  const impuestos = useMemo(() => Math.max(0, subtotalConIVA - subtotalSinIVA), [subtotalConIVA, subtotalSinIVA]);
  useEffect(() => {
    setCreditReviewRequired(false);
    setCreditReviewMessage(null);
  }, [pagoMetodo, subtotalConIVA, clienteId]);

  const totalEnvios = useMemo(() => {
    const rows = Array.isArray(entrega?.productDeliveries) ? entrega.productDeliveries : [];

    return rows.reduce((acc, row) => {
      const cost = Number(row?.shippingCost);
      if (!Number.isFinite(cost) || cost <= 0) return acc;

      // Retiro puro no suma costo de envio.
      if (row?.mode === "retiro") return acc;

      // En modo mixto, solo considerar costo si hay cantidad de envio.
      if (row?.mode === "mixta") {
        const envioQty = Number(row?.mixedEnvioQty) || 0;
        if (envioQty <= 0) return acc;
      }

      return acc + cost;
    }, 0);
  }, [entrega]);

  const getHomeAddressKey = useCallback((row: Entrega["productDeliveries"][number]) => {
    const normalize = (value: string) => String(value || "").trim().toLowerCase();
    return [
      normalize(row.region),
      normalize(row.ciudad),
      normalize(row.calle),
      normalize(row.numero),
      normalize(row.referencia),
    ].join("|");
  }, []);

  // ====== VALIDACIONES DE PASOS ======
  // 1) Cliente: Canal + Empresa + Cliente + que el Cliente tenga ListNum válido
  const isClienteCompleto = useMemo(() => {
    const hasBasics =
      Boolean(documentoTipo) &&
      Boolean(cliente?.CanalVenta) &&
      Boolean(cliente?.Cliente);

    // En pre-venta no bloqueamos por ListNum del cliente; se usa PriceList de caja.
    const listOk = isPreVentaMode
      ? true
      : typeof customerListNum === "number" && !Number.isNaN(customerListNum);

    const razonOk =
      documentoTipo === "Factura"
        ? Boolean(razonSocial.trim())
        : true;

    const giroOk =
      documentoTipo === "Factura"
        ? Boolean(giroComercial.trim())
        : true;

    return hasBasics && listOk && razonOk && giroOk;
  }, [documentoTipo, cliente, customerListNum, razonSocial, giroComercial, isPreVentaMode]);

  // 2) Átems: hay monto y ninguna línea con error de precio
  const isItemsCompleto = useMemo(() => {
    const noPriceErrors = cart.every(l => !l.priceError);
    return subtotalConIVA > 0 && noPriceErrors;
  }, [cart, subtotalConIVA]);

  // 3) Entrega: validación completa + detalle de motivos de bloqueo
  const entregaValidationErrors = useMemo(() => {
    const errors: string[] = [];
    const deliveryByProduct = Array.isArray(entrega?.productDeliveries) ? entrega.productDeliveries : [];

    if (cart.length === 0) {
      errors.push("No hay productos en el carrito para configurar entrega.");
      return errors;
    }

    cart.forEach((line) => {
      const skuLabel = `${line.name} (SKU ${line.sku})`;
      const rows = deliveryByProduct.filter((r) => r.sku === line.sku);

      if (rows.length === 0) {
        errors.push(`Falta asignar entrega para ${skuLabel}.`);
        return;
      }

      const totalQty = rows.reduce((acc, row) => acc + (Number(row.deliveryQty) || 0), 0);
      if (totalQty !== line.cantidad) {
        errors.push(`La suma de cantidades de entrega de ${skuLabel} debe ser ${line.cantidad} (actual: ${totalQty}).`);
      }

      rows.forEach((row, index) => {
        const rowLabel = `${skuLabel} (fila ${index + 1})`;
        const rowQty = Number(row.deliveryQty);

        if (!(Number.isFinite(rowQty) && rowQty > 0)) {
          errors.push(`Cantidad de entrega inválida en ${rowLabel}.`);
        }

        if (!(typeof row.addressTypeId === "number" && row.addressTypeId > 0)) {
          errors.push(`Falta tipo de dirección en ${rowLabel}.`);
        }

        const hasFecha =
          row.fecha?.from instanceof Date &&
          !isNaN(row.fecha.from.getTime()) &&
          row.fecha?.to instanceof Date &&
          !isNaN(row.fecha.to.getTime());
        if (!hasFecha) {
          errors.push(`Falta rango de fecha válido en ${rowLabel}.`);
        }

        if (row.mode === "retiro") {
          if (!Boolean((row.branch || "").trim())) {
            errors.push(`Falta sucursal de retiro en ${rowLabel}.`);
          }
          return;
        }

        const hasShippingCost =
          row.shippingCost !== "" &&
          Number.isFinite(Number(row.shippingCost)) &&
          Number(row.shippingCost) >= 0;

        if (row.mode === "mixta") {
          const retiroQty = Number(row.mixedRetiroQty) || 0;
          const envioQty = Number(row.mixedEnvioQty) || 0;
          const mixedQtyOk = retiroQty > 0 && envioQty > 0 && retiroQty + envioQty === rowQty;
          if (!mixedQtyOk) {
            errors.push(`En modo mixto, retiro+envio debe coincidir con la cantidad en ${rowLabel}.`);
          }
          if (!Boolean((row.branch || "").trim())) {
            errors.push(`Falta sucursal de retiro en ${rowLabel}.`);
          }
        }

        if (!hasShippingCost) {
          errors.push(`Costo de envío inválido en ${rowLabel}.`);
        }

        const hasAddressFields =
          Boolean((row.region || "").trim()) &&
          Boolean((row.ciudad || "").trim()) &&
          Boolean((row.calle || "").trim()) &&
          Boolean((row.numero || "").trim()) &&
          Boolean((row.referencia || "").trim());
        if (!hasAddressFields) {
          errors.push(`Faltan datos de dirección (región, ciudad, calle, número o referencia) en ${rowLabel}.`);
        }
      });
    });

    const homeDeliveryRows = deliveryByProduct.filter((row) => {
      if (row.mode === "envio") return (Number(row.deliveryQty) || 0) > 0;
      if (row.mode === "mixta") return (Number(row.mixedEnvioQty) || 0) > 0;
      return false;
    });

    if (homeDeliveryRows.length > 1) {
      const uniqueAddresses = new Set(homeDeliveryRows.map(getHomeAddressKey));
      if (uniqueAddresses.size > 1) {
        errors.push("Si hay múltiples entregas a domicilio, todas deben usar una única dirección.");
      }
    }

    return Array.from(new Set(errors));
  }, [entrega, cart, getHomeAddressKey]);

  const isEntregaCompleto = entregaValidationErrors.length === 0;

  // 4) Pagos (usa tu lógica previa de pagos / total)
  const totalPagos = useMemo(() => pagos.reduce((acc, p) => acc + (Number(p.importe) || 0), 0), [pagos]);
  const isAgriculturalOrder = useMemo(
    () => cart.some((l) => /agri|agricola|agricol|cosecha/i.test(String(l.name ?? ""))),
    [cart]
  );
  const isPagosCompleto = useMemo(() => {
    if (isPreVentaMode) {
      return Boolean(String(pagoMetodo || "").trim());
    }

    const cadaPagoValido =
      pagos.length > 0 && pagos.every((p) => String(p.metodo || "").trim() !== "" && Number(p.importe) > 0);
    const cubreTotal = totalPagos >= subtotalConIVA;
    return cadaPagoValido && cubreTotal;
  }, [isPreVentaMode, pagoMetodo, pagos, totalPagos, subtotalConIVA]);

  // Recalcula precios para TODAS las líneas del carrito con la lista indicada.
  // Marca priceError por SKU si falla, sin romper el resto.
  const repriceCartForList = useCallback(async (listNum: number) => {
    const tasks = cart.map(async (l) => {
      try {
        const res = await fetchWithAuth<any>(
          `catalog/listprices/${encodeURIComponent(l.sku)}/${encodeURIComponent(String(listNum))}`
        ); // token + x-plataforma-id centralizados :contentReference[oaicite:3]{index=3}
        const price = Number(res?.Price) || 0;
        const priceIVA = Number(res?.PriceIVA) || 0;
        return { ...l, priceListNum: listNum, price, priceIVA, priceError: null };
      } catch (error: unknown) {
        return { ...l, priceError: getErrorMessage(error, "Sin precio para la nueva lista") };
      }
    });

    const result = await Promise.all(tasks);
    setCart(result);
  }, [cart, fetchWithAuth]);

  // === Scroll a siguiente apartado ===
  // Anclas
  const itemsRef = useRef<HTMLDivElement>(null);
  const entregaRef = useRef<HTMLDivElement>(null);
  const pagosRef = useRef<HTMLDivElement>(null);

  // Scroll helper
  const headerOffset = 72; // ajusta si tu header fijo mide distinto
  function scrollToAnchor(ref: React.RefObject<HTMLDivElement>) {
    const el = ref.current;
    if (!el) return;
    const y = el.getBoundingClientRect().top + window.pageYOffset - headerOffset - 8;
    window.scrollTo({ top: y, behavior: "smooth" });
  }

  // modal para crear clientes 
  const [upsertOpen, setUpsertOpen] = useState(false);
  const [upsertMode, setUpsertMode] = useState<"create" | "edit">("create");
  const [editCustomerId, setEditCustomerId] = useState<string | undefined>(undefined);

  /* helpers */
  const addItem = () => setItems((prev) => [...prev, { sku: "", cantidad: 1 }]);

  const handleItemChange = (idx: number, key: "sku" | "cantidad", value: any) =>
    setItems((p) =>
      p.map((it, i) => (i === idx ? { ...it, [key]: value } : it))
    );

  const handleGuardar = () => {
    router.push(isPreVentaMode ? "/pedidos/pre-venta" : "/pedidos/listado-pedidos");
  };

  const handleCancelar = () => {
    router.push(isPreVentaMode ? "/pedidos/pre-venta" : "/pedidos/listado-pedidos");
  };

  const buildPreOrderShipments = useCallback((): PreOrderShipment[] => {
    const rows = Array.isArray(entrega?.productDeliveries) ? entrega.productDeliveries : [];
    type ShipmentPart = {
      key: string;
      kind: "envio" | "retiro";
      row: Entrega["productDeliveries"][number];
      quantity: number;
      addressTypeID: number;
    };

    const parts: ShipmentPart[] = [];

    rows.forEach((row) => {
      const deliveryKey = String(row.deliveryId || "");
      const rowQty = Number(row.deliveryQty) || 0;

      if (row.mode === "envio" && rowQty > 0) {
        parts.push({
          key: `${deliveryKey}-envio`,
          kind: "envio",
          row,
          quantity: rowQty,
          addressTypeID: Number(row.addressTypeId) || 1,
        });
      }

      if (row.mode === "retiro" && rowQty > 0) {
        parts.push({
          key: `${deliveryKey}-retiro`,
          kind: "retiro",
          row,
          quantity: rowQty,
          addressTypeID: Number(row.addressTypeId) || 7,
        });
      }

      if (row.mode === "mixta") {
        const envioQty = Number(row.mixedEnvioQty) || 0;
        const retiroQty = Number(row.mixedRetiroQty) || 0;

        if (envioQty > 0) {
          parts.push({
            key: `${deliveryKey}-envio`,
            kind: "envio",
            row,
            quantity: envioQty,
            addressTypeID: 1,
          });
        }

        if (retiroQty > 0) {
          parts.push({
            key: `${deliveryKey}-retiro`,
            kind: "retiro",
            row,
            quantity: retiroQty,
            addressTypeID: 7,
          });
        }
      }
    });

    const grouped = new Map<string, ShipmentPart[]>();
    parts.forEach((part) => {
      if (!grouped.has(part.key)) grouped.set(part.key, []);
      grouped.get(part.key)!.push(part);
    });

    let index = 0;
    const uniqueIdBySku = new Map<string, string>();
    cart.forEach((line, lineIndex) => {
      uniqueIdBySku.set(line.sku, `L${lineIndex + 1}`);
    });

    return Array.from(grouped.entries()).map(([groupKey, groupRows]) => {
      index += 1;
      const base = groupRows[0];
      const date = base?.row?.fecha?.from instanceof Date ? base.row.fecha.from : new Date();
      const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
      const isEnvioShipment = base?.kind === "envio";

      const shipmentItems: PreOrderShipmentItem[] = groupRows
        .map((part) => {
          const row = part.row;
          const qty = part.quantity;
          if (qty <= 0) return null;

          return {
            uniqueId: uniqueIdBySku.get(row.sku) || `L${index}`,
            sku: row.sku,
            quantity: qty,
            warehouses: [
              {
                warehouseCode: "03",
                assignedQty: qty,
              },
            ],
          } as PreOrderShipmentItem;
        })
        .filter((item: PreOrderShipmentItem | null): item is PreOrderShipmentItem => Boolean(item));

      return {
        code: `SHIP-${String(index).padStart(3, "0")}`,
        deliveryCompanyName: isEnvioShipment ? "Bluexpress" : "Retiro en tienda",
        deliveryCompanyId: isEnvioShipment ? 2 : 0,
        shippingId: 1000 + index,
        timeSlotId: index,
        deliveryDate: dateStr,
        addressTypeID: Number(base?.addressTypeID) || (isEnvioShipment ? 1 : 7),
        items: shipmentItems,
      };
    }).filter((shipment) => shipment.items.length > 0);
  }, [entrega, cart]);

  const submitPreOrder = useCallback(async (creditReviewConfirmed: 0 | 1 = 0, creditReviewReason?: string): Promise<boolean> => {
    if (!isPagosCompleto) return false;

    if (!isPreVentaMode) {
      alert("Confirmación de pedido normal aún no implementada.");
      return false;
    }

    const deliveryRows = Array.isArray(entrega?.productDeliveries) ? entrega.productDeliveries : [];
    const homeDeliveryRows = deliveryRows.filter((row) => {
      if (row.mode === "envio") return (Number(row.deliveryQty) || 0) > 0;
      if (row.mode === "mixta") return (Number(row.mixedEnvioQty) || 0) > 0;
      return false;
    });

    if (homeDeliveryRows.length > 1) {
      const uniqueAddresses = new Set(homeDeliveryRows.map(getHomeAddressKey));
      if (uniqueAddresses.size > 1) {
        pushError("No se puede crear la preventa: todas las entregas a domicilio deben tener la misma dirección.");
        return false;
      }
    }

    const shipments = buildPreOrderShipments();
    if (shipments.length === 0) {
      pushError("La preventa no tiene envíos configurados. Debes asignar al menos un envío para continuar.");
      return false;
    }

    if (sellerSapId == null || sellerSapId <= 0) {
      pushError("No se pudo obtener el sellerID desde externalIds.sap del vendedor loggeado.");
      return false;
    }

    const selectedCustomer = customersMap[clienteId || ""];
    const selectedCustomerAny = selectedCustomer as any;
    const cardCode = String(selectedCustomer?.CardCode || clienteId || "").trim();
    const customerRut = String(
      selectedCustomer?.Rut ??
      selectedCustomerAny?.RUT ??
      selectedCustomerAny?.rut ??
      selectedCustomerAny?.TaxId ??
      selectedCustomerAny?.taxId ??
      selectedCustomerAny?.Document ??
      selectedCustomerAny?.document ??
      ""
    ).trim();
    const customerPhone = String(
      selectedCustomer?.Phone ??
      selectedCustomerAny?.phone ??
      selectedCustomerAny?.Telefono ??
      selectedCustomerAny?.telefono ??
      selectedCustomerAny?.CellPhone ??
      selectedCustomerAny?.cellPhone ??
      selectedCustomerAny?.Mobile ??
      selectedCustomerAny?.mobile ??
      ""
    ).trim();
    const customerName = String(selectedCustomer?.CardName || cliente?.Cliente || "Cliente").trim();
    const nameParts = customerName.split(" ").filter(Boolean);
    const firstName = nameParts[0] || "Cliente";
    const lastName = nameParts.slice(1).join(" ") || "";

    const normalizedPaymentMethod = String(pagoMetodo || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim()
      .toLowerCase();
    const isInternalCredit = normalizedPaymentMethod === "contado" ? 0 : 1;
    const comments = isInternalCredit
      ? "Preorden CON PAGO Crédito CREADA DESDE MESON"
      : "Preorden CREADA DESDE MESON";
    const commentsWithReason = String(creditReviewReason || "").trim()
      ? `${comments} | Motivo autorización: ${String(creditReviewReason).trim()}`
      : comments;

    const itemUniqueIds = new Map<string, string>();
    cart.forEach((line, index) => {
      itemUniqueIds.set(line.sku, `L${index + 1}`);
    });

    const hasEnvio = deliveryRows.some((row) => {
      if (row.mode === "envio") return true;
      if (row.mode === "mixta") return (Number(row.mixedEnvioQty) || 0) > 0;
      return false;
    });
    const hasRetiro = deliveryRows.some((row) => {
      if (row.mode === "retiro") return true;
      if (row.mode === "mixta") return (Number(row.mixedRetiroQty) || 0) > 0;
      return false;
    });

    const firstShipment = shipments[0];
    const firstShipmentRow = (Array.isArray(entrega?.productDeliveries) ? entrega.productDeliveries : []).find((row) => {
      if (row.mode === "envio") return true;
      if (row.mode === "mixta") return (Number(row.mixedEnvioQty) || 0) > 0;
      return false;
    });
    const firstRetiroRow = deliveryRows.find((row) => {
      if (row.mode === "retiro") return true;
      if (row.mode === "mixta") return (Number(row.mixedRetiroQty) || 0) > 0;
      return false;
    });
    const fulfillmentAddressTypeID = hasEnvio && hasRetiro
      ? 8
      : hasRetiro
        ? (Number(firstRetiroRow?.addressTypeId) || 7)
        : (Number(firstShipment?.addressTypeID) || 1);
    const deliveryDateIso = firstShipment
      ? `${firstShipment.deliveryDate}T00:00:00.000Z`
      : new Date().toISOString();

    const payload = {
      typeID: 2,
      sellerID: sellerSapId,
      salesChannelReferenceId: String(canalVentaId || cliente?.CanalVenta || ""),
      currencyCode: "CLP",
      deliveryDate: deliveryDateIso,
      deliveryCompany: "Bluexpress",
      deliveryCompanyId: 2,
      paymentTypeID: 1,
      isInternalCredit,
      comments: commentsWithReason,
      status: {
        statusCode: "Nueva Preventa",
        description: "Preventa creada",
        note: "Creacion inicial",
      },
      fulfillment: {
        isCorporate: documentoTipo === "Factura",
        firstName,
        lastName,
        email: String(selectedCustomer?.Email || ""),
        phone: customerPhone || null,
        cardCode,
        documentType: "RUT",
        document: String(customerRut || cardCode || ""),
        addressTypeID: fulfillmentAddressTypeID,
        receiverName: customerName,
        postalCode: "",
        giro: documentoTipo === "Factura" ? String(giroComercial || "") : "Particular",
        city: String(firstShipmentRow?.ciudad || ""),
        country: "CL",
        state: String(firstShipmentRow?.region || ""),
        street: String(firstShipmentRow?.calle || ""),
        number: String(firstShipmentRow?.numero || ""),
        neighborhood: "",
        referenceAddress: String(firstShipmentRow?.referencia || ""),
      },
      items: cart.map((line) => ({
        uniqueId: itemUniqueIds.get(line.sku) || "L1",
        itemCode: line.sku,
        description: line.name,
        quantity: line.cantidad,
        priceListID: line.priceListNum ?? 1,
        seller: String(user?.id || ""),
        priceBeforeVAT: Number(line.price) || 0,
        whsCode: "03",
        discountPercent: 0,
      })),
      shipments,
    };

    try {
      setSubmittingPreOrder(true);
      if (creditReviewConfirmed === 0) {
        setCreditReviewRequired(false);
        setCreditReviewMessage(null);
      }

      const preOrderEndpoint = isInternalCredit
        ? `${PRE_ORDER_API}?creditReviewConfirmed=${creditReviewConfirmed}`
        : PRE_ORDER_API;

      const createdPreOrder = await fetchWithAuthQA<PreOrderCreateResponseLike>(preOrderEndpoint, {
        method: "POST",
        body: JSON.stringify(payload),
      });

      let createdPreOrderCode = resolveCreatedPreOrderCode(createdPreOrder);
      let createdPreOrderBarcode = resolveCreatedPreOrderBarcode(createdPreOrder);
      const createdPreOrderId = resolveCreatedPreOrderId(createdPreOrder);

      if (!createdPreOrderCode && createdPreOrderId) {
        try {
          const issueSummary = await fetchWithAuthQA<PreOrderCreateResponseLike>(
            `${PRE_ORDER_ISSUE_SUMMARY_API}/${encodeURIComponent(createdPreOrderId)}`,
            { method: "GET" }
          );
          createdPreOrderCode = resolveCreatedPreOrderCode(issueSummary);
          createdPreOrderBarcode = resolveCreatedPreOrderBarcode(issueSummary);
        } catch {
          // Si falla el fallback, mantenemos flujo principal sin interrumpir creación.
        }
      }

      if (!createdPreOrderBarcode && createdPreOrderCode) {
        createdPreOrderBarcode = createdPreOrderCode;
      }

      if (createdPreOrderCode) {
        const totalAmount = cart.reduce((acc, line) => {
          const qty = Number(line.cantidad) || 0;
          const price = Number(line.priceIVA ?? line.price) || 0;
          return acc + (qty * price);
        }, 0);

        await printCreatedPreOrderTicket({
          preOrderCode: createdPreOrderCode,
          barcodeValue: createdPreOrderBarcode,
          customerName,
          createdAt: new Date().toLocaleString("es-CL", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
          }),
          status: "Nueva Preventa",
          items: cart.map((line) => ({
            sku: line.sku,
            name: line.name,
            quantity: Number(line.cantidad) || 0,
            total: (Number(line.cantidad) || 0) * (Number(line.priceIVA ?? line.price) || 0),
          })),
          totalAmount,
        });
      }

      setCreditReviewRequired(false);
      setCreditReviewMessage(null);
      toast.success(
        isInternalCredit && creditReviewConfirmed === 1
          ? "Solicitud de autorizacion de credito enviada correctamente."
          : "Preventa creada correctamente.",
        { duration: 4200 }
      );
      router.push(isPreVentaMode ? "/pedidos/pre-venta" : "/pedidos/listado-pedidos");
      return true;
    } catch (error: unknown) {
      console.error("Error al crear preventa:", error);
      const payload = getErrorPayload(error);
      const payloadData =
        payload?.data && typeof payload.data === "object"
          ? payload.data as Record<string, unknown>
          : null;
      const requiresReview = Boolean(
        payload?.requiresCreditReviewConfirmation ??
        payloadData?.requiresCreditReviewConfirmation
      );
      const backendMessage =
        String(payload?.message ?? "").trim() ||
        String(payloadData?.message ?? "").trim() ||
        getErrorMessage(error, "").trim();

      if (isInternalCredit && creditReviewConfirmed === 0 && requiresReview) {
        setCreditReviewRequired(true);
        setCreditReviewMessage(
          backendMessage ||
          "No tiene credito suficiente para completar la venta. Debes solicitar revision de credito."
        );
        return false;
      }

      pushError(backendMessage || "No se pudo crear la preventa.");
      return false;
    } finally {
      setSubmittingPreOrder(false);
    }
  }, [
    isPagosCompleto,
    isPreVentaMode,
    buildPreOrderShipments,
    getHomeAddressKey,
    customersMap,
    clienteId,
    cliente,
    pagoMetodo,
    cart,
    sellerSapId,
    canalVentaId,
    documentoTipo,
    giroComercial,
    entrega,
    fetchWithAuth,
    fetchWithAuthQA,
    pushError,
    router,
  ]);

  const handleConfirmarPedido = useCallback(() => {
    void submitPreOrder(0);
  }, [submitPreOrder]);

  const handleSolicitarAutorizacionCredito = useCallback(async (payload: {
    customerGroupNum: number | null;
    paymentMethod: string;
    authorizedLimit: number;
    usedCredit: number;
    availableCredit: number;
    totalPreventa: number;
    exceededAmount: number;
    reason: string;
  }) => {
    return submitPreOrder(1, payload.reason);
  }, [submitPreOrder]);

  const headerActions = [
    {
      label: "Guardar",
      variant: "success" as const,
      onClick: handleGuardar,
      icon: <ArrowDownOnSquareIcon className="h-5 w-5" />
    },
    {
      label: "Volver al listado",
      variant: "secondary" as const,
      onClick: handleCancelar,
      icon: <XCircleIcon className="h-5 w-5" />
    },
  ];
  const handleChange = <K extends keyof Cliente>(
    field: K,
    value: Cliente[K]
  ) => {
    setCliente((prev) => (prev ? { ...prev, [field]: value } : prev));
  };

  const handle =
    <K extends keyof Cliente>(field: K) =>
      (value: Cliente[K]) => {
        handleChange?.(field, value);
      };
  const handleChangeData =
    <K extends keyof Cliente>(field: K) =>
      (
        e:
          | React.ChangeEvent<HTMLInputElement>
          | React.ChangeEvent<{ value: unknown }>
      ) => {
        const value = (e.target as any).value;
        setCliente((prev) => ({ ...prev, [field]: value }));
      };
  /* const update = <K extends keyof User>(key: K, value: User[K]) =>
        setUser((c) => (c ? { ...c, [key]: value } : c));
 */

  const getStockDisponibleBySku = useCallback(async (sku: string): Promise<number> => {
    try {
      const url = `${URL_INVENTORY_STOCK}/stock/by-warehouse?sku=${encodeURIComponent(sku)}`;
      const resp = await fetch(url, { method: "GET" });
      if (!resp.ok) return 0;
      const data: StockByWarehouseApiRow[] = await resp.json();
      return (Array.isArray(data) ? data : []).reduce(
        (acc, row) => acc + (Number(row?.Disponible) || 0),
        0
      );
    } catch {
      return 0;
    }
  }, []);

  // Trae precio por lista y agrega/actualiza la línea en el carrito
  const handleAgregarProductoConPrecio = async () => {
    const effectiveQty = normalizedQuantity >= 1 ? normalizedQuantity : quantity;
    if (!currentItem?.sku || !effectiveQty || effectiveQty < 1) return;
    if (currentPriceListNum == null) {
      alert("Selecciona una PriceList para cotizar el ítem.");
      return;
    }

    try {
      const res = await fetchWithAuth<any>(
        `catalog/listprices/${encodeURIComponent(currentItem.sku)}/${encodeURIComponent(String(currentPriceListNum))}`
      );

      // La API entrega: { Price, PriceIVA }
      const unitPrice = Number(res?.Price) || 0; // sin IVA
      const unitPriceIVA = Number(res?.PriceIVA) || 0; // con IVA

      setCart(prev => {
        const idx = prev.findIndex(l => l.sku === currentItem.sku);
        if (idx >= 0) {
          const copy = [...prev];
          copy[idx] = {
            ...copy[idx],
            cantidad: copy[idx].cantidad + effectiveQty,
            priceListNum: currentPriceListNum,
            price: unitPrice,
            priceIVA: unitPriceIVA,
          };
          return copy;
        }
        return [
          ...prev,
          {
            sku: currentItem.sku,
            name: currentItem.name,
            img: currentItem.img,
            cantidad: effectiveQty,
            priceListNum: currentPriceListNum,
            price: unitPrice,
            priceIVA: unitPriceIVA,
            stock: 0,
          },
        ];
      });

      // Cargamos stock después de agregar para evitar latencia en UX.
      void getStockDisponibleBySku(currentItem.sku).then((stockDisponible) => {
        setCart(prev => prev.map((l) => (l.sku === currentItem.sku ? { ...l, stock: stockDisponible } : l)));
      });

      // Mantener compatibilidad con tu payload de pedido
      setPedidoLines(prev => [...prev, { sku: currentItem.sku, cantidad: effectiveQty }]);

      // limpiar UI
      setCurrentItem(null);
      setProductSearch("");
      setQuantity(1);
      setQuantityDraft("1");
      setSubCriteria("");
      setNotes("");
    } catch (error: unknown) {
      console.error("No se pudo obtener el precio:", error);
      alert(getErrorMessage(error, "No se pudo obtener el precio para la lista del cliente."));
    }
  };

  // acciones carrito
  const removeLine = (sku: string) => {
    setCart(prev => prev.filter(l => l.sku !== sku));
    setPedidoLines(prev => prev.filter(l => l.sku !== sku));
    setQtyDraft(prev => {
      const next = { ...prev };
      delete next[sku];
      return next;
    });
  };
  const updateLineQty = (sku: string, qty: number) => {
    if (qty < 1) return;
    setCart(prev => prev.map(l => (l.sku === sku ? { ...l, cantidad: qty } : l)));
    setPedidoLines(prev => prev.map(l => (l.sku === sku ? { ...l, cantidad: qty } : l)));
  };

  const commitLineQty = (sku: string, fallbackQty: number) => {
    const raw = (qtyDraft[sku] ?? "").trim();
    if (raw === "") {
      setQtyDraft(prev => {
        const next = { ...prev };
        delete next[sku];
        return next;
      });
      return;
    }

    const parsed = Number(raw);
    if (Number.isFinite(parsed) && parsed >= 1) {
      updateLineQty(sku, Math.floor(parsed));
    }

    setQtyDraft(prev => {
      const next = { ...prev };
      delete next[sku];
      return next;
    });
  };

  const handleEntrega =
    <K extends keyof Entrega>(key: K) =>
      (value: Entrega[K]) => {
        setEntrega((prev) => ({ ...prev, [key]: value }));
      };

  // Próximos 10 días, 09"“18, bloques de 2h, sin fines de semana
  const slotsMock = buildMockSlots(10, 9, 18, 2, false);

  // reintentar 
  const refetchAll = useCallback(async () => {
    // limpiamos estados de carga
    setChannelsLoading(true);
    setCompaniesLoading(true);
    setCustomersLoading(true);

    // NO limpiamos globalError aquí
    // porque queremos mostrar el spinner mientras recargamos

    // ejecutamos todas las cargas simultáneamente
    await Promise.all([
      fetchProducts(),
      // los useEffects de canales, empresas y clientes
      // se activan solos al cambiar su loading y búsquedas
    ]);

    // al terminar, devolvemos si existe error o no
    return globalError === null;
  }, [fetchProducts, globalError]);

  return (
    <div className="flex min-h-screen flex-col bg-page-bg">
      <PageHeader
        sticky
        stickyTop={0}
        title={isPreVentaMode ? "Crear Pre-venta" : "Nuevo Pedido"}
        description={isPreVentaMode ? "Crear una nueva pre-venta" : "Crear un nuevo pedido"}
        action={headerActions}
      />
      {/* error */}
      {globalError && (
        <div
          className="mx-6 mt-6 bg-red-50 border-l-4 border-red-400 p-4 text-red-700 rounded-md shadow-sm"
          role="alert"
        >
          <div className="flex">
            <div className="flex-shrink-0">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-400" aria-hidden="true" />
            </div>
            <div className="ml-3 space-y-1">
              <h3 className="text-sm font-medium">Error al cargar información</h3>

              <div className="text-sm space-y-1">
                {globalError.map((err, idx) => (
                  <p key={idx}>• {err}</p>
                ))}
              </div>

              <div className="mt-4 -mx-2 -my-1.5 flex">
                <button
                  type="button"
                  disabled={retrying}
                  onClick={async () => {
                    setRetrying(true);

                    const ok = await refetchAll();

                    // si todo ok †’ limpiamos errores
                    if (ok) {
                      setGlobalError(null);
                    }

                    setRetrying(false);
                  }}
                  className="rounded-md bg-red-50 px-2 py-1.5 text-sm font-medium text-red-800 
    hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-600 
    focus:ring-offset-2 focus:ring-offset-red-50"
                >
                  {retrying ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4 text-red-700" viewBox="0 0 24 24">
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                        />
                      </svg>
                      Cargando…
                    </span>
                  ) : (
                    "Reintentar"
                  )}
                </button>

              </div>
            </div>
          </div>
        </div>
      )}
      {!globalError && (
        <div className="flex-1 space-y-6 p-6 min-h-screen overflow-visible">

          {/* === LAYOUT: contenido principal + resumen lateral === */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_400px] items-start overflow-visible">
            {/* Columna izquierda: acordeones */}
            <div className="space-y-6">
              <Accordion
                expanded={clienteExpanded}
                onChange={(e, isExpanded) => {
                  setClienteExpanded(isExpanded);
                }}
                className="!rounded-2xl !overflow-hidden !border !border-slate-200 !shadow-sm"
              >
                <AccordionSummary
                  expandIcon={<ExpandMoreIcon />}
                  id="panel-cliente"
                  className="!border-b"
                >
                  <span className="font-medium">CLIENTE</span>
                </AccordionSummary>
                <AccordionDetails className="space-y-6 pt-6 pb-0">
                  <Card
                    title="IDENTIFICACIÓN DEL CLIENTE"
                    icon={UserIcon}
                    // hasTitleDivider
                    noDefaultStyles
                    className="p-6 pb-0"
                  >
                    <div className="grid grid-cols-1 gap-8 bg-white rounded-xl">

                      <div className="justify-cFliebreenter align-middle space-y-3">
                        <FieldRows label="Canal de venta">
                          <SelectSearchInline
                            id="canal-venta"
                            label=""
                            value={canalVentaId}
                            options={visibleChannels}
                            searchQuery={channelSearch}
                            loading={channelsLoading}
                            onSearch={setChannelSearch}
                            onChange={(val, label) => {
                              setCanalVentaId(val || "");
                              handle("CanalVenta")(val || "");
                            }}
                            placeholderFromDefault
                          />
                        </FieldRows>


                        <FieldRows label="Documento">
                          <SelectSearchInline
                            id="documento"
                            label=""
                            value={documentoTipo}
                            options={documentoOptions}
                            searchQuery=""
                            loading={false}
                            onSearch={() => { }}
                            onChange={(val) => {
                              const next = (val as "Boleta" | "Factura" | "") || "";
                              setDocumentoTipo(next);

                              // limpiar razón social si vuelve a Boleta
                              if (next !== "Factura") {
                                setRazonSocial("");
                                setGiroComercial("");
                              }
                            }}
                            placeholderFromDefault
                          />
                        </FieldRows>

                        {documentoTipo === "Factura" && !isPreVentaMode && (
                          <FieldRows label="Razón social">
                            <Input
                              fullWidth
                              value={razonSocial}
                              onChange={(e) => setRazonSocial(e.target.value)}
                              readOnly
                              className="[&>input]:p-0"
                            />
                          </FieldRows>
                        )}

                        {customerHasCreditLine === true && (
                          <FieldRows label="Crédito disponible">
                            <div className="text-sm">
                              {loadingCustomerAvailableCredit ? (
                                <span className="text-gray-500">Cargando crédito...</span>
                              ) : customerAvailableCredit != null ? (
                                <div className="space-y-1">
                                  <p className="font-semibold text-gray-900">{clp.format(customerAvailableCredit)}</p>
                                  {customerAvailableCreditMessage ? (
                                    <p className="text-xs text-gray-500">{customerAvailableCreditMessage}</p>
                                  ) : null}
                                </div>
                              ) : (
                                <span className="text-gray-500">No disponible</span>
                              )}
                            </div>
                          </FieldRows>
                        )}

                      </div>
                      <div className="justify-center align-middle">

                        <FieldRows label="Cliente">
                          <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 items-center">
                            {/* Selector cliente */}
                            <SelectSearchInline
                              id="cliente"
                              label=""
                              value={clienteId}
                              options={visibleCustomers}
                              searchQuery={customerSearch}
                              loading={customersLoading}
                              onSearch={setCustomerSearch}
                              onChange={(val, label) => {
                                // 1) Construir nuevo listNum
                                const c = customersMap[val || ""];
                                const nextListNum = typeof c?.ListNum === "number" ? c.ListNum : null;
                                const nextGroupNum = typeof c?.GroupNum === "number" ? c.GroupNum : null;
                                const nextCreditLimit = typeof c?.CreditLimit === "number" ? c.CreditLimit : null;
                                const nextCreditUsed = typeof c?.CreditUsed === "number" ? c.CreditUsed : null;
                                const nextCardName = String(c?.CardName || "").trim();
                                const nextNotes = String(c?.Notes || "").trim();

                                // 2) Si no hay carrito, selecciona directo
                                if (cart.length === 0) {
                                  setClienteId(val || "");
                                  handle("Cliente")(label || "");
                                  setCustomerListNum(nextListNum);
                                  setCustomerGroupNum(nextGroupNum);
                                  setCustomerCreditLimit(nextCreditLimit);
                                  setCustomerCreditUsed(nextCreditUsed);
                                  if (documentoTipo === "Factura") {
                                    setRazonSocial(nextCardName);
                                    setGiroComercial(nextNotes);
                                  }
                                  return;
                                }

                                // 3) Hay carrito: guardar selección pendiente y abrir modal
                                setPendingClient({
                                  id: val || "",
                                  label: label || "",
                                  cardName: nextCardName,
                                  notes: nextNotes,
                                  listNum: nextListNum,
                                  groupNum: nextGroupNum,
                                  creditLimit: nextCreditLimit,
                                  creditUsed: nextCreditUsed,
                                });
                              }}
                              placeholderFromDefault
                            />

                            {/* Botones acción cliente */}
                            <div className="flex gap-2">
                              <ActionButton
                                variant="secondary"
                                className="h-10 px-3 rounded-md gap-2 text-primary-600 border-primary-200 hover:bg-primary-50"
                                onClick={() => {
                                  if (!clienteId) return; // deshabilita si no hay cliente seleccionado
                                  setUpsertMode("edit");
                                  setEditCustomerId(clienteId);
                                  setUpsertOpen(true);
                                }}
                              >
                                <EditIcon className="h-4 w-4" />
                                {/* Editar */}
                              </ActionButton>

                              <ActionButton
                                variant="success"
                                className="h-10 px-3 rounded-md gap-2"
                                onClick={() => {
                                  setUpsertMode("create");
                                  setEditCustomerId(undefined);
                                  setUpsertOpen(true);
                                }}
                              >
                                <Plus className="h-4 w-4" />
                                {/* Nuevo */}
                              </ActionButton>
                            </div>
                          </div>
                        </FieldRows>

                        {documentoTipo === "Factura" && isPreVentaMode && (
                          <FieldRows label="Razón social">
                            <Input
                              fullWidth
                              value={razonSocial}
                              onChange={(e) => setRazonSocial(e.target.value)}
                              readOnly
                              className="[&>input]:p-0"
                            />
                          </FieldRows>
                        )}

                        {documentoTipo === "Factura" && (
                          <FieldRows label="Giro comercial">
                            <Input
                              fullWidth
                              value={giroComercial}
                              onChange={(e) => setGiroComercial(e.target.value)}
                              readOnly
                              className="[&>input]:p-0"
                            />
                          </FieldRows>
                        )}

                        {/* <ActionButton
                            variant="secondary"
                            className="rounded-full gap-2 text-primary-600 border-primary-200 hover:bg-primary-50 mt-2 mr-2"
                            onClick={() => {
                              if (!clienteId) return;            // deshabilita si no hay cliente seleccionado
                              setUpsertMode("edit");
                              setEditCustomerId(clienteId);
                              setUpsertOpen(true);
                            }}
                          >
                            <EditIcon className="h-4 w-4" />
                            Editar
                          </ActionButton>

                          <ActionButton
                            variant="success"
                            className="rounded-full gap-2 hover:bg-primary-50"
                            onClick={() => {
                              setUpsertMode("create");
                              setEditCustomerId(undefined);
                              setUpsertOpen(true);
                            }}
                          >
                            <Plus className="h-4 w-4" />
                            Nuevo
                          </ActionButton> */}

                        {/* <FieldRows label="Empresa">
                          <SelectSearchInline
                            id="empresa"
                            label=""
                            value={empresaId}
                            options={visibleCompanies}
                            searchQuery={companySearch}
                            loading={companiesLoading}
                            onSearch={setCompanySearch}
                            onChange={(val, label) => {
                              setEmpresaId(val || "");
                              handle("Empresa")(label || "");
                            }}
                            placeholderFromDefault
                          />

                        </FieldRows> */}

                        {/* <FieldRows label="Tipo de venta">
                          <SelectSearchInline
                            id="empresa" // mantenemos el id para no romper nada que lo referencie
                            label=""
                            value={empresaId}
                            options={tipoVentaOptions}
                            searchQuery=""           // sin búsqueda remota
                            loading={false}          // es un set fijo
                            onSearch={() => { }}      // no-op, mantiene la firma del componente
                            onChange={(val, label) => {
                              setEmpresaId(val || "");
                              // handle("Empresa")(label || ""); // guardamos el texto visible: "Preventa" o "Cotización"
                              handle("Empresa")(val || "");
                            }}
                            placeholderFromDefault
                          />
                        </FieldRows> */}

                      </div>
                    </div>
                  </Card>

                  <div className="flex items-center justify-end gap-3 py-4">
                    {/* Botón Siguiente en Cliente */}
                    <ActionButton
                      variant="primary"
                      disabled={!isClienteCompleto}
                      onClick={() => {
                        if (!isClienteCompleto) return;
                        setClienteExpanded(false);
                        setClienteGateLocked(false);
                        setItemsExpanded(true);
                        setItemsGateLocked(true);   // Entrega aún bloqueado
                        setEntregaExpanded(false);
                        setPagosExpanded(false);
                      }}
                    >
                      Siguiente
                    </ActionButton>

                  </div>
                </AccordionDetails>
              </Accordion>

              {/* Accordion Items  */}
              <div ref={itemsRef} className="h-0" />
              <Accordion
                expanded={itemsExpanded} // controlado y bloquea abrir si gate activo 
                onChange={(e, isExpanded) => {
                  // ELIMINAR
                  // if (clienteGateLocked) return; // bloquea interacción
                  if (clienteGateLocked && !DEV_BYPASS_GATES) return;
                  setItemsExpanded(isExpanded);
                }}
                className="!rounded-2xl !overflow-hidden !border !border-slate-200 !shadow-sm"
                // Scroll cuando la transición terminó
                TransitionProps={{
                  onEntered: () => scrollToAnchor(itemsRef),
                }}
              >
                <AccordionSummary
                  expandIcon={<ExpandMoreIcon />}
                  id="panel-items"
                  // ELIMINAR
                  // className={`!border-b ${clienteGateLocked ? "pointer-events-none opacity-60" : ""}`} 
                  // aria-disabled={clienteGateLocked}
                  className={`!border-b ${(itemsGateLocked && !DEV_BYPASS_GATES) ? "pointer-events-none opacity-60" : ""}`}
                  aria-disabled={itemsGateLocked && !DEV_BYPASS_GATES}
                >
                  <span className="font-medium">ITEMS</span>
                </AccordionSummary>

                {clienteGateLocked ? (
                  <div className="px-6 pb-4 text-sm text-gray-500">
                    Completa los datos del cliente y pulsa <b>Siguiente</b> para continuar.
                  </div>
                ) : null}

                <AccordionDetails className="space-y-4">
                  <Card
                    title="CARRITO DE PRODUCTOS"
                    icon={Search}
                    hasTitleDivider
                    noDefaultStyles
                    className="p-6 pb-0"
                  >
                    <div className="grid w-full grid-cols-1 gap-6 rounded-xl bg-white">
                      <div className="w-full min-w-0 space-y-5">
                        {/*
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="flex flex-col">
                            <FieldRows label="Ingresar pedido pickeado">
                              <Checkbox
                                checked={itemsFlags.picked}
                                onChange={(_, v) =>
                                  setItemsFlags((p) => ({ ...p, picked: v }))
                                }
                                sx={{ p: 0.5 }}
                              />
                            </FieldRows>

                            <FieldRows label="Ingresar pedido sin ítems">
                              <Checkbox
                                checked={itemsFlags.empty}
                                onChange={(_, v) =>
                                  setItemsFlags((p) => ({ ...p, empty: v }))
                                }
                                sx={{ p: 0.5 }}
                              />
                            </FieldRows>
                          </div>
                        </div>
                        */}
                        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                          <FieldRows label="Ítems">
                            <SelectSearchInline
                              id="item-producto"
                              label=""
                              value={currentItem?.sku || ""}
                              options={productOptions}
                              searchQuery={productSearch}
                              loading={productsLoading}
                              onSearch={setProductSearch}
                              onChange={(val) => {
                                if (!val) {
                                  setCurrentItem(null);
                                  return;
                                }
                                const found = searchableProducts.find((p) => p.sku === val)
                                  ?? catalogo.find((p) => p.sku === val)
                                  ?? null;
                                setCurrentItem(found);
                              }}
                              placeholderFromDefault
                            />
                          </FieldRows>

                          <FieldRows label="Lista de precios">
                            <SelectSearchInline
                              id="items-pricelist"
                              label=""
                              value={currentPriceListNum != null ? String(currentPriceListNum) : ""}
                              options={itemPriceListOptions}
                              searchQuery=""
                              loading={loadingSellerPriceLists}
                              onSearch={() => { }}
                              onChange={(val) => {
                                const parsed = Number(val);
                                if (!currentItem?.sku) return;
                                setSelectedPriceListBySku((prev) => ({
                                  ...prev,
                                  [currentItem.sku]: Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : null,
                                }));
                              }}
                              placeholderFromDefault
                            />
                          </FieldRows>
                        </div>
                        {/*
                        <FieldRows label="Criterio de sustitución">
                          <CollapsibleField
                            inline
                            label=""
                            value={subCriteria}
                            options={["Misma marca", "Mismo precio", "Libre"]}
                            onChange={(v) => setSubCriteria(v as string)}
                          />
                        </FieldRows>
                        <FieldRows label="Notas">
                          <Input
                            fullWidth
                            multiline
                            maxRows={3}
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            className="[&>textarea]:p-0"
                          />
                        </FieldRows>
                        */}
                        {currentItem && (
                          <div className="w-full overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
                            <table className="w-full min-w-full table-fixed text-sm text-card-foreground">
                              <thead className="bg-slate-50 text-slate-800">
                                <tr>
                                  <th className="w-14 px-3 py-3 text-center text-xs font-semibold uppercase tracking-wide"></th>
                                  <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide">Descripcion</th>
                                  <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide">Precio</th>
                                  <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide">Cant.</th>
                                  <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide">Impuesto</th>
                                  <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide">Subtotal</th>
                                </tr>
                              </thead>
                              <tbody>
                                <tr className="border-t border-slate-200 bg-white align-middle">
                                  <td className="px-3 py-2 text-center">
                                    <button
                                      type="button"
                                      title="Quitar selección"
                                      aria-label="Quitar selección"
                                      onClick={() => setCurrentItem(null)}
                                      className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-red-500/30 bg-red-50 text-red-600 transition-colors hover:bg-red-100"
                                    >
                                      <TrashIcon className="h-4 w-4" />
                                    </button>
                                  </td>
                                  <td className="px-3 py-2">
                                    <div className="flex items-center gap-3">
                                      {currentItem.img ? (
                                        <img
                                          src={currentItem.img}
                                          alt={currentItem.name}
                                          className="h-12 w-12 rounded-md border border-slate-200 object-cover"
                                          loading="lazy"
                                          referrerPolicy="no-referrer"
                                          onError={(e) => {
                                            (e.currentTarget as HTMLImageElement).style.display = "none";
                                          }}
                                        />
                                      ) : null}
                                      <div>
                                        <div className="font-medium text-card-foreground">{currentItem.name}</div>
                                        <div className="text-xs text-muted-foreground">SKU {currentItem.sku}</div>
                                      </div>
                                    </div>
                                    {previewPriceError ? (
                                      <div className="text-xs text-amber-700">{previewPriceError}</div>
                                    ) : null}
                                  </td>
                                  <td className="px-3 py-2">{previewPriceLoading ? "Cargando..." : clp.format(previewPriceToShow)}</td>
                                  <td className="px-3 py-2">
                                    <input
                                      type="number"
                                      min={1}
                                      value={quantityDraft}
                                      onChange={(e) => {
                                        const value = e.target.value;
                                        if (/^\d*$/.test(value)) {
                                          setQuantityDraft(value);
                                        }
                                      }}
                                      onBlur={() => {
                                        const parsed = Number(quantityDraft);
                                        const nextQty = Number.isFinite(parsed) && parsed >= 1 ? Math.floor(parsed) : 1;
                                        setQuantity(nextQty);
                                        setQuantityDraft(String(nextQty));
                                      }}
                                      onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                          (e.currentTarget as HTMLInputElement).blur();
                                        }
                                      }}
                                      className="w-20 rounded-md border border-input bg-background px-2 py-1 text-foreground focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                                    />
                                  </td>
                                  <td className="px-3 py-2">{previewTaxPct}%</td>
                                  <td className="px-3 py-2 font-semibold">{previewPriceLoading ? "Cargando..." : clp.format(previewPriceToShow * livePreviewQuantity)}</td>
                                </tr>
                              </tbody>
                            </table>

                            <div className="border-t border-slate-200 bg-slate-50 px-3 py-2">
                              <ActionButton
                                variant="secondary"
                                size="sm"
                                className="gap-2 rounded-full"
                                onClick={handleMostrarStock}
                              >
                                <ClipboardIcon className="h-4 w-4" />
                                Mostrar stock
                              </ActionButton>
                            </div>
                          </div>
                        )}

                        <div className="mt-3 flex flex-wrap items-center gap-3">
                          <Button
                            variant="contained"
                            color="success"
                            className="min-w-[200px]"
                            onClick={handleAgregarProductoConPrecio}
                            disabled={
                              !currentItem?.sku ||
                              normalizedQuantity < 1 ||
                              loadingSellerPriceLists ||
                              currentPriceListNum == null
                            }
                          >
                            + Agregar producto
                          </Button>

                          <ActionButton
                            variant="secondary"
                            className="gap-2 rounded-full"
                            onClick={() => console.log("similares")}
                            disabled={!currentItem}
                          >
                            <SparklesIcon className="h-4 w-4" />
                            Productos similares
                          </ActionButton>
                        </div>

                        {loadingSellerPriceLists ? (
                          <p className="text-xs text-gray-500">Cargando listas de precio habilitadas para el vendedor...</p>
                        ) : null}

                        {!loadingSellerPriceLists && currentPriceListNum != null && customerListNum != null && currentPriceListNum !== customerListNum ? (
                          <p className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-700">
                            Estás cotizando el producto seleccionado con PriceList {currentPriceListNum}, distinta a la PriceList del cliente ({customerListNum}).
                          </p>
                        ) : null}

                        <div className="mt-6 w-full min-w-0">
                          <p className="mb-2 text-sm font-semibold text-foreground">Carrito</p>
                          {cart.length === 0 ? (
                            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-600">
                              Aun no hay items agregados. Selecciona un producto y agregalo al carrito.
                            </div>
                          ) : (
                            <div className="w-full overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
                              <table className="w-full min-w-full table-fixed text-sm text-card-foreground">
                                <thead className="bg-slate-50 text-slate-800">
                                  <tr>
                                    <th className="w-14 px-3 py-3 text-center text-xs font-semibold uppercase tracking-wide"></th>
                                    <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide">Descripcion</th>
                                    <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide">Precio</th>
                                    <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide">Cant.</th>
                                    <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide">Impuesto</th>
                                    <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide">Subtotal</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {cart.map((l) => {
                                    const impuestoPct = l.price > 0 ? Math.round(((l.priceIVA / l.price) - 1) * 100) : 0;
                                    const subtotalLinea = l.priceIVA * l.cantidad;

                                    return (
                                      <tr key={l.sku} className="border-t border-slate-200 bg-white align-middle">
                                        <td className="px-3 py-2 text-center">
                                          <button
                                            type="button"
                                            title="Quitar item"
                                            aria-label="Quitar item"
                                            onClick={() => removeLine(l.sku)}
                                            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-red-500/30 bg-red-50 text-red-600 transition-colors hover:bg-red-100"
                                          >
                                            <TrashIcon className="h-4 w-4" />
                                          </button>
                                        </td>
                                        <td className="px-3 py-2">
                                          <div className="flex items-center gap-3">
                                            {l.img ? (
                                              <img
                                                src={l.img}
                                                alt={l.name}
                                                className="h-12 w-12 rounded-md border border-slate-200 object-cover"
                                                loading="lazy"
                                                referrerPolicy="no-referrer"
                                                onError={(e) => {
                                                  (e.currentTarget as HTMLImageElement).style.display = "none";
                                                }}
                                              />
                                            ) : null}
                                            <div>
                                              <div className="font-medium text-card-foreground">{l.name}</div>
                                              <div className="text-xs text-muted-foreground">SKU {l.sku}</div>
                                            </div>
                                          </div>
                                        </td>
                                        <td className="px-3 py-2">{clp.format(l.priceIVA)}</td>
                                        <td className="px-3 py-2">
                                          <input
                                            type="number"
                                            min={1}
                                            value={qtyDraft[l.sku] ?? String(l.cantidad)}
                                            onChange={(e) => {
                                              const value = e.target.value;
                                              if (/^\d*$/.test(value)) {
                                                setQtyDraft(prev => ({ ...prev, [l.sku]: value }));
                                              }
                                            }}
                                            onBlur={() => commitLineQty(l.sku, l.cantidad)}
                                            onKeyDown={(e) => {
                                              if (e.key === "Enter") {
                                                (e.currentTarget as HTMLInputElement).blur();
                                              }
                                            }}
                                            className="w-20 rounded-md border border-input bg-background px-2 py-1 text-foreground focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                                          />
                                        </td>
                                        <td className="px-3 py-2">{impuestoPct}%</td>
                                        <td className="px-3 py-2 font-semibold">{clp.format(subtotalLinea)}</td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      </div>

                      {/*
                      <div className="relative space-y-2 pl-4">
                        <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-0 w-[2px] bg-gray-300/80 shadow-[6px_0_12px_-4px_rgba(0,0,0,0.12)] rounded-r" />
                        <p className="text-sm font-semibold flex items-center gap-2">
                          <TableIcon className="h-4 w-4" /> TOTALES
                          <span className="flex-1 border-t border-gray-300 ml-2" />
                        </p>

                        {cart.some(l => l.priceError) && (
                          <div className="rounded-lg border border-amber-300 bg-amber-50 text-amber-900 px-3 py-2 text-sm">
                            Algunas líneas no pudieron obtener precio para la lista actual. Revísalas o elimínalas para continuar.
                          </div>
                        )}

                        {cart.length > 0 ? (
                          <div className="space-y-2 text-sm">
                            {cart.map((l) => (
                              <div key={l.sku} className="flex items-center justify-between gap-2">
                                <div className="min-w-0">
                                  <div className="truncate">{l.name}</div>
                                  <div className="text-gray-500">
                                    SKU {l.sku} — {clp.format(l.price)} (sin IVA) / {clp.format(l.priceIVA)} (c/IVA) x
                                    <input
                                      type="number"
                                      min={1}
                                      value={l.cantidad}
                                      onChange={(e) => updateLineQty(l.sku, +e.target.value)}
                                      className="ml-1 w-16 border rounded px-2 py-[2px]"
                                    />
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <div className="font-medium">{clp.format(l.priceIVA * l.cantidad)}</div>
                                  <IconBtn
                                    title="Eliminar"
                                    ariaLabel="Eliminar"
                                    onClick={() => removeLine(l.sku)}
                                  />
                                </div>
                              </div>
                            ))}
                            <Divider />
                          </div>
                        ) : (
                          <div className="text-sm text-gray-500">Aún no hay ítems agregados.</div>
                        )}

                        <div className="space-y-1 text-sm">
                          <Line label="Ítems (sin IVA)" value={clp.format(subtotalSinIVA)} />
                          <Line label="Descuentos" value={clp.format(0)} />
                          <Line label="Envío" value={clp.format(0)} />
                          <Line label="Impuestos" value={clp.format(impuestos)} />
                          <Line label="Intereses de financiación" value={clp.format(0)} />
                          <Line label="Ítems (con IVA)" value={clp.format(subtotalConIVA)} />
                        </div>

                        <Divider />
                        <Line label="SUBTOTAL (sin IVA)" value={clp.format(subtotalSinIVA)} bold />
                        <Line label="TOTAL (con IVA)" value={clp.format(subtotalConIVA)} bold />
                      </div>
                      */}

                    </div>

                    <div className="flex items-center justify-end gap-3 py-4">
                      {/* Botón Siguiente en Átems */}
                      <ActionButton
                        variant="primary"
                        disabled={!isItemsCompleto}
                        onClick={() => {
                          if (!isItemsCompleto) return;
                          setItemsGateLocked(false);
                          setItemsExpanded(false);
                          setEntregaExpanded(true);
                          setPagosExpanded(false);
                        }}
                      >
                        Siguiente
                      </ActionButton>


                    </div>

                  </Card>
                </AccordionDetails>
              </Accordion>
              {/* Accordion metodo de entrega  */}
              <div ref={entregaRef} className="h-0" />
              <Accordion
                expanded={entregaExpanded} // controlado y bloquea abrir si gate activo 
                onChange={(e, isExpanded) => {
                  // ELIMINAR
                  // if (itemsGateLocked) return;
                  if (itemsGateLocked && !DEV_BYPASS_GATES) return;
                  setEntregaExpanded(isExpanded);
                }}
                className="!rounded-2xl !overflow-hidden !border !border-slate-200 !shadow-sm"
                TransitionProps={{
                  onEntered: () => scrollToAnchor(entregaRef),
                }}
              >
                <AccordionSummary
                  expandIcon={<ExpandMoreIcon />}
                  id="panel-entrega"
                  // ELIMINAR
                  className={`!border-b ${(itemsGateLocked && !DEV_BYPASS_GATES) ? "pointer-events-none opacity-60" : ""}`}
                  aria-disabled={itemsGateLocked && !DEV_BYPASS_GATES}
                // className={`!border-b ${itemsGateLocked ? "pointer-events-none opacity-60" : ""}`}
                // aria-disabled={itemsGateLocked}
                >
                  <span className="font-medium">MÉTODO DE ENTREGA</span>
                </AccordionSummary>

                {clienteGateLocked ? (
                  <div className="px-6 pb-4 text-sm text-gray-500">
                    Completa los datos del cliente y pulsa <b>Siguiente</b> para continuar.
                  </div>
                ) : null}

                {/* seccion entrega */}
                <AccordionDetails className="space-y-4">
                  <SeccionEntrega
                    products={cart.map((l) => ({ sku: l.sku, name: l.name, cantidad: l.cantidad, img: l.img }))}
                    deliverySelections={entrega.productDeliveries}
                    onDeliverySelectionsChange={(rows) => handleEntrega("productDeliveries")(rows)}
                    slotsMock={slotsMock}
                  />

                  <div className="flex items-center justify-end gap-3 py-4">
                    <ActionButton
                      variant="primary"
                      disabled={!isEntregaCompleto}
                      onClick={() => {
                        if (!isEntregaCompleto) return;
                        setPagosGateLocked(false);
                        setEntregaExpanded(false);
                        setPagosExpanded(true);
                      }}
                    >
                      Siguiente
                    </ActionButton>
                  </div>

                </AccordionDetails>

              </Accordion>
              {/* PAGOS */}
              <div ref={pagosRef} className="h-0" />
              <Accordion
                expanded={pagosExpanded} // controlado y bloquea abrir si gate activo 
                onChange={(e, isExpanded) => {
                  // ELIMINAR
                  // if (pagosGateLocked) return;
                  if (pagosGateLocked && !DEV_BYPASS_GATES) return;
                  setPagosExpanded(isExpanded);
                }}
                className="!rounded-2xl !overflow-hidden !border !border-slate-200 !shadow-sm"
                TransitionProps={{
                  onEntered: () => scrollToAnchor(pagosRef),
                }}
              >
                <AccordionSummary
                  expandIcon={<ExpandMoreIcon />}
                  id="panel-pagos"
                  // ELIMINAR
                  // className={`!border-b ${pagosGateLocked ? "pointer-events-none opacity-60" : ""}`}
                  // aria-disabled={pagosGateLocked}
                  className={`!border-b ${(pagosGateLocked && !DEV_BYPASS_GATES) ? "pointer-events-none opacity-60" : ""}`}
                  aria-disabled={pagosGateLocked && !DEV_BYPASS_GATES}
                >
                  <span className="font-medium">PAGOS</span>
                </AccordionSummary>

                {/* seccion pagos */}
                <AccordionDetails className="space-y-6 pt-6 pb-0">
                  <SeccionPagos
                    pagoMetodo={pagoMetodo}
                    setPagoMetodo={setPagoMetodo}
                    pagoImporte={pagoImporte}
                    setPagoImporte={setPagoImporte}
                    pagos={pagos}
                    setPagos={setPagos}
                    subtotalConIVA={subtotalConIVA}
                    totalPagos={totalPagos}
                    clp={clp}
                    isPagosCompleto={isPagosCompleto}
                    isPreVentaMode={isPreVentaMode}
                    customerGroupNum={customerGroupNum}
                    isAgriculturalOrder={isAgriculturalOrder}
                    customerCreditLimit={customerCreditLimit}
                    customerCreditUsed={customerCreditUsed}
                    customerAvailableCredit={customerAvailableCredit}
                    loadingCustomerAvailableCredit={loadingCustomerAvailableCredit}
                    customerAvailableCreditMessage={customerAvailableCreditMessage}
                    customerHasCreditLine={customerHasCreditLine}
                    creditReviewRequired={creditReviewRequired}
                    creditReviewMessage={creditReviewMessage}
                    isRequestingCreditAuthorization={submittingPreOrder}
                    onRequestCreditAuthorization={handleSolicitarAutorizacionCredito}
                    onConfirmar={handleConfirmarPedido}
                  />
                </AccordionDetails>

              </Accordion>

            </div> {/* † fin columna izquierda */}

            {/* Columna derecha: Resumen de la compra (fijo bajo el header) */}
            <aside className="hidden lg:block sticky top-[88px] self-start">
              {/* Alto máximo del viewport menos el offset del header; scroll interno si crece */}
              <div className="max-h-[calc(100vh-96px)] overflow-auto">
                <ResumenCompra
                  className="w-full"
                  productos={cart}
                  subtotalSinIVA={subtotalSinIVA}
                  impuestos={impuestos}
                  subtotalConIVA={subtotalConIVA}
                  descuentos={0}
                  envios={totalEnvios}
                  intereses={0}
                  totalPagos={totalPagos}
                  clpFormat={(n) => clp.format(n)}
                  onIrAPagar={() => {
                    setClienteExpanded(false);
                    setItemsExpanded(false);
                    setEntregaExpanded(false);
                    setPagosGateLocked(false);
                    setPagosExpanded(true);
                    scrollToAnchor(pagosRef);
                  }}
                />
              </div>
            </aside>

          </div> {/* fin grilla */}

          {/* === Modal de creación/edición de clientes === */}
          <CustomerUpsertModal
            open={upsertOpen}
            mode={upsertMode}
            customerId={editCustomerId}
            onClose={() => setUpsertOpen(false)}
            onSaved={(saved) => {
              // después de crear/editar, refrescamos la selección visible
              if (saved?.Id) {
                const lbl = labelFrom({
                  FirstName: saved.FirstName,
                  LastName: saved.LastName,
                  Email: saved.Email ?? undefined,
                });
                setClienteId(String(saved.Id));
                handle("Cliente")(lbl || "");
                const lnRaw = (saved as any)?.ListNum ?? (saved as any)?.listNum ?? null;
                const lnParsed = lnRaw == null ? null : Number(lnRaw);
                setCustomerListNum(Number.isFinite(lnParsed as number) ? lnParsed : null);
                const gnRaw = (saved as any)?.GroupNum ?? (saved as any)?.groupNum ?? null;
                const gnParsed = gnRaw == null ? null : Number(gnRaw);
                setCustomerGroupNum(Number.isFinite(gnParsed as number) ? gnParsed : null);
                const clRaw =
                  (saved as any)?.CreditLimit ??
                  (saved as any)?.creditLimit ??
                  (saved as any)?.credit_limit ??
                  null;
                const clParsed = clRaw == null ? null : Number(clRaw);
                setCustomerCreditLimit(Number.isFinite(clParsed as number) ? clParsed : null);
                const cuRaw =
                  (saved as any)?.CreditUsed ??
                  (saved as any)?.creditUsed ??
                  (saved as any)?.CreditUtilized ??
                  (saved as any)?.creditUtilized ??
                  (saved as any)?.CreditConsumed ??
                  (saved as any)?.creditConsumed ??
                  null;
                const cuParsed = cuRaw == null ? null : Number(cuRaw);
                setCustomerCreditUsed(Number.isFinite(cuParsed as number) ? cuParsed : null);
              }
              setUpsertOpen(false);
            }}
          />

          {/* === Modal de confirmación al cambiar cliente con carrito === */}
          <ModalCambiarCliente
            open={Boolean(pendingClient)}
            oldLabel={cliente?.Cliente || ""}
            newLabel={pendingClient?.label || ""}
            onReprice={async () => {
              if (!pendingClient) return;
              setClienteId(pendingClient.id);
              handle("Cliente")(pendingClient.label);
              setCustomerListNum(pendingClient.listNum ?? null);
              setCustomerGroupNum(pendingClient.groupNum ?? null);
              setCustomerCreditLimit(pendingClient.creditLimit ?? null);
              setCustomerCreditUsed(pendingClient.creditUsed ?? null);
              if (documentoTipo === "Factura") {
                setRazonSocial(pendingClient.cardName);
                setGiroComercial(pendingClient.notes);
              }
              await repriceCartForList(pendingClient.listNum ?? 0);
              setPendingClient(null);
            }}
            onClear={() => {
              if (!pendingClient) return;
              setClienteId(pendingClient.id);
              handle("Cliente")(pendingClient.label);
              setCustomerListNum(pendingClient.listNum ?? null);
              setCustomerGroupNum(pendingClient.groupNum ?? null);
              setCustomerCreditLimit(pendingClient.creditLimit ?? null);
              setCustomerCreditUsed(pendingClient.creditUsed ?? null);
              if (documentoTipo === "Factura") {
                setRazonSocial(pendingClient.cardName);
                setGiroComercial(pendingClient.notes);
              }
              setCart([]);
              setPedidoLines([]);
              setPendingClient(null);
            }}
            onCancel={() => setPendingClient(null)}
          />
        </div>
      )}

      {/* === Modal de Stock por almacén (usa el endpoint by-warehouse) === */}
      <StockModal
        sku={skuActual}
        open={isStockOpen}
        onClose={() => setIsStockOpen(false)}
      />
    </div>
  );
}


