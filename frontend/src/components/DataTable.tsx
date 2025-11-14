import { useMemo } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  ColumnDef,
  SortingState,
} from '@tanstack/react-table'
import { useState } from 'react'
import { ArrowUp, ArrowDown } from 'lucide-react'
import './DataTable.css'

interface DataTableProps {
  data: any
}

function DataTable({ data }: DataTableProps) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [globalFilter, setGlobalFilter] = useState('')

  // Convert data to table format
  const tableData = useMemo(() => {
    if (!data) return []

    // If data is an array, use it directly
    if (Array.isArray(data)) {
      return data
    }

    // If data is an object, convert to key-value pairs
    if (typeof data === 'object') {
      return Object.entries(data).map(([key, value]) => ({
        property: key,
        value: typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value),
      }))
    }

    return []
  }, [data])

  // Generate columns dynamically
  const columns = useMemo<ColumnDef<any>[]>(() => {
    if (tableData.length === 0) return []

    const firstRow = tableData[0]
    const keys = Object.keys(firstRow)

    return keys.map((key) => ({
      accessorKey: key,
      header: key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1'),
      cell: (info) => {
        const value = info.getValue()
        if (typeof value === 'object') {
          return <pre>{JSON.stringify(value, null, 2)}</pre>
        }
        return String(value)
      },
    }))
  }, [tableData])

  const table = useReactTable({
    data: tableData,
    columns,
    state: {
      sorting,
      globalFilter,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  })

  if (tableData.length === 0) {
    return (
      <div className="no-data">
        <p>No tabular data available for this object</p>
      </div>
    )
  }

  return (
    <div className="data-table-container">
      <div className="table-controls">
        <input
          type="text"
          placeholder="Search..."
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="search-input"
        />
        <span className="row-count">{tableData.length} rows</span>
      </div>

      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th key={header.id}>
                    {header.isPlaceholder ? null : (
                      <div
                        className={`header-cell ${header.column.getCanSort() ? 'sortable' : ''}`}
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {header.column.getIsSorted() && (
                          <span className="sort-icon">
                            {header.column.getIsSorted() === 'desc' ? (
                              <ArrowDown size={14} />
                            ) : (
                              <ArrowUp size={14} />
                            )}
                          </span>
                        )}
                      </div>
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default DataTable
