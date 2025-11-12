// src/app/(app)/produtos/DeleteProductModal.tsx

"use client";

import { Produto } from "@/types";
import { AlertTriangle } from "lucide-react";

type DeleteProductModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading: boolean;
  produto: Produto | null;
};

export default function DeleteProductModal({ isOpen, onClose, onConfirm, isLoading, produto }: DeleteProductModalProps) {
  if (!isOpen || !produto) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
        <div className="flex items-start gap-4">
          <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
            <AlertTriangle className="h-6 w-6 text-red-600" aria-hidden="true" />
          </div>
          <div className="mt-0 text-left">
            <h3 className="text-lg font-medium text-gray-900">
              Excluir Produto
            </h3>
            <div className="mt-2">
              <p className="text-sm text-gray-500">
                Você tem certeza que deseja excluir o produto <strong>{produto.nome}</strong>? Esta ação não poderá ser desfeita.
              </p>
            </div>
          </div>
        </div>
        <div className="mt-5 flex justify-end gap-3">
          <button type="button" className="bg-white text-gray-700 font-bold py-2 px-4 rounded-lg border hover:bg-gray-100" onClick={onClose} disabled={isLoading}>
            Cancelar
          </button>
          <button type="button" className="bg-red-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-red-700 disabled:bg-red-400" onClick={onConfirm} disabled={isLoading}>
            {isLoading ? 'Excluindo...' : 'Sim, Excluir'}
          </button>
        </div>
      </div>
    </div>
  );
}