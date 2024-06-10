import sys
import os
import pandas as pd
import streamlit as st

# Adicione o diretório pai ao sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from neural_network_analyzer import analyze_data

# Configurar chave API para teste
def setup_api_key(api_key):
    st.session_state.api_keys = {'OpenAI': api_key}
    st.session_state.selected_network = 'OpenAI'

# Dados de exemplo
data = pd.DataFrame({
    'x': [1, 2, 3, 4, 5],
    'y': [5, 4, 3, 2, 1]
})

title = "Exemplo de Gráfico"
x_axis_label = "Eixo X"
y_axis_label = "Eixo Y"

# Definir a chave API para o teste (substitua 'SUA_CHAVE_API' pela chave API real)
setup_api_key('SUA_CHAVE_API')

# Testar a função de análise
analysis = analyze_data(data, title, x_axis_label, y_axis_label)
print("Análise do ChatGPT:")
print(analysis)
