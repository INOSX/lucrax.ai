# 🗄️ Integração Supabase - dataGPT v2.6

## 📋 Visão Geral

O dataGPT v2.6 agora está integrado com Supabase para persistência de dados, permitindo:

- ✅ **Armazenamento de fontes de dados**
- ✅ **Histórico de análises realizadas**
- ✅ **Configurações de gráficos salvas**
- ✅ **Logs de uso da API**
- ✅ **Sessões de usuários**

## 🏗️ Estrutura do Banco de Dados

### Tabelas Criadas

#### 1. `data_sources`
Armazena informações sobre fontes de dados importadas.

```sql
- id (UUID, PK)
- name (TEXT) - Nome da fonte
- url (TEXT) - URL da fonte
- source_type (TEXT) - Tipo: google_sheets, csv, excel, api
- description (TEXT) - Descrição opcional
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
- is_active (BOOLEAN)
```

#### 2. `data_analyses`
Registra todas as análises realizadas.

```sql
- id (UUID, PK)
- data_source_id (UUID, FK) - Referência à fonte
- analysis_type (TEXT) - Tipo: basic, statistical, ai_analysis, custom
- prompt (TEXT) - Prompt usado na análise
- result (JSONB) - Resultado da análise
- model_used (TEXT) - Modelo de IA usado
- processing_time_ms (INTEGER) - Tempo de processamento
- created_at (TIMESTAMP)
- user_session_id (TEXT) - ID da sessão
```

#### 3. `chart_configurations`
Salva configurações de gráficos reutilizáveis.

```sql
- id (UUID, PK)
- name (TEXT) - Nome da configuração
- chart_type (TEXT) - Tipo: line, bar, scatter, area, pie, histogram, box
- x_axis_column (TEXT) - Coluna do eixo X
- y_axis_column (TEXT) - Coluna do eixo Y
- title (TEXT) - Título do gráfico
- x_axis_label (TEXT) - Label do eixo X
- y_axis_label (TEXT) - Label do eixo Y
- color_scheme (TEXT) - Esquema de cores
- show_totals (BOOLEAN) - Mostrar totais
- configuration (JSONB) - Configurações adicionais
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

#### 4. `user_sessions`
Gerencia sessões de usuários.

```sql
- id (TEXT, PK) - ID da sessão
- user_agent (TEXT) - User agent do navegador
- ip_address (INET) - Endereço IP
- created_at (TIMESTAMP)
- last_activity (TIMESTAMP)
- is_active (BOOLEAN)
```

#### 5. `api_usage_logs`
Registra uso da API para monitoramento.

```sql
- id (UUID, PK)
- session_id (TEXT, FK) - Referência à sessão
- endpoint (TEXT) - Endpoint chamado
- method (TEXT) - Método HTTP
- status_code (INTEGER) - Código de status
- response_time_ms (INTEGER) - Tempo de resposta
- request_size_bytes (INTEGER) - Tamanho da requisição
- response_size_bytes (INTEGER) - Tamanho da resposta
- error_message (TEXT) - Mensagem de erro (se houver)
- created_at (TIMESTAMP)
```

#### 6. `imported_data`
Armazena dados importados para cache.

```sql
- id (UUID, PK)
- data_source_id (UUID, FK) - Referência à fonte
- data (JSONB) - Dados importados
- columns (TEXT[]) - Lista de colunas
- row_count (INTEGER) - Número de linhas
- file_size_bytes (INTEGER) - Tamanho do arquivo
- import_status (TEXT) - Status: success, partial, failed
- error_message (TEXT) - Mensagem de erro (se houver)
- created_at (TIMESTAMP)
```

## 🔧 Configuração

### Variáveis de Ambiente

Configure as seguintes variáveis no Vercel:

```env
SUPABASE_URL=https://hwfnntgacsebqrprqzzm.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh3Zm5udGdhY3NlYnFycHJxenptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE1NzI2MzgsImV4cCI6MjA3NzE0ODYzOH0.ywILG-tyRylzP6tZjzxD-y60OsInQ2GmH4qhbNG5FIg
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh3Zm5udGdhY3NlYnFycHJxenptIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTU3MjYzOCwiZXhwIjoyMDc3MTQ4NjM4fQ.3mo2wt6ew6x62W_hU9PMCmCEeHrrRQLaRGBguiEWK0M
```

### Cliente Supabase

O cliente está implementado em `src/supabase_client.py` com os seguintes métodos:

```python
# Verificar conexão
supabase_client.is_connected()

