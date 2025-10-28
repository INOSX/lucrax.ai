"""
API endpoint simplificado para teste no Vercel
"""
import json

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
        
        # Resposta padrão para GET
        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps({
                'message': 'Lucrax.ai API v2.6',
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
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': f'Erro interno: {str(e)}'})
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
