# 🚀 dataGPT v2.6 - Deploy no Vercel

## 📋 Visão Geral

O dataGPT v2.6 foi adaptado para funcionar como uma **API serverless** na plataforma Vercel, mantendo todas as funcionalidades principais:

- ✅ **Carregamento de dados** do Google Sheets
- ✅ **Geração de gráficos** interativos (Plotly)
- ✅ **Análise com IA** usando OpenAI
- ✅ **Interface web** para teste da API
- ✅ **Deploy automático** via GitHub

## 🏗️ Arquitetura

### Estrutura do Projeto
```
dataGPT/
├── api/
│   └── index.py              # API serverless principal
├── public/
│   └── index.html            # Interface web de teste
├── src/                      # Módulos Python
├── vercel.json              # Configuração do Vercel
├── requirements-vercel.txt  # Dependências otimizadas
├── package.json             # Configuração Node.js
└── .vercelignore           # Arquivos ignorados
```

### Endpoints da API

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `GET` | `/` | Interface web de teste |
| `GET` | `/api` | Status da API |
| `POST` | `/api` | Endpoint principal para ações |

### Ações Disponíveis

#### 1. `load_data` - Carregar Dados
```json
{
  "action": "load_data",
  "url": "https://docs.google.com/spreadsheets/d/..."
}
```

#### 2. `generate_chart` - Gerar Gráfico
```json
{
  "action": "generate_chart",
  "data": [...],
  "chart_config": {
    "x_axis_col": "col1",
    "y_axis_col": "col2",
    "chart_type": "Linha"
  }
}
```

#### 3. `analyze_data` - Analisar com IA
```json
{
  "action": "analyze_data",
  "data": [...],
  "chart_config": {...},
  "prompt": "Analisar os dados"
}
```

## 🔄 Integração GitHub → Vercel (CI/CD)

- **develop** → Staging (`https://staging.lucrax.ai`)
- **main** → Produção (`https://lucrax.ai`)
- Deploy é disparado automaticamente em cada push para o branch correspondente.
- **NÃO é necessário usar Vercel CLI** para deploy no fluxo padrão.

### Convencões OBRIGATÓRIAS
- **SEMPRE trabalhar no branch `develop`**
- Abra PRs para `develop`. Ao merge, o Staging é atualizado automaticamente.
- **Para produção**: APENAS quando usuário solicitar explicitamente
  - Usuário deve pedir: "faça deploy para produção" ou "merge para main"
  - Então criar PR `develop` → `main`
  - Ao merge, a Produção é atualizada automaticamente

### Rollback
- Reverter para um deployment anterior no painel do Vercel (Deployments → Redeploy/Assign alias).

## 🚀 Deploy Rápido

### Opção 1: Deploy Automático (Recomendado)
- Já configurado: GitHub conectado → Vercel com mapeamento de branches.
- Push para `develop` atualiza Staging; push/merge em `main` atualiza Produção.

### Opção 2: Deploy Manual (casos excepcionais)
```bash
# Instalar Vercel CLI
npm install -g vercel

# Fazer login
vercel login

# Vincular ao projeto correto (ID)
vercel link --project lucrax.ai --scope inosx

# Garantir Project ID correto no .vercel/project.json
# projectId: prj_ig3SKAuvThlZSSXmxyWxfveweeKH

# Deploy de preview (staging)
vercel --confirm --scope inosx

# Deploy de produção
vercel --prod --confirm --scope inosx
```

### Opção 3: Scripts Automatizados
```bash
# Linux/Mac
chmod +x deploy-vercel.sh
./deploy-vercel.sh

# Windows PowerShell
.\deploy-vercel.ps1
```

## 🔧 Configuração

### Variáveis de Ambiente
Configure no painel do Vercel:

```env
OPENAI_API_KEY=sk-proj-...
OPENAI_MODEL=gpt-3.5-turbo
OPENAI_MAX_TOKENS=1000
OPENAI_TEMPERATURE=0.7
API_BASE_URL=http://93.127.210.77:5000
```

### Configuração do Projeto
- **Runtime**: Python 3.9+
- **Memory**: 1024MB
- **Timeout**: 30 segundos
- **Region**: iad1 (US East)

## 🧪 Testando a API

### Interface Web
Acesse `https://lucrax.ai/` para usar a interface de teste.

### Exemplo com cURL
```bash
# Testar status
curl https://lucrax.ai/api

# Carregar dados
curl -X POST https://lucrax.ai/api \
  -H "Content-Type: application/json" \
  -d '{"action": "load_data", "url": "https://docs.google.com/spreadsheets/d/..."}'
```

### Exemplo com JavaScript
```javascript
const response = await fetch('https://seu-projeto.vercel.app/api', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: 'load_data',
    url: 'https://docs.google.com/spreadsheets/d/...'
  })
});

const data = await response.json();
console.log(data);
```

## 📊 Limitações do Vercel

### Limitações Técnicas
- **Timeout**: 30 segundos por requisição
- **Memory**: 1024MB máximo
- **Payload**: 4.5MB máximo
- **Cold Start**: Delay na primeira requisição

### Otimizações Implementadas
- ✅ **Dependências mínimas** para reduzir tamanho
- ✅ **Cache inteligente** para melhor performance
- ✅ **Error handling** robusto
- ✅ **CORS configurado** para web apps
- ✅ **Compressão** de dados quando possível

## 🔍 Monitoramento

### Logs
- Acesse o painel do Vercel
- Vá para "Functions" > "View Function Logs"

### Métricas
- **Requests**: Número de requisições
- **Duration**: Tempo de execução
- **Memory**: Uso de memória
- **Errors**: Taxa de erro

## 🛠️ Troubleshooting

### Problemas Comuns

1. **Timeout Error**
   - Reduza o tamanho dos dados
   - Use cache quando possível

2. **Memory Error**
   - Processe dados em lotes menores
   - Otimize o uso de memória

3. **Cold Start**
   - Implemente warm-up requests
   - Use Vercel Pro para melhor performance

4. **CORS Issues**
   - Verifique os headers CORS
   - Configure domínios permitidos

## 📈 Próximos Passos

1. **Frontend Avançado**: Criar interface React/Vue
2. **Cache Redis**: Implementar cache distribuído
3. **Rate Limiting**: Adicionar limitação de taxa
4. **Monitoring**: Alertas e métricas avançadas
5. **CDN**: Usar Vercel Edge Network

## 🔗 Links Úteis

- [Vercel Documentation](https://vercel.com/docs)
- [Vercel Python Runtime](https://vercel.com/docs/functions/serverless-functions/runtimes/python)
- [OpenAI API Documentation](https://platform.openai.com/docs)
- [Plotly.js Documentation](https://plotly.com/javascript/)

## 📞 Suporte

- **GitHub Issues**: [m2f0/dataGPT/issues](https://github.com/m2f0/dataGPT/issues)
- **Vercel Community**: [vercel/vercel/discussions](https://github.com/vercel/vercel/discussions)
- **Documentação Completa**: [VERCEL_DEPLOYMENT.md](VERCEL_DEPLOYMENT.md)

---

**🎉 Pronto para usar!** Sua API do dataGPT v2.6 está funcionando no Vercel!
