import { FC } from 'react'
import { motion } from 'framer-motion'
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react'
import CountUp from 'react-countup'
import { cn, formatCurrency, formatPercentage } from '@utils'
import Card from './Card'

interface StatCardProps {
  title: string
  value: number
  icon: LucideIcon
  format?: 'currency' | 'percentage' | 'number'
  decimals?: number
  trend?: {
    value: number
    isPositive: boolean
  }
  subtitle?: string
  color?: 'primary' | 'green' | 'red' | 'yellow' | 'purple'
  animate?: boolean
  onClick?: () => void
}

const StatCard: FC<StatCardProps> = ({
  title,
  value,
  icon: Icon,
  format = 'number',
  decimals = 0,
  trend,
  subtitle,
  color = 'primary',
  animate = true,
  onClick
}) => {
  const colorClasses = {
    primary: 'from-primary-500/20 to-primary-600/20 text-primary-500',
    green: 'from-green-500/20 to-green-600/20 text-green-500',
    red: 'from-red-500/20 to-red-600/20 text-red-500',
    yellow: 'from-yellow-500/20 to-yellow-600/20 text-yellow-500',
    purple: 'from-purple-500/20 to-purple-600/20 text-purple-500',
  }

  const formatValue = (val: number) => {
    switch (format) {
      case 'currency':
        return formatCurrency(val)
      case 'percentage':
        return formatPercentage(val, decimals)
      default:
        return val.toLocaleString('es-ES', {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        })
    }
  }

  return (
    <Card
      hover={!!onClick}
      onClick={onClick}
      className="relative overflow-hidden"
    >
      {/* Background gradient */}
      <div className={cn(
        "absolute inset-0 bg-gradient-to-br opacity-10",
        colorClasses[color]
      )} />

      <div className="relative">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-sm text-gray-400 mb-1">{title}</p>
            {subtitle && (
              <p className="text-xs text-gray-500">{subtitle}</p>
            )}
          </div>
          <div className={cn(
            "w-10 h-10 rounded-lg bg-gradient-to-br flex items-center justify-center",
            colorClasses[color]
          )}>
            <Icon className="w-5 h-5 text-white" />
          </div>
        </div>

        {/* Value */}
        <div className="text-2xl font-bold text-white mb-2">
          {animate ? (
            <CountUp
              end={value}
              duration={1.5}
              separator="."
              decimal=","
              decimals={decimals}
              formattingFn={formatValue}
              preserveValue
            />
          ) : (
            formatValue(value)
          )}
        </div>

        {/* Trend */}
        {trend && (
          <div className="flex items-center gap-1">
            {trend.isPositive ? (
              <TrendingUp className="w-4 h-4 text-green-500" />
            ) : (
              <TrendingDown className="w-4 h-4 text-red-500" />
            )}
            <span className={cn(
              "text-sm font-medium",
              trend.isPositive ? "text-green-500" : "text-red-500"
            )}>
              {formatPercentage(Math.abs(trend.value))}
            </span>
            <span className="text-xs text-gray-500 ml-1">
              vs. mes anterior
            </span>
          </div>
        )}
      </div>
    </Card>
  )
}

export default StatCard