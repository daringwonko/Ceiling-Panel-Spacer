"""
BuildScale Backend API
FastAPI application for ceiling panel design and management
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database.session import create_database
from .routes import projects, components, materials
from ..core.config import settings

# Create database tables on startup
create_database()

app = FastAPI(
    title="BuildScale API",
    description="Professional ceiling panel design and calculation platform",
    version="1.0.0",
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify allowed origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(projects.router)
app.include_router(components.router)
app.include_router(materials.router)


@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "version": "1.0.0"}
