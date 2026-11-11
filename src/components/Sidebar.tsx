'use client';
import { Bell, CheckSquare, MessageSquare } from 'lucide-react';

interface SidebarProps {
  onOpenTaskDrawer?: () => void;
  isTaskDrawerOpen?: boolean;
  notificationCount?: number;
}

export default function Sidebar({
  onOpenTaskDrawer,
  isTaskDrawerOpen = false,
  notificationCount = 4,
}: SidebarProps) {
  return (
    <aside className="fixed top-10 right-0 bottom-0 w-14 bg-[#080c16] border-l border-[#1a2238] flex flex-col items-center py-4 gap-5 z-40 select-none">
      {/* Notification */}
      <button
        type="button"
        onClick={onOpenTaskDrawer}
        className="w-full py-2 flex flex-col items-center gap-1.5 text-text-muted hover:text-text-primary cursor-pointer transition-colors relative group"
        title="Notifications"
      >
        <div className="relative">
          <Bell size={18} className="group-hover:text-text-primary transition-colors" />
          <span className="absolute -top-1.5 -right-2.5 w-4 h-4 rounded-full bg-[#ef4444] text-white text-[9px] font-bold flex items-center justify-center shadow">
            {notificationCount}
          </span>
        </div>
        <span className="text-[9px] font-medium tracking-tight truncate max-w-[48px]">Notifica...</span>
      </button>

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

      {/* Discussion */}
      <button
        type="button"
        onClick={onOpenTaskDrawer}
        className="w-full py-2 flex flex-col items-center gap-1.5 text-text-muted hover:text-text-primary cursor-pointer transition-colors group"
        title="Discussions"
      >
        <MessageSquare size={18} className="group-hover:text-text-primary transition-colors" />
        <span className="text-[9px] font-medium tracking-tight truncate max-w-[48px]">Discussi...</span>
      </button>
    </aside>
  );
}
