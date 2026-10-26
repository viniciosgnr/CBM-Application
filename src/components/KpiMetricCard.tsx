'use client';
import { ReactNode, useState, useRef, useEffect } from 'react';
import { Info, X } from 'lucide-react';

interface KpiMetricCardProps {
  title: string;
  subtitle: string;
  value: string | number;
  infoTitle?: string;
  infoContent?: ReactNode;
}

export default function KpiMetricCard({
  title,
  subtitle,
  value,
  infoTitle,
  infoContent
}: KpiMetricCardProps) {
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
    <div className="bg-[#0b1329] border border-[#1e293b] rounded-xl p-5 flex flex-col justify-between hover:border-[#334155]/80 transition-all shadow-sm relative">
      <div>
        <div className="flex items-center gap-1.5" ref={infoRef}>
          <h3 className="text-xs sm:text-sm font-semibold text-[#cbd5e1] tracking-wide">{title}</h3>
          
          {infoContent && (
            <div className="relative inline-flex items-center">
              <button
                type="button"
                onClick={() => setShowInfo(!showInfo)}
                className={`p-0.5 rounded-full transition-colors cursor-pointer ${
                  showInfo
                    ? 'text-accent-blue bg-accent-blue/15'
                    : 'text-[#64748b] hover:text-[#94a3b8] hover:bg-[#1e293b]'
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
        
        {subtitle && (
          <p className="text-[11px] text-[#64748b] mt-1 font-medium leading-tight">
            {subtitle}
          </p>
        )}
      </div>

      <div className="mt-4 pt-1">
        <span className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          {value}
        </span>
      </div>
    </div>
  );
}
