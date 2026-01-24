import logging
from datetime import datetime, timedelta
import pandas as pd
import numpy as np
from database import SessionLocal, SalesData, Product

logger = logging.getLogger(__name__)

class ForecastEngine:
    def __init__(self):
        """Initialize without db parameter - create sessions as needed"""
        pass

    def forecast_demand(self, product_id: str, days: int = 30):
        """Generate demand forecast for a product"""
        db = SessionLocal()
        try:
            # Fetch historical sales data
            sales = (
                db.query(SalesData)
                .filter(SalesData.product_id == product_id)
                .order_by(SalesData.date)
                .all()
            )

            if not sales:
                logger.warning(f"No sales data found for product {product_id}")
                return {"historical": [], "forecast": []}

            # Create dataframe with correct column names
            df = pd.DataFrame([
                {
                    "ds": s.date.strftime("%Y-%m-%d"),
                    "y": s.quantity_sold
                } 
                for s in sales
            ])

            # Calculate average daily sales for simple forecast
            avg_daily_sales = df["y"].mean()

            # Prepare historical data
            historical = df.to_dict('records')

            # Generate future dates
            last_date = datetime.strptime(df["ds"].max(), "%Y-%m-%d")
            future_dates = [
                (last_date + timedelta(days=i+1)).strftime("%Y-%m-%d") 
                for i in range(days)
            ]

            # Simple forecast with some variance
            forecast = []
            for d in future_dates:
                # Add some random variation (±20%)
                variance = np.random.uniform(0.8, 1.2)
                predicted = avg_daily_sales * variance
                
                forecast.append({
                    "ds": d,
                    "yhat": round(predicted, 2),
                    "yhat_lower": round(predicted * 0.8, 2),
                    "yhat_upper": round(predicted * 1.2, 2)
                })

            return {
                "historical": historical,
                "forecast": forecast
            }

        except Exception as e:
            logger.error(f"Error in forecast_demand: {e}", exc_info=True)
            return {"historical": [], "forecast": []}
        finally:
            db.close()

    def calculate_reorder_point(self, product_id: str):
        """Calculate reorder point and recommendations"""
        db = SessionLocal()
        try:
            product = (
                db.query(Product)
                .filter(Product.product_id == product_id)
                .first()
            )

            if not product:
                logger.warning(f"Product {product_id} not found")
                return None

            # Get sales data
            sales = (
                db.query(SalesData)
                .filter(SalesData.product_id == product_id)
                .all()
            )

            if not sales:
                avg_daily_sales = 0
            else:
                avg_daily_sales = np.mean([s.quantity_sold for s in sales])

            # Calculate reorder point: avg_daily_sales * lead_time
            reorder_point = int(avg_daily_sales * product.lead_time_days)
            
            # Calculate recommended order quantity
            # Order enough for 2x lead time period
            recommended_order = int(avg_daily_sales * product.lead_time_days * 2)

            return {
                "product_id": product_id,
                "current_stock": product.current_stock,
                "avg_daily_sales": round(avg_daily_sales, 2),
                "lead_time_days": product.lead_time_days,
                "reorder_point": reorder_point,
                "recommended_order_quantity": recommended_order
            }

        except Exception as e:
            logger.error(f"Error calculating reorder point: {e}", exc_info=True)
            return None
        finally:
            db.close()

    def detect_anomalies(self, product_id: str):
        """Detect sales anomalies using statistical method"""
        db = SessionLocal()
        try:
            sales = (
                db.query(SalesData)
                .filter(SalesData.product_id == product_id)
                .order_by(SalesData.date)
                .all()
            )

            if not sales:
                return []

            # Use numpy array for calculations
            values = np.array([s.quantity_sold for s in sales])
            mean = values.mean()
            std = values.std()

            # Detect anomalies (values > 2 standard deviations from mean)
            anomalies = []
            for s in sales:
                if abs(s.quantity_sold - mean) > 2 * std:
                    anomalies.append({
                        "ds": s.date.strftime("%Y-%m-%d"),
                        "y": s.quantity_sold
                    })

            return anomalies

        except Exception as e:
            logger.error(f"Error detecting anomalies: {e}", exc_info=True)
            return []
        finally:
            db.close()

    def what_if_scenario(self, product_id: str, price_change_pct: float, days: int = 30):
        """Run what-if scenario with price elasticity"""
        db = SessionLocal()
        try:
            # Get base forecast
            base_forecast = self.forecast_demand(product_id, days)
            
            if not base_forecast or not base_forecast.get("forecast"):
                return None

            # Simple price elasticity model
            # Assume -1.5 elasticity (15% decrease in price -> 22.5% increase in demand)
            elasticity = -1.5
            demand_change = elasticity * (price_change_pct / 100)
            
            # Adjust forecast based on price change
            adjusted_forecast = []
            for item in base_forecast["forecast"]:
                adjustment_factor = 1 + demand_change
                adjusted_forecast.append({
                    "ds": item["ds"],
                    "yhat": round(item["yhat"] * adjustment_factor, 2),
                    "yhat_lower": round(item["yhat_lower"] * adjustment_factor, 2),
                    "yhat_upper": round(item["yhat_upper"] * adjustment_factor, 2)
                })

            return {
                "product_id": product_id,
                "price_change_pct": price_change_pct,
                "demand_change_pct": round(demand_change * 100, 2),
                "forecast": adjusted_forecast
            }

        except Exception as e:
            logger.error(f"Error in what_if_scenario: {e}", exc_info=True)
            return None
        finally:
            db.close()