from backend.database import engine, Base

def upgrade_db():
    # Create new tables (like pantry_items) if they don't exist
    Base.metadata.create_all(bind=engine)
    print("Database schema updated.")

if __name__ == "__main__":
    upgrade_db()
