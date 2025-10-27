"""
Configurações centralizadas para o dataGPT v2.6
"""
import os
from dotenv import load_dotenv
from typing import Optional, Dict, Any

# Carregar variáveis de ambiente
load_dotenv()

class Config:
    """Classe de configuração centralizada para o dataGPT"""
    
    # Configurações da API
    OPENAI_API_KEY: Optional[str] = os.getenv("OPENAI_API_KEY")
    OPENAI_MODEL: str = os.getenv("OPENAI_MODEL", "gpt-3.5-turbo")
    OPENAI_MAX_TOKENS: int = int(os.getenv("OPENAI_MAX_TOKENS", "1000"))
    OPENAI_TEMPERATURE: float = float(os.getenv("OPENAI_TEMPERATURE", "0.7"))
    
    # Configurações legadas (para compatibilidade)
    NNEURAL_API_KEY: Optional[str] = os.getenv("NNEURAL_API_KEY")
    FIXED_USER_EMAIL: Optional[str] = os.getenv("FIXED_USER_EMAIL")
    FIXED_USER_PASSWORD: Optional[str] = os.getenv("FIXED_USER_PASSWORD")
    API_BASE_URL: str = os.getenv("API_BASE_URL", "http://93.127.210.77:5000")
    
    # Configurações da aplicação
    APP_TITLE: str = "dataGPT v2.6 - Gratuito e de código aberto"
    PAGE_ICON: str = "images/favicon.ico"
    LAYOUT: str = "wide"
    SIDEBAR_STATE: str = "expanded"
    
    # Configurações de rede neural
    NEURAL_NETWORK: str = "NNeural.io"
    
    # Configurações de gráficos
    DEFAULT_COLOR: str = "#1f77b4"
    CHART_TYPES: list = [
        'Linha', 'Barra', 'Dispersão', 'Histograma', 
        'Boxplot', 'Heatmap', 'Áreas', 'Violino'
    ]
    
    # Configurações de templates
    REPORT_TEMPLATES: list = ["Template 1", "Template 2"]
    
    # Configurações de validação
    MAX_FILE_SIZE_MB: int = 50
    ALLOWED_FILE_TYPES: list = ['.csv', '.xlsx', '.xls']
    
    @classmethod
    def get_api_config(cls) -> Dict[str, Any]:
        """Retorna configurações da API"""
        return {
            "api_key": cls.NNEURAL_API_KEY,
            "email": cls.FIXED_USER_EMAIL,
            "password": cls.FIXED_USER_PASSWORD,
            "base_url": cls.API_BASE_URL
        }
    
    @classmethod
    def validate_config(cls) -> bool:
        """Valida se as configurações necessárias estão presentes"""
        # Priorizar OpenAI, mas manter compatibilidade com NNeural
        if cls.OPENAI_API_KEY:
            return True
        else:
            # Fallback para NNeural
            required_vars = [
                cls.NNEURAL_API_KEY,
                cls.FIXED_USER_EMAIL,
                cls.FIXED_USER_PASSWORD
            ]
            return all(var is not None for var in required_vars)
    
    @classmethod
    def get_missing_config(cls) -> list:
        """Retorna lista de configurações faltantes"""
        missing = []
        if not cls.OPENAI_API_KEY and not cls.NNEURAL_API_KEY:
            missing.append("OPENAI_API_KEY ou NNEURAL_API_KEY")
        if not cls.OPENAI_API_KEY and cls.NNEURAL_API_KEY:
            if not cls.FIXED_USER_EMAIL:
                missing.append("FIXED_USER_EMAIL")
            if not cls.FIXED_USER_PASSWORD:
                missing.append("FIXED_USER_PASSWORD")
        return missing