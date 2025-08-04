"""
Script para inicializar la base de datos con tablas y datos de ejemplo
"""
from app.database import Base, engine
from app.models import *  # Importa todos los modelos

def init_database():
    """Crea todas las tablas en la base de datos"""
    print("🔨 Creando tablas en la base de datos...")
    Base.metadata.create_all(bind=engine)
    print("✅ Tablas creadas exitosamente!")
    
    print("\n📊 Tablas creadas:")
    for table in Base.metadata.sorted_tables:
        print(f"  - {table.name}")

if __name__ == "__main__":
    init_database()