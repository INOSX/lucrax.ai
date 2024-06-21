import streamlit as st
import pandas as pd
import plotly.express as px
import plotly.io as pio
import io
import time
from PIL import Image
# from talking_llm import TalkingLLM
import neural_network_config as nn_config
from neural_network_analyzer import analyze_data
from utils import get_csv_export_url, load_data

def app():
    st.set_page_config(page_title="Visualizador de Dados do Google Drive", layout="wide", initial_sidebar_state="expanded")

    hide_streamlit_style = """
                <style>
                #MainMenu {visibility: hidden;}
                footer {visibility: hidden;}
                header {visibility: hidden;}
                </style>
                """
    st.markdown(hide_streamlit_style, unsafe_allow_html=True)

    nn_config.select_neural_network()
    selected_network = nn_config.get_selected_network()
    api_key = nn_config.get_api_key()

    if selected_network and api_key:
        st.sidebar.success(f"Usando a rede neural {selected_network} para análises.")

    if "show_logo" not in st.session_state:
        st.session_state.show_logo = True

    if st.session_state.show_logo:
        logo = Image.open("images/dataGPT4-480x480.png")
        col1, col2, col3 = st.columns(3)
        with col1:
            st.write("")
        with col2:
            st.image(logo, width=480, use_column_width=False)
        with col3:
            st.write("")
        time.sleep(3)
        st.session_state.show_logo = False
        st.experimental_rerun()

    logo = Image.open("images/dataGPT4-480x480.png")
    st.image(logo, width=128, use_column_width=False)

    st.title("dataGPT para o Google Drive")
    st.markdown("""
    ## Descrição
    O dataGPT para o Google Drive permite visualizar dados compartilhados via Google Drive. 
    Você pode inserir um link de compartilhamento de um arquivo Google Sheets, 
    escolher as colunas para os eixos X e Y de um gráfico, e visualizar os dados e o gráfico interativamente.
    Além disso, você pode utilizar inteligência artificial para analisar os gráficos gerados.

    ### Como usar:
    1. Insira o link do arquivo Google Sheets compartilhado.
    2. Selecione as colunas para os eixos X e Y do gráfico.
    3. Visualize os dados carregados e o gráfico gerado.
    4. Baixe o gráfico gerado como um arquivo HTML.
    """)

    st.sidebar.header('Link do Google Drive')
    google_drive_link = st.sidebar.text_input("Cole o link do arquivo no Google Drive")

    if google_drive_link:
        try:
            data = load_data(google_drive_link)
            st.write("Dados Carregados:")
            st.dataframe(data)

            st.sidebar.header('Filtros')
            columns = data.columns.tolist()
            filters = {}
            for column in columns:
                unique_values = data[column].unique().tolist()
                selected_values = st.sidebar.multiselect(f'Selecione valores para {column}', unique_values, default=unique_values)
                filters[column] = selected_values

            for column, selected_values in filters.items():
                data = data[data[column].isin(selected_values)]

            st.sidebar.header('Configuração do Gráfico')
            x_axis_col = st.sidebar.selectbox("Selecione a coluna para o eixo X", data.columns)
            y_axis_col = st.sidebar.selectbox("Selecione a coluna para o eixo Y", data.columns)

            chart_type = st.sidebar.selectbox("Selecione o tipo de gráfico", ['Linha', 'Barra', 'Dispersão'])

            st.sidebar.header('Personalização do Gráfico')
            title = st.sidebar.text_input("Título do Gráfico", value=f"Gráfico de {x_axis_col} vs {y_axis_col}")
            x_axis_label = st.sidebar.text_input("Label do Eixo X", value=x_axis_col)
            y_axis_label = st.sidebar.text_input("Label do Eixo Y", value=y_axis_col)
            color = st.sidebar.color_picker("Escolha uma cor", value='#1f77b4')

            if x_axis_col and y_axis_col:
                if chart_type == 'Linha':
                    fig = px.line(data, x=x_axis_col, y=y_axis_col, title=title, labels={x_axis_col: x_axis_label, y_axis_col: y_axis_label})
                elif chart_type == 'Barra':
                    fig = px.bar(data, x=x_axis_col, y=y_axis_col, title=title, labels={x_axis_col: x_axis_label, y_axis_col: y_axis_label})
                elif chart_type == 'Dispersão':
                    fig = px.scatter(data, x=x_axis_col, y=y_axis_col, title=title, labels={x_axis_col: x_axis_label, y_axis_col: y_axis_label})
                
                fig.update_traces(marker=dict(color=color))

                st.plotly_chart(fig, use_container_width=True)

                buffer = io.StringIO()
                pio.write_html(fig, buffer)
                html_bytes = buffer.getvalue().encode()

                st.download_button(
                    label="Baixar Gráfico como HTML",
                    data=html_bytes,
                    file_name='grafico.html',
                    mime='text/html'
                )

                csv = data.to_csv(index=False)
                st.download_button(
                    label="Baixar Dados Filtrados como CSV",
                    data=csv,
                    file_name='dados_filtrados.csv',
                    mime='text/csv'
                )

                if st.button("Analisar Dados com IA"):
                    with st.spinner('Analisando dados...'):
                        try:
                            analysis = analyze_data(data, title, x_axis_label, y_axis_label)
                            st.subheader("Análise da Neural")
                            st.write(analysis)
                        except Exception as e:
                            st.error(f"Erro ao analisar dados: {e}")

        except Exception as e:
            st.error(f"Erro ao carregar os dados: {e}")
    else:
        st.info("Por favor, insira o link do Google Drive para carregar os dados.")

if __name__ == "__main__":
    app()
