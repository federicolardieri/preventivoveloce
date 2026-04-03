"use client";

import { QuotesTable } from "@/components/quotes-list/QuotesTable";
import { Button } from "@/components/ui/button";
import { Plus, TrendingUp } from "lucide-react";
import Link from "next/link";
import { useQuoteStore } from "@/store/quoteStore";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { Quote } from "@/types/quote";

function quoteTotal(quote: Quote): number {
  return quote.items.reduce((sum, item) => {
    const base = item.unitPrice * item.quantity;
    const disc = item.discountType === 'fixed' ? (item.discount || 0) : base * ((item.discount || 0) / 100);
    const sub = Math.max(0, base - disc);
    return sum + sub + sub * (item.vatRate / 100);
  }, 0);
}

function buildChartData(quotesList: Quote[]) {
  const now = new Date();
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    const monthQuotes = quotesList.filter(q => {
      const qd = new Date(q.createdAt);
      return qd.getMonth() === d.getMonth() && qd.getFullYear() === d.getFullYear();
    });
    const total = monthQuotes.reduce((sum, q) => sum + quoteTotal(q), 0);
    return {
      month: format(d, 'MMM', { locale: it }),
      totale: Math.round(total / 100),
      count: monthQuotes.length,
    };
  });
}

export default function PreventiviPage() {
  const { quotesList } = useQuoteStore();
  const chartData = buildChartData(quotesList);
  const maxVal = Math.max(...chartData.map(d => d.totale), 1);
  const currentMonth = format(new Date(), 'MMM', { locale: it });

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 md:p-8 rounded-3xl shadow-[0_8px_30px_-4px_rgba(0,0,0,0.04)] border border-slate-50">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-800">Storico Preventivi</h1>
          <p className="text-slate-500 font-medium mt-1">Visualizza, gestisci e scarica i tuoi preventivi.</p>
        </div>
        <Link href="/nuovo">
          <Button className="bg-[#5c32e6] hover:bg-[#4b27cb] h-12 px-8 rounded-2xl shadow-lg shadow-indigo-500/25 transition-all hover:-translate-y-0.5 text-base font-bold">
            <Plus className="mr-2 h-5 w-5" /> Nuovo Preventivo
          </Button>
        </Link>
      </div>

      {/* Grafico mensile */}
      <div className="bg-white rounded-3xl p-6 shadow-[0_8px_30px_-4px_rgba(0,0,0,0.04)] border border-slate-50">
        <div className="flex items-center gap-2 mb-1">
          <TrendingUp className="w-4 h-4 text-[#5c32e6]" />
          <h2 className="text-base font-bold text-slate-900">Importo per Mese</h2>
        </div>
        <p className="text-xs text-slate-400 mb-5">Totale lordo preventivi emessi negli ultimi 6 mesi</p>
        <div className="h-40">
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            <BarChart data={chartData} barSize={28} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <XAxis
                dataKey="month"
                tick={{ fontSize: 12, fontWeight: 600, fill: '#94a3b8' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#cbd5e1' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => v === 0 ? '' : `€${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
              />
              <Tooltip
                cursor={{ fill: '#f1f5f9' }}
                contentStyle={{ border: 'none', borderRadius: 12, boxShadow: '0 4px 20px rgba(0,0,0,0.08)', fontSize: 12, fontWeight: 600 }}
                formatter={(value, _name, props) => {
                  const v = Number(value ?? 0);
                  const count = (props.payload as { count?: number }).count ?? 0;
                  return [`€ ${v.toLocaleString('it-IT')}`, `${count} preventiv${count === 1 ? 'o' : 'i'}`];
                }}
                labelStyle={{ color: '#64748b', fontWeight: 700 }}
              />
              <Bar
                dataKey="totale"
                radius={[6, 6, 0, 0]}
                shape={(props: { x?: number; y?: number; width?: number; height?: number; month?: string; totale?: number }) => {
                  const { x = 0, y = 0, width = 0, height = 0, month, totale = 0 } = props;
                  const fill = month === currentMonth ? '#5c32e6' : totale === maxVal && totale > 0 ? '#818cf8' : '#e0e7ff';
                  return <rect x={x} y={y} width={width} height={Math.max(0, height)} fill={fill} rx={6} />;
                }}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Tabella */}
      <div className="bg-white rounded-3xl shadow-[0_8px_30px_-4px_rgba(0,0,0,0.04)] border border-slate-50 p-4 md:p-8">
        <QuotesTable showFilters={true} />
      </div>

    </div>
  );
}
