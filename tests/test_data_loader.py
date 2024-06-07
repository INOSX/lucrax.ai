import unittest
import pandas as pd
from src.data_loader import load_data


class TestDataLoader(unittest.TestCase):
    def test_load_data(self):
        # Use um link de teste válido do Google Sheets
        url = (
            "https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/export"
            "?format=csv"
        )
        data = load_data(url)
        self.assertFalse(data.empty)
        self.assertIsInstance(data, pd.DataFrame)


if __name__ == '__main__':
    unittest.main()
