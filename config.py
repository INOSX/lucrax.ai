import streamlit as st

# Função para obter a chave API da configuração do usuário
def get_api_key():
    return st.session_state.get('api_key')

# Função para selecionar a rede neural e configurar a chave API
def select_neural_network():
    st.sidebar.header("Configuração da Rede Neural")
    neural_network = "NNeural"  # Fixar a escolha para NNeural
    st.sidebar.write(f"Usando a rede neural: {neural_network}")
    api_key = st.sidebar.text_input("Insira a chave API", type="password")

    if api_key:
        st.session_state['neural_network'] = neural_network
        st.session_state['api_key'] = api_key
        st.sidebar.success(f"{neural_network} configurada com sucesso!")

def get_selected_network():
    return st.session_state.get('neural_network')

# Função para obter a mensagem do sistema
def get_system_prompt():
    return "Digite aqui o seu prompt."  # Pode ser personalizado conforme necessário
