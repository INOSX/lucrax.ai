import pandas as pd
import streamlit as st


def get_csv_export_url(url):
    """
    Converte o URL de visualização do Google Sheets para um URL de exportação CSV.

    Parameters:
    url (str): O URL de visualização do Google Sheets.

    Returns:
    str: O URL de exportação CSV.
    """
    try:
        file_id = url.split('/')[5]
        csv_export_url = (
        f"https://docs.google.com/spreadsheets/d/{file_id}/export?format=csv"
    )
        return csv_export_url
    except IndexError:
        raise ValueError("URL de Google Sheets inválido.")




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
