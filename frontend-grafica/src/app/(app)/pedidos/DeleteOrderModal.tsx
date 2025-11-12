// src/app/(app)/pedidos/DeleteOrderModal.tsx (ou caminho similar)

import { Pedido } from "@/types";
import { X, Trash2, AlertTriangle, Loader2 } from "lucide-react";

type DeleteOrderModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading: boolean;
  pedido: Pedido | null;
};

export default function DeleteOrderModal({
  isOpen,
  onClose,
  onConfirm,
  isLoading,
  pedido,
}: DeleteOrderModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-lg w-full max-w-md p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Confirmar Exclusão</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        <div className="flex items-start gap-4">
            <div className="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <div className="mt-0 text-left">
                <p className="text-sm text-gray-600">
                    Você tem certeza que deseja excluir o pedido{" "}
                    <strong className="text-gray-900">PED-{pedido?.id}</strong>
                    ?
                </p>
                <p className="text-sm text-gray-500 mt-2">
                    Esta ação não pode ser desfeita. Todos os dados associados a este pedido serão permanentemente removidos.
                </p>
            </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-red-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50 disabled:bg-red-400"
          >
            {isLoading ? (
                <>
                    <Loader2 className="animate-spin" size={18} />
                    Excluindo...
                </>
            ) : (
                <>
                    <Trash2 size={18} />
                    Excluir
                </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}