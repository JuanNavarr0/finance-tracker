import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from '@stores/authStore'
import AuthLayout from '@components/layouts/AuthLayout'
import DashboardLayout from '@components/layouts/DashboardLayout'
import ProtectedRoute from '@components/auth/ProtectedRoute'

// Auth pages
import Login from '@pages/auth/Login'
import Register from '@pages/auth/Register'

// Dashboard pages
import Dashboard from '@pages/dashboard/Dashboard'
import Incomes from '@pages/incomes/Incomes'
import Expenses from '@pages/expenses/Expenses'
import Goals from '@pages/goals/Goals'
import Investments from '@pages/investments/Investments'
import Profile from '@pages/profile/Profile'

function App() {
  const { isAuthenticated, initialize } = useAuthStore()

  // Initialize auth state on app load
  initialize()

  return (
    <BrowserRouter>
      <Routes>
        {/* Auth routes */}
        <Route element={<AuthLayout />}>
          <Route 
            path="/login" 
            element={isAuthenticated ? <Navigate to="/dashboard" /> : <Login />} 
          />
          <Route 
            path="/register" 
            element={isAuthenticated ? <Navigate to="/dashboard" /> : <Register />} 
          />
        </Route>

        {/* Protected routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/incomes" element={<Incomes />} />
            <Route path="/expenses" element={<Expenses />} />
            <Route path="/goals" element={<Goals />} />
            <Route path="/investments" element={<Investments />} />
            <Route path="/profile" element={<Profile />} />
          </Route>
        </Route>

        {/* Default routes */}
        <Route path="/" element={<Navigate to="/dashboard" />} />
        <Route path="*" element={<Navigate to="/dashboard" />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App