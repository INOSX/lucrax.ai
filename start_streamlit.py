import os
import sys
import subprocess
import pkg_resources

def install_packages():
    required = {
        'streamlit',
        'pandas',
        'plotly',
        'flake8',
        'pillow',
        'openai',
        'pynput',
        'sounddevice',
        'whisper',
        'langchain-openai',
        'langchain',
        'soundfile',
        'python-dotenv',
        'gtts',
        'pydub'
    }
    installed = {pkg.key for pkg in pkg_resources.working_set}
    missing = required - installed

    if missing:
        print(f"Instalando pacotes: {missing}")
        python = sys.executable
        subprocess.check_call([python, '-m', 'pip', 'install', *missing], stdout=sys.stdout, stderr=sys.stderr)

def main():
    # Instalar pacotes apenas se a variável de ambiente "PACKAGES_INSTALLED" não estiver definida
    if not os.environ.get('PACKAGES_INSTALLED'):
        install_packages()
        # Definir a variável de ambiente para evitar reinstalação em futuros execuções
        os.environ['PACKAGES_INSTALLED'] = '1'

    # Obter o diretório onde o executável está localizado
    if getattr(sys, 'frozen', False):
        application_path = os.path.dirname(sys.executable)
    else:
        application_path = os.path.dirname(os.path.abspath(__file__))

    # Caminho completo para o app.py
    app_path = os.path.join(application_path, 'app.py')

    # Verificar se o app.py existe
    if not os.path.exists(app_path):
        print(f"Erro: O arquivo app.py não foi encontrado em {app_path}")
        sys.exit(1)

    # Executar o Streamlit com o caminho completo para o app.py
    subprocess.run(["streamlit", "run", app_path])

if __name__ == "__main__":
    main()
