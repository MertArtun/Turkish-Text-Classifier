from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from contextlib import asynccontextmanager
import logging
from pathlib import Path

from .config import MODEL_CONFIG, CORS_ORIGINS, STATIC_DIR
from .registry import registry
from .inference import predict_one, predict_batch
from .metrics import metrics, TimerContext
from .schemas import (
    PredictIn, PredictOut, PredictBatchIn, 
    HealthResponse, LabelsResponse, MetricsResponse
)

# Logging setup
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup ve shutdown events"""
    # Startup
    logger.info("Starting TR News Classifier API")
    try:
        registry.load_registry(MODEL_CONFIG)
        logger.info(f"Loaded models: {registry.list_models()}")
    except Exception as e:
        logger.error(f"Failed to load models: {e}")
        raise
    
    yield
    
    # Shutdown
    logger.info("Shutting down TR News Classifier API")

# FastAPI app
app = FastAPI(
    title="TR News Classifier",
    description="Turkish News Classification API with BERT models",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
origins = CORS_ORIGINS.split(",") if CORS_ORIGINS != "*" else ["*"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    return HealthResponse(status="ok")

@app.get("/labels", response_model=LabelsResponse)
async def get_labels(model: str = Query("bert512", description="Model name")):
    """Modelin label listesini döndür"""
    try:
        model_bundle = registry.get_model(model)
        labels = list(model_bundle.id2label.values())
        return LabelsResponse(labels=labels, model=model)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Error getting labels: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.post("/predict", response_model=PredictOut)
async def predict_text(request: PredictIn):
    """Tek metin için tahmin yap"""
    try:
        model_bundle = registry.get_model(request.model)
        
        with TimerContext(request.model):
            result = predict_one(model_bundle, request.text)
        
        return PredictOut(**result)
        
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Error in prediction: {e}")
        raise HTTPException(status_code=500, detail="Prediction failed")

@app.post("/predict/batch", response_model=list[PredictOut])
async def predict_batch_texts(request: PredictBatchIn):
    """Toplu metin için tahmin yap"""
    try:
        if len(request.texts) > 100:  # Batch size limit
            raise HTTPException(status_code=400, detail="Too many texts (max 100)")
        
        model_bundle = registry.get_model(request.model)
        
        with TimerContext(request.model):
            results = predict_batch(model_bundle, request.texts)
        
        return [PredictOut(**result) for result in results]
        
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Error in batch prediction: {e}")
        raise HTTPException(status_code=500, detail="Batch prediction failed")

@app.get("/metrics", response_model=MetricsResponse)
async def get_metrics():
    """API metriklerini döndür"""
    metrics_data = metrics.get_metrics()
    return MetricsResponse(**metrics_data)

@app.get("/models")
async def list_models():
    """Mevcut modelleri listele"""
    return {"models": registry.list_models()}

# Static files (UI) - Mount at root to serve assets and other files
# This should be LAST to not interfere with API endpoints
if STATIC_DIR.exists():
    app.mount("/", StaticFiles(directory=str(STATIC_DIR), html=True), name="static")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
