import os
from dotenv import load_dotenv
from openai import OpenAI
from models import AIResponse

load_dotenv()

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

def analyze_content(text: str):
    # Using GPT-4o-mini with Structured Outputs for 2026-standard precision
    completion = client.beta.chat.completions.parse(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": "You are a Wall Street analyst. Analyze the following news for market impact. Score sentiment from -1.0 to 1.0."},
            {"role": "user", "content": text}
        ],
        response_format=AIResponse,
    )
    return completion.choices[0].message.parsed