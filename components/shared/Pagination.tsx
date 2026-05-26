import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface Props {
  page:       number
  totalPages: number
  basePath:   string
  /** Extra search params to preserve (e.g. filters) */
  extra?:     Record<string, string>
}

export function Pagination({ page, totalPages, basePath, extra = {} }: Props) {
  if (totalPages <= 1) return null

  const href = (p: number) => {
    const params = new URLSearchParams({ ...extra, page: String(p) })
    return `${basePath}?${params}`
  }

  return (
    <div className="flex items-center justify-center gap-4 mt-10">
      {page > 1 ? (
        <Link
          href={href(page - 1)}
          className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors"
        >
          <ChevronLeft className="w-3.5 h-3.5" /> Precedente
        </Link>
      ) : (
        <span className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-300 border border-gray-100 cursor-default">
          <ChevronLeft className="w-3.5 h-3.5" /> Precedente
        </span>
      )}

      <span className="text-xs text-gray-400 tabular-nums">
        {page} / {totalPages}
      </span>

      {page < totalPages ? (
        <Link
          href={href(page + 1)}
          className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors"
        >
          Successivo <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      ) : (
        <span className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-300 border border-gray-100 cursor-default">
          Successivo <ChevronRight className="w-3.5 h-3.5" />
        </span>
      )}
    </div>
  )
}
