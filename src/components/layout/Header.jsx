import React, { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { 
  Menu, 
  X, 
  Bell, 
  Settings, 
  LogOut, 
  User,
  BarChart3
} from 'lucide-react'
import Button from '../ui/Button'

const Header = ({ onMenuToggle, isSidebarOpen }) => {
  const { user, signOut } = useAuth()
  const [showUserMenu, setShowUserMenu] = useState(false)

  const handleSignOut = async () => {
    await signOut()
    setShowUserMenu(false)
  }

  const getUserInitials = (email) => {
    return email ? email.charAt(0).toUpperCase() : 'U'
  }

  return (
    <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
      {/* Left side */}
      <div className="flex items-center space-x-4">
        <button
          onClick={onMenuToggle}
          className="p-2 rounded-lg hover:bg-gray-100 lg:hidden"
        >
          {isSidebarOpen ? (
            <X className="h-5 w-5 text-gray-600" />
          ) : (
            <Menu className="h-5 w-5 text-gray-600" />
          )}
        </button>

        <div className="flex items-center space-x-2">
          <div className="h-8 w-8 bg-gradient-primary rounded-lg flex items-center justify-center">
            <BarChart3 className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Lucrax.ai</h1>
            <p className="text-xs text-gray-500">Dashboard Inteligente</p>
          </div>
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center space-x-4">
        {/* Notifications */}
        <button className="p-2 rounded-lg hover:bg-gray-100 relative">
          <Bell className="h-5 w-5 text-gray-600" />
          <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full"></span>
        </button>

        {/* User menu */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100"
          >
            <div className="h-8 w-8 bg-primary-100 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-primary-700">
                {getUserInitials(user?.email)}
              </span>
            </div>
            <div className="hidden md:block text-left">
              <p className="text-sm font-medium text-gray-900">
                {user?.user_metadata?.full_name || 'Usuário'}
              </p>
              <p className="text-xs text-gray-500">{user?.email}</p>
            </div>
          </button>

          {/* Dropdown menu */}
          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
              <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2">
                <User className="h-4 w-4" />
                <span>Perfil</span>
              </button>
              <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2">
                <Settings className="h-4 w-4" />
                <span>Configurações</span>
              </button>
              <hr className="my-1" />
              <button
                onClick={handleSignOut}
                className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
              >
                <LogOut className="h-4 w-4" />
                <span>Sair</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Overlay for mobile menu */}
      {showUserMenu && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          onClick={() => setShowUserMenu(false)}
        />
      )}
    </header>
  )
}

export default Header
