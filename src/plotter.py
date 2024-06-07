import plotly.express as px
import plotly.io as pio
import io


def generate_plot(data, x_axis_col, y_axis_col, chart_type='Linha'):
    """
    Gera um gráfico com as colunas selecionadas.

    Parameters:
    data (pd.DataFrame): Dados carregados.
    x_axis_col (str): Coluna para o eixo X.
    y_axis_col (str): Coluna para o eixo Y.
    chart_type (str): Tipo de gráfico ('Linha', 'Barra', 'Dispersão').

    Returns:
    fig: Figura do Plotly.
    """
    if chart_type == 'Linha':
        fig = px.line(data, x=x_axis_col, y=y_axis_col)
    elif chart_type == 'Barra':
        fig = px.bar(data, x=x_axis_col, y=y_axis_col)
    elif chart_type == 'Dispersão':
        fig = px.scatter(data, x=x_axis_col, y=y_axis_col)
    return fig


def save_plot_as_html(fig):
    """
    Salva o gráfico como um arquivo HTML.

    Parameters:
    fig: Figura do Plotly.

    Returns:
    html_bytes: Gráfico em formato HTML.
    """
    buffer = io.StringIO()
    pio.write_html(fig, buffer)
    html_bytes = buffer.getvalue().encode()
    return html_bytes
