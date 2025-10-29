import React, { useState } from 'react'
import Card from '../ui/Card'
import { Database, User, Wrench, Bug, X } from 'lucide-react'
import ClientTest from '../dashboard/ClientTest'
import AuthTest from '../dashboard/AuthTest'
import SimpleTest from '../dashboard/SimpleTest'
import DebugTest from '../dashboard/DebugTest'

const Settings = () => {
  const [showClientTest, setShowClientTest] = useState(false)
  const [showAuthTest, setShowAuthTest] = useState(false)
  const [showSimpleTest, setShowSimpleTest] = useState(false)
  const [showDebugTest, setShowDebugTest] = useState(false)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Configurações</h1>
          <p className="text-gray-600">Ferramentas e diagnósticos da sua conta</p>
        </div>
      </div>

      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Testes e Diagnóstico</h3>
        <div className="flex flex-wrap gap-3">
          <button 
            onClick={() => setShowClientTest(true)}
            className="btn-secondary flex items-center space-x-2"
          >
            <Database className="h-4 w-4" />
            <span>Teste Cliente</span>
          </button>
          <button 
            onClick={() => setShowAuthTest(true)}
            className="btn-secondary flex items-center space-x-2"
          >
            <User className="h-4 w-4" />
            <span>Teste Auth</span>
          </button>
          <button 
            onClick={() => setShowSimpleTest(true)}
            className="btn-secondary flex items-center space-x-2"
          >
            <Wrench className="h-4 w-4" />
            <span>Teste Simples</span>
          </button>
          <button 
            onClick={() => setShowDebugTest(true)}
            className="btn-secondary flex items-center space-x-2"
          >
            <Bug className="h-4 w-4" />
            <span>Debug</span>
          </button>
        </div>
      </Card>

      {showClientTest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <Card className="relative">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Teste de Integração do Cliente</h2>
                <button
                  onClick={() => setShowClientTest(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>
              <ClientTest />
            </Card>
          </div>
        </div>
      )}

      {showAuthTest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <Card className="relative">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Teste de Autenticação</h2>
                <button
                  onClick={() => setShowAuthTest(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>
              <AuthTest />
            </Card>
          </div>
        </div>
      )}

      {showSimpleTest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <Card className="relative">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Teste Simples de Conexão</h2>
                <button
                  onClick={() => setShowSimpleTest(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>
              <SimpleTest />
            </Card>
          </div>
        </div>
      )}

      {showDebugTest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-6xl max-h-[90vh] overflow-y-auto">
            <Card className="relative">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Debug Completo</h2>
                <button
                  onClick={() => setShowDebugTest(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>
              <DebugTest />
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}

export default Settings


