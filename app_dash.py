"""
Lucrax.ai - Dashboard Profissional com Dash by Plotly
Migração completa do Streamlit para Dash mantendo todas as funcionalidades
"""
import dash
from dash import dcc, html, Input, Output, State, callback_context, dash_table
import plotly.express as px
import plotly.graph_objects as go
from plotly.subplots import make_subplots
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import requests
from io import StringIO
import json
from typing import Dict, Any, Optional, Tuple
import os
from dotenv import load_dotenv

# Importações locais
from src.data_loader import data_loader
from src.chart_generator import chart_generator
from src.api_client import api_client
from src.openai_client import openai_client
from src.validators import DataValidator, SecurityValidator
from config import Config

# Carregar variáveis de ambiente
load_dotenv()

# Inicializar aplicação Dash
app = dash.Dash(__name__)
app.title = "Lucrax.ai - Dashboard Profissional"

# Configurações do servidor
server = app.server

# CSS personalizado para o dashboard
app.index_string = '''
<!DOCTYPE html>
<html>
    <head>
        {%metas%}
        <title>{%title%}</title>
        {%favicon%}
        {%css%}
        <style>
            /* Reset e configurações gerais */
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            
            body {
                font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
                color: #ffffff;
                min-height: 100vh;
            }
            
            /* Top Bar Profissional */
            .top-bar {
                background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
                border-bottom: 3px solid #3b82f6;
                padding: 1rem 2rem;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
                position: relative;
                overflow: hidden;
            }
            
            .top-bar::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: linear-gradient(90deg, transparent 0%, rgba(59, 130, 246, 0.1) 50%, transparent 100%);
                animation: shimmer 3s infinite;
            }
            
            @keyframes shimmer {
                0% { transform: translateX(-100%); }
                100% { transform: translateX(100%); }
            }
            
            .main-title {
                font-size: 2rem;
                font-weight: 800;
                background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 50%, #ec4899 100%);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                background-clip: text;
                margin: 0;
                text-align: center;
                position: relative;
                z-index: 1;
                text-shadow: 0 0 30px rgba(59, 130, 246, 0.3);
            }
            
            .subtitle {
                font-size: 0.9rem;
                color: #94a3b8;
                text-align: center;
                margin-top: 0.5rem;
                font-weight: 500;
                position: relative;
                z-index: 1;
            }
            
            /* Cards de métricas */
            .metric-card {
                background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
                border: 1px solid #475569;
                border-radius: 12px;
                padding: 1.5rem;
                box-shadow: 0 4px 15px -3px rgba(0, 0, 0, 0.15);
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                position: relative;
                overflow: hidden;
                height: 140px;
                display: flex;
                flex-direction: column;
                justify-content: space-between;
            }
            
            .metric-card::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                height: 3px;
                background: linear-gradient(90deg, #3b82f6, #8b5cf6, #ec4899);
            }
            
            .metric-card:hover {
                transform: translateY(-4px) scale(1.01);
                box-shadow: 0 12px 25px -5px rgba(0, 0, 0, 0.25);
                border-color: #3b82f6;
            }
            
            .metric-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                margin-bottom: 0.5rem;
            }
            
            .metric-title {
                color: #94a3b8;
                font-size: 0.8rem;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 0.08em;
                margin: 0;
            }
            
            .metric-icon {
                font-size: 1.5rem;
                background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                background-clip: text;
            }
            
            .metric-value {
                color: #ffffff;
                font-size: 2.2rem;
                font-weight: 700;
                margin: 0.5rem 0;
                background: linear-gradient(135deg, #ffffff 0%, #e2e8f0 100%);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                background-clip: text;
                line-height: 1.2;
            }
            
            .metric-trend {
                font-size: 0.75rem;
                font-weight: 600;
                padding: 0.3rem 0.6rem;
                border-radius: 6px;
                display: inline-block;
                margin-top: auto;
            }
            
            .trend-up {
                background: rgba(34, 197, 94, 0.15);
                color: #22c55e;
            }
            
            .trend-down {
                background: rgba(239, 68, 68, 0.15);
                color: #ef4444;
            }
            
            /* Containers de gráficos */
            .chart-container {
                background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
                border: 1px solid #475569;
                border-radius: 16px;
                padding: 1.5rem;
                box-shadow: 0 10px 30px -5px rgba(0, 0, 0, 0.2);
                position: relative;
                overflow: hidden;
                margin-bottom: 1rem;
            }
            
            .chart-container::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                height: 3px;
                background: linear-gradient(90deg, #3b82f6, #8b5cf6, #ec4899);
            }
            
            .chart-title {
                font-size: 1.3rem;
                font-weight: 700;
                color: #ffffff;
                margin-bottom: 1.5rem;
                display: flex;
                align-items: center;
                gap: 0.75rem;
            }
            
            .chart-title::before {
                content: '';
                width: 4px;
                height: 24px;
                background: linear-gradient(135deg, #3b82f6, #8b5cf6);
                border-radius: 2px;
            }
            
            /* Sidebar */
            .sidebar {
                background: linear-gradient(180deg, #1e3a8a 0%, #1e40af 100%);
                border-right: 2px solid #3b82f6;
                padding: 1.5rem;
                height: 100vh;
                overflow-y: auto;
            }
            
            .sidebar h3 {
                color: #ffffff;
                font-weight: 700;
                font-size: 1rem;
                margin-bottom: 1rem;
                padding-bottom: 0.5rem;
                border-bottom: 2px solid #3b82f6;
            }
            
            .sidebar label {
                color: #e2e8f0;
                font-size: 0.9rem;
                font-weight: 600;
                margin-bottom: 0.5rem;
                display: block;
            }
            
            /* Inputs */
            .dash-input {
                background-color: #1e40af;
                color: #ffffff;
                border: 1px solid #3b82f6;
                border-radius: 8px;
                padding: 0.75rem;
                font-size: 0.9rem;
                width: 100%;
                margin-bottom: 1rem;
            }
            
            .dash-input:focus {
                border-color: #60a5fa;
                box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
                outline: none;
            }
            
            .dash-input::placeholder {
                color: #94a3b8;
            }
            
            /* Botões */
            .dash-button {
                background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
                color: white;
                border: none;
                border-radius: 8px;
                padding: 0.75rem 1.5rem;
                font-weight: 600;
                font-size: 0.9rem;
                box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                transition: all 0.3s ease;
                cursor: pointer;
                width: 100%;
                margin-bottom: 1rem;
            }
            
            .dash-button:hover {
                background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
                transform: translateY(-1px);
                box-shadow: 0 6px 8px -1px rgba(0, 0, 0, 0.15);
            }
            
            /* Tabelas */
            .dash-table-container {
                background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
                border: 1px solid #475569;
                border-radius: 12px;
                overflow: hidden;
                box-shadow: 0 4px 15px -3px rgba(0, 0, 0, 0.15);
            }
            
            /* Filtros */
            .filter-section {
                background: rgba(30, 58, 138, 0.3);
                border: 1px solid #3b82f6;
                border-radius: 8px;
                padding: 1rem;
                margin-bottom: 1rem;
            }
            
            .filter-title {
                color: #ffffff;
                font-weight: 600;
                font-size: 0.9rem;
                margin-bottom: 0.75rem;
                text-transform: uppercase;
                letter-spacing: 0.05em;
            }
            
            /* Responsividade */
            @media (max-width: 768px) {
                .main-title {
                    font-size: 1.5rem;
                }
                .metric-value {
                    font-size: 1.8rem;
                }
                .sidebar {
                    height: auto;
                }
            }
        </style>
    </head>
    <body>
        {%app_entry%}
        <footer>
            {%config%}
            {%scripts%}
            {%renderer%}
        </footer>
    </body>
</html>
'''

