// app/catalogo/plataforma-ecommerce/mercadolibre/atributos/page.tsx
//
// Lista de atributos del marketplace MercadoLibre. El layout padre
// (`mercadolibre/layout.tsx`) inyecta `EcommercePlatformContext` con
// `basePath: "/catalogo/plataforma-ecommerce/mercadolibre"`.

import { MeliAtributosListView } from "@/features/catalogo/pages/plataforma-ecommerce/mercadolibre/atributos";

export default function MeliAtributosPage() {
    return <MeliAtributosListView />;
}
