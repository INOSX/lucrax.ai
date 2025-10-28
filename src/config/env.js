// Configuração de variáveis de ambiente
export const config = {
  supabase: {
    url: import.meta.env.supabase_url || '',
    anonKey: import.meta.env.supabase_anon_key || '',
  },
  openai: {
    apiKey: import.meta.env.openai_api_key || '',
  }
}

// Validação das variáveis obrigatórias
export const validateEnv = () => {
  const errors = []
  
  if (!config.supabase.url) {
    errors.push('supabase_url is required')
  }
  
  if (!config.supabase.anonKey) {
    errors.push('supabase_anon_key is required')
  }
  
  if (errors.length > 0) {
    console.error('Environment validation failed:', errors)
    throw new Error(`Missing required environment variables: ${errors.join(', ')}`)
  }
  
  return true
}

// Validar no carregamento
validateEnv()
