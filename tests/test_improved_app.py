"""
Testes melhorados para o dataGPT v2.6
"""
import unittest
import pandas as pd
import sys
import os

# Adicionar o diretório pai ao path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from src.data_loader import DataLoader
from src.chart_generator import ChartGenerator
from src.validators import DataValidator, SecurityValidator
from src.api_client import APIClient
from config import Config

class TestDataLoader(unittest.TestCase):
    """Testes para o carregador de dados"""
    
    def setUp(self):
        self.loader = DataLoader()
    
    def test_validate_google_sheets_url_valid(self):
        """Testa validação de URL válido do Google Sheets"""
        url = "https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit"
        is_valid, file_id, error = DataValidator.validate_google_sheets_url(url)
        self.assertTrue(is_valid)
        self.assertIsNotNone(file_id)
        self.assertIsNone(error)
    
    def test_validate_google_sheets_url_invalid(self):
        """Testa validação de URL inválido"""
        url = "https://invalid-url.com"
        is_valid, file_id, error = DataValidator.validate_google_sheets_url(url)
        self.assertFalse(is_valid)
        self.assertIsNone(file_id)
        self.assertIsNotNone(error)
    
    def test_validate_dataframe_valid(self):
        """Testa validação de DataFrame válido"""
        data = pd.DataFrame({'x': [1, 2, 3], 'y': [4, 5, 6]})
        is_valid, error = DataValidator.validate_dataframe(data)
        self.assertTrue(is_valid)
        self.assertIsNone(error)
    
    def test_validate_dataframe_empty(self):
        """Testa validação de DataFrame vazio"""
        data = pd.DataFrame()
        is_valid, error = DataValidator.validate_dataframe(data)
        self.assertFalse(is_valid)
        self.assertIsNotNone(error)
    
    def test_validate_dataframe_insufficient_columns(self):
        """Testa validação de DataFrame com poucas colunas"""
        data = pd.DataFrame({'x': [1, 2, 3]})
        is_valid, error = DataValidator.validate_dataframe(data)
        self.assertFalse(is_valid)
        self.assertIsNotNone(error)

class TestChartGenerator(unittest.TestCase):
    """Testes para o gerador de gráficos"""
    
    def setUp(self):
        self.generator = ChartGenerator()
        self.sample_data = pd.DataFrame({
            'x': [1, 2, 3, 4, 5],
            'y': [2, 4, 6, 8, 10],
            'category': ['A', 'B', 'A', 'B', 'A']
        })
    
    def test_generate_line_chart(self):
        """Testa geração de gráfico de linha"""
        config = {
            'title': 'Test Chart',
            'x_axis_label': 'X Axis',
            'y_axis_label': 'Y Axis',
            'color': '#1f77b4',
            'show_totals': False
        }
        success, fig, error = self.generator.generate_chart(
            self.sample_data, 'x', 'y', 'Linha', config
        )
        self.assertTrue(success)
        self.assertIsNotNone(fig)
        self.assertIsNone(error)
    
    def test_generate_bar_chart(self):
        """Testa geração de gráfico de barra"""
        config = {
            'title': 'Test Chart',
            'x_axis_label': 'X Axis',
            'y_axis_label': 'Y Axis',
            'color': '#1f77b4',
            'show_totals': False
        }
        success, fig, error = self.generator.generate_chart(
            self.sample_data, 'x', 'y', 'Barra', config
        )
        self.assertTrue(success)
        self.assertIsNotNone(fig)
        self.assertIsNone(error)
    
    def test_generate_invalid_chart_type(self):
        """Testa geração com tipo de gráfico inválido"""
        config = {
            'title': 'Test Chart',
            'x_axis_label': 'X Axis',
            'y_axis_label': 'Y Axis',
            'color': '#1f77b4',
            'show_totals': False
        }
        success, fig, error = self.generator.generate_chart(
            self.sample_data, 'x', 'y', 'InvalidType', config
        )
        self.assertFalse(success)
        self.assertIsNone(fig)
        self.assertIsNotNone(error)
    
    def test_generate_chart_invalid_columns(self):
        """Testa geração com colunas inválidas"""
        config = {
            'title': 'Test Chart',
            'x_axis_label': 'X Axis',
            'y_axis_label': 'Y Axis',
            'color': '#1f77b4',
            'show_totals': False
        }
        success, fig, error = self.generator.generate_chart(
            self.sample_data, 'invalid_x', 'y', 'Linha', config
        )
        self.assertFalse(success)
        self.assertIsNone(fig)
        self.assertIsNotNone(error)

