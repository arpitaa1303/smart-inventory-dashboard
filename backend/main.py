from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from ml_engine import ForecastEngine
from database import SessionLocal, Product, SalesData
from typing import Optional
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Smart Inventory Dashboard API")

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://smart-inventory-dashboard-arpita.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ✅ Initialize without db parameter
ml_engine = ForecastEngine()

# Request Models
class WhatIfRequest(BaseModel):
    product_id: str
    price_change_pct: float
    days: int = 30

@app.get("/")
def read_root():
    return {"message": "Smart Inventory Dashboard API", "status": "running"}

@app.get("/products")
def get_products():
    """Get all products with current inventory status"""
    try:
        db = SessionLocal()
        products = db.query(Product).all()
        db.close()
        
        result = [{
            "product_id": p.product_id,
            "product_name": p.product_name,
            "current_stock": p.current_stock,
            "status": p.status,
            "reorder_point": p.reorder_point
        } for p in products]
        
        logger.info(f"Fetched {len(result)} products")
        return result
    except Exception as e:
        logger.error(f"Error fetching products: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/forecast/{product_id}")
def get_forecast(product_id: str, days: int = 30):
    """Get demand forecast for a product"""
    try:
        logger.info(f"Forecasting for product: {product_id}")
        forecast = ml_engine.forecast_demand(product_id, days)
        
        if not forecast or (not forecast.get("historical") and not forecast.get("forecast")):
            raise HTTPException(
                status_code=404, 
                detail="Unable to generate forecast. Insufficient data or product not found."
            )
        
        return forecast
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in forecast endpoint: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.get("/anomalies/{product_id}")
def get_anomalies(product_id: str):
    """Detect sales anomalies"""
    try:
        anomalies = ml_engine.detect_anomalies(product_id)
        return {"anomalies": anomalies}
    except Exception as e:
        logger.error(f"Error detecting anomalies: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/reorder/{product_id}")
def get_reorder_info(product_id: str):
    """Get reorder recommendations"""
    try:
        reorder_info = ml_engine.calculate_reorder_point(product_id)
        
        if not reorder_info:
            raise HTTPException(status_code=404, detail="Product not found")
        
        return reorder_info
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error calculating reorder point: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/what-if")
def what_if_analysis(request: WhatIfRequest):
    """Run what-if scenario simulation"""
    try:
        result = ml_engine.what_if_scenario(
            request.product_id,
            request.price_change_pct,
            request.days
        )
        
        if not result:
            raise HTTPException(status_code=404, detail="Unable to run simulation")
        
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in what-if analysis: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)