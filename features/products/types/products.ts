export interface Product {
  id: string;
  image: string; // URL o path a la imagen
  product: {
    code: string;
    description: string;
  };
  reference: string;
  groups: {
    categoria: string;
    marca: string;
  };
  sku: string;
  salesChannels: string;
  officeType: string;
  salesConvertedRate: number; // asumiendo que es un número/porcentaje
  dateModified: string; // ISO string de fecha
  status: string; // "Active", "Inactive", etc.
}
export interface products { }

export interface store {
  id: string;
  image: string;
  sku: {
    code: string;
    ProductName: string;
  };
  position: {
    warehouseName: string;
    location: string;
    type: string;
  };
  max_units: string;
  created: string;
  creatorUser: {
    creatorName: string;
    creatorMail: string;
  };
  modified: string;
  user: {
    userName: string;
    userEmail: string;
  };
  status: string;
}
