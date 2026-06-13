import axios from "axios";
import { Pedido, PedidoStatus } from "@/features/pedidos/types/lista-pedidos";
import {
  Order,
  HistoryEvent,
  Shipment,
  OrderItem,
  HistoryControl,
  Bulto,
  BultosItem,
} from "@/features/pedidos/types/detalle-pedido";
import { Auditoria, AuditoriaStatus } from "@/features/auditorias/types/auditorias";
import { format } from "date-fns";
import { RondaPicking } from "@/features/picking/types/rondas";
import { OlaPicking } from "@/features/olas/types/olas";
import { PickerUser, PickerUserConfig } from "@/features/picking/types/users";
import { Warehouse } from "@/features/almacenes/types/almacenes";
import { Picker } from "@/features/picking/types/pickers";
import {
  PagedProducts,
  Product,
  ProductFilters,
} from "@/features/products/types/lista-stock";

import { URL_BACKOMS } from "@/lib/http/endpoints";

/* const URL_BACKOMS = "http://192.168.0.196:8080"; */

/* const API_URLL = `${ip}5000`;
const API_URL_ITEMS = `${ip}5001`;
const API_URL_USERS = `${ip}5002`;
const API_URL_BUNDLES = `${ip}5003`;
const API_URL_INVOICE = `${ip}5000/api/sap/invoices`;
const API_URL_WAREHOUSE = `${ip}5005`;
const API_URL_INVENTORY = `${ip}5005`; */

/* const transformPedido = (apiPedido: any): Pedido => ({
  id: apiPedido.orderID.toString(),
  canal: apiPedido.canal || "SAP",
  seller: apiPedido.seller || "No especificado",
  folionum: apiPedido.folionum || "",
  cliente: {
    nombre: apiPedido.cardname,
    direccion: "", // No proporcionado en la API
    rut: apiPedido.cardcode,
    email: apiPedido.e_mail || "",
    telefono: apiPedido.phone1 || "",
  },
  fechaCreacion: format(new Date(apiPedido.createdate), "dd/MM/yyyy"),
  fechaEntrega: apiPedido.deliveryDate || "",
  estado: mapOrderStatus(apiPedido.orderStatusID),
  items: {
    total: apiPedido.itemsAmount,
    procesados: 0, // No proporcionado en la API
  },
  entrega: {
    type: apiPedido.tipo || "Express 24 hrs",
    transportista: apiPedido.transportista || "",
    almacen: apiPedido.almacen || "Chorrillos",
    distance: apiPedido?.distance || "",
    //inicio: apiPedido.docdate,
    //fin: apiPedido.lastQueryDate,
  },
  totales: {
    total: apiPedido.doctotalsy,
    metodo: apiPedido.method,
  },
  prioridad: 1,
  direccion: "",
  picking: apiPedido.itemsAmount,
  notas: "",
}); */

const transformPedido = (api: any): Pedido => ({
  id: api.orderID.toString(),
  salesChannelReferenceId: api.salesChannelReferenceId.toString(),
  canal: api.canal ?? "SAP",
  seller: api.seller ?? "No especificado",

  docentry: api.docentry,
  docnum: api.docnum,
  folionum: api.folionum ?? "",

  u_ref1: api.u_ref1 ?? null,
  slpname: api.slpname ?? null,

  cliente: {
    nombre: api.cardname,
    direccion: "",
    rut: api.cardcode,
    email: api.e_mail ?? "",
    telefono: api.phone1 ?? "",
  },

  fechaCreacion: format(new Date(api.createdate), "dd/MM/yyyy hh:mm"),
  fechaEntrega: api.deliveryDate ?? "",

  estado: mapOrderStatus(api.orderStatusID),

  totales: {
    total: api.doctotalsy,
    metodo: api.paymentMethodID ?? "",
    documento: api.tipoDocumento ?? "",
  },

  entrega: {
    type: api.deliveryTypeID ?? "Express 24 hrs",
    transportista: api.transportista ?? "",
    almacen: api.almacen ?? "Chorrillos",
    distance: api.distance ?? "",
    direccion: api.direccion ?? "",
    whscode: api.whscode ?? "",
  },

  orderStatusID: api.orderStatusID,
  paymentMethodID: api.paymentMethodID,
  tipoDocumento: api.tipoDocumento,
  deliveryTypeID: api.deliveryTypeID,
  salesChannelID: api.salesChannelID,

  integrationError: api.integrationError,
  INTEGRATION_STATUS: api.INTEGRATION_STATUS,

  prioridad: 1,
  direccion: "",
  picking: api.itemsAmount.toString(),
  notas: "",
});

