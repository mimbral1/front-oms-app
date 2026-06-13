// lib/http/endpoints.ts
// Constantes centralizadas de URLs de las APIs.

const trimTrailingSlash = (value?: string) => `${value ?? ""}`.replace(/\/$/, "");
const ensureApiBase = (value?: string) => {
    const normalized = trimTrailingSlash(value);
    if (!normalized) return "";
    return /\/api$/i.test(normalized) ? normalized : `${normalized}/api`;
};

// principales
export const URL_BASE = ensureApiBase(process.env.NEXT_PUBLIC_URL_BASE_QA);
export const URL_BASE_QA = URL_BASE;
export const URL_BASE_CATALOGO = process.env.NEXT_PUBLIC_URL_BASE;
export const URL_BASE_26_5005 = process.env.NEXT_PUBLIC_URL_BASE_26_5005;
export const URL_BASE_168_5008 = process.env.NEXT_PUBLIC_URL_BASE_168_5008;
export const URL_BASE_92_5005 = process.env.NEXT_PUBLIC_URL_BASE_92_5005;
export const URL_BASE_WAREHOUSES = process.env.NEXT_PUBLIC_URL_BASE_WAREHOUSES;

// inventory
export const BASE_INVENTORY = `${URL_BASE_26_5005}`;
export const URL_INVENTORY = `${URL_BASE_92_5005}/api/`;
export const URL_INVENTORY_STOCK = `${URL_BASE_26_5005}/api`;

// orders
export const BASE_ORDERS = `${URL_BASE}`;
export const CATALOG_PRODUCTS_LIST_API = `${BASE_ORDERS}/catalog/productos/listar`;
export const CUSTOMERS_FIND_API = `${BASE_ORDERS}/customers/find`;
export const PAYMENT_TYPES_API = `${BASE_ORDERS}/finance/payments/types`;
export const COMMERCE_SERVICE_SALES_CHANNELS_API = `${BASE_ORDERS}/comerce-service/sales-channel/Listar`;
export const COMMERCE_SERVICE_SALES_CHANNELS_SIMPLE_API = `${BASE_ORDERS}/comerce-service/sales-channel/ListarSimple`;
export const COMMERCE_SERVICE_LOCATIONS_API = `${BASE_ORDERS}/comerce-service/locations`;
export const FINANCE_WAVES_API = `${BASE_ORDERS}/finance/waves`;
export const FINANCE_WAVES_MANUAL_ASSIGNMENTS_STAGE_API = `${FINANCE_WAVES_API}/manual-assignments/stage`;
export const PACKAGE_TYPES_API = `${BASE_ORDERS}/package-service/package-types`;
export const PICKING_SESSIONS_API = `${BASE_ORDERS}/picking-service/sessions`;
export const PICKING_PICKERS_BY_CONFIG_API = `${BASE_ORDERS}/picking-service/pickers/by-config`;

// oms
export const BASE_OMS = `${URL_BASE}/oms-service`;
export const OMS_ORDERS_API = `${BASE_OMS}/orders`;
export const OMS_ORDER_STATUS_API = `${OMS_ORDERS_API}/status`;
export const PRE_ORDER_API = `${BASE_OMS}/pre-order`;
export const PRE_ORDER_LIST_API = `${PRE_ORDER_API}/list`;
export const PRE_ORDER_STATUS_API = `${PRE_ORDER_API}/status`;
export const PRE_ORDER_ISSUE_SUMMARY_API = `${PRE_ORDER_API}/issue-summary`;

// customers
export const BASE_CUSTOMERS = URL_BASE_168_5008;

// warehouses
export const BASE_WAREHOUSES = `${URL_BASE_WAREHOUSES}/api`;
export const COMMERCE_SERVICE_LOCATIONS_SIMPLE = process.env.NEXT_PUBLIC_COMMERCE_SERVICE_LOCATIONS_SIMPLE ?? "";

