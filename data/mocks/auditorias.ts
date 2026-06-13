import { Auditoria } from "../types/auditorias";

// src/data/mocks/auditoriaMock.ts
export const auditoriaMock: Auditoria[] = [
  {
    id: "240523-7VYBM7",
    entidad: "order",
    refId: "1434491022880-01",
    idEntidad: "664f73a891473bfec7561057",
    inventario: "Palermo",
    controlador: {
      name: "Leonardo Gambino",
      email: "leonardo.gambino@janis.im",
      avatar: "LG",
    },
    estado: "Finalizada",
  },
  {
    id: "240523-OUEYG2",
    entidad: "order",
    refId: "1434491022881-01",
    idEntidad: "664f782acaa341802bbdf163",
    inventario: "Palermo",
    controlador: {
      name: "Leonardo Gambino",
      email: "leonardo.gambino@janis.im",
      avatar: "LG",
    },
    estado: "En curso",
  },
  {
    id: "240523-KJH7H8",
    entidad: "order",
    refId: "1434491022999-02",
    idEntidad: "664f99bca8723c5e78dcf672",
    inventario: "Belgrano",
    controlador: {
      name: "María López",
      email: "maria.lopez@janis.im",
      avatar: "ML",
    },
    estado: "Corregir", // 🔄 Nuevo estado agregado
  },
  {
    id: "240523-XPT9G5",
    entidad: "order",
    refId: "1434491022777-03",
    idEntidad: "664f76a8723bfec756d09987",
    inventario: "Caballito",
    controlador: {
      name: "José Martínez",
      email: "jose.martinez@janis.im",
      avatar: "JM",
    },
    estado: "Error", // 🔄 Nuevo estado agregado
  },
  {
    id: "240523-ZYY89T",
    entidad: "order",
    refId: "1434491022666-04",
    idEntidad: "664f72a863bfcc24576c8871",
    inventario: "Recoleta",
    controlador: {
      name: "Ana Torres",
      email: "ana.torres@janis.im",
      avatar: "AT",
    },
    estado: "Corregir", // 🔄 Otro ejemplo con "Corregir"
  },
  {
    id: "240523-QQP55R",
    entidad: "order",
    refId: "1434491022555-05",
    idEntidad: "664f71b9aa73bcfad56a7742",
    inventario: "San Telmo",
    controlador: {
      name: "Carlos Rivas",
      email: "carlos.rivas@janis.im",
      avatar: "CR",
    },
    estado: "Error", // 🔄 Otro ejemplo con "Error"
  },
];
