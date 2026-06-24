'use client';
import { ReactNode } from 'react';
import { Maximize2 } from 'lucide-react';

interface DashboardCardProps {
  title: string;
  filterText: string;
  onMaximize: () => void;
  children: ReactNode;
}

export default function DashboardCard({ title, filterText, onMaximize, children }: DashboardCardProps) {
  return (
    <div className="bg-bg-card border border-border-panel rounded-card p-4 flex flex-col relative h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-text-primary">{title}</h3>
        <div className="flex items-center gap-2">
          {/* Custom Select Filter style matching Figma */}
          <div className="text-[10px] text-text-primary bg-bg-base border border-border-panel px-2.5 py-1 rounded cursor-pointer hover:bg-border-panel/30 transition-colors flex items-center gap-1.5 select-none font-medium">
            <span>{filterText}</span>
            <span className="text-[8px] opacity-75">▼</span>
          </div>
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
