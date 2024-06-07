import streamlit as st
import pandas as pd
import plotly.express as px
import plotly.io as pio
import io
from openai_analyzer import analyze_data_with_openai  # Importe a função de análise da OpenAI

def app():
    """
    Função principal para executar o aplicativo Streamlit.
    """
    st.set_page_config(page_title="Visualizador de Dados do Google Drive", layout="wide", initial_sidebar_state="expanded")

    # Ocultar a mensagem de "Deploy"
    hide_streamlit_style = """
                <style>
                #MainMenu {visibility: hidden;}
                footer {visibility: hidden;}
                header {visibility: hidden;}
                </style>
                """
    st.markdown(hide_streamlit_style, unsafe_allow_html=True)

    st.title("dataGPT para o Google Drive")
    st.markdown("""
    ## Descrição
    O dataGPT para o Google Drive permite visualizar dados compartilhados via Google Drive. 
    Você pode inserir um link de compartilhamento de um arquivo Google Sheets, 
    escolher as colunas para os eixos X e Y de um gráfico, e visualizar os dados e o gráfico interativamente.

    ### Como usar:
    1. Insira o link do arquivo Google Sheets compartilhado.
    2. Selecione as colunas para os eixos X e Y do gráfico.
    3. Visualize os dados carregados e o gráfico gerado.
    4. Baixe o gráfico gerado como um arquivo HTML.
    """)

    def get_csv_export_url(url):
        """
        Converte o URL de visualização do Google Sheets para um URL de exportação CSV.

        Parameters:
        url (str): O URL de visualização do Google Sheets.

        Returns:
        str: O URL de exportação CSV.
        """
        file_id = url.split('/')[5]
        csv_export_url = f"https://docs.google.com/spreadsheets/d/{file_id}/export?format=csv"
        return csv_export_url

    @st.cache_data
    def load_data(url):
        """
        Carrega os dados do Google Sheets em um DataFrame pandas.

        Parameters:
        url (str): O URL de exportação CSV do Google Sheets.

        Returns:
        pd.DataFrame: O DataFrame contendo os dados carregados.
        """
        csv_url = get_csv_export_url(url)
        data = pd.read_csv(csv_url)
        return data

    # Input para o link do Google Drive
    st.sidebar.header('Link do Google Drive')
    google_drive_link = st.sidebar.text_input("Cole o link do arquivo no Google Drive")

    if google_drive_link:
        try:
            # Carrega os dados e exibe na tela central
            data = load_data(google_drive_link)
            st.write("Dados Carregados:")
            st.dataframe(data)

            # Seção de filtros
            st.sidebar.header('Filtros')
            columns = data.columns.tolist()
            filters = {}
            for column in columns:
                unique_values = data[column].unique().tolist()
                selected_values = st.sidebar.multiselect(f'Selecione valores para {column}', unique_values, default=unique_values)
                filters[column] = selected_values

            # Aplicar filtros
            for column, selected_values in filters.items():
                data = data[data[column].isin(selected_values)]

            # Seleção de colunas para os eixos X e Y
            st.sidebar.header('Configuração do Gráfico')
            x_axis_col = st.sidebar.selectbox("Selecione a coluna para o eixo X", data.columns)
            y_axis_col = st.sidebar.selectbox("Selecione a coluna para o eixo Y", data.columns)

            # Seleção do tipo de gráfico
            chart_type = st.sidebar.selectbox("Selecione o tipo de gráfico", ['Linha', 'Barra', 'Dispersão'])

            # Personalização de gráficos
            st.sidebar.header('Personalização do Gráfico')
            title = st.sidebar.text_input("Título do Gráfico", value=f"Gráfico de {x_axis_col} vs {y_axis_col}")
            x_axis_label = st.sidebar.text_input("Label do Eixo X", value=x_axis_col)
            y_axis_label = st.sidebar.text_input("Label do Eixo Y", value=y_axis_col)
            color = st.sidebar.color_picker("Escolha uma cor", value='#1f77b4')

            if x_axis_col and y_axis_col:
                # Gera o gráfico com as colunas selecionadas e tipo de gráfico
                if chart_type == 'Linha':
                    fig = px.line(data, x=x_axis_col, y=y_axis_col, title=title, labels={x_axis_col: x_axis_label, y_axis_col: y_axis_label})
                elif chart_type == 'Barra':
                    fig = px.bar(data, x=x_axis_col, y=y_axis_col, title=title, labels={x_axis_col: x_axis_label, y_axis_col: y_axis_label})
                elif chart_type == 'Dispersão':
                    fig = px.scatter(data, x=x_axis_col, y=y_axis_col, title=title, labels={x_axis_col: x_axis_label, y_axis_col: y_axis_label})
                
                # Atualizar a cor do gráfico
                fig.update_traces(marker=dict(color=color))

                st.plotly_chart(fig, use_container_width=True)

                # Permite baixar o gráfico como HTML
                buffer = io.StringIO()
                pio.write_html(fig, buffer)
                html_bytes = buffer.getvalue().encode()

                st.download_button(
                    label="Baixar Gráfico como HTML",
                    data=html_bytes,
                    file_name='grafico.html',
                    mime='text/html'
                )

                # Permite baixar os dados filtrados como CSV
                csv = data.to_csv(index=False)
                st.download_button(
                    label="Baixar Dados Filtrados como CSV",
                    data=csv,
                    file_name='dados_filtrados.csv',
                    mime='text/csv'
                )

                # Analisar dados com OpenAI
                if st.button("Analisar Dados com OpenAI"):
                    with st.spinner('Analisando dados...'):
                        analysis = analyze_data_with_openai(data, title, x_axis_label, y_axis_label)
                        st.subheader("Análise do ChatGPT")
                        st.write(analysis)

        except Exception as e:
            st.error(f"Erro ao carregar os dados: {e}")
    else:
        st.info("Por favor, insira o link do Google Drive para carregar os dados.")

if __name__ == "__main__":
    app()