const transformAuditoria = (apiAuditoria: any): Auditoria => ({
  id: apiAuditoria.ID.toString(),
  entidad: apiAuditoria.entidad || "Order",
  refId: apiAuditoria.refid.toString(),
  idEntidad: apiAuditoria.idEntidad || "-",
  inventario: apiAuditoria.inventario || "San javier",
  controlador: apiAuditoria.Controlador
    ? {
      name: apiAuditoria.ControladorName,
      email: apiAuditoria.ControladorEmail || "-",
      avatar: apiAuditoria.ControladorName
        ? apiAuditoria.ControladorName.split(" ")
          .map((word: string) => word.charAt(0).toUpperCase())
          .slice(0, 2)
          .join("")
        : "",
    }
    : {
      name: "Desconocido",
      email: "-",
      avatar: "",
    },
  estado: mapOrderAuditoriaStatus(apiAuditoria.estado),
});

const transformRonda = (apiRondas: any): RondaPicking => ({
  id: apiRondas.roundID,
  pickingPoint: apiRondas.pickingPoint,
  ola: apiRondas.waveID,
  picker: apiRondas.pickerName,
  pickerEmail: apiRondas.pickerEmail,
  pickeruser: {
    picker: apiRondas.pickerName,
    pickerEmail: apiRondas.pickerEmail,
  },
  pedidos: apiRondas.ordersCount,
  productos: apiRondas.productsCount,
  items: apiRondas.itemsCount,
  itemsFaltantes: apiRondas.missingItems,
  completado: apiRondas.isCompleted,
  creacion: apiRondas.createdAt,
  modificado: apiRondas.updatedAt,
  status: apiRondas.roundStatus,
});
const transformOla = (apiOla: any): OlaPicking => ({
  id: apiOla.waveID,
  pickingPoint: apiOla.pickingPoint,
  fechaInicio: apiOla.startDate,
  fechaFin: apiOla.endDate,
  pedidos: {
    actual: apiOla.ordersPicked,
    total: apiOla.ordersPlanned,
  },
  items: {
    actual: apiOla.itemsPicked,
    total: apiOla.itemsPlanned,
  },
  bloqueada: apiOla.isBlocked,
  status: apiOla.waveStatus,
});

const mapOrderStatus = (orderStatusID: number): PedidoStatus => {
  const statusMap: Record<number, PedidoStatus> = {
    1: "Pedido Recibido",
    2: "Asignando Pickers",
    3: "En picking",
    4: "Picking Completado Parcialmente",
    5: "Picking Completado",
    6: "En packing",
    7: "Pendiente de auditar",
    8: "En reparto",
    9: "Entregado",
  };
  return statusMap[orderStatusID] || "Pedido recibido";
};

const mapOrderAuditoriaStatus = (orderStatusID: number): AuditoriaStatus => {
  const statusMap: Record<number, AuditoriaStatus> = {
    1: "En curso",
    2: "Corregir",
    3: "Error",
    4: "Finalizada",
  };
  return statusMap[orderStatusID] || "Pendiente";
};

const transformOrderToMockPedido = (apiOrder: any): Order => ({
  id: apiOrder.orderID.toString(),
  status: mapOrderStatus(apiOrder.orderStatusID),

  cliente: {
    name: apiOrder.cardname || "Cliente Desconocido",
    phone: apiOrder.phone1 || "Sin Teléfono",
    email: apiOrder.e_mail || "Sin Email",
    customerType: apiOrder.customertype || "-",
    nps: "N/A",
    dateCreated: apiOrder.createdate || "Fecha desconocida",
    documento: apiOrder.doc || "-",
    tipoDocumento: apiOrder.doc || "-",
  },

  picking: {
    items: apiOrder.itemsAmount || 0,
    tiempoPicking: "No disponible",
  },

  entrega: {
    tipoEntrega: "No disponible",
    fechaEntrega: apiOrder.deliveryDate || "Fecha no especificada",
    recibe: apiOrder.recipient || "Desconocido",
  },

  totales: {
    items: apiOrder.itemsAmount || 0,
    envio: 0,
    totalCapturado: apiOrder.doctotalsy || 4214,
  },

  pago: {
    metodoPago: "No disponible",
    estado: "No disponible",
  },

  store: {
    id: "N/A",
    name: "No disponible",
  },
});

