export type IssueSummaryResponse = {
    resumen: {
        cliente: {
            nombre: string;
            tipoDocumento: string | null;
            documento: string | null;
            telefono: string | null;
            email: string | null;
            customerType: string | null;
            fechaCreacion: string;
            clusters: string[];
        };
        picking: {
            sesiones: number;
            contenedores: number;
            productosPickeados: number;
            itemsPickeados: number;
            faltantes: number;
            tiempoPickingMin: number | null;
            almacenOTienda: string | null;
        };
        totales: { subtotal: number | null; total: number | null };
        originalsPostPicking: {
            itemsPickeados: number;
            subtotal: number | null;
            total: number | null;
        };
    };
    items: {
        grupos: Array<{
            categoria: string;
            items: Array<{
                producto: string;
                itemcode?: string | null;
                cantidad: number;
                barcode?: string | null;
                sku?: string | null;
                unitPrice?: number | null;
                total?: number | null;
            }>;
        }>;
    };
    facturacion: unknown[];
    historial: Array<{ status: string; fecha: string; usuario: string | null }>;
    datosEntrega: {
        tipoEntrega: string | null;
        direccion: string | null;
        fechaEntrega: string | null;
        empresaDelivery: string | null;
    };
    datosPedido: {
        orderId: number;
        seller: string | null;
        folioNum: string | null;
        salesChannelReferenceId: string | null;
        u_ref1: string | null;
        customerCardCode: string | null;
    };
};