// catalog
export const BASE_CATALOG = `${URL_BASE}/catalog`;
export const CATALOG_PRODUCTS_API = `${URL_BASE}/catalog/products`;
export const WAREHOUSE_API = `${URL_BASE}/warehouse`;
export const WAREHOUSE_STOCK_API = `${URL_BASE}/stock`;
export const WAREHOUSE_SECURITY_STOCK_API = `${URL_BASE}/security-stock`;
export const WAREHOUSE_STOCK_MOVEMENT_API = `${URL_BASE}/stock-movement`;
export const WAREHOUSE_STOCK_RESERVATION_API = `${URL_BASE}/stock-reservation`;
export const WAREHOUSE_SKU_POSITION_API = `${URL_BASE}/sku-position`;
export const WAREHOUSE_STORED_GOOD_API = `${URL_BASE}/stored-good`;
export const WAREHOUSE_SHRINKAGE_API = `${URL_BASE}/shrinkage`;
export const WAREHOUSE_SUPPLYING_API = `${URL_BASE}/supplying`;
export const WAREHOUSE_PICKUP_POINT_API = `${URL_BASE}/pickup-point`;
export const WAREHOUSE_GROUP_API = `${URL_BASE}/warehouse-group`;

// id service
export const BASE_ID_SERVICE = `${URL_BASE}/idservice`;
export const ID_SERVICE_USERS_API = `${BASE_ID_SERVICE}/usuarios`;

// analysis service
export const BASE_ANALYSIS_SERVICE = process.env.NEXT_PUBLIC_BASE_ANALYSIS_SERVICE;
export const BASE_ANALYSIS_SERVICE_CATALOGO = process.env.NEXT_PUBLIC_BASE_ANALYSIS_SERVICE_CATALOGO;
export const ANALYSIS_SERVICE_API = `${(BASE_ANALYSIS_SERVICE ?? `${BASE_ORDERS}/analysis-service`).replace(/\/$/, "")}`;

// analysis service analytics
export const BASE_ANALYSIS_SERVICE_ANALYTICS = `${URL_BASE}/analytics`;

// BACKOMSMIMBRAL
export const URL_BACKOMS = process.env.NEXT_PUBLIC_URL_BACKOMS;

// MIMBRAL MAPEOS (categorías y mapeos de marketplace)
export const URL_MIMBRAL_MAPEOS = process.env.NEXT_PUBLIC_URL_MIMBRAL_MAPEOS;

// picking service
export const BASE_PICKING_SERVICE = `${URL_BASE}/picking-service`;
export const PICKING_SERVICE_PATH = "picking-service";

// delivery service
export const URL_DELIVERY_SERVICE = process.env.NEXT_PUBLIC_BASE_URL_DELIVERY_SERVICE;
export const BASE_DELIVERY_SERVICE = `${URL_DELIVERY_SERVICE ?? ""}`.replace(/\/$/, "");
export const DELIVERY_COMPANY_ENDPOINT = `${BASE_DELIVERY_SERVICE}/company`;
export const DELIVERY_DRIVER_ENDPOINT = `${BASE_DELIVERY_SERVICE}/driver`;
export const DELIVERY_SHIPPING_CONTAINER_ENDPOINT = `${BASE_DELIVERY_SERVICE}/shipping-container`;
export const DELIVERY_SHIPPING_TYPE_ENDPOINT = `${BASE_DELIVERY_SERVICE}/shipping-type`;
export const DELIVERY_VEHICLE_ENDPOINT = `${BASE_DELIVERY_SERVICE}/vehicle`;
export const DELIVERY_VEHICLE_TYPE_ENDPOINT = `${BASE_DELIVERY_SERVICE}/vehicle-type`;
export const DELIVERY_WINDOW_SCHEMA_ENDPOINT = `${BASE_DELIVERY_SERVICE}/window-schema`;
export const HOLIDAY_ENDPOINT = `${(process.env.NEXT_PUBLIC_BASE_URL_HOLIDAY_SERVICE ?? "https://mercadolibremimbral.loclx.io").replace(/\/$/, "")}/api/holiday`;

// tms service
export const URL_TMS_SERVICE = process.env.NEXT_PUBLIC_BASE_URL_TMS_SERVICE;
export const BASE_TMS_SERVICE = `${URL_TMS_SERVICE ?? ""}`.replace(/\/$/, "");

// pim-service — frontend BFF Mimbral 360 (módulos de marketplace: publicar,
// editar, ofertas, calculadora, etc.).
//
// En DEV local: apunta directo al pim-service (http://localhost:5050).
// En PROD/Docker: va a apuntar al api-gateway con path /api/pim (cuando se
// agregue al services.js del gateway).
//
// pim-service no verifica firma del JWT — solo hace decode para popular
// req.user. Confiamos en el upstream (gateway) en prod, o se permite "no auth"
// en dev local. Los endpoints de /api/pim/* funcionan sin token también
// (compat con Plataforma_Marketplace original).
export const URL_PIM_SERVICE = process.env.NEXT_PUBLIC_URL_PIM_SERVICE;
