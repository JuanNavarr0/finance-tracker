"""
Script para crear usuarios de prueba
"""
from sqlalchemy.orm import Session
from app.database import SessionLocal, engine
from app.models import User
from app.utils.auth import get_password_hash
from datetime import datetime

def create_test_users():
    """Crea usuarios de prueba para desarrollo"""
    db = SessionLocal()
    
    # Datos de usuarios de prueba
    test_users = [
        {
            "email": "admin@example.com",
            "username": "admin",
            "full_name": "Administrador",
            "password": "admin123",
            "is_superuser": True,
            "is_active": True
        },
        {
            "email": "juan@example.com",
            "username": "juan",
            "full_name": "Juan Navarro",
            "password": "juan123",
            "is_superuser": False,
            "is_active": True
        },
        {
            "email": "maria@example.com",
            "username": "maria",
            "full_name": "María García",
            "password": "maria123",
            "is_superuser": False,
            "is_active": True
        },
        {
            "email": "carlos@example.com",
            "username": "carlos",
            "full_name": "Carlos López",
            "password": "carlos123",
            "is_superuser": False,
            "is_active": True
        },
        {
            "email": "ana@example.com",
            "username": "ana",
            "full_name": "Ana Martínez",
            "password": "ana123",
            "is_superuser": False,
            "is_active": True
        }
    ]
    
    created_users = []
    
    for user_data in test_users:
        # Verificar si el usuario ya existe
        existing_user = db.query(User).filter(
            (User.email == user_data["email"]) | 
            (User.username == user_data["username"])
        ).first()
        
        if existing_user:
            print(f"⚠️  Usuario {user_data['username']} ya existe")
            continue
        
        # Crear nuevo usuario
        password = user_data.pop("password")
        db_user = User(
            **user_data,
            hashed_password=get_password_hash(password)
        )
        
        db.add(db_user)
        created_users.append(user_data["username"])
    
    # Guardar cambios
    db.commit()
    db.close()
    
    print("\n✅ Usuarios creados exitosamente:")
    for username in created_users:
        print(f"   - {username}")
    
    print("\n📝 Credenciales de acceso:")
    print("   Admin: admin@example.com / admin123")
    print("   Juan: juan@example.com / juan123")
    print("   María: maria@example.com / maria123")
    print("   Carlos: carlos@example.com / carlos123")
    print("   Ana: ana@example.com / ana123")

if __name__ == "__main__":
    print("🔨 Creando usuarios de prueba...")
    create_test_users()