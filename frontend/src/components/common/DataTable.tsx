import {
  useReactTable, getCoreRowModel, flexRender,
  type ColumnDef, type PaginationState,
} from '@tanstack/react-table'
import Spinner from './Spinner'
import EmptyState from './EmptyState'

interface DataTableProps<T> {
  data: T[]
  columns: ColumnDef<T>[]
  isLoading?: boolean
  pagination?: PaginationState
  onPaginationChange?: (p: PaginationState) => void
  pageCount?: number
  emptyTitle?: string
  emptyDescription?: string
}

export default function DataTable<T>({
  data, columns, isLoading = false,
  emptyTitle = 'Aucun résultat', emptyDescription,
}: DataTableProps<T>) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!data.length) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-white/5">
      <table className="w-full text-sm">
        <thead className="border-b border-white/5 bg-white/3">
          {table.getHeaderGroups().map((hg) => (
            <tr key={hg.id}>
              {hg.headers.map((header) => (
                <th key={header.id} className="px-4 py-3 text-left text-xs font-medium text-white/40">
                  {flexRender(header.column.columnDef.header, header.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody className="divide-y divide-white/5">
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id} className="hover:bg-white/3 transition-colors">
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className="px-4 py-3 text-white/80">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