# Salvar fonte de dados
supabase_client.save_data_source(name, url, source_type, description)

# Salvar análise
supabase_client.save_analysis(data_source_id, analysis_type, prompt, result, model_used, processing_time_ms, user_session_id)

# Salvar configuração de gráfico
supabase_client.save_chart_configuration(name, chart_type, x_axis_column, y_axis_column, ...)

# Salvar dados importados
supabase_client.save_imported_data(data_source_id, data, columns, row_count, file_size_bytes, import_status, error_message)

# Registrar uso da API
supabase_client.log_api_usage(session_id, endpoint, method, status_code, response_time_ms, ...)

# Recuperar análises recentes
supabase_client.get_recent_analyses(limit)

# Recuperar fontes de dados
supabase_client.get_data_sources()

# Criar sessão de usuário
supabase_client.create_user_session(session_id, user_agent, ip_address)
```

## 🚀 Funcionalidades Implementadas

### 1. **Persistência Automática**
- Dados carregados são automaticamente salvos no Supabase
- Análises realizadas são registradas com metadados
- Configurações de gráficos podem ser reutilizadas

### 2. **Monitoramento**
- Logs de uso da API para análise de performance
- Rastreamento de sessões de usuários
- Métricas de tempo de processamento

### 3. **Cache Inteligente**
- Dados importados são armazenados para reutilização
- Reduz necessidade de recarregar dados do Google Sheets

### 4. **Histórico Completo**
- Todas as análises ficam salvas para consulta posterior
- Possibilidade de comparar análises ao longo do tempo

## 📊 Benefícios

### **Para Usuários**
- ✅ **Histórico de análises** - Acesse análises anteriores
- ✅ **Configurações salvas** - Reutilize configurações de gráficos
- ✅ **Performance melhorada** - Cache de dados importados

### **Para Desenvolvedores**
- ✅ **Monitoramento completo** - Logs detalhados de uso
- ✅ **Métricas de performance** - Tempos de resposta e processamento
- ✅ **Debugging facilitado** - Rastreamento de erros e sessões

### **Para Administradores**
- ✅ **Visão geral do uso** - Quantas análises foram realizadas
- ✅ **Fontes de dados populares** - Quais dados são mais usados
- ✅ **Performance da API** - Monitoramento de tempos de resposta

## 🔍 Consultas Úteis

### Análises Recentes
```sql
SELECT 
    da.*,
    ds.name as source_name,
    ds.url as source_url
FROM data_analyses da
JOIN data_sources ds ON da.data_source_id = ds.id
ORDER BY da.created_at DESC
LIMIT 10;
```

### Fontes de Dados Mais Usadas
```sql
SELECT 
    ds.name,
    ds.url,
    COUNT(da.id) as analysis_count
FROM data_sources ds
LEFT JOIN data_analyses da ON ds.id = da.data_source_id
GROUP BY ds.id, ds.name, ds.url
ORDER BY analysis_count DESC;
```

### Performance da API
```sql
SELECT 
    endpoint,
    method,
    AVG(response_time_ms) as avg_response_time,
    COUNT(*) as request_count
FROM api_usage_logs
WHERE created_at >= NOW() - INTERVAL '24 hours'
GROUP BY endpoint, method
ORDER BY avg_response_time DESC;
```

## 🛠️ Troubleshooting

### Problemas Comuns

1. **Erro de Conexão**
   - Verifique se as variáveis de ambiente estão configuradas
   - Confirme se o projeto Supabase está ativo

2. **Erro de Permissão**
   - Verifique se as políticas RLS estão configuradas corretamente
   - Confirme se as chaves de API estão corretas

3. **Dados Não Salvos**
   - Verifique os logs da aplicação
   - Confirme se o cliente Supabase está conectado

## 📈 Próximos Passos

1. **Dashboard de Analytics** - Interface para visualizar métricas
2. **Relatórios Automáticos** - Relatórios periódicos de uso
3. **Alertas de Performance** - Notificações quando a API está lenta
4. **Backup Automático** - Backup regular dos dados
5. **Análise de Tendências** - IA para identificar padrões de uso

---

**O dataGPT v2.6 agora tem persistência completa de dados!** 🎉
