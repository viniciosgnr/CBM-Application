'use client';
import { CheckSquare } from 'lucide-react';

interface SidebarProps {
  onOpenTaskDrawer?: () => void;
  isTaskDrawerOpen?: boolean;
}

export default function Sidebar({
  onOpenTaskDrawer,
  isTaskDrawerOpen = false,
}: SidebarProps) {
  return (
    <aside className="fixed top-10 right-0 bottom-0 w-14 bg-[#080c16] border-l border-[#1a2238] flex flex-col items-center py-4 gap-5 z-40 select-none">
      {/* Task */}
      <button
        type="button"
        onClick={onOpenTaskDrawer}
        className={`w-full py-2.5 flex flex-col items-center gap-1.5 cursor-pointer transition-colors border-y border-[#1a2238]/60 ${
          isTaskDrawerOpen
            ? 'bg-[#11192e] text-[#60a5fa] font-semibold'
            : 'text-[#60a5fa] hover:bg-[#11192e]/60'
        }`}
        title="Open Task Manager"
      >
        <CheckSquare size={18} />
        <span className="text-[10px] font-medium">Task</span>
      </button>
    </aside>
  );
}