class DashboardManager:
    """Gerenciador principal do dashboard"""
    
    def __init__(self):
        self.data = None
        self.filtered_data = None
        self.metrics = {}
        self.chart_config = {}
        
    def load_data(self, url: str) -> Tuple[bool, Optional[str]]:
        """Carrega dados do Google Sheets"""
        try:
            success, data, error = data_loader.load_and_display_data(url)
            if success:
                self.data = data
                self.filtered_data = data
                self.calculate_metrics()
                return True, None
            else:
                return False, error
        except Exception as e:
            return False, str(e)
    
    def calculate_metrics(self):
        """Calcula métricas principais"""
        if self.filtered_data is None or self.filtered_data.empty:
            self.metrics = {}
            return
        
        # Encontrar coluna numérica principal
        numeric_cols = self.filtered_data.select_dtypes(include=[np.number]).columns
        
        if len(numeric_cols) > 0:
            main_col = numeric_cols[0]
            
            self.metrics = {
                "total": self.filtered_data[main_col].sum(),
                "average": self.filtered_data[main_col].mean(),
                "median": self.filtered_data[main_col].median(),
                "max": self.filtered_data[main_col].max(),
                "min": self.filtered_data[main_col].min(),
                "count": len(self.filtered_data),
                "std": self.filtered_data[main_col].std()
            }
        else:
            self.metrics = {"count": len(self.filtered_data)}
    
    def apply_filters(self, filters: Dict[str, Any]):
        """Aplica filtros aos dados"""
        if self.data is None:
            return
        
        self.filtered_data = self.data.copy()
        
        for column, values in filters.items():
            if values and len(values) > 0:
                self.filtered_data = self.filtered_data[
                    self.filtered_data[column].isin(values)
                ]
        
        self.calculate_metrics()
    
    def create_chart(self, chart_type: str, x_col: str, y_col: str) -> go.Figure:
        """Cria gráfico baseado no tipo e colunas"""
        if self.filtered_data is None or self.filtered_data.empty:
            return go.Figure()
        
        try:
            if chart_type == "Bar":
                fig = px.bar(
                    self.filtered_data, 
                    x=x_col, 
                    y=y_col,
                    title=f"{y_col} por {x_col}",
                    color_discrete_sequence=['#3b82f6']
                )
            elif chart_type == "Line":
                fig = px.line(
                    self.filtered_data, 
                    x=x_col, 
                    y=y_col,
                    title=f"Evolução de {y_col} por {x_col}",
                    color_discrete_sequence=['#3b82f6']
                )
            elif chart_type == "Scatter":
                fig = px.scatter(
                    self.filtered_data, 
                    x=x_col, 
                    y=y_col,
                    title=f"Correlação entre {x_col} e {y_col}",
                    color_discrete_sequence=['#3b82f6']
                )
            elif chart_type == "Pie":
                value_counts = self.filtered_data[x_col].value_counts().head(10)
                fig = px.pie(
                    values=value_counts.values,
                    names=value_counts.index,
                    title=f"Distribuição de {x_col}",
                    color_discrete_sequence=px.colors.qualitative.Set3
                )
            elif chart_type == "Area":
                fig = px.area(
                    self.filtered_data, 
                    x=x_col, 
                    y=y_col,
                    title=f"Área de {y_col} por {x_col}",
                    color_discrete_sequence=['#3b82f6']
                )
            else:
                fig = px.bar(
                    self.filtered_data, 
                    x=x_col, 
                    y=y_col,
                    title=f"{y_col} por {x_col}",
                    color_discrete_sequence=['#3b82f6']
                )
            
            # Personalizar layout
            fig.update_layout(
                plot_bgcolor='rgba(0,0,0,0)',
                paper_bgcolor='rgba(0,0,0,0)',
                font=dict(color='white', size=12),
                title_font=dict(size=16, color='white'),
                margin=dict(l=60, r=60, t=80, b=60),
                height=400,
                xaxis=dict(
                    gridcolor='#374151',
                    linecolor='#6b7280',
                    tickfont_color='#9ca3af',
                    title_font_color='#ffffff'
                ),
                yaxis=dict(
                    gridcolor='#374151',
                    linecolor='#6b7280',
                    tickfont_color='#9ca3af',
                    title_font_color='#ffffff'
                ),
                legend=dict(
                    bgcolor='rgba(0,0,0,0)',
                    font=dict(color='white')
                )
            )
            
            return fig
            
        except Exception as e:
            print(f"Erro ao criar gráfico: {e}")
            return go.Figure()

