import React, { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../services/supabase'
import Card from '../ui/Card'
import Button from '../ui/Button'
import { Database, CheckCircle, AlertCircle, Loader2, Info } from 'lucide-react'

const DebugTest = () => {
  const { user } = useAuth()
  const [debugInfo, setDebugInfo] = useState({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const runDebug = async () => {
    setLoading(true)
    setError(null)
    const info = {}

    try {
      // Debug 1: Informações do usuário
      info.user = {
        id: user?.id,
        email: user?.email,
        user_metadata: user?.user_metadata,
        app_metadata: user?.app_metadata
      }

      // Debug 2: Configuração do Supabase
      info.supabaseConfig = {
        url: import.meta.env.SUPABASE_URL,
        anonKey: import.meta.env.SUPABASE_ANON_KEY ? '***' : 'MISSING'
      }

      // Debug 3: Teste de sessão
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
      info.session = {
        hasSession: !!sessionData.session,
        userId: sessionData.session?.user?.id,
        email: sessionData.session?.user?.email,
        error: sessionError?.message
      }

      // Debug 4: Teste de consulta direta (sem filtros)
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .limit(1)

      info.profilesDirect = {
        success: !profilesError,
        data: profilesData,
        error: profilesError?.message,
        status: profilesError?.status
      }

      // Debug 5: Teste de consulta com filtro específico
      if (user?.id) {
        const { data: userProfile, error: userProfileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle()

        info.userProfile = {
          success: !userProfileError,
          data: userProfile,
          error: userProfileError?.message,
          status: userProfileError?.status
        }
      }

      // Debug 6: Teste de consulta à tabela clients
      const { data: clientsData, error: clientsError } = await supabase
        .from('clients')
        .select('*')
        .limit(1)

      info.clientsDirect = {
        success: !clientsError,
        data: clientsData,
        error: clientsError?.message,
        status: clientsError?.status
      }

      // Debug 7: Teste de consulta com filtro de cliente
      if (user?.id) {
        const { data: userClient, error: userClientError } = await supabase
          .from('clients')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle()

        info.userClient = {
          success: !userClientError,
          data: userClient,
          error: userClientError?.message,
          status: userClientError?.status
        }
      }

      setDebugInfo(info)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user) {
      runDebug()
    }
  }, [user])

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
          <span className="ml-2">Executando debug...</span>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
          <Info className="h-6 w-6 mr-2 text-primary-600" />
          Debug Completo
        </h2>
        
        {error && (
          <div className="flex items-center space-x-2 text-red-600 mb-4">
            <AlertCircle className="h-5 w-5" />
            <span>Erro: {error}</span>
          </div>
        )}

        <div className="space-y-4">
          {Object.entries(debugInfo).map(([sectionName, data]) => (
            <div key={sectionName} className="p-4 border rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <Database className="h-5 w-5 text-primary-600" />
                <h3 className="font-medium capitalize">
                  {sectionName.replace(/([A-Z])/g, ' $1').trim()}
                </h3>
              </div>
              
              <div className="text-sm text-gray-600">
                <pre className="bg-gray-50 p-2 rounded text-xs overflow-x-auto">
                  {JSON.stringify(data, null, 2)}
                </pre>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6">
          <Button onClick={runDebug}>
            Executar Debug Novamente
          </Button>
        </div>
      </Card>
    </div>
  )
}

export default DebugTest
