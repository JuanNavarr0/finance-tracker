import { FC, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Target, 
  Plus, 
  Edit,
  Trash2,
  TrendingUp,
  Calendar,
  DollarSign,
  Clock,
  CheckCircle,
  AlertCircle,
  Pause,
  Play,
  Flag,
  Home,
  Car,
  Plane,
  ShoppingBag,
  Heart,
  Briefcase,
  GraduationCap,
  Smartphone,
  Gift,
  Star,
  Trophy,
  PiggyBank,
  Wallet,
  CreditCard,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import { format, differenceInDays, addMonths } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
  RadialBarChart,
  RadialBar,
  PolarAngleAxis
} from 'recharts'
import { api, endpoints } from '@services'
import { Goal, GoalStatus, GoalPriority, GoalCreate, GoalContribution } from '@types'
import { Card, Loading, EmptyState, Modal, StatCard } from '@components/common'
import { 
  formatCurrency, 
  formatPercentage,
  GOAL_STATUS_LABELS,
  GOAL_PRIORITY_LABELS,
  PRIORITY_COLORS,
  STATUS_COLORS,
  cn 
} from '@utils'

// Iconos predefinidos para objetivos
const GOAL_ICONS = [
  { value: 'home', label: 'Casa', icon: Home },
  { value: 'car', label: 'Coche', icon: Car },
  { value: 'plane', label: 'Viaje', icon: Plane },
  { value: 'shopping', label: 'Compras', icon: ShoppingBag },
  { value: 'heart', label: 'Salud', icon: Heart },
  { value: 'briefcase', label: 'Negocio', icon: Briefcase },
  { value: 'graduation', label: 'Educación', icon: GraduationCap },
  { value: 'smartphone', label: 'Tecnología', icon: Smartphone },
  { value: 'gift', label: 'Regalo', icon: Gift },
  { value: 'star', label: 'Especial', icon: Star },
  { value: 'trophy', label: 'Logro', icon: Trophy },
  { value: 'piggy', label: 'Ahorro', icon: PiggyBank },
  { value: 'wallet', label: 'Dinero', icon: Wallet },
  { value: 'target', label: 'Objetivo', icon: Target },
]

// Colores predefinidos
const GOAL_COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444', 
  '#8b5cf6', '#ec4899', '#06b6d4', '#6366f1',
  '#14b8a6', '#f97316', '#a855f7', '#84cc16'
]

// Templates de objetivos comunes
const GOAL_TEMPLATES = [
  { name: 'Casa nueva', amount: 50000, months: 60, icon: 'home', priority: GoalPriority.HIGH },
  { name: 'Coche', amount: 20000, months: 36, icon: 'car', priority: GoalPriority.MEDIUM },
  { name: 'Viaje a Japón', amount: 3000, months: 12, icon: 'plane', priority: GoalPriority.LOW },
  { name: 'Fondo de emergencia', amount: 10000, months: 24, icon: 'piggy', priority: GoalPriority.CRITICAL },
  { name: 'MacBook Pro', amount: 2500, months: 6, icon: 'smartphone', priority: GoalPriority.MEDIUM },
  { name: 'Boda', amount: 15000, months: 18, icon: 'heart', priority: GoalPriority.HIGH },
  { name: 'Maestría', amount: 8000, months: 12, icon: 'graduation', priority: GoalPriority.HIGH },
  { name: 'Negocio propio', amount: 25000, months: 48, icon: 'briefcase', priority: GoalPriority.CRITICAL },
]

// Componente de formulario de objetivo
interface GoalFormProps {
  goal?: Goal
  onClose: () => void
  onSuccess: () => void
}