# Instância global do gerenciador
dashboard_manager = DashboardManager()

# Layout principal do dashboard
def create_layout():
    return html.Div([
        # Top Bar
        html.Div([
            html.H1("Lucrax.ai Dashboard", className="main-title"),
            html.P("Análise Inteligente de Dados • Visualização Profissional • Insights em Tempo Real", 
                   className="subtitle")
        ], className="top-bar"),
        
        # Layout principal
        html.Div([
            # Sidebar
            html.Div([
                html.H3("🔗 Fonte de Dados"),
                dcc.Input(
                    id="google-sheets-url",
                    type="text",
                    placeholder="https://docs.google.com/spreadsheets/d/...",
                    className="dash-input"
                ),
                html.Button("Carregar Dados", id="load-data-btn", className="dash-button"),
                
                html.H3("🔍 Filtros", style={"marginTop": "2rem"}),
                html.Div(id="filters-container"),
                
                html.H3("📊 Configuração do Gráfico", style={"marginTop": "2rem"}),
                html.Div(id="chart-config-container"),
                
                html.H3("🤖 Análise com IA", style={"marginTop": "2rem"}),
                dcc.Textarea(
                    id="analysis-prompt",
                    placeholder="Descreva o que você gostaria de analisar...",
                    style={"width": "100%", "height": "100px", "marginBottom": "1rem", 
                           "backgroundColor": "#1e40af", "color": "#ffffff", "border": "1px solid #3b82f6",
                           "borderRadius": "8px", "padding": "0.75rem"}
                ),
                html.Button("Analisar com IA", id="analyze-btn", className="dash-button"),
                
            ], className="sidebar", style={"width": "300px", "float": "left"}),
            
            # Conteúdo principal
            html.Div([
                # Métricas
                html.Div(id="metrics-container"),
                
                # Gráficos
                html.Div(id="charts-container"),
                
                # Tabela de dados
                html.Div(id="data-table-container"),
                
                # Análise IA
                html.Div(id="ai-analysis-container"),
                
            ], style={"marginLeft": "320px", "padding": "2rem"})
            
        ], style={"display": "flex"})
        
    ])

