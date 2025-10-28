import React from 'react'

const Card = ({ 
  children, 
  className = '', 
  hover = false,
  padding = 'default',
  ...props 
}) => {
  const paddingClasses = {
    none: '',
    sm: 'p-4',
    default: 'p-6',
    lg: 'p-8'
  }

  const baseClasses = 'bg-white rounded-xl shadow-card border border-gray-100'
  const hoverClasses = hover ? 'hover:shadow-card-hover transition-shadow duration-200' : ''
  
  const classes = `${baseClasses} ${hoverClasses} ${paddingClasses[padding]} ${className}`

  return (
    <div className={classes} {...props}>
      {children}
    </div>
  )
}

export default Card
