import axios, { AxiosError } from 'axios'
import { toast } from 'react-hot-toast'

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
    const token = localStorage.getItem('token')
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
    
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token')
      toast.error('Sesión expirada. Por favor, inicia sesión nuevamente.')
      window.location.href = '/auth/login'
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

// Export endpoints
export * from './endpoints'