# Callbacks do Dash
@app.callback(
    [Output("filters-container", "children"),
     Output("chart-config-container", "children"),
     Output("metrics-container", "children"),
     Output("charts-container", "children"),
     Output("data-table-container", "children"),
     Output("ai-analysis-container", "children")],
    [Input("load-data-btn", "n_clicks"),
     Input("analyze-btn", "n_clicks")],
    [State("google-sheets-url", "value"),
     State("analysis-prompt", "value")]
)
def update_dashboard(load_clicks, analyze_clicks, url, prompt):
    """Atualiza o dashboard baseado nas interações"""
    ctx = callback_context
    
    if not ctx.triggered:
        return "", "", "", "", "", ""
    
    trigger_id = ctx.triggered[0]["prop_id"].split(".")[0]
    
    if trigger_id == "load-data-btn" and url:
        # Carregar dados
        success, error = dashboard_manager.load_data(url)
        
        if not success:
            return "", "", "", "", "", html.Div(f"Erro ao carregar dados: {error}", 
                                               style={"color": "#ef4444", "padding": "1rem"})
        
        # Criar filtros dinâmicos
        filters_html = create_filters_html(dashboard_manager.data)
        
        # Criar configuração de gráfico
        chart_config_html = create_chart_config_html(dashboard_manager.data)
        
        # Criar métricas
        metrics_html = create_metrics_html(dashboard_manager.metrics)
        
        # Criar gráficos
        charts_html = create_charts_html(dashboard_manager.data)
        
        # Criar tabela
        table_html = create_data_table_html(dashboard_manager.data)
        
        return filters_html, chart_config_html, metrics_html, charts_html, table_html, ""
    
    elif trigger_id == "analyze-btn" and prompt and dashboard_manager.data is not None:
        # Análise com IA
        analysis_html = perform_ai_analysis(prompt, dashboard_manager.data)
        return "", "", "", "", "", analysis_html
    
    return "", "", "", "", "", ""

def create_filters_html(data):
    """Cria HTML para filtros dinâmicos"""
    if data is None or data.empty:
        return ""
    
    filters = []
    for column in data.columns:
        unique_values = data[column].unique().tolist()
        filters.append(
            html.Div([
                html.Label(f"Filtrar por {column}", className="filter-title"),
                dcc.Dropdown(
                    id=f"filter-{column}",
                    options=[{"label": str(val), "value": val} for val in unique_values],
                    value=unique_values,
                    multi=True,
                    style={"backgroundColor": "#1e40af", "color": "#ffffff"}
                )
            ], className="filter-section")
        )
    
    return filters

def create_chart_config_html(data):
    """Cria HTML para configuração de gráfico"""
    if data is None or data.empty:
        return ""
    
    return html.Div([
        html.Label("Tipo de Gráfico", className="filter-title"),
        dcc.Dropdown(
            id="chart-type",
            options=[
                {"label": "Barra", "value": "Bar"},
                {"label": "Linha", "value": "Line"},
                {"label": "Dispersão", "value": "Scatter"},
                {"label": "Pizza", "value": "Pie"},
                {"label": "Área", "value": "Area"}
            ],
            value="Bar",
            style={"backgroundColor": "#1e40af", "color": "#ffffff", "marginBottom": "1rem"}
        ),
        html.Label("Eixo X", className="filter-title"),
        dcc.Dropdown(
            id="x-axis",
            options=[{"label": col, "value": col} for col in data.columns],
            value=data.columns[0],
            style={"backgroundColor": "#1e40af", "color": "#ffffff", "marginBottom": "1rem"}
        ),
        html.Label("Eixo Y", className="filter-title"),
        dcc.Dropdown(
            id="y-axis",
            options=[{"label": col, "value": col} for col in data.columns],
            value=data.columns[1] if len(data.columns) > 1 else data.columns[0],
            style={"backgroundColor": "#1e40af", "color": "#ffffff"}
        )
    ], className="filter-section")

