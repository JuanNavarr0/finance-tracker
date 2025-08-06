import { FC, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  TrendingDown, 
  Plus, 
  Filter,
  Download,
  Calendar,
  DollarSign,
  ShoppingCart,
  Edit,
  Trash2,
  Search,
  RefreshCw,
  PieChart
} from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import { format } from 'date-fns'
import { api, endpoints } from '@services'
import { Expense, ExpenseStats, ExpenseCategory, ExpenseFrequency } from '@types'
import { Card, Loading, EmptyState, Modal, StatCard } from '@components/common'
import { 
  formatCurrency, 
  EXPENSE_CATEGORY_LABELS, 
  EXPENSE_FREQUENCY_LABELS,
  CATEGORY_COLORS, 
  formatDate,
  cn 
} from '@utils'

// Expense Form Component
interface ExpenseFormProps {
  expense?: Expense
  onClose: () => void
  onSuccess: () => void
}

const ExpenseForm: FC<ExpenseFormProps> = ({ expense, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    amount: expense?.amount || '',
    category: expense?.category || ExpenseCategory.FOOD,
    subcategory: expense?.subcategory || '',
    description: expense?.description || '',
    vendor: expense?.vendor || '',
    frequency: expense?.frequency || ExpenseFrequency.ONE_TIME,
    is_recurring: expense?.is_recurring || false,
    date: expense ? format(new Date(expense.date), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd')
  })

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post(endpoints.expenses, data),
    onSuccess: () => {
      toast.success('Gasto creado exitosamente')
      onSuccess()
      onClose()
    }
  })

  const updateMutation = useMutation({
    mutationFn: (data: any) => api.put(endpoints.expense(expense!.id), data),
    onSuccess: () => {
      toast.success('Gasto actualizado exitosamente')
      onSuccess()
      onClose()
    }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const data = {
      ...formData,
      amount: parseFloat(formData.amount)
    }
    
    if (expense) {
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
          <label htmlFor="amount" className="label">Monto</label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              id="amount"
              type="number"
              step="0.01"
              required
              className="input pl-10"
              placeholder="0.00"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            />
          </div>
        </div>

        <div>
          <label htmlFor="date" className="label">Fecha</label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              id="date"
              type="date"
              required
              className="input pl-10"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="category" className="label">Categoría</label>
          <select
            id="category"
            className="input"
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value as ExpenseCategory })}
          >
            {Object.entries(EXPENSE_CATEGORY_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="vendor" className="label">Vendedor/Comercio</label>
          <input
            id="vendor"
            type="text"
            className="input"
            placeholder="Ej: Mercadona, Netflix, etc."
            value={formData.vendor}
            onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="frequency" className="label">Frecuencia</label>
          <select
            id="frequency"
            className="input"
            value={formData.frequency}
            onChange={(e) => setFormData({ ...formData, frequency: e.target.value as ExpenseFrequency })}
          >
            {Object.entries(EXPENSE_FREQUENCY_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>

        <div className="flex items-end">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              className="w-5 h-5 rounded border-gray-600 bg-transparent text-primary-500"
              checked={formData.is_recurring}
              onChange={(e) => setFormData({ ...formData, is_recurring: e.target.checked })}
            />
            <span className="text-sm text-gray-400">Es un gasto recurrente</span>
          </label>
        </div>
      </div>

      <div>
        <label htmlFor="description" className="label">Descripción (opcional)</label>
        <textarea
          id="description"
          rows={3}
          className="input"
          placeholder="Detalles adicionales..."
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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
          {isLoading ? 'Guardando...' : expense ? 'Actualizar' : 'Crear'}
        </button>
      </div>
    </form>
  )
}

// Category Summary Component
interface CategorySummaryProps {
  data: any
}

const CategorySummary: FC<CategorySummaryProps> = ({ data }) => {
  if (!data || !data.categories || data.categories.length === 0) return null

  return (
    <Card>
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <PieChart className="w-5 h-5" />
        Gastos por Categoría
      </h3>
      <div className="space-y-3">
        {data.categories.slice(0, 5).map((category: any) => (
          <div key={category.category} className="flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1">
              <div 
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: CATEGORY_COLORS[category.category] }}
              />
              <span className="text-sm text-gray-300">
                {EXPENSE_CATEGORY_LABELS[category.category]}
              </span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-white">
                {formatCurrency(category.total)}
              </span>
              <span className="text-xs text-gray-500">
                {category.percentage}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}

// Main Expenses Page
const Expenses: FC = () => {
  const queryClient = useQueryClient()
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [selectedExpense, setSelectedExpense] = useState<Expense | undefined>()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<ExpenseCategory | ''>('')
  const [showRecurring, setShowRecurring] = useState(false)

  // Fetch expenses
  const { data: expenses, isLoading } = useQuery({
    queryKey: ['expenses', selectedCategory, showRecurring],
    queryFn: async () => {
      const params: any = {}
      if (selectedCategory) params.category = selectedCategory
      if (showRecurring) params.is_recurring = true
      
      const { data } = await api.get<Expense[]>(endpoints.expenses, { params })
      return data
    }
  })

  // Fetch stats
  const { data: stats } = useQuery({
    queryKey: ['expense-stats'],
    queryFn: async () => {
      const { data } = await api.get<ExpenseStats>(endpoints.expenseStats)
      return data
    }
  })

  // Fetch category summary
  const { data: categorySummary } = useQuery({
    queryKey: ['expense-categories'],
    queryFn: async () => {
      const { data } = await api.get(endpoints.expenseCategories)
      return data
    }
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(endpoints.expense(id)),
    onSuccess: () => {
      toast.success('Gasto eliminado exitosamente')
      queryClient.invalidateQueries(['expenses'])
      queryClient.invalidateQueries(['expense-stats'])
      queryClient.invalidateQueries(['expense-categories'])
    }
  })

  const handleEdit = (expense: Expense) => {
    setSelectedExpense(expense)
    setIsFormOpen(true)
  }

  const handleDelete = (id: number) => {
    if (confirm('¿Estás seguro de eliminar este gasto?')) {
      deleteMutation.mutate(id)
    }
  }

  const handleFormClose = () => {
    setIsFormOpen(false)
    setSelectedExpense(undefined)
  }

  const handleFormSuccess = () => {
    queryClient.invalidateQueries(['expenses'])
    queryClient.invalidateQueries(['expense-stats'])
    queryClient.invalidateQueries(['expense-categories'])
  }

  // Filter expenses
  const filteredExpenses = expenses?.filter(expense => {
    const matchesSearch = expense.vendor?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         expense.description?.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch
  })

  if (isLoading) {
    return <Loading fullScreen text="Cargando gastos..." />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Gastos</h1>
          <p className="text-gray-400 mt-1">
            Controla y categoriza tus gastos
          </p>
        </div>
        <button
          onClick={() => setIsFormOpen(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Nuevo Gasto
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total de Gastos"
            value={stats.total_expenses}
            icon={TrendingDown}
            format="currency"
            color="red"
          />
          <StatCard
            title="Promedio Mensual"
            value={stats.monthly_average}
            icon={Calendar}
            format="currency"
            color="primary"
          />
          <StatCard
            title="Gastos Fijos"
            value={stats.fixed_expenses}
            icon={RefreshCw}
            format="currency"
            color="yellow"
          />
          <StatCard
            title="Gastos Variables"
            value={stats.variable_expenses}
            icon={ShoppingCart}
            format="currency"
            color="purple"
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
                  placeholder="Buscar por comercio o descripción..."
                  className="input pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <select
                  className="input"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value as ExpenseCategory | '')}
                >
                  <option value="">Todas las categorías</option>
                  {Object.entries(EXPENSE_CATEGORY_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
                <button 
                  onClick={() => setShowRecurring(!showRecurring)}
                  className={cn(
                    "btn-secondary",
                    showRecurring && "bg-primary-500 text-white hover:bg-primary-600"
                  )}
                >
                  <RefreshCw className="w-5 h-5" />
                </button>
                <button className="btn-secondary">
                  <Download className="w-5 h-5" />
                </button>
              </div>
            </div>
          </Card>

          {/* Expenses List */}
          <Card>
            {filteredExpenses && filteredExpenses.length > 0 ? (
              <div className="space-y-3">
                <AnimatePresence>
                  {filteredExpenses.map((expense, index) => (
                    <motion.div
                      key={expense.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center justify-between p-4 rounded-lg bg-dark-hover/50 hover:bg-dark-hover transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div 
                          className="w-12 h-12 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: `${CATEGORY_COLORS[expense.category]}20` }}
                        >
                          <ShoppingCart 
                            className="w-6 h-6" 
                            style={{ color: CATEGORY_COLORS[expense.category] }}
                          />
                        </div>
                        <div>
                          <p className="font-medium text-white">
                            {expense.vendor || EXPENSE_CATEGORY_LABELS[expense.category]}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs px-2 py-1 rounded-full bg-gray-800 text-gray-400">
                              {EXPENSE_CATEGORY_LABELS[expense.category]}
                            </span>
                            {expense.is_recurring && (
                              <span className="text-xs px-2 py-1 rounded-full bg-yellow-500/20 text-yellow-500">
                                {EXPENSE_FREQUENCY_LABELS[expense.frequency]}
                              </span>
                            )}
                            <span className="text-xs text-gray-500">
                              {formatDate(expense.date)}
                            </span>
                          </div>
                          {expense.description && (
                            <p className="text-sm text-gray-400 mt-1">{expense.description}</p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <span className="text-xl font-bold text-red-500">
                          -{formatCurrency(expense.amount)}
                        </span>
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleEdit(expense)}
                            className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-dark-hover transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(expense.id)}
                            className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-500/10 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            ) : (
              <EmptyState
                icon={TrendingDown}
                title="No hay gastos registrados"
                description="Comienza agregando tu primer gasto"
                action={{
                  label: 'Agregar Gasto',
                  onClick: () => setIsFormOpen(true),
                  icon: Plus
                }}
              />
            )}
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <CategorySummary data={categorySummary} />
          
          {/* Top Vendors */}
          {stats && stats.top_vendors.length > 0 && (
            <Card>
              <h3 className="text-lg font-semibold text-white mb-4">
                Comercios Frecuentes
              </h3>
              <div className="space-y-3">
                {stats.top_vendors.slice(0, 5).map((vendor) => (
                  <div key={vendor.vendor} className="flex items-center justify-between">
                    <span className="text-sm text-gray-300">{vendor.vendor}</span>
                    <div className="text-right">
                      <p className="text-sm font-medium text-white">
                        {formatCurrency(vendor.total)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {vendor.count} {vendor.count === 1 ? 'vez' : 'veces'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Expense Form Modal */}
      <Modal
        isOpen={isFormOpen}
        onClose={handleFormClose}
        title={selectedExpense ? 'Editar Gasto' : 'Nuevo Gasto'}
        size="lg"
      >
        <ExpenseForm
          expense={selectedExpense}
          onClose={handleFormClose}
          onSuccess={handleFormSuccess}
        />
      </Modal>
    </div>
  )
}

export default Expenses