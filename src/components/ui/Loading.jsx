import React from 'react'
import { Loader2 } from 'lucide-react'

const Loading = ({ 
  size = 'md', 
  text = 'Carregando...', 
  className = '',
  showText = true 
}) => {
  const sizes = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
    xl: 'h-12 w-12'
  }

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className="flex flex-col items-center space-y-2">
        <Loader2 className={`animate-spin text-primary-600 ${sizes[size]}`} />
        {showText && text && (
          <p className="text-sm text-gray-600">{text}</p>
        )}
      </div>
    </div>
  )
}

export default Loading
