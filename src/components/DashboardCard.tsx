'use client';
import { ReactNode } from 'react';
import { Maximize2 } from 'lucide-react';

export const TIME_RANGE_OPTIONS = [
  'Last Week',
  'Last Month',
  'Last 6 Months',
  'Last Year',
  'All Time'
];

interface DashboardCardProps {
  title: string;
  timeRange?: string;
  onTimeRangeChange?: (range: string) => void;
  onMaximize: () => void;
  children: ReactNode;
}

export default function DashboardCard({
  title,
  timeRange = 'Last Month',
  onTimeRangeChange,
  onMaximize,
  children
}: DashboardCardProps) {
  return (
    <div className="bg-bg-card border border-border-panel rounded-card p-4 flex flex-col relative h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-text-primary">{title}</h3>
        <div className="flex items-center gap-2">
          {/* Custom Select Filter style matching Figma */}
          {onTimeRangeChange ? (
            <select
              value={timeRange}
              onChange={(e) => onTimeRangeChange(e.target.value)}
              className="text-[10px] text-text-primary bg-[#111827] border border-border-panel/80 px-2 py-1 rounded cursor-pointer hover:border-accent-blue focus:border-accent-blue transition-colors font-medium outline-none"
            >
              {TIME_RANGE_OPTIONS.map((option) => (
                <option key={option} value={option} className="bg-[#0b0f19] text-text-primary">
                  {option}
                </option>
              ))}
            </select>
          ) : (
            <div className="text-[10px] text-text-primary bg-bg-base border border-border-panel px-2.5 py-1 rounded select-none font-medium">
              <span>{timeRange}</span>
            </div>
          )}
          
          {/* Maximize Icon */}
          <button
            onClick={onMaximize}
            className="text-text-muted hover:text-text-primary p-1 rounded hover:bg-border-panel/20 transition-colors cursor-pointer"
            title="Maximize"
          >
            <Maximize2 size={12} />
          </button>
        </div>
      </div>
      {/* Content wrapper */}
      <div className="flex-1 flex items-center justify-center min-h-[220px]">
        {children}
      </div>
    </div>
  );
}
