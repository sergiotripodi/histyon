import { Check, UploadCloud, Server, BrainCircuit, FileCheck, XCircle } from 'lucide-react'

export function StatusTimeline({ status: rawStatus, dict }: { status: string, dict: any }) {
  const status = rawStatus?.toUpperCase()?.trim() || 'UPLOADING'
  const isError = ['ERROR', 'FAILED', 'FAIL'].includes(status)
  
  const t = dict.dashboard.tickets.steps;
  const tStatus = dict.dashboard.tickets.status;

  const STEPS = [
    { id: 'UPLOADING', label: t.uploading, icon: UploadCloud, color: 'gray' },
    { id: 'QUEUED', label: t.queued, icon: Server, color: 'yellow' },
    { id: 'PROCESSING', label: t.processing, icon: BrainCircuit, color: 'purple' },
    { id: 'COMPLETED', label: t.completed, icon: FileCheck, color: 'green' },
  ]

  const currentIndex = isError ? 0 : STEPS.findIndex(s => s.id === status)

  const getColors = (color: string, isActive: boolean, isCompleted: boolean) => {
    if (isError) return 'bg-gray-100 text-gray-400 border-gray-200'
    
    if (isActive) {
       if (color === 'purple') return 'bg-violet-50 text-violet-700 border-violet-300'
       if (color === 'yellow') return 'bg-amber-50 text-amber-700 border-amber-300'
       if (color === 'gray') return 'bg-gray-100 text-gray-700 border-gray-300'
       if (color === 'green') return 'bg-emerald-50 text-emerald-700 border-emerald-300'
    }
    if (isCompleted) return 'bg-gray-900 text-white border-gray-900'
    return 'bg-white text-gray-300 border-gray-100'
  }

  return (
    <div className="w-full py-6">
      <div className="relative">
        
        <div className={`flex items-center justify-between relative px-2 transition-all duration-500 ease-in-out ${isError ? 'opacity-25 grayscale blur-[2px] pointer-events-none' : ''}`}>
            
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-gray-100 -z-10 rounded-full mx-4"></div>
            
            <div 
                className={`absolute left-0 top-1/2 -translate-y-1/2 h-1 -z-10 rounded-full transition-all duration-1000 ease-in-out mx-4 ${isError ? 'bg-red-500 w-full' : 'bg-black'}`}
                style={!isError && currentIndex >= 0 ? { width: `${(currentIndex / (STEPS.length - 1)) * 100}%` } : {}}
            ></div>

            {STEPS.map((step, index) => {
            const isCompleted = !isError && index < currentIndex;
            const isCurrent = !isError && index === currentIndex;
            const colorClasses = getColors(step.color, isCurrent, isCompleted);

            return (
                <div key={step.id} className="flex flex-col items-center gap-3 bg-white px-2 z-10">
                <div className={`w-12 h-12 rounded-md flex items-center justify-center border transition-all duration-500 ${colorClasses} ${isCompleted ? 'shadow-sm scale-105' : ''}`}>
                    {isCompleted ? <Check className="w-5 h-5" /> : <step.icon className="w-5 h-5" />}
                </div>
                <span className={`text-[10px] font-bold uppercase tracking-wider ${isCurrent ? 'text-black' : 'text-gray-400'}`}>
                    {step.label}
                </span>
                </div>
            )
            })}
        </div>

        {isError && (
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white text-red-700 border border-red-200 px-6 py-3 rounded-md shadow-lg z-20 flex items-center gap-3 animate-in zoom-in slide-in-from-bottom-2 duration-300">
                <XCircle className="w-6 h-6" />
                <span className="font-bold text-sm tracking-wide">{tStatus.failedAnalysis}</span>
             </div>
        )}

      </div>
    </div>
  )
}