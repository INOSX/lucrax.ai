import unittest
import pandas as pd
from src.data_loader import load_data
from src.plotter import generate_plot, save_plot_as_html

class TestApp(unittest.TestCase):
    def test_load_data(self):
        # Use um link de teste válido do Google Sheets
        url = (
            "https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/export"
            "?format=csv"
        )
        data = load_data(url)
        self.assertFalse(data.empty)
        self.assertIsInstance(data, pd.DataFrame)

    def test_generate_plot(self):
        data = pd.DataFrame({'x': [1, 2, 3], 'y': [4, 5, 6]})
        fig = generate_plot(data, 'x', 'y', chart_type='Linha')
        self.assertIsNotNone(fig)
    
    def test_generate_bar_plot(self):
        data = pd.DataFrame({'x': [1, 2, 3], 'y': [4, 5, 6]})
        fig = generate_plot(data, 'x', 'y', chart_type='Barra')
        self.assertIsNotNone(fig)

    def test_generate_scatter_plot(self):
        data = pd.DataFrame({'x': [1, 2, 3], 'y': [4, 5, 6]})
        fig = generate_plot(data, 'x', 'y', chart_type='Dispersão')
        self.assertIsNotNone(fig)
    
    def test_save_plot_as_html(self):
        data = pd.DataFrame({'x': [1, 2, 3], 'y': [4, 5, 6]})
        fig = generate_plot(data, 'x', 'y', chart_type='Linha')
        html_bytes = save_plot_as_html(fig)
        
        # Ajustar a verificação com base na saída real
        self.assertTrue(html_bytes.startswith(b'<html>'))

        # Salvar o HTML em um arquivo para visualização
        with open("test_output.html", "wb") as f:
            f.write(html_bytes)
        print("HTML salvo em test_output.html")

if __name__ == '__main__':
    unittest.main()
