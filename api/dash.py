"""
API endpoint para servir a aplicação Dash no Vercel
"""
import os
import sys
from pathlib import Path

# Adicionar o diretório pai ao path
sys.path.append(str(Path(__file__).parent.parent))

# Importar a aplicação Dash
from app_dash_advanced import app

# Configurar para produção
app.config.suppress_callback_exceptions = True

def handler(request):
    """
    Handler para servir a aplicação Dash no Vercel
    """
    try:
        # Configurar CORS
        headers = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        }
        
        # Lidar com preflight requests
        if request.method == 'OPTIONS':
            return {
                'statusCode': 200,
                'headers': headers,
                'body': ''
            }
        
        # Para requisições GET, servir a aplicação Dash
        if request.method == 'GET':
            # Simular uma requisição WSGI
            environ = {
                'REQUEST_METHOD': 'GET',
                'PATH_INFO': request.path or '/',
                'QUERY_STRING': '',
                'CONTENT_TYPE': '',
                'CONTENT_LENGTH': '0',
                'SERVER_NAME': 'localhost',
                'SERVER_PORT': '80',
                'wsgi.version': (1, 0),
                'wsgi.url_scheme': 'https',
                'wsgi.input': None,
                'wsgi.errors': sys.stderr,
                'wsgi.multithread': False,
                'wsgi.multiprocess': True,
                'wsgi.run_once': False
            }
            
            # Capturar a resposta da aplicação Dash
            response_data = []
            def start_response(status, response_headers):
                response_data.append(status)
                response_data.append(response_headers)
            
            # Executar a aplicação
            app_iter = app.server(environ, start_response)
            body = b''.join(app_iter).decode('utf-8')
            
            # Determinar content-type
            content_type = 'text/html'
            for header in response_data[1] if len(response_data) > 1 else []:
                if header[0].lower() == 'content-type':
                    content_type = header[1]
                    break
            
            return {
                'statusCode': int(response_data[0].split()[0]) if response_data else 200,
                'headers': {
                    **headers,
                    'Content-Type': content_type
                },
                'body': body
            }
        
        # Para outros métodos, retornar erro
        return {
            'statusCode': 405,
            'headers': headers,
            'body': 'Method not allowed'
        }
        
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'text/html',
                'Access-Control-Allow-Origin': '*'
            },
            'body': f'<html><body><h1>Erro interno</h1><p>{str(e)}</p></body></html>'
        }

# Para compatibilidade com Vercel
def lambda_handler(event, context):
    """Wrapper para compatibilidade com AWS Lambda/Vercel"""
    class Request:
        def __init__(self, event):
            self.method = event.get('httpMethod', 'GET')
            self.path = event.get('path', '/')
            self.body = event.get('body', '{}')
            self.headers = event.get('headers', {})
    
    request = Request(event)
    return handler(request)
