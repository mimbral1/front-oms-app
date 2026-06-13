// features/catalogo/pages/plataforma-ecommerce/shared/catalog-hub/base/components/ImagenesModal.tsx
//
// Gestor de imágenes para una celda de la grilla (launcher "imagenes").
// Reutiliza `ImageUploader` del wizard de publicar. IMPORTANTE: solo memoria —
// las imágenes viven en el value de edición del SKU; no se persisten ni se
// suben al item real acá. La sincronización al marketplace es de la Pieza F.
"use client";

import { SimpleModal } from "@/components/ui/modal";
import { ImageUploader } from "../../../publicar/base/components/ImageUploader";
import type { UploadedImage } from "../../../publicar/base/types/publicar-types";

export interface ImagenesModalProps {
  open: boolean;
  images: UploadedImage[];
  onChange: (imgs: UploadedImage[]) => void;
  onClose: () => void;
  categoryId?: string;
  title?: string;
}

export function ImagenesModal({
  open,
  images,
  onChange,
  onClose,
  categoryId,
  title,
}: ImagenesModalProps) {
  return (
    <SimpleModal
      open={open}
      title={title ?? "Imágenes"}
      onClose={onClose}
      maxWidth="sm:max-w-3xl"
    >
      <div className="space-y-3">
        <ImageUploader
          images={images ?? []}
          onChange={(next) => onChange([...next])}
          categoryId={categoryId}
          title={title}
        />
        <p className="text-[12.5px] text-gray-400">
          Se guardará al sincronizar (Pieza F).
        </p>
      </div>
    </SimpleModal>
  );
}
