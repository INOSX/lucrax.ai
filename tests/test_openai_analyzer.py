import sys
import os
import pandas as pd

# Adicione o diretório pai ao sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from openai_analyzer import analyze_data_with_openai

# Dados de exemplo
data = pd.DataFrame({
    'x': [1, 2, 3, 4, 5],
    'y': [5, 4, 3, 2, 1]
})

title = "Exemplo de Gráfico"
x_axis_label = "Eixo X"
y_axis_label = "Eixo Y"

# Testar a função de análise
analysis = analyze_data_with_openai(data, title, x_axis_label, y_axis_label)
print("Análise do ChatGPT:")
print(analysis)
