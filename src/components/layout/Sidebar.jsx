import React from 'react'
import { 
  BarChart3, 
  Upload, 
  FileText, 
  Settings, 
  HelpCircle,
  TrendingUp,
  PieChart,
  BarChart2,
  Scatter,
  Activity
} from 'lucide-react'

const Sidebar = ({ isOpen, onClose }) => {
  const menuItems = [
    {
      icon: BarChart3,
      label: 'Dashboard',
      href: '/',
      active: true
    },
    {
      icon: Upload,
      label: 'Upload de Dados',
      href: '/upload'
    },
    {
      icon: FileText,
      label: 'Meus Datasets',
      href: '/datasets'
    },
    {
      icon: TrendingUp,
      label: 'Análises',
      href: '/analyses'
    }
  ]

  const chartTypes = [
    {
      icon: BarChart2,
      label: 'Gráfico de Barras',
      type: 'bar'
    },
    {
      icon: TrendingUp,
      label: 'Gráfico de Linha',
      type: 'line'
    },
    {
      icon: PieChart,
      label: 'Gráfico de Pizza',
      type: 'pie'
    },
    {
      icon: Scatter,
      label: 'Gráfico de Dispersão',
      type: 'scatter'
    },
    {
      icon: Activity,
      label: 'Gráfico de Área',
      type: 'area'
    }
  ]

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:inset-0
      `}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                <BarChart3 className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Lucrax.ai</h2>
                <p className="text-xs text-gray-500">Dashboard</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            <div className="space-y-1">
              {menuItems.map((item) => {
                const Icon = item.icon
                return (
                  <a
                    key={item.label}
                    href={item.href}
                    className={`
                      flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                      ${item.active 
                        ? 'bg-primary-50 text-primary-700 border border-primary-200' 
                        : 'text-gray-700 hover:bg-gray-100'
                      }
                    `}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{item.label}</span>
                  </a>
                )
              })}
            </div>

            {/* Chart Types Section */}
            <div className="mt-8">
              <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Tipos de Gráficos
              </h3>
              <div className="space-y-1">
                {chartTypes.map((chart) => {
                  const Icon = chart.icon
                  return (
                    <button
                      key={chart.type}
                      className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      <Icon className="h-4 w-4" />
                      <span>{chart.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          </nav>

          {/* Bottom section */}
          <div className="p-4 border-t border-gray-200 space-y-2">
            <a
              href="/settings"
              className="flex items-center space-x-3 px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <Settings className="h-5 w-5" />
              <span>Configurações</span>
            </a>
            <a
              href="/help"
              className="flex items-center space-x-3 px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <HelpCircle className="h-5 w-5" />
              <span>Ajuda</span>
            </a>
          </div>
        </div>
      </div>
    </>
  )
}

export default Sidebar
