import sys
import unittest
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from forecasting import forecast_history, CATEGORIES

def records(values):
    return [{'id':str(i),'created_at':str(i).zfill(3),'reporting_year':2018+i,'values':{key: value for key in CATEGORIES}} for i,value in enumerate(values)]

class ForecastTests(unittest.TestCase):
    def setUp(self): self.factors = {key:1 for key in CATEGORIES}
    def test_two_years_returns_unvalidated_baseline(self):
        result=forecast_history(records([100,150]),self.factors,'1')
        self.assertEqual(result['status'],'ready')
        self.assertTrue(result['preliminary'])
        self.assertEqual(result['activities'][0]['predicted_quantity'],150)
        self.assertNotIn('holdout_year',result)
        self.assertEqual(forecast_history(records([100]),self.factors,'0')['status'],'insufficient_history')
    def test_true_linear_series_is_learned(self):
        result=forecast_history(records([100,110,120,130,140,150]),self.factors,'5')
        self.assertEqual(result['status'],'ready')
        self.assertEqual(result['activities'][0]['method'],'linear_trend')
        self.assertEqual(result['activities'][0]['predicted_quantity'],160)
        self.assertEqual(result['holdout_category_error_sum_tco2e'],0)
        self.assertEqual(result['predicted_tco2e'],1.28)
    def test_constant_series_prefers_baseline(self):
        result=forecast_history(records([100]*6),self.factors,'5')
        self.assertTrue(all(row['method']=='last_year_baseline' for row in result['activities']))
    def test_repeated_versions_do_not_add_years(self):
        history=records([1,2,3,4,5]); history.append(dict(history[-1],id='duplicate',created_at='new'))
        result=forecast_history(history,self.factors,'duplicate')
        self.assertEqual(result['status'],'ready')
        self.assertTrue(result['preliminary'])
        self.assertEqual(result['years_available'],5)
    def test_future_data_is_excluded(self):
        history=records([100,110,120,130,140,150,999999])
        result=forecast_history(history,self.factors,'5')
        self.assertEqual(result['activities'][0]['predicted_quantity'],160)
    def test_missing_year_and_gaps_block(self):
        history=records([1]*6);history[0]['reporting_year']=None
        self.assertEqual(forecast_history(history,self.factors,'0')['status'],'insufficient_history')
        history=records([1]*6);history[0]['reporting_year']=2010
        self.assertEqual(forecast_history(history,self.factors,'5')['status'],'insufficient_history')
    def test_missing_or_nonfinite_factor_blocks(self):
        factors=dict(self.factors); factors.pop('electricity')
        self.assertEqual(forecast_history(records([1]*6),factors,'5')['status'],'invalid_factors')
    def test_invalid_activity_blocks(self):
        history=records([1]*6); history[0]['values']['waste']=float('nan')
        self.assertEqual(forecast_history(history,self.factors,'5')['status'],'invalid_history')
    def test_final_holdout_is_not_used_for_model_selection(self):
        result=forecast_history(records([100,110,120,130,140,10000]),self.factors,'5')
        self.assertEqual(result['activities'][0]['method'],'linear_trend')
        self.assertGreater(result['activities'][0]['holdout_absolute_error'],9000)

    def test_route_two_linked_years_and_opening_older_version(self):
        import ast
        from types import SimpleNamespace
        from test_history import Query
        tree=ast.parse((Path(__file__).resolve().parents[1]/'main.py').read_text())
        route=next(node for node in tree.body if isinstance(node,ast.FunctionDef) and node.name=='get_forecast')
        route.decorator_list=[]
        route.args.defaults=[ast.Constant(None)]
        history=[{'id':'2024-report','industry':'general','forecast_series_id':'root','reporting_year':2024,'created_at':'1'},
                 {'id':'2025-report','industry':'general','forecast_series_id':'root','reporting_year':2025,'created_at':'2'}]
        entries=[{'company_id':row['id'],'category':key,'value':100} for row in history for key in CATEGORIES]
        env={'owned_companies':lambda user: [dict(row) for row in history],
             'supabase_admin':SimpleNamespace(table=lambda _:Query(entries)),
             'get_factor_map':lambda _:self.factors}
        exec(compile(ast.fix_missing_locations(ast.Module(body=[route],type_ignores=[])),'route','exec'),env)
        latest=env['get_forecast']('2025-report',SimpleNamespace(id='owner'))
        self.assertEqual(latest['status'],'ready')
        self.assertEqual(latest['forecast_year'],2026)
        self.assertEqual(latest['years_available'],2)
        older=env['get_forecast']('2024-report',SimpleNamespace(id='owner'))
        self.assertEqual(older['status'],'insufficient_history')
        self.assertIn('Open the 2025 assessment',older['reason'])

    def test_forecast_route_rejects_other_accounts(self):
        import ast
        tree=ast.parse((Path(__file__).resolve().parents[1]/'main.py').read_text())
        route=next(node for node in tree.body if isinstance(node,ast.FunctionDef) and node.name=='get_forecast')
        route.decorator_list=[]
        route.args.defaults=[ast.Constant(None)]
        class Denied(Exception):
            def __init__(self,status_code,detail): self.status_code=status_code
        env={'owned_companies':lambda user: [],'HTTPException':Denied}
        exec(compile(ast.fix_missing_locations(ast.Module(body=[route],type_ignores=[])),'route','exec'),env)
        from types import SimpleNamespace
        with self.assertRaises(Denied) as error:
            env['get_forecast']('someone-elses-report',SimpleNamespace(id='stranger'))
        self.assertEqual(error.exception.status_code,404)

if __name__=='__main__':unittest.main()
