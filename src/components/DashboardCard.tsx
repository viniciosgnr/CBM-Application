'use client';
import { ReactNode, useState, useRef, useEffect } from 'react';
import { Maximize2, Info, X } from 'lucide-react';

export const TIME_RANGE_OPTIONS = [
  'Last Month',
  'Last 3 Months',
  'Last 6 Months',
  'Last Year',
  'All Time'
];

interface DashboardCardProps {
  title: string | ReactNode;
  timeRange?: string;
  onTimeRangeChange?: (range: string) => void;
  onMaximize: () => void;
  timeRangeOptions?: string[];
  infoContent?: ReactNode;
  infoTitle?: string;
  children: ReactNode;
}

export default function DashboardCard({
  title,
  timeRange = 'Last Month',
  onTimeRangeChange,
  onMaximize,
  timeRangeOptions,
  infoContent,
  infoTitle,
  children
}: DashboardCardProps) {
  const options = timeRangeOptions || TIME_RANGE_OPTIONS;
  const [showInfo, setShowInfo] = useState(false);
  const infoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (infoRef.current && !infoRef.current.contains(event.target as Node)) {
        setShowInfo(false);
      }
    }
    if (showInfo) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showInfo]);

  return (
    <div className="bg-bg-card border border-border-panel rounded-card p-4 flex flex-col relative h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-1.5" ref={infoRef}>
          {typeof title === 'string' ? (
            <h3 className="text-sm font-semibold text-text-primary">{title}</h3>
          ) : (
            title
          )}
          {infoContent && (
            <div className="relative inline-flex items-center">
              <button
                type="button"
                onClick={() => setShowInfo(!showInfo)}
                className={`p-1 rounded-full transition-colors cursor-pointer ${
                  showInfo
                    ? 'text-accent-blue bg-accent-blue/15'
                    : 'text-text-muted hover:text-text-primary hover:bg-border-panel/40'
                }`}
                title="View Calculation Methodology"
                aria-label="View calculation methodology"
              >
                <Info size={13} />
              </button>

              {showInfo && (
                <div
                  className="absolute left-0 top-full mt-2 w-80 sm:w-[380px] bg-[#0c101d] border border-[#2b3552] rounded-xl p-3.5 shadow-2xl z-50 text-left animate-fadeIn backdrop-blur-md"
                  style={{ boxShadow: '0 12px 35px rgba(0, 0, 0, 0.75)' }}
                >
                  <div className="flex items-center justify-between border-b border-[#1e2538] pb-2 mb-2.5">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-accent-blue animate-pulse" />
                      <span className="text-xs font-bold text-[#f8fafc] tracking-wide">
                        {infoTitle || 'Calculation Methodology'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowInfo(false)}
                      className="text-text-muted hover:text-text-primary transition-colors cursor-pointer p-0.5 rounded hover:bg-[#1e2538]"
                      title="Close"
                    >
                      <X size={13} />
                    </button>
                  </div>
                  <div className="text-[11px] text-[#cbd5e1] leading-relaxed space-y-2">
                    {infoContent}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* Custom Select Filter style matching Figma */}
          {onTimeRangeChange ? (
            <select
              value={timeRange}
              onChange={(e) => onTimeRangeChange(e.target.value)}
              className="text-[10px] text-text-primary bg-[#111827] border border-border-panel/80 px-2 py-1 rounded cursor-pointer hover:border-accent-blue focus:border-accent-blue transition-colors font-medium outline-none"
            >
              {options.map((option) => (
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
