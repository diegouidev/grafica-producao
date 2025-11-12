// src/app/(app)/empresa/DeleteUserModal.tsx
// (NOVO ARQUIVO)

"use client";

import { UserManagement } from "@/types";
import { AlertTriangle } from "lucide-react";

type DeleteUserModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading: boolean;
  usuario: UserManagement | null;
};

export default function DeleteUserModal({ isOpen, onClose, onConfirm, isLoading, usuario }: DeleteUserModalProps) {
  if (!isOpen || !usuario) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
        <div className="flex items-start gap-4">
          <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
            <AlertTriangle className="h-6 w-6 text-red-600" aria-hidden="true" />
          </div>
          <div className="mt-0 text-left">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Excluir Funcionário
            </h3>
            <div className="mt-2">
              <p className="text-sm text-gray-500">
                Você tem certeza que deseja excluir o usuário <strong>{usuario.first_name || usuario.username}</strong>?
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Esta ação não poderá ser desfeita.
              </p>
            </div>
          </div>
        </div>
        <div className="mt-5 sm:mt-4 flex justify-end gap-3">
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
            className="bg-red-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-red-700 disabled:bg-red-400"
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? 'Excluindo...' : 'Sim, Excluir'}
          </button>
        </div>
      </div>
    </div>
  );
}