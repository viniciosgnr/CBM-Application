'use client';
import { useState } from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, SlidersHorizontal } from 'lucide-react';

interface Column {
  key: string;
  header: string;
  render?: (val: any, row: any) => React.ReactNode;
}

interface CustomTableProps {
  columns: Column[];
  data: any[];
  title: string;
}

export default function CustomTable({ columns, data, title }: CustomTableProps) {
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1); // Reinicia para a primeira página ao filtrar
  };

  // Lógica de filtragem local baseada em cada coluna
  const filteredData = data.filter(row => {
    return Object.entries(filters).every(([key, filterVal]) => {
      if (!filterVal) return true;
      const cellValue = String(row[key] || '').toLowerCase();
      return cellValue.includes(filterVal.toLowerCase());
    });
  });

  // Lógica de paginação local
  const totalRows = filteredData.length;
  const startIndex = (currentPage - 1) * rowsPerPage;
  const paginatedData = filteredData.slice(startIndex, startIndex + rowsPerPage);
  const totalPages = Math.ceil(totalRows / rowsPerPage) || 1;

  return (
    <div className="w-full flex flex-col">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-text-primary">{title}</h3>
      </div>
      
      {/* Tabela */}
      <div className="overflow-x-auto border border-border-panel rounded-card bg-bg-card">
        <table className="w-full text-left border-collapse text-[11px]">
          <thead>
            <tr className="border-b border-border-panel bg-topbar text-text-muted select-none">
              {columns.map(col => (
                <th key={col.key} className="p-3 font-medium min-w-[130px] border-r border-border-panel/40 last:border-r-0">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="uppercase tracking-wider font-semibold text-[10px]">{col.header}</span>
                    <SlidersHorizontal size={10} className="text-text-muted opacity-60 flex-shrink-0" />
                  </div>
                  <input
                    type="text"
                    value={filters[col.key] || ''}
                    onChange={e => handleFilterChange(col.key, e.target.value)}
                    placeholder=""
                    className="w-full bg-transparent border-0 border-b border-border-panel/60 pb-1 text-[10px] text-text-primary focus:outline-none focus:border-accent-blue transition-colors font-normal"
                  />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedData.length > 0 ? (
              paginatedData.map((row, idx) => (
                <tr key={row.id || idx} className="border-b border-border-panel/40 hover:bg-border-panel/10 transition-colors last:border-b-0">
                  {columns.map(col => (
                    <td key={col.key} className="p-3 align-middle text-text-primary font-normal border-r border-border-panel/20 last:border-r-0 whitespace-nowrap overflow-hidden text-ellipsis max-w-[250px]">
                      {col.render ? col.render(row[col.key], row) : row[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="p-8 text-center text-text-muted font-medium">
                  Nenhum registro encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Paginação */}
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
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setCurrentPage(1)}
            disabled={currentPage === 1}
            className="p-1 hover:text-text-primary disabled:opacity-30 disabled:hover:text-text-muted cursor-pointer transition-colors"
            title="Primeira página"
          >
            <ChevronsLeft size={14} />
          </button>
          <button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="p-1 hover:text-text-primary disabled:opacity-30 disabled:hover:text-text-muted cursor-pointer transition-colors"
            title="Página anterior"
          >
            <ChevronLeft size={14} />
          </button>
          <span className="px-2 text-text-primary font-semibold">{currentPage}</span>
          <button
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            className="p-1 hover:text-text-primary disabled:opacity-30 disabled:hover:text-text-muted cursor-pointer transition-colors"
            title="Próxima página"
          >
            <ChevronRight size={14} />
          </button>
          <button
            onClick={() => setCurrentPage(totalPages)}
            disabled={currentPage === totalPages}
            className="p-1 hover:text-text-primary disabled:opacity-30 disabled:hover:text-text-muted cursor-pointer transition-colors"
            title="Última página"
          >
            <ChevronsRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
