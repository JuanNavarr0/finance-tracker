import { FC } from 'react'
import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import { cn } from '@utils'

interface LoadingProps {
  size?: 'sm' | 'md' | 'lg'
  text?: string
  fullScreen?: boolean
  className?: string
}

const Loading: FC<LoadingProps> = ({ 
  size = 'md', 
  text, 
  fullScreen = false,
  className 
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  }

  const content = (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className={cn("flex flex-col items-center justify-center", className)}
    >
      <Loader2 className={cn(
        "animate-spin text-primary-500",
        sizeClasses[size]
      )} />
      {text && (
        <p className={cn(
          "mt-3 text-gray-400",
          size === 'sm' && 'text-xs',
          size === 'md' && 'text-sm',
          size === 'lg' && 'text-base'
        )}>
          {text}
        </p>
      )}
    </motion.div>
  )

  if (fullScreen) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-bg">
        {content}
      </div>
    )
  }

  return content
}

export default Loading