'use client';
import Image from 'next/image';
import { HelpCircle, Home, Sun, Moon } from 'lucide-react';
import { useTheme } from '@/components/context/ThemeContext';

export default function Header() {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-10 bg-topbar border-b border-border-panel flex items-center justify-between px-4">
      <div className="flex items-center gap-3">
        {/* SLB Logo */}
        <Image
          src="/slb-logo.png"
          alt="SLB"
          width={68}
          height={32}
          priority
          className="h-7 w-auto object-contain"
        />
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1 text-[11px] text-text-muted">
          <Home size={12} className="flex-shrink-0" />
          <span className="mx-0.5">›</span>
          <span>Gas Compression</span>
          <span className="mx-0.5">›</span>
          <span className="text-text-primary font-medium">Main Gas Compression</span>
        </nav>
      </div>
      <div className="flex items-center gap-4">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          aria-label="Toggle theme"
          className="text-text-muted hover:text-text-primary transition-colors cursor-pointer"
        >
          {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
        </button>
        {/* Help Icon */}
        <HelpCircle size={14} className="text-text-muted hover:text-text-primary cursor-pointer transition-colors" />
        {/* User profile avatar initials */}
        <div className="w-6 h-6 rounded-full bg-accent-blue flex items-center justify-center text-[10px] font-semibold text-white select-none">
          UR
        </div>
      </div>
    </header>
  );
}
