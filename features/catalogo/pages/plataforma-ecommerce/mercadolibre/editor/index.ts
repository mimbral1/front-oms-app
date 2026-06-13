// features/catalogo/pages/plataforma-ecommerce/mercadolibre/editor/index.ts
//
// Alias específicos del editor para MercadoLibre.
// Reusan el `EditorView` base — el comportamiento marketplace-specific
// vive en los tabs (que leen el platform via useEcommercePlatform).

export { EditorView, EditorView as MeliEditorView } from "../../shared/editor";

export type {
    EditorTabId,
    EditorProduct,
    EditorTabId as MeliEditorTabId,
    EditorProduct as MeliEditorProduct,
} from "../../shared/editor";
