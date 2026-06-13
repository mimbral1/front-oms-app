export interface Auditoria {
    id: string;
    entidad: string;
    refId: string;
    idEntidad: string;
    inventario: string;
    controlador: {
        name: string;
        email: string;
        avatar: string;
    };
    estado: string;
}
