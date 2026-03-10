"use client";
import { useEffect, useState } from "react";
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

export default function Dashboard() {
  const [data, setData] = useState([]);
  const [selectedTicker, setSelectedTicker] = useState("NVDA");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    fetch(`http://localhost:8000/feed/${selectedTicker}`)
      .then((res) => res.json())
      .then((result) => {
        setData(Array.isArray(result) ? result : []);
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  }, [selectedTicker]); // Re-fetch whenever ticker changes

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
            <SelectTrigger className="w-[180px] bg-slate-900 border-slate-800 text-white">
              <SelectValue placeholder="Select Ticker" />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-slate-800 text-white">
              <SelectItem value="NVDA">NVIDIA (NVDA)</SelectItem>
              <SelectItem value="AAPL">Apple (AAPL)</SelectItem>
              <SelectItem value="TSLA">Tesla (TSLA)</SelectItem>
              <SelectItem value="MSFT">Microsoft (MSFT)</SelectItem>
            </SelectContent>
          </Select>
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
              data.map((item: any, i: number) => (
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
