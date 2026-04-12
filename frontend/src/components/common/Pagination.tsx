import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { PaginationMeta } from '../../types/api.types'

interface PaginationProps {
  meta: PaginationMeta
  onPageChange: (page: number) => void
}

export default function Pagination({ meta, onPageChange }: PaginationProps) {
  const { page, lastPage, total, perPage } = meta
  const from = (page - 1) * perPage + 1
  const to = Math.min(page * perPage, total)

  return (
    <div className="flex items-center justify-between px-1 py-3 text-sm text-white/50">
      <span>{from}–{to} sur {total}</span>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="rounded-lg p-1.5 hover:bg-white/5 disabled:opacity-30"
          aria-label="Page précédente"
        >
          <ChevronLeft size={16} />
        </button>
        <span className="px-3 text-white/70">{page} / {lastPage}</span>
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= lastPage}
          className="rounded-lg p-1.5 hover:bg-white/5 disabled:opacity-30"
          aria-label="Page suivante"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  )
}
