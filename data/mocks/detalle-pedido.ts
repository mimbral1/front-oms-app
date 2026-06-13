// /data/mocks/detalle-pedido.ts

export type MockItem = {
  id: string;
  name: string;
  imageUrl?: string;
  sku?: string;
  barcode?: string;
  price: number;
  quantity: number;
  total: number;
  criteria?: string;     // "No sustituir" / "Criterio de tienda" / "Misma marca"
  storeCode?: string;    // p.ej. "625681eb32bf20..."
  isSubstitute?: boolean;
};

export type MockSession = {
  code: string;          // p.ej. "230102-H9F2TN"
  status: "Pendiente" | "Pickeada" | "A completar" | "Picking" | "Confirmando sustit...";
  zone: string;          // NOMBRE DEL GRUPO visible: "FOOD", "ACERO INOXIDABLE..." etc.
  date?: string;         // "2023-02-01 15:01"
  assigned?: string;     // "Sin asignar" / nombre
  items: MockItem[];
};


// ========= SUELTOS =========
export const mockItems: MockItem[] = [
  {
    id: "itm-111882",
    name: "Abita Amber",
    imageUrl: "https://cdn.minibardelivery.com/products/96703/product/2_17498126.jpg",
    sku: "111882",
    barcode: "3620909201918",
    price: 123.28,
    quantity: 4,
    total: 493.12,
    criteria: "No sustituir",
    storeCode: "65662292cc0d…",
  },
  {
    id: "itm-115511",
    name: "Té Verde Puro Descafeinado Orgánico Steep",
    imageUrl: "https://images-na.ssl-images-amazon.com/images/I/81ObKONCKSL._AC_UL600_SR600,600_.jpg",
    sku: "115511",
    barcode: "3134657913943",
    price: 480.29,
    quantity: 1,
    total: 480.29,
    criteria: "Criterio de tienda",
    storeCode: "65662292cc0d…",
  },
];

// ========= SESIONES / RONDAS =========
export const mockSessions: MockSession[] = [
  {
    code: "230102-H9F2TN",
    status: "Pendiente",
    zone: "",
    date: "2023-02-01 15:01",
    assigned: "Sin asignar",
    items: [
      {
        id: "itm-106619",
        name: "Coca Cola Original",
        imageUrl:
          "https://www.coca-cola.com/content/dam/onexp/cl/es/brands/coca-cola/General-Card-Coca-Cola-Original.jpg/width2674.jpg",
        sku: "106619",
        barcode: "4473135472510",
        price: 52.5,
        quantity: 1,
        total: 52.5,
        criteria: "No sustituir",
      },
    ],
  },

  // FOOD 
  {
    code: "FOOD",
    status: "A completar",
    zone: "Food",
    date: "—",
    assigned: "—",
    items: [
      {
        id: "itm-6543456980983",
        name: "Mermelada Durazno La Campagnola 454 Gr",
        imageUrl:
          "https://http2.mlstatic.com/D_NQ_NP_736011-MLA79899256922_102024-O.webp",
        sku: "07793360800000",
        barcode: "6543456980983",
        price: 45.7,
        quantity: 1,
        total: 45.7,
        criteria: "Misma marca",
        storeCode: "62581eb32bf20…",
        // ojo: NO es sustituto en tu screenshot
      },
      {
        id: "itm-0779089500486",
        name: "Galletitas Rellenas Mana Limón Arcor 145g",
        imageUrl: "https://www.fidalga.com/cdn/shop/products/7790580723002.jpg?v=1746460322",
        sku: "123456",
        barcode: "0779089500486",
        price: 0.99,
        quantity: 1,
        total: 0.99,
        isSubstitute: true,
      },
      {
        id: "itm-0779095000588",
        name: "Amargo Patagónico Terma 1,25 Lt",
        imageUrl: "https://cdnx.jumpseller.com/importadoramagu/image/53354840/thumb/540/540?1726419137",
        sku: "—",
        barcode: "0779095000588",
        price: 50.0,
        quantity: 1,
        total: 50.0,
        isSubstitute: true,
      },
    ],
  },

  // Acero inoxidablle, aluminio, galvanizado
  {
    code: "231128-APG3CJ",
    status: "Pickeada",
    zone: "Acero inoxidablle, aluminio, galvanizado",
    date: "2023-11-28 16:58",
    assigned: "Sin asignar",
    items: [
      {
        id: "itm-vlv300lb",
        name:
          'Válvula indust. 3/4" 300lbs de bola flotante. Bridada (SORF) PTFE ASTM Estándar 304',
        imageUrl:
          "https://fitvalv.cl/wp-content/uploads/2021/09/2025N.jpg",
        sku: "—",
        barcode: "D842AA14FD7046CD",
        price: 106.92,
        quantity: 2,
        total: 213.84,
        criteria: "Criterio de tienda",
      },
      {
        id: "itm-sdf28d12",
        name: "Aspiradora de Limpieza sin Cable 0.8 L",
        imageUrl:
          "https://img.global.news.samsung.com/latin/wp-content/uploads/2018/10/news_big.png",
        sku: "—",
        barcode: "CBF28B1D2647413E",
        price: 76.46,
        quantity: 1,
        total: 76.46,
        criteria: "Criterio de tienda",
      },
    ],
  },
];

// === Preview visual de categoría (para Items originales, solo UI/mock) ===
export type MockCategoryPreview = {
  title: string; // encabezado de la categoría (ej: "FRUTAS Y VERDURAS")
  item: {
    name: string;
    imageUrl: string;
    barcode: string;
    sku: string;
    unitPrice: number;   // precio unitario numérico
    qtyLabel: string;    // etiqueta mostrada (ej: "0.75 kg")
    total: number;       // total numérico
    storeCode: string;
  };
};

export const mockPreviewSameBrand: MockCategoryPreview = {
  title: "FRUTAS Y VERDURAS",
  item: {
    name: "Manzana Roja",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/1/15/Red_Apple.jpg",
    barcode: "2345678000005",
    sku: "2100652000002",
    unitPrice: 180.0,
    qtyLabel: "0.75 kg",
    total: 135.0,
    storeCode: "62bcb5ae452d…",
  },
};
