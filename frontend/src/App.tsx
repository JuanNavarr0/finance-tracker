import { useEffect, useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useAuthStore } from '@stores/authStore'

// Layouts
import AuthLayout from '@components/layout/AuthLayout'
import DashboardLayout from '@components/layout/DashboardLayout'

// Auth Pages
import Login from '@pages/auth/Login'
import Register from '@pages/auth/Register'

// Dashboard Pages
import Dashboard from '@pages/dashboard/Dashboard'
import Incomes from '@pages/dashboard/Incomes'
import Expenses from '@pages/dashboard/Expenses'
import Goals from '@pages/dashboard/Goals'
import Investments from '@pages/dashboard/Investments'
import Profile from '@pages/dashboard/Profile'

// Components
import { Loading } from '@components/common'

function App() {
  const { checkAuth, isAuthenticated } = useAuthStore()
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    const verifyAuth = async () => {
      await checkAuth()
      setIsChecking(false)
    }
    verifyAuth()
  }, [checkAuth])

  if (isChecking) {
    return <Loading fullScreen text="Cargando..." />
  }

  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Root redirect */}
          <Route path="/" element={
            isAuthenticated ? <Navigate to="/dashboard" replace /> : <Navigate to="/auth/login" replace />
          } />
          
          {/* Auth routes */}
          <Route path="/auth" element={<AuthLayout />}>
            <Route path="login" element={<Login />} />
            <Route path="register" element={<Register />} />
          </Route>
          
          {/* Protected routes */}
          {isAuthenticated ? (
            <Route path="/" element={<DashboardLayout />}>
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="incomes" element={<Incomes />} />
              <Route path="expenses" element={<Expenses />} />
              <Route path="goals" element={<Goals />} />
              <Route path="investments" element={<Investments />} />
              <Route path="profile" element={<Profile />} />
            </Route>
          ) : (
            <Route path="*" element={<Navigate to="/auth/login" replace />} />
          )}
        </Routes>
        
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#1f2937',
              color: '#fff',
              border: '1px solid #374151',
            },
          }}
        />
      </div>
    </Router>
  )
}

export default App