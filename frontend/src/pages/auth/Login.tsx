import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { motion } from 'framer-motion'
import { Eye, EyeOff, LogIn, TrendingUp } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { useAuthStore } from '@stores/authStore'
import { UserLogin } from '@types'
import { cn } from '@utils'

const Login = () => {
  const navigate = useNavigate()
  const { login, isLoading } = useAuthStore()
  const [showPassword, setShowPassword] = useState(false)
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UserLogin>()

  const onSubmit = async (data: UserLogin) => {
    try {
      await login(data)
      toast.success('¡Bienvenido de vuelta!')
      navigate('/dashboard')
    } catch (error) {
      // Error is handled by the API interceptor
    }
  }

  return (
    <div className="w-full">
      {/* Logo */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center">
          <TrendingUp className="w-7 h-7 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Finance Tracker</h1>
          <p className="text-sm text-gray-400">Gestión inteligente de finanzas</p>
        </div>
      </div>

      {/* Form */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <h2 className="text-3xl font-bold text-white mb-2">Iniciar Sesión</h2>
        <p className="text-gray-400 mb-8">
          ¿No tienes cuenta?{' '}
          <Link to="/register" className="text-primary-500 hover:text-primary-400 font-medium">
            Regístrate aquí
          </Link>
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Username/Email */}
          <div>
            <label htmlFor="username" className="label">
              Usuario o Email
            </label>
            <input
              id="username"
              type="text"
              autoComplete="username"
              className={cn('input', errors.username && 'input-error')}
              placeholder="juan123 o juan@example.com"
              {...register('username', {
                required: 'Este campo es requerido',
              })}
            />
            {errors.username && (
              <p className="mt-1 text-sm text-red-500">{errors.username.message}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="label">
              Contraseña
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                className={cn('input pr-10', errors.password && 'input-error')}
                placeholder="••••••••"
                {...register('password', {
                  required: 'Este campo es requerido',
                })}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300"
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1 text-sm text-red-500">{errors.password.message}</p>
            )}
          </div>

          {/* Remember me & Forgot password */}
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                className="w-4 h-4 rounded border-gray-600 bg-transparent text-primary-500 focus:ring-primary-500 focus:ring-offset-0"
              />
              <span className="text-sm text-gray-400">Recordarme</span>
            </label>
            <Link
              to="/forgot-password"
              className="text-sm text-primary-500 hover:text-primary-400"
            >
              ¿Olvidaste tu contraseña?
            </Link>
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Iniciando sesión...</span>
              </>
            ) : (
              <>
                <LogIn className="w-5 h-5" />
                <span>Iniciar Sesión</span>
              </>
            )}
          </button>
        </form>

        {/* Demo accounts */}
        <div className="mt-8 p-4 rounded-lg bg-primary-500/10 border border-primary-500/20">
          <p className="text-sm font-medium text-primary-400 mb-2">Cuentas de demostración:</p>
          <div className="space-y-1 text-xs text-gray-400">
            <p>👤 <span className="text-gray-300">juan</span> / juan123</p>
            <p>👤 <span className="text-gray-300">maria</span> / maria123</p>
            <p>👑 <span className="text-gray-300">admin</span> / admin123</p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default Login