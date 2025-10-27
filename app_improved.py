"""
dataGPT v2.6 - Aplicação principal melhorada
Versão consolidada com melhorias de segurança, validação e organização
"""
import streamlit as st
import pandas as pd
import plotly.io as pio
import io
from PIL import Image
from typing import Dict, Any, Optional, Tuple
import time

# Importações locais
from config import Config
from src.data_loader import data_loader
from src.chart_generator import chart_generator
from src.api_client import api_client, api_cache
from src.openai_client import openai_client
from src.validators import DataValidator, SecurityValidator

class DataGPTApp:
    """Classe principal da aplicação dataGPT"""
    
    def __init__(self):
        self.config = Config()
        self.setup_page_config()
        self.setup_sidebar_styles()
    
    def setup_page_config(self):
        """Configura a página do Streamlit"""
        st.set_page_config(
            page_title=self.config.APP_TITLE,
            page_icon=self.config.PAGE_ICON,
            layout=self.config.LAYOUT,
            initial_sidebar_state=self.config.SIDEBAR_STATE
        )
    
    def setup_sidebar_styles(self):
        """Configura estilos da sidebar"""
        hide_streamlit_style = """
        <style>
        #MainMenu {visibility: hidden;}
        footer {visibility: hidden;}
        header {visibility: hidden;}
        .stSidebar > div:first-child {
            background-color: #f0f2f6;
        }
        </style>
        """
        st.markdown(hide_streamlit_style, unsafe_allow_html=True)
    
    def render_header(self):
        """Renderiza o cabeçalho da aplicação"""
        logo = Image.open("images/dataGPT4-480x480.png")
        st.image(logo, width=128, use_column_width=False)
        
        st.title(self.config.APP_TITLE)
        st.markdown("""
        ## Descrição
        O dataGPT v2.6 permite visualizar dados compartilhados via Google Drive. 
        Você pode inserir um link de compartilhamento de um arquivo Google Sheets, 
        escolher as colunas para os eixos X e Y de um gráfico, e visualizar os dados e o gráfico interativamente.
        Além disso, você pode utilizar inteligência artificial para analisar os gráficos gerados.

        ### Como usar:
        1. Insira o link do arquivo Google Sheets compartilhado.
        2. Selecione as colunas para os eixos X e Y do gráfico.
        3. Visualize os dados carregados e o gráfico gerado.
        4. Baixe o gráfico gerado como um arquivo HTML.
        5. Solicite a análise da Inteligência Artificial.
        """)
    
    def render_sidebar(self) -> Dict[str, Any]:
        """Renderiza a sidebar e retorna configurações"""
        st.sidebar.header('Link do Google Drive')
        google_drive_link = st.sidebar.text_input(
            "Cole o link do arquivo no Google Drive",
            placeholder="https://docs.google.com/spreadsheets/d/...",
            help="Insira um link de compartilhamento do Google Sheets"
        )
        
        # Verificar configuração da API
        if not self.config.validate_config():
            missing = self.config.get_missing_config()
            st.sidebar.error(f"⚠️ Configurações faltantes: {', '.join(missing)}")
            st.sidebar.info("Configure as variáveis de ambiente necessárias no arquivo .env")
        else:
            st.sidebar.success(f"✅ Usando a rede neural {self.config.NEURAL_NETWORK} para análises.")
        
        return {"google_drive_link": google_drive_link}
    
    def load_and_display_data(self, google_drive_link: str) -> Tuple[bool, Optional[pd.DataFrame], Optional[str]]:
        """Carrega e exibe dados do Google Sheets"""
        try:
            with st.spinner('Carregando dados do Google Sheets...'):
                success, data, error = data_loader.load_data_from_url(google_drive_link)
                
                if not success:
                    st.error(f"❌ Erro ao carregar os dados: {error}")
                    return False, None, error
                
                # Limpar dados
                data = data_loader.clean_data(data)
                
                st.success(f"✅ Dados carregados com sucesso! ({len(data)} linhas, {len(data.columns)} colunas)")
                st.write("**Dados Carregados:**")
                st.dataframe(data, use_container_width=True)
                
                return True, data, None
                
        except Exception as e:
            st.error(f"❌ Erro inesperado ao carregar dados: {str(e)}")
            return False, None, str(e)
    
    def render_filters(self, data: pd.DataFrame) -> pd.DataFrame:
        """Renderiza filtros e retorna dados filtrados"""
        st.sidebar.header('Filtros')
        columns = data.columns.tolist()
        filters = {}
        
        for column in columns:
            unique_values = data[column].unique().tolist()
            with st.sidebar.expander(f'Filtros para {column}', expanded=False):
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
            filtered_data = filtered_data[filtered_data[column].isin(selected_values)]
        
        if len(filtered_data) != len(data):
            st.info(f"📊 Dados filtrados: {len(filtered_data)} de {len(data)} linhas")
        
        return filtered_data
    
    def render_chart_config(self, data: pd.DataFrame) -> Dict[str, Any]:
        """Renderiza configurações do gráfico"""
        st.sidebar.header('Configuração do Gráfico')
        
        x_axis_col = st.sidebar.selectbox(
            "Selecione a coluna para o eixo X", 
            data.columns,
            help="Escolha a coluna que será usada no eixo X do gráfico"
        )
        y_axis_col = st.sidebar.selectbox(
            "Selecione a coluna para o eixo Y", 
            data.columns,
            help="Escolha a coluna que será usada no eixo Y do gráfico"
        )
        
        show_totals = st.sidebar.checkbox(
            "Mostrar total acima das colunas", 
            value=False,
            help="Exibe os valores numéricos nos gráficos"
        )
        
        chart_type = st.sidebar.selectbox(
            "Selecione o tipo de gráfico", 
            self.config.CHART_TYPES,
            help="Escolha o tipo de visualização dos dados"
        )
        
        st.sidebar.header('Personalização do Gráfico')
        title = st.sidebar.text_input(
            "Título do Gráfico", 
            value=f"Gráfico de {x_axis_col} vs {y_axis_col}",
            help="Título personalizado para o gráfico"
        )
        x_axis_label = st.sidebar.text_input(
            "Label do Eixo X", 
            value=x_axis_col,
            help="Rótulo personalizado para o eixo X"
        )
        y_axis_label = st.sidebar.text_input(
            "Label do Eixo Y", 
            value=y_axis_col,
            help="Rótulo personalizado para o eixo Y"
        )
        color = st.sidebar.color_picker(
            "Escolha uma cor", 
            value=self.config.DEFAULT_COLOR,
            help="Cor principal do gráfico"
        )
        
        return {
            "x_axis_col": x_axis_col,
            "y_axis_col": y_axis_col,
            "show_totals": show_totals,
            "chart_type": chart_type,
            "title": title,
            "x_axis_label": x_axis_label,
            "y_axis_label": y_axis_label,
            "color": color
        }
    
    def generate_and_display_chart(self, data: pd.DataFrame, chart_config: Dict[str, Any]) -> Tuple[bool, Optional[Any], Optional[str]]:
        """Gera e exibe o gráfico"""
        try:
            # Validar configurações
            is_valid, error = DataValidator.validate_chart_columns(
                data, chart_config["x_axis_col"], chart_config["y_axis_col"]
            )
            if not is_valid:
                st.error(f"❌ {error}")
                return False, None, error
            
            # Gerar gráfico
            success, fig, error = chart_generator.generate_chart(
                data, 
                chart_config["x_axis_col"], 
                chart_config["y_axis_col"], 
                chart_config["chart_type"], 
                chart_config
            )
            
            if not success:
                st.error(f"❌ Erro ao gerar gráfico: {error}")
                return False, None, error
            
            # Exibir gráfico
            if chart_config["chart_type"] in ['Linha', 'Barra', 'Dispersão', 'Áreas']:
                st.plotly_chart(fig, use_container_width=True)
            else:
                st.pyplot(fig)
            
            return True, fig, None
            
        except Exception as e:
            st.error(f"❌ Erro inesperado ao gerar gráfico: {str(e)}")
            return False, None, str(e)
    
    def render_download_buttons(self, data: pd.DataFrame, fig: Any, chart_config: Dict[str, Any]):
        """Renderiza botões de download"""
        col1, col2 = st.columns(2)
        
        with col1:
            # Download do gráfico como HTML
            if chart_config["chart_type"] in ['Linha', 'Barra', 'Dispersão', 'Áreas']:
                success, html_bytes, error = chart_generator.save_chart_as_html(fig)
                if success:
                    st.download_button(
                        label="📊 Baixar Gráfico como HTML",
                        data=html_bytes,
                        file_name='grafico.html',
                        mime='text/html',
                        help="Baixa o gráfico interativo como arquivo HTML"
                    )
                else:
                    st.error(f"Erro ao preparar download: {error}")
        
        with col2:
            # Download dos dados como CSV
            csv = data.to_csv(index=False)
            st.download_button(
                label="📄 Baixar Dados Filtrados como CSV",
                data=csv,
                file_name='dados_filtrados.csv',
                mime='text/csv',
                help="Baixa os dados filtrados como arquivo CSV"
            )
    
    def render_ai_analysis(self, data: pd.DataFrame, chart_config: Dict[str, Any]):
        """Renderiza seção de análise com IA"""
        st.sidebar.header('Configuração do Relatório')
        selected_template = st.sidebar.selectbox(
            "Selecione o template do relatório", 
            self.config.REPORT_TEMPLATES,
            help="Escolha o formato do relatório de análise"
        )
        
        if st.button("🤖 Analisar Dados com IA", type="primary"):
            if not self.config.validate_config():
                st.error("❌ Configuração da API não está completa. Verifique as variáveis de ambiente.")
                return
            
            with st.spinner('🤖 Analisando dados com IA...'):
                try:
                    # Preparar prompt
                    prompt = f"Analisar os dados de {chart_config['x_axis_col']} vs {chart_config['y_axis_col']} com o título {chart_config['title']}."
                    prompt = SecurityValidator.sanitize_input(prompt, max_length=1000)
                    
                    # Preparar informações do gráfico
                    chart_info = {
                        "chart_type": chart_config["chart_type"],
                        "title": chart_config["title"],
                        "x_axis_label": chart_config["x_axis_label"],
                        "y_axis_label": chart_config["y_axis_label"],
                        "color": chart_config["color"],
                        "show_totals": chart_config["show_totals"]
                    }
                    
                    # Tentar usar OpenAI primeiro, depois NNeural como fallback
                    analysis = None
                    error = None
                    
                    if openai_client.is_available():
                        success, analysis, error = openai_client.analyze_data(prompt, data, chart_info)
                        if success:
                            st.sidebar.success("✅ Usando OpenAI GPT")
                    else:
                        # Fallback para NNeural
                        success, token, auth_error = api_client.authenticate()
                        if success:
                            success, analysis, error = api_client.analyze_data(prompt, data, chart_info, token)
                            if success:
                                st.sidebar.success("✅ Usando NNeural.io")
                        else:
                            error = auth_error
                    
                    if not analysis:
                        st.error(f"❌ Erro na análise: {error}")
                        return
                    
                    # Exibir análise
                    st.subheader("🤖 Análise da IA")
                    formatted_analysis = self.format_response(selected_template, analysis)
                    st.markdown(
                        f"<div style='border: 1px solid #ddd; padding: 20px; border-radius: 5px; background-color: #f9f9f9;'>{formatted_analysis}</div>", 
                        unsafe_allow_html=True
                    )
                    
                except Exception as e:
                    st.error(f"❌ Erro inesperado na análise: {str(e)}")
    
    def format_response(self, template: str, analysis: str) -> str:
        """Formata a resposta da IA baseada no template"""
        if template == "Template 1":
            return f"""
            <div style='font-family: Arial, sans-serif; padding: 20px;' id='analysis'>
                <h1 style='text-align: center; color: #2c3e50;'>Relatório de Análise de Dados</h1>
                <h2 style='color: #34495e;'>Resumo da Análise</h2>
                <p style='line-height: 1.6;'>{analysis}</p>
            </div>
            """
        elif template == "Template 2":
            return f"""
            <div style='font-family: Arial, sans-serif; padding: 20px;' id='analysis'>
                <h1 style='text-align: center; color: #2c3e50;'>Data Analysis Report</h1>
                <h3 style='color: #34495e;'>Analysis Summary</h3>
                <p style='line-height: 1.6;'>{analysis}</p>
            </div>
            """
        else:
            return f"""
            <div style='font-family: Arial, sans-serif; padding: 20px;' id='analysis'>
                <h1 style='text-align: center; color: #2c3e50;'>Report</h1>
                <p style='line-height: 1.6;'>{analysis}</p>
            </div>
            """
    
    def run(self):
        """Executa a aplicação principal"""
        # Renderizar cabeçalho
        self.render_header()
        
        # Renderizar sidebar e obter configurações
        sidebar_config = self.render_sidebar()
        google_drive_link = sidebar_config["google_drive_link"]
        
        if google_drive_link:
            # Carregar e exibir dados
            success, data, error = self.load_and_display_data(google_drive_link)
            if not success:
                return
            
            # Aplicar filtros
            filtered_data = self.render_filters(data)
            
            # Configurar gráfico
            chart_config = self.render_chart_config(filtered_data)
            
            # Gerar e exibir gráfico
            if chart_config["x_axis_col"] and chart_config["y_axis_col"]:
                success, fig, error = self.generate_and_display_chart(filtered_data, chart_config)
                if success:
                    # Botões de download
                    self.render_download_buttons(filtered_data, fig, chart_config)
                    
                    # Análise com IA
                    self.render_ai_analysis(filtered_data, chart_config)
        else:
            st.info("ℹ️ Por favor, insira o link do Google Drive para carregar os dados.")

def main():
    """Função principal"""
    app = DataGPTApp()
    app.run()

if __name__ == "__main__":
    main()
