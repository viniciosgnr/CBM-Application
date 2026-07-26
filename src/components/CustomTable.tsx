'use client';
import { useState, useRef, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  SlidersHorizontal,
  Search
} from 'lucide-react';

interface Column {
  key: string;
  header: string;
  render?: (val: string, row: Record<string, string>) => React.ReactNode;
}

interface CustomTableProps {
  columns: Column[];
  data: Record<string, string>[];
  title: string;
  onRowClick?: (row: Record<string, string>) => void;
}

export default function CustomTable({ columns, data, title, onRowClick }: CustomTableProps) {
  // Column popover state
  const [activeFilterCol, setActiveFilterCol] = useState<string | null>(null);
  
  // Selected filter values per column: key -> Set of allowed raw string values
  const [selectedFilters, setSelectedFilters] = useState<Record<string, Set<string>>>({});
  
  // Internal popover search input state per column
  const [searchQueries, setSearchQueries] = useState<Record<string, string>>({});

  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  const popoverRef = useRef<HTMLDivElement>(null);

  // Close popover on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setActiveFilterCol(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Extract all unique values for a given column key from data
  const getUniqueValues = (key: string): string[] => {
    const valuesSet = new Set<string>();
    data.forEach(row => {
      let val = row[key] !== undefined && row[key] !== null ? String(row[key]) : '';
      if (val.includes(' - Tier ')) {
        val = val.split(' - Tier ')[0];
      }
      if (val) valuesSet.add(val);
    });
    return Array.from(valuesSet).sort();
  };

  // Get currently allowed Set of values for a column (default: all unique values allowed)
  const getSelectedSet = (key: string): Set<string> => {
    if (selectedFilters[key]) {
      return selectedFilters[key];
    }
    return new Set(getUniqueValues(key));
  };

  // Toggle a single value selection
  const handleToggleValue = (key: string, val: string) => {
    const currentSet = new Set(getSelectedSet(key));

    if (currentSet.has(val)) {
      currentSet.delete(val);
    } else {
      currentSet.add(val);
    }

    setSelectedFilters(prev => ({
      ...prev,
      [key]: currentSet
    }));
    setCurrentPage(1);
  };

  // Toggle Select All
  const handleToggleSelectAll = (key: string) => {
    const allValues = getUniqueValues(key);
    const currentSet = getSelectedSet(key);
    
    // If all are currently selected, deselect all; else select all
    if (currentSet.size === allValues.length) {
      setSelectedFilters(prev => ({
        ...prev,
        [key]: new Set()
      }));
    } else {
      setSelectedFilters(prev => ({
        ...prev,
        [key]: new Set(allValues)
      }));
    }
    setCurrentPage(1);
  };

  // Format header summary text e.g. "(3) UNY,CDI,SEP"
  const getHeaderSummary = (key: string): string => {
    const allValues = getUniqueValues(key);
    if (allValues.length === 0) return '';
    
    const selectedSet = selectedFilters[key];
    if (!selectedSet || selectedSet.size === allValues.length || selectedSet.size === 0) {
      return '';
    }

    const selectedArray = Array.from(selectedSet);
    return `(${selectedArray.length}) ${selectedArray.join(',')}`;
  };

  // Filter dataset based on selected values for all columns
  const filteredData = data.filter(row => {
    return columns.every(col => {
      const allValues = getUniqueValues(col.key);
      const selectedSet = selectedFilters[col.key];
      
      // If no filter state is set or all items are selected, show row
      if (!selectedSet || selectedSet.size === allValues.length) return true;
      
      let cellVal = String(row[col.key] || '');
      if (cellVal.includes(' - Tier ')) {
        cellVal = cellVal.split(' - Tier ')[0];
      }
      return selectedSet.has(cellVal);
    });
  });

  // Pagination logic
  const totalRows = filteredData.length;
  const startIndex = (currentPage - 1) * rowsPerPage;
  const paginatedData = filteredData.slice(startIndex, startIndex + rowsPerPage);
  const totalPages = Math.ceil(totalRows / rowsPerPage) || 1;

  return (
    <div className="w-full flex flex-col">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-text-primary">{title}</h3>
      </div>
      
      {/* Table Wrapper */}
      <div className="overflow-x-auto bg-bg-card relative">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-border-panel bg-bg-panel/40 select-none">
              {columns.map(col => {
                const uniqueValues = getUniqueValues(col.key);
                const selectedSet = getSelectedSet(col.key);
                const query = searchQueries[col.key] || '';
                
                // Filter unique values by popover search input
                const filteredOptions = uniqueValues.filter(val =>
                  val.toLowerCase().includes(query.toLowerCase())
                );

                const isAllSelected = selectedSet.size === uniqueValues.length && uniqueValues.length > 0;
                const isSomeSelected = selectedSet.size > 0 && selectedSet.size < uniqueValues.length;
                const summaryText = getHeaderSummary(col.key);
                const isOpen = activeFilterCol === col.key;

                return (
                  <th
                    key={col.key}
                    className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-text-primary whitespace-nowrap relative"
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span>{col.header}</span>
                    </div>

                    {/* Filter Input & Icon Line (Underline style without box borders, icon on the right) */}
                    <div className="flex items-center gap-1.5 mt-1.5 w-full relative">
                      <div
                        onClick={() => setActiveFilterCol(isOpen ? null : col.key)}
                        className={`flex items-center justify-between gap-1.5 w-full bg-transparent border-b py-1 cursor-pointer transition-colors ${
                          isOpen || summaryText
                            ? 'border-accent-blue text-accent-blue font-semibold'
                            : 'border-border-panel/40 text-text-muted hover:border-border-panel'
                        }`}
                      >
                        <span className="text-[10px] font-medium truncate flex-1 text-left min-h-[14px]">
                          {summaryText || ''}
                        </span>
                        <SlidersHorizontal size={11} className="flex-shrink-0" />
                      </div>

                      {/* Multiselect Popover Dropdown */}
                      {isOpen && (
                        <div
                          ref={popoverRef}
                          className="absolute top-full left-0 mt-1 w-64 bg-[#0d121f] border border-border-panel rounded-lg shadow-2xl p-3 z-50 animate-fadeIn text-left normal-case font-normal text-xs text-text-primary"
                        >
                          {/* Search Input */}
                          <div className="relative mb-2.5">
                            <Search size={12} className="absolute left-2.5 top-2.5 text-text-muted" />
                            <input
                              type="text"
                              value={query}
                              onChange={e =>
                                setSearchQueries(prev => ({ ...prev, [col.key]: e.target.value }))
                              }
                              placeholder="Search..."
                              className="w-full bg-[#111827] border border-border-panel/80 rounded pl-7 pr-2.5 py-1.5 text-xs text-text-primary focus:border-accent-blue focus:outline-none"
                            />
                          </div>

                          {/* Options Checklist */}
                          <div className="flex flex-col gap-1 max-h-48 overflow-y-auto pr-1">
                            {/* (Select All) Checkbox */}
                            <label className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-bg-panel/40 cursor-pointer font-semibold select-none text-text-primary">
                              <input
                                type="checkbox"
                                checked={isAllSelected}
                                ref={el => {
                                  if (el) el.indeterminate = isSomeSelected;
                                }}
                                onChange={() => handleToggleSelectAll(col.key)}
                                className="accent-accent-blue cursor-pointer"
                              />
                              <span className="text-xs">
                                (Select All)
                              </span>
                            </label>

                            <hr className="border-border-panel/40 my-1" />

                            {/* Column Unique Values */}
                            {filteredOptions.length > 0 ? (
                              filteredOptions.map(val => {
                                const isChecked = selectedSet.has(val);
                                return (
                                  <label
                                    key={val}
                                    className="flex items-center gap-2 px-2 py-1 rounded hover:bg-bg-panel/40 cursor-pointer text-text-primary select-none text-xs"
                                  >
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={() => handleToggleValue(col.key, val)}
                                      className="accent-accent-blue cursor-pointer"
                                    />
                                    <span className="truncate">{val}</span>
                                  </label>
                                );
                              })
                            ) : (
                              <span className="text-text-muted text-xs p-2 italic">No options found</span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {paginatedData.length > 0 ? (
              paginatedData.map((row, idx) => (
                <tr
                  key={row.id || idx}
                  onClick={() => onRowClick?.(row)}
                  className={`border-b border-border-panel hover:bg-bg-panel/40 transition-colors last:border-b-0 ${
                    onRowClick ? 'cursor-pointer' : ''
                  }`}
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
                  No records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination component */}
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
