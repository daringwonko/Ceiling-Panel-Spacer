"""
BuildScale Database Initialization and Seed Data
"""

import sys
import os
from pathlib import Path

# Add project root to Python path
project_root = Path(__file__).parent
sys.path.insert(0, str(project_root))

from src.core.database.session import create_database, reset_database, get_db
from src.core.database.models import Material
from sqlalchemy.orm import Session


def seed_materials(db: Session):
    """Seed the database with common ceiling materials"""
    materials_data = [
        {
            "name": "standard_tiles",
            "type": "ceiling_panel",
            "density_kg_per_cubic_m": 780,  # Standard gypsum density
            "cost_per_sqm": 15.50,
            "thickness_mm": 12,
            "description": "Standard 12mm gypsum ceiling tiles",
            "supplier": "Generic Supplier",
        },
        {
            "name": "premium_tiles",
            "type": "ceiling_panel",
            "density_kg_per_cubic_m": 850,
            "cost_per_sqm": 22.75,
            "thickness_mm": 15,
            "description": "Premium 15mm acoustic ceiling tiles",
            "supplier": "Acoustic Solutions Ltd",
        },
        {
            "name": "industrial_panels",
            "type": "ceiling_panel",
            "density_kg_per_cubic_m": 1200,
            "cost_per_sqm": 35.00,
            "thickness_mm": 25,
            "description": "Heavy-duty industrial ceiling panels",
            "supplier": "Industrial Building Supplies",
        },
        {
            "name": "t_section_beam",
            "type": "structural",
            "density_kg_per_cubic_m": 7850,  # Steel density
            "cost_per_sqm": 25.00,  # Cost per square meter of coverage
            "thickness_mm": 50,
            "description": "Steel T-section support beam",
            "supplier": "SteelWorks Ltd",
        },
        {
            "name": "hanger_wire",
            "type": "fastener",
            "density_kg_per_cubic_m": 7850,  # Steel density
            "cost_per_sqm": 2.50,  # Cost per square meter coverage
            "thickness_mm": 3,
            "description": "Steel wire hangers for suspension",
            "supplier": "Fasteners Inc",
        },
    ]

    for material_data in materials_data:
        # Check if material already exists
        existing = (
            db.query(Material).filter(Material.name == material_data["name"]).first()
        )
        if not existing:
            material = Material(**material_data)
            db.add(material)
            print(f"Added material: {material_data['name']}")
        else:
            print(f"Material already exists: {material_data['name']}")

    db.commit()


def initialize_database():
    """Initialize database and seed with default data"""
    print("Initializing database...")

    # Create tables
    create_database()
    print("Database tables created.")

    # Seed data
    db = next(get_db())
    try:
        seed_materials(db)
        print("Database seeded with materials.")
    finally:
        db.close()

    print("Database initialization complete.")


def reset_and_seed():
    """Reset database and seed fresh data (for testing)"""
    print("Resetting database...")

    reset_database()
    print("Database reset.")

    # Seed data
    db = next(get_db())
    try:
        seed_materials(db)
        print("Database seeded.")
    finally:
        db.close()

    print("Reset and seed complete.")


if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "--reset":
        reset_and_seed()
    else:
        initialize_database()
