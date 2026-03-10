from sqlalchemy import create_engine, Column, String, Float, Text, DateTime, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os, datetime
from dotenv import load_dotenv

load_dotenv()
Base = declarative_base()
engine = create_engine(os.getenv("DATABASE_URL"))
SessionLocal = sessionmaker(bind=engine)

class NewsEntry(Base):
    __tablename__ = "news_analysis"
    id = Column(String, primary_key=True)
    ticker = Column(String, index=True)
    headline = Column(Text)
    summary = Column(Text)
    sentiment = Column(Float)
    metrics = Column(JSON)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    

def init_db():
    Base.metadata.create_all(bind=engine)