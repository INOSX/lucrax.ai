import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
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
