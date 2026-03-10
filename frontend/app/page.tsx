"use client";
import { useEffect, useState, useCallback } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Link from "next/link";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

interface NewsItem {
  id: number;
  ticker: string;
  headline: string;
  summary: string;
  sentiment: number;
}

export default function Dashboard() {
  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [newTicker, setNewTicker] = useState("");
  const [selectedTicker, setSelectedTicker] = useState<string>("");
  const [data, setData] = useState<NewsItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch watchlist on load
  useEffect(() => {
    fetch(`${API_URL}/watchlist`)
      .then(res => res.json())
      .then((list) => {
        setWatchlist(list);
        if (list.length > 0) {
          setSelectedTicker(prev => prev || list[0]);
        }
      });
  }, []);

  // Fetch news data when selectedTicker changes
  const fetchNews = useCallback(async () => {
    if (!selectedTicker) return;
    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/feed/${selectedTicker}`);
      const json = await res.json();
      setData(Array.isArray(json) ? json : []);
    } catch (error) {
      console.error("Failed to fetch news:", error);
      setData([]);
    } finally {
      setIsLoading(false);
    }
  }, [selectedTicker]);

  useEffect(() => {
    fetchNews();
  }, [fetchNews]);

  const addToWatchlist = async () => {
    if (!newTicker) return;
    await fetch(`${API_URL}/watchlist/${newTicker}`, { method: 'POST' });
    setWatchlist([...watchlist, newTicker.toUpperCase()]);
    setNewTicker("");
  };

  return (
    <div className="p-8 bg-slate-950 min-h-screen text-white">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold tracking-tight">
          FinSignal AI Terminal
        </h1>

        {/* Ticker Selection Dropdown */}
        <div className="flex items-center gap-4">
          <span className="text-sm text-slate-400 font-medium">
            Monitoring:
          </span>
          <Select value={selectedTicker} onValueChange={setSelectedTicker}>
            <SelectTrigger className="w-[180px] bg-slate-900">
              <SelectValue placeholder="Ticker" />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 text-white">
              {watchlist.map(t => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex gap-2 mt-4">
            <input 
              value={newTicker} 
              onChange={(e) => setNewTicker(e.target.value)}
              className="bg-slate-900 border border-slate-700 px-2 py-1 rounded"
              placeholder="Add Ticker (e.g. MSFT)"
            />
            <button onClick={addToWatchlist} className="bg-blue-600 px-3 py-1 rounded">Add</button>
          </div>
        </div>
      </div>

      <div className="rounded-md border border-slate-800 bg-slate-900 overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-800/50">
            <TableRow className="border-slate-800 hover:bg-transparent">
              <TableHead className="w-[100px] text-slate-300">Ticker</TableHead>
              <TableHead className="text-slate-300">
                Market Intelligence Summary
              </TableHead>
              <TableHead className="text-right text-slate-300">
                AI Sentiment
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={3}
                  className="text-center py-10 text-slate-500 italic"
                >
                  Updating signals...
                </TableCell>
              </TableRow>
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={3}
                  className="text-center py-10 text-slate-500"
                >
                  No signals detected for {selectedTicker}.
                </TableCell>
              </TableRow>
            ) : (
              data.map((item: NewsItem, i: number) => (
                <TableRow
                  key={i}
                  className="border-slate-800 hover:bg-slate-800/30 transition-colors"
                >
                  <TableCell className="font-mono font-bold text-blue-400">
                    {item.ticker}
                  </TableCell>
                  <TableCell>
                    <Link href={`/news/${item.id}`} className="hover:underline">
                      <div className="font-semibold text-slate-100">
                        {item.headline}
                      </div>
                    </Link>
                    <div className="text-sm text-slate-400 leading-relaxed italic border-l-2 border-slate-700 pl-3">
                      {item.summary}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge
                      className={`${
                        item.sentiment > 0.3
                          ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                          : item.sentiment < -0.3
                          ? "bg-rose-500/10 text-rose-500 border-rose-500/20"
                          : "bg-slate-500/10 text-slate-500 border-slate-500/20"
                      } border`}
                    >
                      {item.sentiment > 0 ? "+" : ""}
                      {item.sentiment.toFixed(2)}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
