// app/mocks/esquemas-entrega.mock.ts
export type Estado = "Activo" | "Inactivo";

export interface VentanaConfig {
    start: string;   // "HH:mm"
    end: string;     // "HH:mm"
    maxEnvios: number;
    maxBultos: number;
    maxItems: number;
}

export interface EsquemaEntregaRow {
    id: number;
    name: string;
    timezone: string;
    status: Estado;
    createdAt: string; // "es-CL"
    updatedAt: string; // "es-CL"
}

export interface EsquemaEntregaRecord extends EsquemaEntregaRow {
    dias: string[];            // Monday..Sunday
    start: string;             // "HH:mm"
    end: string;               // "HH:mm"
    maxEnviosBase: number;
    maxBultosBase: number;
    maxItemsBase: number;

    defaultsMaxEnvios: number;
    defaultsMaxItems: number;
    defaultsMaxBultos: number;
    costoExtraEntrega: number;

    ventanas: VentanaConfig[];

    createdByUsername?: string;
    createdByEmail?: string;
    modifiedByUsername?: string;
    modifiedByEmail?: string;
}

const d = (y: number, m: number, day: number, h = 10, mi = 0) =>
    new Date(y, m - 1, day, h, mi).toLocaleString("es-CL");

const ESQUEMAS_ENTREGA: EsquemaEntregaRecord[] = [
    {
        id: 1,
        name: "Entrega Domicilio Centro",
        timezone: "America/Santiago",
        status: "Activo",
        createdAt: d(2024, 4, 3),
        updatedAt: d(2024, 5, 12, 11, 30),
        dias: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        start: "08:00",
        end: "12:00",
        maxEnviosBase: 120,
        maxBultosBase: 800,
        maxItemsBase: 20000,
        defaultsMaxEnvios: 60,
        defaultsMaxItems: 5000,
        defaultsMaxBultos: 400,
        costoExtraEntrega: 0,
        ventanas: [{ start: "13:00", end: "17:00", maxEnvios: 80, maxBultos: 500, maxItems: 10000 }],
        createdByUsername: "Camila Vargas",
        createdByEmail: "camila@mimbral.cl",
        modifiedByUsername: "Juan Pérez",
        modifiedByEmail: "juan.perez@mimbral.cl",
    },
    {
        id: 2,
        name: "Retiro en Tienda",
        timezone: "America/Santiago",
        status: "Inactivo",
        createdAt: d(2024, 3, 20),
        updatedAt: d(2024, 4, 18, 9, 15),
        dias: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
        start: "09:00",
        end: "13:00",
        maxEnviosBase: 90,
        maxBultosBase: 700,
        maxItemsBase: 15000,
        defaultsMaxEnvios: 40,
        defaultsMaxItems: 4000,
        defaultsMaxBultos: 350,
        costoExtraEntrega: 0,
        ventanas: [{ start: "14:00", end: "18:00", maxEnvios: 60, maxBultos: 300, maxItems: 8000 }],
        createdByUsername: "Sofía Díaz",
        createdByEmail: "sofia@mimbral.cl",
        modifiedByUsername: "Sofía Díaz",
        modifiedByEmail: "sofia@mimbral.cl",
    },
    {
        id: 3,
        name: "Entrega Suburbana",
        timezone: "America/Argentina/Buenos_Aires",
        status: "Activo",
        createdAt: d(2024, 2, 11),
        updatedAt: d(2024, 3, 9),
        dias: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        start: "07:30",
        end: "11:30",
        maxEnviosBase: 100,
        maxBultosBase: 600,
        maxItemsBase: 12000,
        defaultsMaxEnvios: 50,
        defaultsMaxItems: 3000,
        defaultsMaxBultos: 200,
        costoExtraEntrega: 1500,
        ventanas: [{ start: "12:30", end: "16:30", maxEnvios: 70, maxBultos: 400, maxItems: 9000 }],
        createdByUsername: "Marcos Álvarez",
        createdByEmail: "marcos@mimbral.cl",
        modifiedByUsername: "Marcos Álvarez",
        modifiedByEmail: "marcos@mimbral.cl",
    },
    {
        id: 4,
        name: "Entrega Nocturna",
        timezone: "America/Santiago",
        status: "Activo",
        createdAt: d(2024, 1, 28),
        updatedAt: d(2024, 2, 8),
        dias: ["Monday", "Wednesday", "Friday"],
        start: "18:00",
        end: "22:00",
        maxEnviosBase: 60,
        maxBultosBase: 300,
        maxItemsBase: 8000,
        defaultsMaxEnvios: 30,
        defaultsMaxItems: 4000,
        defaultsMaxBultos: 150,
        costoExtraEntrega: 2500,
        ventanas: [],
        createdByUsername: "Equipo Operaciones",
        createdByEmail: "ops@mimbral.cl",
        modifiedByUsername: "Equipo Operaciones",
        modifiedByEmail: "ops@mimbral.cl",
    },
    {
        id: 5,
        name: "Entrega Express",
        timezone: "America/Montevideo",
        status: "Inactivo",
        createdAt: d(2024, 6, 2),
        updatedAt: d(2024, 6, 15),
        dias: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        start: "10:00",
        end: "14:00",
        maxEnviosBase: 140,
        maxBultosBase: 900,
        maxItemsBase: 22000,
        defaultsMaxEnvios: 70,
        defaultsMaxItems: 6000,
        defaultsMaxBultos: 450,
        costoExtraEntrega: 0,
        ventanas: [{ start: "15:00", end: "19:00", maxEnvios: 90, maxBultos: 600, maxItems: 12000 }],
        createdByUsername: "QA Bot",
        createdByEmail: "qa@mimbral.cl",
        modifiedByUsername: "QA Bot",
        modifiedByEmail: "qa@mimbral.cl",
    },
    {
        id: 6,
        name: "Entrega Rural",
        timezone: "America/Santiago",
        status: "Activo",
        createdAt: d(2024, 5, 10),
        updatedAt: d(2024, 6, 1),
        dias: ["Tuesday", "Thursday"],
        start: "07:00",
        end: "12:00",
        maxEnviosBase: 50,
        maxBultosBase: 200,
        maxItemsBase: 6000,
        defaultsMaxEnvios: 25,
        defaultsMaxItems: 3000,
        defaultsMaxBultos: 100,
        costoExtraEntrega: 3000,
        ventanas: [],
        createdByUsername: "Equipo Campo",
        createdByEmail: "campo@mimbral.cl",
        modifiedByUsername: "Equipo Campo",
        modifiedByEmail: "campo@mimbral.cl",
    },
    {
        id: 7,
        name: "Puntos de Entrega Corporativos",
        timezone: "America/Santiago",
        status: "Activo",
        createdAt: d(2024, 7, 1),
        updatedAt: d(2024, 7, 8),
        dias: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        start: "09:00",
        end: "13:00",
        maxEnviosBase: 110,
        maxBultosBase: 750,
        maxItemsBase: 18000,
        defaultsMaxEnvios: 55,
        defaultsMaxItems: 4500,
        defaultsMaxBultos: 375,
        costoExtraEntrega: 0,
        ventanas: [{ start: "14:00", end: "18:00", maxEnvios: 85, maxBultos: 550, maxItems: 10000 }],
        createdByUsername: "Admin",
        createdByEmail: "admin@mimbral.cl",
        modifiedByUsername: "Admin",
        modifiedByEmail: "admin@mimbral.cl",
    },
    {
        id: 8,
        name: "Entrega Programada Weekend",
        timezone: "America/Santiago",
        status: "Inactivo",
        createdAt: d(2024, 4, 1),
        updatedAt: d(2024, 4, 5),
        dias: ["Saturday", "Sunday"],
        start: "10:00",
        end: "16:00",
        maxEnviosBase: 70,
        maxBultosBase: 350,
        maxItemsBase: 9000,
        defaultsMaxEnvios: 35,
        defaultsMaxItems: 4500,
        defaultsMaxBultos: 175,
        costoExtraEntrega: 2000,
        ventanas: [],
        createdByUsername: "Weekend Ops",
        createdByEmail: "weekend@mimbral.cl",
        modifiedByUsername: "Weekend Ops",
        modifiedByEmail: "weekend@mimbral.cl",
    },
];

export function listEsquemasEntrega(): EsquemaEntregaRow[] {
    return ESQUEMAS_ENTREGA.map(({ id, name, timezone, status, createdAt, updatedAt }) => ({
        id, name, timezone, status, createdAt, updatedAt,
    }));
}

export function getEsquemaEntregaById(id: number | string): EsquemaEntregaRecord | undefined {
    const n = typeof id === "string" ? Number(id) : id;
    return ESQUEMAS_ENTREGA.find(e => e.id === n);
}
