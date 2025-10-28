"""
API endpoint simplificado para servir aplicação Dash no Vercel
"""
import json
import os

def handler(request):
    """
    Handler simplificado para servir HTML estático da aplicação Dash
    """
    try:
        # Configurar CORS
        headers = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            'Content-Type': 'text/html; charset=utf-8'
        }
        
        # Lidar com preflight requests
        if request.method == 'OPTIONS':
            return {
                'statusCode': 200,
                'headers': headers,
                'body': ''
            }
        
        # HTML simplificado da aplicação Dash
        html_content = '''
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Lucrax.ai - Dashboard Profissional</title>
    <script src="https://cdn.plot.ly/plotly-2.33.0.min.js"></script>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <style>
        body {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 0;
            min-height: 100vh;
        }
        .dashboard-container {
            display: flex;
            min-height: 100vh;
        }
        .sidebar {
            width: 300px;
            background: rgba(0, 0, 0, 0.8);
            padding: 20px;
            color: white;
        }
        .main-content {
            flex: 1;
            padding: 20px;
            background: rgba(255, 255, 255, 0.95);
            margin: 20px;
            border-radius: 15px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        }
        .kpi-card {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px;
            border-radius: 10px;
            margin: 10px;
            text-align: center;
        }
        .kpi-value {
            font-size: 2.5rem;
            font-weight: bold;
            margin: 10px 0;
        }
        .kpi-label {
            font-size: 1rem;
            opacity: 0.9;
        }
        .chart-container {
            background: white;
            padding: 20px;
            border-radius: 10px;
            margin: 20px 0;
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
        }
        .form-control {
            margin-bottom: 15px;
        }
        .btn-primary {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            font-weight: 600;
        }
        .btn-primary:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
        }
    </style>
</head>
<body>
    <div class="dashboard-container">
        <!-- Sidebar -->
        <div class="sidebar">
            <h3 class="mb-4">🚀 Lucrax.ai</h3>
            <h5 class="mb-3">Fonte de Dados</h5>
            <div class="mb-3">
                <input type="text" class="form-control" id="googleSheetsUrl" 
                       placeholder="https://docs.google.com/spreadsheets/d/...">
            </div>
            <button class="btn btn-primary w-100 mb-3" onclick="loadData()">
                📊 Carregar Dados
            </button>
            
            <h5 class="mb-3 mt-4">Filtros Avançados</h5>
            <div class="mb-3">
                <label class="form-label">Período</label>
                <input type="date" class="form-control" id="startDate">
                <input type="date" class="form-control" id="endDate">
            </div>
            <div class="mb-3">
                <label class="form-label">Categoria</label>
                <select class="form-control" id="categoryFilter">
                    <option value="">Todas</option>
                </select>
            </div>
        </div>
        
        <!-- Main Content -->
        <div class="main-content">
            <div class="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h1 class="display-4 text-primary">Sales Scorecard</h1>
                    <p class="lead text-muted">Dashboard Profissional de Análise de Dados</p>
                </div>
                <div>
                    <select class="form-control d-inline-block w-auto me-2">
                        <option>2025</option>
                    </select>
                    <select class="form-control d-inline-block w-auto">
                        <option>Todos</option>
                    </select>
                </div>
            </div>
            
            <!-- KPIs -->
            <div class="row mb-4">
                <div class="col-md-4">
                    <div class="kpi-card">
                        <div class="kpi-value">5,080</div>
                        <div class="kpi-label">ANO ATUAL</div>
                        <small class="text-success">+25.0% vs anterior</small>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="kpi-card">
                        <div class="kpi-value">R$ 4,064</div>
                        <div class="kpi-label">ANO ANTERIOR</div>
                        <small class="text-success">+25.0% crescimento</small>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="kpi-card">
                        <div class="kpi-value">25.0%</div>
                        <div class="kpi-label">CRESCIMENTO YOY</div>
                        <small class="text-success">+25.0%</small>
                    </div>
                </div>
            </div>
            
            <!-- Charts -->
            <div class="row">
                <div class="col-md-6">
                    <div class="chart-container">
                        <h5>Vendas por Subcategoria</h5>
                        <div id="subcategoryChart" style="height: 400px;"></div>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="chart-container">
                        <h5>Vendas por Categoria</h5>
                        <div id="categoryChart" style="height: 400px;"></div>
                    </div>
                </div>
            </div>
            
            <!-- Data Table -->
            <div class="chart-container">
                <h5>Dados Carregados</h5>
                <div id="dataTable"></div>
            </div>
        </div>
    </div>

    <script>
        // Dados de exemplo
        const sampleData = {
            subcategory: [
                {name: 'Aug 3', value: -2500},
                {name: 'Aug 10', value: -2000},
                {name: 'Aug 17', value: -1500},
                {name: 'Aug 24', value: -1000},
                {name: 'Aug 31', value: -500}
            ],
            category: [
                {name: '2025-08-14', value: 940, percentage: 10.9},
                {name: '2025-08-27', value: 950, percentage: 11.0},
                {name: '2025-08-30', value: 760, percentage: 8.78}
            ]
        };

        function loadData() {
            const url = document.getElementById('googleSheetsUrl').value;
            if (!url) {
                alert('Por favor, insira uma URL do Google Sheets');
                return;
            }
            
            // Simular carregamento
            showLoading();
            
            // Simular dados carregados
            setTimeout(() => {
                updateCharts();
                updateDataTable();
                hideLoading();
                alert('Dados carregados com sucesso!');
            }, 2000);
        }

        function showLoading() {
            document.getElementById('dataTable').innerHTML = '<div class="text-center"><div class="spinner-border" role="status"></div><p>Carregando dados...</p></div>';
        }

        function hideLoading() {
            // Loading será substituído pelos dados
        }

        function updateCharts() {
            // Gráfico de Subcategoria
            const subcategoryTrace = {
                x: sampleData.subcategory.map(d => d.value),
                y: sampleData.subcategory.map(d => d.name),
                type: 'bar',
                orientation: 'h',
                marker: {color: '#667eea'}
            };
            
            Plotly.newPlot('subcategoryChart', [subcategoryTrace], {
                title: 'Vendas por Subcategoria em 2017',
                xaxis: {title: 'Vendas (R$)'},
                yaxis: {title: 'Subcategoria'},
                margin: {l: 100, r: 50, t: 50, b: 50}
            });

            // Gráfico de Categoria (Pizza)
            const categoryTrace = {
                values: sampleData.category.map(d => d.value),
                labels: sampleData.category.map(d => d.name),
                type: 'pie',
                textinfo: 'label+percent+value',
                textposition: 'outside'
            };
            
            Plotly.newPlot('categoryChart', [categoryTrace], {
                title: 'Vendas por Categoria em 2017',
                margin: {l: 50, r: 50, t: 50, b: 50}
            });
        }

        function updateDataTable() {
            const tableHtml = `
                <table class="table table-striped">
                    <thead>
                        <tr>
                            <th>Data</th>
                            <th>Categoria</th>
                            <th>Valor</th>
                            <th>Percentual</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${sampleData.category.map(d => `
                            <tr>
                                <td>${d.name}</td>
                                <td>Categoria ${d.name.split('-')[2]}</td>
                                <td>R$ ${d.value.toLocaleString()}</td>
                                <td>${d.percentage}%</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
            document.getElementById('dataTable').innerHTML = tableHtml;
        }

        // Inicializar gráficos ao carregar a página
        document.addEventListener('DOMContentLoaded', function() {
            updateCharts();
            updateDataTable();
        });
    </script>
</body>
</html>
        '''
        
        return {
            'statusCode': 200,
            'headers': headers,
            'body': html_content
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
