from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from sqlalchemy import func
from database import SessionLocal, NewsEntry, Watchlist, init_db
from processor import analyze_content
from alerts import send_sentiment_email
import uuid
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://finsignal.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create tables on startup
@app.on_event("startup")
def startup():
    init_db()

class NewsRequest(BaseModel):
    full_text: str

@app.post("/analyze")
async def process_news(ticker: str, headline: str, request: NewsRequest):
    try:
        # 1. Analyze with AI
        analysis = analyze_content(request.full_text)

        send_sentiment_email(
            ticker=ticker,
            headline=headline,
            score=analysis.sentiment_score * 100,
            summary=analysis.summary,
            bullish=analysis.bullish_factors,
            bearish=analysis.bearish_factors
        )
        
        # 2. Save to DB
        db = SessionLocal()
        new_entry = NewsEntry(
            id=str(uuid.uuid4()),
            ticker=ticker.upper(),
            headline=headline,
            summary=analysis.summary,
            sentiment=analysis.sentiment_score,
            metrics={
                "bullish_factors": analysis.bullish_factors,
                "bearish_factors": analysis.bearish_factors,
                "risk_alert": analysis.risk_alert,
                "sentiment_label": analysis.sentiment_label
            }
        )
        db.add(new_entry)
        db.commit()
        db.close()
        
        return {"status": "success", "analysis": analysis}
    except Exception as e:
        print(f"Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/feed/{ticker}")
async def get_feed(ticker: str):
    """Get all news entries for a specific ticker"""
    db = SessionLocal()
    try:
        entries = db.query(NewsEntry).filter(NewsEntry.ticker == ticker.upper()).all()
        return [
            {
                "id": entry.id,
                "ticker": entry.ticker,
                "headline": entry.headline,
                "sentiment": entry.sentiment,
                "summary": entry.summary
            }
            for entry in entries
        ]
    finally:
        db.close()

@app.get("/history/{ticker}")
async def get_sentiment_history(ticker: str):
    db = SessionLocal()
    # This query averages sentiment scores grouped by day for the last 7 days
    # (Adjust 'date_trunc' if using Postgres vs SQLite)
    results = (
        db.query(
            func.date(NewsEntry.created_at).label("date"),
            func.avg(NewsEntry.sentiment).label("avg_sentiment")
        )
        .filter(NewsEntry.ticker == ticker.upper())
        .group_by(func.date(NewsEntry.created_at))
        .order_by(func.date(NewsEntry.created_at).asc())
        .limit(30)
        .all()
    )
    db.close()
    
    # Format for Recharts: [{date: "2026-03-01", val: 82}, ...]
    return [{"date": r.date, "val": round(float(r.avg_sentiment) * 100)} for r in results]

@app.get("/article/{article_id}")
async def get_article(article_id: str):
    db = SessionLocal()
    article = db.query(NewsEntry).filter(NewsEntry.id == article_id).first()
    db.close()
    return article

@app.post("/watchlist/{ticker}")
async def add_to_watchlist(ticker: str):
    db = SessionLocal()
    ticker = ticker.upper()
    # Check if already exists
    exists = db.query(Watchlist).filter(Watchlist.ticker == ticker).first()
    if not exists:
        new_item = Watchlist(id=str(uuid.uuid4()), user_id="default_user", ticker=ticker)
        db.add(new_item)
        db.commit()
    db.close()
    return {"status": "added", "ticker": ticker}

@app.get("/watchlist")
async def get_watchlist():
    db = SessionLocal()
    items = db.query(Watchlist).all()
    db.close()
    return [i.ticker for i in items]