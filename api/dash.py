"""
API endpoint para servir a aplicação Dash no Vercel usando serverless-wsgi
"""
import sys
from pathlib import Path

# Adicionar o diretório pai ao path
sys.path.append(str(Path(__file__).parent.parent))

from serverless_wsgi import handle_request
from app_dash_advanced import app

# Dash expõe um servidor Flask em app.server (WSGI)
flask_app = app.server
app.config.suppress_callback_exceptions = True

def handler(request):
    """Adaptador do Vercel -> WSGI usando serverless-wsgi"""
    return handle_request(flask_app, request)

# Para compatibilidade com AWS Lambda
def lambda_handler(event, context):
    return handle_request(flask_app, event, context)
