import ast
import json
import unittest
from pathlib import Path

class AnalysisPromptTests(unittest.TestCase):
    def test_scope_schema_and_real_context_are_in_prompt(self):
        tree = ast.parse((Path(__file__).resolve().parents[1] / 'ai_service.py').read_text())
        function = next(n for n in tree.body if isinstance(n, ast.FunctionDef) and n.name == 'build_action_plan_prompt')
        env = {}
        exec(compile(ast.fix_missing_locations(ast.Module(body=[function], type_ignores=[])), 'prompt', 'exec'), env)
        context = {'employee_count': 20, 'location': 'Pune', 'activities': [{'category': 'electricity', 'quantity': 125000, 'unit': 'kWh', 'factor_kgco2e_per_unit': 0.7}]}
        prompt = env['build_action_plan_prompt']('Example', 'manufacturing', 2, 87.5, 3, context)
        self.assertIn(json.dumps(context), prompt)
        start = prompt.index('{\n  "executive_summary"')
        end = prompt.index('\n}\n', start) + 2
        schema = json.loads(prompt[start:end])
        self.assertEqual([s['scope'] for s in schema['scope_analysis']], [1, 2, 3])
        self.assertIn('company_analysis', schema)
        self.assertIn('not a complete inventory', prompt)
        self.assertIn('no activity reported', prompt)
        self.assertIn('never recalculate or invent factors', prompt)

    def test_incomplete_cloud_report_is_rejected(self):
        tree = ast.parse((Path(__file__).resolve().parents[1] / 'ai_service.py').read_text())
        function = next(n for n in tree.body if isinstance(n, ast.FunctionDef) and n.name == 'validate_action_plan')
        env = {}
        exec(compile(ast.fix_missing_locations(ast.Module(body=[function], type_ignores=[])), 'validation', 'exec'), env)
        item = {'finding': 'Fuel reported', 'reason': 'Fuel combustion emits carbon', 'recommendation': 'Review usage', 'assumptions': ['Boundary unconfirmed']}
        plan = {'scope_analysis': [dict(item, scope=n) for n in [1, 2, 3]], 'company_analysis': item, 'executive_summary': 'Profile summary', 'measurement': 'Track monthly', 'top_priority': {'title': 'Energy', 'why_now': 'Largest source'}, 'actions': [{'title': 'Audit', 'priority': 'High', 'timeframe': 'This quarter', 'expected_impact': 'Lower consumption', 'why_it_matters': 'Largest source', 'steps': ['Measure usage']}] * 4}
        self.assertEqual(json.loads(env['validate_action_plan'](json.dumps(plan))), plan)
        for changes in [{'actions': [{}] * 4}, {'executive_summary': ''}, {'measurement': ''}, {'top_priority': {'title': 'Energy'}}]:
            with self.subTest(changes=changes), self.assertRaises(ValueError): env['validate_action_plan'](json.dumps({**plan, **changes}))
        for changes in [{'why_it_matters': ''}, {'steps': []}, {'steps': ['']}, {'priority': 'Urgent'}, {'title': 123}]:
            actions = [dict(plan['actions'][0], **changes), *plan['actions'][1:]]
            with self.subTest(changes=changes), self.assertRaises(ValueError): env['validate_action_plan'](json.dumps({**plan, 'actions': actions}))
        plan['scope_analysis'].pop()
        with self.assertRaises(ValueError): env['validate_action_plan'](json.dumps(plan))

if __name__ == '__main__': unittest.main()
