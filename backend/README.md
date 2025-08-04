# Finance Tracker Backend

API REST para gestión de finanzas personales construida con FastAPI.

## 🚀 Inicio Rápido

### 1. Activar entorno virtual

```bash
# Windows
.venv\Scripts\activate

# Mac/Linux
source .venv/bin/activate
```

### 2. Instalar dependencias

```bash
pip install -r requirements.txt
```

### 3. Inicializar base de datos

```bash
python init_db.py
```

### 4. Crear usuarios de prueba (opcional)

```bash
python create_test_user.py
```

### 5. Ejecutar servidor

```bash
uvicorn app.main:app --reload
```

El servidor estará disponible en: http://localhost:8000

## 📚 Documentación

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## 🔑 Usuarios de Prueba

| Usuario | Email              | Contraseña | Rol            |
| ------- | ------------------ | ---------- | -------------- |
| admin   | admin@example.com  | admin123   | Superusuario   |
| juan    | juan@example.com   | juan123    | Usuario normal |
| maria   | maria@example.com  | maria123   | Usuario normal |
| carlos  | carlos@example.com | carlos123  | Usuario normal |
| ana     | ana@example.com    | ana123     | Usuario normal |

## 🛠️ Estructura de la API

### Autenticación

- `POST /api/v1/auth/register` - Registrar nuevo usuario
- `POST /api/v1/auth/login` - Iniciar sesión
- `GET /api/v1/auth/me` - Obtener usuario actual

### Usuarios

- `GET /api/v1/users/` - Listar usuarios (solo admin)
- `GET /api/v1/users/{id}` - Obtener usuario
- `PUT /api/v1/users/{id}` - Actualizar usuario
- `DELETE /api/v1/users/{id}` - Eliminar usuario (solo admin)

### Ingresos

- `GET /api/v1/incomes/` - Listar ingresos
- `GET /api/v1/incomes/stats` - Estadísticas de ingresos
- `GET /api/v1/incomes/{id}` - Obtener ingreso
- `POST /api/v1/incomes/` - Crear ingreso
- `PUT /api/v1/incomes/{id}` - Actualizar ingreso
- `DELETE /api/v1/incomes/{id}` - Eliminar ingreso

## 🔒 Seguridad

- Autenticación con JWT
- Contraseñas hasheadas con bcrypt
- CORS configurado para desarrollo local

## 🐛 Solución de Problemas

### Error de Python 3.13

Si tienes problemas con las dependencias en Python 3.13, asegúrate de usar las versiones actualizadas en requirements.txt.

### Base de datos

La base de datos SQLite se crea automáticamente en `finance_tracker.db`.

### Tokens JWT

Los tokens tienen una duración de 30 días por defecto. Puedes cambiar esto en `.env`.

## 🚧 Próximos Pasos

1. Completar routers de gastos, objetivos e inversiones
2. Agregar validaciones adicionales
3. Implementar tests
4. Configurar logging
5. Agregar rate limiting
