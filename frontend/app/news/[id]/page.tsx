"use client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  FileText,
} from "lucide-react";
import {
  LineChart,
  Line,
  ResponsiveContainer,
} from "recharts";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

interface Article {
  id: string;
  ticker: string;
  headline: string;
  summary: string;
  sentiment: number;
  metrics?: {
    bullish_factors?: string[];
    bearish_factors?: string[];
    risk_alert?: string;
    sentiment_label?: string;
  };
}

interface ChartDataPoint {
  date: string;
  val: number;
}

export default function NewsDetail() {
  const params = useParams();
  const [article, setArticle] = useState<Article | null>(null);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);

  useEffect(() => {
    if (params.id) {
      // Fetch article details
      fetch(`${API_URL}/article/${params.id}`)
        .then((res) => res.json())
        .then((data) => {
          setArticle(data);
          // Fetch sentiment history for the ticker
          if (data?.ticker) {
            fetch(`${API_URL}/history/${data.ticker}`)
              .then((res) => res.json())
              .then(setChartData)
              .catch(() => setChartData([]));
          }
        });
    }
  }, [params.id]);

  if (!article)
    return <div className="p-8 text-white">Loading analysis...</div>;

  const bullishFactors = article.metrics?.bullish_factors ?? [];
  const bearishFactors = article.metrics?.bearish_factors ?? [];
  const riskAlert = article.metrics?.risk_alert ?? "No risk alerts identified.";
  const sentimentLabel = article.metrics?.sentiment_label ?? "Neutral";

  return (
    <div className="min-h-screen bg-[#061209] text-slate-100 p-8">
      <div className="flex justify-between items-start mb-8">
        <div>
          <Badge className="bg-green-500 text-black mb-2">{article.ticker}</Badge>
          <h1 className="text-4xl font-bold max-w-2xl leading-tight">
            {article.headline}
          </h1>
        </div>
        <button className="flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white px-6 py-3 rounded-lg font-bold">
          <FileText size={20} /> View PDF Source
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT & CENTER COLUMNS */}
        <div className="lg:col-span-2 space-y-6">
          {/* AI Summary Card */}
          <Card className="bg-[#0c1f11] border-green-900/30 p-8">
            <h2 className="text-green-400 font-bold flex items-center gap-2 mb-4">
              <span className="text-xl">✨</span> AI Sentiment Summary
            </h2>
            <p className="text-slate-300 text-lg leading-relaxed">
              {article.summary}
            </p>
          </Card>

          {/* Factors Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-[#0c1f11] border-green-900/30 p-6">
              <h3 className="text-emerald-400 flex items-center gap-2 mb-4 font-bold">
                <TrendingUp size={20} /> BULLISH FACTORS
              </h3>
              <ul className="space-y-3 list-disc list-inside text-slate-300 text-sm">
                {bullishFactors.length > 0 ? (
                  bullishFactors.map((f, i) => <li key={i}>{f}</li>)
                ) : (
                  <li className="text-slate-500">No bullish factors identified</li>
                )}
              </ul>
            </Card>
            <Card className="bg-[#1f110c] border-red-900/30 p-6">
              <h3 className="text-rose-400 flex items-center gap-2 mb-4 font-bold">
                <TrendingDown size={20} /> BEARISH FACTORS
              </h3>
              <ul className="space-y-3 list-disc list-inside text-slate-300 text-sm">
                {bearishFactors.length > 0 ? (
                  bearishFactors.map((f, i) => <li key={i}>{f}</li>)
                ) : (
                  <li className="text-slate-500">No bearish factors identified</li>
                )}
              </ul>
            </Card>
          </div>

          {/* Chart Card */}
          <Card className="bg-[#0c1f11] border-green-900/30 p-6 h-[300px]">
            <h3 className="text-slate-300 font-bold mb-4">
              Market Reaction & Sentiment Trend
            </h3>
            <ResponsiveContainer width="100%" height="80%">
              <LineChart data={chartData}>
                <Line type="monotone" dataKey="val" stroke="#10b981" />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </div>

        {/* RIGHT COLUMN (Sidebar) */}
        <div className="space-y-6">
          <Card className="bg-[#0c1f11] border-green-900/30 p-8 text-center">
            <p className="text-slate-400 uppercase text-xs font-bold tracking-widest mb-2">
              Sentiment Score
            </p>
            <div className="text-7xl font-black text-emerald-400 mb-2">
              {article.sentiment}
            </div>
            <p className="text-emerald-400 font-bold text-xl italic">
              {sentimentLabel}
            </p>
          </Card>

          <Card className="bg-[#1f1d0c] border-yellow-900/30 p-6 border-l-4 border-l-yellow-600">
            <h3 className="text-yellow-500 flex items-center gap-2 font-bold mb-2">
              <AlertTriangle size={18} /> RISK ALERT
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              {riskAlert}
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
