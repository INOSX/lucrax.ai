#!/usr/bin/env python3
"""
Script para executar o Dashboard Dash do Lucrax.ai
"""
import sys
import os
import subprocess
from pathlib import Path

def check_dependencies():
    """Verifica se as dependências estão instaladas"""
    try:
        import dash
        import plotly
        import pandas
        import numpy
        print("✅ Dependências principais encontradas")
        return True
    except ImportError as e:
        print(f"❌ Dependência não encontrada: {e}")
        return False

def install_dependencies():
    """Instala as dependências necessárias"""
    print("📦 Instalando dependências do Dash...")
    try:
        subprocess.check_call([
            sys.executable, "-m", "pip", "install", "-r", "requirements_dash.txt"
        ])
        print("✅ Dependências instaladas com sucesso")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Erro ao instalar dependências: {e}")
        return False

def run_dashboard():
    """Executa o dashboard Dash"""
    print("🚀 Iniciando Dashboard Lucrax.ai...")
    print("📊 Acesse: http://localhost:8050")
    print("🛑 Para parar: Ctrl+C")
    print("-" * 50)
    
    try:
        # Importar e executar o app
        from app_dash_advanced import app
        app.run_server(debug=True, host='0.0.0.0', port=8050)
    except KeyboardInterrupt:
        print("\n🛑 Dashboard interrompido pelo usuário")
    except Exception as e:
        print(f"❌ Erro ao executar dashboard: {e}")

def main():
    """Função principal"""
    print("=" * 60)
    print("🎯 Lucrax.ai - Dashboard Profissional com Dash")
    print("=" * 60)
    
    # Verificar se estamos no diretório correto
    if not Path("app_dash_advanced.py").exists():
        print("❌ Arquivo app_dash_advanced.py não encontrado")
        print("   Certifique-se de estar no diretório correto")
        sys.exit(1)
    
    # Verificar dependências
    if not check_dependencies():
        print("\n🔧 Instalando dependências...")
        if not install_dependencies():
            print("❌ Falha ao instalar dependências")
            sys.exit(1)
    
    # Executar dashboard
    run_dashboard()

if __name__ == "__main__":
    main()

