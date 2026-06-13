// app/catalogo/plataforma-ecommerce/mercadolibre/mapeo-categorias/page.tsx
//
// Migrado a la nueva view Janis (Fase 4 del MIGRATION_PLAN). El componente
// legacy `MeliMapeoCategoriasBrowse` sigue accesible vía el barrel del feature
// para rollback rápido si hace falta.

import { MeliMapeoCategoriasView } from "@/features/catalogo/pages/plataforma-ecommerce/mercadolibre/mapeo-categorias";

export default function MeliMapeoCategoriasPage() {
    return <MeliMapeoCategoriasView />;
}
