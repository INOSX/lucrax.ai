import React, { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../services/supabase'
import Card from '../ui/Card'
import Button from '../ui/Button'
import { User, Database, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'

const AuthTest = () => {
  const { user } = useAuth()
  const [authInfo, setAuthInfo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (user) {
      testAuth()
    }
  }, [user])

  const testAuth = async () => {
    setLoading(true)
    setError(null)

    try {
      // Testar autenticação do Supabase
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError) {
        throw new Error(`Erro de sessão: ${sessionError.message}`)
      }

      // Testar consulta direta à tabela profiles
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profileError) {
        throw new Error(`Erro ao buscar perfil: ${profileError.message}`)
      }

      // Testar consulta à tabela clients
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .select('*')
        .eq('user_id', user.id)
        .single()

      setAuthInfo({
        session: session ? 'Ativa' : 'Inativa',
        userId: user.id,
        userEmail: user.email,
        profile: profileData,
        client: clientData,
        clientError: clientError?.message
      })

    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const testDirectQuery = async () => {
    try {
      // Testar consulta direta sem RLS
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('email', 'mariomayerlefilho@live.com')

      console.log('Consulta direta:', { data, error })
      alert(`Consulta direta: ${error ? error.message : 'Sucesso'}`)
    } catch (err) {
      console.error('Erro na consulta direta:', err)
      alert(`Erro: ${err.message}`)
    }
  }

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
          <span className="ml-2">Testando autenticação...</span>
        </div>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="p-6">
        <div className="flex items-center space-x-2 text-red-600 mb-4">
          <AlertCircle className="h-5 w-5" />
          <span>Erro: {error}</span>
        </div>
        <Button onClick={testAuth}>
          Tentar Novamente
        </Button>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Teste de Autenticação
        </h2>
        
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <User className="h-5 w-5 text-primary-600" />
            <div>
              <p className="text-sm font-medium text-gray-900">Sessão</p>
              <p className="text-sm text-gray-600">{authInfo?.session}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <Database className="h-5 w-5 text-primary-600" />
            <div>
              <p className="text-sm font-medium text-gray-900">User ID</p>
              <p className="text-sm text-gray-600 font-mono text-xs break-all">
                {authInfo?.userId}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Database className="h-5 w-5 text-primary-600" />
            <div>
              <p className="text-sm font-medium text-gray-900">Email</p>
              <p className="text-sm text-gray-600">{authInfo?.userEmail}</p>
            </div>
          </div>

          {authInfo?.profile && (
            <div className="flex items-center space-x-3">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-gray-900">Perfil</p>
                <p className="text-sm text-gray-600">
                  {authInfo.profile.full_name} (@{authInfo.profile.username})
                </p>
              </div>
            </div>
          )}

          {authInfo?.client ? (
            <div className="flex items-center space-x-3">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-gray-900">Cliente</p>
                <p className="text-sm text-gray-600">
                  {authInfo.client.name} ({authInfo.client.client_code})
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center space-x-3">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-sm font-medium text-gray-900">Cliente</p>
                <p className="text-sm text-red-600">
                  {authInfo?.clientError || 'Não encontrado'}
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 flex space-x-3">
          <Button onClick={testAuth}>
            Atualizar
          </Button>
          <Button variant="secondary" onClick={testDirectQuery}>
            Testar Consulta Direta
          </Button>
        </div>
      </Card>
    </div>
  )
}

export default AuthTest
