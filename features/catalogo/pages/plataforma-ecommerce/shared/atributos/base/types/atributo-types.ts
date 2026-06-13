// features/catalogo/pages/plataforma-ecommerce/shared/atributos/base/types/atributo-types.ts
//
// Tipos del dominio Atributos. Backed by pim-service:
//   GET    /api/pim/atributos               → listado paginado
//   GET    /api/pim/atributos/:id           → atributo individual (TBD si existe; ver api)
//   PUT    /api/pim/atributos/:id           → editar
//   GET    /api/pim/mapeos-atributos/:mkt/:n3Id → mapeos por marketplace
//   POST   /api/pim/mapeos-atributos/:mkt   → crear mapeo
//   PUT    /api/pim/mapeos-atributos/:mkt/:id → editar
//   DELETE /api/pim/mapeos-atributos/:mkt/:id → eliminar
//
// El shape proviene del monolito `Plataforma_Marketplace/src/features/atributos/atributos.ts`.

/** Nivel de herencia del atributo en el catálogo Mimbral. */
export type AtributoNivelHerencia = "global" | "categoria" | "sku";

/** Tipos de dato soportados por el catálogo. */
export type AtributoTipoDato =
    | "string"
    | "number"
    | "boolean"
    | "date"
    | "list"
    | "multi_list"
    | "number_unit"
    | (string & {}); // extensible — pim-service puede devolver otros

/** Marketplace al que aplica un mapeo. */
export type MarketplaceChannel = "mercadolibre" | "falabella" | "vtex";

/** Atributo maestro del catálogo (lo que se administra en esta feature). */
export interface Atributo {
    id: number;
    nombre: string;
    /** Identificador técnico interno (ej. `color_principal`). */
    nombreTecnico?: string | null;
    tipoDato?: AtributoTipoDato | null;
    /** Si true, es obligatorio en TODOS los SKUs (a menos que un override de categoría lo cambie). */
    esObligatorio?: boolean;
    nivelHerencia?: AtributoNivelHerencia | null;
    unidadMedida?: string | null;
    /** Cantidad de opciones predefinidas (para tipos `list`/`multi_list`). */
    totalOpciones?: number;
    activo?: boolean;
}

/** Filtros de búsqueda para `GET /atributos`. */
export interface AtributosListFilters {
    buscar?: string;
    /** Filtra por tipo de dato exacto. */
    tipo_dato?: string;
    /** Filtra por obligatorio (true/false como string para querystring). */
    obligatorio?: "true" | "false" | "";
    /** Filtra por nivel de herencia. */
    herencia?: AtributoNivelHerencia | "";
    /** Si "true", devuelve solo atributos asignados a alguna categoría. */
    solo_en_uso?: "true" | "";
    /** Si "true", devuelve solo atributos NO asignados a ninguna categoría. */
    solo_sin_uso?: "true" | "";
    page?: number;
    pageSize?: number;
}

/** Response paginada de `GET /atributos`. */
export interface AtributosListResponse {
    data: Atributo[];
    total: number;
    page?: number;
    pageSize?: number;
}

/** Payload para `PUT /atributos/:id`. */
export interface AtributoUpdatePayload {
    nombre?: string;
    es_obligatorio?: boolean;
    nivel_herencia?: AtributoNivelHerencia;
    unidad_medida?: string | null;
    activo?: boolean;
}

/** Atributo del marketplace (lo que ML/Fala/VTEX define en su taxonomía). */
export interface MarketplaceAtributo {
    marketplaceAtributoId: string;
    marketplaceAtributoNombre: string;
    marketplaceEsRequerido?: boolean;
    marketplaceCatalogRequired?: boolean;
    marketplaceVariationAttribute?: boolean;
    marketplaceRecommendedFlag?: boolean;
    marketplaceRelevance?: number | string | null;
}

/** Mapeo entre atributo maestro y atributo del marketplace (por categoría N3). */
export interface MapeoAtributo extends MarketplaceAtributo {
    /** ID del mapeo (existe solo si ya está creado en BD). */
    id?: number | null;
    /** ID del atributo maestro asociado. */
    maestroAtributoId?: number | null;
    /** Nombre del atributo maestro (denormalizado por el backend). */
    attrNombre?: string | null;
    attrNombreTecnico?: string | null;
    attrNivelHerencia?: AtributoNivelHerencia | null;
    /** Si el operador validó manualmente el mapeo. */
    validado?: boolean;
    /** Computado en frontend: true si `id` no es null o `mapeado` viene true. */
    mapeado?: boolean;
}

/** Payload para crear/editar un mapeo. */
export interface MapeoAtributoUpsertPayload {
    maestro_atributo_id: number;
    marketplace_atributo_id: string;
    marketplace_atributo_nombre: string;
    validado?: boolean;
    /** Solo en POST (al crear) — la N3 a la que aplica. */
    n3_id?: string | number;
}

/** Tab del detalle de un atributo. */
export type AtributoDetailTab = "summary" | "platforms" | "comments" | "logs";

/** Estado de un comentario (TAB COMMENTS — TBD por backend, scaffolded). */
export interface AtributoComment {
    id: number;
    autor: string;
    autorEmail?: string;
    fechaIso: string;
    texto: string;
}

/** Entry del log de auditoría (TAB LOGS — TBD por backend, scaffolded). */
export interface AtributoLogEntry {
    id: number;
    fechaIso: string;
    autor: string;
    autorEmail?: string;
    accion: "create" | "update" | "delete" | "map" | "unmap" | (string & {});
    descripcion: string;
    /** Diff opcional — string formateado o JSON. */
    diff?: string;
}
