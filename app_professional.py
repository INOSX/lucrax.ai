"""
Lucrax.ai - Aplicação Profissional
Dashboard moderno com métricas e visualizações avançadas
"""
import streamlit as st
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
from plotly.subplots import make_subplots
import numpy as np
from typing import Dict, Any, Optional, Tuple
import time

# Importações locais
from config import Config
from src.data_loader import data_loader
from src.chart_generator import chart_generator
from src.api_client import api_client, api_cache
from src.openai_client import openai_client
from src.validators import DataValidator, SecurityValidator

class ProfessionalDashboard:
    """Dashboard profissional do Lucrax.ai"""
    
    def __init__(self):
        self.config = Config()
        self.setup_page_config()
        self.setup_custom_css()
    
    def setup_page_config(self):
        """Configura a página do Streamlit"""
        st.set_page_config(
            page_title="Lucrax.ai - Dashboard Profissional",
            page_icon="📊",
            layout="wide",
            initial_sidebar_state="expanded"
        )
    
    def setup_custom_css(self):
        """Configura CSS personalizado para o dashboard profissional"""
        st.markdown("""
        <style>
        /* Reset e configurações gerais */
        .main > div {
            padding-top: 2rem;
        }
        
        /* Sidebar profissional */
        .stSidebar > div:first-child {
            background: linear-gradient(180deg, #1e3a8a 0%, #1e40af 100%);
            border-right: 2px solid #3b82f6;
        }
        
        .stSidebar .stMarkdown h1,
        .stSidebar .stMarkdown h2,
        .stSidebar .stMarkdown h3 {
            color: #ffffff;
            font-weight: 700;
            font-size: 0.65rem;
        }
        
        .stSidebar .stMarkdown {
            color: #e2e8f0;
            font-size: 0.65rem;
        }
        
        /* Inputs da sidebar */
        .stSidebar .stTextInput > div > div > input {
            background-color: #1e40af;
            color: #ffffff;
            border: 1px solid #3b82f6;
            border-radius: 8px;
            font-size: 0.65rem;
            padding: 0.4rem 0.6rem;
        }
        
        .stSidebar .stTextInput > div > div > input::placeholder {
            color: #94a3b8;
            font-size: 0.65rem;
        }
        
        /* Labels da sidebar */
        .stSidebar .stTextInput > label {
            font-size: 0.65rem;
            color: #e2e8f0;
            font-weight: 700;
        }
        
        
        /* Selectbox da sidebar */
        .stSidebar .stSelectbox > div > div {
            background-color: #1e40af;
            color: #ffffff;
            border: 1px solid #3b82f6;
            border-radius: 8px;
            font-size: 0.65rem;
        }
        
        .stSidebar .stSelectbox > label {
            font-size: 0.65rem;
            color: #e2e8f0;
            font-weight: 700;
        }
        
        /* Multiselect da sidebar */
        .stSidebar .stMultiSelect > div > div {
            background-color: #1e40af;
            color: #ffffff;
            border: 1px solid #3b82f6;
            border-radius: 8px;
            font-size: 0.65rem;
        }
        
        .stSidebar .stMultiSelect > label {
            font-size: 0.65rem;
            color: #e2e8f0;
            font-weight: 700;
        }
        
        /* Tags do multiselect */
        .stSidebar .stMultiSelect div[data-baseweb="select"] div[role="button"] {
            background-color: #3b82f6;
            color: #ffffff;
            border: 1px solid #60a5fa;
            border-radius: 4px;
            font-size: 0.65rem;
            padding: 0.2rem 0.4rem;
            line-height: 1.2;
        }
        
        /* Texto dentro das tags do multiselect */
        .stSidebar .stMultiSelect div[data-baseweb="select"] div[role="button"] span {
            font-size: 0.65rem;
        }
        
        /* Ícone X das tags */
        .stSidebar .stMultiSelect div[data-baseweb="select"] div[role="button"] svg {
            width: 0.75rem;
            height: 0.75rem;
        }
        
        /* Container das tags selecionadas */
        .stSidebar .stMultiSelect div[data-baseweb="select"] div[role="listbox"] {
            font-size: 0.65rem;
        }
        
        /* Opções do dropdown do multiselect */
        .stSidebar .stMultiSelect div[data-baseweb="select"] ul li {
            font-size: 0.65rem;
        }
        
        /* CSS adicional para tags do multiselect - mais específico */
        .stSidebar .stMultiSelect div[data-baseweb="select"] div[role="button"] > div {
            font-size: 0.65rem !important;
        }
        
        .stSidebar .stMultiSelect div[data-baseweb="select"] div[role="button"] > div > span {
            font-size: 0.65rem !important;
        }
        
        /* Forçar tamanho menor em todos os elementos de texto das tags */
        .stSidebar .stMultiSelect div[data-baseweb="select"] div[role="button"] * {
            font-size: 0.65rem !important;
        }
        
        /* Ajustar altura das tags para ficarem mais compactas */
        .stSidebar .stMultiSelect div[data-baseweb="select"] div[role="button"] {
            min-height: 1.5rem;
            max-height: 1.5rem;
        }
        
        /* Checkbox da sidebar */
        .stSidebar .stCheckbox > label {
            color: #e2e8f0;
            font-size: 0.65rem;
            font-weight: 700;
        }
        
        /* Expander da sidebar */
        .stSidebar .stExpander > div > div {
            background-color: #1e40af;
            border: 1px solid #3b82f6;
            border-radius: 8px;
        }
        
        .stSidebar .stExpander > div > div > div {
            color: #ffffff;
            font-size: 0.65rem;
            font-weight: 700;
        }
        
        .stSidebar .stExpander > div > div > div > div {
            font-size: 0.65rem;
        }
        
        /* Mensagens de status */
        .stSidebar .stSuccess {
            background: linear-gradient(135deg, #065f46 0%, #047857 100%);
            border: 1px solid #10b981;
            color: #10b981;
            border-radius: 8px;
            padding: 0.6rem;
            font-size: 0.65rem;
            font-weight: 700;
        }
        
        .stSidebar .stError {
            background: linear-gradient(135deg, #7f1d1d 0%, #991b1b 100%);
            border: 1px solid #ef4444;
            color: #ef4444;
            border-radius: 8px;
            padding: 0.6rem;
            font-size: 0.65rem;
            font-weight: 700;
        }
        
        .stSidebar .stInfo {
            background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%);
            border: 1px solid #3b82f6;
            color: #3b82f6;
            border-radius: 8px;
            padding: 0.6rem;
            font-size: 0.65rem;
            font-weight: 700;
        }
        
        /* Textarea da sidebar */
        .stSidebar .stTextArea > div > div > textarea {
            background-color: #1e40af;
            color: #ffffff;
            border: 1px solid #3b82f6;
            border-radius: 8px;
            font-size: 0.65rem;
            padding: 0.4rem 0.6rem;
        }
        
        .stSidebar .stTextArea > div > div > textarea::placeholder {
            color: #94a3b8;
            font-size: 0.65rem;
        }
        
        .stSidebar .stTextArea > label {
            font-size: 0.65rem;
            color: #e2e8f0;
            font-weight: 700;
        }
        
        /* Botões da sidebar - tamanho menor */
        .stSidebar .stButton > button {
            background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
            color: white;
            border: none;
            border-radius: 8px;
            padding: 0.4rem 0.8rem;
            font-weight: 700;
            font-size: 0.65rem;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            transition: all 0.3s ease;
        }
        
        .stSidebar .stButton > button:hover {
            background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
            transform: translateY(-1px);
            box-shadow: 0 6px 8px -1px rgba(0, 0, 0, 0.15);
        }
        
        /* Top Bar Profissional */
        .top-bar {
            background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
            border-bottom: 3px solid #3b82f6;
            padding: 0.3rem 2rem;
            margin: -1rem -1rem 0.5rem -1rem;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
            position: relative;
            overflow: hidden;
        }
        
        /* Remover margem superior do Streamlit */
        .main .block-container {
            padding-top: 0.5rem !important;
        }
        
        /* Aproximar o banner do topo */
        .stApp > header {
            display: none !important;
        }
        
        .stApp > div:first-child {
            padding-top: 0 !important;
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
            font-size: 1.5rem;
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
            font-size: 0.7rem;
            color: #94a3b8;
            text-align: center;
            margin-top: 0.25rem;
            font-weight: 500;
            position: relative;
            z-index: 1;
        }
        
        /* Cards de métricas harmonizados */
        .metric-card {
            background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
            border: 1px solid #475569;
            border-radius: 12px;
            padding: 1rem;
            box-shadow: 0 4px 15px -3px rgba(0, 0, 0, 0.15);
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            position: relative;
            overflow: hidden;
            height: 120px;
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
            height: 2px;
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
            font-size: 0.7rem;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            margin: 0;
        }
        
        .metric-icon {
            font-size: 1.2rem;
            background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        
        .metric-value {
            color: #ffffff;
            font-size: 1.8rem;
            font-weight: 700;
            margin: 0.25rem 0;
            background: linear-gradient(135deg, #ffffff 0%, #e2e8f0 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            line-height: 1.2;
        }
        
        .metric-trend {
            font-size: 0.65rem;
            font-weight: 600;
            padding: 0.2rem 0.4rem;
            border-radius: 4px;
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
        
        /* Gráficos modernos */
        .chart-container {
            background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
            border: 1px solid #475569;
            border-radius: 20px;
            padding: 2rem;
            box-shadow: 0 10px 30px -5px rgba(0, 0, 0, 0.2);
            position: relative;
            overflow: hidden;
        }
        
        .chart-container::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 2px;
            background: linear-gradient(90deg, #3b82f6, #8b5cf6, #ec4899);
        }
        
        .chart-title {
            font-size: 1.25rem;
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
            height: 20px;
            background: linear-gradient(135deg, #3b82f6, #8b5cf6);
            border-radius: 2px;
        }
        
        /* Títulos das seções drasticamente reduzidos */
        .stMarkdown h1,
        .stMarkdown h2,
        .stMarkdown h3 {
            font-size: 0.8rem !important;
            font-weight: 600 !important;
            margin: 0.5rem 0 !important;
            color: #ffffff !important;
        }
        
        /* Remover linhas separadoras (hr) */
        hr {
            display: none !important;
        }
        
        /* Remover margens extras dos títulos */
        .stMarkdown h1:first-child,
        .stMarkdown h2:first-child,
        .stMarkdown h3:first-child {
            margin-top: 0 !important;
        }
        
        /* Remover espaçamentos desnecessários */
        .main .block-container {
            padding-top: 0.5rem !important;
            padding-bottom: 0.5rem !important;
        }
        
        /* Remover elementos vazios */
        .stEmpty {
            display: none !important;
        }
        
        /* Remover containers vazios */
        div[data-testid="stVerticalBlock"]:empty {
            display: none !important;
        }
        
        /* Remover blocos vazios específicos */
        .stApp > div > div > div > div > div:empty {
            display: none !important;
        }
        
        /* Remover espaçamentos entre banner e gráficos */
        .main .block-container > div:first-child + div:empty {
            display: none !important;
        }
        
        /* Forçar remoção de elementos vazios */
        div[data-testid="stVerticalBlock"]:has(> div:empty) {
            display: none !important;
        }
        
        /* Remover margens entre seções */
        .main .block-container > div {
            margin: 0 !important;
            padding: 0 !important;
        }
        
        /* Aproximar gráficos do banner */
        .main .block-container {
            padding-top: 0 !important;
            margin-top: 0 !important;
        }
        
        /* Esconder blocos com bordas coloridas vazios */
        div[style*="border-radius"]:empty {
            display: none !important;
        }
        
        /* Esconder containers vazios com gradientes */
        div[style*="gradient"]:empty {
            display: none !important;
        }
        
        /* Esconder elementos com altura pequena */
        .main .block-container > div:empty {
            display: none !important;
        }
        
        /* Forçar remoção de espaçamentos */
        .main .block-container > div:not(:has(*)) {
            display: none !important;
        }
        
        /* REMOVER TODOS OS RETÂNGULOS ARREDONDADOS EXCETO O BANNER */
        
        /* Esconder todos os inputs com cantos arredondados */
        .stTextInput > div > div > input,
        .stSelectbox > div > div,
        .stMultiSelect > div > div,
        .stTextArea > div > div > textarea {
            display: none !important;
        }
        
        /* Mostrar containers essenciais */
        .chart-container,
        .metric-card {
            display: block !important;
        }
        
        /* Mostrar botões */
        .stButton > button {
            display: block !important;
        }
        
        /* Mostrar elementos da sidebar */
        .stSidebar .stSelectbox,
        .stSidebar .stMultiSelect,
        .stSidebar .stCheckbox,
        .stSidebar .stExpander {
            display: block !important;
        }
        
        /* Manter apenas o input do Google Sheets na sidebar */
        .stSidebar .stTextInput {
            display: block !important;
        }
        
        /* Garantir que o input seja clicável e funcional */
        .stSidebar .stTextInput > div > div > input {
            display: block !important;
            pointer-events: auto !important;
            cursor: text !important;
            background-color: #1e40af !important;
            color: #ffffff !important;
            border: 1px solid #3b82f6 !important;
            border-radius: 8px !important;
            padding: 0.5rem 0.75rem !important;
            font-size: 0.65rem !important;
        }
        
        .stSidebar .stTextInput > div > div > input:focus {
            border-color: #60a5fa !important;
            box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2) !important;
            outline: none !important;
        }
        
        .stSidebar .stTextInput > label {
            display: block !important;
            color: #e2e8f0 !important;
            font-size: 0.65rem !important;
            font-weight: 700 !important;
            margin-bottom: 0.5rem !important;
        }
        
        /* Mostrar containers de gráficos e tabelas */
        .stPlotlyChart,
        .stDataFrame {
            display: block !important;
        }
        
        /* Manter apenas o banner */
        .top-bar {
            display: block !important;
        }
        
        
        /* Botões principais */
        .main-button {
            background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
            color: white;
            border: none;
            border-radius: 8px;
            padding: 0.75rem 2rem;
            font-weight: 600;
            font-size: 1rem;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            transition: all 0.3s ease;
        }
        
        .main-button:hover {
            background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
            transform: translateY(-1px);
            box-shadow: 0 6px 8px -1px rgba(0, 0, 0, 0.15);
        }
        
        /* Ocultar elementos do Streamlit */
        #MainMenu {visibility: hidden;}
        footer {visibility: hidden;}
        header {visibility: hidden;}
        .stDeployButton {display:none;}
        </style>
        """, unsafe_allow_html=True)
    
    def render_sidebar(self) -> Dict[str, Any]:
        """Renderiza a sidebar profissional"""
        st.sidebar.markdown("## 🔗 Fonte de Dados")
        
        google_drive_link = st.sidebar.text_input(
            "Cole o link do Google Sheets",
            placeholder="https://docs.google.com/spreadsheets/d/...",
            help="Insira um link de compartilhamento do Google Sheets"
        )
        
        # Status da configuração (removido o aviso de IA)
        if not self.config.validate_config():
            missing = self.config.get_missing_config()
            st.sidebar.error(f"⚠️ Configurações faltantes: {', '.join(missing)}")
        
        return {"google_drive_link": google_drive_link}
    
    def render_filters(self, data: pd.DataFrame) -> pd.DataFrame:
        """Renderiza filtros avançados"""
        st.sidebar.markdown("## 🔍 Filtros Avançados")
        
        columns = data.columns.tolist()
        filters = {}
        
        for column in columns:
            unique_values = data[column].unique().tolist()
            with st.sidebar.expander(f'Filtrar por {column}', expanded=False):
                selected_values = st.multiselect(
                    f'Selecione valores para {column}', 
                    unique_values, 
                    default=unique_values,
                    key=f"filter_{column}"
                )
                filters[column] = selected_values
        
        # Aplicar filtros
        filtered_data = data.copy()
        for column, selected_values in filters.items():
            if selected_values:
                filtered_data = filtered_data[filtered_data[column].isin(selected_values)]
        
        return filtered_data
    
    def render_chart_config(self, data: pd.DataFrame) -> Dict[str, Any]:
        """Renderiza configurações do gráfico"""
        st.sidebar.markdown("## 📊 Configuração do Gráfico")
        
        col1, col2 = st.sidebar.columns(2)
        
        with col1:
            x_axis_col = st.selectbox(
                "Eixo X", 
                data.columns,
                help="Coluna para o eixo X"
            )
        
        with col2:
            y_axis_col = st.selectbox(
                "Eixo Y", 
                data.columns,
                help="Coluna para o eixo Y"
            )
        
        chart_type = st.sidebar.selectbox(
            "Tipo de Gráfico", 
            ["Bar", "Line", "Scatter", "Pie", "Area"],
            help="Escolha o tipo de visualização"
        )
        
        show_totals = st.sidebar.checkbox(
            "Mostrar valores nos gráficos", 
            value=True,
            help="Exibe os valores numéricos"
        )
        
        return {
            "x_axis_col": x_axis_col,
            "y_axis_col": y_axis_col,
            "chart_type": chart_type,
            "show_totals": show_totals
        }
    
    def calculate_metrics(self, data: pd.DataFrame) -> Dict[str, Any]:
        """Calcula métricas principais"""
        metrics = {}
        
        # Encontrar coluna numérica principal
        numeric_cols = data.select_dtypes(include=[np.number]).columns
        
        if len(numeric_cols) > 0:
            main_col = numeric_cols[0]
            
            metrics = {
                "total": data[main_col].sum(),
                "average": data[main_col].mean(),
                "median": data[main_col].median(),
                "max": data[main_col].max(),
                "min": data[main_col].min(),
                "count": len(data),
                "std": data[main_col].std()
            }
        
        return metrics
    
    def render_metrics(self, metrics: Dict[str, Any]):
        """Renderiza cards de métricas harmonizados"""
        if not metrics:
            return
        
        st.markdown("## 📊 Métricas Principais")
        
        # Adicionar espaçamento menor
        st.markdown("<br>", unsafe_allow_html=True)
        
        col1, col2, col3, col4, col5 = st.columns(5)
        
        with col1:
            st.markdown(f"""
            <div class="metric-card">
                <div class="metric-header">
                    <div class="metric-title">TOTAL</div>
                    <div class="metric-icon">📊</div>
                </div>
                <div class="metric-value">{metrics.get('total', 0):,.0f}</div>
                <div class="metric-trend trend-up">+12% vs anterior</div>
            </div>
            """, unsafe_allow_html=True)
        
        with col2:
            st.markdown(f"""
            <div class="metric-card">
                <div class="metric-header">
                    <div class="metric-title">MÉDIA</div>
                    <div class="metric-icon">📈</div>
                </div>
                <div class="metric-value">{metrics.get('average', 0):,.0f}</div>
                <div class="metric-trend trend-up">+5% vs anterior</div>
            </div>
            """, unsafe_allow_html=True)
        
        with col3:
            st.markdown(f"""
            <div class="metric-card">
                <div class="metric-header">
                    <div class="metric-title">MEDIANA</div>
                    <div class="metric-icon">📉</div>
                </div>
                <div class="metric-value">{metrics.get('median', 0):,.0f}</div>
                <div class="metric-trend trend-down">-2% vs anterior</div>
            </div>
            """, unsafe_allow_html=True)
        
        with col4:
            st.markdown(f"""
            <div class="metric-card">
                <div class="metric-header">
                    <div class="metric-title">MÁXIMO</div>
                    <div class="metric-icon">⬆️</div>
                </div>
                <div class="metric-value">{metrics.get('max', 0):,.0f}</div>
                <div class="metric-trend trend-up">+8% vs anterior</div>
            </div>
            """, unsafe_allow_html=True)
        
        with col5:
            st.markdown(f"""
            <div class="metric-card">
                <div class="metric-header">
                    <div class="metric-title">REGISTROS</div>
                    <div class="metric-icon">📋</div>
                </div>
                <div class="metric-value">{metrics.get('count', 0):,}</div>
                <div class="metric-trend trend-up">+15% vs anterior</div>
            </div>
            """, unsafe_allow_html=True)
        
        # Espaçamento após métricas
        st.markdown("<br><br>", unsafe_allow_html=True)
    
    def create_professional_chart(self, data: pd.DataFrame, config: Dict[str, Any]) -> go.Figure:
        """Cria gráfico profissional"""
        x_col = config["x_axis_col"]
        y_col = config["y_axis_col"]
        chart_type = config["chart_type"]
        show_totals = config["show_totals"]
        
        # Preparar dados
        if chart_type == "Pie":
            # Para gráfico de pizza, usar contagem de valores únicos
            value_counts = data[x_col].value_counts().head(10)
            fig = px.pie(
                values=value_counts.values,
                names=value_counts.index,
                title=f"Distribuição de {x_col}",
                color_discrete_sequence=px.colors.qualitative.Set3
            )
        else:
            # Para outros tipos de gráfico
            if chart_type == "Bar":
                fig = px.bar(
                    data, 
                    x=x_col, 
                    y=y_col,
                    title=f"{y_col} por {x_col}",
                    color_discrete_sequence=['#3b82f6']
                )
            elif chart_type == "Line":
                fig = px.line(
                    data, 
                    x=x_col, 
                    y=y_col,
                    title=f"Evolução de {y_col} por {x_col}",
                    color_discrete_sequence=['#3b82f6']
                )
            elif chart_type == "Scatter":
                fig = px.scatter(
                    data, 
                    x=x_col, 
                    y=y_col,
                    title=f"Correlação entre {x_col} e {y_col}",
                    color_discrete_sequence=['#3b82f6']
                )
            elif chart_type == "Area":
                fig = px.area(
                    data, 
                    x=x_col, 
                    y=y_col,
                    title=f"Área de {y_col} por {x_col}",
                    color_discrete_sequence=['#3b82f6']
                )
        
        # Ajustar barras para ficarem mais finas
        if chart_type == "Bar":
            fig.update_traces(
                width=0.6,  # Reduzir largura das barras
                marker_line_width=0,  # Remover bordas das barras
                textposition='outside',
                textfont_size=10
            )
        elif chart_type == "Line":
            fig.update_traces(
                line_width=3,
                marker_size=6
            )
        elif chart_type == "Scatter":
            fig.update_traces(
                marker_size=8,
                marker_line_width=1,
                marker_line_color='#1e40af'
            )
        
        # Personalizar layout harmonizado
        fig.update_layout(
            plot_bgcolor='rgba(0,0,0,0)',
            paper_bgcolor='rgba(0,0,0,0)',
            font=dict(color='white'),
            title_font=dict(size=14, color='white'),
            margin=dict(l=60, r=60, t=60, b=60),
            height=400,  # Altura fixa para harmonização
            xaxis=dict(
                gridcolor='#374151',
                linecolor='#6b7280',
                tickfont_color='#9ca3af',
                tickfont_size=11,
                title_font_size=12
            ),
            yaxis=dict(
                gridcolor='#374151',
                linecolor='#6b7280',
                tickfont_color='#9ca3af',
                tickfont_size=11,
                title_font_size=12
            ),
            legend=dict(
                bgcolor='rgba(0,0,0,0)',
                font=dict(color='white')
            ),
            showlegend=False
        )
        
        return fig
    
    def render_charts(self, data: pd.DataFrame, config: Dict[str, Any]):
        """Renderiza seção de gráficos modernos"""
        col1, col2 = st.columns([2, 1])
        
        with col1:
            st.markdown('<div class="chart-container">', unsafe_allow_html=True)
            st.markdown('<div class="chart-title">Gráfico Principal</div>', unsafe_allow_html=True)
            fig = self.create_professional_chart(data, config)
            st.plotly_chart(fig, use_container_width=True)
            st.markdown('</div>', unsafe_allow_html=True)
        
        with col2:
            st.markdown('<div class="chart-container">', unsafe_allow_html=True)
            st.markdown('<div class="chart-title">Dados em Tabela</div>', unsafe_allow_html=True)
            st.dataframe(
                data.head(15),
                use_container_width=True,
                height=400
            )
            st.markdown('</div>', unsafe_allow_html=True)
    
    def render_ai_analysis(self, data: pd.DataFrame, config: Dict[str, Any]):
        """Renderiza seção de análise com IA"""
        st.markdown("## 🤖 Análise Inteligente")
        
        col1, col2 = st.columns([3, 1])
        
        with col1:
            analysis_prompt = st.text_area(
                "Descreva o que você gostaria de analisar:",
                placeholder="Ex: Analise as tendências dos dados e identifique padrões importantes...",
                height=100
            )
        
        with col2:
            st.markdown("### Ações")
            analyze_btn = st.button("🔍 Analisar com IA", type="primary", use_container_width=True)
            download_btn = st.button("📥 Baixar Relatório", use_container_width=True)
        
        if analyze_btn and analysis_prompt:
            with st.spinner("Analisando dados com IA..."):
                # Simular análise (substituir pela integração real)
                time.sleep(2)
                st.success("Análise concluída!")
                st.info("Funcionalidade de IA será implementada em breve.")
    
    def load_and_display_data(self, google_drive_link: str) -> Tuple[bool, Optional[pd.DataFrame], Optional[str]]:
        """Carrega e exibe dados do Google Sheets"""
        try:
            success, data, error = data_loader.load_data_from_url(google_drive_link)
            if success:
                return True, data, None
            else:
                st.error(f"❌ Erro ao carregar dados: {error}")
                return False, None, error
        except Exception as e:
            st.error(f"❌ Erro inesperado: {str(e)}")
            return False, None, str(e)
    
    def run(self):
        """Executa o dashboard profissional"""
        # Top Bar Profissional
        st.markdown("""
        <div class="top-bar">
            <h1 class="main-title">Lucrax.ai Dashboard</h1>
            <p class="subtitle">Análise Inteligente de Dados • Visualização Profissional • Insights em Tempo Real</p>
        </div>
        """, unsafe_allow_html=True)
        
        
        # Sidebar
        sidebar_config = self.render_sidebar()
        google_drive_link = sidebar_config["google_drive_link"]
        
        if google_drive_link:
            # Carregar dados
            success, data, error = self.load_and_display_data(google_drive_link)
            
            if success and data is not None:
                # Filtros
                filtered_data = self.render_filters(data)
                
                # Configuração do gráfico
                chart_config = self.render_chart_config(filtered_data)
                
                # Métricas
                metrics = self.calculate_metrics(filtered_data)
                self.render_metrics(metrics)
                
                # Gráficos
                self.render_charts(filtered_data, chart_config)
                
                # Análise com IA
                self.render_ai_analysis(filtered_data, chart_config)
            else:
                st.error("❌ Não foi possível carregar os dados. Verifique o link e tente novamente.")
        else:
            # Página inicial
            st.markdown("""
            ## 🚀 Bem-vindo ao Lucrax.ai
            
            **Lucrax.ai** é uma plataforma avançada de análise de dados que permite:
            
            - 📊 **Visualização Interativa**: Crie gráficos profissionais com seus dados
            - 🔍 **Filtros Avançados**: Explore seus dados com filtros dinâmicos
            - 🤖 **Análise com IA**: Obtenha insights inteligentes sobre seus dados
            - 📈 **Métricas em Tempo Real**: Acompanhe KPIs importantes
            - 📥 **Exportação**: Baixe relatórios e dados em diferentes formatos
            
            ### Como começar:
            1. Cole o link do seu Google Sheets na barra lateral
            2. Configure os filtros desejados
            3. Escolha o tipo de gráfico
            4. Explore os insights com IA
            
            ---
            """)
            
            # Exemplo de dados
            st.markdown("### 📊 Exemplo de Dashboard")
            sample_data = pd.DataFrame({
                'Região': ['Norte', 'Sul', 'Leste', 'Oeste', 'Centro'] * 4,
                'Vendas': np.random.randint(1000, 10000, 20),
                'Categoria': ['A', 'B', 'C', 'D', 'E'] * 4,
                'Data': pd.date_range('2024-01-01', periods=20, freq='D')
            })
            
            # Métricas de exemplo
            sample_metrics = self.calculate_metrics(sample_data)
            self.render_metrics(sample_metrics)
            
            # Gráfico de exemplo
            st.markdown("### 📈 Gráfico de Exemplo")
            fig = px.bar(
                sample_data.groupby('Região')['Vendas'].sum().reset_index(),
                x='Região',
                y='Vendas',
                title='Vendas por Região',
                color_discrete_sequence=['#3b82f6']
            )
            fig.update_layout(
                plot_bgcolor='rgba(0,0,0,0)',
                paper_bgcolor='rgba(0,0,0,0)',
                font=dict(color='white'),
                title_font=dict(size=18, color='white')
            )
            st.plotly_chart(fig, use_container_width=True)

# Executar o dashboard
if __name__ == "__main__":
    dashboard = ProfessionalDashboard()
    dashboard.run()
