# Finance Tracker Frontend

Frontend moderno para la aplicación de gestión de finanzas personales, construido con React, TypeScript y Tailwind CSS.

## 🚀 Tecnologías

- **React 18** - Librería UI
- **TypeScript** - Type safety
- **Vite** - Build tool ultrarrápido
- **Tailwind CSS** - Estilos utility-first
- **React Router v6** - Enrutamiento
- **Zustand** - Gestión de estado
- **React Query** - Gestión de datos del servidor
- **React Hook Form** - Formularios
- **Recharts** - Gráficos y visualizaciones
- **Axios** - Cliente HTTP
- **date-fns** - Utilidades de fecha
- **Framer Motion** - Animaciones
- **Lucide React** - Iconos

## 📋 Requisitos Previos

- Node.js 18+
- npm o yarn
- Backend API ejecutándose en http://localhost:8000

## 🛠️ Instalación

1. **Clonar el repositorio**

```bash
git clone <repo-url>
cd finance-tracker/frontend
```

2. **Instalar dependencias**

```bash
npm install
```

3. **Configurar variables de entorno**

```bash
cp .env.example .env
```

4. **Iniciar servidor de desarrollo**

```bash
npm run dev
```

La aplicación estará disponible en http://localhost:5173

## 📁 Estructura del Proyecto

```
frontend/
├── src/
│   ├── assets/          # Archivos estáticos
│   ├── components/      # Componentes reutilizables
│   │   ├── auth/       # Componentes de autenticación
│   │   ├── common/     # Componentes comunes (botones, inputs, etc)
│   │   ├── dashboard/  # Componentes del dashboard
│   │   ├── layouts/    # Layouts de la aplicación
│   │   └── charts/     # Componentes de gráficos
│   ├── hooks/          # Custom hooks
│   ├── pages/          # Páginas/vistas principales
│   ├── services/       # Servicios de API
│   ├── stores/         # Stores de Zustand
│   ├── types/          # Tipos de TypeScript
│   ├── utils/          # Utilidades y helpers
│   ├── App.tsx         # Componente principal
│   ├── main.tsx        # Punto de entrada
│   └── index.css       # Estilos globales
├── public/             # Archivos públicos
├── .env.example        # Variables de entorno de ejemplo
├── index.html          # HTML principal
├── package.json        # Dependencias
├── tailwind.config.js  # Configuración de Tailwind
├── tsconfig.json       # Configuración de TypeScript
└── vite.config.ts      # Configuración de Vite
```

## 🎨 Características Principales

### Dashboard

- Vista general de finanzas con métricas clave
- Gráficos interactivos de flujo de caja
- Alertas inteligentes
- Transacciones recientes

### Gestión de Ingresos

- Registro de múltiples fuentes de ingreso
- Categorización automática
- Estadísticas y tendencias

### Control de Gastos

- Categorías predefinidas y personalizables
- Gastos recurrentes
- Análisis por categoría y vendor

### Objetivos de Ahorro

- Seguimiento visual del progreso
- Cálculo de contribución mensual
- Priorización de objetivos

### Portfolio de Inversiones

- Precios en tiempo real
- Cálculo automático de rendimiento
- Gráficos históricos
- Gestión de ventas parciales

## 🔧 Scripts Disponibles

```bash
# Desarrollo
npm run dev          # Iniciar servidor de desarrollo

# Build
npm run build        # Construir para producción
npm run preview      # Preview del build

# Linting
npm run lint         # Ejecutar ESLint

# Type checking
npm run type-check   # Verificar tipos de TypeScript
```

## 🎯 Guía de Desarrollo

### Crear un nuevo componente

```tsx
// src/components/common/MyComponent.tsx
import { FC } from "react";
import { cn } from "@utils";

interface MyComponentProps {
  className?: string;
  // ... otras props
}

const MyComponent: FC<MyComponentProps> = ({ className, ...props }) => {
  return <div className={cn("base-styles", className)}>{/* Contenido */}</div>;
};

export default MyComponent;
```

### Crear un custom hook

```tsx
// src/hooks/useCustomHook.ts
import { useState, useEffect } from "react";

export function useCustomHook() {
  const [state, setState] = useState();

  useEffect(() => {
    // Lógica del hook
  }, []);

  return { state };
}
```

### Añadir una nueva página

1. Crear el componente en `src/pages/`
2. Añadir la ruta en `src/App.tsx`
3. Añadir el link en la navegación

## 🔐 Autenticación

La aplicación usa JWT para autenticación:

- Los tokens se almacenan en localStorage
- Las rutas protegidas requieren autenticación
- El token se incluye automáticamente en las peticiones API

## 🌙 Tema Oscuro

La aplicación soporta tema oscuro por defecto:

- Se puede cambiar manualmente
- Respeta la preferencia del sistema
- Los estilos están optimizados para ambos temas

## 📱 Responsive Design

- Mobile first approach
- Breakpoints de Tailwind CSS
- Componentes adaptables
- Navegación móvil optimizada

## 🚀 Despliegue

### Build de producción

```bash
npm run build
```

Los archivos de producción se generan en `dist/`

### Variables de entorno de producción

Asegúrate de configurar las variables correctas:

- `VITE_API_URL` - URL de la API de producción

## 🐛 Solución de Problemas

### El servidor de desarrollo no inicia

- Verifica que el puerto 5173 esté disponible
- Elimina `node_modules` y reinstala

### Errores de CORS

- Asegúrate de que el backend esté configurado correctamente
- Verifica la configuración del proxy en `vite.config.ts`

### Los estilos no se aplican

- Verifica que Tailwind esté importado en `index.css`
- Revisa la configuración de `tailwind.config.js`

## 📚 Recursos

- [React Documentation](https://react.dev)
- [TypeScript Documentation](https://www.typescriptlang.org)
- [Tailwind CSS Documentation](https://tailwindcss.com)
- [Vite Documentation](https://vitejs.dev)
- [Zustand Documentation](https://github.com/pmndrs/zustand)
- [React Query Documentation](https://tanstack.com/query)

## 🤝 Contribuir

1. Fork el proyecto
2. Crea tu rama de feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la licencia MIT.