class TestSecurityValidator(unittest.TestCase):
    """Testes para validações de segurança"""
    
    def test_validate_api_key_valid(self):
        """Testa validação de chave API válida"""
        api_key = "valid_api_key_123"
        is_valid, error = SecurityValidator.validate_api_key(api_key)
        self.assertTrue(is_valid)
        self.assertIsNone(error)
    
    def test_validate_api_key_empty(self):
        """Testa validação de chave API vazia"""
        api_key = ""
        is_valid, error = SecurityValidator.validate_api_key(api_key)
        self.assertFalse(is_valid)
        self.assertIsNotNone(error)
    
    def test_validate_api_key_too_short(self):
        """Testa validação de chave API muito curta"""
        api_key = "short"
        is_valid, error = SecurityValidator.validate_api_key(api_key)
        self.assertFalse(is_valid)
        self.assertIsNotNone(error)
    
    def test_sanitize_input_normal(self):
        """Testa sanitização de entrada normal"""
        text = "Normal text input"
        sanitized = SecurityValidator.sanitize_input(text)
        self.assertEqual(sanitized, "Normal text input")
    
    def test_sanitize_input_with_html(self):
        """Testa sanitização de entrada com HTML"""
        text = "<script>alert('xss')</script>"
        sanitized = SecurityValidator.sanitize_input(text)
        self.assertNotIn("<script>", sanitized)
        self.assertIn("&lt;script&gt;", sanitized)
    
    def test_sanitize_input_with_control_chars(self):
        """Testa sanitização de entrada com caracteres de controle"""
        text = "Text\x00with\x1fcontrol\x7fchars"
        sanitized = SecurityValidator.sanitize_input(text)
        self.assertEqual(sanitized, "Textwithcontrolchars")

class TestDataValidator(unittest.TestCase):
    """Testes para validações de dados"""
    
    def test_validate_chart_columns_valid(self):
        """Testa validação de colunas válidas"""
        data = pd.DataFrame({'x': [1, 2, 3], 'y': [4, 5, 6]})
        is_valid, error = DataValidator.validate_chart_columns(data, 'x', 'y')
        self.assertTrue(is_valid)
        self.assertIsNone(error)
    
    def test_validate_chart_columns_same_column(self):
        """Testa validação com mesma coluna para X e Y"""
        data = pd.DataFrame({'x': [1, 2, 3], 'y': [4, 5, 6]})
        is_valid, error = DataValidator.validate_chart_columns(data, 'x', 'x')
        self.assertFalse(is_valid)
        self.assertIsNotNone(error)
    
    def test_validate_chart_columns_missing_column(self):
        """Testa validação com coluna inexistente"""
        data = pd.DataFrame({'x': [1, 2, 3], 'y': [4, 5, 6]})
        is_valid, error = DataValidator.validate_chart_columns(data, 'x', 'z')
        self.assertFalse(is_valid)
        self.assertIsNotNone(error)
    
    def test_validate_chart_type_valid(self):
        """Testa validação de tipo de gráfico válido"""
        is_valid, error = DataValidator.validate_chart_type('Linha')
        self.assertTrue(is_valid)
        self.assertIsNone(error)
    
    def test_validate_chart_type_invalid(self):
        """Testa validação de tipo de gráfico inválido"""
        is_valid, error = DataValidator.validate_chart_type('InvalidType')
        self.assertFalse(is_valid)
        self.assertIsNotNone(error)

class TestConfig(unittest.TestCase):
    """Testes para configuração"""
    
    def test_get_api_config(self):
        """Testa obtenção de configuração da API"""
        config = Config.get_api_config()
        self.assertIsInstance(config, dict)
        self.assertIn('api_key', config)
        self.assertIn('email', config)
        self.assertIn('password', config)
        self.assertIn('base_url', config)
    
    def test_get_missing_config(self):
        """Testa obtenção de configurações faltantes"""
        missing = Config.get_missing_config()
        self.assertIsInstance(missing, list)

class TestAPIClient(unittest.TestCase):
    """Testes para cliente API"""
    
    def setUp(self):
        self.client = APIClient()
    
    def test_client_initialization(self):
        """Testa inicialização do cliente"""
        self.assertIsNotNone(self.client.config)
        self.assertIsNotNone(self.client.session)

if __name__ == '__main__':
    # Executar todos os testes
    unittest.main(verbosity=2)
