import os
from pathlib import Path

# Environment variables with defaults
MODEL_CONFIG = os.getenv("MODEL_CONFIG", "./config/models.yaml")
PORT = int(os.getenv("PORT", 8000))
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "*")

# Base paths
BASE_DIR = Path(__file__).parent.parent
CONFIG_DIR = BASE_DIR / "config"
MODELS_DIR = BASE_DIR / "models"
STATIC_DIR = Path(__file__).parent / "static"

# Ensure directories exist
STATIC_DIR.mkdir(exist_ok=True)
