export const bulkFields = { electricity: 'electricity', naturalGas: 'natural_gas', petrol: 'petrol', diesel: 'diesel', flights: 'air_travel', hotels: 'hotels', commuting: 'commuting', waste: 'waste' };
export function groupAnnualRows(rows, currentYear = new Date().getFullYear()) {
  const groups = new Map();
  for (const row of rows.filter(row => row.selected)) {
    const year = Number(row.year), value = Number(row.value);
    if (!Number.isInteger(year) || year < 1990 || year >= currentYear) throw new Error('Assign every selected row to a completed calendar year.');
    if (!bulkFields[row.field] || String(row.value).trim() === '' || !Number.isFinite(value) || value < 0) throw new Error('Review invalid or missing activity quantities.');
    if (!row.annualConfirmed) throw new Error('Confirm annual totals for every selected row; adjust monthly or partial-year values first.');
    if (!groups.has(year)) groups.set(year, {});
    const values = groups.get(year); values[bulkFields[row.field]] = (values[bulkFields[row.field]] || 0) + value;
    if (!Number.isFinite(values[bulkFields[row.field]])) throw new Error('Combined quantity is too large.');
  }
  if (!groups.size) throw new Error('Select at least one activity row.');
  return [...groups].sort(([a], [b]) => a - b).map(([year, values]) => ({ year, values }));
}
export function duplicateRowIds(rows) {
  const seen = new Map(), duplicates = new Set();
  for (const row of rows.filter(row => row.selected)) {
    const key = JSON.stringify([row.year, row.field, Number(row.value), row.unit]);
    if (seen.has(key)) { duplicates.add(seen.get(key)); duplicates.add(row.id); }
    else seen.set(key, row.id);
  }
  return duplicates;
}
