// src/app/(app)/orcamentos/ApproveQuoteModal.tsx

"use client";

import { Orcamento } from "@/types";
import { CheckCircle } from "lucide-react";

type ApproveQuoteModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading: boolean;
  orcamento: Orcamento | null;
};

export default function ApproveQuoteModal({ isOpen, onClose, onConfirm, isLoading, orcamento }: ApproveQuoteModalProps) {
  if (!isOpen || !orcamento) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
        <div className="flex items-start gap-4">
          <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
            <CheckCircle className="h-6 w-6 text-green-600" aria-hidden="true" />
          </div>
          <div className="mt-0 text-left">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Aprovar Orçamento
            </h3>
            <div className="mt-2">
              <p className="text-sm text-gray-500">
                Você tem certeza que deseja aprovar o orçamento <strong>#{orcamento.id}</strong> e convertê-lo em um pedido?
              </p>
            </div>
          </div>
        </div>
        <div className="mt-5 flex justify-end gap-3">
          <button
            type="button"
            className="bg-white text-gray-700 font-bold py-2 px-4 rounded-lg border hover:bg-gray-100"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="bg-green-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-700 disabled:bg-green-400"
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? 'Aprovando...' : 'Sim, Aprovar'}
          </button>
        </div>
      </div>
    </div>
  );
}