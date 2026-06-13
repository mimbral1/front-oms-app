export interface PickerUser {
  rut: number;
  name: string;
  email: string;
  roleName: string;
  statusName: string;
}

export interface PickerUserConfig {
  rut: string;
  name: string;
  lastname: string;
  email: string;
  profile: string;
  company: string;
  location: string;
  carriers: string[];
  deliveryMode: string;
  sectorsAllowed: string[];
  sectorsRestricted: string[];
  avatarUrl?: string;
  createdBy: { name: string; email: string };
  modifiedBy: { name: string; email: string };
  almacen: string;
  dateCreated: string;
  dateModified: string;
  status: "Active" | "Inactive";
}
