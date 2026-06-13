// lib\menu-items.tsx

"use client";

import { JSX } from "react";
import {
    ShoppingCartIcon,
    UserIcon,
    DocumentIcon,
    CurrencyDollarIcon,
    TruckIcon,
    MapPinIcon,
    BuildingStorefrontIcon,
    ClipboardDocumentListIcon,
    CubeIcon,
} from "@heroicons/react/24/outline";
import PermContactCalendarOutlinedIcon from "@mui/icons-material/PermContactCalendarOutlined";
import IntegrationInstructionsOutlinedIcon from "@mui/icons-material/IntegrationInstructionsOutlined";
import { ChartColumnIcon, ChartNetworkIcon, LogOutIcon, MegaphoneIcon, NotepadText, SearchIcon } from "lucide-react";

/** Mantengo exactamente el mismo shape que usas en sidebar.tsx */
export interface SubMenuItem {
    text: string;
    route?: string;
    hasSubItems?: boolean;
    subItems?: SubMenuItem[];
}

export interface MenuItem {
    text: string;
    icon: JSX.Element;
    route?: string;
    hasSubSidebar?: boolean;
    subSidebarItems?: SubMenuItem[];
    onClick?: () => void; // caso Logout
    group?: string;
}

/**
 * Builder para inyectar dependencias (ej: logout) sin acoplarse a AuthContext.
 * Así podemos reutilizar el mismo menú en Sidebar y en Mimbral 360.
 */
