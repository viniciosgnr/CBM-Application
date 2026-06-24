'use client';
import { useState } from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, SlidersHorizontal } from 'lucide-react';

interface Column {
  key: string;
  header: string;
  render?: (val: string, row: Record<string, string>) => React.ReactNode;
}

interface CustomTableProps {
  columns: Column[];
  data: Record<string, string>[];
  title: string;
}

export default function CustomTable({ columns, data, title }: CustomTableProps) {
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1); // Reset to first page on filtering
  };

  // Local filtering logic per column
  const filteredData = data.filter(row => {
    return Object.entries(filters).every(([key, filterVal]) => {
      if (!filterVal) return true;
      const cellValue = String(row[key] || '').toLowerCase();
      return cellValue.includes(filterVal.toLowerCase());
    });
  });

  // Local pagination logic
  const totalRows = filteredData.length;
  const startIndex = (currentPage - 1) * rowsPerPage;
  const paginatedData = filteredData.slice(startIndex, startIndex + rowsPerPage);
  const totalPages = Math.ceil(totalRows / rowsPerPage) || 1;

  return (
    <div className="w-full flex flex-col">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-text-primary">{title}</h3>
      </div>
      
      {/* Table Wrapper (No vertical borders, auto width to prevent overflow) */}
      <div className="overflow-x-auto bg-bg-card">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-border-panel bg-bg-panel/40 select-none">
              {columns.map(col => (
                <th
                  key={col.key}
                  className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-text-primary whitespace-nowrap"
                >
                  <div className="flex items-center justify-between gap-1">
                    <span>{col.header}</span>
                  </div>
                  {/* Underlined filter input with SlidersHorizontal icon on the right */}
                  <div className="flex items-center gap-1 mt-1.5 w-full">
                    <input
                      type="text"
                      value={filters[col.key] || ''}
                      onChange={e => handleFilterChange(col.key, e.target.value)}
                      placeholder=""
                      className="filter-input"
                    />
                    <SlidersHorizontal size={11} className="text-text-muted flex-shrink-0" />
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedData.length > 0 ? (
              paginatedData.map((row, idx) => (
                <tr
                  key={row.id || idx}
                  className="border-b border-border-panel hover:bg-bg-panel/40 transition-colors last:border-b-0"
                >
                  {columns.map(col => (
                    <td
                      key={col.key}
                      className="px-4 py-2.5 text-[#a2b4cd] text-[11px] font-normal break-words whitespace-normal"
                    >
                      {col.render ? col.render(row[col.key], row) : row[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="px-4 py-8 text-center text-text-muted text-xs font-medium">
                  Nenhum registro encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination component matching design */}
      <div className="flex items-center justify-end gap-6 mt-4 text-[11px] text-text-muted select-none">
        <div className="flex items-center gap-2">
          <span>Rows per page:</span>
          <select
            value={rowsPerPage}
            onChange={e => {
              setRowsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="bg-bg-card border border-border-panel rounded px-1.5 py-0.5 text-text-primary focus:outline-none text-[11px] cursor-pointer"
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
          </select>
        </div>
        <div>
          <span>
            {totalRows > 0 ? startIndex + 1 : 0}-{Math.min(startIndex + rowsPerPage, totalRows)} of {totalRows}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setCurrentPage(1)}
            disabled={currentPage === 1}
            className="p-1 hover:text-text-primary disabled:opacity-30 disabled:hover:text-text-muted cursor-pointer transition-colors"
            title="First Page"
          >
            <ChevronsLeft size={14} />
          </button>
          <button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="p-1 hover:text-text-primary disabled:opacity-30 disabled:hover:text-text-muted cursor-pointer transition-colors"
            title="Previous Page"
          >
            <ChevronLeft size={14} />
          </button>
          <span className="px-2 text-text-primary font-semibold">{currentPage}</span>
          <button
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            className="p-1 hover:text-text-primary disabled:opacity-30 disabled:hover:text-text-muted cursor-pointer transition-colors"
            title="Next Page"
          >
            <ChevronRight size={14} />
          </button>
          <button
            onClick={() => setCurrentPage(totalPages)}
            disabled={currentPage === totalPages}
            className="p-1 hover:text-text-primary disabled:opacity-30 disabled:hover:text-text-muted cursor-pointer transition-colors"
            title="Last Page"
          >
            <ChevronsRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
