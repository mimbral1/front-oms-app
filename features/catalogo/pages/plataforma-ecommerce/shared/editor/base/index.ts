// features/catalogo/pages/plataforma-ecommerce/shared/editor/base/index.ts
//
// Barrel del editor base. Re-exporta la view + types públicos.
// Los hooks y api son internos — no se exportan.

export { EditorView } from "./views/EditorView";
export type { EditorViewProps } from "./views/EditorView";

export type {
    EditorTabId,
    EditorProduct,
    EditorTopBarAction,
} from "./types/editor-types";
