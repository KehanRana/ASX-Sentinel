import requests
import time
import os
from dotenv import load_dotenv

load_dotenv()

NEWS_API_KEY = os.getenv("NEWS_API_KEY")

# NEW: Look for a production URL first, default to localhost for local testing
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
BACKEND_URL = f"{API_URL}/analyze"

def fetch_free_news():
    try:
        # NEW: Use the dynamic URL instead of hardcoded 127.0.0.1
        watchlist_res = requests.get(f"{API_URL}/watchlist")
        current_watchlist = watchlist_res.json()
    except Exception as e:
        print(f"⚠️ Watchlist fetch failed ({e}). Using fallback.")
        current_watchlist = ["NVDA"]    # Fallback
    
    print(f"--- Fetching NewsAPI for {current_watchlist} at {time.strftime('%H:%M:%S')} ---")
    
    for ticker in current_watchlist:
        url = (f"https://newsapi.org/v2/everything?"
               f"q={ticker}&"
               f"language=en&"
               f"sortBy=publishedAt&"
               f"pageSize=2&" 
               f"apiKey={NEWS_API_KEY}")
        
        try:
            response = requests.get(url)
            data = response.json()
            
            if data.get("status") != "ok":
                print(f"❌ NewsAPI Error: {data.get('message')}")
                continue

            articles = data.get("articles", [])
            for art in articles:
                ticker_map = {"NVIDIA": "NVDA", "Apple": "AAPL", "Tesla": "TSLA", "Microsoft": "MSFT"}
                mapped_ticker = ticker_map.get(ticker, ticker)
                
                params = {"ticker": mapped_ticker, "headline": art["title"]}
                payload = {"full_text": art["description"] or art["title"]}
                
                res = requests.post(BACKEND_URL, params=params, json=payload)
                
                if res.status_code == 200:
                    status = res.json().get("status")
                    if status == "skipped":
                        print(f"⏭️  Skipped: {art['title'][:40]}...")
                    else:
                        print(f"✅ Analyzed {mapped_ticker}: {art['title'][:40]}...")
                else:
                    print(f"❌ Backend error: {res.text}")

        except Exception as e:
            print(f"Fetcher Error: {e}")

if __name__ == "__main__":
    while True:
        fetch_free_news()
        time.sleep(1800)