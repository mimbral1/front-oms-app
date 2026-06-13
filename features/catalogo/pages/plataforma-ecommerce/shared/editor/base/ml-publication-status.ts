// features/catalogo/pages/plataforma-ecommerce/shared/editor/base/ml-publication-status.ts
//
// Registra el dominio "ml" en el status-registry global para los estados de
// item de MercadoLibre. Import con efecto secundario desde EditorPublicacionesTab.
// registerStatusMap mergea (idempotente) — si otro módulo ya registró "ml", esto suma.

import { registerStatusMap } from "@/components/ui/badge/status-registry";

registerStatusMap("ml", {
    active:       { variant: "active",   label: "Activo" },
    paused:       { variant: "inactive", label: "Pausado" },
    closed:       { variant: "error",    label: "Cerrado" },
    under_review: { variant: "review",   label: "En revisión" },
    inactive:     { variant: "inactive", label: "Inactivo" },
});
