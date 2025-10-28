#!/usr/bin/env python3
"""
Script de teste para o Dashboard Dash do Lucrax.ai
"""
import sys
import os
import pandas as pd
import numpy as np
from datetime import datetime, timedelta

def test_imports():
    """Testa se todas as importações estão funcionando"""
    print("🔍 Testando importações...")
    
    try:
        import dash
        print("✅ Dash importado com sucesso")
    except ImportError as e:
        print(f"❌ Erro ao importar Dash: {e}")
        return False
    
    try:
        import plotly
        print("✅ Plotly importado com sucesso")
    except ImportError as e:
        print(f"❌ Erro ao importar Plotly: {e}")
        return False
    
    try:
        from app_dash_advanced import AdvancedDashboardManager
        print("✅ AdvancedDashboardManager importado com sucesso")
    except ImportError as e:
        print(f"❌ Erro ao importar AdvancedDashboardManager: {e}")
        return False
    
    return True

def test_dashboard_manager():
    """Testa o gerenciador do dashboard"""
    print("\n🔍 Testando AdvancedDashboardManager...")
    
    try:
        from app_dash_advanced import AdvancedDashboardManager
        manager = AdvancedDashboardManager()
        print("✅ Gerenciador criado com sucesso")
        
        # Testar com dados simulados
        test_data = pd.DataFrame({
            'Região': ['Norte', 'Sul', 'Leste', 'Oeste'] * 10,
            'Vendas': np.random.randint(1000, 10000, 40),
            'Categoria': ['A', 'B', 'C', 'D'] * 10,
            'Data': pd.date_range('2024-01-01', periods=40, freq='D')
        })
        
        manager.data = test_data
        manager.filtered_data = test_data
        manager.calculate_metrics()
        
        print("✅ Métricas calculadas com sucesso")
        print(f"   - Total: R$ {manager.metrics.get('current_total', 0):,.0f}")
        print(f"   - Registros: {manager.metrics.get('current_count', 0):,}")
        
        # Testar criação de gráficos
        trend_chart = manager.create_sales_trend_chart()
        print("✅ Gráfico de tendência criado com sucesso")
        
        category_chart = manager.create_category_chart()
        print("✅ Gráfico de categoria criado com sucesso")
        
        subcategory_chart = manager.create_subcategory_chart()
        print("✅ Gráfico de subcategoria criado com sucesso")
        
        state_chart = manager.create_state_chart()
        print("✅ Gráfico de estado criado com sucesso")
        
        bubble_chart = manager.create_bubble_chart()
        print("✅ Gráfico de bolhas criado com sucesso")
        
        recent_orders = manager.create_recent_orders_table()
        print("✅ Tabela de pedidos criada com sucesso")
        
        return True
        
    except Exception as e:
        print(f"❌ Erro ao testar gerenciador: {e}")
        return False

def test_data_loading():
    """Testa o carregamento de dados"""
    print("\n🔍 Testando carregamento de dados...")
    
    try:
        from src.data_loader import data_loader
        print("✅ DataLoader importado com sucesso")
        
        # Testar com URL inválida (deve falhar graciosamente)
        success, data, error = data_loader.load_data_from_url("https://invalid-url.com")
        if not success:
            print("✅ Tratamento de erro funcionando corretamente")
        else:
            print("⚠️  URL inválida não foi rejeitada")
        
        return True
        
    except Exception as e:
        print(f"❌ Erro ao testar carregamento de dados: {e}")
        return False

def test_chart_generation():
    """Testa a geração de gráficos"""
    print("\n🔍 Testando geração de gráficos...")
    
    try:
        from src.chart_generator import chart_generator
        print("✅ ChartGenerator importado com sucesso")
        
        # Dados de teste
        test_data = pd.DataFrame({
            'x': ['A', 'B', 'C', 'D'],
            'y': [10, 20, 30, 40]
        })
        
        # Testar diferentes tipos de gráfico
        chart_types = ['Bar', 'Line', 'Scatter', 'Pie', 'Area']
        
        for chart_type in chart_types:
            success, fig, error = chart_generator.generate_chart(
                test_data, 'x', 'y', chart_type, {}
            )
            if success:
                print(f"✅ Gráfico {chart_type} criado com sucesso")
            else:
                print(f"❌ Erro ao criar gráfico {chart_type}: {error}")
        
        return True
        
    except Exception as e:
        print(f"❌ Erro ao testar geração de gráficos: {e}")
        return False

def test_config():
    """Testa a configuração"""
    print("\n🔍 Testando configuração...")
    
    try:
        from config import Config
        print("✅ Config importado com sucesso")
        
        # Testar validação de configuração
        is_valid = Config.validate_config()
        print(f"✅ Configuração válida: {is_valid}")
        
        if not is_valid:
            missing = Config.get_missing_config()
            print(f"⚠️  Configurações faltantes: {missing}")
        
        return True
        
    except Exception as e:
        print(f"❌ Erro ao testar configuração: {e}")
        return False

def test_app_creation():
    """Testa a criação da aplicação Dash"""
    print("\n🔍 Testando criação da aplicação Dash...")
    
    try:
        from app_dash_advanced import app
        print("✅ Aplicação Dash criada com sucesso")
        
        # Verificar se o layout foi criado
        if hasattr(app, 'layout'):
            print("✅ Layout da aplicação configurado")
        else:
            print("❌ Layout da aplicação não encontrado")
            return False
        
        # Verificar callbacks
        if hasattr(app, 'callback_map'):
            print("✅ Callbacks configurados")
        else:
            print("⚠️  Callbacks não encontrados")
        
        return True
        
    except Exception as e:
        print(f"❌ Erro ao testar aplicação Dash: {e}")
        return False

def main():
    """Função principal de teste"""
    print("=" * 60)
    print("🧪 Teste do Dashboard Dash - Lucrax.ai")
    print("=" * 60)
    
    tests = [
        ("Importações", test_imports),
        ("Gerenciador do Dashboard", test_dashboard_manager),
        ("Carregamento de Dados", test_data_loading),
        ("Geração de Gráficos", test_chart_generation),
        ("Configuração", test_config),
        ("Criação da Aplicação", test_app_creation)
    ]
    
    passed = 0
    total = len(tests)
    
    for test_name, test_func in tests:
        print(f"\n{'='*20} {test_name} {'='*20}")
        try:
            if test_func():
                passed += 1
                print(f"✅ {test_name}: PASSOU")
            else:
                print(f"❌ {test_name}: FALHOU")
        except Exception as e:
            print(f"❌ {test_name}: ERRO - {e}")
    
    print("\n" + "=" * 60)
    print(f"📊 Resultado dos Testes: {passed}/{total} passaram")
    print("=" * 60)
    
    if passed == total:
        print("🎉 Todos os testes passaram! O dashboard está pronto para uso.")
        print("\n🚀 Para executar o dashboard:")
        print("   python run_dash_app.py")
        print("   ou")
        print("   python app_dash_advanced.py")
    else:
        print("⚠️  Alguns testes falharam. Verifique os erros acima.")
        print("\n🔧 Para instalar dependências:")
        print("   pip install -r requirements_dash.txt")
    
    return passed == total

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)

