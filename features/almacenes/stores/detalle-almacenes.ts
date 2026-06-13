import { create } from "zustand";

export interface Warehouse {
  id: string;
  name: string;
  refId: string;
  location: string;
  group: string;
  canalesVenta: string;
  tasks: string[];
  limitarSellers: boolean;
  inbound: string;
  slotting: string;
  consolidacion: string;
  outbound: string;
  changes: string;
  posicionesTotales: number;
  status: "Active" | "Inactive";
  prioridad: number;
  maxPedidos: number;
  bultos: number;
  itemsSprint: number;

  movimientosPendientes: number;
  porWarehouse: number;
  pedidosCount: number;
  bultosCount: number;
  itemsCount: number;
}

interface WarehouseState {
  warehouse: Warehouse;
  setField: <K extends keyof Warehouse>(key: K, value: Warehouse[K]) => void;
  addTask: (task: string) => void;
  removeTask: (task: string) => void;
  loadWarehouseById: (id: string) => void;
}

/* const mock: Warehouse = {
  id: "1",
  name: "Palermo",
  refId: "PAL",
  location: "Palermo",
  group: "Alto Palermo 1",
  canalesVenta: "Principal",
  tasks: ["Pick products", "Ships orders", "Allows pickup", "+4 others"],
  limitarSellers: false,
  inbound: "Inbound",
  slotting: "Darkstore Slotting",
  consolidacion: "Consolidación",
  outbound: "Outbound Darkstore",
  changes: "Cambios y devoluciones",
  posicionesTotales: 42,
  status: "Active",
  prioridad: 1,
  maxPedidos: 1,
  bultos: 1,
  itemsSprint: 1,

  movimientosPendientes: 5,
  porWarehouse: 2,
  pedidosCount: 4,
  bultosCount: 5,
  itemsCount: 0,
};
 */

const mockWarehouses: Warehouse[] = [
  {
    id: "1",
    name: "Centro Comercial",
    refId: "CCM",
    location: "Santiago Centro",
    group: "Grupo A",
    canalesVenta: "Retail",
    tasks: ["Recepción", "Almacenaje", "Pickeo", "+3 others"],
    limitarSellers: false,
    inbound: "Inbound Centro",
    slotting: "Slotting Estándar",
    consolidacion: "Zona Consolidación 1",
    outbound: "Salida Norte",
    changes: "No aplica",
    posicionesTotales: 100,
    status: "Active",
    prioridad: 2,
    maxPedidos: 150,
    bultos: 50,
    itemsSprint: 300,
    movimientosPendientes: 10,
    porWarehouse: 5,
    pedidosCount: 70,
    bultosCount: 60,
    itemsCount: 420,
  },
  {
    id: "2",
    name: "Devolución",
    refId: "DEV",
    location: "Bodega Sur",
    group: "Grupo B",
    canalesVenta: "Postventa",
    tasks: ["Recepción de devoluciones", "Evaluación", "Re-etiquetado"],
    limitarSellers: true,
    inbound: "Inbound Devoluciones",
    slotting: "Slotting Revisión",
    consolidacion: "Zona B",
    outbound: "Salida Sur",
    changes: "Alta rotación",
    posicionesTotales: 80,
    status: "Active",
    prioridad: 3,
    maxPedidos: 100,
    bultos: 30,
    itemsSprint: 120,
    movimientosPendientes: 8,
    porWarehouse: 2,
    pedidosCount: 40,
    bultosCount: 25,
    itemsCount: 150,
  },
  {
    id: "3",
    name: "Comercio Electrónico",
    refId: "ECO",
    location: "Parque Industrial",
    group: "Grupo C",
    canalesVenta: "E-commerce",
    tasks: ["Pickeo", "Packing", "Etiquetado", "Expedición"],
    limitarSellers: false,
    inbound: "Inbound rápido",
    slotting: "Slotting por SKU",
    consolidacion: "Zona C",
    outbound: "Despacho Urbano",
    changes: "Fluctuación alta",
    posicionesTotales: 150,
    status: "Active",
    prioridad: 1,
    maxPedidos: 200,
    bultos: 80,
    itemsSprint: 500,
    movimientosPendientes: 12,
    porWarehouse: 6,
    pedidosCount: 100,
    bultosCount: 90,
    itemsCount: 650,
  },
  {
    id: "4",
    name: "Control de Pérdida",
    refId: "CPL",
    location: "Centro de Seguridad",
    group: "Grupo D",
    canalesVenta: "Interno",
    tasks: ["Auditoría", "Control stock", "Verificación de pérdidas"],
    limitarSellers: true,
    inbound: "Recepción restringida",
    slotting: "Slotting seguro",
    consolidacion: "Almacenamiento seguro",
    outbound: "Controlado",
    changes: "Poco movimiento",
    posicionesTotales: 60,
    status: "Inactive",
    prioridad: 4,
    maxPedidos: 20,
    bultos: 5,
    itemsSprint: 40,
    movimientosPendientes: 2,
    porWarehouse: 1,
    pedidosCount: 10,
    bultosCount: 6,
    itemsCount: 35,
  },
  {
    id: "5",
    name: "Envíos FULL - Mercado Libre",
    refId: "FULL",
    location: "Centro de Distribución Oriente",
    group: "Grupo E",
    canalesVenta: "ML FULL",
    tasks: ["Inbound ML", "Slotting ML", "Outbound FULL"],
    limitarSellers: false,
    inbound: "Inbound ML",
    slotting: "Slotting FULL",
    consolidacion: "Consolidación ML",
    outbound: "Despacho FULL",
    changes: "Operación intensiva",
    posicionesTotales: 200,
    status: "Active",
    prioridad: 1,
    maxPedidos: 300,
    bultos: 120,
    itemsSprint: 800,
    movimientosPendientes: 20,
    porWarehouse: 10,
    pedidosCount: 150,
    bultosCount: 110,
    itemsCount: 950,
  },
];

/* 
export const useWarehouseStore = create<WarehouseState>((set) => ({
  warehouse: mock,
  setField: (key, value) =>
    set((state) => ({ warehouse: { ...state.warehouse, [key]: value } })),
  addTask: (task) =>
    set((state) => ({
      warehouse: {
        ...state.warehouse,
        tasks: [...state.warehouse.tasks, task],
      },
    })),
  removeTask: (task) =>
    set((state) => ({
      warehouse: {
        ...state.warehouse,
        tasks: state.warehouse.tasks.filter((t) => t !== task),
      },
    })),
}));
 */
export const useWarehouseStore = create<WarehouseState>((set) => ({
  warehouse: mockWarehouses[0], // valor por defecto
  setField: (key, value) =>
    set((state) => ({ warehouse: { ...state.warehouse, [key]: value } })),
  addTask: (task) =>
    set((state) => ({
      warehouse: {
        ...state.warehouse,
        tasks: [...state.warehouse.tasks, task],
      },
    })),
  removeTask: (task) =>
    set((state) => ({
      warehouse: {
        ...state.warehouse,
        tasks: state.warehouse.tasks.filter((t) => t !== task),
      },
    })),
  loadWarehouseById: (id: string) => {
    const found = mockWarehouses.find((w) => w.id === id);
    if (found) {
      set(() => ({ warehouse: found }));
    } else {
      console.warn(`Warehouse with id ${id} not found`);
    }
  },
}));
