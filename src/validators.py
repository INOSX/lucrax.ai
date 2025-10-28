"""
Módulo de validação e segurança para o dataGPT
"""
import re
import pandas as pd
from typing import Optional, Tuple, List
from urllib.parse import urlparse
import streamlit as st

class DataValidator:
    """Classe para validação de dados e URLs"""
    
    # Padrões de regex para validação
    GOOGLE_SHEETS_PATTERN = re.compile(
        r'https://docs\.google\.com/spreadsheets/d/([a-zA-Z0-9-_]+)'
    )
    CSV_URL_PATTERN = re.compile(
        r'https://docs\.google\.com/spreadsheets/d/([a-zA-Z0-9-_]+)/export\?format=csv'
    )
    
    @staticmethod
    def validate_google_sheets_url(url: str) -> Tuple[bool, Optional[str], Optional[str]]:
        """
        Valida se a URL é um Google Sheets válido
        
        Args:
            url: URL para validar
            
        Returns:
            Tuple[bool, Optional[str], Optional[str]]: (is_valid, file_id, error_message)
        """
        if not url or not isinstance(url, str):
            return False, None, "URL não fornecida ou inválida"
        
        # Verificar se é uma URL válida
        try:
            parsed = urlparse(url)
            if not parsed.scheme or not parsed.netloc:
                return False, None, "URL malformada"
        except Exception:
            return False, None, "URL inválida"
        
        # Verificar padrão do Google Sheets
        match = DataValidator.GOOGLE_SHEETS_PATTERN.match(url)
        if not match:
            return False, None, "URL não é um Google Sheets válido"
        
        file_id = match.group(1)
        if not file_id or len(file_id) < 10:
            return False, None, "ID do arquivo inválido"
        
        return True, file_id, None
    
    @staticmethod
    def sanitize_url(url: str) -> str:
        """
        Sanitiza URL removendo caracteres perigosos
        
        Args:
            url: URL para sanitizar
            
        Returns:
            str: URL sanitizada
        """
        if not url:
            return ""
        
        # Remover caracteres de controle e espaços extras
        sanitized = re.sub(r'[\x00-\x1f\x7f-\x9f]', '', url.strip())
        
        # Verificar se ainda é uma URL válida
        try:
            urlparse(sanitized)
            return sanitized
        except Exception:
            return ""
    
    @staticmethod
    def validate_dataframe(data: pd.DataFrame) -> Tuple[bool, Optional[str]]:
        """
        Valida se o DataFrame é válido para visualização
        
        Args:
            data: DataFrame para validar
            
        Returns:
            Tuple[bool, Optional[str]]: (is_valid, error_message)
        """
        if data is None:
            return False, "Dados não fornecidos"
        
        if not isinstance(data, pd.DataFrame):
            return False, "Dados não são um DataFrame válido"
        
        if data.empty:
            return False, "DataFrame está vazio"
        
        if len(data.columns) < 2:
            return False, "DataFrame deve ter pelo menos 2 colunas"
        
        if len(data) < 1:
            return False, "DataFrame deve ter pelo menos 1 linha"
        
        # Verificar se há colunas com todos os valores nulos
        null_columns = data.columns[data.isnull().all()].tolist()
        if null_columns:
            return False, f"Colunas com todos os valores nulos: {', '.join(null_columns)}"
        
        return True, None
    
    @staticmethod
    def validate_chart_columns(data: pd.DataFrame, x_col: str, y_col: str) -> Tuple[bool, Optional[str]]:
        """
        Valida se as colunas selecionadas são válidas para o gráfico
        
        Args:
            data: DataFrame
            x_col: Nome da coluna X
            y_col: Nome da coluna Y
            
        Returns:
            Tuple[bool, Optional[str]]: (is_valid, error_message)
        """
        if not x_col or not y_col:
            return False, "Colunas X e Y devem ser selecionadas"
        
        if x_col not in data.columns:
            return False, f"Coluna X '{x_col}' não encontrada nos dados"
        
        if y_col not in data.columns:
            return False, f"Coluna Y '{y_col}' não encontrada nos dados"
        
        if x_col == y_col:
            return False, "Colunas X e Y devem ser diferentes"
        
        # Verificar se as colunas têm dados válidos
        if data[x_col].isnull().all():
            return False, f"Coluna X '{x_col}' contém apenas valores nulos"
        
        if data[y_col].isnull().all():
            return False, f"Coluna Y '{y_col}' contém apenas valores nulos"
        
        return True, None
    
    @staticmethod
    def validate_chart_type(chart_type: str) -> Tuple[bool, Optional[str]]:
        """
        Valida se o tipo de gráfico é suportado
        
        Args:
            chart_type: Tipo de gráfico
            
        Returns:
            Tuple[bool, Optional[str]]: (is_valid, error_message)
        """
        valid_types = ['Linha', 'Barra', 'Dispersão', 'Histograma', 'Boxplot', 'Heatmap', 'Áreas', 'Violino', 'Bar', 'Line', 'Scatter', 'Pie', 'Area']
        
        if not chart_type:
            return False, "Tipo de gráfico não selecionado"
        
        if chart_type not in valid_types:
            return False, f"Tipo de gráfico '{chart_type}' não é suportado"
        
        return True, None

class SecurityValidator:
    """Classe para validações de segurança"""
    
    @staticmethod
    def validate_api_key(api_key: str) -> Tuple[bool, Optional[str]]:
        """
        Valida se a chave API tem formato válido
        
        Args:
            api_key: Chave API para validar
            
        Returns:
            Tuple[bool, Optional[str]]: (is_valid, error_message)
        """
        if not api_key:
            return False, "Chave API não fornecida"
        
        if not isinstance(api_key, str):
            return False, "Chave API deve ser uma string"
        
        if len(api_key) < 10:
            return False, "Chave API muito curta"
        
        if len(api_key) > 200:
            return False, "Chave API muito longa"
        
        # Verificar se contém apenas caracteres válidos
        if not re.match(r'^[a-zA-Z0-9_\-\.]+$', api_key):
            return False, "Chave API contém caracteres inválidos"
        
        return True, None
    
    @staticmethod
    def sanitize_input(text: str, max_length: int = 1000) -> str:
        """
        Sanitiza entrada de texto do usuário
        
        Args:
            text: Texto para sanitizar
            max_length: Comprimento máximo permitido
            
        Returns:
            str: Texto sanitizado
        """
        if not text:
            return ""
        
        # Limitar comprimento
        text = text[:max_length]
        
        # Remover caracteres de controle
        text = re.sub(r'[\x00-\x1f\x7f-\x9f]', '', text)
        
        # Escapar caracteres HTML perigosos
        text = text.replace('<', '&lt;').replace('>', '&gt;')
        text = text.replace('"', '&quot;').replace("'", '&#x27;')
        text = text.replace('&', '&amp;')
        
        return text.strip()
    
    @staticmethod
    def validate_file_size(file_size: int, max_size_mb: int = 50) -> Tuple[bool, Optional[str]]:
        """
        Valida tamanho do arquivo
        
        Args:
            file_size: Tamanho do arquivo em bytes
            max_size_mb: Tamanho máximo em MB
            
        Returns:
            Tuple[bool, Optional[str]]: (is_valid, error_message)
        """
        max_size_bytes = max_size_mb * 1024 * 1024
        
        if file_size > max_size_bytes:
            return False, f"Arquivo muito grande. Máximo permitido: {max_size_mb}MB"
        
        return True, None
