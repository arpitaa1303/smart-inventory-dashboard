import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from database import SessionLocal, SalesData, Product

def generate_sales_data():
    """Generate 18 months of realistic sales data with seasonality"""
    
    db = SessionLocal()
    
    # Product list
    products = [
        {"id": "PROD001", "name": "Wireless Mouse"},
        {"id": "PROD002", "name": "USB-C Cable"},
        {"id": "PROD003", "name": "Laptop Stand"},
        {"id": "PROD004", "name": "Bluetooth Speaker"},
        {"id": "PROD005", "name": "Webcam HD"}
    ]
    
    # Generate data for last 18 months
    start_date = datetime.now() - timedelta(days=540)
    
    for product in products:
        base_sales = np.random.randint(20, 100)  # Base daily sales
        
        for day in range(540):
            current_date = start_date + timedelta(days=day)
            
            # Add seasonality (weekend boost)
            weekend_boost = 1.3 if current_date.weekday() >= 5 else 1.0
            
            # Add monthly trend (5% growth per month)
            trend = 1 + (day / 540) * 0.5
            
            # Add random noise
            noise = np.random.uniform(0.8, 1.2)
            
            # Calculate quantity
            quantity = int(base_sales * weekend_boost * trend * noise)
            price = np.random.uniform(15, 50)
            
            sale = SalesData(
                product_id=product["id"],
                product_name=product["name"],
                date=current_date,
                quantity_sold=quantity,
                price=price,
                revenue=quantity * price
            )
            db.add(sale)
    
    # Add product inventory data
    for product in products:
        inventory = Product(
            product_id=product["id"],
            product_name=product["name"],
            current_stock=np.random.randint(100, 500),
            reorder_point=50,
            lead_time_days=7,
            status="Healthy"
        )
        db.add(inventory)
    
    db.commit()
    db.close()
    print("✅ Sample data generated successfully!")

if __name__ == "__main__":
    generate_sales_data()