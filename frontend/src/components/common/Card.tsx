import { FC, ReactNode } from 'react'
import { motion, HTMLMotionProps } from 'framer-motion'
import { cn } from '@utils'

interface CardProps extends HTMLMotionProps<"div"> {
  children: ReactNode
  variant?: 'default' | 'gradient' | 'outline'
  hover?: boolean
  glow?: boolean
  padding?: 'none' | 'sm' | 'md' | 'lg'
  className?: string
}

const Card: FC<CardProps> = ({
  children,
  variant = 'default',
  hover = false,
  glow = false,
  padding = 'md',
  className,
  ...motionProps
}) => {
  const paddingClasses = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  }

  const variantClasses = {
    default: 'card',
    gradient: 'card bg-gradient-to-br from-primary-500/10 to-primary-600/10',
    outline: 'glass-border rounded-2xl bg-transparent',
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        variantClasses[variant],
        paddingClasses[padding],
        hover && 'card-hover cursor-pointer',
        glow && 'glow',
        className
      )}
      {...motionProps}
    >
      {children}
    </motion.div>
  )
}

export default Card