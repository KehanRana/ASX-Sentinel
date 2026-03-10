import requests
import time
import os
from dotenv import load_dotenv

load_dotenv()

NEWS_API_KEY = os.getenv("NEWS_API_KEY")
BACKEND_URL = "http://127.0.0.1:8000/analyze"

def fetch_free_news():
    try:
        watchlist_res = requests.get("http://127.0.0.1:8000/watchlist")
        current_watchlist = watchlist_res.json()
    except:
        current_watchlist = ["NVDA"]    # Fallback
    
    print(f"--- Fetching NewsAPI at {time.strftime('%H:%M:%S')} ---")
    
    for ticker in current_watchlist:
        # Search for news from the last 24 hours
        url = (f"https://newsapi.org/v2/everything?"
               f"q={ticker}&"
               f"language=en&"
               f"sortBy=publishedAt&"
               f"pageSize=2&" # Just get the 2 latest to save tokens
               f"apiKey={NEWS_API_KEY}")
        
        try:
            response = requests.get(url)
            data = response.json()
            
            if data["status"] != "ok":
                print(f"❌ NewsAPI Error: {data.get('message')}")
                continue

            articles = data.get("articles", [])
            for art in articles:
                # Map NewsAPI fields to your Backend
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
                        print(f"✅ Analyzed {ticker}: {art['title'][:40]}...")
                else:
                    print(f"❌ Backend error: {res.text}")

        except Exception as e:
            print(f"Fetcher Error: {e}")

if __name__ == "__main__":
    while True:
        fetch_free_news()
        # Since the free tier has a daily limit of 100, 
        # let's run this every 30 minutes (48 runs/day).
        time.sleep(1800)