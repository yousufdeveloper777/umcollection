import Papa from "papaparse";

export function parseInventoryCsv(text: string, knownIds: ReadonlySet<string>) {
  const parsed = Papa.parse<Record<string, string>>(text, { header: true, skipEmptyLines: "greedy" });
  if (parsed.errors.length || !parsed.meta.fields?.includes("id") || !parsed.meta.fields.includes("stock")) throw new Error("The file must have id and stock columns.");
  if (parsed.data.length === 0 || parsed.data.length > 500) throw new Error("Import between 1 and 500 products at a time.");
  const seen = new Set<string>();
  return parsed.data.map((row, index) => {
    const id = row["id"]?.trim() ?? "";
    const raw = row["stock"]?.trim() ?? "";
    const stock = Number(raw);
    if (!knownIds.has(id) || seen.has(id)) throw new Error(`Row ${index + 2}: unknown or duplicate product.`);
    if (!raw || !Number.isSafeInteger(stock) || stock < 0) throw new Error(`Row ${index + 2}: stock must be a whole number of zero or more.`);
    seen.add(id);
    return { id, stock };
  });
}