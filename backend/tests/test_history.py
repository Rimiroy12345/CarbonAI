"""Exercise route ownership checks without contacting production providers."""
import ast
import unittest
from pathlib import Path
from types import SimpleNamespace

class Denied(Exception):
    def __init__(self, status_code, detail):
        self.status_code = status_code

class Query:
    def __init__(self, rows):
        self.rows = rows
        self.filters = []
    def select(self, *args, **kwargs): return self
    def eq(self, column, value):
        self.filters.append((column, value))
        return self
    def order(self, *args, **kwargs): return self
    def limit(self, *args): return self
    def range(self, *args): return self
    def execute(self):
        rows = [r for r in self.rows if all(r.get(k) == v for k, v in self.filters)]
        return SimpleNamespace(data=rows, count=len(rows))

class HistoryTests(unittest.TestCase):
    def setUp(self):
        self.query = Query([{'id': 'report-a', 'user_id': 'owner', 'name': 'Company',
            'created_at': '2026-10-11', 'results': [{'total_tco2e': 5, 'calculated_at': '2026-10-11'}]}])
        client = SimpleNamespace(table=lambda _: self.query)
        tree = ast.parse((Path(__file__).resolve().parents[1] / 'main.py').read_text())
        routes = []
        for node in tree.body:
            if isinstance(node, ast.FunctionDef) and node.name in {'list_assessments', 'get_action_plan', 'get_dashboard_results'}:
                node.decorator_list = []
                node.args.defaults = [ast.Constant(None) if isinstance(value, ast.Call) else value for value in node.args.defaults]
                routes.append(node)
        module = ast.fix_missing_locations(ast.Module(body=routes, type_ignores=[]))
        self.env = {'supabase_admin': client, 'HTTPException': Denied}
        exec(compile(module, 'routes', 'exec'), self.env)
    def test_history_only_contains_owned_reports(self):
        self.assertEqual(len(self.env['list_assessments'](current_user=SimpleNamespace(id='owner'))['assessments']), 1)
        self.assertEqual(self.env['list_assessments'](current_user=SimpleNamespace(id='stranger'))['assessments'], [])
    def test_old_report_cannot_be_opened_by_another_user(self):
        for name in ['get_dashboard_results', 'get_action_plan']:
            with self.assertRaises(Denied) as error:
                self.env[name](company_id='report-a', current_user=SimpleNamespace(id='stranger'))
            self.assertEqual(error.exception.status_code, 404)
    def test_negative_pagination_rejected(self):
        with self.assertRaises(Denied):
            self.env['list_assessments'](offset=-1, current_user=SimpleNamespace(id='owner'))

if __name__ == '__main__': unittest.main()
