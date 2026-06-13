import { Envio, Ruta, Transportista } from "@/features/delivery/types/delivery";

export const mockEnvios: Envio[] = [
  {
    id: "220624-GYYVCU",
    fechaEnvio: "23/06/2022 00:50",
    origen: "Stock_Fizzmod_QA1",
    destino: "Palermo Buenos Aires",
    entrega: {
      inicio: "23/06/2022 00:49",
      fin: "24/06/2022 14:00",
    },
    estado: "Creada",
    tipoEntrega: "Express",
    cliente: {
      nombre: "Bruno Prueba",
      direccion: "Palermo Buenos Aires",
      telefono: "548598807909",
    },
  },
  {
    id: "220625-HZXWDV",
    fechaEnvio: "23/06/2022 10:30",
    origen: "Stock_Fizzmod_QA2",
    destino: "Belgrano Buenos Aires",
    entrega: {
      inicio: "23/06/2022 11:00",
      fin: "24/06/2022 16:00",
    },
    estado: "En Proceso",
    tipoEntrega: "Standard",
    cliente: {
      nombre: "María García",
      direccion: "Belgrano Buenos Aires",
      telefono: "548598807910",
    },
  },
  {
    id: "220626-IAYWEV",
    fechaEnvio: "23/06/2022 14:15",
    origen: "Stock_Fizzmod_QA1",
    destino: "Recoleta Buenos Aires",
    entrega: {
      inicio: "23/06/2022 15:00",
      fin: "24/06/2022 18:00",
    },
    estado: "Finalizada",
    tipoEntrega: "Express",
    cliente: {
      nombre: "Juan Pérez",
      direccion: "Recoleta Buenos Aires",
      telefono: "548598807911",
    },
  },
  {
    id: "220627-JBZXFW",
    fechaEnvio: "23/06/2022 16:45",
    origen: "Stock_Fizzmod_QA3",
    destino: "San Telmo Buenos Aires",
    entrega: {
      inicio: "24/06/2022 09:00",
      fin: "24/06/2022 20:00",
    },
    estado: "Creada",
    tipoEntrega: "Standard",
    cliente: {
      nombre: "Ana Martínez",
      direccion: "San Telmo Buenos Aires",
      telefono: "548598807912",
    },
  },
  {
    id: "220628-KCAYGX",
    fechaEnvio: "23/06/2022 17:30",
    origen: "Stock_Fizzmod_QA2",
    destino: "Villa Crespo Buenos Aires",
    entrega: {
      inicio: "24/06/2022 10:00",
      fin: "24/06/2022 22:00",
    },
    estado: "En Proceso",
    tipoEntrega: "Express",
    cliente: {
      nombre: "Carlos López",
      direccion: "Villa Crespo Buenos Aires",
      telefono: "548598807913",
    },
  },
  {
    id: "220629-LDBZHY",
    fechaEnvio: "24/06/2022 08:00",
    origen: "Stock_Fizzmod_QA1",
    destino: "Caballito Buenos Aires",
    entrega: {
      inicio: "24/06/2022 11:00",
      fin: "25/06/2022 14:00",
    },
    estado: "Finalizada",
    tipoEntrega: "Standard",
    cliente: {
      nombre: "Laura Rodríguez",
      direccion: "Caballito Buenos Aires",
      telefono: "548598807914",
    },
  },
  {
    id: "220630-MECAIZ",
    fechaEnvio: "24/06/2022 09:15",
    origen: "Stock_Fizzmod_QA3",
    destino: "Almagro Buenos Aires",
    entrega: {
      inicio: "24/06/2022 12:00",
      fin: "25/06/2022 16:00",
    },
    estado: "Cancelada",
    tipoEntrega: "Express",
    cliente: {
      nombre: "Diego Sánchez",
      direccion: "Almagro Buenos Aires",
      telefono: "548598807915",
    },
  },
];

export const mockRutas: Ruta[] = [
  {
    id: "#240626-5Y6E11",
    fecha: "26/06/2024 07:04",
    inventarios: ["Balmaceda", "San Javier"],
    entrega: "2",
    infoParadas: "4",
    transportista: "Envio a domicilio",
    programacion: {
      inicio: "28/06/2024 09:00",
      fin: "28/06/2024 12:00",
    },
    operador: "Leonardo - Gambino",
    estado: "Finalizada",
  },
  {
    id: "#240626-6Z7F12",
    fecha: "26/06/2024 08:30",
    inventarios: ["Palermo", "Belgrano"],
    entrega: "3",
    infoParadas: "6",
    transportista: "Express Delivery",
    programacion: {
      inicio: "28/06/2024 10:00",
      fin: "28/06/2024 14:00",
    },
    operador: "Ana - Martínez",
    estado: "En Proceso",
  },
  {
    id: "#240626-7A8G13",
    fecha: "26/06/2024 09:45",
    inventarios: ["Recoleta", "Caballito"],
    entrega: "4",
    infoParadas: "8",
    transportista: "Fast Shipping",
    programacion: {
      inicio: "28/06/2024 11:00",
      fin: "28/06/2024 16:00",
    },
    operador: "Carlos - López",
    estado: "Pendiente",
  },
  {
    id: "#240626-8B9H14",
    fecha: "26/06/2024 11:00",
    inventarios: ["Villa Crespo", "Almagro"],
    entrega: "2",
    infoParadas: "5",
    transportista: "City Express",
    programacion: {
      inicio: "28/06/2024 13:00",
      fin: "28/06/2024 17:00",
    },
    operador: "María - González",
    estado: "Finalizada",
  },
  {
    id: "#240626-9C0I15",
    fecha: "26/06/2024 13:15",
    inventarios: ["San Telmo", "La Boca"],
    entrega: "3",
    infoParadas: "7",
    transportista: "Quick Delivery",
    programacion: {
      inicio: "28/06/2024 14:00",
      fin: "28/06/2024 18:00",
    },
    operador: "Juan - Pérez",
    estado: "En Proceso",
  },
  {
    id: "#240626-0D1J16",
    fecha: "26/06/2024 14:30",
    inventarios: ["Núñez", "Saavedra"],
    entrega: "5",
    infoParadas: "10",
    transportista: "Premium Shipping",
    programacion: {
      inicio: "28/06/2024 15:00",
      fin: "28/06/2024 20:00",
    },
    operador: "Laura - Rodríguez",
    estado: "Pendiente",
  },
  {
    id: "#240626-1E2K17",
    fecha: "26/06/2024 15:45",
    inventarios: ["Flores", "Floresta"],
    entrega: "3",
    infoParadas: "6",
    transportista: "Urban Delivery",
    programacion: {
      inicio: "28/06/2024 16:00",
      fin: "28/06/2024 19:00",
    },
    operador: "Diego - Sánchez",
    estado: "Finalizada",
  },
];

export const mockTransportistas: Transportista[] = [
  {
    ref: "TRANS-001",
    nombre: "Transportadora",
    descripcion: "Transportadora Carrier",
    tipoEnvio: "Express delivery type",
    ubicaciones: ["Palermo 201"],
    diasHabiles: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    restricciones: {
      tiempoMinEntrega: "2 horas",
      volumenMinPermitido: "0.1 m³",
      volumenMaxPermitido: "10 m³",
      pesoMaxPermitido: "100 kg"
    },
    configuracion: {
      estado: "Activo",
      generarRuta: true,
      metodoSegundoFactor: "SMS",
    },
    creador: {
      nombre: "Ismael Garcia",
      email: "ismael@rizzmod.com",
      fechaCreacion: "19/10/2021 15:28:44",
    },
  },
  // Más transportistas mock...
];
