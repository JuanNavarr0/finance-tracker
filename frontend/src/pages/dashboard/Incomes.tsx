import { FC, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  TrendingUp, 
  Plus, 
  Filter,
  Download,
  Calendar,
  DollarSign,
  Briefcase,
  Edit,
  Trash2,
  Search
} from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import { format } from 'date-fns'
import { api, endpoints } from '@services'
import { Income, IncomeStats, IncomeType } from '@types'
import { Card, Loading, EmptyState, Modal, StatCard } from '@components/common'
import { formatCurrency, INCOME_TYPE_LABELS, CATEGORY_COLORS, formatDate } from '@utils'

// Income Form Component
interface IncomeFormProps {
  income?: Income
  onClose: () => void
  onSuccess: () => void
}

const IncomeForm: FC<IncomeFormProps> = ({ income, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    amount: income?.amount || '',
    source: income?.source || '',
    income_type: income?.income_type || IncomeType.SALARY,
    description: income?.description || '',
    date: income ? format(new Date(income.date), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd')
  })

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post(endpoints.incomes, data),
    onSuccess: () => {
      toast.success('Ingreso creado exitosamente')
      onSuccess()
      onClose()
    }
  })

  const updateMutation = useMutation({
    mutationFn: (data: any) => api.put(endpoints.income(income!.id), data),
    onSuccess: () => {
      toast.success('Ingreso actualizado exitosamente')
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
    
    if (income) {
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

      <div>
        <label htmlFor="source" className="label">Fuente</label>
        <input
          id="source"
          type="text"
          required
          className="input"
          placeholder="Ej: Empresa XYZ, Cliente ABC"
          value={formData.source}
          onChange={(e) => setFormData({ ...formData, source: e.target.value })}
        />
      </div>

      <div>
        <label htmlFor="income_type" className="label">Tipo de Ingreso</label>
        <select
          id="income_type"
          className="input"
          value={formData.income_type}
          onChange={(e) => setFormData({ ...formData, income_type: e.target.value as IncomeType })}
        >
          {Object.entries(INCOME_TYPE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
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
          {isLoading ? 'Guardando...' : income ? 'Actualizar' : 'Crear'}
        </button>
      </div>
    </form>
  )
}

// Main Incomes Page
const Incomes: FC = () => {
  const queryClient = useQueryClient()
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [selectedIncome, setSelectedIncome] = useState<Income | undefined>()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedType, setSelectedType] = useState<IncomeType | ''>('')

  // Fetch incomes
  const { data: incomes, isLoading } = useQuery({
    queryKey: ['incomes', selectedType],
    queryFn: async () => {
      const params = selectedType ? { income_type: selectedType } : undefined
      const { data } = await api.get<Income[]>(endpoints.incomes, { params })
      return data
    }
  })

  // Fetch stats
  const { data: stats } = useQuery({
    queryKey: ['income-stats'],
    queryFn: async () => {
      const { data } = await api.get<IncomeStats>(endpoints.incomeStats)
      return data
    }
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(endpoints.income(id)),
    onSuccess: () => {
      toast.success('Ingreso eliminado exitosamente')
      queryClient.invalidateQueries(['incomes'])
      queryClient.invalidateQueries(['income-stats'])
    }
  })

  const handleEdit = (income: Income) => {
    setSelectedIncome(income)
    setIsFormOpen(true)
  }

  const handleDelete = (id: number) => {
    if (confirm('¿Estás seguro de eliminar este ingreso?')) {
      deleteMutation.mutate(id)
    }
  }

  const handleFormClose = () => {
    setIsFormOpen(false)
    setSelectedIncome(undefined)
  }

  const handleFormSuccess = () => {
    queryClient.invalidateQueries(['incomes'])
    queryClient.invalidateQueries(['income-stats'])
  }

  // Filter incomes
  const filteredIncomes = incomes?.filter(income => {
    const matchesSearch = income.source.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         income.description?.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch
  })

  if (isLoading) {
    return <Loading fullScreen text="Cargando ingresos..." />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Ingresos</h1>
          <p className="text-gray-400 mt-1">
            Gestiona y registra tus fuentes de ingreso
          </p>
        </div>
        <button
          onClick={() => setIsFormOpen(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Nuevo Ingreso
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total de Ingresos"
            value={stats.total_income}
            icon={TrendingUp}
            format="currency"
            color="green"
          />
          <StatCard
            title="Promedio Mensual"
            value={stats.monthly_average}
            icon={Calendar}
            format="currency"
            color="primary"
          />
          <StatCard
            title="Último Ingreso"
            value={0}
            icon={DollarSign}
            subtitle={stats.last_income_date ? formatDate(stats.last_income_date) : 'Sin ingresos'}
            color="yellow"
          />
          <StatCard
            title="Fuentes de Ingreso"
            value={Object.keys(stats.income_by_type).length}
            icon={Briefcase}
            format="number"
            color="purple"
          />
        </div>
      )}

      {/* Filters */}
      <Card padding="sm">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por fuente o descripción..."
              className="input pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <select
              className="input"
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as IncomeType | '')}
            >
              <option value="">Todos los tipos</option>
              {Object.entries(INCOME_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
            <button className="btn-secondary">
              <Filter className="w-5 h-5" />
            </button>
            <button className="btn-secondary">
              <Download className="w-5 h-5" />
            </button>
          </div>
        </div>
      </Card>

      {/* Incomes List */}
      <Card>
        {filteredIncomes && filteredIncomes.length > 0 ? (
          <div className="space-y-3">
            <AnimatePresence>
              {filteredIncomes.map((income, index) => (
                <motion.div
                  key={income.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center justify-between p-4 rounded-lg bg-dark-hover/50 hover:bg-dark-hover transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div 
                      className="w-12 h-12 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: `${CATEGORY_COLORS[income.income_type]}20` }}
                    >
                      <TrendingUp 
                        className="w-6 h-6" 
                        style={{ color: CATEGORY_COLORS[income.income_type] }}
                      />
                    </div>
                    <div>
                      <p className="font-medium text-white">{income.source}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs px-2 py-1 rounded-full bg-gray-800 text-gray-400">
                          {INCOME_TYPE_LABELS[income.income_type]}
                        </span>
                        <span className="text-xs text-gray-500">
                          {formatDate(income.date)}
                        </span>
                      </div>
                      {income.description && (
                        <p className="text-sm text-gray-400 mt-1">{income.description}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="text-xl font-bold text-green-500">
                      +{formatCurrency(income.amount)}
                    </span>
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleEdit(income)}
                        className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-dark-hover transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(income.id)}
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
            icon={TrendingUp}
            title="No hay ingresos registrados"
            description="Comienza agregando tu primer ingreso"
            action={{
              label: 'Agregar Ingreso',
              onClick: () => setIsFormOpen(true),
              icon: Plus
            }}
          />
        )}
      </Card>

      {/* Income Form Modal */}
      <Modal
        isOpen={isFormOpen}
        onClose={handleFormClose}
        title={selectedIncome ? 'Editar Ingreso' : 'Nuevo Ingreso'}
        size="lg"
      >
        <IncomeForm
          income={selectedIncome}
          onClose={handleFormClose}
          onSuccess={handleFormSuccess}
        />
      </Modal>
    </div>
  )
}

export default Incomes