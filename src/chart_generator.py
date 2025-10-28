"""
Gerador de gráficos melhorado para o dataGPT
"""
import plotly.express as px
import plotly.io as pio
import matplotlib.pyplot as plt
import seaborn as sns
import pandas as pd
import io
from typing import Dict, Any, Optional, Tuple
import streamlit as st
from src.validators import DataValidator

class ChartGenerator:
    """Classe para geração de gráficos com validação e tratamento de erros"""
    
    def __init__(self):
        self.supported_types = ['Linha', 'Barra', 'Dispersão', 'Histograma', 'Boxplot', 'Heatmap', 'Áreas', 'Violino', 'Bar', 'Line', 'Scatter', 'Pie', 'Area']
    
    def generate_chart(self, data: pd.DataFrame, x_col: str, y_col: str, 
                      chart_type: str, chart_config: Dict[str, Any]) -> Tuple[bool, Optional[Any], Optional[str]]:
        """
        Gera gráfico com base nos parâmetros fornecidos
        
        Args:
            data: DataFrame com os dados
            x_col: Coluna para eixo X
            y_col: Coluna para eixo Y
            chart_type: Tipo de gráfico
            chart_config: Configurações do gráfico
            
        Returns:
            Tuple[bool, Optional[Any], Optional[str]]: (success, figure, error_message)
        """
        try:
            # Validar entrada
            is_valid, error = DataValidator.validate_chart_columns(data, x_col, y_col)
            if not is_valid:
                return False, None, error
            
            is_valid, error = DataValidator.validate_chart_type(chart_type)
            if not is_valid:
                return False, None, error
            
            # Gerar gráfico baseado no tipo
            if chart_type in ['Linha', 'Barra', 'Dispersão', 'Áreas', 'Bar', 'Line', 'Scatter', 'Area', 'Pie']:
                return self._generate_plotly_chart(data, x_col, y_col, chart_type, chart_config)
            else:
                return self._generate_matplotlib_chart(data, x_col, y_col, chart_type, chart_config)
                
        except Exception as e:
            return False, None, f"Erro ao gerar gráfico: {str(e)}"
    
    def _generate_plotly_chart(self, data: pd.DataFrame, x_col: str, y_col: str, 
                              chart_type: str, config: Dict[str, Any]) -> Tuple[bool, Optional[Any], Optional[str]]:
        """Gera gráfico usando Plotly"""
        try:
            # Configurações padrão
            title = config.get('title', f'Gráfico de {x_col} vs {y_col}')
            x_label = config.get('x_axis_label', x_col)
            y_label = config.get('y_axis_label', y_col)
            color = config.get('color', '#1f77b4')
            show_totals = config.get('show_totals', False)
            
            # Gerar gráfico baseado no tipo
            if chart_type in ['Linha', 'Line']:
                fig = px.line(data, x=x_col, y=y_col, title=title, 
                            labels={x_col: x_label, y_col: y_label}, 
                            color_discrete_sequence=[color])
            elif chart_type in ['Barra', 'Bar']:
                fig = px.bar(data, x=x_col, y=y_col, title=title, 
                           labels={x_col: x_label, y_col: y_label}, 
                           color_discrete_sequence=[color])
            elif chart_type in ['Dispersão', 'Scatter']:
                fig = px.scatter(data, x=x_col, y=y_col, title=title, 
                               labels={x_col: x_label, y_col: y_label}, 
                               color_discrete_sequence=[color])
            elif chart_type in ['Áreas', 'Area']:
                fig = px.area(data, x=x_col, y=y_col, title=title, 
                            labels={x_col: x_label, y_col: y_label}, 
                            color_discrete_sequence=[color])
            elif chart_type == 'Pie':
                # Para gráfico de pizza, usar contagem de valores únicos
                value_counts = data[x_col].value_counts().head(10)
                fig = px.pie(
                    values=value_counts.values,
                    names=value_counts.index,
                    title=title,
                    color_discrete_sequence=px.colors.qualitative.Set3
                )
            else:
                return False, None, f"Tipo de gráfico {chart_type} não suportado pelo Plotly"
            
            # Adicionar totais se solicitado
            if show_totals:
                if chart_type in ['Linha', 'Dispersão', 'Áreas']:
                    fig.update_traces(texttemplate='%{y}', textposition='top center')
                elif chart_type == 'Barra':
                    fig.update_traces(texttemplate='%{y}', textposition='outside')
            
            # Configurações adicionais
            fig.update_layout(
                font=dict(size=12),
                plot_bgcolor='rgba(0,0,0,0)',
                paper_bgcolor='rgba(0,0,0,0)'
            )
            
            return True, fig, None
            
        except Exception as e:
            return False, None, f"Erro ao gerar gráfico Plotly: {str(e)}"
    
    def _generate_matplotlib_chart(self, data: pd.DataFrame, x_col: str, y_col: str, 
                                 chart_type: str, config: Dict[str, Any]) -> Tuple[bool, Optional[Any], Optional[str]]:
        """Gera gráfico usando Matplotlib/Seaborn"""
        try:
            # Configurações padrão
            title = config.get('title', f'Gráfico de {x_col} vs {y_col}')
            x_label = config.get('x_axis_label', x_col)
            y_label = config.get('y_axis_label', y_col)
            color = config.get('color', '#1f77b4')
            show_totals = config.get('show_totals', False)
            
            # Configurar estilo
            plt.style.use('default')
            fig, ax = plt.subplots(figsize=(10, 6))
            
            # Gerar gráfico baseado no tipo
            if chart_type == 'Histograma':
                ax.hist(data[y_col].dropna(), bins=30, color=color, alpha=0.7)
                ax.set_xlabel(x_label)
                ax.set_ylabel(y_label)
                
            elif chart_type == 'Boxplot':
                sns.boxplot(x=data[x_col], y=data[y_col], ax=ax, color=color)
                ax.set_xlabel(x_label)
                ax.set_ylabel(y_label)
                
            elif chart_type == 'Heatmap':
                # Calcular correlação para heatmap
                numeric_data = data.select_dtypes(include=['number'])
                if numeric_data.empty:
                    return False, None, "Nenhuma coluna numérica encontrada para heatmap"
                
                corr_matrix = numeric_data.corr()
                sns.heatmap(corr_matrix, annot=True, cmap='coolwarm', ax=ax)
                
            elif chart_type == 'Violino':
                sns.violinplot(x=data[x_col], y=data[y_col], ax=ax, color=color)
                ax.set_xlabel(x_label)
                ax.set_ylabel(y_label)
                
            else:
                return False, None, f"Tipo de gráfico {chart_type} não suportado pelo Matplotlib"
            
            # Configurações finais
            ax.set_title(title, fontsize=14, fontweight='bold')
            ax.grid(True, alpha=0.3)
            
            # Adicionar totais se solicitado
            if show_totals and chart_type == 'Histograma':
                counts, bins, patches = ax.hist(data[y_col].dropna(), bins=30, color=color, alpha=0.7)
                for i, count in enumerate(counts):
                    if count > 0:
                        ax.text(bins[i] + (bins[i+1] - bins[i])/2, count + 0.1, 
                               str(int(count)), ha='center', va='bottom')
            
            plt.tight_layout()
            return True, fig, None
            
        except Exception as e:
            return False, None, f"Erro ao gerar gráfico Matplotlib: {str(e)}"
    
    def save_chart_as_html(self, fig) -> Tuple[bool, Optional[bytes], Optional[str]]:
        """
        Salva gráfico Plotly como HTML
        
        Args:
            fig: Figura do Plotly
            
        Returns:
            Tuple[bool, Optional[bytes], Optional[str]]: (success, html_bytes, error_message)
        """
        try:
            buffer = io.StringIO()
            pio.write_html(fig, buffer)
            html_bytes = buffer.getvalue().encode('utf-8')
            return True, html_bytes, None
        except Exception as e:
            return False, None, f"Erro ao salvar gráfico como HTML: {str(e)}"
    
    def get_supported_types(self) -> list:
        """Retorna lista de tipos de gráfico suportados"""
        return self.supported_types.copy()

# Instância global do gerador de gráficos
chart_generator = ChartGenerator()
