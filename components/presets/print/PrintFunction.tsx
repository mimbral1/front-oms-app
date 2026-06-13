// components/PrintButton.tsx
import React from "react";

interface PrintButtonProps {
  targetRef?: React.RefObject<HTMLElement>;
  htmlString?: string;
  /** Texto por defecto si usas el botón interno */
  label?: string;
  /** Clases para el botón interno */
  className?: string;
  /**
   * Si pasas este render prop, NO usará el botón por defecto:
   *   children(onPrint) => ReactNode
   */
  children?: (onPrint: () => void) => React.ReactNode;
}

export const PrintButton: React.FC<PrintButtonProps> = ({
  targetRef,
  htmlString,
  label = "Imprimir",
  className = "",
  children,
}) => {
  const handlePrint = () => {
    const contentHtml =
      htmlString ??
      targetRef?.current?.outerHTML ??
      "<p>No hay contenido para imprimir</p>";

    const printWin = window.open("", "_blank", "width=800,height=600");
    if (!printWin) return;

    // copia todos los estilos del documento
    const styles = Array.from(
      document.querySelectorAll("link[rel=stylesheet], style")
    )
      .map((node) => node.outerHTML)
      .join("");

    printWin.document.write(`
      <html>
        <head>
          <title>${label}</title>
          ${styles}
          <style>body{margin:0;padding:20px;}</style>
        </head>
        <body>${contentHtml}</body>
      </html>
    `);
    printWin.document.close();
    printWin.focus();
    printWin.print();
    printWin.close();
  };

  // Si me pasas un render prop, úsalo:
  if (children) {
    return <>{children(handlePrint)}</>;
  }

  // Si no, renderizo mi propio botón:
  return (
    <button
      onClick={handlePrint}
      className={`px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 ${className}`}
    >
      {label}
    </button>
  );
};
