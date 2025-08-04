import axios, { AxiosError } from 'axios'
import { toast } from 'react-hot-toast'
import { useAuthStore } from '@stores/authStore'

const API_URL = import.meta.env.VITE_API_URL || '/api/v1'

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<{ detail: string }>) => {
    const { logout } = useAuthStore.getState()
    
    if (error.response?.status === 401) {
      // Token expired or invalid
      logout()
      toast.error('Sesión expirada. Por favor, inicia sesión nuevamente.')
      window.location.href = '/login'
    } else if (error.response?.status === 403) {
      toast.error('No tienes permisos para realizar esta acción.')
    } else if (error.response?.status === 404) {
      toast.error('Recurso no encontrado.')
    } else if (error.response?.status === 500) {
      toast.error('Error del servidor. Por favor, intenta más tarde.')
    } else if (error.response?.data?.detail) {
      toast.error(error.response.data.detail)
    } else if (error.request) {
      toast.error('Error de conexión. Verifica tu conexión a internet.')
    } else {
      toast.error('Ha ocurrido un error inesperado.')
    }
    
    return Promise.reject(error)
  }
)

export default api

// API endpoints
export const endpoints = {
  // Auth
  login: '/auth/login',
  register: '/auth/register',
  me: '/auth/me',
  
  // Users
  users: '/users',
  user: (id: number) => `/users/${id}`,
  
  // Incomes
  incomes: '/incomes',
  income: (id: number) => `/incomes/${id}`,
  incomeStats: '/incomes/stats',
  
  // Expenses
  expenses: '/expenses',
  expense: (id: number) => `/expenses/${id}`,
  expenseStats: '/expenses/stats',
  expenseCategories: '/expenses/categories/summary',
  
  // Goals
  goals: '/goals',
  goal: (id: number) => `/goals/${id}`,
  goalContribute: (id: number) => `/goals/${id}/contribute`,
  goalWithdraw: (id: number) => `/goals/${id}/withdraw`,
  goalsSummary: '/goals/summary',
  goalMonthlyContribution: (id: number) => `/goals/calculate/monthly-contribution/${id}`,
  
  // Investments
  investments: '/investments',
  investment: (id: number) => `/investments/${id}`,
  investmentSell: (id: number) => `/investments/${id}/sell`,
  portfolioSummary: '/investments/portfolio/summary',
  investmentHistory: (id: number) => `/investments/${id}/history`,
  marketSearch: '/investments/market/search',
  
  // Dashboard
  dashboard: '/dashboard',
  quickStats: '/dashboard/quick-stats',
}