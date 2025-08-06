import { FC, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  LineChart, 
  Plus, 
  TrendingUp,
  TrendingDown,
  DollarSign,
  BarChart3,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Edit,
  Trash2,
  RefreshCw,
  Search,
  ShoppingCart,
  Eye,
  EyeOff
} from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import { format } from 'date-fns'
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts'
import { api, endpoints } from '@services'
import { Investment, InvestmentType, InvestmentStatus, InvestmentSale, PortfolioSummary } from '@types'
import { Card, Loading, EmptyState, Modal, StatCard } from '@components/common'
import { 
  formatCurrency, 
  formatPercentage,
  INVESTMENT_TYPE_LABELS, 
  INVESTMENT_STATUS_LABELS,
  formatDate,
  cn,
  CATEGORY_COLORS
} from '@utils'
import { rechartsTheme, chartAnimation } from '@utils/chartConfig'

// Investment Form Component
interface InvestmentFormProps {
  investment?: Investment
  onClose: () => void
  onSuccess: () => void
}

const InvestmentForm: FC<InvestmentFormProps> = ({ investment, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    symbol: investment?.symbol || '',
    name: investment?.name || '',
    investment_type: investment?.investment_type || InvestmentType.STOCK,
    quantity: investment?.quantity || '',
    purchase_price: investment?.purchase_price || '',
    purchase_date: investment ? format(new Date(investment.purchase_date), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
    purchase_fees: investment?.purchase_fees || '',
    platform: investment?.platform || '',
    notes: investment?.notes || ''
  })

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post(endpoints.investments, data),
    onSuccess: () => {
      toast.success('Inversión creada exitosamente')
      onSuccess()
      onClose()
    }
  })

  const updateMutation = useMutation({
    mutationFn: (data: any) => api.put(endpoints.investment(investment!.id), data),
    onSuccess: () => {
      toast.success('Inversión actualizada exitosamente')
      onSuccess()
      onClose()
    }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const data = {
      ...formData,
      quantity: parseFloat(formData.quantity),
      purchase_price: parseFloat(formData.purchase_price),
      purchase_fees: formData.purchase_fees ? parseFloat(formData.purchase_fees) : 0
    }
    
    if (investment) {
      updateMutation.mutate(data)
    } else {
      createMutation.mutate(data)
    }
  }

  const isLoading = createMutation.isLoading || updateMutation.isLoading

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="symbol" className="label">Símbolo/Ticker</label>
          <input
            id="symbol"
            type="text"
            required
            className="input uppercase"
            placeholder="AAPL, BTC, etc."
            value={formData.symbol}
            onChange={(e) => setFormData({ ...formData, symbol: e.target.value.toUpperCase() })}
            disabled={!!investment}
          />
        </div>

        <div>
          <label htmlFor="investment_type" className="label">Tipo de Inversión</label>
          <select
            id="investment_type"
            className="input"
            value={formData.investment_type}
            onChange={(e) => setFormData({ ...formData, investment_type: e.target.value as InvestmentType })}
            disabled={!!investment}
          >
            {Object.entries(INVESTMENT_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="name" className="label">Nombre</label>
        <input
          id="name"
          type="text"
          required
          className="input"
          placeholder="Ej: Apple Inc., Bitcoin"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label htmlFor="quantity" className="label">Cantidad</label>
          <input
            id="quantity"
            type="number"
            step="0.00000001"
            required
            className="input"
            placeholder="0"
            value={formData.quantity}
            onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
          />
        </div>

        <div>
          <label htmlFor="purchase_price" className="label">Precio de Compra</label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              id="purchase_price"
              type="number"
              step="0.01"
              required
              className="input pl-10"
              placeholder="0.00"
              value={formData.purchase_price}
              onChange={(e) => setFormData({ ...formData, purchase_price: e.target.value })}
            />
          </div>
        </div>

        <div>
          <label htmlFor="purchase_fees" className="label">Comisiones</label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              id="purchase_fees"
              type="number"
              step="0.01"
              className="input pl-10"
              placeholder="0.00"
              value={formData.purchase_fees}
              onChange={(e) => setFormData({ ...formData, purchase_fees: e.target.value })}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="purchase_date" className="label">Fecha de Compra</label>
          <input
            id="purchase_date"
            type="date"
            required
            className="input"
            value={formData.purchase_date}
            onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
          />
        </div>

        <div>
          <label htmlFor="platform" className="label">Plataforma/Broker</label>
          <input
            id="platform"
            type="text"
            className="input"
            placeholder="Ej: Interactive Brokers, Binance"
            value={formData.platform}
            onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
          />
        </div>
      </div>

      <div>
        <label htmlFor="notes" className="label">Notas (opcional)</label>
        <textarea
          id="notes"
          rows={3}
          className="input"
          placeholder="Notas sobre la inversión..."
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
        />
      </div>

      <div className="flex gap-3 justify-end pt-4">
        <button
          type="button"
          onClick={onClose}
          className="btn-secondary"
          disabled={isLoading}
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="btn-primary"
          disabled={isLoading}
        >
          {isLoading ? 'Guardando...' : investment ? 'Actualizar' : 'Crear'}
        </button>
      </div>
    </form>
  )
}

// Sale Form Component
interface SaleFormProps {
  investment: Investment
  onClose: () => void
  onSuccess: () => void
}

const SaleForm: FC<SaleFormProps> = ({ investment, onClose, onSuccess }) => {
  const availableQuantity = investment.quantity - (investment.sale_quantity || 0)
  const [formData, setFormData] = useState<InvestmentSale>({
    quantity: availableQuantity,
    sale_price: investment.current_price || investment.purchase_price,
    sale_fees: 0
  })

  const saleMutation = useMutation({
    mutationFn: (data: InvestmentSale) => api.post(endpoints.investmentSell(investment.id), data),
    onSuccess: () => {
      toast.success('Venta registrada exitosamente')
      onSuccess()
      onClose()
    }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    saleMutation.mutate(formData)
  }

  const totalSale = formData.quantity * formData.sale_price - (formData.sale_fees || 0)
  const purchaseCost = (investment.purchase_price * formData.quantity) + 
    ((investment.purchase_fees || 0) * (formData.quantity / investment.quantity))
  const profit = totalSale - purchaseCost
  const profitPercentage = (profit / purchaseCost) * 100

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-dark-hover rounded-lg p-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Inversión:</span>
          <span className="text-white font-medium">{investment.name}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Cantidad disponible:</span>
          <span className="text-white">{availableQuantity} unidades</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Precio de compra:</span>
          <span className="text-white">{formatCurrency(investment.purchase_price)}</span>
        </div>
        {investment.current_price && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Precio actual:</span>
            <span className="text-white">{formatCurrency(investment.current_price)}</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="sale-quantity" className="label">Cantidad a Vender</label>
          <input
            id="sale-quantity"
            type="number"
            step="0.00000001"
            required
            min="0.00000001"
            max={availableQuantity}
            className="input"
            value={formData.quantity}
            onChange={(e) => setFormData({ ...formData, quantity: parseFloat(e.target.value) || 0 })}
          />
        </div>

        <div>
          <label htmlFor="sale-price" className="label">Precio de Venta</label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              id="sale-price"
              type="number"
              step="0.01"
              required
              className="input pl-10"
              value={formData.sale_price}
              onChange={(e) => setFormData({ ...formData, sale_price: parseFloat(e.target.value) || 0 })}
            />
          </div>
        </div>
      </div>

      <div>
        <label htmlFor="sale-fees" className="label">Comisiones de Venta</label>
        <div className="relative">
          <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            id="sale-fees"
            type="number"
            step="0.01"
            className="input pl-10"
            placeholder="0.00"
            value={formData.sale_fees}
            onChange={(e) => setFormData({ ...formData, sale_fees: parseFloat(e.target.value) || 0 })}
          />
        </div>
      </div>

      <div className="bg-dark-hover rounded-lg p-4 space-y-2">
        <h4 className="font-medium text-white mb-2">Resumen de la Operación</h4>
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Total venta:</span>
          <span className="text-white">{formatCurrency(totalSale)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Costo de compra:</span>
          <span className="text-white">{formatCurrency(purchaseCost)}</span>
        </div>
        <div className="flex justify-between text-sm font-medium pt-2 border-t border-dark-border">
          <span className="text-gray-400">Ganancia/Pérdida:</span>
          <span className={cn(
            profit >= 0 ? "text-green-500" : "text-red-500"
          )}>
            {profit >= 0 ? '+' : ''}{formatCurrency(profit)} ({formatPercentage(profitPercentage)})
          </span>
        </div>
      </div>

      <div className="flex gap-3 justify-end pt-4">
        <button
          type="button"
          onClick={onClose}
          className="btn-secondary"
          disabled={saleMutation.isLoading}
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="btn-primary"
          disabled={saleMutation.isLoading}
        >
          {saleMutation.isLoading ? 'Procesando...' : 'Registrar Venta'}
        </button>
      </div>
    </form>
  )
}

// Investment Card Component
interface InvestmentCardProps {
  investment: Investment
  onEdit: (investment: Investment) => void
  onSell: (investment: Investment) => void
  onDelete: (id: number) => void
}

const InvestmentCard: FC<InvestmentCardProps> = ({ investment, onEdit, onSell, onDelete }) => {
  const [showDetails, setShowDetails] = useState(false)
  const hasProfit = investment.profit_loss !== null && investment.profit_loss >= 0

  return (
    <Card hover className="relative">
      {/* Status badge */}
      {investment.status !== InvestmentStatus.ACTIVE && (
        <div className="absolute top-4 right-4">
          <span className={cn(
            "text-xs px-2 py-1 rounded-full",
            investment.status === InvestmentStatus.SOLD && "bg-gray-500/20 text-gray-400",
            investment.status === InvestmentStatus.PARTIAL_SOLD && "bg-yellow-500/20 text-yellow-500"
          )}>
            {INVESTMENT_STATUS_LABELS[investment.status]}
          </span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-12 h-12 rounded-xl flex items-center justify-center",
            hasProfit ? "bg-green-500/20" : "bg-red-500/20"
          )}>
            {hasProfit ? (
              <TrendingUp className="w-6 h-6 text-green-500" />
            ) : (
              <TrendingDown className="w-6 h-6 text-red-500" />
            )}
          </div>
          <div>
            <h3 className="font-semibold text-white flex items-center gap-2">
              {investment.symbol}
              {investment.real_time_price && (
                <Activity className="w-4 h-4 text-green-500" />
              )}
            </h3>
            <p className="text-sm text-gray-400">{investment.name}</p>
          </div>
        </div>
      </div>

      {/* Current Value */}
      <div className="mb-4">
        <p className="text-2xl font-bold text-white">
          {formatCurrency(investment.current_value || 0)}
        </p>
        {investment.profit_loss !== null && (
          <div className="flex items-center gap-2 mt-1">
            {hasProfit ? (
              <ArrowUpRight className="w-4 h-4 text-green-500" />
            ) : (
              <ArrowDownRight className="w-4 h-4 text-red-500" />
            )}
            <span className={cn(
              "text-sm font-medium",
              hasProfit ? "text-green-500" : "text-red-500"
            )}>
              {hasProfit ? '+' : ''}{formatCurrency(investment.profit_loss)}
              {' '}
              ({formatPercentage(investment.profit_loss_percentage || 0)})
            </span>
          </div>
        )}
      </div>

      {/* Details */}
      <div className="space-y-2 mb-4">
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Cantidad:</span>
          <span className="text-white">{investment.quantity}</span>
        </div>
        {showDetails && (
          <>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Precio compra:</span>
              <span className="text-white">{formatCurrency(investment.purchase_price)}</span>
            </div>
            {investment.current_price && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Precio actual:</span>
                <span className="text-white">{formatCurrency(investment.current_price)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Total invertido:</span>
              <span className="text-white">{formatCurrency(investment.total_invested || 0)}</span>
            </div>
            {investment.platform && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Plataforma:</span>
                <span className="text-white">{investment.platform}</span>
              </div>
            )}
          </>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-sm text-primary-500 hover:text-primary-400 flex items-center gap-1"
        >
          {showDetails ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          {showDetails ? 'Ocultar' : 'Ver detalles'}
        </button>

        <div className="flex gap-1">
          {investment.status === InvestmentStatus.ACTIVE && (
            <button
              onClick={() => onSell(investment)}
              className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-dark-hover transition-colors"
              title="Vender"
            >
              <ShoppingCart className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => onEdit(investment)}
            className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-dark-hover transition-colors"
            title="Editar"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(investment.id)}
            className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-500/10 transition-colors"
            title="Eliminar"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </Card>
  )
}

// Portfolio Distribution Chart
interface PortfolioChartProps {
  data: any[]
}

const PortfolioChart: FC<PortfolioChartProps> = ({ data }) => {
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-dark-card border border-dark-border rounded-lg p-3">
          <p className="text-white font-medium">{payload[0].name}</p>
          <p className="text-sm text-gray-400">
            {formatCurrency(payload[0].value)} ({payload[0].payload.percentage}%)
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={100}
          paddingAngle={2}
          dataKey="value"
          animationBegin={0}
          animationDuration={chartAnimation.duration}
        >
          {data.map((entry, index) => (
            <Cell 
              key={`cell-${index}`} 
              fill={rechartsTheme.colors[index % rechartsTheme.colors.length]} 
            />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
      </PieChart>
    </ResponsiveContainer>
  )
}

// Main Investments Page
const Investments: FC = () => {
  const queryClient = useQueryClient()
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [selectedInvestment, setSelectedInvestment] = useState<Investment | undefined>()
  const [saleModal, setSaleModal] = useState<Investment | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<InvestmentType | ''>('')
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Fetch investments
  const { data: investments, isLoading, refetch } = useQuery({
    queryKey: ['investments', typeFilter],
    queryFn: async () => {
      const params: any = { update_prices: true }
      if (typeFilter) params.investment_type = typeFilter
      
      const { data } = await api.get<Investment[]>(endpoints.investments, { params })
      return data
    },
    refetchInterval: 5 * 60 * 1000 // Refresh every 5 minutes
  })

  // Fetch portfolio summary
  const { data: portfolio } = useQuery({
    queryKey: ['portfolio-summary'],
    queryFn: async () => {
      const { data } = await api.get<PortfolioSummary>(endpoints.portfolioSummary)
      return data
    }
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(endpoints.investment(id)),
    onSuccess: () => {
      toast.success('Inversión eliminada exitosamente')
      queryClient.invalidateQueries(['investments'])
      queryClient.invalidateQueries(['portfolio-summary'])
    }
  })

  const handleEdit = (investment: Investment) => {
    setSelectedInvestment(investment)
    setIsFormOpen(true)
  }

  const handleDelete = (id: number) => {
    if (confirm('¿Estás seguro de eliminar esta inversión?')) {
      deleteMutation.mutate(id)
    }
  }

  const handleSell = (investment: Investment) => {
    setSaleModal(investment)
  }

  const handleFormClose = () => {
    setIsFormOpen(false)
    setSelectedInvestment(undefined)
  }

  const handleFormSuccess = () => {
    queryClient.invalidateQueries(['investments'])
    queryClient.invalidateQueries(['portfolio-summary'])
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await refetch()
    setIsRefreshing(false)
    toast.success('Precios actualizados')
  }

  // Filter investments
  const filteredInvestments = investments?.filter(investment => {
    const matchesSearch = investment.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         investment.name.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch
  })

  // Prepare chart data
  const chartData = portfolio?.investments_by_type 
    ? Object.entries(portfolio.investments_by_type).map(([type, data]) => ({
        name: INVESTMENT_TYPE_LABELS[type],
        value: data.value,
        percentage: data.percentage
      }))
    : []

  if (isLoading) {
    return <Loading fullScreen text="Cargando inversiones..." />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Inversiones</h1>
          <p className="text-gray-400 mt-1">
            Gestiona tu portfolio de inversiones
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleRefresh}
            className={cn(
              "btn-secondary",
              isRefreshing && "animate-spin"
            )}
            disabled={isRefreshing}
          >
            <RefreshCw className="w-5 h-5" />
          </button>
          <button
            onClick={() => setIsFormOpen(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Nueva Inversión
          </button>
        </div>
      </div>

      {/* Portfolio Summary */}
      {portfolio && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Valor del Portfolio"
            value={portfolio.current_value}
            icon={LineChart}
            format="currency"
            color="primary"
          />
          <StatCard
            title="Total Invertido"
            value={portfolio.total_invested}
            icon={DollarSign}
            format="currency"
            color="yellow"
          />
          <StatCard
            title="Retorno Total"
            value={portfolio.total_return}
            icon={portfolio.total_return >= 0 ? TrendingUp : TrendingDown}
            format="currency"
            color={portfolio.total_return >= 0 ? "green" : "red"}
          />
          <StatCard
            title="Rendimiento"
            value={portfolio.return_percentage}
            icon={BarChart3}
            format="percentage"
            decimals={2}
            color={portfolio.return_percentage >= 0 ? "green" : "red"}
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Filters */}
          <Card padding="sm">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar por símbolo o nombre..."
                  className="input pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <select
                className="input"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as InvestmentType | '')}
              >
                <option value="">Todos los tipos</option>
                {Object.entries(INVESTMENT_TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
          </Card>

          {/* Investments Grid */}
          {filteredInvestments && filteredInvestments.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <AnimatePresence>
                {filteredInvestments.map((investment, index) => (
                  <motion.div
                    key={investment.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <InvestmentCard
                      investment={investment}
                      onEdit={handleEdit}
                      onSell={handleSell}
                      onDelete={handleDelete}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <Card>
              <EmptyState
                icon={LineChart}
                title="No hay inversiones registradas"
                description="Comienza agregando tu primera inversión"
                action={{
                  label: 'Agregar Inversión',
                  onClick: () => setIsFormOpen(true),
                  icon: Plus
                }}
              />
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Portfolio Distribution */}
          {chartData.length > 0 && (
            <Card>
              <h3 className="text-lg font-semibold text-white mb-4">
                Distribución del Portfolio
              </h3>
              <PortfolioChart data={chartData} />
              <div className="mt-4 space-y-2">
                {chartData.map((item, index) => (
                  <div key={item.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: rechartsTheme.colors[index % rechartsTheme.colors.length] }}
                      />
                      <span className="text-sm text-gray-300">{item.name}</span>
                    </div>
                    <span className="text-sm text-white">{item.percentage}%</span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Top Performers */}
          {portfolio && portfolio.top_performers.length > 0 && (
            <Card>
              <h3 className="text-lg font-semibold text-white mb-4">
                Mejores Rendimientos
              </h3>
              <div className="space-y-3">
                {portfolio.top_performers.map((inv) => (
                  <div key={inv.id} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-white">{inv.symbol}</p>
                      <p className="text-xs text-gray-400">{inv.name}</p>
                    </div>
                    <p className="text-sm font-medium text-green-500">
                      +{formatPercentage(inv.profit_loss_percentage)}
                    </p>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Investment Form Modal */}
      <Modal
        isOpen={isFormOpen}
        onClose={handleFormClose}
        title={selectedInvestment ? 'Editar Inversión' : 'Nueva Inversión'}
        size="lg"
      >
        <InvestmentForm
          investment={selectedInvestment}
          onClose={handleFormClose}
          onSuccess={handleFormSuccess}
        />
      </Modal>

      {/* Sale Modal */}
      {saleModal && (
        <Modal
          isOpen={true}
          onClose={() => setSaleModal(null)}
          title="Registrar Venta"
          size="lg"
        >
          <SaleForm
            investment={saleModal}
            onClose={() => setSaleModal(null)}
            onSuccess={handleFormSuccess}
          />
        </Modal>
      )}
    </div>
  )
}

export default Investments