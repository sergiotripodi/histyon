import { Ticket } from "@/types";
import { Maximize } from "lucide-react";
import Link from "next/link";

export default function TicketResult({ ticket, dict }: { ticket: Ticket, dict: any }) {
  const isCompleted = ticket.status?.toLowerCase() === 'completed';
  if (!isCompleted) return null;

  const t = dict.dashboard.results;
  const stats = ticket.results?.summary;

  return (
    <div className="space-y-6 mt-10 border-t pt-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-800">{t.title}</h2>
        <Link
          href={`/dashboard/viewer/${ticket.id}`}
          className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg hover:scale-105 active:scale-95"
        >
          <Maximize className="w-5 h-5" />
          ESPLORA VETRINO (INTERATTIVO)
        </Link>
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-red-50 p-6 rounded-2xl border border-red-100">
            <p className="text-red-600 text-xs font-bold uppercase tracking-wider mb-1">{t.sickTissue}</p>
            <p className="text-4xl font-black text-red-700">
              {stats.percentuale_tessuto_malato?.toFixed(1)}%
            </p>
          </div>
          <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100">
            <p className="text-blue-600 text-xs font-bold uppercase tracking-wider mb-1">{t.totalGlom}</p>
            <p className="text-4xl font-black text-blue-700">{stats.counts?.glomeruli || 0}</p>
          </div>
          <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200">
            <p className="text-gray-600 text-xs font-bold uppercase tracking-wider mb-1">{t.scleroGlom}</p>
            <p className="text-4xl font-black text-gray-700">{stats.counts?.glomeruli_sclerotici || 0}</p>
          </div>
        </div>
      )}
    </div>
  );
}