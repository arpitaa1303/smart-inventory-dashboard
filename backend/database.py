from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")


engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Sales Data Model
class SalesData(Base):
    __tablename__ = "sales_data"
    
    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(String, index=True)
    product_name = Column(String)
    date = Column(DateTime, default=datetime.utcnow)
    quantity_sold = Column(Integer)
    price = Column(Float)
    revenue = Column(Float)
    
# Product Inventory Model
class Product(Base):
    __tablename__ = "products"
    
    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(String, unique=True, index=True)
    product_name = Column(String)
    current_stock = Column(Integer)
    reorder_point = Column(Integer)
    lead_time_days = Column(Integer)
    status = Column(String)  # "Healthy", "Low Stock", "Critical"
    
# Create all tables
Base.metadata.create_all(bind=engine)