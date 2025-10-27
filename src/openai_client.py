"""
Cliente OpenAI para o dataGPT v2.6
"""
import openai
import pandas as pd
from typing import Dict, Any, Optional, Tuple
import streamlit as st
from config import Config

class OpenAIClient:
    """Cliente para comunicação com a API da OpenAI"""
    
    def __init__(self):
        self.config = Config()
        self.client = None
        self._initialize_client()
    
    def _initialize_client(self):
        """Inicializa o cliente OpenAI"""
        if self.config.OPENAI_API_KEY:
            openai.api_key = self.config.OPENAI_API_KEY
            self.client = openai.OpenAI(api_key=self.config.OPENAI_API_KEY)
    
    def analyze_data(self, prompt: str, data: pd.DataFrame, chart_info: Dict[str, Any]) -> Tuple[bool, Optional[str], Optional[str]]:
        """
        Envia dados para análise pela IA da OpenAI
        
        Args:
            prompt: Prompt para análise
            data: DataFrame com os dados
            chart_info: Informações do gráfico
            
        Returns:
            Tuple[bool, Optional[str], Optional[str]]: (success, analysis, error_message)
        """
        try:
            if not self.client:
                return False, None, "Cliente OpenAI não inicializado. Verifique a chave API."
            
            # Preparar dados para análise
            data_summary = self._prepare_data_summary(data, chart_info)
            
            # Criar prompt completo
            full_prompt = self._create_analysis_prompt(prompt, data_summary, chart_info)
            
            # Fazer requisição para a OpenAI
            response = self.client.chat.completions.create(
                model=self.config.OPENAI_MODEL,
                messages=[
                    {
                        "role": "system",
                        "content": "Você é um especialista em análise de dados. Analise os dados fornecidos e forneça insights detalhados sobre tendências, padrões e conclusões importantes."
                    },
                    {
                        "role": "user",
                        "content": full_prompt
                    }
                ],
                max_tokens=self.config.OPENAI_MAX_TOKENS,
                temperature=self.config.OPENAI_TEMPERATURE
            )
            
            analysis = response.choices[0].message.content
            return True, analysis, None
            
        except openai.AuthenticationError:
            return False, None, "Erro de autenticação com a OpenAI. Verifique sua chave API."
        except openai.RateLimitError:
            return False, None, "Limite de taxa excedido. Tente novamente em alguns minutos."
        except openai.APIError as e:
            return False, None, f"Erro da API OpenAI: {str(e)}"
        except Exception as e:
            return False, None, f"Erro inesperado na análise: {str(e)}"
    
    def _prepare_data_summary(self, data: pd.DataFrame, chart_info: Dict[str, Any]) -> str:
        """Prepara um resumo dos dados para análise"""
        try:
            summary = f"""
Dados do Gráfico:
- Título: {chart_info.get('title', 'N/A')}
- Tipo: {chart_info.get('chart_type', 'N/A')}
- Eixo X: {chart_info.get('x_axis_label', 'N/A')}
- Eixo Y: {chart_info.get('y_axis_label', 'N/A')}
- Total de registros: {len(data)}
- Colunas: {', '.join(data.columns.tolist())}

Estatísticas Descritivas:
{data.describe().to_string()}

Primeiras 5 linhas dos dados:
{data.head().to_string()}
"""
            return summary
        except Exception as e:
            return f"Erro ao preparar resumo dos dados: {str(e)}"
    
    def _create_analysis_prompt(self, user_prompt: str, data_summary: str, chart_info: Dict[str, Any]) -> str:
        """Cria o prompt completo para análise"""
        return f"""
{user_prompt}

{data_summary}

Por favor, forneça uma análise detalhada dos dados, incluindo:
1. Tendências principais observadas
2. Padrões interessantes nos dados
3. Insights e conclusões importantes
4. Recomendações baseadas nos dados
5. Observações sobre a qualidade dos dados

Mantenha a análise clara, objetiva e útil para tomada de decisões.
"""
    
    def is_available(self) -> bool:
        """Verifica se o cliente OpenAI está disponível"""
        return self.client is not None and self.config.OPENAI_API_KEY is not None

# Instância global do cliente OpenAI
openai_client = OpenAIClient()
