export interface ResumenEnvio {
  id: string;
  scheduleStart?: string;
  scheduleEnd?: string;
  status: "Creada" | "Programada" | "Iniciado" | "Arribado" | "Entregado";
  statusVariant: "success" | "warning" | "info" | "error";
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  carrierId?: string;
  carrier: string;
  route: string;
  routePending: boolean;
  pendingPackages: boolean;
  readyToPickup: boolean;
  ordersCount: string;
  totalAmount: string;
  currency: string;
  paymentMethod: string;
  pickup: {
    company: string;
    docType: string;
    docNumber: string;
    phone: string;
    email: string;
    address: string;
    city: string;
    postalCode: string;
    province: string;
    country: string;
  };
  dropoff: {
    name: string;
    surname: string;
    docType: string;
    docNumber: string;
    phone: string;
    email: string;
    address: string;
    city: string;
    postalCode: string;
    province: string;
    country: string;
  };
  verification: {
    verified: boolean;
    failedAttempts: number;
  };
  trackingHistory: Array<{
    trackingNumber: string;
    events: Array<{
      status: ResumenEnvio["status"];
      date: string;
      time: string;
      receiver?: string;
    }>;
  }>;
  signatureUrl: string;
}
