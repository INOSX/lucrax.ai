"""
Cliente API melhorado para o dataGPT
"""
import requests
import pandas as pd
from typing import Dict, Any, Optional, Tuple
import streamlit as st
from config import Config
from src.validators import SecurityValidator

class APIClient:
    """Cliente para comunicação com APIs externas"""
    
    def __init__(self):
        self.config = Config.get_api_config()
        self.session = requests.Session()
        self.session.headers.update({
            "Content-Type": "application/json",
            "User-Agent": "dataGPT/2.6"
        })
    
    def authenticate(self) -> Tuple[bool, Optional[str], Optional[str]]:
        """
        Autentica com a API NNeural
        
        Returns:
            Tuple[bool, Optional[str], Optional[str]]: (success, token, error_message)
        """
        try:
            # Validar configurações
            if not Config.validate_config():
                missing = Config.get_missing_config()
                return False, None, f"Configurações faltantes: {', '.join(missing)}"
            
            url = f"{self.config['base_url']}/login"
            payload = {
                "email": self.config['email'],
                "password": self.config['password']
            }
            
            response = self.session.post(url, json=payload, timeout=30)
            
            if response.status_code == 200:
                data = response.json()
                token = data.get("access_token")
                if token:
                    return True, token, None
                else:
                    return False, None, "Token de acesso não encontrado na resposta"
            else:
                return False, None, f"Erro na autenticação: {response.status_code} - {response.text}"
                
        except requests.exceptions.Timeout:
            return False, None, "Timeout na conexão com a API"
        except requests.exceptions.ConnectionError:
            return False, None, "Erro de conexão com a API"
        except requests.exceptions.RequestException as e:
            return False, None, f"Erro na requisição: {str(e)}"
        except Exception as e:
            return False, None, f"Erro inesperado: {str(e)}"
    
    def analyze_data(self, prompt: str, data: pd.DataFrame, chart_info: Dict[str, Any], token: str) -> Tuple[bool, Optional[str], Optional[str]]:
        """
        Envia dados para análise pela IA
        
        Args:
            prompt: Prompt para análise
            data: DataFrame com os dados
            chart_info: Informações do gráfico
            token: Token de autenticação
            
        Returns:
            Tuple[bool, Optional[str], Optional[str]]: (success, analysis, error_message)
        """
        try:
            # Validar entrada
            if not prompt or not isinstance(prompt, str):
                return False, None, "Prompt inválido"
            
            if data is None or data.empty:
                return False, None, "Dados não fornecidos ou vazios"
            
            if not token:
                return False, None, "Token de autenticação não fornecido"
            
            # Sanitizar prompt
            prompt = SecurityValidator.sanitize_input(prompt, max_length=2000)
            
            url = f"{self.config['base_url']}/chat"
            headers = {
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json"
            }
            
            payload = {
                "prompt": prompt,
                "data": data.to_dict(orient='records'),
                "chart_info": chart_info
            }
            
            response = self.session.post(url, json=payload, headers=headers, timeout=60)
            
            if response.status_code == 200:
                data = response.json()
                analysis = data.get("response")
                if analysis:
                    return True, analysis, None
                else:
                    return False, None, "Análise não encontrada na resposta"
            else:
                return False, None, f"Erro na análise: {response.status_code} - {response.text}"
                
        except requests.exceptions.Timeout:
            return False, None, "Timeout na análise de dados"
        except requests.exceptions.ConnectionError:
            return False, None, "Erro de conexão durante a análise"
        except requests.exceptions.RequestException as e:
            return False, None, f"Erro na requisição de análise: {str(e)}"
        except Exception as e:
            return False, None, f"Erro inesperado na análise: {str(e)}"

class APICache:
    """Cache simples para tokens e respostas da API"""
    
    def __init__(self):
        self._token_cache = {}
        self._analysis_cache = {}
    
    def get_token(self, key: str) -> Optional[str]:
        """Recupera token do cache"""
        return self._token_cache.get(key)
    
    def set_token(self, key: str, token: str) -> None:
        """Armazena token no cache"""
        self._token_cache[key] = token
    
    def get_analysis(self, key: str) -> Optional[str]:
        """Recupera análise do cache"""
        return self._analysis_cache.get(key)
    
    def set_analysis(self, key: str, analysis: str) -> None:
        """Armazena análise no cache"""
        self._analysis_cache[key] = analysis
    
    def clear_cache(self) -> None:
        """Limpa todo o cache"""
        self._token_cache.clear()
        self._analysis_cache.clear()

# Instância global do cliente API
api_client = APIClient()
api_cache = APICache()