export const fetchDetallePedidoAPI = async (
  pedidoId: string,
  signal?: AbortSignal
): Promise<Order | null> => {
  const source = axios.CancelToken.source();

  try {
    const response = await axios.get(`${URL_BACKOMS}/api/orders/${pedidoId}`, {
      cancelToken: source.token,
    });

    //console.log("Resumen: ", transformOrderToMockPedido(response.data));
    return transformOrderToMockPedido(response.data);
  } catch (error) {
    if (axios.isCancel(error)) {
      console.warn(`Solicitud cancelada para el pedido ${pedidoId}`);
    } else {
      console.error(`Error al obtener el pedido ${pedidoId}:`, error);
    }
    return null;
  } finally {
    source.cancel();
  }
};

export const fetchItemsPedidoAPI = async (
  pedidoId: string
): Promise<OrderItem[]> => {
  try {
    const response = await axios.get(
      `${URL_BACKOMS}/api/picking/products/${pedidoId}`
    );

    return response.data.map((item: any) => ({
      id: item.orderProductID?.toString() || "",
      name: item.dscription || "Producto desconocido",
      sku: item.orderProductID?.toString() || "Sin SKU",
      price: Number(item.price) || 0,
      quantity: item.quantity || 0,
      total: Number(item.total) || 0,
      imageUrl: item.imageUrl || "/placeholder-product.jpg",
      criteria: item.criteria || "No especificado",
      storeCode: item.itemcode?.toString() || "No disponible",
    }));
  } catch (error) {
    console.error("Error al obtener items del pedido:", error);
    return [];
  }
};

export const fetchItemsAuditoriaAPI = async (
  bultoID: string
): Promise<BultosItem[]> => {
  try {
    const response = await axios.get(
      `${URL_BACKOMS}/api/bundles/bundle/${bultoID}`
    );

    if (Array.isArray(response.data.products)) {
      return response.data.products.map((item: any) => ({
        id: item.bundleProductID.toString() || "1",
        type: item.packageType || "Item",
        reference: {
          name: item.dscription as string,
          sku: item.itemcode,
        },
        barcode: item.barcode || "",
        items: item.expected || 0,
        results: {
          encontrado: item.found || 0,
          faltante: item.not_found || 0,
          sobrante: item.repicked || 0,
        },
        fixed: item?.fixed || null,
        estado: item.auditStatusID || null,
      }));
    } else {
      console.error(
        "La propiedad 'products' no es un array:",
        response.data.products
      );
      return [];
    }
  } catch (error) {
    console.error("Error al obtener items de un bulto: ", error);
    return [];
  }
};

export const fetchContenidoAPI = async (
  bultoId: string
): Promise<BultosItem[]> => {
  try {
    const response = await axios.get(`${URL_BACKOMS}/api/bultos/${bultoId}`);
    return response.data;
  } catch (error) {
    console.error("Error al obtener items de Bultos: ", error);
    return [];
  }
};

// Obtener envíos del pedido
export const fetchShipmentsAPI = async (
  pedidoId: string
): Promise<Shipment[]> => {
  try {
    const response = await axios.get(`${URL_BACKOMS}/${pedidoId}/shipments`);
    return response.data;
  } catch (error) {
    console.error("Error al obtener envíos del pedido:", error);
    return [];
  }
};

