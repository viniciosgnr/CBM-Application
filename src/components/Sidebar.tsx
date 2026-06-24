'use client';
import { ClipboardCheck } from 'lucide-react';

export default function Sidebar() {
  return (
    <aside className="fixed top-10 right-0 bottom-0 w-12 bg-topbar border-l border-border-panel flex flex-col items-center py-4 z-40">
      <div className="flex flex-col items-center gap-1 text-text-muted hover:text-text-primary cursor-pointer transition-colors select-none">
        <ClipboardCheck size={18} />
        <span className="text-[9px] font-medium mt-1">Task</span>
      </div>
    </aside>
  );
}
