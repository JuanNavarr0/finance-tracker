import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import api, { endpoints } from '@services/api'
import { User, UserLogin, UserCreate, Token } from '@types'

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  
  // Actions
  login: (credentials: UserLogin) => Promise<void>
  register: (userData: UserCreate) => Promise<void>
  logout: () => void
  fetchUser: () => Promise<void>
  updateUser: (userData: Partial<User>) => void
  initialize: () => void
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
          // Login with form data (OAuth2 expects form-urlencoded)
          const formData = new FormData()
          formData.append('username', credentials.username)
          formData.append('password', credentials.password)
          
          const { data } = await api.post<Token>(endpoints.login, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          })
          
          set({ 
            token: data.access_token,
            isAuthenticated: true
          })
          
          // Fetch user data
          await get().fetchUser()
        } finally {
          set({ isLoading: false })
        }
      },

      register: async (userData: UserCreate) => {
        set({ isLoading: true })
        try {
          await api.post(endpoints.register, userData)
          
          // Auto login after registration
          await get().login({
            username: userData.username,
            password: userData.password
          })
        } finally {
          set({ isLoading: false })
        }
      },

      logout: () => {
        set({ 
          user: null, 
          token: null, 
          isAuthenticated: false 
        })
      },

      fetchUser: async () => {
        try {
          const { data } = await api.get<User>(endpoints.me)
          set({ user: data })
        } catch (error) {
          // If fetching user fails, logout
          get().logout()
          throw error
        }
      },

      updateUser: (userData: Partial<User>) => {
        set((state) => ({
          user: state.user ? { ...state.user, ...userData } : null
        }))
      },

      initialize: () => {
        const { token, fetchUser } = get()
        if (token) {
          // Verify token is still valid by fetching user
          fetchUser().catch(() => {
            // Token is invalid, logout
            get().logout()
          })
        }
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ 
        token: state.token,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
)