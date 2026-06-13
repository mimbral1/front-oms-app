import { PlayIcon, PrinterIcon, QrCodeIcon } from "lucide-react";
import { PrepItem } from "../ProductosPreparables";
import { ActionButton } from "@/components/ui/button/action-button";

export function renderActionBtn(
  action: string,
  item: PrepItem,
  onPrint: (p: PrepItem) => void
) {
  switch (action) {
    case "Imprimir etiqueta":
      return (
        <ActionButton
          key="print"
          variant="pick"
          size="sm"
          onClick={() => onPrint(item)}
        >
          <PrinterIcon className="h-3.5 w-3.5" />
          Imprimir etiqueta
        </ActionButton>
      );

    case "Iniciar":
      return (
        <ActionButton
          key="start"
          variant="warning"
          size="sm"
          onClick={() => alert(`Iniciar preparación ${item.refId}`)}
        >
          <PlayIcon className="h-3.5 w-3.5" />
          Iniciar
        </ActionButton>
      );

    case "Pick":
      return (
        <ActionButton
          key="pick"
          variant="success"
          size="sm"
          onClick={() => alert(`Pick ${item.refId}`)}
        >
          <QrCodeIcon className="h-3.5 w-3.5" />
          Pick
        </ActionButton>
      );

    default:
      return null;
  }
}
