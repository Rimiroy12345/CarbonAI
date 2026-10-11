import sys
import unittest
from pathlib import Path
from types import SimpleNamespace
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from management import management_access, summarize

class ManagementTests(unittest.TestCase):
    def test_roles_are_server_metadata_only(self):
        self.assertTrue(management_access(SimpleNamespace(app_metadata={},is_anonymous=False)))
        self.assertFalse(management_access(SimpleNamespace(app_metadata={'carbonai_role':'member'}, user_metadata={'carbonai_role':'management'})))
        self.assertFalse(management_access(SimpleNamespace(app_metadata={'carbonai_role':'bogus'})))
        self.assertFalse(management_access(SimpleNamespace(app_metadata={},is_anonymous=True)))
    def test_summary_units_and_comparison(self):
        data={'reporting_year':2025,'activities':[{'category':'electricity','scope':2,'emissions_kgco2e':2000},{'category':'diesel','scope':1,'emissions_kgco2e':1000}]}
        result=summarize(data,{'reporting_year':2024,'total_kgco2e':2000})
        self.assertEqual(result['current_tco2e'],3)
        self.assertEqual(result['scopes']['2'],2)
        self.assertEqual(result['comparison']['change_pct'],50)
    def test_zero_prior_and_missing_history(self):
        data={'activities':[]}
        self.assertIsNone(summarize(data)['comparison'])
        self.assertIsNone(summarize(data,{'reporting_year':2024,'total_kgco2e':0})['comparison']['change_pct'])

if __name__=='__main__':unittest.main()
