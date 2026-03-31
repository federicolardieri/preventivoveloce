import { Badge } from "@/components/ui/badge";
import { QuoteStatus } from "@/types/quote";

const STATUS_CONFIG: Record<QuoteStatus, { label: string; className: string }> = {
  bozza:      { label: "Bozza",      className: "bg-amber-100 text-amber-800 border-amber-200" },
  da_inviare: { label: "Da Inviare", className: "bg-orange-100 text-orange-700 border-orange-200" },
  inviato:    { label: "Inviato",    className: "bg-blue-100 text-blue-800 border-blue-200" },
  accettato:  { label: "Accettato",  className: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  rifiutato:  { label: "Rifiutato",  className: "bg-red-100 text-red-800 border-red-200" },
  scaduto:    { label: "Scaduto",    className: "bg-slate-100 text-slate-600 border-slate-200" },
};

export function QuoteStatusBadge({ status }: { status: QuoteStatus }) {
  const config = STATUS_CONFIG[status];
  return (
    <Badge variant="outline" className={`font-semibold text-xs ${config.className}`}>
      {config.label}
    </Badge>
  );
}
