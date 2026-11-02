/** Quote every cell and prevent spreadsheet formulas in user-controlled text. */
export function csvRow(cells: (string | number)[]): string {
  return cells
    .map((cell) => {
      const value = String(cell);
      const safe =
        typeof cell === "string" && /^\s*[=+@-]/.test(value)
          ? `'${value}`
          : value;
      return `"${safe.replaceAll('"', '""')}"`;
    })
    .join(",");
}
