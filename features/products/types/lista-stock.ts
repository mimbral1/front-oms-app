// src/data/types/pickers.ts
export interface Product {
  u_imagen: string;
  sku: string;
  itemname: string;
  id_almacen: number;
  nombre: string;
  ubicacion: string;
  units: number;
  disponible: number;

  createdate: Date;
  u_name: string;
  updatedate: Date;
  activo: ProductStatus;

  stock_fisico: number;
  en_nota_venta: number;
  en_orden_compra: number;
}

export type ProductStatus = "Y" | "N" | "";

export interface ProductFilters {
  page: number;
  query?: string;
  activo?: ProductStatus;
  id_almacen?: string;
}
export interface PagedProducts {
  products: Product[];
  page: number;
  totalPages: number;
  totalItems: number;
}

export interface ProductsStore {
  /* Datos */
  products: Product[];
  page: number;
  totalPages: number;
  totalItems: number;

  /* Filtros activos */
  filters: ProductFilters;

  /* Mutadores */
  setProducts: (payload: PagedProducts) => void;
  setFilters: (filters: Partial<ProductFilters>) => void;
}
