"""
Módulo de carregamento de dados melhorado para o dataGPT
"""
import pandas as pd
import streamlit as st
import requests
from typing import Tuple, Optional
from src.validators import DataValidator, SecurityValidator

class DataLoader:
    """Classe para carregamento e validação de dados"""
    
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            "User-Agent": "dataGPT/2.6"
        })
    
    def get_csv_export_url(self, url: str) -> Tuple[bool, Optional[str], Optional[str]]:
    """
    Converte o URL de visualização do Google Sheets para um URL de exportação CSV.

        Args:
    url (str): O URL de visualização do Google Sheets.

    Returns:
            Tuple[bool, Optional[str], Optional[str]]: (success, csv_url, error_message)
    """
    try:
            # Sanitizar URL
            url = SecurityValidator.sanitize_input(url, max_length=500)
            
            # Validar URL do Google Sheets
            is_valid, file_id, error = DataValidator.validate_google_sheets_url(url)
            if not is_valid:
                return False, None, error
            
            # Construir URL de exportação CSV
            csv_export_url = f"https://docs.google.com/spreadsheets/d/{file_id}/export?format=csv"
            return True, csv_export_url, None
            
        except Exception as e:
            return False, None, f"Erro ao processar URL: {str(e)}"
    
    def load_data_from_url(self, url: str) -> Tuple[bool, Optional[pd.DataFrame], Optional[str]]:
        """
        Carrega os dados do Google Sheets em um DataFrame pandas.

        Args:
            url (str): O URL de visualização do Google Sheets.

        Returns:
            Tuple[bool, Optional[pd.DataFrame], Optional[str]]: (success, dataframe, error_message)
        """
        try:
            # Obter URL de exportação CSV
            success, csv_url, error = self.get_csv_export_url(url)
            if not success:
                return False, None, error
            
            # Fazer requisição para o CSV
            response = self.session.get(csv_url, timeout=30)
            response.raise_for_status()
            
            # Verificar se a resposta é um CSV válido
            if not response.text.strip():
                return False, None, "Arquivo CSV está vazio"
            
            # Carregar dados no DataFrame
            from io import StringIO
            data = pd.read_csv(StringIO(response.text))
            
            # Validar DataFrame
            is_valid, error = DataValidator.validate_dataframe(data)
            if not is_valid:
                return False, None, error
            
            return True, data, None
            
        except requests.exceptions.Timeout:
            return False, None, "Timeout ao carregar dados do Google Sheets"
        except requests.exceptions.ConnectionError:
            return False, None, "Erro de conexão ao carregar dados"
        except requests.exceptions.RequestException as e:
            return False, None, f"Erro na requisição: {str(e)}"
        except pd.errors.EmptyDataError:
            return False, None, "Arquivo CSV está vazio ou malformado"
        except pd.errors.ParserError as e:
            return False, None, f"Erro ao processar CSV: {str(e)}"
        except Exception as e:
            return False, None, f"Erro inesperado ao carregar dados: {str(e)}"
    
    def clean_data(self, data: pd.DataFrame) -> pd.DataFrame:
        """
        Limpa e prepara os dados para visualização
        
        Args:
            data: DataFrame original
            
        Returns:
            pd.DataFrame: DataFrame limpo
        """
        # Fazer uma cópia para não modificar o original
        cleaned_data = data.copy()
        
        # Remover linhas completamente vazias
        cleaned_data = cleaned_data.dropna(how='all')
        
        # Converter colunas de data se possível
        for col in cleaned_data.columns:
            if cleaned_data[col].dtype == 'object':
                # Tentar converter para data
                try:
                    cleaned_data[col] = pd.to_datetime(cleaned_data[col], errors='ignore')
                except:
                    pass
        
        return cleaned_data

# Instância global do carregador de dados
data_loader = DataLoader()

# Funções de compatibilidade para manter a API existente
@st.cache_data
def get_csv_export_url(url: str) -> str:
    """
    Função de compatibilidade - converte URL para CSV
    
    Args:
        url: URL do Google Sheets
        
    Returns:
        str: URL de exportação CSV
        
    Raises:
        ValueError: Se URL for inválido
    """
    success, csv_url, error = data_loader.get_csv_export_url(url)
    if not success:
        raise ValueError(error)
    return csv_url

@st.cache_data
def load_data(url: str) -> pd.DataFrame:
    """
    Função de compatibilidade - carrega dados do Google Sheets

    Args:
        url: URL do Google Sheets

    Returns:
        pd.DataFrame: Dados carregados
        
    Raises:
        ValueError: Se houver erro no carregamento
    """
    success, data, error = data_loader.load_data_from_url(url)
    if not success:
        raise ValueError(error)
    
    # Limpar dados antes de retornar
    return data_loader.clean_data(data)