def create_metrics_html(metrics):
    """Cria HTML para cards de métricas"""
    if not metrics:
        return ""
    
    metric_cards = []
    
    metric_configs = [
        ("TOTAL", "total", "📊", "trend-up", "+12% vs anterior"),
        ("MÉDIA", "average", "📈", "trend-up", "+5% vs anterior"),
        ("MEDIANA", "median", "📉", "trend-down", "-2% vs anterior"),
        ("MÁXIMO", "max", "⬆️", "trend-up", "+8% vs anterior"),
        ("REGISTROS", "count", "📋", "trend-up", "+15% vs anterior")
    ]
    
    for title, key, icon, trend_class, trend_text in metric_configs:
        value = metrics.get(key, 0)
        if isinstance(value, float):
            value = f"{value:,.0f}"
        else:
            value = f"{value:,}"
        
        metric_cards.append(
            html.Div([
                html.Div([
                    html.Div(title, className="metric-title"),
                    html.Div(icon, className="metric-icon")
                ], className="metric-header"),
                html.Div(value, className="metric-value"),
                html.Div(trend_text, className=f"metric-trend {trend_class}")
            ], className="metric-card")
        )
    
    return html.Div(metric_cards, style={"display": "grid", "gridTemplateColumns": "repeat(5, 1fr)", 
                                        "gap": "1rem", "marginBottom": "2rem"})

def create_charts_html(data):
    """Cria HTML para gráficos"""
    if data is None or data.empty:
        return ""
    
    # Gráfico principal
    numeric_cols = data.select_dtypes(include=[np.number]).columns
    if len(numeric_cols) >= 2:
        x_col = data.columns[0]
        y_col = numeric_cols[0]
        
        fig = dashboard_manager.create_chart("Bar", x_col, y_col)
        
        return html.Div([
            html.Div([
                html.Div("Gráfico Principal", className="chart-title"),
                dcc.Graph(figure=fig, style={"height": "400px"})
            ], className="chart-container")
        ])
    
    return ""

def create_data_table_html(data):
    """Cria HTML para tabela de dados"""
    if data is None or data.empty:
        return ""
    
    return html.Div([
        html.Div([
            html.Div("Dados em Tabela", className="chart-title"),
            dash_table.DataTable(
                data=data.head(20).to_dict('records'),
                columns=[{"name": i, "id": i} for i in data.columns],
                style_cell={
                    'backgroundColor': '#1e293b',
                    'color': '#ffffff',
                    'textAlign': 'left',
                    'padding': '12px',
                    'fontFamily': 'Inter, sans-serif'
                },
                style_header={
                    'backgroundColor': '#334155',
                    'color': '#ffffff',
                    'fontWeight': 'bold',
                    'border': '1px solid #475569'
                },
                style_data={
                    'border': '1px solid #475569'
                },
                page_size=10,
                style_table={'overflowX': 'auto'}
            )
        ], className="chart-container")
    ])

def perform_ai_analysis(prompt, data):
    """Executa análise com IA"""
    try:
        # Simular análise (substituir pela integração real)
        analysis_text = f"""
        <div className="chart-container">
            <div className="chart-title">🤖 Análise Inteligente</div>
            <div style="padding: 1rem; background: rgba(30, 58, 138, 0.3); border-radius: 8px; margin-top: 1rem;">
                <h4>Prompt: {prompt}</h4>
                <p>Análise dos dados com {len(data)} registros e {len(data.columns)} colunas.</p>
                <p>Funcionalidade de IA será implementada em breve com integração OpenAI/NNeural.</p>
            </div>
        </div>
        """
        return html.Div(analysis_text)
    except Exception as e:
        return html.Div(f"Erro na análise: {str(e)}", style={"color": "#ef4444"})

# Definir layout
app.layout = create_layout()

# Executar aplicação
if __name__ == "__main__":
    app.run(debug=True, host='0.0.0.0', port=8050)
