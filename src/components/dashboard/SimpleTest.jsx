import React, { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../services/supabase'
import Card from '../ui/Card'
import Button from '../ui/Button'
import { Database, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'

const SimpleTest = () => {
  const { user } = useAuth()
  const [testResults, setTestResults] = useState({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const runTests = async () => {
    setLoading(true)
    setError(null)
    const results = {}

    try {
      // Teste 1: Consulta simples à tabela profiles
      console.log('Teste 1: Consultando profiles...')
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .limit(5)

      results.profiles = {
        success: !profilesError,
        data: profilesData,
        error: profilesError?.message
      }

      // Teste 2: Consulta específica do usuário
      if (user?.id) {
        console.log('Teste 2: Consultando perfil do usuário...')
        const { data: userProfile, error: userProfileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        results.userProfile = {
          success: !userProfileError,
          data: userProfile,
          error: userProfileError?.message
        }
      }

      // Teste 3: Consulta à tabela clients
      console.log('Teste 3: Consultando clients...')
      const { data: clientsData, error: clientsError } = await supabase
        .from('clients')
        .select('*')
        .limit(5)

      results.clients = {
        success: !clientsError,
        data: clientsData,
        error: clientsError?.message
      }

      // Teste 4: Consulta específica do cliente do usuário
      if (user?.id) {
        console.log('Teste 4: Consultando cliente do usuário...')
        const { data: userClient, error: userClientError } = await supabase
          .from('clients')
          .select('*')
          .eq('user_id', user.id)
          .single()

        results.userClient = {
          success: !userClientError,
          data: userClient,
          error: userClientError?.message
        }
      }

      setTestResults(results)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user) {
      runTests()
    }
  }, [user])

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
          <span className="ml-2">Executando testes...</span>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Teste Simples de Conexão
        </h2>
        
        {error && (
          <div className="flex items-center space-x-2 text-red-600 mb-4">
            <AlertCircle className="h-5 w-5" />
            <span>Erro: {error}</span>
          </div>
        )}

        <div className="space-y-4">
          {Object.entries(testResults).map(([testName, result]) => (
            <div key={testName} className="p-4 border rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                {result.success ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-600" />
                )}
                <h3 className="font-medium capitalize">
                  {testName.replace(/([A-Z])/g, ' $1').trim()}
                </h3>
              </div>
              
              {result.success ? (
                <div className="text-sm text-gray-600">
                  <p>✅ Sucesso</p>
                  {result.data && (
                    <p>Dados: {JSON.stringify(result.data, null, 2)}</p>
                  )}
                </div>
              ) : (
                <div className="text-sm text-red-600">
                  <p>❌ Erro: {result.error}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-6">
          <Button onClick={runTests}>
            Executar Testes Novamente
          </Button>
        </div>
      </Card>
    </div>
  )
}

export default SimpleTest
