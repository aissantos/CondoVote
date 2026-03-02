// P2.2 — Componente Modal acessível (WCAG 2.1 AA)
// Encapsula: role="dialog", aria-modal, aria-labelledby, FocusTrap, Esc para fechar

import React, { useEffect, useId } from 'react';
import FocusTrap from 'focus-trap-react';
import { X } from 'lucide-react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  /** Largura máxima do painel, default 'max-w-2xl' */
  maxWidth?: string;
  /** Desabilitar o botão/overlay de fechar (ex: enquanto submitting) */
  disabled?: boolean;
}

/**
 * Wrapper de modal acessível:
 * - Prende o foco no conteúdo (FocusTrap)
 * - Fecha com Esc
 * - role="dialog" + aria-modal + aria-labelledby
 * - Overlay escuro com blur
 * - Scroll interno quando o conteúdo excede a altura
 */
export default function Modal({ open, onClose, title, children, maxWidth = 'max-w-2xl', disabled = false }: ModalProps) {
  const titleId = useId();

  // Fechar com Esc
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !disabled) onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, disabled, onClose]);

  // Bloquear scroll do body
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      aria-hidden="false"
      onClick={(e) => { if (e.target === e.currentTarget && !disabled) onClose(); }}
    >
      <FocusTrap
        focusTrapOptions={{
          escapeDeactivates: false, // tratamos Esc manualmente acima
          allowOutsideClick: true,
          fallbackFocus: '[data-modal-title]',
        }}
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          className={`bg-slate-800 rounded-3xl w-full ${maxWidth} shadow-2xl border border-slate-700 overflow-hidden flex flex-col max-h-[90vh]`}
        >
          {/* Header */}
          <div className="p-6 border-b border-slate-700 flex justify-between items-center bg-slate-900/50 shrink-0">
            <h2
              id={titleId}
              data-modal-title
              className="text-xl font-bold text-white"
            >
              {title}
            </h2>
            <button
              onClick={onClose}
              disabled={disabled}
              aria-label="Fechar modal"
              className="text-slate-400 hover:text-white transition-colors disabled:opacity-40 rounded-lg p-1 focus-visible:ring-2 focus-visible:ring-blue-500 outline-none"
            >
              <X size={24} aria-hidden="true" />
            </button>
          </div>

          {/* Body com scroll */}
          <div className="flex-1 overflow-y-auto">
            {children}
          </div>
        </div>
      </FocusTrap>
    </div>
  );
}
