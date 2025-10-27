-- Script para criar as tabelas do dataGPT no projeto correto
-- Execute este script no SQL Editor do Supabase (hwfnntgacsebqrprqzzm)

-- Tabela para armazenar fontes de dados
CREATE TABLE data_sources (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    source_type TEXT NOT NULL CHECK (source_type IN ('google_sheets', 'csv', 'excel', 'api')),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE
);

-- Tabela para armazenar análises realizadas
CREATE TABLE data_analyses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    data_source_id UUID REFERENCES data_sources(id) ON DELETE CASCADE,
    analysis_type TEXT NOT NULL CHECK (analysis_type IN ('basic', 'statistical', 'ai_analysis', 'custom')),
    prompt TEXT,
    result JSONB NOT NULL,
    model_used TEXT,
    processing_time_ms INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_session_id TEXT
);

-- Tabela para configurações de gráficos
CREATE TABLE chart_configurations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    chart_type TEXT NOT NULL CHECK (chart_type IN ('line', 'bar', 'scatter', 'area', 'pie', 'histogram', 'box')),
    x_axis_column TEXT,
    y_axis_column TEXT,
    title TEXT,
    x_axis_label TEXT,
    y_axis_label TEXT,
    color_scheme TEXT,
    show_totals BOOLEAN DEFAULT FALSE,
    configuration JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela para sessões de usuários
CREATE TABLE user_sessions (
    id TEXT PRIMARY KEY,
    user_agent TEXT,
    ip_address INET,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE
);

-- Tabela para logs de uso da API
CREATE TABLE api_usage_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id TEXT REFERENCES user_sessions(id) ON DELETE SET NULL,
    endpoint TEXT NOT NULL,
    method TEXT NOT NULL,
    status_code INTEGER NOT NULL,
    response_time_ms INTEGER,
    request_size_bytes INTEGER,
    response_size_bytes INTEGER,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela para dados importados
CREATE TABLE imported_data (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    data_source_id UUID REFERENCES data_sources(id) ON DELETE CASCADE,
    data JSONB NOT NULL,
    columns TEXT[] NOT NULL,
    row_count INTEGER NOT NULL,
    file_size_bytes INTEGER,
    import_status TEXT DEFAULT 'success' CHECK (import_status IN ('success', 'partial', 'failed')),
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_data_analyses_created_at ON data_analyses(created_at);
CREATE INDEX idx_data_analyses_data_source_id ON data_analyses(data_source_id);
CREATE INDEX idx_api_usage_logs_created_at ON api_usage_logs(created_at);
CREATE INDEX idx_api_usage_logs_session_id ON api_usage_logs(session_id);
CREATE INDEX idx_imported_data_data_source_id ON imported_data(data_source_id);

-- RLS (Row Level Security) - por enquanto desabilitado para facilitar desenvolvimento
ALTER TABLE data_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE chart_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE imported_data ENABLE ROW LEVEL SECURITY;

-- Políticas básicas (permitir tudo por enquanto)
CREATE POLICY "Allow all operations on data_sources" ON data_sources FOR ALL USING (true);
CREATE POLICY "Allow all operations on data_analyses" ON data_analyses FOR ALL USING (true);
CREATE POLICY "Allow all operations on chart_configurations" ON chart_configurations FOR ALL USING (true);
CREATE POLICY "Allow all operations on user_sessions" ON user_sessions FOR ALL USING (true);
CREATE POLICY "Allow all operations on api_usage_logs" ON api_usage_logs FOR ALL USING (true);
CREATE POLICY "Allow all operations on imported_data" ON imported_data FOR ALL USING (true);

-- Verificar se as tabelas foram criadas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('data_sources', 'data_analyses', 'chart_configurations', 'user_sessions', 'api_usage_logs', 'imported_data')
ORDER BY table_name;
