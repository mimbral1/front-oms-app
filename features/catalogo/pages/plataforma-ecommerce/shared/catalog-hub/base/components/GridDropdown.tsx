// features/catalogo/pages/plataforma-ecommerce/shared/catalog-hub/base/components/GridDropdown.tsx
//
// Primitivo de dropdown de la grilla del flujo (Unit 1). Render-prop puro: el
// consumidor controla el trigger (botón) y el contenido del menú. Cierra por
// click-outside.
//
// El menú se renderiza en un PORTAL (document.body) con `position: fixed`
// anclado al rect del trigger. Antes era `position: absolute` dentro de la fila
// → el `overflow` de la grilla lo RECORTABA (el menú quedaba cortado/desbordado
// al abrirlo). El portal lo saca del contenedor con overflow. Reposiciona en
// scroll/resize para seguir al trigger.
"use client";

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

export interface GridDropdownProps {
  /** Render del disparador. Recibe el estado abierto y el toggle. */
  trigger: (open: boolean, toggle: () => void) => ReactNode;
  /** Render del contenido del menú. Recibe `close` para cerrarlo desde dentro. */
  children: (close: () => void) => ReactNode;
  /** Ancho del panel en px (default 240). */
  width?: number;
  /** Borde horizontal al que se ancla el panel (default "left"). */
  align?: "left" | "right";
  /** Si true, el panel se abre hacia arriba (para barras en el footer). */
  up?: boolean;
}

export function GridDropdown({
  trigger,
  children,
  width = 240,
  align = "left",
  up = false,
}: GridDropdownProps) {
  const [open, setOpen] = useState(false);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const triggerRef = useRef<HTMLDivElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const measure = () => {
    if (triggerRef.current) setRect(triggerRef.current.getBoundingClientRect());
  };

  const toggle = () => {
    if (!open) measure(); // medir ANTES de abrir → el menú aparece ya posicionado
    setOpen((o) => !o);
  };
  const close = () => setOpen(false);

  useEffect(() => {
    if (!open) return;
    const handle = (e: MouseEvent) => {
      const t = e.target as Node;
      if (triggerRef.current?.contains(t)) return;
      if (menuRef.current?.contains(t)) return; // el menú está portaleado → chequeo aparte
      setOpen(false);
    };
    // capture:true para captar el scroll de contenedores internos (la grilla),
    // no solo el de window → el menú sigue al trigger.
    const reposition = () => measure();
    document.addEventListener("mousedown", handle);
    window.addEventListener("scroll", reposition, true);
    window.addEventListener("resize", reposition);
    return () => {
      document.removeEventListener("mousedown", handle);
      window.removeEventListener("scroll", reposition, true);
      window.removeEventListener("resize", reposition);
    };
  }, [open]);

  const menuStyle: CSSProperties = { position: "fixed", width, zIndex: 50 };
  if (rect) {
    menuStyle.left = align === "right" ? rect.right - width : rect.left;
    if (up) menuStyle.bottom = window.innerHeight - rect.top + 4;
    else menuStyle.top = rect.bottom + 4;
  }

  return (
    <div className="relative" ref={triggerRef}>
      {trigger(open, toggle)}
      {open && rect != null &&
        createPortal(
          <div
            ref={menuRef}
            className="rounded-md border border-gray-200 bg-white shadow-lg py-1"
            style={menuStyle}
          >
            {children(close)}
          </div>,
          document.body,
        )}
    </div>
  );
}
