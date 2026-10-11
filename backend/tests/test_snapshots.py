"""Historical inputs and cached advice must survive changes to current data."""
import ast
import sys
import unittest
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import Mock
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from snapshots import calculation_snapshot, calculation_source
from test_history import Query, Denied

class SnapshotTests(unittest.TestCase):
    def test_factor_and_input_changes_do_not_change_saved_context(self):
        factors = {'electricity': 0.4}
        entries = [{'category': 'electricity', 'value': 100, 'unit': 'kWh'}]
        saved = calculation_snapshot(factors, entries)
        factors['electricity'] = 0.9
        entries[0]['value'] = 500
        rows, selected = calculation_source({'calculation_snapshot': saved}, entries, factors)
        self.assertEqual(rows[0]['value'] * selected['electricity'], 40)
        self.assertEqual(saved['provenance'], 'at_assessment')
        self.assertTrue(saved['captured_at'].endswith('+00:00'))

    def test_legacy_context_is_explicit_and_does_not_invent_original_factors(self):
        rows, factors = calculation_source({}, [], {'diesel': 2.7})
        self.assertEqual(factors['diesel'], 2.7)
        later = calculation_snapshot(factors, rows, 'captured_later')
        self.assertEqual(later['provenance'], 'captured_later')

    def test_reopening_returns_exact_saved_ai_without_provider_call(self):
        advice = {'action_plan': 'original advice', 'captured_at': '2026-10-11T00:00:00Z'}
        tables = {'companies': [{'id': 'report', 'user_id': 'owner'}],
                  'results': [{'company_id': 'report', 'ai_snapshot': {'analysis': advice}}]}
        client = SimpleNamespace(table=lambda name: Query(tables[name]))
        provider = Mock(side_effect=AssertionError('Must not regenerate saved AI'))
        factors = Mock(side_effect=AssertionError('Must not fetch current factors'))
        tree = ast.parse((Path(__file__).resolve().parents[1] / 'main.py').read_text())
        route = next(node for node in tree.body if isinstance(node, ast.FunctionDef) and node.name == 'get_action_plan')
        route.decorator_list = []
        route.args.defaults = [ast.Constant(None) if isinstance(value, ast.Call) else value for value in route.args.defaults]
        module = ast.fix_missing_locations(ast.Module(body=[route], type_ignores=[]))
        env = {'supabase_admin': client, 'HTTPException': Denied,
               'generate_action_plan': provider, 'get_factor_map': factors}
        exec(compile(module, 'route', 'exec'), env)
        self.assertEqual(env['get_action_plan'](company_id='report', current_user=SimpleNamespace(id='owner')), advice)
        provider.assert_not_called()
        factors.assert_not_called()

if __name__ == '__main__': unittest.main()
