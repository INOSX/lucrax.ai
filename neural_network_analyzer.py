import requests
import pandas as pd
from config import get_api_key
import streamlit as st

def analyze_data(data, title, x_axis_label, y_axis_label):
    """
    Envia dados e informações do gráfico para análise da I.A..

    Parâmetros:
    data (pd.DataFrame): Dados filtrados.
    title (str): Título do gráfico.
    x_axis_label (str): Rótulo do eixo X.
    y_axis_label (str): Rótulo do eixo Y.

    Retorna:
    str: Análise gerada pela I.A..
    """
    api_key = get_api_key()
    if not api_key:
        raise ValueError("Chave API não configurada. Por favor, configure a chave API na barra lateral.")

    # Definir a URL da API da NNeural
    nneural_url = "https://api.nneural.io/analyze"

    data_csv = data.to_csv(index=False)

    payload = {
        "title": title,
        "x_axis_label": x_axis_label,
        "y_axis_label": y_axis_label,
        "data": data_csv
    }

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }

    response = requests.post(nneural_url, json=payload, headers=headers)

    if response.status_code != 200:
        raise ValueError(f"Erro na requisição para a API da NNeural: {response.text}")

    return response.json().get("analysis", "Nenhuma análise disponível")

# Exemplo de uso
if __name__ == "__main__":
    # Supondo que o Streamlit seja usado para capturar os dados e chamar a função
    st.title("Análise de Dados com NNeural")
    
    uploaded_file = st.file_uploader("Escolha um arquivo CSV", type="csv")
    if uploaded_file is not None:
        data = pd.read_csv(uploaded_file)
        title = st.text_input("Título do Gráfico")
        x_axis_label = st.text_input("Rótulo do Eixo X")
        y_axis_label = st.text_input("Rótulo do Eixo Y")
        
        if st.button("Analisar"):
            analysis = analyze_data(data, title, x_axis_label, y_axis_label)
            st.write(analysis)