const GoalForm: FC<GoalFormProps> = ({ goal, onClose, onSuccess }) => {
  const [selectedTemplate, setSelectedTemplate] = useState<typeof GOAL_TEMPLATES[0] | null>(null)
  const [formData, setFormData] = useState({
    name: goal?.name || '',
    description: goal?.description || '',
    target_amount: goal?.target_amount || '',
    target_date: goal ? format(new Date(goal.target_date), 'yyyy-MM-dd') : '',
    priority: goal?.priority || GoalPriority.MEDIUM,
    icon: goal?.icon || 'target',
    color: goal?.color || GOAL_COLORS[0],
    monthly_contribution: goal?.monthly_contribution || ''
  })

  const createMutation = useMutation({
    mutationFn: (data: GoalCreate) => api.post(endpoints.goals, data),
    onSuccess: () => {
      toast.success('Objetivo creado exitosamente')
      onSuccess()
      onClose()
    }
  })

  const updateMutation = useMutation({
    mutationFn: (data: any) => api.put(endpoints.goal(goal!.id), data),
    onSuccess: () => {
      toast.success('Objetivo actualizado exitosamente')
      onSuccess()
      onClose()
    }
  })

  const handleTemplateSelect = (template: typeof GOAL_TEMPLATES[0]) => {
    setSelectedTemplate(template)
    const targetDate = addMonths(new Date(), template.months)
    setFormData({
      ...formData,
      name: template.name,
      target_amount: template.amount.toString(),
      target_date: format(targetDate, 'yyyy-MM-dd'),
      priority: template.priority,
      icon: template.icon,
      monthly_contribution: Math.round(template.amount / template.months).toString()
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const data: GoalCreate = {
      ...formData,
      target_amount: parseFloat(formData.target_amount),
      monthly_contribution: formData.monthly_contribution ? parseFloat(formData.monthly_contribution) : undefined
    }
    
    if (goal) {
      updateMutation.mutate(data)
    } else {
      createMutation.mutate(data)
    }
  }

  const isLoading = createMutation.isLoading || updateMutation.isLoading

  // Calcular contribución mensual sugerida
  const calculateMonthlySuggestion = () => {
    if (formData.target_amount && formData.target_date) {
      const amount = parseFloat(formData.target_amount)
      const months = differenceInDays(new Date(formData.target_date), new Date()) / 30
      if (months > 0) {
        const suggested = Math.round(amount / months)
        setFormData({ ...formData, monthly_contribution: suggested.toString() })
      }
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Templates rápidos */}
      {!goal && (
        <div>
          <label className="label mb-3">Plantillas rápidas</label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {GOAL_TEMPLATES.slice(0, 8).map((template) => {
              const Icon = GOAL_ICONS.find(i => i.value === template.icon)?.icon || Target
              return (
                <button
                  key={template.name}
                  type="button"
                  onClick={() => handleTemplateSelect(template)}
                  className={cn(
                    "p-3 rounded-lg border transition-all text-left",
                    selectedTemplate?.name === template.name
                      ? "border-primary-500 bg-primary-500/10"
                      : "border-dark-border hover:border-gray-600"
                  )}
                >
                  <Icon className="w-5 h-5 text-primary-500 mb-1" />
                  <p className="text-sm font-medium text-white">{template.name}</p>
                  <p className="text-xs text-gray-400">{formatCurrency(template.amount)}</p>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Información básica */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="name" className="label">Nombre del objetivo</label>
          <input
            id="name"
            type="text"
            required
            className="input"
            placeholder="Ej: Viaje a Europa"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
        </div>

        <div>
          <label htmlFor="target_amount" className="label">Monto objetivo</label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              id="target_amount"
              type="number"
              step="0.01"
              required
              className="input pl-10"
              placeholder="0.00"
              value={formData.target_amount}
              onChange={(e) => setFormData({ ...formData, target_amount: e.target.value })}
              onBlur={calculateMonthlySuggestion}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="target_date" className="label">Fecha objetivo</label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              id="target_date"
              type="date"
              required
              className="input pl-10"
              min={format(new Date(), 'yyyy-MM-dd')}
              value={formData.target_date}
              onChange={(e) => setFormData({ ...formData, target_date: e.target.value })}
              onBlur={calculateMonthlySuggestion}
            />
          </div>
        </div>

        <div>
          <label htmlFor="monthly_contribution" className="label">
            Contribución mensual
            {formData.monthly_contribution && (
              <span className="text-xs text-gray-400 ml-2">
                (Sugerido: {formatCurrency(parseFloat(formData.monthly_contribution))})
              </span>
            )}
          </label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              id="monthly_contribution"
              type="number"
              step="0.01"
              className="input pl-10"
              placeholder="0.00"
              value={formData.monthly_contribution}
              onChange={(e) => setFormData({ ...formData, monthly_contribution: e.target.value })}
            />
          </div>
        </div>
      </div>

      <div>
        <label htmlFor="priority" className="label">Prioridad</label>
        <select
          id="priority"
          className="input"
          value={formData.priority}
          onChange={(e) => setFormData({ ...formData, priority: e.target.value as GoalPriority })}
        >
          {Object.entries(GOAL_PRIORITY_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>

      {/* Selección de icono y color */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="label mb-2">Icono</label>
          <div className="grid grid-cols-7 gap-2">
            {GOAL_ICONS.map(({ value, icon: Icon }) => (
              <button
                key={value}
                type="button"
                onClick={() => setFormData({ ...formData, icon: value })}
                className={cn(
                  "p-3 rounded-lg border transition-all",
                  formData.icon === value
                    ? "border-primary-500 bg-primary-500/20"
                    : "border-dark-border hover:border-gray-600"
                )}
              >
                <Icon className="w-5 h-5 mx-auto text-white" />
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="label mb-2">Color</label>
          <div className="grid grid-cols-6 gap-2">
            {GOAL_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => setFormData({ ...formData, color })}
                className={cn(
                  "h-10 rounded-lg border-2 transition-all",
                  formData.color === color
                    ? "border-white scale-110"
                    : "border-transparent hover:scale-105"
                )}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </div>
      </div>

      <div>
        <label htmlFor="description" className="label">Descripción (opcional)</label>
        <textarea
          id="description"
          rows={3}
          className="input"
          placeholder="Detalles adicionales sobre tu objetivo..."
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        />
      </div>

      {/* Vista previa del cálculo */}
      {formData.target_amount && formData.target_date && (
        <div className="bg-dark-hover rounded-lg p-4 space-y-2">
          <h4 className="font-medium text-white mb-3">Resumen del objetivo</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-400">Días restantes</p>
              <p className="text-white font-medium">
                {differenceInDays(new Date(formData.target_date), new Date())} días
              </p>
            </div>
            <div>
              <p className="text-gray-400">Meses restantes</p>
              <p className="text-white font-medium">
                {Math.round(differenceInDays(new Date(formData.target_date), new Date()) / 30)} meses
              </p>
            </div>
            <div>
              <p className="text-gray-400">Ahorro diario necesario</p>
              <p className="text-white font-medium">
                {formatCurrency(
                  parseFloat(formData.target_amount) / 
                  differenceInDays(new Date(formData.target_date), new Date())
                )}
              </p>
            </div>
            <div>
              <p className="text-gray-400">Ahorro mensual necesario</p>
              <p className="text-white font-medium">
                {formatCurrency(
                  parseFloat(formData.target_amount) / 
                  (differenceInDays(new Date(formData.target_date), new Date()) / 30)
                )}
              </p>
            </div>
          </div>
        </div>
      )}

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
          {isLoading ? 'Guardando...' : goal ? 'Actualizar' : 'Crear Objetivo'}
        </button>
      </div>
    </form>
  )
}

// Componente de contribución
interface ContributionFormProps {
  goal: Goal
  onClose: () => void
  onSuccess: () => void
}

const ContributionForm: FC<ContributionFormProps> = ({ goal, onClose, onSuccess }) => {
  const [amount, setAmount] = useState(goal.monthly_contribution?.toString() || '')
  const [quickAmounts] = useState([50, 100, 200, 500, 1000])

  const contributeMutation = useMutation({
    mutationFn: (data: GoalContribution) => 
      api.post(endpoints.goalContribute(goal.id), data),
    onSuccess: () => {
      toast.success('¡Contribución añadida exitosamente!')
      onSuccess()
      onClose()
    }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    contributeMutation.mutate({ amount: parseFloat(amount) })
  }

  const remainingAmount = goal.target_amount - goal.current_amount
  const contributionPercentage = parseFloat(amount) / goal.target_amount * 100

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-dark-hover rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-gray-400">Objetivo</span>
          <span className="text-white font-medium">{goal.name}</span>
        </div>
        <div className="flex items-center justify-between mb-3">
          <span className="text-gray-400">Progreso actual</span>
          <span className="text-white">{formatCurrency(goal.current_amount)} / {formatCurrency(goal.target_amount)}</span>
        </div>
        <div className="w-full bg-gray-800 rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-primary-500 to-primary-600 h-2 rounded-full transition-all duration-500"
            style={{ width: `${Math.min(goal.progress_percentage, 100)}%` }}
          />
        </div>
        <p className="text-xs text-gray-400 mt-2">
          Faltan {formatCurrency(remainingAmount)} para alcanzar tu objetivo
        </p>
      </div>

      <div>
        <label htmlFor="contribution-amount" className="label">Monto a contribuir</label>
        <div className="relative">
          <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            id="contribution-amount"
            type="number"
            step="0.01"
            required
            min="0.01"
            max={remainingAmount}
            className="input pl-10"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>
      </div>

      {/* Montos rápidos */}
      <div className="flex flex-wrap gap-2">
        {quickAmounts.map((quickAmount) => (
          <button
            key={quickAmount}
            type="button"
            onClick={() => setAmount(quickAmount.toString())}
            className={cn(
              "px-4 py-2 rounded-lg border transition-all",
              amount === quickAmount.toString()
                ? "border-primary-500 bg-primary-500/20 text-primary-400"
                : "border-dark-border text-gray-400 hover:border-gray-600"
            )}
          >
            {formatCurrency(quickAmount)}
          </button>
        ))}
      </div>

      {amount && parseFloat(amount) > 0 && (
        <div className="bg-primary-500/10 border border-primary-500/20 rounded-lg p-4">
          <p className="text-sm text-primary-400 mb-2">
            Esta contribución representa el {contributionPercentage.toFixed(1)}% de tu objetivo
          </p>
          <p className="text-xs text-gray-400">
            Después de esta contribución, habrás ahorrado {formatCurrency(goal.current_amount + parseFloat(amount))}
          </p>
        </div>
      )}

      <div className="flex gap-3 justify-end pt-4">
        <button
          type="button"
          onClick={onClose}
          className="btn-secondary"
          disabled={contributeMutation.isLoading}
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="btn-primary flex items-center gap-2"
          disabled={contributeMutation.isLoading || !amount || parseFloat(amount) <= 0}
        >
          <PiggyBank className="w-5 h-5" />
          {contributeMutation.isLoading ? 'Procesando...' : 'Añadir Contribución'}
        </button>
      </div>
    </form>
  )
}

// Componente de tarjeta de objetivo
interface GoalCardProps {
  goal: Goal
  onEdit: (goal: Goal) => void
  onContribute: (goal: Goal) => void
  onDelete: (id: number) => void
  onToggleStatus: (goal: Goal) => void
}

const GoalCard: FC<GoalCardProps> = ({ goal, onEdit, onContribute, onDelete, onToggleStatus }) => {
  const Icon = GOAL_ICONS.find(i => i.value === goal.icon)?.icon || Target
  const daysRemaining = differenceInDays(new Date(goal.target_date), new Date())
  const isOverdue = daysRemaining < 0
  const monthsRemaining = Math.abs(daysRemaining / 30)
  
  // Calcular velocidad de progreso
  const daysSinceCreation = differenceInDays(new Date(), new Date(goal.created_at))
  const dailyProgress = daysSinceCreation > 0 ? goal.current_amount / daysSinceCreation : 0
  const projectedCompletion = dailyProgress > 0 
    ? Math.round((goal.target_amount - goal.current_amount) / dailyProgress)
    : null

  // Data para el gráfico radial
  const chartData = [{
    name: 'Progreso',
    value: goal.progress_percentage,
    fill: goal.color || '#3b82f6'
  }]

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Card 
        className="relative overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${goal.color}10 0%, transparent 100%)`
        }}
      >
        {/* Status Badge */}
        <div className="absolute top-4 right-4">
          <span className={cn(
            "text-xs px-3 py-1 rounded-full font-medium",
            goal.status === GoalStatus.ACTIVE && "bg-green-500/20 text-green-400",
            goal.status === GoalStatus.COMPLETED && "bg-blue-500/20 text-blue-400",
            goal.status === GoalStatus.PAUSED && "bg-yellow-500/20 text-yellow-400",
            goal.status === GoalStatus.CANCELLED && "bg-red-500/20 text-red-400"
          )}>
            {GOAL_STATUS_LABELS[goal.status]}
          </span>
        </div>

        {/* Header */}
        <div className="flex items-start gap-4 mb-6">
          <div 
            className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: `${goal.color}20` }}
          >
            <Icon className="w-7 h-7" style={{ color: goal.color }} />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-white mb-1">{goal.name}</h3>
            {goal.description && (
              <p className="text-sm text-gray-400 line-clamp-2">{goal.description}</p>
            )}
            <div className="flex items-center gap-3 mt-2">
              <span className={cn(
                "text-xs px-2 py-1 rounded-lg",
                PRIORITY_COLORS[goal.priority] === '#ef4444' && "bg-red-500/20 text-red-400",
                PRIORITY_COLORS[goal.priority] === '#f59e0b' && "bg-yellow-500/20 text-yellow-400",
                PRIORITY_COLORS[goal.priority] === '#3b82f6' && "bg-blue-500/20 text-blue-400",
                PRIORITY_COLORS[goal.priority] === '#6b7280' && "bg-gray-500/20 text-gray-400"
              )}>
                <Flag className="w-3 h-3 inline mr-1" />
                {GOAL_PRIORITY_LABELS[goal.priority]}
              </span>
            </div>
          </div>
        </div>

        {/* Progress Section */}
        <div className="grid grid-cols-2 gap-6 mb-6">
          {/* Progress Bar */}
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Progreso</span>
              <span className="text-white font-medium">{goal.progress_percentage.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-800 rounded-full h-3">
              <div 
                className="h-3 rounded-full transition-all duration-1000 relative overflow-hidden"
                style={{ 
                  width: `${Math.min(goal.progress_percentage, 100)}%`,
                  backgroundColor: goal.color
                }}
              >
                <div className="absolute inset-0 bg-white/20 animate-pulse" />
              </div>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">{formatCurrency(goal.current_amount)}</span>
              <span className="text-gray-500">{formatCurrency(goal.target_amount)}</span>
            </div>
          </div>

          {/* Radial Chart */}
          <div className="flex items-center justify-center">
            <ResponsiveContainer width={80} height={80}>
              <RadialBarChart cx="50%" cy="50%" innerRadius="60%" outerRadius="90%" data={chartData}>
                <PolarAngleAxis
                  type="number"
                  domain={[0, 100]}
                  angleAxisId={0}
                  tick={false}
                />
                <RadialBar
                  dataKey="value"
                  cornerRadius={10}
                  fill={goal.color}
                  background={{ fill: '#1f2937' }}
                />
              </RadialBarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div>
            <p className="text-xs text-gray-400 mb-1">Restante</p>
            <p className="text-sm font-semibold text-white">
              {formatCurrency(goal.remaining_amount)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-1">Fecha objetivo</p>
            <p className="text-sm font-semibold text-white">
              {format(new Date(goal.target_date), 'dd MMM yyyy', { locale: es })}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-1">Tiempo restante</p>
            <p className={cn(
              "text-sm font-semibold",
              isOverdue ? "text-red-500" : "text-white"
            )}>
              {isOverdue 
                ? `Vencido hace ${Math.abs(daysRemaining)} días`
                : daysRemaining === 0
                ? '¡Hoy!'
                : daysRemaining === 1
                ? '1 día'
                : daysRemaining < 30
                ? `${daysRemaining} días`
                : `${monthsRemaining.toFixed(1)} meses`
              }
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-1">Contribución mensual</p>
            <p className="text-sm font-semibold text-white">
              {goal.monthly_contribution 
                ? formatCurrency(goal.monthly_contribution)
                : formatCurrency(goal.monthly_contribution_suggested)
              }
            </p>
          </div>
        </div>

        {/* Proyección */}
        {projectedCompletion && goal.status === GoalStatus.ACTIVE && (
          <div className="bg-dark-hover rounded-lg p-3 mb-4">
            <p className="text-xs text-gray-400 mb-1">
              <TrendingUp className="w-3 h-3 inline mr-1" />
              Al ritmo actual
            </p>
            <p className="text-sm text-white">
              Alcanzarás tu objetivo en aproximadamente <span className="font-semibold text-primary-400">
                {projectedCompletion} días
              </span>
              {projectedCompletion > daysRemaining && !isOverdue && (
                <span className="text-yellow-500 ml-2">
                  (⚠️ {projectedCompletion - daysRemaining} días después de lo planeado)
                </span>
              )}
            </p>
          </div>
        )}

        {/* Countdown destacado para objetivos próximos */}
        {daysRemaining <= 30 && daysRemaining > 0 && goal.status === GoalStatus.ACTIVE && (
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 mb-4">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-yellow-500" />
              <p className="text-sm text-yellow-500 font-medium">
                ¡Quedan solo {daysRemaining} días! 
                {goal.progress_percentage < 80 && " Necesitas acelerar el ritmo de ahorro"}
              </p>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-dark-border">
          <div className="flex gap-2">
            <button
              onClick={() => onToggleStatus(goal)}
              className={cn(
                "p-2 rounded-lg transition-colors",
                goal.status === GoalStatus.ACTIVE
                  ? "text-yellow-500 hover:bg-yellow-500/10"
                  : "text-green-500 hover:bg-green-500/10"
              )}
              title={goal.status === GoalStatus.ACTIVE ? "Pausar" : "Reanudar"}
            >
              {goal.status === GoalStatus.ACTIVE ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>
            <button
              onClick={() => onEdit(goal)}
              className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-dark-hover transition-colors"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDelete(goal.id)}
              className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-500/10 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
          
          {goal.status === GoalStatus.ACTIVE && (
            <button
              onClick={() => onContribute(goal)}
              className="btn-primary btn-sm flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Contribuir
            </button>
          )}
          
          {goal.status === GoalStatus.COMPLETED && (
            <div className="flex items-center gap-2 text-green-500">
              <CheckCircle className="w-5 h-5" />
              <span className="text-sm font-medium">¡Completado!</span>
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  )
}

// Componente principal de Goals
const Goals: FC = () => {
  const queryClient = useQueryClient()
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [selectedGoal, setSelectedGoal] = useState<Goal | undefined>()
  const [contributionModal, setContributionModal] = useState<Goal | null>(null)
  const [filterStatus, setFilterStatus] = useState<GoalStatus | 'all'>('all')
  const [filterPriority, setFilterPriority] = useState<GoalPriority | 'all'>('all')

  // Fetch goals
  const { data: goals, isLoading } = useQuery({
    queryKey: ['goals'],
    queryFn: async () => {
      const { data } = await api.get<Goal[]>(endpoints.goals)
      return data
    }
  })

  // Fetch summary
  const { data: summary } = useQuery({
    queryKey: ['goals-summary'],
    queryFn: async () => {
      const { data } = await api.get(`${endpoints.goals}/summary`)
      return data
    }
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(endpoints.goal(id)),
    onSuccess: () => {
      toast.success('Objetivo eliminado exitosamente')
      queryClient.invalidateQueries(['goals'])
      queryClient.invalidateQueries(['goals-summary'])
    }
  })

  // Toggle status mutation
  const toggleStatusMutation = useMutation({
    mutationFn: (goal: Goal) => {
      const newStatus = goal.status === GoalStatus.ACTIVE ? GoalStatus.PAUSED : GoalStatus.ACTIVE
      return api.put(endpoints.goal(goal.id), { status: newStatus })
    },
    onSuccess: () => {
      toast.success('Estado actualizado')
      queryClient.invalidateQueries(['goals'])
      queryClient.invalidateQueries(['goals-summary'])
    }
  })

  const handleEdit = (goal: Goal) => {
    setSelectedGoal(goal)
    setIsFormOpen(true)
  }

  const handleDelete = (id: number) => {
    if (confirm('¿Estás seguro de eliminar este objetivo?')) {
      deleteMutation.mutate(id)
    }
  }

  const handleContribute = (goal: Goal) => {
    setContributionModal(goal)
  }

  const handleToggleStatus = (goal: Goal) => {
    toggleStatusMutation.mutate(goal)
  }

  const handleFormClose = () => {
    setIsFormOpen(false)
    setSelectedGoal(undefined)
  }

  const handleFormSuccess = () => {
    queryClient.invalidateQueries(['goals'])
    queryClient.invalidateQueries(['goals-summary'])
    queryClient.invalidateQueries(['dashboard']) // Actualizar dashboard también
  }

  // Filter goals
  const filteredGoals = goals?.filter(goal => {
    const matchesStatus = filterStatus === 'all' || goal.status === filterStatus
    const matchesPriority = filterPriority === 'all' || goal.priority === filterPriority
    return matchesStatus && matchesPriority
  })

  // Calculate insights
  const activeGoals = goals?.filter(g => g.status === GoalStatus.ACTIVE) || []
  const completedGoals = goals?.filter(g => g.status === GoalStatus.COMPLETED) || []
  const totalSaved = goals?.reduce((sum, g) => sum + g.current_amount, 0) || 0
  const totalTarget = goals?.reduce((sum, g) => sum + g.target_amount, 0) || 0
  const overallProgress = totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0

  // Próximos objetivos a vencer
  const upcomingGoals = activeGoals
    .filter(g => differenceInDays(new Date(g.target_date), new Date()) <= 90)
    .sort((a, b) => new Date(a.target_date).getTime() - new Date(b.target_date).getTime())

  if (isLoading) {
    return <Loading fullScreen text="Cargando objetivos..." />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Objetivos de Ahorro</h1>
          <p className="text-gray-400 mt-1">
            Define tus metas y alcanza tus sueños
          </p>
        </div>
        <button
          onClick={() => setIsFormOpen(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Nuevo Objetivo
        </button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Ahorrado"
          value={totalSaved}
          icon={Wallet}
          format="currency"
          color="green"
          trend={{
            value: overallProgress,
            isPositive: true
          }}
        />
        <StatCard
          title="Meta Total"
          value={totalTarget}
          icon={Target}
          format="currency"
          color="primary"
        />
        <StatCard
          title="Objetivos Activos"
          value={activeGoals.length}
          icon={TrendingUp}
          format="number"
          color="yellow"
        />
        <StatCard
          title="Completados"
          value={completedGoals.length}
          icon={Trophy}
          format="number"
          color="purple"
        />
      </div>

      {/* Upcoming Goals Alert */}
      {upcomingGoals.length > 0 && (
        <Card className="border-yellow-500/20">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-500 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-medium text-white mb-2">Objetivos próximos a vencer</h3>
              <div className="space-y-2">
                {upcomingGoals.slice(0, 3).map(goal => {
                  const days = differenceInDays(new Date(goal.target_date), new Date())
                  return (
                    <div key={goal.id} className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">{goal.name}</span>
                      <span className={cn(
                        "font-medium",
                        days <= 7 ? "text-red-500" : days <= 30 ? "text-yellow-500" : "text-gray-300"
                      )}>
                        {days} días • {goal.progress_percentage.toFixed(1)}% completado
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Filters */}
      <Card padding="sm">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 flex gap-2">
            <select
              className="input"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as GoalStatus | 'all')}
            >
              <option value="all">Todos los estados</option>
              {Object.entries(GOAL_STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
            <select
              className="input"
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value as GoalPriority | 'all')}
            >
              <option value="all">Todas las prioridades</option>
              {Object.entries(GOAL_PRIORITY_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Goals Grid */}
      {filteredGoals && filteredGoals.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <AnimatePresence>
            {filteredGoals.map((goal) => (
              <GoalCard
                key={goal.id}
                goal={goal}
                onEdit={handleEdit}
                onContribute={handleContribute}
                onDelete={handleDelete}
                onToggleStatus={handleToggleStatus}
              />
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <Card>
          <EmptyState
            icon={Target}
            title="No tienes objetivos creados"
            description="Comienza creando tu primer objetivo de ahorro"
            action={{
              label: 'Crear Objetivo',
              onClick: () => setIsFormOpen(true),
              icon: Plus
            }}
          />
        </Card>
      )}

      {/* Goal Form Modal */}
      <Modal
        isOpen={isFormOpen}
        onClose={handleFormClose}
        title={selectedGoal ? 'Editar Objetivo' : 'Nuevo Objetivo'}
        size="xl"
      >
        <GoalForm
          goal={selectedGoal}
          onClose={handleFormClose}
          onSuccess={handleFormSuccess}
        />
      </Modal>

      {/* Contribution Modal */}
      {contributionModal && (
        <Modal
          isOpen={true}
          onClose={() => setContributionModal(null)}
          title="Añadir Contribución"
          size="md"
        >
          <ContributionForm
            goal={contributionModal}
            onClose={() => setContributionModal(null)}
            onSuccess={handleFormSuccess}
          />
        </Modal>
      )}
    </div>
  )
}

export default Goals