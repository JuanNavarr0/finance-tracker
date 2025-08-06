import api, { endpoints } from './api'
import { User, UserCreate, UserLogin, Token } from '@types'

class AuthService {
  async login(credentials: UserLogin): Promise<Token> {
    const formData = new FormData()
    formData.append('username', credentials.username)
    formData.append('password', credentials.password)
    
    const { data } = await api.post<Token>(endpoints.login, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    
    return data
  }

  async register(userData: UserCreate): Promise<User> {
    const { data } = await api.post<User>(endpoints.register, userData)
    return data
  }

  async getCurrentUser(): Promise<User> {
    const { data } = await api.get<User>(endpoints.me)
    return data
  }

  async updateProfile(userId: number, userData: Partial<User>): Promise<User> {
    const { data } = await api.put<User>(endpoints.user(userId), userData)
    return data
  }

  async changePassword(userId: number, currentPassword: string, newPassword: string): Promise<void> {
    await api.put(endpoints.user(userId), {
      password: newPassword,
      current_password: currentPassword
    })
  }

  logout(): void {
    // Clear any server-side session if needed
    // For now, just clear local storage (handled by auth store)
  }
}

export default new AuthService()