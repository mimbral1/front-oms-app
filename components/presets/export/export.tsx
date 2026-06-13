export const exportToCsv = (filename: string, rows: any[]) => {
  // Función para procesar cada fila usando ";" como delimitador.
  const processRow = (row: any[]) =>
    row
      .map(String)
      .map((val: string) => {
        // Si el valor tiene el formato de "número/número" (por ejemplo, "9/20"),
        // reemplazamos la barra por " de " para evitar que Excel lo interprete como fecha.
        if (/^\d+\/\d+$/.test(val)) {
          const newVal = val.replace(/\//, " de ");
          return `"${newVal.replace(/"/g, '""')}"`;
        }
        // En otros casos, se escapan las comillas y se envuelve entre comillas.
        return `"${val.replace(/"/g, '""')}"`;
      })
      .join(";");

  // Une las filas separándolas por salto de línea
  const csvContent = rows.map(processRow).join("\n");

  // Prepend BOM para mejorar compatibilidad UTF-8 en Excel
  const BOM = "\uFEFF";

  const blob = new Blob([BOM + csvContent], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
