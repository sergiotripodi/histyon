import { Ticket } from "@/types";
import { Download, Eye, Maximize } from "lucide-react"; 
import Link from "next/link";

export default function TicketResult({ ticket, dict }: { ticket: Ticket, dict: any }) {
  // Rendo il controllo dello stato case-insensitive (accetta completed, COMPLETED, Completed)
  const isCompleted = ticket.status?.toLowerCase() === 'completed';
  
  if (!isCompleted) return null;

  const t = dict.dashboard.results;
  const stats = ticket.ai_results?.summary;

  return (
    <div className="space-y-6 mt-10 border-t pt-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-800">{t.title}</h2>
        
        {/* TASTO NUOVO: messo qui in alto è impossibile non vederlo */}
        {ticket.output_dzi_url && (
          <Link 
            href={`/dashboard/viewer/${ticket.id}`}
            className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg hover:scale-105 active:scale-95"
          >
            <Maximize className="w-5 h-5" />
            ESPLORA VETRINO (INTERATTIVO)
          </Link>
        )}
      </div>

      {ticket.output_dzi_url && (
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200">
          <h3 className="font-semibold mb-4 flex items-center gap-2 text-gray-600">
            <Eye className="w-5 h-5 text-blue-600" />
            Anteprima Statica
          </h3>
          <div className="relative w-full h-[400px] bg-black rounded-xl overflow-hidden border border-gray-100">
            <img 
              src={ticket.output_dzi_url} 
              alt="Analisi" 
              className="w-full h-full object-contain opacity-60"
            />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="bg-black/50 backdrop-blur-md text-white px-4 py-2 rounded-lg text-xs font-bold border border-white/10 uppercase tracking-widest">
                    Modalità Anteprima
                </div>
            </div>
          </div>
        </div>
      )}

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
            <p className="text-4xl font-black text-blue-700">
              {stats.counts?.glomeruli || 0}
            </p>
          </div>
          <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200">
            <p className="text-gray-600 text-xs font-bold uppercase tracking-wider mb-1">{t.scleroGlom}</p>
            <p className="text-4xl font-black text-gray-700">
              {stats.counts?.glomeruli_sclerotici || 0}
            </p>
          </div>
        </div>
      )}

      {ticket.project_file_url && (
        <div className="bg-gray-900 text-white p-8 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl border border-white/5">
          <div>
            <h3 className="font-bold text-xl mb-1">{t.fullProject}</h3>
            <p className="text-gray-400 text-sm">Scarica l'intero dataset elaborato dalla AI per QuPath</p>
          </div>
          <a 
            href={ticket.project_file_url} 
            download 
            className="w-full md:w-auto flex items-center justify-center gap-2 bg-white text-gray-900 px-8 py-4 rounded-xl font-black hover:bg-gray-100 transition-all shadow-xl hover:scale-105"
          >
            <Download className="w-5 h-5" />
            DOWNLOAD DATASET (.ZIP)
          </a>
        </div>
      )}
    </div>
  );
}