import os
import subprocess
import sys

# Lista de dependências do requirements.txt (removendo pacotes de áudio)
required_packages = [
    "streamlit",
    "pandas",
    "plotly",
    "flake8",
    "pillow",
    "openai",
    "langchain-openai",
    "langchain",
    "python-dotenv"
]

# Função para instalar dependências
def install_packages():
    for package in required_packages:
        subprocess.check_call([sys.executable, "-m", "pip", "install", package])

if __name__ == "__main__":
    install_packages()
    os.system("streamlit run app.py")
