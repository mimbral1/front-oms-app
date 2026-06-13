// features/catalogo/pages/plataforma-ecommerce/shared/catalog-hub/base/components/GridFooter.tsx
//
// Pie de la grilla del flujo (Unit 3) — adopta el footer del prototipo
// (carga-masiva-de-imagnes/project/grid.jsx ~824-906) con TIPOGRAFÍA OMS.
//
// Si hay selección: "N seleccionados" + acciones masivas (Categoría / Marca /
// Sync) que abren hacia ARRIBA (dropdowns `up`) + "Quitar selección". Si no hay
// selección: una pista gris. A la derecha siempre: "Mostrando X de Y".
//
// Solo presentación: la lógica (aplicar a la selección, abrir el picker masivo,
// limpiar selección) vive en FlujoGridView. Cero write a ML.
"use client";

import { ChevronDown, Tag, X } from "lucide-react";

import { GridDropdown } from "./GridDropdown";

export interface GridFooterProps {
  selectedCount: number;
  marcas: string[];
  onApplyMarca: (marca: string) => void;
  onApplySync: (on: boolean) => void;
  onApplyCategoria: () => void; // abre el picker masivo (lo maneja el padre)
  onClearSelection: () => void;
  shownCount: number;
  total: number;
}

export function GridFooter({
  selectedCount,
  marcas,
  onApplyMarca,
  onApplySync,
  onApplyCategoria,
  onClearSelection,
  shownCount,
  total,
}: GridFooterProps) {
  return (
    <div className="flex items-center gap-3 px-4 py-2.5 border-t border-gray-200 bg-gray-50/60 min-h-[52px] rounded-b-lg">
      {selectedCount > 0 ? (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[12.5px] text-gray-700 tabular-nums mr-1">
            <b className="font-semibold text-gray-900">{selectedCount}</b> seleccionados
          </span>

          {/* Categoría → abre el picker masivo (botón simple, no dropdown). */}
          <button
            type="button"
            onClick={onApplyCategoria}
            className="h-8 px-2.5 inline-flex items-center gap-1.5 rounded-md border border-gray-300 bg-white text-[12px] text-gray-700 hover:bg-gray-50"
          >
            <Tag size={13} className="text-gray-400" /> Categoría
          </button>

          {/* Marca → aplica una marca existente a la selección. */}
          <GridDropdown
            up
            width={180}
            trigger={(_open, toggle) => (
              <button
                type="button"
                onClick={toggle}
                className="h-8 px-2.5 inline-flex items-center gap-1.5 rounded-md border border-gray-300 bg-white text-[12px] text-gray-700 hover:bg-gray-50"
              >
                Marca <ChevronDown size={13} className="text-gray-400" />
              </button>
            )}
          >
            {(close) =>
              marcas.length > 0 ? (
                <div className="max-h-60 overflow-y-auto">
                  {marcas.map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => {
                        onApplyMarca(m);
                        close();
                      }}
                      className="w-full px-3 py-1.5 text-left text-[12.5px] text-gray-700 hover:bg-gray-50"
                    >
                      {m}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="px-3 py-1.5 text-[12.5px] text-gray-400">Sin marcas</div>
              )
            }
          </GridDropdown>

          {/* Sync → activar/desactivar sincronización en la selección. */}
          <GridDropdown
            up
            width={200}
            trigger={(_open, toggle) => (
              <button
                type="button"
                onClick={toggle}
                className="h-8 px-2.5 inline-flex items-center gap-1.5 rounded-md border border-gray-300 bg-white text-[12px] text-gray-700 hover:bg-gray-50"
              >
                Sync <ChevronDown size={13} className="text-gray-400" />
              </button>
            )}
          >
            {(close) => (
              <div>
                <button
                  type="button"
                  onClick={() => {
                    onApplySync(true);
                    close();
                  }}
                  className="w-full px-3 py-1.5 text-left text-[12.5px] text-gray-700 hover:bg-gray-50"
                >
                  Activar sincronización
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onApplySync(false);
                    close();
                  }}
                  className="w-full px-3 py-1.5 text-left text-[12.5px] text-gray-700 hover:bg-gray-50"
                >
                  Desactivar sincronización
                </button>
              </div>
            )}
          </GridDropdown>

          <span className="w-px h-5 bg-gray-200 mx-0.5" />
          <button
            type="button"
            onClick={onClearSelection}
            className="h-8 px-2.5 inline-flex items-center gap-1.5 text-[12px] text-gray-500 hover:text-gray-800"
          >
            <X size={13} /> Quitar selección
          </button>
        </div>
      ) : null}

      <span className="ml-auto text-[12px] text-gray-400 tabular-nums shrink-0">
        Mostrando {shownCount} de {total}
      </span>
    </div>
  );
}
