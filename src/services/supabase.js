import { createClient } from '@supabase/supabase-js'
import { config } from '../config/env.js'

// Validação das variáveis de ambiente
if (!config.supabase.url) {
  throw new Error('VITE_SUPABASE_URL is required. Please check your environment variables.')
}

if (!config.supabase.anonKey) {
  throw new Error('VITE_SUPABASE_ANON_KEY is required. Please check your environment variables.')
}

export const supabase = createClient(config.supabase.url, config.supabase.anonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

// Funções auxiliares para autenticação
export const auth = {
  // Fazer login
  signIn: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    return { data, error }
  },

  // Fazer cadastro
  signUp: async (email, password, userData = {}) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData
      }
    })
    return { data, error }
  },

  // Fazer logout
  signOut: async () => {
    const { error } = await supabase.auth.signOut()
    return { error }
  },

  // Obter usuário atual
  getCurrentUser: () => {
    return supabase.auth.getUser()
  },

  // Escutar mudanças de autenticação
  onAuthStateChange: (callback) => {
    return supabase.auth.onAuthStateChange(callback)
  }
}

// Funções auxiliares para dados
export const data = {
  // Salvar fonte de dados
  saveDataSource: async (dataSource) => {
    const { data, error } = await supabase
      .from('data_sources')
      .insert(dataSource)
      .select()
      .single()
    return { data, error }
  },

  // Salvar dataset
  saveDataset: async (dataset) => {
    const { data, error } = await supabase
      .from('datasets')
      .insert(dataset)
      .select()
      .single()
    return { data, error }
  },

  // Obter datasets do usuário
  getUserDatasets: async () => {
    const { data, error } = await supabase
      .from('datasets')
      .select(`
        *,
        data_sources (*)
      `)
      .order('created_at', { ascending: false })
    return { data, error }
  },

  // Salvar configuração de gráfico
  saveChartConfiguration: async (config) => {
    const { data, error } = await supabase
      .from('chart_configurations')
      .insert(config)
      .select()
      .single()
    return { data, error }
  },

  // Obter configurações de gráfico do usuário
  getUserChartConfigurations: async () => {
    const { data, error } = await supabase
      .from('chart_configurations')
      .select(`
        *,
        datasets (*)
      `)
      .order('created_at', { ascending: false })
    return { data, error }
  },

  // Salvar análise de IA
  saveAIAnalysis: async (analysis) => {
    const { data, error } = await supabase
      .from('ai_analyses')
      .insert(analysis)
      .select()
      .single()
    return { data, error }
  },

  // Obter análises de IA do usuário
  getUserAIAnalyses: async () => {
    const { data, error } = await supabase
      .from('ai_analyses')
      .select(`
        *,
        datasets (*)
      `)
      .order('created_at', { ascending: false })
    return { data, error }
  }
}

export default supabase
