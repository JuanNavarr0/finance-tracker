import { FC } from 'react'
import { motion } from 'framer-motion'
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  Target,
  LineChart,
  Calendar,
  AlertCircle
} from 'lucide-react'
import { useApiQuery } from '@hooks'
import { endpoints } from '@services'
import { Loading, StatCard, Card, EmptyState } from '@components/common'
import { formatCurrency, formatPercentage, cn } from '@utils'
import { DashboardData } from '@types'

const Dashboard: FC = () => {
  const { data, isLoading, error } = useApiQuery<DashboardData>(
    'dashboard',
    endpoints.dashboard
  )

  if (isLoading) {
    return <Loading fullScreen text="Cargando dashboard..." />
  }

  if (error || !data) {
    return (
      <EmptyState
        title="Error al cargar el dashboard"
        description="No se pudieron cargar los datos. Por favor, intenta de nuevo."
        action={{
          label: 'Reintentar',
          onClick: () => window.location.reload()
        }}
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Dashboard</h1>
        <p className="text-gray-400 mt-1">
          Resumen de tu situación financiera
        </p>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Balance Total"
          value={data.financial_summary.net_balance}
          icon={Wallet}
          format="currency"
          color="primary"
          trend={{
            value: data.financial_summary.savings_rate,
            isPositive: data.financial_summary.net_balance > 0
          }}
        />
        
        <StatCard
          title="Ingresos Totales"
          value={data.financial_summary.total_income}
          icon={TrendingUp}
          format="currency"
          color="green"
        />
        
        <StatCard
          title="Gastos Totales"
          value={data.financial_summary.total_expenses}
          icon={TrendingDown}
          format="currency"
          color="red"
        />
        
        <StatCard
          title="Tasa de Ahorro"
          value={data.financial_summary.savings_rate}
          icon={Target}
          format="percentage"
          color="yellow"
        />
      </div>

      {/* Monthly overview */}
      <Card>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Resumen de {data.monthly_overview.month} {data.monthly_overview.year}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <p className="text-sm text-gray-400 mb-1">Ingresos del mes</p>
            <p className="text-2xl font-bold text-green-500">
              {formatCurrency(data.monthly_overview.income)}
            </p>
          </div>
          
          <div>
            <p className="text-sm text-gray-400 mb-1">Gastos del mes</p>
            <p className="text-2xl font-bold text-red-500">
              {formatCurrency(data.monthly_overview.expenses)}
            </p>
          </div>
          
          <div>
            <p className="text-sm text-gray-400 mb-1">Balance del mes</p>
            <p className={cn(
              "text-2xl font-bold",
              data.monthly_overview.balance >= 0 ? "text-green-500" : "text-red-500"
            )}>
              {formatCurrency(data.monthly_overview.balance)}
            </p>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-dark-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Gasto diario promedio</p>
              <p className="text-lg font-semibold text-white">
                {formatCurrency(data.average_daily_expense)}
              </p>
            </div>
            
            <div className="text-right">
              <p className="text-sm text-gray-400">Balance proyectado fin de mes</p>
              <p className={cn(
                "text-lg font-semibold",
                data.projected_month_end_balance >= 0 ? "text-green-500" : "text-red-500"
              )}>
                {formatCurrency(data.projected_month_end_balance)}
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Alerts */}
      {data.alerts.length > 0 && (
        <Card>
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            Alertas y Notificaciones
          </h2>
          
          <div className="space-y-3">
            {data.alerts.map((alert, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={cn(
                  "p-4 rounded-lg border",
                  alert.type === 'success' && "bg-green-500/10 border-green-500/20 text-green-400",
                  alert.type === 'info' && "bg-blue-500/10 border-blue-500/20 text-blue-400",
                  alert.type === 'warning' && "bg-yellow-500/10 border-yellow-500/20 text-yellow-400",
                  alert.type === 'danger' && "bg-red-500/10 border-red-500/20 text-red-400"
                )}
              >
                <p className="font-medium">{alert.title}</p>
                <p className="text-sm mt-1 opacity-90">{alert.message}</p>
              </motion.div>
            ))}
          </div>
        </Card>
      )}

      {/* Goals and Investments Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Goals */}
        <Card>
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <Target className="w-5 h-5" />
            Objetivos de Ahorro
          </h2>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Objetivos activos</span>
              <span className="text-white font-medium">{data.goals_summary.active_goals}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Total ahorrado</span>
              <span className="text-white font-medium">
                {formatCurrency(data.goals_summary.total_saved_amount)}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Meta total</span>
              <span className="text-white font-medium">
                {formatCurrency(data.goals_summary.total_target_amount)}
              </span>
            </div>
            
            <div className="mt-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-400">Progreso general</span>
                <span className="text-sm text-white">
                  {formatPercentage(data.goals_summary.overall_progress)}
                </span>
              </div>
              <div className="w-full bg-gray-800 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-primary-500 to-primary-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(data.goals_summary.overall_progress, 100)}%` }}
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Investments */}
        <Card>
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <LineChart className="w-5 h-5" />
            Portfolio de Inversiones
          </h2>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Valor actual</span>
              <span className="text-white font-medium">
                {formatCurrency(data.investments_summary.current_value)}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Total invertido</span>
              <span className="text-white font-medium">
                {formatCurrency(data.investments_summary.total_invested)}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Retorno total</span>
              <span className={cn(
                "font-medium",
                data.investments_summary.total_return >= 0 ? "text-green-500" : "text-red-500"
              )}>
                {formatCurrency(data.investments_summary.total_return)}
                {' '}
                ({formatPercentage(data.investments_summary.return_percentage)})
              </span>
            </div>
            
            {data.investments_summary.best_performer && (
              <div className="pt-4 border-t border-dark-border">
                <p className="text-xs text-gray-400 mb-1">Mejor rendimiento</p>
                <p className="text-sm text-green-500">
                  {data.investments_summary.best_performer.symbol} 
                  {' '}
                  (+{formatPercentage(data.investments_summary.best_performer.profit_loss_percentage)})
                </p>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card>
        <h2 className="text-xl font-semibold text-white mb-4">
          Transacciones Recientes
        </h2>
        
        {data.recent_transactions.length > 0 ? (
          <div className="space-y-3">
            {data.recent_transactions.map((transaction, index) => (
              <motion.div
                key={`${transaction.type}-${transaction.id}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-dark-hover transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center",
                    transaction.type === 'income' 
                      ? "bg-green-500/20 text-green-500" 
                      : "bg-red-500/20 text-red-500"
                  )}>
                    {transaction.type === 'income' ? (
                      <TrendingUp className="w-5 h-5" />
                    ) : (
                      <TrendingDown className="w-5 h-5" />
                    )}
                  </div>
                  
                  <div>
                    <p className="text-white font-medium">{transaction.description}</p>
                    <p className="text-xs text-gray-400">{transaction.category}</p>
                  </div>
                </div>
                
                <div className="text-right">
                  <p className={cn(
                    "font-semibold",
                    transaction.type === 'income' ? "text-green-500" : "text-red-500"
                  )}>
                    {transaction.type === 'income' ? '+' : '-'}
                    {formatCurrency(transaction.amount)}
                  </p>
                  <p className="text-xs text-gray-400">
                    {new Date(transaction.date).toLocaleDateString('es-ES')}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <p className="text-gray-400 text-center py-4">
            No hay transacciones recientes
          </p>
        )}
      </Card>
    </div>
  )
}

export default Dashboard