export const fetchBundleAPI = async (pedidoId: string): Promise<Bulto[]> => {
  try {
    const response = await axios.get(`${URL_BACKOMS}/api/bundles/${pedidoId}`);
    //console.log("PedidoId: ", pedidoId);
    //console.log("Response de bultos desde fecthBundleAPI: ", response);
    return response.data.map(
      (item: any): Bulto => ({
        id: item.bundleID,
        pedidoId: item.orderID,
        tipoPaquete: item.packageType || "Paquete",
        codigoBarras: item.barcode || "YUF2MX3ZTV943",
        refId: item.refid || "1QHW6Y",
        inventario: item.inventario || "San javier",
        slot: item.slot || "-",
      })
    );
  } catch (error) {
    console.error("Error al obtener los bultos del pedido: ", error);
    return [];
  }
};

///api/picking/bundle crean un bulto
//bundles/idPedido
//bundle/bundleid detalle de un bulto

// Obtener historial del pedido
/*
export const fetchHistorialPedidoAPI = async (
  pedidoId: string
): Promise<HistoryEvent[]> => {
  try {
    const response = await axios.get(`${URL_BACKOMS}/${pedidoId}/history`);
    return response.data;
  } catch (error) {
    console.error("Error al obtener historial del pedido:", error);
    return [];
  }
};
*/
export const fetchPedidosAPI = async (): Promise<Pedido[]> => {
  try {
    const response = await axios.get(`${URL_BACKOMS}/api/orders`);
    // console.log("Contador");
    return response.data.map(transformPedido);
  } catch (error) {
    console.error("Error al obtener pedidos:", error);
    return [];
  }
};
interface HistorialPedidoResponse {
  controls: HistoryControl[];
  events: HistoryEvent[];
}

export const fetchHistorialPedidoAPI = async (
  pedidoId: string
): Promise<HistorialPedidoResponse | null> => {
  try {
    const response = await axios.get(
      `${URL_BACKOMS}/api/orders/history/${pedidoId}`
    );

    if (!response.data) {
      throw new Error("Respuesta de API vacía");
    }
    const lastIndex = response.data.length - 1;

    const events: HistoryEvent[] = response.data.map(
      (item: any, index: number) => ({
        id: item.historyID,
        status: item.currentStatus,
        date: new Date(item.changeDate).toLocaleString(),
        isCompleted: item.isCompleted,
      })
    );
    console.log("Events: ", response);
    return {
      controls: [],
      events,
    };
  } catch (error) {
    console.error(
      `Error al obtener el historial del pedido ${pedidoId}:`,
      error
    );
    return null;
  }
};

///api/bundles/bundle/id
export const fetchAuditoriasAPI = async (): Promise<Auditoria[]> => {
  try {
    const response = await axios.get(`${URL_BACKOMS}/api/bundles/`);
    return response.data.map(transformAuditoria);
  } catch (error) {
    console.error("Error al obtener auditorias: ", error);
    return [];
  }
};

export const fetchRondasAPI = async (): Promise<RondaPicking[]> => {
  try {
    const response = await axios.get(`${URL_BACKOMS}/api/picking/rounds`);
    console.log("response de rondas: ", response);
    return response.data.map(transformRonda);
  } catch (error) {
    console.error("Error al obtener Rondas: ", error);
    return [];
  }
};

export const fetchRondaApi = async (
  rondaId: string,
  waveID: string
): Promise<RondaPicking | null> => {
  try {
    const response = await axios.get(
      `${URL_BACKOMS}/api/picking/waves/${waveID}/rounds/${rondaId}`
    );
    console.log("Response de Rondas: ", response);
    return transformRonda(response.data);
  } catch (error) {
    console.error("Error al obtener detalles de una ronda");
    return null;
  }
};

export const fetchOlasAPI = async (): Promise<OlaPicking[]> => {
  try {
    const response = await axios.get(`${URL_BACKOMS}/api/picking/waves`);
    return response.data.map(transformOla);
  } catch (error) {
    console.error("Error al obtener las Olas: ", error);
    return [];
  }
};

export async function fetchOrdersOlasAPI() {
  try {
    const response = await axios.get(`${URL_BACKOMS}/api/picking/products/all`);
    // Aquí puedes transformar la data si necesitas
    return response.data; // Devuelve la data “cruda” o transformada
  } catch (error) {
    console.error("Error al obtener pedidos:", error);
    throw error;
  }
}

export interface AssignPickerData {
  pickingPoint: string;
  rut: string;
  email: string;
  name: string;
}

