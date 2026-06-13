// features/catalogo/pages/plataforma-ecommerce/shared/publicar/base/helpers/preview.ts
//
// PORT VERBATIM del legacy `pim-service/Plataforma_Marketplace/src/features/
// publicar/preview.ts`.
//
// Adapta el state al "view model" del componente `ProductPreview` para que
// éste no acople su rendering al shape del state. ML usa `{title, description,
// price, categoria}`, Fala usa `{Name, Brand, Description, Price}`.

import type {
    MarketplaceCategory,
    PublicarChannel,
    PublicarState,
} from "../types/publicar-types";

export interface PreviewData {
    // ML
    title?: string;
    description?: string;
    price?: string | number;
    categoria?: MarketplaceCategory | null;
    // Falabella
    Name?: string;
    Brand?: string;
    Description?: string;
    Price?: string | number;
}

export function buildPreviewData(
    state: PublicarState,
    channel: PublicarChannel,
): PreviewData {
    if (channel === "ml") {
        return {
            title: state.ml?.title,
            description: state.ml?.description,
            price: state.ml?.price,
            categoria: state.category,
        };
    }

    return {
        Name: state.fala?.Name,
        Brand: state.fala?.Brand,
        Description: state.fala?.Description,
        Price: state.fala?.Price,
    };
}
