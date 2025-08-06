import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { User, UserLogin, Token } from '@types'
import authService from '@services/auth.service'
import { toast } from 'react-hot-toast'

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (credentials: UserLogin) => Promise<void>
  register: (userData: any) => Promise<void>
  logout: () => void
  updateUser: (user: User) => void
  checkAuth: () => Promise<void>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      
      login: async (credentials: UserLogin) => {
        set({ isLoading: true })
        try {
          const tokenData = await authService.login(credentials)
          localStorage.setItem('token', tokenData.access_token)
          
          // Get user data
          const user = await authService.getCurrentUser()
          
          set({ 
            user, 
            token: tokenData.access_token, 
            isAuthenticated: true,
            isLoading: false 
          })
        } catch (error) {
          set({ isLoading: false })
          throw error
        }
      },
      
      register: async (userData: any) => {
        set({ isLoading: true })
        try {
          const user = await authService.register(userData)
          
          // Auto login after register
          const credentials = {
            username: userData.username,
            password: userData.password
          }
          await get().login(credentials)
        } catch (error) {
          set({ isLoading: false })
          throw error
        }
      },
      
      logout: () => {
        localStorage.removeItem('token')
        set({ user: null, token: null, isAuthenticated: false })
      },
      
      updateUser: (user: User) => {
        set({ user })
      },
      
      checkAuth: async () => {
        const token = localStorage.getItem('token')
        if (!token) {
          set({ isAuthenticated: false, user: null })
          return
        }
        
        try {
          const user = await authService.getCurrentUser()
          set({ user, isAuthenticated: true, token })
        } catch (error) {
          localStorage.removeItem('token')
          set({ isAuthenticated: false, user: null, token: null })
        }
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ 
        token: state.token
      }),
    }
  )
)