// src/app/(app)/pedidos/UpdateStatusModal.tsx

"use client";

import { useState, useEffect } from "react";
import { Pedido } from "@/types";
import { api } from "@/lib/api";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";

type UpdateStatusModalProps = {
  isOpen: boolean;
  onClose: () => void;
  pedido: Pedido | null;
};

// Lista de status de produção possíveis
const statusProducaoOptions = [
  "Aguardando",
  "Aguardando Arte",
  "Em Produção",
  "Finalizado",
  "Entregue",
];

export default function UpdateStatusModal({ isOpen, onClose, pedido }: UpdateStatusModalProps) {
  const router = useRouter();
  const [statusProducao, setStatusProducao] = useState('');
  const [statusPagamento, setStatusPagamento] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (pedido) {
      setStatusProducao(pedido.status_producao);
      setStatusPagamento(pedido.status_pagamento);
    }
  }, [pedido]);

  const handleSave = async () => {
    if (!pedido) return;
    setIsLoading(true);
    try {
      // Usamos PATCH para atualizar apenas os campos que queremos
      await api.patch(`/pedidos/${pedido.id}/`, {
        status_producao: statusProducao,
        status_pagamento: statusPagamento,
      });
      router.refresh(); // Atualiza a lista na página
      onClose();
    } catch (error) {
      console.error("Erro ao atualizar status do pedido:", error);
      toast.error("Falha ao atualizar o status.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen || !pedido) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Atualizar Pedido #{pedido.id}</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Status da Produção</label>
            <select
              value={statusProducao}
              onChange={(e) => setStatusProducao(e.target.value)}
              className="w-full border-gray-300 rounded-md p-2"
            >
              {statusProducaoOptions.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Status do Pagamento</label>
            <select
              value={statusPagamento}
              onChange={(e) => setStatusPagamento(e.target.value)}
              className="w-full border-gray-300 rounded-md p-2"
            >
              <option value="PENDENTE">Pendente</option>
              <option value="PARCIAL">Parcial</option>
              <option value="PAGO">Pago</option>
            </select>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button type="button" className="bg-white text-gray-700 font-bold py-2 px-4 rounded-lg border hover:bg-gray-100" onClick={onClose} disabled={isLoading}>
            Cancelar
          </button>
          <button type="button" className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700" onClick={handleSave} disabled={isLoading}>
            {isLoading ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        </div>
      </div>
    </div>
  );
}