export interface AssignRondaResponse {
  success: boolean;
  message: string;
  data?: any;
}

export async function fetchNewRoundAPI(
  waveId: number,
  assignData: AssignPickerData,
  productIDs: number[]
): Promise<AssignRondaResponse> {
  const body = {
    roundData: {
      pickingPoint: assignData.pickingPoint,
      pickerName: assignData.name,
      pickerEmail: assignData.email,
    },
    products: productIDs.map((id) => ({
      orderProductID: id,
      pickerRUT: assignData.rut,
    })),
  };

  try {
    const response = await axios.post<AssignRondaResponse>(
      `${URL_BACKOMS}/api/picking/waves/${waveId}/rounds/unified`,
      body,
      {
        headers: { "Content-Type": "application/json" },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error al crear una nueva ronda");
    throw error;
  }
}

export async function fetchPickersAPI(): Promise<PickerUser[]> {
  try {
    // Ejemplo: suponiendo que la API filtre por rol "Picker"
    const response = await axios.get<PickerUser[]>(
      `${URL_BACKOMS}/api/users/active`
    );
    return response.data;
  } catch (error) {
    console.error("Error al obtener los pickeadores", error);
    throw error;
  }
}

export async function fetchAllPickersAPI(): Promise<Picker[]> {
  try {
    // Ejemplo: suponiendo que la API filtre por rol "Picker"
    const response = await axios.get<Picker[]>(`${URL_BACKOMS}/api/users/pickers`);
    return response.data;
  } catch (error) {
    console.error("Error al obtener los pickeadores", error);
    throw error;
  }
}

function isSkuLike(str: string): boolean {
  return /^[0-9]+$/.test(str.trim());
}

export async function fetchProductsAPI(
  params: ProductFilters
): Promise<PagedProducts> {
  try {
    const q = params.query?.trim();
    const { data } = await axios.get<{
      data: Product[];
      totalItems: number;
      totalPages: number;
      page: number;
    }>(`${URL_BACKOMS}/api/inventory/products`, {
      params: {
        page: params.page,
        sku: q && isSkuLike(q) ? q : undefined,
        nombre: q && !isSkuLike(q) ? q : undefined,
        status: params.activo || undefined,
        id_almacen: params.id_almacen || undefined,
      },
    });

    return {
      products: data.data, // ↍ sin derivar “disponible”
      page: data.page,
      totalPages: data.totalPages,
      totalItems: data.totalItems,
    };
  } catch (error) {
    console.error("Error al obtener productos:", error);
    throw error;
  }
}

// Supongamos que tu API responde con algo como:
export interface CreatePickerResponse {
  success: boolean;
  data: PickerUserConfig; // o lo que devuelva tu API
}

export async function createPickerAPI(
  newPicker: PickerUserConfig
): Promise<CreatePickerResponse> {
  try {
    // Ajusta la URL del endpoint según tu backend
    const response = await axios.post<CreatePickerResponse>(
      `/api/pickers/new`,
      newPicker,
      {
        headers: { "Content-Type": "application/json" },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error al crear el picker:", error);
    throw error;
  }
}

export async function getPickerByRutAPI(
  rut: string
): Promise<PickerUserConfig> {
  try {
    const response = await axios.get<PickerUserConfig>(`/api/pickers/${rut}`);
    return response.data;
  } catch (error) {
    console.error("Error al obtener picker:", error);
    throw error;
  }
}

export interface InvoiceProductLine {
  BaseType: number;
  BaseEntry: number;
  BaseLine: number;
  ItemCode: string;
  Quantity: number;
}

export interface CreateInvoicePayload {
  CardCode: string;
  DocDate: string;
  DocDueDate: string;
  ReserveInvoice: string;
  SalesPersonCode: number;
  U_REF1: string;
  Comments: string;
  DocumentLines: InvoiceProductLine[];
}

export interface CreateInvoiceResponse {
  DocEntry: number;
  DocNum: number;
  Message?: string;
}

export async function fetchCreateInvoiceAPI(
  payload: CreateInvoicePayload
): Promise<CreateInvoiceResponse> {
  try {
    console.log("📤 Enviando payload a API:", payload); // Log de entrada

    const response = await axios.post<CreateInvoiceResponse>(
      `${URL_BACKOMS}/api/sap/invoices`,
      payload,
      {
        headers: { "Content-Type": "application/json" },
        validateStatus: (status) =>
          (status >= 200 && status < 300) || status === 204,
      }
    );

    console.log("📥 Respuesta completa:", {
      status: response.status,
      headers: response.headers,
      data: response.data,
    });

    if (response.status === 204) {
      console.warn("⚠ï¸‍ Factura creada pero sin contenido (204)");
      return {
        DocEntry: 0,
        DocNum: 0,
        Message: "Factura creada (204)",
      };
    }

    return response.data;
  } catch (error: any) {
    console.error("❌ Error al crear la factura:", error);
    if (error.response) {
      console.error("🔍 Error.response:", {
        status: error.response.status,
        headers: error.response.headers,
        data: error.response.data,
      });
    }
    throw error;
  }
}

export const fetchWarehouseAPI = async (): Promise<Warehouse[]> => {
  try {
    const { data: raw } = await axios.get(`${URL_BACKOMS}/api/store`);

    if (!Array.isArray(raw)) {
      console.error("La API no devolvió un array:", raw);
      return [];
    }

    // Normalizar cada registro al shape de Warehouse
    const warehouses: Warehouse[] = raw.map((w: any) => ({
      id: String(w.id_almacen),
      nombre: w.nombre,
      ubicacion: w.ubicacion,
      items: w.items ?? "", // si lo trae
      fechaCreacion: w.date_created,
      ultimaModificacion: w.last_modified,
      usuarioCreacion: w.user_created ?? {
        name: "Sin datos",
        email: "",
      },
      usuarioModificacion: w.user_modified ?? {
        name: "Sin datos",
        email: "",
      },
      imagenUsuarioCreacion: w.user_created?.avatar_url ?? "", // o la propiedad que venga
      imagenUsuarioModificacion: w.user_modified?.avatar_url ?? "",
      status: w.status,
    }));

    return warehouses;
  } catch (error) {
    console.error("Error al obtener Almacenes: ", error);
    return [];
  }
};

/* ---------------------------------------------
 * PATCH /api/orders/:id
 * --------------------------------------------*/
export interface UpdateOrderPayload {
  /*  Datos de cliente  */
  cardcode: string;
  cardname: string;
  phone1: string;
  e_mail: string;

  fixed_rut: string;

  orderStatusID: number;
  integrationError: string | null;
  INTEGRATION_STATUS: string;
}

export interface UpdateOrderResponse {
  success: boolean;
  message?: string;
  data?: any;
}

export async function updateOrderAPI(
  orderId: string | number,
  payload: UpdateOrderPayload
): Promise<UpdateOrderResponse> {
  try {
    console.log("Data: ", payload);
    const fake = "api";
    console;
    const { data } = await axios.patch<UpdateOrderResponse>(
      `${URL_BACKOMS}/api/orders/${orderId}`,
      payload,
      { headers: { "Content-Type": "application/json" } }
    );
    return data;
  } catch (error) {
    console.error(`❌ Error al actualizar el pedido ${orderId}:`, error);
    throw error;
  }
}

/* ---------------------------------------------
 * POST /api/orders/:id/REPROCESS
 * --------------------------------------------*/

export interface ReprocessOrderResponse {
  success: boolean;
  message?: string;
  data?: any;
}

export async function reprocessOrderAPI(
  orderId: string | number
): Promise<ReprocessOrderResponse> {
  const api = "api";
  try {
    const { data } = await axios.post<ReprocessOrderResponse>(
      `${URL_BACKOMS}/api/orders/${orderId}/reprocess`
    );
    console.log("Reproces ejecutado");
    return data;
  } catch (error) {
    console.error(`❌ Error al reprocesar el pedido ${orderId}:`, error);
    throw error;
  }
}

export async function getEtiquetas() {
  try {
    const response = await axios.get(
      `https://backmimbral2025.loclx.io/api/templace`
    );
    return response.data;
  } catch (error) {
    console.error("Error al obtener etiquetas:", error);
    throw error;
  }
}
