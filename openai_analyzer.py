import openai
import pandas as pd
from config import OPENAI_API_KEY
from openai import OpenAI

# Configure a chave da API da OpenAI
openai.api_key = OPENAI_API_KEY
client = OpenAI(
    # defaults to os.environ.get("OPENAI_API_KEY")
    api_key=OPENAI_API_KEY,
)


def analyze_data_with_openai(data, title, x_axis_label, y_axis_label):
    """
    Envia dados e informações do gráfico para análise com OpenAI.

    Parâmetros:
    data (pd.DataFrame): Dados filtrados.
    title (str): Título do gráfico.
    x_axis_label (str): Rótulo do eixo X.
    y_axis_label (str): Rótulo do eixo Y.

    Retorna:
    str: Análise gerada pelo OpenAI.
    """
    # Converter o DataFrame para uma string CSV
    data_csv = data.to_csv(index=False)

    # Mensagem para enviar ao modelo
    prompt = f"""
    O gráfico a seguir foi gerado com os seguintes detalhes:
    - Título: {title}
    - Eixo X: {x_axis_label}
    - Eixo Y: {y_axis_label}

    Aqui estão os dados do gráfico:
    {data_csv}

    Por favor, analise esses dados e forneça insights sobre o que eles representam, tendências importantes e quaisquer anomalias notáveis.
    """

    # Enviar a mensagem para a OpenAI
    response = client.chat.completions.create(
        model="gpt-4",
        messages=[
            {"role": "system", "content": "Você é um analista de dados."},
            {"role": "user", "content": prompt},
        ]
    )

    # Retornar a análise gerada
    return response.choices[0].message.content.strip()
