import os
from sqlalchemy import create_engine, Column, String, Integer, Float, ForeignKey, JSON, Boolean
from sqlalchemy.orm import DeclarativeBase, sessionmaker, relationship
from typing import Optional, List

# SQLite database file
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./kitchen.db")

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

class Base(DeclarativeBase):
    pass

class RecipeModel(Base):
    __tablename__ = "recipes"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    cuisine = Column(String, nullable=False)
    required_equipment = Column(JSON, nullable=False) # List[str]
    ingredients = Column(JSON, nullable=False) # List[str]
    base_cost_per_serving = Column(Float, nullable=False)
    image_url = Column(String, nullable=True)
    
    # Nutrition fields
    calories = Column(Integer, nullable=False)
    protein_g = Column(Integer, nullable=False)
    carbs_g = Column(Integer, nullable=False)
    fat_g = Column(Integer, nullable=False)

    steps = relationship("RecipeStepModel", back_populates="recipe", cascade="all, delete-orphan")

class RecipeStepModel(Base):
    __tablename__ = "recipe_steps"

    id = Column(Integer, primary_key=True, index=True)
    recipe_id = Column(String, ForeignKey("recipes.id"), nullable=False)
    number = Column(Integer, nullable=False)
    text = Column(String, nullable=False)
    duration_minutes = Column(Integer, nullable=True)

    recipe = relationship("RecipeModel", back_populates="steps")

class PantryItemModel(Base):
    __tablename__ = "pantry_items"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)

class FeedbackModel(Base):
    __tablename__ = "feedback"

    id = Column(Integer, primary_key=True, index=True)
    recipe_id = Column(String, ForeignKey("recipes.id"), nullable=False)
    liked = Column(Boolean, nullable=False)
    notes = Column(String, nullable=True)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
