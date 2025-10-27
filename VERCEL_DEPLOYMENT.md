# 🚀 Deploy do dataGPT v2.6 no Vercel

## 📋 Visão Geral

Este documento descreve como fazer o deploy do dataGPT v2.6 na plataforma Vercel, convertendo a aplicação Streamlit para uma API serverless.

## 🏗️ Arquitetura no Vercel

### Estrutura de Arquivos
```
dataGPT/
├── api/
│   └── index.py              # API principal (serverless function)
├── src/                      # Módulos Python
├── vercel.json              # Configuração do Vercel
├── package.json             # Configuração Node.js
├── requirements-vercel.txt  # Dependências Python otimizadas
├── .vercelignore           # Arquivos ignorados no deploy
└── VERCEL_DEPLOYMENT.md    # Esta documentação
```

### Endpoints da API

#### `GET /` ou `GET /api`
- **Descrição**: Informações sobre a API
- **Resposta**: Status e endpoints disponíveis

#### `POST /api` - Ações Disponíveis

##### 1. Carregar Dados (`load_data`)
```json
{
  "action": "load_data",
  "url": "https://docs.google.com/spreadsheets/d/..."
}
```

**Resposta:**
```json
{
  "success": true,
  "data": [...],
  "columns": ["col1", "col2", ...],
  "shape": [100, 5]
}
```

##### 2. Gerar Gráfico (`generate_chart`)
```json
{
  "action": "generate_chart",
  "data": [...],
  "chart_config": {
    "x_axis_col": "col1",
    "y_axis_col": "col2",
    "chart_type": "Linha",
    "title": "Meu Gráfico"
  }
}
```

**Resposta:**
```json
{
  "success": true,
  "chart_type": "plotly",
  "chart_data": {...}
}
```

##### 3. Analisar com IA (`analyze_data`)
```json
{
  "action": "analyze_data",
  "data": [...],
  "chart_config": {...},
  "prompt": "Analisar os dados fornecidos"
}
```

**Resposta:**
```json
{
  "success": true,
  "analysis": "Análise detalhada...",
  "model": "gpt-3.5-turbo"
}
```

## 🔧 Configuração

### 1. Variáveis de Ambiente

Configure as seguintes variáveis no painel do Vercel:

```env
OPENAI_API_KEY=sk-proj-...
OPENAI_MODEL=gpt-3.5-turbo
OPENAI_MAX_TOKENS=1000
OPENAI_TEMPERATURE=0.7
API_BASE_URL=http://93.127.210.77:5000
```

### 2. Configuração do Projeto

O arquivo `vercel.json` já está configurado com:
- **Runtime**: Python 3.9+
- **Memory**: 1024MB
- **Timeout**: 30 segundos
- **Region**: iad1 (US East)

## 🚀 Deploy

### Método 1: Vercel CLI
```bash
# Instalar Vercel CLI
npm i -g vercel

# Fazer login
vercel login

# Deploy
vercel

# Deploy para produção
vercel --prod
```

### Método 2: GitHub Integration
1. Conecte o repositório GitHub ao Vercel
2. Configure as variáveis de ambiente
3. Deploy automático a cada push

### Método 3: Deploy Manual
1. Acesse [vercel.com](https://vercel.com)
2. Importe o projeto
3. Configure as variáveis de ambiente
4. Deploy

## 📊 Limitações e Considerações

### Limitações do Vercel
- **Timeout**: 30 segundos por requisição
- **Memory**: 1024MB máximo
- **Payload**: 4.5MB máximo
- **Cold Start**: Pode haver delay na primeira requisição

### Otimizações Implementadas
- **Dependências mínimas**: `requirements-vercel.txt` otimizado
- **Arquivos ignorados**: `.vercelignore` configurado
- **Cache**: Implementado para dados e análises
- **Error Handling**: Tratamento robusto de erros

## 🧪 Testando a API

### Exemplo com cURL

```bash
# Testar status da API
curl https://seu-projeto.vercel.app/api

# Carregar dados
curl -X POST https://seu-projeto.vercel.app/api \
  -H "Content-Type: application/json" \
  -d '{
    "action": "load_data",
    "url": "https://docs.google.com/spreadsheets/d/..."
  }'

# Gerar gráfico
curl -X POST https://seu-projeto.vercel.app/api \
  -H "Content-Type: application/json" \
  -d '{
    "action": "generate_chart",
    "data": [{"x": 1, "y": 2}, {"x": 2, "y": 4}],
    "chart_config": {
      "x_axis_col": "x",
      "y_axis_col": "y",
      "chart_type": "Linha"
    }
  }'

# Analisar com IA
curl -X POST https://seu-projeto.vercel.app/api \
  -H "Content-Type: application/json" \
  -d '{
    "action": "analyze_data",
    "data": [{"x": 1, "y": 2}, {"x": 2, "y": 4}],
    "chart_config": {...},
    "prompt": "Analisar os dados"
  }'
```

### Exemplo com JavaScript

```javascript
// Carregar dados
const loadData = async (url) => {
  const response = await fetch('https://seu-projeto.vercel.app/api', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      action: 'load_data',
      url: url
    })
  });
  
  return await response.json();
};

// Gerar gráfico
const generateChart = async (data, chartConfig) => {
  const response = await fetch('https://seu-projeto.vercel.app/api', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      action: 'generate_chart',
      data: data,
      chart_config: chartConfig
    })
  });
  
  return await response.json();
};

// Analisar com IA
const analyzeData = async (data, chartConfig, prompt) => {
  const response = await fetch('https://seu-projeto.vercel.app/api', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      action: 'analyze_data',
      data: data,
      chart_config: chartConfig,
      prompt: prompt
    })
  });
  
  return await response.json();
};
```

## 🔍 Monitoramento

### Logs
- Acesse o painel do Vercel
- Vá para "Functions" > "View Function Logs"
- Monitore erros e performance

### Métricas
- **Requests**: Número de requisições
- **Duration**: Tempo de execução
- **Memory**: Uso de memória
- **Errors**: Taxa de erro

## 🛠️ Troubleshooting

### Problemas Comuns

1. **Timeout Error**
   - Reduza o tamanho dos dados
   - Otimize as consultas
   - Use cache quando possível

2. **Memory Error**
   - Reduza o tamanho dos DataFrames
   - Processe dados em lotes menores
   - Otimize o uso de memória

3. **Cold Start**
   - Implemente warm-up requests
   - Use Vercel Pro para melhor performance
   - Considere usar Edge Functions

4. **CORS Issues**
   - Verifique os headers CORS
   - Configure domínios permitidos
   - Teste com diferentes origens

## 📈 Próximos Passos

1. **Frontend**: Criar interface web que consome a API
2. **Cache**: Implementar cache Redis para melhor performance
3. **Rate Limiting**: Adicionar limitação de taxa
4. **Monitoring**: Implementar alertas e métricas avançadas
5. **CDN**: Usar Vercel Edge Network para melhor distribuição

## 📞 Suporte

Para problemas específicos do Vercel:
- [Documentação Vercel](https://vercel.com/docs)
- [Vercel Community](https://github.com/vercel/vercel/discussions)
- [Status Page](https://vercel-status.com/)

Para problemas do dataGPT:
- [GitHub Issues](https://github.com/m2f0/dataGPT/issues)
- [Documentação do Projeto](README.md)
