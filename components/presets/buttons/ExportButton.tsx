import { ButtonHTMLAttributes, FC, useCallback } from "react";
import { ArrowDownTrayIcon } from "@heroicons/react/24/outline";
import { ActionButton } from "@/components/ui/button/action-button";
import { exportToCsv } from "@/components/presets/export/export";

interface ExportButtonProps
    extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
    /** Texto del botón (por defecto "Exportar") */
    label?: string;
    /**
     * Nombre del archivo CSV generado (incluir extensión).
     * Si se provee junto con `rows`, el botón exportará automáticamente al hacer clic.
     */
    filename?: string;
    /**
     * Filas a exportar (la primera fila debe ser el header).
     * Si se proveen `filename` + `rows`, el `onClick` por defecto invoca `exportToCsv`.
     */
    rows?: any[][];
}

/**
 * Botón azul "Exportar" pre-configurado con ícono ArrowDownTrayIcon.
 *
 * Puede utilizarse de dos formas:
 *
 * 1. **Exportación automática** — pasa `filename` y `rows`:
 *    ```tsx
 *    <ExportButton filename="pedidos.csv" rows={[headers, ...data]} />
 *    ```
 *
 * 2. **Exportación manual** — pasa tu propio `onClick`:
 *    ```tsx
 *    <ExportButton onClick={handleExport} />
 *    ```
 */
export const ExportButton: FC<ExportButtonProps> = ({
    label = "Exportar",
    filename,
    rows,
    onClick,
    ...props
}) => {
    const handleClick = useCallback(
        (e: React.MouseEvent<HTMLButtonElement>) => {
            if (onClick) {
                onClick(e);
                return;
            }
            if (filename && rows) {
                exportToCsv(filename, rows);
            }
        },
        [onClick, filename, rows]
    );

    return (
        <ActionButton variant="primary" onClick={handleClick} {...props}>
            <ArrowDownTrayIcon className="h-5 w-5" />
            {label}
        </ActionButton>
    );
};
