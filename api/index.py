"""
API endpoint para o dataGPT v2.6 no Vercel
"""
import os
import sys
import json
from typing import Dict, Any
import pandas as pd
from io import StringIO

# Adicionar o diretório pai ao path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.data_loader import data_loader
from src.chart_generator import chart_generator
from src.openai_client import openai_client
from src.validators import DataValidator, SecurityValidator
from src.supabase_client import supabase_client
from config import Config

def handler(request):
    """
    Handler principal para requisições HTTP no Vercel
    """
    try:
        # Configurar CORS
    headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Content-Type': 'application/json'
    }
    
    # Lidar com preflight requests
    if request.method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps({'message': 'OK'})
        }
    
    # Processar requisições POST
    if request.method == 'POST':
        try:
            body = json.loads(request.body)
            action = body.get('action')
            
            if action == 'load_data':
                return handle_load_data(body, headers)
            elif action == 'generate_chart':
                return handle_generate_chart(body, headers)
            elif action == 'analyze_data':
                return handle_analyze_data(body, headers)
            else:
                return {
                    'statusCode': 400,
                    'headers': headers,
                    'body': json.dumps({'error': 'Ação não reconhecida'})
                }
        except json.JSONDecodeError:
            return {
                'statusCode': 400,
                'headers': headers,
                'body': json.dumps({'error': 'JSON inválido'})
            }
    
    # Resposta padrão para GET
    return {
        'statusCode': 200,
        'headers': headers,
        'body': json.dumps({
            'message': 'dataGPT v2.6 API',
            'version': '2.6',
            'status': 'active',
            'endpoints': [
                'POST /api - load_data, generate_chart, analyze_data'
            ]
        })
    }
    
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({'error': f'Erro interno: {str(e)}'})
        }

def handle_load_data(body: Dict[str, Any], headers: Dict[str, str]):
    """Processa carregamento de dados"""
    try:
        url = body.get('url')
        if not url:
            return {
                'statusCode': 400,
                'headers': headers,
                'body': json.dumps({'error': 'URL não fornecida'})
            }
        
        # Carregar dados
        success, data, error = data_loader.load_data_from_url(url)
        
        if not success:
            return {
                'statusCode': 400,
                'headers': headers,
                'body': json.dumps({'error': error})
            }
        
        # Converter para JSON serializable
        data_json = data.to_dict(orient='records')
        
        # Salvar no Supabase
        if supabase_client.is_connected():
            # Salvar fonte de dados
            source_success, source_id, source_error = supabase_client.save_data_source(
                name=f"Google Sheets - {url.split('/')[-1]}",
                url=url,
                source_type="google_sheets",
                description="Dados carregados do Google Sheets"
            )
            
            if source_success:
                # Salvar dados importados
                supabase_client.save_imported_data(
                    data_source_id=source_id,
                    data=data_json,
                    columns=data.columns.tolist(),
                    row_count=len(data_json),
                    file_size_bytes=len(json.dumps(data_json).encode('utf-8'))
                )
        
        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps({
                'success': True,
                'data': data_json,
                'columns': data.columns.tolist(),
                'shape': data.shape,
                'saved_to_db': supabase_client.is_connected()
            })
        }
        
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({'error': f'Erro ao carregar dados: {str(e)}'})
        }

def handle_generate_chart(body: Dict[str, Any], headers: Dict[str, str]):
    """Processa geração de gráficos"""
    try:
        data_json = body.get('data')
        chart_config = body.get('chart_config', {})
        
        if not data_json:
            return {
                'statusCode': 400,
                'headers': headers,
                'body': json.dumps({'error': 'Dados não fornecidos'})
            }
        
        # Converter JSON para DataFrame
        data = pd.DataFrame(data_json)
        
        # Validar configurações
        x_col = chart_config.get('x_axis_col')
        y_col = chart_config.get('y_axis_col')
        chart_type = chart_config.get('chart_type', 'Linha')
        
        is_valid, error = DataValidator.validate_chart_columns(data, x_col, y_col)
        if not is_valid:
            return {
                'statusCode': 400,
                'headers': headers,
                'body': json.dumps({'error': error})
            }
        
        # Gerar gráfico
        success, fig, error = chart_generator.generate_chart(
            data, x_col, y_col, chart_type, chart_config
        )
        
        if not success:
            return {
                'statusCode': 400,
                'headers': headers,
                'body': json.dumps({'error': error})
            }
        
        # Para gráficos Plotly, converter para JSON
        if chart_type in ['Linha', 'Barra', 'Dispersão', 'Áreas']:
            chart_json = fig.to_json()
            return {
                'statusCode': 200,
                'headers': headers,
                'body': json.dumps({
                    'success': True,
                    'chart_type': 'plotly',
                    'chart_data': json.loads(chart_json)
                })
            }
        else:
            # Para gráficos Matplotlib, retornar informações básicas
            return {
                'statusCode': 200,
                'headers': headers,
                'body': json.dumps({
                    'success': True,
                    'chart_type': 'matplotlib',
                    'message': 'Gráfico gerado com sucesso'
                })
            }
        
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({'error': f'Erro ao gerar gráfico: {str(e)}'})
        }

def handle_analyze_data(body: Dict[str, Any], headers: Dict[str, str]):
    """Processa análise com IA"""
    try:
        data_json = body.get('data')
        chart_config = body.get('chart_config', {})
        prompt = body.get('prompt', 'Analisar os dados fornecidos')
        
        if not data_json:
            return {
                'statusCode': 400,
                'headers': headers,
                'body': json.dumps({'error': 'Dados não fornecidos'})
            }
        
        # Converter JSON para DataFrame
        data = pd.DataFrame(data_json)
        
        # Sanitizar prompt
        prompt = SecurityValidator.sanitize_input(prompt, max_length=1000)
        
        # Verificar se OpenAI está disponível
        if not openai_client.is_available():
            return {
                'statusCode': 503,
                'headers': headers,
                'body': json.dumps({'error': 'Serviço de IA não disponível'})
            }
        
        # Fazer análise
        import time
        start_time = time.time()
        success, analysis, error = openai_client.analyze_data(prompt, data, chart_config)
        processing_time = int((time.time() - start_time) * 1000)
        
        if not success:
            return {
                'statusCode': 400,
                'headers': headers,
                'body': json.dumps({'error': error})
            }
        
        # Salvar análise no Supabase
        if supabase_client.is_connected():
            # Buscar fonte de dados mais recente
            sources_success, sources, sources_error = supabase_client.get_data_sources()
            if sources_success and sources:
                latest_source = sources[0]  # Mais recente
                supabase_client.save_analysis(
                    data_source_id=latest_source['id'],
                    analysis_type='ai_analysis',
                    prompt=prompt,
                    result={'analysis': analysis, 'chart_config': chart_config},
                    model_used='gpt-3.5-turbo',
                    processing_time_ms=processing_time
                )
        
        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps({
                'success': True,
                'analysis': analysis,
                'model': 'gpt-3.5-turbo',
                'processing_time_ms': processing_time,
                'saved_to_db': supabase_client.is_connected()
            })
        }
        
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({'error': f'Erro na análise: {str(e)}'})
        }

# Para compatibilidade com Vercel
def lambda_handler(event, context):
    """Wrapper para compatibilidade com AWS Lambda/Vercel"""
    class Request:
        def __init__(self, event):
            self.method = event.get('httpMethod', 'GET')
            self.body = event.get('body', '{}')
            self.headers = event.get('headers', {})
    
    request = Request(event)
    return handler(request)
