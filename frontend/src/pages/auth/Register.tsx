import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { motion } from 'framer-motion'
import { Eye, EyeOff, UserPlus, TrendingUp, Check, X } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { useAuthStore } from '@stores/authStore'
import { UserCreate } from '@types'
import { cn, isValidEmail } from '@utils'

interface RegisterForm extends UserCreate {
  confirmPassword: string
}

const Register = () => {
  const navigate = useNavigate()
  const { register: registerUser, isLoading } = useAuthStore()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterForm>()

  const password = watch('password')

  const passwordRequirements = [
    { regex: /.{6,}/, text: 'Al menos 6 caracteres' },
    { regex: /[A-Z]/, text: 'Una letra mayúscula' },
    { regex: /[a-z]/, text: 'Una letra minúscula' },
    { regex: /\d/, text: 'Un número' },
  ]

  const checkPasswordStrength = (password: string) => {
    return passwordRequirements.map(req => ({
      ...req,
      met: req.regex.test(password || '')
    }))
  }

  const onSubmit = async (data: RegisterForm) => {
    try {
      const { confirmPassword, ...userData } = data
      await registerUser(userData)
      toast.success('¡Cuenta creada exitosamente!')
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
        <h2 className="text-3xl font-bold text-white mb-2">Crear Cuenta</h2>
        <p className="text-gray-400 mb-8">
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" className="text-primary-500 hover:text-primary-400 font-medium">
            Inicia sesión aquí
          </Link>
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Full Name */}
          <div>
            <label htmlFor="full_name" className="label">
              Nombre Completo
            </label>
            <input
              id="full_name"
              type="text"
              autoComplete="name"
              className={cn('input', errors.full_name && 'input-error')}
              placeholder="Juan Pérez"
              {...register('full_name', {
                required: 'Este campo es requerido',
                minLength: {
                  value: 2,
                  message: 'El nombre debe tener al menos 2 caracteres'
                }
              })}
            />
            {errors.full_name && (
              <p className="mt-1 text-sm text-red-500">{errors.full_name.message}</p>
            )}
          </div>

          {/* Username */}
          <div>
            <label htmlFor="username" className="label">
              Nombre de Usuario
            </label>
            <input
              id="username"
              type="text"
              autoComplete="username"
              className={cn('input', errors.username && 'input-error')}
              placeholder="juan123"
              {...register('username', {
                required: 'Este campo es requerido',
                minLength: {
                  value: 3,
                  message: 'El usuario debe tener al menos 3 caracteres'
                },
                pattern: {
                  value: /^[a-zA-Z0-9]+$/,
                  message: 'Solo se permiten letras y números'
                }
              })}
            />
            {errors.username && (
              <p className="mt-1 text-sm text-red-500">{errors.username.message}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="label">
              Correo Electrónico
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              className={cn('input', errors.email && 'input-error')}
              placeholder="juan@example.com"
              {...register('email', {
                required: 'Este campo es requerido',
                validate: (value) => isValidEmail(value) || 'Email inválido'
              })}
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>
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
                autoComplete="new-password"
                className={cn('input pr-10', errors.password && 'input-error')}
                placeholder="••••••••"
                {...register('password', {
                  required: 'Este campo es requerido',
                  minLength: {
                    value: 6,
                    message: 'La contraseña debe tener al menos 6 caracteres'
                  }
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
            
            {/* Password strength indicator */}
            {password && (
              <div className="mt-2 space-y-1">
                {checkPasswordStrength(password).map((req, index) => (
                  <div key={index} className="flex items-center gap-2 text-xs">
                    {req.met ? (
                      <Check className="w-3 h-3 text-green-500" />
                    ) : (
                      <X className="w-3 h-3 text-gray-500" />
                    )}
                    <span className={cn(
                      "transition-colors",
                      req.met ? "text-green-500" : "text-gray-500"
                    )}>
                      {req.text}
                    </span>
                  </div>
                ))}
              </div>
            )}
            
            {errors.password && (
              <p className="mt-1 text-sm text-red-500">{errors.password.message}</p>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label htmlFor="confirmPassword" className="label">
              Confirmar Contraseña
            </label>
            <div className="relative">
              <input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                autoComplete="new-password"
                className={cn('input pr-10', errors.confirmPassword && 'input-error')}
                placeholder="••••••••"
                {...register('confirmPassword', {
                  required: 'Este campo es requerido',
                  validate: value => value === password || 'Las contraseñas no coinciden'
                })}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300"
              >
                {showConfirmPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="mt-1 text-sm text-red-500">{errors.confirmPassword.message}</p>
            )}
          </div>

          {/* Terms and conditions */}
          <div className="flex items-start gap-2">
            <input
              type="checkbox"
              id="terms"
              className="w-4 h-4 mt-0.5 rounded border-gray-600 bg-transparent text-primary-500 focus:ring-primary-500 focus:ring-offset-0"
              {...register('terms', {
                required: 'Debes aceptar los términos y condiciones'
              })}
            />
            <label htmlFor="terms" className="text-sm text-gray-400">
              Acepto los{' '}
              <Link to="/terms" className="text-primary-500 hover:text-primary-400">
                términos y condiciones
              </Link>{' '}
              y la{' '}
              <Link to="/privacy" className="text-primary-500 hover:text-primary-400">
                política de privacidad
              </Link>
            </label>
          </div>
          {errors.terms && (
            <p className="text-sm text-red-500">{errors.terms.message}</p>
          )}

          {/* Submit button */}
          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Creando cuenta...</span>
              </>
            ) : (
              <>
                <UserPlus className="w-5 h-5" />
                <span>Crear Cuenta</span>
              </>
            )}
          </button>
        </form>
      </motion.div>
    </div>
  )
}

export default Register