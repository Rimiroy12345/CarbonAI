import assert from 'node:assert/strict';
import test from 'node:test';
import { groupAnnualRows, duplicateRowIds } from '../src/services/bulkImport.js';
const row = (id, year, value = 100, extra = {}) => ({ id, year, value: String(value), field: 'electricity', unit: 'kWh', selected: true, annualConfirmed: true, ...extra });
test('Rows group by year without mixing quantities and exclude unchecked duplicates', () => {
  const groups = groupAnnualRows([row('a', 2025), row('b', 2024, 50), row('c', 2025, 20), row('d', 2024, 50, { selected: false })], 2026);
  assert.deepEqual(groups, [{ year: 2024, values: { electricity: 50 } }, { year: 2025, values: { electricity: 120 } }]);
});
test('Unknown years, incomplete years and unconfirmed annual quantities cannot save', () => {
  for (const edited of [row('a', ''), row('a', 2026), row('a', 2024, -1), row('a', 2024, '', { annualConfirmed: false }), row('a', 2024, 20, { annualConfirmed: false })]) assert.throws(() => groupAnnualRows([edited], 2026));
});
test('Matching annual activity rows flag possible duplicates across files', () => {
  assert.deepEqual([...duplicateRowIds([row('a', 2024), row('b', 2024), row('c', 2025)])], ['a', 'b']);
});
