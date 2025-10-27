#!/usr/bin/env python3
"""
Script de inicialização melhorado para o dataGPT v2.6
"""
import os
import sys
import subprocess
import argparse
from pathlib import Path

def check_dependencies():
    """Verifica se as dependências estão instaladas"""
    try:
        import streamlit
        import pandas
        import plotly
        import matplotlib
        import seaborn
        import requests
        from dotenv import load_dotenv
        print("[OK] Todas as dependências principais estão instaladas")
        return True
    except ImportError as e:
        print(f"[ERRO] Dependência faltante: {e}")
        return False

def install_dependencies():
    """Instala as dependências do requirements.txt"""
    print("[INFO] Instalando dependências...")
    try:
        subprocess.check_call([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"])
        print("[OK] Dependências instaladas com sucesso")
        return True
    except subprocess.CalledProcessError as e:
        print(f"[ERRO] Erro ao instalar dependências: {e}")
        return False

def check_config():
    """Verifica se o arquivo de configuração existe"""
    env_file = Path(".env")
    if not env_file.exists():
        print("[AVISO] Arquivo .env não encontrado")
        print("[INFO] Copie config_example.env para .env e configure suas credenciais")
        return False
    print("[OK] Arquivo de configuração encontrado")
    return True

def run_tests():
    """Executa os testes"""
    print("[INFO] Executando testes...")
    try:
        subprocess.check_call([sys.executable, "-m", "pytest", "tests/", "-v"])
        print("[OK] Todos os testes passaram")
        return True
    except subprocess.CalledProcessError:
        print("[ERRO] Alguns testes falharam")
        return False

def run_app(use_improved=True, port=8501):
    """Executa a aplicação"""
    app_file = "app_improved.py" if use_improved else "app.py"
    
    if not Path(app_file).exists():
        print(f"[ERRO] Arquivo {app_file} não encontrado")
        return False
    
    print(f"[INFO] Iniciando dataGPT v2.6...")
    print(f"[INFO] Acesse: http://localhost:{port}")
    
    try:
        subprocess.run([
            sys.executable, "-m", "streamlit", "run", app_file,
            "--server.port", str(port),
            "--server.headless", "true"
        ])
        return True
    except KeyboardInterrupt:
        print("\n[INFO] Aplicação encerrada pelo usuário")
        return True
    except Exception as e:
        print(f"[ERRO] Erro ao executar aplicação: {e}")
        return False

def main():
    """Função principal"""
    parser = argparse.ArgumentParser(description="dataGPT v2.6 - Inicializador")
    parser.add_argument("--install", action="store_true", help="Instalar dependências")
    parser.add_argument("--test", action="store_true", help="Executar testes")
    parser.add_argument("--port", type=int, default=8501, help="Porta para executar a aplicação")
    parser.add_argument("--use-original", action="store_true", help="Usar versão original (app.py)")
    parser.add_argument("--check-only", action="store_true", help="Apenas verificar dependências e configuração")
    
    args = parser.parse_args()
    
    print("dataGPT v2.6 - Inicializador")
    print("=" * 40)
    
    # Verificar dependências
    if not check_dependencies():
        if args.install:
            if not install_dependencies():
                sys.exit(1)
        else:
            print("[INFO] Execute com --install para instalar dependências automaticamente")
            sys.exit(1)
    
    # Verificar configuração
    config_ok = check_config()
    
    # Executar testes se solicitado
    if args.test:
        if not run_tests():
            sys.exit(1)
    
    # Apenas verificar se solicitado
    if args.check_only:
        print("[OK] Verificação concluída")
        return
    
    # Executar aplicação
    if not config_ok:
        print("[AVISO] Aplicação será executada sem configuração completa")
    
    use_improved = not args.use_original
    if not run_app(use_improved, args.port):
        sys.exit(1)

if __name__ == "__main__":
    main()
