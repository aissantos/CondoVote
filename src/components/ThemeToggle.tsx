import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

interface ThemeToggleProps {
  className?: string;
}

export default function ThemeToggle({ className }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={
        className ||
        "fixed bottom-6 right-6 z-50 p-3 rounded-full bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 shadow-xl border border-slate-200 dark:border-slate-700 hover:scale-110 transition-transform focus:outline-none"
      }
      aria-label="Alternar Tema"
    >
      {theme === 'light' ? <Moon size={24} className={className ? "size-5" : ""} /> : <Sun size={24} className={className ? "size-5" : ""} />}
    </button>
  );
}
