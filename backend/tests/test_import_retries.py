"""An import retry returns the saved snapshot and cannot create another version."""
import ast
import unittest
from pathlib import Path
from types import SimpleNamespace
from uuid import uuid5, uuid4, NAMESPACE_URL
from unittest.mock import Mock
from test_history import Query, Denied

class ImportRetryTests(unittest.TestCase):
    def setUp(self):
        self.submission = uuid4()
        self.company_id = str(uuid5(NAMESPACE_URL, f'carbonai:owner:{self.submission}'))
        self.data = SimpleNamespace(submission_id=self.submission, reporting_year=2024, forecast_series_id=None,
            company_name='QA', industry='general', employee_count=10, location='QA',
            **{key:100 for key in ('electricity','natural_gas','petrol','diesel','air_travel','hotels','commuting','waste')})
        self.company = {'id':self.company_id,'user_id':'owner','reporting_year':2024,'forecast_series_id':self.company_id,
                        'name':'QA','industry':'general','employee_count':10,'location':'QA'}
        self.dashboard = {'company_id':self.company_id,'activities':[{'category':key,'quantity':100} for key in ('electricity','natural_gas','petrol','diesel','air_travel','hotels','commuting','waste')], 'total_tco2e':8}
        tree=ast.parse((Path(__file__).resolve().parents[1]/'main.py').read_text())
        route=next(node for node in tree.body if isinstance(node,ast.FunctionDef) and node.name=='submit_assessment')
        route.decorator_list=[];route.args.defaults=[ast.Constant(None)]
        self.get_dashboard=Mock(return_value=self.dashboard)
        self.factors=Mock(side_effect=AssertionError('Retry must retain saved factors'))
        self.env={'AssessmentInput':object,'supabase_admin':SimpleNamespace(table=lambda _:Query([self.company])),
                  'HTTPException':Denied,'get_dashboard_results':self.get_dashboard,'get_factor_map':self.factors}
        exec(compile(ast.fix_missing_locations(ast.Module(body=[route],type_ignores=[])),'assessment','exec'),self.env)
    def test_same_retry_reuses_existing_snapshot_without_writes(self):
        result=self.env['submit_assessment'](self.data,SimpleNamespace(id='owner'))
        self.assertEqual(result,self.dashboard)
        self.factors.assert_not_called()
    def test_changed_values_or_company_details_cannot_reuse_import_id(self):
        for field,value in [('electricity',200),('company_name','Changed')]:
            old=getattr(self.data,field);setattr(self.data,field,value)
            with self.subTest(field=field), self.assertRaises(Denied) as error:
                self.env['submit_assessment'](self.data,SimpleNamespace(id='owner'))
            self.assertEqual(error.exception.status_code,409)
            setattr(self.data,field,old)
    def test_incomplete_import_is_not_silently_written_again(self):
        self.get_dashboard.side_effect=Denied(status_code=404,detail='Missing result')
        with self.assertRaises(Denied) as error:self.env['submit_assessment'](self.data,SimpleNamespace(id='owner'))
        self.assertEqual(error.exception.status_code,409)
    def test_import_ids_are_scoped_to_account(self):
        other_id=str(uuid5(NAMESPACE_URL,f'carbonai:other:{self.submission}'))
        self.assertNotEqual(other_id,self.company_id)

class ImportFlowTests(unittest.TestCase):
    def test_two_year_save_linking_and_retry_do_not_duplicate_assessments(self):
        from snapshots import calculation_snapshot, calculation_source
        from forecasting import forecast_history, CATEGORIES
        class MemoryQuery:
            def __init__(self, db, table): self.db=db;self.table=table;self.filters=[];self.add=None
            def select(self,*args):return self
            def eq(self,key,value):self.filters.append((key,value));return self
            def order(self,*args,**kwargs):return self
            def limit(self,*args):return self
            def insert(self,data):self.add=data if isinstance(data,list) else [data];return self
            def execute(self):
                if self.add is not None:
                    inserted=[{'id':str(uuid4()),'created_at':'2026-01-01','calculated_at':'2026-01-01',**row} for row in self.add]
                    self.db[self.table].extend(inserted)
                    return SimpleNamespace(data=inserted)
                return SimpleNamespace(data=[row for row in self.db[self.table] if all(row.get(key)==value for key,value in self.filters)])
        db={key:[] for key in ('companies','emission_entries','results')}
        tree=ast.parse((Path(__file__).resolve().parents[1]/'main.py').read_text())
        functions=[]
        for node in tree.body:
            if isinstance(node,ast.FunctionDef) and node.name in {'submit_assessment','get_dashboard_results','calculate_category_totals','build_breakdown'}:
                node.decorator_list=[]
                node.args.defaults=[ast.Constant(None) if isinstance(value,ast.Call) else value for value in node.args.defaults]
                functions.append(node)
        env={'AssessmentInput':object,'HTTPException':Denied,'supabase_admin':SimpleNamespace(table=lambda table:MemoryQuery(db,table)),
             'get_factor_map':lambda _:dict.fromkeys(CATEGORIES,1),'calculation_snapshot':calculation_snapshot,'calculation_source':calculation_source}
        exec(compile(ast.fix_missing_locations(ast.Module(body=functions,type_ignores=[])),'flow','exec'),env)
        first=SimpleNamespace(submission_id=uuid4(),reporting_year=2024,forecast_series_id=None,company_name='QA',industry='general',location='QA',employee_count=10,**dict.fromkeys(CATEGORIES,100))
        first_result=env['submit_assessment'](first,SimpleNamespace(id='owner'))
        second=SimpleNamespace(**{**vars(first),'submission_id':uuid4(),'reporting_year':2025,'forecast_series_id':first_result['company_id']})
        second_result=env['submit_assessment'](second,SimpleNamespace(id='owner'))
        repeated=env['submit_assessment'](first,SimpleNamespace(id='owner'))
        self.assertEqual(repeated['company_id'],first_result['company_id'])
        self.assertEqual(len(db['companies']),2)
        self.assertEqual(len(db['results']),2)
        self.assertEqual(len(db['emission_entries']),16)
        self.assertTrue(all(row['forecast_series_id']==first_result['company_id'] for row in db['companies']))
        history=[{**company,'values':{row['category']:row['value'] for row in db['emission_entries'] if row['company_id']==company['id']}} for company in db['companies']]
        forecast=forecast_history(history,dict.fromkeys(CATEGORIES,1),second_result['company_id'])
        self.assertEqual(forecast['status'],'ready')
        self.assertEqual(forecast['forecast_year'],2026)
