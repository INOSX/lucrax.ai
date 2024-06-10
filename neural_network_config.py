import streamlit as st

def select_neural_network():
    st.sidebar.title("Configuração da Rede Neural")
    neural_networks = {
        "NNovUp": "NNovUp",
        "Meta": "Meta",
        "Google": "Google",
        "OpenAI": "OpenAI"
    }

    selected_network = st.sidebar.selectbox("Escolha a Rede Neural", list(neural_networks.keys()))

    if "api_keys" not in st.session_state:
        st.session_state.api_keys = {}

    if selected_network:
        api_key = st.sidebar.text_input(f"Insira a chave API da {selected_network}", type="password")

        if st.sidebar.button("Configurar Rede Neural"):
            st.session_state.api_keys[selected_network] = api_key
            st.session_state.selected_network = selected_network
            st.sidebar.success(f"Rede Neural {selected_network} configurada e pronta para uso!")

def get_selected_network():
    return st.session_state.get("selected_network", None)

def get_api_key():
    selected_network = get_selected_network()
    if selected_network:
        return st.session_state.api_keys.get(selected_network, None)
    return None
