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

class Watchlist(Base):
    __tablename__ = "watchlists"
    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, index=True) # For now, use 'default_user' until we add Auth
    ticker = Column(String, index=True)

def init_db():
    Base.metadata.create_all(bind=engine)