// src/app/(app)/pedidos/ViewOrderModal.tsx

"use client";

import { Pedido } from "@/types";
import { X } from "lucide-react";

type ViewOrderModalProps = {
  isOpen: boolean;
  onClose: () => void;
  pedido: Pedido | null;
};

export default function ViewOrderModal({ isOpen, onClose, pedido }: ViewOrderModalProps) {
  if (!isOpen || !pedido) return null;

  const formatCurrency = (value: string) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(parseFloat(value));
  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-lg">
        <div className="flex justify-between items-center mb-4 border-b pb-4">
          <h2 className="text-xl font-bold text-zinc-800">
            Detalhes do Pedido #{pedido.id}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800">
            <X size={24} />
          </button>
        </div>
        
        <div className="space-y-4 text-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-medium text-zinc-500">Cliente</label>
              <p className="text-zinc-900 mt-1 font-semibold">{pedido.cliente.nome}</p>
            </div>
            <div>
              <label className="block font-medium text-zinc-500">Data</label>
              <p className="text-zinc-900 mt-1">{formatDate(pedido.data_criacao)}</p>
            </div>
            <div>
              <label className="block font-medium text-zinc-500">Status do Pagamento</label>
              <p className="text-zinc-900 mt-1">{pedido.status_pagamento}</p>
            </div>
             <div>
              <label className="block font-medium text-zinc-500">Status da Produção</label>
              <p className="text-zinc-900 mt-1">{pedido.status_producao}</p>
            </div>
          </div>
          <div className="pt-4 border-t flex justify-end font-bold text-lg text-zinc-800">
            <span>Total:</span>
            <span className="ml-4">{formatCurrency(pedido.valor_total)}</span>
          </div>
        </div>

        <div className="flex items-center justify-end gap-4 pt-4 border-t mt-6">
          <button type="button" onClick={onClose} className="bg-blue-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-blue-700">
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}