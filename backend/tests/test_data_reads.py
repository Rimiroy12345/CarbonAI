import sys
import unittest
from pathlib import Path
from unittest.mock import Mock, patch
from httpx import ReadError
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from data_reads import retry_data_reads

class DataReadTests(unittest.TestCase):
    def test_read_interruption_retries_then_succeeds(self):
        read = Mock(side_effect=[ReadError('Synthetic closed connection'), {'status': 'ready'}])
        with patch('data_reads.sleep'):
            self.assertEqual(retry_data_reads(read)(), {'status': 'ready'})
        self.assertEqual(read.call_count, 2)
    def test_persistent_outage_has_bounded_retries(self):
        read = Mock(side_effect=ReadError('Synthetic outage'))
        with patch('data_reads.sleep'), self.assertRaises(ReadError): retry_data_reads(read)()
        self.assertEqual(read.call_count, 3)
    def test_validation_and_permission_errors_are_not_retried(self):
        read = Mock(side_effect=ValueError('Synthetic validation failure'))
        with self.assertRaises(ValueError): retry_data_reads(read)()
        self.assertEqual(read.call_count, 1)