export const buildMenuItems = (logout: () => void): MenuItem[] => [
    {
        text: "Pedidos",
        icon: <ShoppingCartIcon className="h-6 w-6" />,
        group: "Ventas",
        hasSubSidebar: true,
        subSidebarItems: [
            { text: "Listado de pedidos", route: "/pedidos/listado-pedidos" },
            { text: "Crear pedido", route: "/pedidos/listado-pedidos/nuevo" },
            { text: "Crear cotización", route: "/pedidos/listado-pedidos/nueva-cotizacion" },
            { text: "Grupo de pedidos", route: "/pedidos/grupos" },
            {
                text: "Pre-venta",
                hasSubItems: true,
                subItems: [
                    { text: "Crear Pre-venta", route: "/pedidos/listado-pedidos/nueva-pre-venta" },
                    { text: "Listado de Pre-ventas", route: "/pedidos/pre-venta" },
                    { text: "Solicitudes de sobrecupo", route: "/pedidos/sobrecupo" },
                ],
            },
            {
                text: "Listado de auditorias",
                route: "/pedidos/auditorias",
                hasSubItems: true,
                subItems: [
                    {
                        text: "Auditorias",
                        route: "/pedidos/auditorias/all",
                    },
                    {
                        text: "Reglas de auditoria",
                        route: "/pedidos/auditorias/rules",
                    },
                    { text: "Tipos de Auditoria", route: "/pedidos/auditorias/tipos" },
                ],
            },
            { text: "Control de pedidos", route: "/pedidos/control" },
            {
                text: "Monitores de pedidos",
                route: "/pedidos/monitores",
                hasSubItems: true,
                subItems: [
                    { text: "Pedidos Express", route: "/pedidos/monitores/express" },
                    { text: "Pedidos Pickup", route: "/pedidos/monitores/pickup" },
                    {
                        text: "Pedidos por Almacén",
                        route: "/pedidos/monitores/warehouse",
                    },
                    {
                        text: "Pedidos por Locacion",
                        route: "/pedidos/monitores/location",
                    },
                    {
                        text: "Pedidos por canal de venta",
                        route: "/pedidos/monitores/channel",
                    },
                    {
                        text: "Demanda por Productos",
                        route: "/pedidos/monitores/products",
                    },
                    {
                        text: "Pedidos por Ventana de entrega",
                        route: "/pedidos/monitores/window",
                    },
                ],
            },
            {
                text: "Configuraciones",
                hasSubItems: true,
                subItems: [
                    { text: "Perfiles Fulfillment", route: "/pedidos/configuraciones/perfiles-fulfillment" },
                    { text: "Perfiles de importación", route: "/pedidos/configuraciones/perfiles-importacion" },
                    { text: "Configuraciones DOM", route: "/configuraciones/dom" },
                    { text: "Configuraciones OMS", route: "/configuraciones/oms/vtex" },
                ],
            },
            { text: "Estadísticas de Pedidos", route: "/pedidos/estadisticas-pedidos" },
        ],
    },
    {
        text: "Picking",
        icon: <ClipboardDocumentListIcon className="h-6 w-6" />,
        group: "Ventas",
        hasSubSidebar: true,
        subSidebarItems: [
            { text: "Rondas", route: "/picking/rondas" },
            {
                text: "Olas",
                hasSubItems: true,
                subItems: [
                    {
                        text: 'Listado de olas',
                        route: "/picking/olas/listar-olas",
                    },
                    {
                        text: 'Esquema de horario',
                        route: '/picking/olas/esquema-horario',
                    },
                ],
            },

            {
                text: "Configuraciones",
                hasSubItems: true,
                subItems: [
                    {
                        text: "Pickers",
                        route: "/picking/configuraciones/pickers",
                    },
                    // {
                    //     text: "Esquemas Horarios",
                    //     route: "/picking/configuraciones/esquemas",
                    // },
                    {
                        text: "Multipicking",
                        hasSubItems: true,
                        subItems: [
                            {
                                text: "Sectores de picking",
                                route: "/picking/configuraciones/multipicking/sectores",
                            },
                            {
                                text: "Esquema de picking",
                                route: "/picking/configuraciones/multipicking/esquemas",
                            },
                        ],
                    },
                    {
                        text: "Configuraciones de picking",
                        route: "/picking/configuraciones/configuraciones-picking",
                    },
                ],
            },
            {
                text: "Control de Picking",
                hasSubItems: true,
                subItems: [
                    { text: "Productividad", route: "/picking/productividad" },
                    { text: "Reporte de Faltantes", route: "/picking/faltantes" },
                    { text: "Productos Preparables", route: "/picking/preparables" },
                ],
            },

            {
                text: 'Reportes',
                hasSubItems: true,
                subItems: [
                    {
                        text: 'Productividad de pickers',
                        route: '/picking/reportes/productividad-de-pickers'
                    },
                    {
                        text: 'Reportes de faltantes',
                        route: '/picking/reportes/reportes-de-faltantes'
                    },
                    {
                        text: 'Reporte de sustitución',
                        route: '/picking/reportes/reporte-de-sustitucion'
                    },
                    {
                        text: 'Reporte de faltantes y sustituciones por tienda',
                        route: '/picking/reportes/reporte-faltantes-y-sustituciones-por-tienda'
                    },
                    {
                        text: 'Reporte de faltantes agrupado por producto',
                        route: '/picking/reportes/reporte-de-faltantes-agrupado-por-producto'
                    }
                ]
            },
            {
                text: 'Monitor de Picking',
                route: '/picking/monitor-picking'
            }
        ],
    },
    {
        text: "Packing",
        icon: <CubeIcon className="h-6 w-6" />,
        group: "Ventas",
        hasSubSidebar: true,
        subSidebarItems: [
            { text: "Bultos", route: "/picking/Bultos" },
            { text: "Packing", route: "/picking/packing/all" },
            { text: "Tipos de paquetes", route: "/picking/packing/tipos-de-paquetes" },
            { text: "Creación de paquetes", route: "/picking/packing/creacion-de-paquetes" },
            { text: "Etiqueta de Packing", route: "/picking/packing/etiquetas-de-packing" },
            { text: "Trackeo de paquetes", route: "/picking/packing/trackeo-de-paquetes" },
            { text: "Repacking", route: "/picking/packing/repacking" },
        ],
    },
    {
        text: "Delivery",
        icon: <TruckIcon className="h-6 w-6" />,
        group: "Ventas",
        hasSubSidebar: true,
        subSidebarItems: [
            { text: "Envíos", route: "/delivery/envios" },
            {
                text: "Rutas",
                route: "/delivery/rutas",
                hasSubItems: true,
                subItems: [
                    {
                        text: "Listado de rutas",
                        route: "/delivery/rutas/listado-rutas"
                    },
                    {
                        text: "Seguimiento de entregas",
                        route: "/delivery/rutas/seguimiento-entregas"
                    },
                ]
            },
            {
                text: "Transportistas",
                route: "/delivery/transportistas",
                hasSubItems: true,
                subItems: [
                    {
                        text: "Listado de transportistas",
                        route: "/delivery/transportistas/listado-transportistas",
                    },
                    {
                        text: "Slots de entrega",
                        route: "/delivery/transportistas/slots",
                    },
                    {
                        text: "Grupo de Transportistas",
                        route: "/delivery/transportistas/grupo-transportistas",
                    },
                ],
            },
            {
                text: "Seguimiento",
                hasSubItems: true,
                subItems: [
                    {
                        text: "Paquetes",
                        route: "/delivery/seguimiento/paquetes",
                    },
                ],
            },
            {
                text: "Contenedores y etiquetas",
                route: "/delivery/contenedores-etiquetas",
                hasSubItems: true,
                subItems: [
                    {
                        text: "Contenedores",
                        route: "/delivery/contenedores-etiquetas/contenedores",
                    },
                    {
                        text: "Tipos de contenedores",
                        route: "/delivery/contenedores-etiquetas/tipos-contenedor",
                    },
                    {
                        text: "Etiquetas",
                        route: "/delivery/contenedores-etiquetas/etiquetas",
                    },
                    {
                        text: "Plantillas de etiqueta",
                        route: "/delivery/contenedores-etiquetas/plantillas-etiqueta",
                    },
                ],
            },
            {
                text: "Configuraciones",
                route: "/delivery/configuraciones",
                hasSubItems: true,
                subItems: [
                    {
                        text: "Métodos de entrega",
                        route: "/delivery/configuraciones/metodos-entrega"
                    },
                    {
                        text: "Esquemas de entrega",
                        route: "/delivery/configuraciones/esquemas-entrega"
                    },
                    {
                        text: "Feriados",
                        route: "/delivery/configuraciones/feriados"
                    },
                    {
                        text: "Horarios",
                        route: "/delivery/configuraciones/horarios"
                    },
                    {
                        text: "Restricciones de entrega",
                        route: "/delivery/configuraciones/restricciones-entrega"
                    }
                ]
            },
            {
                text: "Estadísticas de entrega", route: "/delivery/estadisticas-entrega"
            },
            {
                text: "Flota",
                hasSubItems: true,
                subItems: [
                    {
                        text: "Tipo de vehículo",
                        route: "/delivery/flota/tipo-de-vehiculo",
                    },
                    { text: "Vehículos", route: "/delivery/flota/vehiculos" },
                    { text: "Conductores", route: "/delivery/flota/conductores" },
                    {
                        text: "Productividad de conductores",
                        route: "/delivery/flota/productividad-conductores",
                    },
                ],
            },
            {
                text: "Tms",
                route: "/delivery/rutas",
                hasSubItems: true,
                subItems: [
                    {
                        text: "Simulación de rutas",
                        route: "/delivery/tms/simulacion-ruta"
                    }
                ]
            },
        ],
    },
    /* {
      text: "Clientes",
      icon: <UserIcon className="h-6 w-6" />,
      hasSubSidebar: true,
      subSidebarItems: [
        { text: "Lista de Clientes", route: "/clientes" },
        { text: "Grupos", route: "/clientes/grupos" },
      ],
    }, */
    {
        text: "Catálogo",
        icon: <DocumentIcon className="h-6 w-6" />,
        group: "Catálogo e Inventario",
        hasSubSidebar: true,
        subSidebarItems: [
            { text: "Productos", route: "/catalogo/productos" },
            { text: "SKUs", route: "/catalogo/skus" },
            {
                text: "Atributos",
                hasSubItems: true,
                subItems: [
                    { text: "Atributos", route: "/catalogo/atributos" },
                    { text: "Grupo de atributos", route: "/catalogo/grupo-atributos" },
                    { text: "Set de atributos", route: "/catalogo/set-atributos" },
                ],
            },
            {
                text: "Categorías",
                hasSubItems: true,
                subItems: [
                    { text: "Listado de categorías", route: "/catalogo/categorias" },
                ]
            },
            {
                text: "Marcas",
                hasSubItems: true,
                subItems: [
                    { text: "Listado de marcas", route: "/catalogo/marcas" },
                ]
            },
            {
                text: "Precios",
                hasSubItems: true,
                subItems: [
                    { text: "Listado de precios", route: "/catalogo/precios/precio" },
                    { text: "Precio Base", route: "/catalogo/precios/precio-base" },
                    { text: "Hoja de Precios", route: "/catalogo/precios/hoja-de-precios", },
                ],
            },
            {
                text: "Configuraciones",
                hasSubItems: true,
                subItems: [
                    { text: "Esquemas de códigos de barras", route: "/catalogo/configuraciones-catalogo/esquemas-codigos-barra" },
                    { text: "Unidades de medida", route: "/catalogo/configuraciones-catalogo/unidades-medida" },
                    { text: "Etiquetas de precios", route: "/catalogo/configuraciones-catalogo/etiquetas-de-precio" },
                    { text: "Grupos de productos", route: "/catalogo/configuraciones-catalogo/grupos-de-productos" },
                ],
            },
            {
                // Plataforma de ecommerce: ML/Fala/VTEX como leaf links que
                // van DIRECTO al dashboard del canal. La navegación interna
                // (11 secciones: Dashboard, Catálogo, Productos, Atributos,
                // Publicar, Calculadora, Carga masiva, Ofertas, Mapeo cats,
                // Mapeo attrs, Configuración) vive en un sub-sidebar
                // contextual hover-expand dentro del layout de cada
                // marketplace — ver `app/catalogo/plataforma-ecommerce/
                // _shared/EcommerceSubSidebar.tsx`.
                //
                // Esto evita los ~33 items nested que antes contaminaban el
                // sidebar global (mockup `ml-nav-explorations.html`, opción
                // A+C combinada).
                text: "Plataforma de ecommerce",
                hasSubItems: true,
                subItems: [
                    {
                        text: "MercadoLibre",
                        route: "/catalogo/plataforma-ecommerce/mercadolibre/dashboard",
                    },
                    {
                        text: "Falabella",
                        route: "/catalogo/plataforma-ecommerce/falabella/dashboard",
                    },
                    {
                        text: "VTEX",
                        route: "/catalogo/plataforma-ecommerce/vtex/dashboard",
                    },
                ],
            },
            // {
            //     text: "Monitoreo de competencia",
            //     route: "/catalogo/monitoreo-competencia"
            // },
        ],
    },
    {
        text: "Almacén",
        icon: <BuildingStorefrontIcon className="h-6 w-6" />,
        group: "Catálogo e Inventario",
        hasSubSidebar: true,
        subSidebarItems: [
            { text: "Almacenes", route: "/almacen/almacenes" },
            {
                text: "Recepción de Pedidos",
                route: "/almacen/gestion/recepcion-pedidos",
            },
            {
                text: "Inventario",
                hasSubItems: true,
                subItems: [
                    {
                        text: "Stock",
                        route: "/almacen/inventario/stock",
                    },
                    {
                        text: "Reservas de stock",
                        route: "/almacen/inventario/stock-reservado",
                    },
                    {
                        text: "Cambios de stock",
                        route: "/almacen/inventario/cambios-stock",
                    },
                    {
                        text: "Stock de seguridad",
                        route: "/almacen/inventario/stock-de-seguridad",
                    },
                    {
                        text: "Stock control",
                        route: "/almacen/inventario/control-de-inventario",
                    },
                    {
                        text: "Almacenamiento por posicion",
                        route: "/almacen/inventario/almacenamiento-por-posicion",
                    },
                ],
            },
            {
                text: "Gestión de Mercaderia",
                hasSubItems: true,
                subItems: [
                    // {
                    //     text: "Órdenes de Compra",
                    //     route: "/almacen/gestion/ordenes-compra",
                    // },
                    {
                        text: "Ordenes de compra",
                        route: "/almacen/gestion/ordenes-compra",
                    },
                    {
                        text: "Solicitud de traslado",
                        route: "/almacen/gestion/solicitud-traslado",
                    },
                    {
                        text: "Movimientos de inventario",
                        route: "/almacen/gestion/movimiento",
                    },
                    {
                        text: "Stock Decisión",
                        route: "/almacen/gestion/stock-decision",
                    },
                    {
                        text: "Proveedores",
                        route: "/almacen/gestion/proveedores",
                    },
                    {
                        text: "Sprints",
                        route: "/almacen/gestion/sprints",
                    },
                ],
            },
            {
                text: "Configuraciones",
                hasSubItems: true,
                subItems: [
                    {
                        text: "Esquema de almacén",
                        route: "/almacen/configuracion/esquema",
                    },
                    {
                        text: "Grupo de almacénes",
                        route: "/almacen/configuracion/grupos",
                    },
                    {
                        text: "Etiquetas de Slots(template)",
                        route: "/almacen/configuracion/etiquetas",
                    },
                    {
                        text: "Configuraciones",
                        route: "/almacen/configuracion/configuraciones",
                    },
                    {
                        text: "Sources",
                        route: "/almacen/configuracion/sources",
                    },
                    {
                        text: "Tipos de cambios de stock",
                        route: "/almacen/configuracion/tipos-cambios-stock",
                    },
                    {
                        text: "Slots",
                        route: "/almacen/configuracion/slots",
                    },
                ],
            },
            {
                text: "Reportes",
                hasSubItems: true,
                subItems: [
                    {
                        text: "Producos detenidos",
                        route: "/almacen/reportes/productos-detenidos",
                    },
                    {
                        text: "Productos sin venta",
                        route: "/almacen/reportes/productos-sin-venta",
                    },
                    {
                        text: "Productos riesgo de quiebre",
                        route: "/almacen/reportes/produtcos-riesgo-quiebre",
                    },
                    {
                        text: "Productos sobre stockeados",
                        route: "/almacen/reportes/productos-sobre-stockeados",
                    },
                    {
                        text: "Cobertura de stock por SKU",
                        route: "/almacen/reportes/cobertura-stock-por-sku",
                    },
                ],
            },
        ],
    },
    {
        text: "Insumos",
        icon: <NotepadText className="h-6 w-6" />,
        group: "Operaciones",
        hasSubSidebar: true,
        subSidebarItems: [
            {
                text: "Solicitudes",
                route: "/control-insumos/solicitudes"
            },
            {
                text: "Aprobaciones",
                route: "/control-insumos/aprobaciones"
            },
            {
                text: "Stock por bodega",
                route: "/control-insumos/stock-bodega"

            },
            {
                text: "Traslados",
                route: "/control-insumos/traslados"
            }
        ]
    },
    {
        text: "Monitor de competidores",
        icon: <ChartNetworkIcon className="h-6 w-6" />,
        group: "Operaciones",
        hasSubSidebar: true,
        subSidebarItems: [
            {
                text: "Pricing",
                route: "/monitor-competidores/pricing"
            },
            {
                text: "General",
                route: "/monitor-competidores/general"
            },
            {
                text: "Categoría",
                route: "/monitor-competidores/categoria"
            },
            {
                text: "Marca",
                route: "/monitor-competidores/marca"
            },
            {
                text: "Competidor",
                route: "/monitor-competidores/competidor"
            },
            {
                text: "Oportunidades",
                route: "/monitor-competidores/oportunidades"
            },
            {
                text: "Inventario",
                route: "/monitor-competidores/inventario"
            },
        ]
    },
    {
        text: "Reporte Ventas",
        icon: <ChartColumnIcon className="h-6 w-6" />,
        group: "Operaciones",
        hasSubSidebar: true,
        subSidebarItems: [
            {
                text: "Resumen de ventas",
                route: "/reporte-ventas/resumen-ventas"
            },
            {
                text: "Ventas por categoría",
                route: "/reporte-ventas/ventas-por-categoria"
            },
            {
                text: "Ventas por vendedor",
                route: "/reporte-ventas/ventas-por-vendedor"
            },
            {
                text: "Ventas por producto",
                route: "/reporte-ventas/ventas-por-producto"
            },
            {
                text: "Monitor de metas",
                route: "/reporte-ventas/monitor-metas"
            },
        ]
    },
    {
        text: "Clientes",
        icon: <PermContactCalendarOutlinedIcon className="h-6 w-6" />,
        group: "CRM",
        hasSubSidebar: true,
        subSidebarItems: [
            // {
            //     text: "Mesa de ayuda",
            //     route: "/ayuda",
            //     hasSubItems: true,
            //     subItems: [{ text: "", route: "" }],
            // },
            { text: "Listado Clientes", route: "/customers/clientes" },
            { text: "Crédito Clientes", route: "/customers/credito-clientes" },
            { text: "Direcciones", route: "/customers/direcciones" },
            {
                text: "Customer Success",
                route: "/customers/customer-success",
                hasSubItems: true,
                subItems: [{ text: "", route: "" }],
            },
            { text: "Grupo de clientes", route: "/customers/grupo-clientes" },
            { text: "Configuraciones", route: "/customers/configuraciones" },
            {
                text: "Logística inversa (RMS)",
                route: "/customers/logistica",
                hasSubItems: true,
                subItems: [
                    { text: "Flujos de RMS", route: "/customers/logistica/flujos" },
                    {
                        text: "Solicitudes de RMS",
                        route: "/customers/logistica/solicitudes",
                    },
                ],
            },
            {
                text: "CSX (Customer Service Excellent)",
                route: "/customers/csx",
                hasSubItems: true,
                subItems: [
                    { text: "Canales", route: "/customers/csx/canales" },
                    { text: "Motivos", route: "/customers/csx/motivos" },
                    { text: "Tipo Motivo", route: "/customers/csx/tipo-motivo" },
                    { text: "Estados de tickets", route: "/customers/csx/estado-ticket" },
                    { text: "Transiciones tickets", route: "/customers/csx/transiciones-tickets" },
                    { text: "Tickets", route: "/customers/csx/tickets" },
                ],
            },
            {
                text: "Reportes",
                route: "/customers/reportes",
                hasSubItems: true,
                subItems: [
                    { text: "Clientes por categoría", route: "/customers/reportes/clientes-por-categoria" }
                ]
            }
        ],
    },
    {
        text: "Ubicaciones",
        icon: <MapPinIcon className="h-6 w-6" />,
        group: "CRM",
        hasSubSidebar: true,
        subSidebarItems: [
            { text: "Listado de ubicaciones", route: "/ubicaciones/listado-ubicaciones" },
            { text: "Tiendas", route: "/ubicaciones/stores" },
            {
                text: "Puntos de picking",
                route: "/ubicaciones/picking-points",
                hasSubItems: false,
            },
            { text: "Geofences", route: "/ubicaciones/geocercas" },
            { text: "Puntos de pickup", route: "/ubicaciones/pickup-points" },
        ],
    },
    {
        text: "Finanzas",
        icon: <CurrencyDollarIcon className="h-6 w-6" />,
        group: "Finanzas",
        hasSubSidebar: true,
        subSidebarItems: [
            { text: "Transacciones", route: "/finanzas/transacciones" },
            { text: "Formularios", route: "/finanzas/formularios" },
            { text: "Autorizacion de credito", route: "/finanzas/pre-ventas" },
            { text: "Cotizaciones", route: "/finanzas/cotizaciones" },
            {
                text: "Conciliaciones MercadoLibre Full",
                route: "/finanzas/conciliaciones-mercadolibre-full",
            },
            {
                text: "Reportes",
                hasSubItems: true,
                subItems: [
                    {
                        text: "Notas de crédito",
                        route: "/finanzas/reportes/notas-de-credito"
                    }
                ]
            }
        ],
    },
    {
        text: "Cuenta",
        icon: <UserIcon className="h-6 w-6" />,
        group: "Administración",
        hasSubSidebar: true,
        subSidebarItems: [
            {
                text: "Cuentas de comercio",
                hasSubItems: true,
                subItems: [
                    { text: "Listado de cuentas", route: "/cuenta/cuentas-comercio/cuentas" },
                    {
                        text: "Canales de venta",
                        route: "/cuenta/cuentas-comercio/canales-venta",
                    },
                    {
                        text: "Vendedores",
                        route: "/cuenta/cuentas-comercio/sellers",
                    },
                ],
            },
            { text: "Perfiles", route: "/cuenta/perfiles" },
            {
                text: "Usuarios",
                hasSubItems: true,
                subItems: [
                    { text: "Listado de usuarios", route: "/cuenta/usuarios/listado-usuarios" },
                    {
                        text: "Usuarios Pendientes",
                        route: "/cuenta/usuarios/pendientes",
                    },
                    {
                        text: "LLaves de seguridad",
                        route: "/cuenta/usuarios/llaves-de-seguridad",
                    },
                ],
            },
            { text: "Push Notifications", route: "/cuenta/push-notifications" },
            { text: "Webhook", route: "/cuenta/webhooks" },
            {
                text: "Acciones masivas",
                hasSubItems: true,
                subItems: [
                    {
                        text: "Importaciones",
                        route: "/cuenta/acciones-masivas/importaciones",
                    },
                    {
                        text: "Exportaciones",
                        route: "/cuenta/acciones-masivas/exportaciones",
                    },
                    {
                        text: "Documentos",
                        route: "/cuenta/acciones-masivas/documentos",
                    },
                ],
            },
            {
                text: "Trace - Logs",
                hasSubItems: true,
                subItems: [
                    { text: "Logs", route: "/cuenta/trace/logs" },
                    { text: "Importar logs", route: "/cuenta/trace/importar-logs" },
                ],
            },
            { text: "Organización", route: "/cuenta/organizacion" },
            { text: "Razones sociales", route: "" },
            { text: "Abm de motivos", route: "/cuenta/abm-motivos" },
            {
                text: "Centro de mensajes",
                hasSubItems: true,
                subItems: [
                    { text: "Templates", route: "/cuenta/centro-mensajes/templates-page" },
                    { text: "Configuración de SMTP", route: "/cuenta/centro-mensajes/smtp" },
                    {
                        text: "Emails (Registro de correos enviados)",
                        route: "/cuenta/usuarios/pendientes",
                    },
                    {
                        text: "Email para pedido pendiente de retiro",
                        route: "/cuenta/centro-mensajes/email-pendientes-retiro",
                    },
                    {
                        text: "WhatsApp Business",
                        route: "/cuenta/usuarios/llaves-de-seguridad",
                    },
                ],
            },
        ],
    },
    {
        text: "Monitoreo",
        icon: <IntegrationInstructionsOutlinedIcon className="h-6 w-6" />,
        group: "Administración",
        hasSubSidebar: true,
        subSidebarItems: [
            { text: "Adm. Módulos y endpoints", route: "/monitoreo/adm-modulos-endpoints" },
            { text: "Monitoreo integraciones", route: "/monitoreo/monitoreo-integraciones" },
        ],
    },
    /*  {
      text: "Integracion",
      icon: <ClipboardDocumentIcon className="h-6 w-6" />,
      route: "/integracion",
    }, */
    {
        text: "Alertas",
        icon: <MegaphoneIcon className='h-6 w-6' />,
        hasSubSidebar: false,
        route: ""
    },
    {
        text: "Buscador",
        icon: <SearchIcon className='h-6 w-6' />,
    },
    // {
    //     text: "LogOut",
    //     icon: <LogOutIcon className="h-6 w-6" />,
    //     onClick: logout
    // },
];

export const logoutMenuItem = (logout: () => void): MenuItem => ({
    text: "Cerrar sesión",
    icon: <LogOutIcon className="h-6 w-6" />,
    onClick: logout,
});
