import { FC, useState } from 'react'
import { motion } from 'framer-motion'
import { 
  User, 
  Mail, 
  Lock,
  Save,
  Camera,
  Shield,
  Bell,
  Palette,
  Globe,
  CreditCard,
  LogOut,
  AlertCircle,
  Check
} from 'lucide-react'
import { useForm } from 'react-hook-form'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@stores/authStore'
import authService from '@services/auth.service'
import { Card, Modal } from '@components/common'
import { cn, getInitials, generateColor } from '@utils'

// Profile Form Component
interface ProfileFormData {
  full_name: string
  email: string
  username: string
}

const ProfileForm: FC = () => {
  const { user, updateUser } = useAuthStore()
  const [isEditing, setIsEditing] = useState(false)
  
  const { register, handleSubmit, reset, formState: { errors, isDirty } } = useForm<ProfileFormData>({
    defaultValues: {
      full_name: user?.full_name || '',
      email: user?.email || '',
      username: user?.username || ''
    }
  })

  const updateMutation = useMutation({
    mutationFn: (data: ProfileFormData) => authService.updateProfile(user!.id, data),
    onSuccess: (updatedUser) => {
      updateUser(updatedUser)
      toast.success('Perfil actualizado exitosamente')
      setIsEditing(false)
      reset(updatedUser)
    }
  })

  const handleCancel = () => {
    reset()
    setIsEditing(false)
  }

  const onSubmit = (data: ProfileFormData) => {
    updateMutation.mutate(data)
  }

  if (!user) return null

  return (
    <Card>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-white">Información Personal</h2>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="btn-secondary btn-sm"
          >
            Editar
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Avatar */}
        <div className="flex items-center gap-4 mb-6">
          <div 
            className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold text-white relative group cursor-pointer"
            style={{ backgroundColor: generateColor(user.username) }}
          >
            {getInitials(user.full_name || user.username)}
            <div className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Camera className="w-6 h-6 text-white" />
            </div>
          </div>
          <div>
            <p className="text-lg font-medium text-white">{user.full_name || user.username}</p>
            <p className="text-sm text-gray-400">Miembro desde {new Date(user.created_at).toLocaleDateString('es-ES')}</p>
          </div>
        </div>

        {/* Form fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="full_name" className="label">Nombre Completo</label>
            <input
              id="full_name"
              type="text"
              className={cn('input', errors.full_name && 'input-error')}
              disabled={!isEditing}
              {...register('full_name', {
                required: 'Este campo es requerido',
                minLength: { value: 2, message: 'Mínimo 2 caracteres' }
              })}
            />
            {errors.full_name && (
              <p className="mt-1 text-sm text-red-500">{errors.full_name.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="username" className="label">Nombre de Usuario</label>
            <input
              id="username"
              type="text"
              className={cn('input', errors.username && 'input-error')}
              disabled={!isEditing}
              {...register('username', {
                required: 'Este campo es requerido',
                minLength: { value: 3, message: 'Mínimo 3 caracteres' },
                pattern: {
                  value: /^[a-zA-Z0-9]+$/,
                  message: 'Solo letras y números'
                }
              })}
            />
            {errors.username && (
              <p className="mt-1 text-sm text-red-500">{errors.username.message}</p>
            )}
          </div>
        </div>

        <div>
          <label htmlFor="email" className="label">Correo Electrónico</label>
          <input
            id="email"
            type="email"
            className={cn('input', errors.email && 'input-error')}
            disabled={!isEditing}
            {...register('email', {
              required: 'Este campo es requerido',
              pattern: {
                value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                message: 'Email inválido'
              }
            })}
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>
          )}
        </div>

        {/* Actions */}
        {isEditing && (
          <div className="flex gap-3 justify-end pt-4">
            <button
              type="button"
              onClick={handleCancel}
              className="btn-secondary"
              disabled={updateMutation.isLoading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn-primary flex items-center gap-2"
              disabled={updateMutation.isLoading || !isDirty}
            >
              <Save className="w-4 h-4" />
              {updateMutation.isLoading ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        )}
      </form>
    </Card>
  )
}

// Password Change Form
interface PasswordFormData {
  current_password: string
  new_password: string
  confirm_password: string
}

const PasswordForm: FC = () => {
  const { user } = useAuthStore()
  const [showModal, setShowModal] = useState(false)
  
  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm<PasswordFormData>()

  const newPassword = watch('new_password')

  const passwordMutation = useMutation({
    mutationFn: (data: PasswordFormData) => 
      authService.changePassword(user!.id, data.current_password, data.new_password),
    onSuccess: () => {
      toast.success('Contraseña actualizada exitosamente')
      setShowModal(false)
      reset()
    }
  })

  const onSubmit = (data: PasswordFormData) => {
    passwordMutation.mutate(data)
  }

  const passwordRequirements = [
    { regex: /.{6,}/, text: 'Al menos 6 caracteres' },
    { regex: /[A-Z]/, text: 'Una letra mayúscula' },
    { regex: /[a-z]/, text: 'Una letra minúscula' },
    { regex: /\d/, text: 'Un número' },
  ]

  return (
    <>
      <Card>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center">
              <Lock className="w-5 h-5 text-yellow-500" />
            </div>
            <div>
              <h3 className="font-medium text-white">Contraseña</h3>
              <p className="text-sm text-gray-400">Gestiona tu contraseña de acceso</p>
            </div>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="btn-secondary btn-sm"
          >
            Cambiar
          </button>
        </div>
      </Card>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Cambiar Contraseña"
        size="md"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label htmlFor="current_password" className="label">Contraseña Actual</label>
            <input
              id="current_password"
              type="password"
              className={cn('input', errors.current_password && 'input-error')}
              {...register('current_password', {
                required: 'Este campo es requerido'
              })}
            />
            {errors.current_password && (
              <p className="mt-1 text-sm text-red-500">{errors.current_password.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="new_password" className="label">Nueva Contraseña</label>
            <input
              id="new_password"
              type="password"
              className={cn('input', errors.new_password && 'input-error')}
              {...register('new_password', {
                required: 'Este campo es requerido',
                minLength: { value: 6, message: 'Mínimo 6 caracteres' }
              })}
            />
            {newPassword && (
              <div className="mt-2 space-y-1">
                {passwordRequirements.map((req, index) => {
                  const isMet = req.regex.test(newPassword)
                  return (
                    <div key={index} className="flex items-center gap-2 text-xs">
                      {isMet ? (
                        <Check className="w-3 h-3 text-green-500" />
                      ) : (
                        <div className="w-3 h-3 rounded-full border border-gray-500" />
                      )}
                      <span className={cn(
                        "transition-colors",
                        isMet ? "text-green-500" : "text-gray-500"
                      )}>
                        {req.text}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
            {errors.new_password && (
              <p className="mt-1 text-sm text-red-500">{errors.new_password.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="confirm_password" className="label">Confirmar Nueva Contraseña</label>
            <input
              id="confirm_password"
              type="password"
              className={cn('input', errors.confirm_password && 'input-error')}
              {...register('confirm_password', {
                required: 'Este campo es requerido',
                validate: value => value === newPassword || 'Las contraseñas no coinciden'
              })}
            />
            {errors.confirm_password && (
              <p className="mt-1 text-sm text-red-500">{errors.confirm_password.message}</p>
            )}
          </div>

          <div className="flex gap-3 justify-end pt-4">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="btn-secondary"
              disabled={passwordMutation.isLoading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={passwordMutation.isLoading}
            >
              {passwordMutation.isLoading ? 'Actualizando...' : 'Cambiar Contraseña'}
            </button>
          </div>
        </form>
      </Modal>
    </>
  )
}

// Settings Options
const SettingsOptions: FC = () => {
  const navigate = useNavigate()
  const { logout } = useAuthStore()

  const handleLogout = () => {
    if (confirm('¿Estás seguro de que quieres cerrar sesión?')) {
      logout()
      navigate('/login')
    }
  }

  const settings = [
    {
      icon: Bell,
      title: 'Notificaciones',
      description: 'Configura tus preferencias de notificación',
      color: 'blue',
      action: () => toast.info('Configuración de notificaciones próximamente')
    },
    {
      icon: Palette,
      title: 'Apariencia',
      description: 'Personaliza el tema y colores',
      color: 'purple',
      action: () => toast.info('Personalización de tema próximamente')
    },
    {
      icon: Globe,
      title: 'Idioma y Región',
      description: 'Configura tu idioma y formato regional',
      color: 'green',
      action: () => toast.info('Configuración regional próximamente')
    },
    {
      icon: CreditCard,
      title: 'Suscripción',
      description: 'Gestiona tu plan y método de pago',
      color: 'yellow',
      action: () => toast.info('Gestión de suscripción próximamente')
    },
    {
      icon: Shield,
      title: 'Privacidad y Seguridad',
      description: 'Controla tu información y seguridad',
      color: 'red',
      action: () => toast.info('Configuración de privacidad próximamente')
    }
  ]

  const colorClasses = {
    blue: 'bg-blue-500/20 text-blue-500',
    purple: 'bg-purple-500/20 text-purple-500',
    green: 'bg-green-500/20 text-green-500',
    yellow: 'bg-yellow-500/20 text-yellow-500',
    red: 'bg-red-500/20 text-red-500'
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-white mb-4">Configuración</h2>
      
      {settings.map((setting) => (
        <Card
          key={setting.title}
          hover
          onClick={setting.action}
          className="cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-10 h-10 rounded-lg flex items-center justify-center",
                colorClasses[setting.color as keyof typeof colorClasses]
              )}>
                <setting.icon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-medium text-white">{setting.title}</h3>
                <p className="text-sm text-gray-400">{setting.description}</p>
              </div>
            </div>
            <div className="text-gray-400">
              →
            </div>
          </div>
        </Card>
      ))}

      {/* Danger Zone */}
      <Card className="border-red-500/20 mt-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <h3 className="font-medium text-white">Zona de Peligro</h3>
              <p className="text-sm text-gray-400">Acciones irreversibles</p>
            </div>
          </div>
        </div>
        
        <div className="mt-4 pt-4 border-t border-dark-border space-y-3">
          <button
            onClick={handleLogout}
            className="btn-danger w-full flex items-center justify-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            Cerrar Sesión
          </button>
          <button
            className="btn-ghost w-full text-red-500 hover:bg-red-500/10"
            onClick={() => toast.error('Contacta con soporte para eliminar tu cuenta')}
          >
            Eliminar Cuenta
          </button>
        </div>
      </Card>
    </div>
  )
}

// Main Profile Page
const Profile: FC = () => {
  const { user } = useAuthStore()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Mi Perfil</h1>
        <p className="text-gray-400 mt-1">
          Gestiona tu información personal y configuración
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          <ProfileForm />
          <PasswordForm />
        </div>

        {/* Sidebar */}
        <div>
          <SettingsOptions />
        </div>
      </div>
    </div>
  )
}

export default Profile