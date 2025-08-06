# 💰 Finance Tracker

Plataforma web completa para la gestión de finanzas personales con seguimiento de ingresos, gastos, objetivos de ahorro e inversiones con datos en tiempo real.

![Finance Tracker](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Python](https://img.shields.io/badge/python-3.11+-green.svg)
![React](https://img.shields.io/badge/react-18.2+-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

## 🌟 Características Principales

- **📊 Dashboard Inteligente**: Vista general con métricas en tiempo real y alertas automáticas
- **💵 Gestión de Ingresos**: Múltiples fuentes con categorización automática
- **💳 Control de Gastos**: Categorías personalizables y análisis detallado
- **🎯 Objetivos de Ahorro**: Seguimiento visual del progreso con metas personalizadas
- **📈 Portfolio de Inversiones**: Precios en tiempo real y cálculo automático de rendimiento
- **🔐 Seguridad**: Autenticación JWT y encriptación de datos
- **🌙 Tema Oscuro**: Interfaz moderna y futurista

## 🏗️ Arquitectura

```
finance-tracker/
├── backend/           # API REST con FastAPI
│   ├── app/          # Código principal
│   │   ├── models/   # Modelos SQLAlchemy
│   │   ├── routers/  # Endpoints API
│   │   ├── schemas/  # Schemas Pydantic
│   │   └── utils/    # Utilidades
│   └── tests/        # Tests
├── frontend/         # SPA con React + TypeScript
│   ├── src/
│   │   ├── components/  # Componentes React
│   │   ├── pages/      # Páginas principales
│   │   ├── services/   # Servicios API
│   │   ├── stores/     # Estado global (Zustand)
│   │   └── utils/      # Utilidades
│   └── public/         # Archivos estáticos
└── docs/              # Documentación
```

## 🚀 Inicio Rápido

### Requisitos Previos

- Python 3.11+
- Node.js 18+
- Git

### 1. Clonar el Repositorio

```bash
git clone https://github.com/tu-usuario/finance-tracker.git
cd finance-tracker
```

### 2. Configurar el Backend

```bash
# Entrar al directorio backend
cd backend

# Crear entorno virtual
python -m venv .venv

# Activar entorno virtual
# Windows
.venv\Scripts\activate
# Mac/Linux
source .venv/bin/activate

# Instalar dependencias
pip install -r requirements.txt

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus configuraciones

# Inicializar base de datos
python init_db.py

# Crear usuarios de prueba
python create_test_user.py

# (Opcional) Crear datos de ejemplo
python create_sample_data.py

# Ejecutar servidor
uvicorn app.main:app --reload
```

El backend estará disponible en http://localhost:8000

### 3. Configurar el Frontend

En una nueva terminal:

```bash
# Entrar al directorio frontend
cd frontend

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env

# Ejecutar servidor de desarrollo
npm run dev
```

El frontend estará disponible en http://localhost:5173

## 📚 Documentación API

Una vez ejecutando el backend, puedes acceder a:

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## 🔑 Usuarios de Demostración

| Usuario | Email | Contraseña | Rol |
|---------|-------|------------|-----|
| admin | admin@example.com | admin123 | Administrador |
| juan | juan@example.com | juan123 | Usuario normal |
| maria | maria@example.com | maria123 | Usuario normal |

## 🛠️ Stack Tecnológico

### Backend
- **FastAPI** - Framework web moderno y rápido
- **SQLAlchemy** - ORM para base de datos
- **Pydantic** - Validación de datos
- **JWT** - Autenticación
- **yfinance** - Datos financieros en tiempo real
- **SQLite** - Base de datos (desarrollo)

### Frontend
- **React 18** - Librería UI
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Estilos
- **Zustand** - Gestión de estado
- **React Query** - Gestión de datos del servidor
- **Recharts** - Gráficos y visualizaciones
- **Framer Motion** - Animaciones

## 📱 Capturas de Pantalla

### Dashboard
Vista general con métricas clave y alertas inteligentes.

### Gestión de Gastos
Control detallado por categorías con análisis visual.

### Objetivos de Ahorro
Seguimiento del progreso con contribuciones flexibles.

### Portfolio de Inversiones
Datos en tiempo real con cálculo automático de rendimiento.

## 🔧 Configuración Avanzada

### Variables de Entorno Backend

```env
# Seguridad
SECRET_KEY=tu-clave-secreta-super-segura
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=43200

# Base de datos
DATABASE_URL=sqlite:///./finance_tracker.db

# CORS
BACKEND_CORS_ORIGINS=["http://localhost:3000","http://localhost:5173"]
```

### Variables de Entorno Frontend

```env
# API
VITE_API_URL=http://localhost:8000/api/v1

# Configuración
VITE_DEFAULT_CURRENCY=EUR
VITE_DEFAULT_THEME=dark
```

## 🧪 Testing

### Backend
```bash
cd backend
pytest
```

### Frontend
```bash
cd frontend
npm run test
```

## 📦 Despliegue

### Backend (con Docker)
```bash
docker build -t finance-tracker-backend ./backend
docker run -p 8000:8000 finance-tracker-backend
```

### Frontend (con Vercel/Netlify)
```bash
cd frontend
npm run build
# Subir carpeta 'dist' a tu servicio de hosting
```

## 🤝 Contribuir

1. Fork el proyecto
2. Crea tu rama de características (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 🐛 Reporte de Bugs

Si encuentras un bug, por favor abre un issue con:
- Descripción del problema
- Pasos para reproducirlo
- Comportamiento esperado
- Capturas de pantalla (si aplica)

## 📈 Roadmap

- [ ] Exportación de datos (CSV/PDF)
- [ ] Modo offline
- [ ] App móvil (React Native)
- [ ] Integración bancaria
- [ ] Análisis predictivo con IA
- [ ] Modo multiusuario/familiar
- [ ] Criptomonedas DeFi
- [ ] Notificaciones push

## 📄 Licencia

Este proyecto está bajo la licencia MIT. Ver el archivo [LICENSE](LICENSE) para más detalles.

## 👥 Autores

- **Tu Nombre** - *Desarrollo inicial* - [tu-github](https://github.com/tu-usuario)

## 🙏 Agradecimientos

- FastAPI por el excelente framework
- React Team por React 18
- Todos los contribuidores de código abierto

---

<p align="center">
  Hecho con ❤️ y ☕
</p>