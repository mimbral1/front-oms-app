import {
  Package,
  Tag,
  Boxes,
  User,
  MapPin,
  DollarSign,
  CreditCard,
  ShieldCheck,
  Activity,
  Cable,
  Truck,
  Barcode,
  Building2,
  Clock,
  LineChart,
  Eye,
} from "lucide-react";
import type { NativeListConfig } from "./NativeListScreen";

const clp = (n: number) => "$" + n.toLocaleString("es-CL");

export const MODULES: Record<string, NativeListConfig> = {
  packing: {
    title: "Packing",
    subtitle: "Bultos y paquetes en preparación",
    searchPlaceholder: "Bulto, pedido o paquete",
    pills: [
      { key: "all", label: "Todos" },
      { key: "abierto", label: "Abiertos" },
      { key: "cerrado", label: "Cerrados" },
    ],
    items: [
      { id: "P-9012", bucket: "abierto", title: "Bulto #9012", accent: "blue", badges: [{ label: "Abierto", tone: "blue" }], lines: [{ Icon: Package, text: "Pedido #15402 · 3 ítems" }, { Icon: Barcode, text: "Caja M · 1.2 kg" }] },
      { id: "P-9011", bucket: "abierto", title: "Bulto #9011", accent: "blue", badges: [{ label: "Abierto", tone: "blue" }], lines: [{ Icon: Package, text: "Pedido #15399 · 5 ítems" }, { Icon: Barcode, text: "Caja L · 3.8 kg" }] },
      { id: "P-9008", bucket: "cerrado", title: "Bulto #9008", accent: "green", badges: [{ label: "Cerrado", tone: "green" }], lines: [{ Icon: Package, text: "Pedido #15390 · 2 ítems" }, { Icon: Barcode, text: "Caja S · 0.6 kg" }] },
    ],
  },

  catalogo: {
    title: "Catálogo",
    subtitle: "12.450 productos activos",
    searchPlaceholder: "Producto, SKU o marca",
    pills: [
      { key: "all", label: "Todos" },
      { key: "activo", label: "Activos" },
      { key: "sinstock", label: "Sin stock", tone: "red" },
    ],
    items: [
      { id: "SKU-1001", bucket: "activo", title: "Taladro percutor 750W", right: clp(39990), accent: "blue", badges: [{ label: "Activo", tone: "green" }], lines: [{ Icon: Barcode, text: "SKU 100123 · Bosch" }, { Icon: Boxes, text: "Stock: 84 un" }] },
      { id: "SKU-1002", bucket: "sinstock", title: "Set destornilladores 32 pzs", right: clp(12990), accent: "red", badges: [{ label: "Sin stock", tone: "red" }], lines: [{ Icon: Barcode, text: "SKU 100456 · Stanley" }, { Icon: Boxes, text: "Stock: 0 un" }] },
      { id: "SKU-1003", bucket: "activo", title: "Pintura látex blanco 1 gl", right: clp(18990), accent: "blue", badges: [{ label: "Activo", tone: "green" }], lines: [{ Icon: Barcode, text: "SKU 100789 · Sipa" }, { Icon: Boxes, text: "Stock: 210 un" }] },
    ],
  },

  clientes: {
    title: "Clientes",
    subtitle: "Cartera de clientes",
    searchPlaceholder: "Cliente, RUT o email",
    items: [
      { id: "C-1", title: "Christian González Sepúlveda", accent: "blue", badges: [{ label: "Frecuente", tone: "green" }], lines: [{ Icon: User, text: "RUT 16.345.678-9" }, { Icon: MapPin, text: "Maipú · Santiago" }] },
      { id: "C-2", title: "Constructora Andes Ltda.", accent: "blue", badges: [{ label: "Empresa", tone: "blue" }], lines: [{ Icon: User, text: "RUT 76.123.456-7" }, { Icon: MapPin, text: "Quilicura · Santiago" }] },
      { id: "C-3", title: "María Fernanda Rojas", accent: "blue", lines: [{ Icon: User, text: "RUT 18.765.432-1" }, { Icon: MapPin, text: "Ñuñoa · Santiago" }] },
    ],
  },

  ubicaciones: {
    title: "Ubicaciones",
    subtitle: "Tiendas y puntos de operación",
    searchPlaceholder: "Ubicación o comuna",
    items: [
      { id: "U-1", title: "CD Central Pudahuel", accent: "blue", badges: [{ label: "Centro de distribución", tone: "blue" }], lines: [{ Icon: MapPin, text: "Av. Américo Vespucio 1501" }, { Icon: Building2, text: "Pudahuel" }] },
      { id: "U-2", title: "Tienda Mall Plaza Oeste", accent: "blue", badges: [{ label: "Tienda", tone: "green" }], lines: [{ Icon: MapPin, text: "Av. Américo Vespucio 1501" }, { Icon: Building2, text: "Cerrillos" }] },
      { id: "U-3", title: "Tienda Centro", accent: "blue", badges: [{ label: "Tienda", tone: "green" }], lines: [{ Icon: MapPin, text: "Bandera 234" }, { Icon: Building2, text: "Santiago Centro" }] },
    ],
  },

  finanzas: {
    title: "Finanzas",
    subtitle: "Transacciones y conciliaciones",
    searchPlaceholder: "Transacción, documento o RUT",
    pills: [
      { key: "all", label: "Todas" },
      { key: "pagado", label: "Pagadas" },
      { key: "pendiente", label: "Pendientes", tone: "red" },
    ],
    items: [
      { id: "T-5001", bucket: "pagado", title: "Boleta #5001", right: clp(47980), accent: "green", badges: [{ label: "Pagado", tone: "green" }], lines: [{ Icon: CreditCard, text: "Webpay · Crédito" }, { Icon: Clock, text: "Hoy 17:26" }] },
      { id: "T-5000", bucket: "pendiente", title: "Factura #5000", right: clp(289900), accent: "red", badges: [{ label: "Pendiente", tone: "red" }], lines: [{ Icon: DollarSign, text: "Transferencia" }, { Icon: Clock, text: "Hoy 16:10" }] },
      { id: "T-4999", bucket: "pagado", title: "Boleta #4999", right: clp(14990), accent: "green", badges: [{ label: "Pagado", tone: "green" }], lines: [{ Icon: CreditCard, text: "Webpay · Débito" }, { Icon: Clock, text: "Hoy 15:48" }] },
    ],
  },

  cuenta: {
    title: "Cuenta",
    subtitle: "Usuarios, perfiles y permisos",
    searchPlaceholder: "Usuario o perfil",
    showAdd: true,
    items: [
      { id: "A-1", title: "Demo Mimbral", accent: "blue", badges: [{ label: "Administrador", tone: "blue" }], lines: [{ Icon: User, text: "demo@mimbral.cl" }, { Icon: ShieldCheck, text: "Acceso total" }] },
      { id: "A-2", title: "Javiera Soto", accent: "blue", badges: [{ label: "Operador", tone: "green" }], lines: [{ Icon: User, text: "jsoto@mimbral.cl" }, { Icon: ShieldCheck, text: "Picking · Packing" }] },
      { id: "A-3", title: "Matías Díaz", accent: "blue", badges: [{ label: "Operador", tone: "green" }], lines: [{ Icon: User, text: "mdiaz@mimbral.cl" }, { Icon: ShieldCheck, text: "Delivery" }] },
    ],
  },

  monitoreo: {
    title: "Monitoreo",
    subtitle: "Estado de módulos y endpoints",
    searchPlaceholder: "Módulo o endpoint",
    showAdd: false,
    pills: [
      { key: "all", label: "Todos" },
      { key: "ok", label: "Operativos" },
      { key: "caido", label: "Con fallas", tone: "red" },
    ],
    items: [
      { id: "M-1", bucket: "ok", title: "OMS · Pedidos", accent: "green", badges: [{ label: "Operativo", tone: "green" }], lines: [{ Icon: Activity, text: "Latencia 120 ms" }, { Icon: Clock, text: "Último check: 30s" }] },
      { id: "M-2", bucket: "caido", title: "Delivery Service", accent: "red", badges: [{ label: "Con fallas", tone: "red" }], lines: [{ Icon: Activity, text: "Timeout · 2 reintentos" }, { Icon: Clock, text: "Último check: 12s" }] },
      { id: "M-3", bucket: "ok", title: "Catálogo · PIM", accent: "green", badges: [{ label: "Operativo", tone: "green" }], lines: [{ Icon: Activity, text: "Latencia 240 ms" }, { Icon: Clock, text: "Último check: 45s" }] },
    ],
  },

  integracion: {
    title: "Integración",
    subtitle: "Conectores y marketplaces",
    searchPlaceholder: "Integración o canal",
    pills: [
      { key: "all", label: "Todas" },
      { key: "ok", label: "Conectadas" },
      { key: "error", label: "Con error", tone: "red" },
    ],
    items: [
      { id: "I-1", bucket: "ok", title: "Mercado Libre", accent: "green", badges: [{ label: "Conectada", tone: "green" }], lines: [{ Icon: Cable, text: "Sincronizado · 2 min" }, { Icon: Truck, text: "Fulfillment Full" }] },
      { id: "I-2", bucket: "ok", title: "Falabella", accent: "green", badges: [{ label: "Conectada", tone: "green" }], lines: [{ Icon: Cable, text: "Sincronizado · 8 min" }, { Icon: Tag, text: "Marketplace" }] },
      { id: "I-3", bucket: "error", title: "VTEX", accent: "red", badges: [{ label: "Con error", tone: "red" }], lines: [{ Icon: Cable, text: "Token expirado" }, { Icon: Clock, text: "Falló hace 1 h" }] },
    ],
  },

  insumos: {
    title: "Insumos",
    subtitle: "Materiales y consumibles",
    searchPlaceholder: "Insumo o código",
    items: [
      { id: "IN-1", title: "Cinta de embalaje", right: "320 un", accent: "blue", lines: [{ Icon: Boxes, text: "Bodega CD Central" }] },
      { id: "IN-2", title: "Etiquetas térmicas", right: "5.000 un", accent: "blue", lines: [{ Icon: Boxes, text: "Bodega CD Central" }] },
      { id: "IN-3", title: "Cajas medianas", right: "0 un", accent: "red", badges: [{ label: "Reponer", tone: "red" }], lines: [{ Icon: Boxes, text: "Bodega Norte" }] },
    ],
  },

  "monitor-competidores": {
    title: "Monitor de competidores",
    subtitle: "Precios de la competencia",
    searchPlaceholder: "Producto o competidor",
    items: [
      { id: "MC-1", title: "Taladro percutor 750W", right: clp(39990), accent: "amber", badges: [{ label: "Sodimac +8%", tone: "amber" }], lines: [{ Icon: LineChart, text: "Tu precio vs. mercado" }] },
      { id: "MC-2", title: "Set destornilladores 32 pzs", right: clp(12990), accent: "green", badges: [{ label: "Easy -3%", tone: "green" }], lines: [{ Icon: Eye, text: "Más barato que la competencia" }] },
    ],
  },

  "reporte-ventas": {
    title: "Reporte de Ventas",
    subtitle: "Resumen del día",
    searchPlaceholder: "Canal o periodo",
    showAdd: false,
    items: [
      { id: "RV-1", title: "Ventas hoy", right: clp(2480500), accent: "green", lines: [{ Icon: LineChart, text: "128 pedidos · ticket prom. $19.379" }] },
      { id: "RV-2", title: "Mercado Libre", right: clp(1290000), accent: "blue", lines: [{ Icon: LineChart, text: "64 pedidos" }] },
      { id: "RV-3", title: "Tienda web", right: clp(890500), accent: "blue", lines: [{ Icon: LineChart, text: "41 pedidos" }] },
    ],
  },
};
