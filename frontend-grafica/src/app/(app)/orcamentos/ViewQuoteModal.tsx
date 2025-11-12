// src/app/(app)/orcamentos/ViewQuoteModal.tsx

"use client";

import { Orcamento, ItemOrcamento } from "@/types";
import { X } from "lucide-react";

type ViewQuoteModalProps = {
  isOpen: boolean;
  onClose: () => void;
  orcamento: Orcamento | null;
};

export default function ViewQuoteModal({ isOpen, onClose, orcamento }: ViewQuoteModalProps) {
  if (!isOpen || !orcamento) return null;

  const formatCurrency = (value: string | number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value));

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("pt-BR");

  const itens: ItemOrcamento[] = Array.isArray(orcamento.itens) ? orcamento.itens : [];

  const getItemNome = (item: ItemOrcamento) =>
    item?.produto?.nome ?? item?.descricao_customizada ?? "Item manual";

  const getItemSubtotal = (item: ItemOrcamento) =>
    Number(item?.subtotal ?? 0);

  const getUnitPrice = (item: ItemOrcamento) => {
    const qty = Number(item?.quantidade ?? 0);
    const subtotal = getItemSubtotal(item);
    if (!qty || qty <= 0) return 0;
    return subtotal / qty;
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4">

      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-2xl">
        <div className="flex justify-between items-center mb-4 border-b pb-4">
          <h2 className="text-xl font-bold text-zinc-800">
            Orçamento N-{orcamento.id}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800">
            <X size={24} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm mb-6">
          <div>
            <h3 className="font-semibold text-zinc-800 mb-2">Dados do Pedido</h3>
            <p className="text-zinc-600">
              <strong>Criado:</strong> {formatDate(orcamento.data_criacao as unknown as string)}
            </p>
            <p className="text-zinc-600">
              <strong>Status:</strong> {orcamento.status}
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-zinc-800 mb-2">Dados do Cliente</h3>
            <p className="text-zinc-600">
              <strong>Cliente:</strong> {orcamento.cliente?.nome}
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left font-semibold text-zinc-600">Qtd.</th>
                <th className="px-4 py-2 text-left font-semibold text-zinc-600">Produto</th>
                <th className="px-4 py-2 text-left font-semibold text-zinc-600">Preço</th>
                <th className="px-4 py-2 text-left font-semibold text-zinc-600">Total</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {itens.map((item) => (
                <tr key={item.id}>
                  <td className="px-4 py-3 text-zinc-600">{item.quantidade}x</td>
                  <td className="px-4 py-3 font-medium text-zinc-800">
                    {getItemNome(item)}
                  </td>
                  <td className="px-4 py-3 text-zinc-600">
                    {formatCurrency(getUnitPrice(item))}
                  </td>
                  <td className="px-4 py-3 font-medium text-zinc-800">
                    {formatCurrency(getItemSubtotal(item))}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2">
                <td colSpan={3} className="px-4 py-3 text-right font-semibold text-zinc-800">
                  Total:
                </td>
                <td className="px-4 py-3 font-bold text-lg text-zinc-900">
                  {formatCurrency(orcamento.valor_total)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div className="mt-6 border-t pt-4">
          <h3 className="font-semibold text-zinc-800 mb-2 text-sm">Observações</h3>
          <p className="text-sm text-zinc-600 italic">Nenhuma observação adicionada.</p>
        </div>
        <div className="flex items-center justify-end gap-4 pt-4 border-t mt-6">
          <button
            type="button"
            onClick={onClose}
            className="bg-blue-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-blue-700"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
