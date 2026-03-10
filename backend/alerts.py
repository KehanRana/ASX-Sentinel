import resend
import os
from dotenv import load_dotenv

load_dotenv()
resend.api_key = os.getenv("RESEND_API_KEY")

def send_sentiment_email(ticker, headline, score, summary, bullish, bearish):
    # Only send for significant moves
    if 20 < score < 80:
        return

    color = "#10b981" if score >= 80 else "#f43f5e" # Green vs Red
    status = "BULLISH" if score >= 80 else "BEARISH"

    # Professional HTML Template
    html_content = f"""
    <div style="font-family: sans-serif; background-color: #f9fafb; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; border-top: 4px solid {color}; padding: 30px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <p style="color: {color}; font-weight: bold; text-transform: uppercase; margin-bottom: 10px;">{status} SIGNAL DETECTED</p>
            <h1 style="font-size: 24px; color: #111827; margin: 0 0 20px 0;">{ticker}: {headline}</h1>
            
            <div style="background: #f3f4f6; padding: 15px; border-radius: 6px; margin-bottom: 20px;">
                <p style="margin: 0; font-size: 14px; color: #4b5563;">AI Sentiment Score</p>
                <p style="margin: 0; font-size: 32px; font-weight: 800; color: {color};">{score}/100</p>
            </div>

            <h3 style="color: #374151;">Executive Summary</h3>
            <p style="color: #4b5563; line-height: 1.6;">{summary}</p>
            
            <table style="width: 100%; margin-top: 20px;">
                <tr>
                    <td style="vertical-align: top; width: 50%;">
                        <strong style="color: #059669;">Bullish Factors</strong>
                        <ul style="font-size: 13px; color: #4b5563;">{"".join([f"<li>{f}</li>" for f in bullish])}</ul>
                    </td>
                    <td style="vertical-align: top; width: 50%;">
                        <strong style="color: #dc2626;">Bearish Factors</strong>
                        <ul style="font-size: 13px; color: #4b5563;">{"".join([f"<li>{f}</li>" for f in bearish])}</ul>
                    </td>
                </tr>
            </table>

            <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 30px 0;" />
            <a href="http://localhost:3000/dashboard" style="display: block; text-align: center; background: #111827; color: white; padding: 12px; border-radius: 6px; text-decoration: none; font-weight: bold;">View Full Analysis in Terminal</a>
        </div>
    </div>
    """

    resend.Emails.send({
        "from": "Finance Sentinel <onboarding@resend.dev>", # Update to your domain later
        "to": os.getenv("NOTIFICATION_EMAIL"),
        "subject": f"[{status}] {score}/100 - {ticker} Analysis",
        "html": html_content
    })