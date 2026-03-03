// ConfirmDialog — wrapper reutilizável sobre Modal para caixas de confirmação destrutivas.
// Substitui window.confirm() em todo o codebase — não bloqueia a UI e é acessível (WCAG 2.1).

import React from 'react';
import Modal from './Modal';

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  /** Texto do botão destrutivo. Padrão: 'Confirmar' */
  confirmLabel?: string;
  /** Texto do botão cancelar. Padrão: 'Cancelar' */
  cancelLabel?: string;
  /** Estilo do botão de confirmação. 'danger' = vermelho, 'warning' = laranja. Padrão: 'danger' */
  variant?: 'danger' | 'warning';
  /** Desabilita os botões durante operação assíncrona */
  loading?: boolean;
}

/**
 * Caixa de diálogo de confirmação acessível.
 * Usa o Modal.tsx existente (FocusTrap + Esc + role="dialog").
 *
 * @example
 * <ConfirmDialog
 *   open={!!pendingDelete}
 *   onClose={() => setPendingDelete(null)}
 *   onConfirm={handleDelete}
 *   title="Excluir pauta"
 *   message="Esta ação é permanente e não pode ser desfeita."
 * />
 */
export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  variant = 'danger',
  loading = false,
}: ConfirmDialogProps) {
  const confirmClass =
    variant === 'danger'
      ? 'bg-red-600 hover:bg-red-500 focus-visible:ring-red-500'
      : 'bg-orange-500 hover:bg-orange-400 focus-visible:ring-orange-400';

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      maxWidth="max-w-sm"
      disabled={loading}
    >
      <div className="p-6 space-y-6">
        <p className="text-sm text-slate-300 leading-relaxed">{message}</p>

        <div className="flex gap-3 justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-700 rounded-xl transition-colors disabled:opacity-40"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`px-4 py-2 text-sm font-bold text-white rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 disabled:opacity-40 ${confirmClass}`}
          >
            {loading ? 'Aguarde...' : confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}
