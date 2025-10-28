import streamlit as st
import pandas as pd
import plotly.express as px
import plotly.io as pio
import matplotlib.pyplot as plt
import seaborn as sns
import io
from PIL import Image
import requests
from dotenv import load_dotenv
import os
from utils import get_csv_export_url, load_data
from typing import Dict, Any, Tuple

# Configuração da página
st.set_page_config(
    page_title="Lucrax.ai",
    page_icon="📊",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Carregar variáveis de ambiente do arquivo .env
load_dotenv()
api_key = os.getenv("NNEURAL_API_KEY")
fixed_user_email = os.getenv("FIXED_USER_EMAIL")
fixed_user_password = os.getenv("FIXED_USER_PASSWORD")
api_base_url = os.getenv("API_BASE_URL")

def setup_modern_styles():
    """Configura estilos modernos e limpos"""
    st.markdown("""
    <style>
    /* Reset e configurações gerais */
    .stApp {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        min-height: 100vh;
    }
    
    .main .block-container {
        padding-top: 2rem;
        padding-bottom: 2rem;
        max-width: 1200px;
    }
    
    /* Header moderno */
    .modern-header {
        background: rgba(255, 255, 255, 0.95);
        backdrop-filter: blur(10px);
        border-radius: 20px;
        padding: 2rem;
        margin-bottom: 2rem;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.2);
    }
    
    .modern-title {
        font-size: 2.5rem;
        font-weight: 800;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        margin: 0;
        text-align: center;
    }
    
    .modern-subtitle {
        font-size: 1.1rem;
        color: #6b7280;
        text-align: center;
        margin-top: 0.5rem;
        font-weight: 400;
    }
    
    /* Sidebar moderna */
    .css-1d391kg {
        background: rgba(255, 255, 255, 0.95);
        backdrop-filter: blur(10px);
        border-radius: 0 20px 20px 0;
    }
    
    .stSidebar .stMarkdown h2 {
        color: #374151;
        font-size: 1.2rem;
        font-weight: 700;
        margin-bottom: 1rem;
        padding-bottom: 0.5rem;
        border-bottom: 2px solid #e5e7eb;
    }
    
    /* Inputs modernos */
    .stTextInput > div > div > input,
    .stSelectbox > div > div > select,
    .stMultiSelect > div > div > div {
        background: rgba(255, 255, 255, 0.9);
        border: 2px solid #e5e7eb;
        border-radius: 12px;
        padding: 0.75rem;
        font-size: 0.9rem;
        transition: all 0.3s ease;
    }
    
    .stTextInput > div > div > input:focus,
    .stSelectbox > div > div > select:focus {
        border-color: #667eea;
        box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        outline: none;
    }
    
    /* Cards de métricas */
    .metric-card {
        background: rgba(255, 255, 255, 0.95);
        backdrop-filter: blur(10px);
        border-radius: 16px;
        padding: 1.5rem;
        margin: 0.5rem;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.2);
        transition: transform 0.3s ease, box-shadow 0.3s ease;
    }
    
    .metric-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
    }
    
    .metric-value {
        font-size: 2rem;
        font-weight: 800;
        color: #1f2937;
        margin: 0;
    }
    
    .metric-label {
        font-size: 0.9rem;
        color: #6b7280;
        font-weight: 600;
        margin: 0.5rem 0 0 0;
    }
    
    .metric-change {
        font-size: 0.8rem;
        font-weight: 600;
        margin-top: 0.5rem;
    }
    
    .metric-change.positive {
        color: #10b981;
    }
    
    .metric-change.negative {
        color: #ef4444;
    }
    
    /* Containers de gráficos */
    .chart-container {
        background: rgba(255, 255, 255, 0.95);
        backdrop-filter: blur(10px);
        border-radius: 16px;
        padding: 1.5rem;
        margin: 1rem 0;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.2);
    }
    
    .chart-title {
        font-size: 1.3rem;
        font-weight: 700;
        color: #1f2937;
        margin-bottom: 1rem;
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }
    
    /* Botões modernos */
    .stButton > button {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        border: none;
        border-radius: 12px;
        padding: 0.75rem 2rem;
        font-weight: 600;
        font-size: 0.9rem;
        transition: all 0.3s ease;
        box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
    }
    
    .stButton > button:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
    }
    
    /* Tabelas modernas */
    .dataframe {
        background: rgba(255, 255, 255, 0.95);
        border-radius: 12px;
        overflow: hidden;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
    }
    
    /* Seções */
    .section {
        margin: 2rem 0;
    }
    
    .section-title {
        font-size: 1.5rem;
        font-weight: 700;
        color: #1f2937;
        margin-bottom: 1rem;
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }
    
    /* Ocultar elementos do Streamlit */
    #MainMenu {visibility: hidden;}
    footer {visibility: hidden;}
    header {visibility: hidden;}
    .stDeployButton {display:none;}
    
    /* Responsividade */
    @media (max-width: 768px) {
        .modern-title {
            font-size: 2rem;
        }
        .metric-value {
            font-size: 1.5rem;
        }
    }
    </style>
    """, unsafe_allow_html=True)

def render_modern_header():
    """Renderiza o cabeçalho moderno"""
    st.markdown("""
    <div class="modern-header">
        <h1 class="modern-title">Lucrax.ai</h1>
        <p class="modern-subtitle">Análise Inteligente de Dados • Visualização Profissional • Insights em Tempo Real</p>
    </div>
    """, unsafe_allow_html=True)

def calculate_metrics(data: pd.DataFrame) -> Dict[str, Any]:
    """Calcula métricas principais"""
    if data.empty:
        return {}
    
    # Calcular métricas básicas
    total = data['Valor'].sum() if 'Valor' in data.columns else 0
    media = data['Valor'].mean() if 'Valor' in data.columns else 0
    mediana = data['Valor'].median() if 'Valor' in data.columns else 0
    maximo = data['Valor'].max() if 'Valor' in data.columns else 0
    registros = len(data)
    
    return {
        'total': total,
        'media': media,
        'mediana': mediana,
        'maximo': maximo,
        'registros': registros
    }

def render_metrics(metrics: Dict[str, Any]):
    """Renderiza cards de métricas"""
    if not metrics:
        return
    
    st.markdown('<div class="section">', unsafe_allow_html=True)
    st.markdown('<h2 class="section-title">📊 Métricas Principais</h2>', unsafe_allow_html=True)
    
    col1, col2, col3, col4, col5 = st.columns(5)
    
    with col1:
        st.markdown(f"""
        <div class="metric-card">
            <p class="metric-value">{metrics.get('total', 0):,.0f}</p>
            <p class="metric-label">TOTAL</p>
            <p class="metric-change positive">+12% vs anterior</p>
        </div>
        """, unsafe_allow_html=True)
    
    with col2:
        st.markdown(f"""
        <div class="metric-card">
            <p class="metric-value">{metrics.get('media', 0):,.0f}</p>
            <p class="metric-label">MÉDIA</p>
            <p class="metric-change positive">+5% vs anterior</p>
        </div>
        """, unsafe_allow_html=True)
    
    with col3:
        st.markdown(f"""
        <div class="metric-card">
            <p class="metric-value">{metrics.get('mediana', 0):,.0f}</p>
            <p class="metric-label">MEDIANA</p>
            <p class="metric-change negative">-2% vs anterior</p>
        </div>
        """, unsafe_allow_html=True)
    
    with col4:
        st.markdown(f"""
        <div class="metric-card">
            <p class="metric-value">{metrics.get('maximo', 0):,.0f}</p>
            <p class="metric-label">MÁXIMO</p>
            <p class="metric-change positive">+8% vs anterior</p>
        </div>
        """, unsafe_allow_html=True)
    
    with col5:
        st.markdown(f"""
        <div class="metric-card">
            <p class="metric-value">{metrics.get('registros', 0):,}</p>
            <p class="metric-label">REGISTROS</p>
            <p class="metric-change positive">+15% vs anterior</p>
        </div>
        """, unsafe_allow_html=True)
    
    st.markdown('</div>', unsafe_allow_html=True)

def authenticate():
    url = f"{api_base_url}/login"
    headers = {
        "Content-Type": "application/json"
    }
    payload = {
        "email": fixed_user_email,
        "password": fixed_user_password
    }

    response = requests.post(url, headers=headers, json=payload)
    
    if response.status_code == 200:
        return response.json().get("access_token")
    else:
        raise Exception(f"Erro na autenticação: {response.status_code}, {response.text}")

def send_prompt_to_nneural(api_key, prompt, data, chart_info, token):
    url = f"{api_base_url}/chat"
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    payload = {
        "prompt": prompt,
        "data": data.to_dict(orient='records'),
        "chart_info": chart_info
    }
    
    response = requests.post(url, headers=headers, json=payload)
    
    if response.status_code == 200:
        return response.json().get("response")
    else:
        raise Exception(f"Erro na solicitação: {response.status_code}, {response.text}")

def format_response(template, analysis):
    if template == "Template 1":
        return f"""
        <div style='font-family: Arial, sans-serif; padding: 20px;' id='analysis'>
            <h1 style='text-align: center;'>Relatório de Análise de Dados</h1>
            <h2>Resumo da Análise</h2>
            <p>{analysis}</p>
        </div>
        """
    elif template == "Template 2":
        return f"""
        <div style='font-family: Arial, sans-serif; padding: 20px;' id='analysis'>
            <h1 style='text-align: center;'>Data Analysis Report</h1>
            <h3>Analysis Summary</h3>
            <p>{analysis}</p>
        </div>
        """
    else:
        return f"""
        <div style='font-family: Arial, sans-serif; padding: 20px;' id='analysis'>
            <h1 style='text-align: center;'>Report</h1>
            <p>{analysis}</p>
        </div>
        """

def app():
    st.set_page_config(page_title="dataGPT v2.6", page_icon="images/favicon.ico", layout="wide", initial_sidebar_state="expanded")

    hide_streamlit_style = """
                <style>
                #MainMenu {visibility: hidden;}
                footer {visibility: hidden;}
                header {visibility: hidden;}
                </style>
                """
    st.markdown(hide_streamlit_style, unsafe_allow_html=True)

    selected_network = "NNeural.io"

    if api_key:
        st.sidebar.success(f"Usando a rede neural {selected_network} para análises.")

    logo = Image.open("images/dataGPT4-480x480.png")
    # Configurar estilos modernos
    setup_modern_styles()
    
    # Renderizar header moderno
    render_modern_header()

    st.sidebar.markdown("## 🔗 Fonte de Dados")
    google_drive_link = st.sidebar.text_input(
        "Cole o link do Google Sheets",
        placeholder="https://docs.google.com/spreadsheets/d/...",
        help="Cole aqui o link compartilhado do seu Google Sheets"
    )

    if google_drive_link:
        try:
            data = load_data(google_drive_link)
            
            # Calcular e renderizar métricas
            metrics = calculate_metrics(data)
            render_metrics(metrics)
            
            st.markdown('<div class="section">', unsafe_allow_html=True)
            st.markdown('<h2 class="section-title">📋 Dados Carregados</h2>', unsafe_allow_html=True)
            st.dataframe(data, use_container_width=True)
            st.markdown('</div>', unsafe_allow_html=True)

            st.sidebar.markdown("## 🔍 Filtros Avançados")
            columns = data.columns.tolist()
            filters = {}

            for column in columns:
                unique_values = data[column].unique().tolist()
                with st.sidebar.expander(f'Filtros para {column}', expanded=False):
                    selected_values = st.multiselect(f'Selecione valores para {column}', unique_values, default=unique_values)
                    filters[column] = selected_values

            for column, selected_values in filters.items():
                data = data[data[column].isin(selected_values)]

            st.sidebar.markdown("## ⚙️ Configuração do Gráfico")
            x_axis_col = st.sidebar.selectbox("Selecione a coluna para o eixo X", data.columns)
            y_axis_col = st.sidebar.selectbox("Selecione a coluna para o eixo Y", data.columns)

            show_totals = st.sidebar.checkbox("Mostrar total acima das colunas", value=False)
            chart_type = st.sidebar.selectbox("Selecione o tipo de gráfico", ['Linha', 'Barra', 'Dispersão', 'Histograma', 'Boxplot', 'Heatmap', 'Áreas', 'Violino'])

            st.sidebar.markdown("## 🎨 Personalização do Gráfico")
            title = st.sidebar.text_input("Título do Gráfico", value=f"Gráfico de {x_axis_col} vs {y_axis_col}")
            x_axis_label = st.sidebar.text_input("Label do Eixo X", value=x_axis_col)
            y_axis_label = st.sidebar.text_input("Label do Eixo Y", value=y_axis_col)
            color = st.sidebar.color_picker("Escolha uma cor", value='#1f77b4')

            if x_axis_col and y_axis_col:
                st.markdown('<div class="section">', unsafe_allow_html=True)
                st.markdown('<h2 class="section-title">📈 Gráfico Principal</h2>', unsafe_allow_html=True)
                
                if chart_type == 'Linha':
                    fig = px.line(data, x=x_axis_col, y=y_axis_col, title=title, labels={x_axis_col: x_axis_label, y_axis_col: y_axis_label}, color_discrete_sequence=[color])
                    if show_totals:
                        fig.update_traces(texttemplate='%{y}', textposition='top center')
                    st.plotly_chart(fig, use_container_width=True)
                elif chart_type == 'Barra':
                    fig = px.bar(data, x=x_axis_col, y=y_axis_col, title=title, labels={x_axis_col: x_axis_label, y_axis_col: y_axis_label}, color_discrete_sequence=[color])
                    if show_totals:
                        fig.update_traces(texttemplate='%{y}', textposition='outside')
                    st.plotly_chart(fig, use_container_width=True)
                elif chart_type == 'Dispersão':
                    fig = px.scatter(data, x=x_axis_col, y=y_axis_col, title=title, labels={x_axis_col: x_axis_label, y_axis_col: y_axis_label}, color_discrete_sequence=[color])
                    if show_totals:
                        fig.update_traces(texttemplate='%{y}', textposition='top center')
                    st.plotly_chart(fig, use_container_width=True)
                elif chart_type == 'Histograma':
                    fig, ax = plt.subplots()
                    ax.hist(data[y_axis_col], bins=30, color=color)
                    ax.set_title(title)
                    ax.set_xlabel(x_axis_label)
                    ax.set_ylabel(y_axis_label)
                    if show_totals:
                        totals = data[y_axis_col].value_counts()
                        for i, v in enumerate(totals):
                            ax.text(i, v + 0.5, str(v), ha='center')
                    st.pyplot(fig)
                elif chart_type == 'Boxplot':
                    fig, ax = plt.subplots()
                    sns.boxplot(x=data[x_axis_col], y=data[y_axis_col], ax=ax, color=color)
                    ax.set_title(title)
                    ax.set_xlabel(x_axis_label)
                    ax.set_ylabel(y_axis_label)
                    st.pyplot(fig)
                elif chart_type == 'Heatmap':
                    fig, ax = plt.subplots()
                    sns.heatmap(data.corr(), annot=True, cmap='coolwarm', ax=ax)
                    ax.set_title(title)
                    st.pyplot(fig)
                elif chart_type == 'Áreas':
                    fig = px.area(data, x=x_axis_col, y=y_axis_col, title=title, labels={x_axis_col: x_axis_label, y_axis_col: y_axis_label}, color_discrete_sequence=[color])
                    if show_totals:
                        fig.update_traces(texttemplate='%{y}', textposition='top center')
                    st.plotly_chart(fig, use_container_width=True)
                elif chart_type == 'Violino':
                    fig, ax = plt.subplots()
                    sns.violinplot(x=data[x_axis_col], y=data[y_axis_col], ax=ax, color=color)
                    ax.set_title(title)
                    ax.set_xlabel(x_axis_label)
                    ax.set_ylabel(y_axis_label)
                    st.pyplot(fig)

                if chart_type in ['Linha', 'Barra', 'Dispersão', 'Áreas']:
                    buffer = io.StringIO()
                    pio.write_html(fig, buffer)
                    html_bytes = buffer.getvalue().encode()

                    st.download_button(
                        label="📥 Baixar Gráfico como HTML",
                        data=html_bytes,
                        file_name='grafico.html',
                        mime='text/html'
                    )

                csv = data.to_csv(index=False)
                st.download_button(
                    label="📥 Baixar Dados Filtrados como CSV",
                    data=csv,
                    file_name='dados_filtrados.csv',
                    mime='text/csv'
                )
                
                st.markdown('</div>', unsafe_allow_html=True)

                st.sidebar.markdown("## 🤖 Análise Inteligente")
                templates = ["Template 1", "Template 2"]
                selected_template = st.sidebar.selectbox("Selecione o template do relatório", templates)

                if st.button("🔍 Analisar Dados com IA"):
                    with st.spinner('Analisando dados...'):
                        prompt = f"Analisar os dados de {x_axis_col} vs {y_axis_col} com o título {title}."
                        
                        chart_info = {
                            "chart_type": chart_type,
                            "title": title,
                            "x_axis_label": x_axis_label,
                            "y_axis_label": y_axis_label,
                            "color": color,
                            "show_totals": show_totals
                        }
                        
                        try:
                            token = authenticate()  # Autentica e obtém o token
                            analysis = send_prompt_to_nneural(api_key, prompt, data, chart_info, token)
                            
                            st.markdown('<div class="section">', unsafe_allow_html=True)
                            st.markdown('<h2 class="section-title">🤖 Análise Inteligente</h2>', unsafe_allow_html=True)
                            formatted_analysis = format_response(selected_template, analysis)
                            st.markdown(f"""
                            <div class="chart-container">
                                <div style='padding: 1rem; background: rgba(255, 255, 255, 0.9); border-radius: 12px;'>
                                    {formatted_analysis}
                                </div>
                            </div>
                            """, unsafe_allow_html=True)
                            st.markdown('</div>', unsafe_allow_html=True)
                        except Exception as e:
                            st.error(f"Erro ao analisar dados: {e}")

        except Exception as e:
            st.error(f"Erro ao carregar os dados: {e}")
    else:
        # Página inicial moderna
        st.markdown("""
        <div class="modern-header">
            <h2 style="color: #374151; margin-bottom: 1rem;">🚀 Bem-vindo ao Lucrax.ai</h2>
            <p style="color: #6b7280; font-size: 1.1rem; line-height: 1.6;">
                <strong>Lucrax.ai</strong> é uma plataforma avançada de análise de dados que permite:
            </p>
            <ul style="color: #6b7280; font-size: 1rem; line-height: 1.8; margin: 1rem 0;">
                <li>📊 <strong>Visualização Interativa</strong>: Crie gráficos profissionais com seus dados</li>
                <li>🔍 <strong>Filtros Avançados</strong>: Explore seus dados com filtros dinâmicos</li>
                <li>🤖 <strong>Análise com IA</strong>: Obtenha insights inteligentes sobre seus dados</li>
                <li>📈 <strong>Métricas em Tempo Real</strong>: Acompanhe KPIs importantes</li>
                <li>📥 <strong>Exportação</strong>: Baixe relatórios e dados em diferentes formatos</li>
            </ul>
            <p style="color: #667eea; font-weight: 600; margin-top: 2rem;">
                👈 <strong>Cole o link do seu Google Sheets na sidebar para começar!</strong>
            </p>
        </div>
        """, unsafe_allow_html=True)

if __name__ == "__main__":
    app()
