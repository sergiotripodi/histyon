import { Check, Server, BrainCircuit, FileCheck, UploadCloud, XCircle } from 'lucide-react'

export function StatusTimeline({ status: rawStatus, dict }: { status: string, dict: any }) {
  const status = rawStatus?.toUpperCase()?.trim() || 'UPLOADING'
  const isError = ['ERROR', 'FAILED', 'FAIL'].includes(status)

  const t = dict.dashboard.tickets.steps
  const tStatus = dict.dashboard.tickets.status

  const STEPS = [
    { id: 'UPLOADING',  label: t.uploading,  icon: UploadCloud },
    { id: 'QUEUED',     label: t.queued,     icon: Server },
    { id: 'PROCESSING', label: t.processing, icon: BrainCircuit },
    { id: 'COMPLETED',  label: t.completed,  icon: FileCheck },
  ]

  if (isError) {
    return (
      <div className="flex items-center gap-3 px-4 py-3 border border-red-200 bg-red-50">
        <XCircle className="w-4 h-4 text-red-500 shrink-0" />
        <span className="font-bold text-sm text-red-700 tracking-wide">{tStatus.failedAnalysis}</span>
      </div>
    )
  }

  const currentIndex = STEPS.findIndex(s => s.id === status)

  return (
    <div className="relative flex items-start justify-between py-2">

      {/* Background track */}
      <div className="absolute top-5 inset-x-3 h-px bg-gray-200 -z-10" />

      {/* Progress fill */}
      <div
        className="absolute top-5 left-3 h-px bg-black -z-10 transition-all duration-700 ease-out"
        style={{ width: currentIndex > 0 ? `calc(${(currentIndex / (STEPS.length - 1)) * 100}% - 24px)` : '0%' }}
      />

      {STEPS.map((step, i) => {
        const done   = i < currentIndex
        const active = i === currentIndex

        return (
          <div key={step.id} className="flex flex-col items-center gap-3 flex-1 relative">
            <div className={`w-6 h-6 flex items-center justify-center transition-all duration-500 border bg-white ${
              done   ? 'bg-black border-black' :
              active ? 'border-black' :
              'border-gray-200'
            }`}>
              {done   && <Check className="w-3 h-3 text-white" />}
              {active && <div className="w-2 h-2 bg-black animate-pulse" />}
            </div>
            <span className={`text-[10px] font-bold uppercase tracking-widest text-center ${
              active ? 'text-black' : done ? 'text-gray-400' : 'text-gray-200'
            }`}>
              {step.label}
            </span>
          </div>
        )
      })}
    </div>
  )
}
