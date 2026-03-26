from datetime import datetime
import logging
import os

from dotenv import load_dotenv
from sqlalchemy import Column, DateTime, Float, Integer, String, create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

load_dotenv()
logger = logging.getLogger(__name__)

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./inventory.db")

# Render/Heroku style URLs may still use postgres://
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

engine_kwargs = {"pool_pre_ping": True}
connect_args = {}

if DATABASE_URL.startswith("sqlite"):
    connect_args["check_same_thread"] = False

if DATABASE_URL.startswith("postgresql"):
    # Fail fast if DB is unreachable so requests do not hang for minutes.
    connect_args["connect_timeout"] = 10

if connect_args:
    engine_kwargs["connect_args"] = connect_args

engine = create_engine(DATABASE_URL, **engine_kwargs)
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


def init_db():
    """Create tables when explicitly called by app startup."""
    try:
        Base.metadata.create_all(bind=engine)
    except Exception as exc:
        logger.error("Failed to initialize database tables: %s", exc, exc_info=True)
