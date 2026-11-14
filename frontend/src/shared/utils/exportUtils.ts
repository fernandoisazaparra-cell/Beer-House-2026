export const exportToCSV = (filename: string, rows: object[]) => {
  if (!rows || !rows.length) return;

  // Cambiamos el separador a ';' para que Excel en español reconozca las columnas
  const separator = ";";
  const keys = Object.keys(rows[0]);
  
  // Agregamos 'sep=;' en la primera línea para forzar a Excel a separar por punto y coma
  const csvContent =
    "sep=;\n" +
    keys.join(separator) +
    "\n" +
    rows
      .map((row: any) =>
        keys
          .map((k) => {
            let cell = row[k] === null || row[k] === undefined ? "" : row[k];
            cell = cell instanceof Date ? cell.toLocaleString() : cell.toString();
            // Limpiar saltos de línea y comillas internas
            cell = cell.replace(/"/g, '""');
            return `"${cell}"`;
          })
          .join(separator)
      )
      .join("\n");

  const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}.csv`);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};