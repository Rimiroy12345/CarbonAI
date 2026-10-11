import io
import json
import sys
import unittest
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from document_intelligence import extract_document, validate_candidates, MAX_BYTES
from openpyxl import Workbook
from pypdf import PdfWriter

class DocumentTests(unittest.TestCase):
    def test_template_maps_all_scopes(self):
        content = (Path(__file__).resolve().parents[2] / 'public/CarbonAI_Activity_Template.csv').read_bytes()
        records = extract_document('template.csv', content)['records']
        self.assertEqual(len(records), 8)
        self.assertEqual({r['scope'] for r in records}, {1, 2, 3})
        self.assertTrue(all(r['evidence'] and r['source'] for r in records))

    def test_workbook_converts_units(self):
        w = Workbook(); w.active.append(['Electricity', 2, 'MWh', 'Annual 2025']); w.active.append(['Waste', 1.5, 'tonnes', 'Annual 2025'])
        stream = io.BytesIO(); w.save(stream)
        rows = extract_document('activity.xlsx', stream.getvalue())['records']
        self.assertEqual([r['value'] for r in rows], [2000, 1500])

    def test_unsupported_units_and_costs_not_imported(self):
        data = b'Activity,Quantity,Unit\nElectricity,900,INR\nNatural gas,55,kg\nWaste emissions,500,kg CO2\nPetrol,-25,litres'
        self.assertEqual(extract_document('activity.csv', data)['records'], [])

    def test_unverifiable_ai_value_uses_fallback(self):
        fake = lambda _: json.dumps({'records':[{'field':'electricity','quantity':99999,'unit':'kWh','line_id':0}]})
        result = extract_document('activity.csv', b'Electricity,100,kWh', fake)
        self.assertEqual(result['method'], 'rule-based')
        self.assertEqual(result['records'][0]['value'], 100)

    def test_ai_records_are_grounded_and_deduplicated(self):
        item = {'field':'electricity','quantity':5,'unit':'MWh','line_id':0}
        fake = lambda _: json.dumps({'records':[item,item]})
        result = extract_document('activity.csv', b'Electricity,5,MWh', fake)
        self.assertEqual(result['method'], 'cloud-ai')
        self.assertEqual(len(result['records']), 1)
        self.assertEqual(result['records'][0]['value'], 5000)

    def test_ai_failure_keeps_extraction_available(self):
        def unavailable(_): raise RuntimeError('provider unavailable')
        result = extract_document('activity.csv', b'Waste,80,kg', unavailable)
        self.assertEqual(result['records'][0]['value'], 80)
        self.assertTrue(any('unavailable' in x for x in result['warnings']))

    def test_monthly_values_are_not_annualized(self):
        result = extract_document('activity.csv', b'Electricity,100,kWh,January 2025')
        self.assertEqual(result['records'][0]['value'], 100)
        self.assertEqual(result['records'][0]['period'], 'Not confirmed')

    def test_reporting_years_are_grounded_and_multiyear_rows_need_review(self):
        rows = extract_document('annual.csv', b'Electricity,100,kWh,Annual 2024\nWaste,50,kg,Annual 2025')['records']
        self.assertEqual([row['reporting_year'] for row in rows], [2024, 2025])
        context = extract_document('annual.csv', b'Annual report 2024\nElectricity,100,kWh')['records'][0]
        self.assertEqual(context['reporting_year'], 2024)
        self.assertEqual(context['year_source'], 'document context')
        ambiguous = extract_document('annual.csv', b'Electricity,100,kWh,Annual 2024 and annual 2025')['records'][0]
        self.assertIsNone(ambiguous['reporting_year'])
        quantity = extract_document('annual.csv', b'Electricity,2024,kWh')['records'][0]
        self.assertIsNone(quantity['reporting_year'])

    def test_file_limits_and_invalid_formats(self):
        for name,content in [('bad.xls',b'bad'),('bad.pdf',b'bad'),('empty.csv',b''),('large.csv',b'x'*(MAX_BYTES+1)),('bad.xlsx',b'bad')]:
            with self.subTest(name=name), self.assertRaises(ValueError): extract_document(name,content)

    def test_scanned_pdf_returns_actionable_error(self):
        writer=PdfWriter();writer.add_blank_page(width=100,height=100);stream=io.BytesIO();writer.write(stream)
        with self.assertRaisesRegex(ValueError,'OCR'): extract_document('scan.pdf',stream.getvalue())

if __name__ == '__main__': unittest.main()
