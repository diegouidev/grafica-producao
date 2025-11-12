"use client";

import { useState, useEffect } from 'react';
import { Produto, MovimentacaoEstoque } from '@/types';
import { api } from '@/lib/api';
import { Loader2, X } from 'lucide-react';
import { toast } from 'react-toastify';

type StockHistoryModalProps = {
  isOpen: boolean;
  onClose: () => void;
  produto: Produto | null;
};

export default function StockHistoryModal({ isOpen, onClose, produto }: StockHistoryModalProps) {
  const [movimentacoes, setMovimentacoes] = useState<MovimentacaoEstoque[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isOpen && produto) {
      setIsLoading(true);
      
      // O endpoint de detalhe do produto agora retorna as movimentações
      api.get(`/produtos/${produto.id}/`)
        .then(response => {
          setMovimentacoes(response.data.movimentacoes || []);
        })
        .catch(err => {
          console.error("Erro ao buscar histórico:", err);
          toast.error("Falha ao carregar o histórico de estoque.");
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [isOpen, produto]);

  if (!isOpen || !produto) return null;

  const formatDate = (dateString: string) => 
    new Date(dateString).toLocaleString("pt-BR", {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit"
    });

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-3xl h-[80vh] flex flex-col">
        <div className="flex justify-between items-center mb-4 border-b pb-4">
          <h2 className="text-xl font-bold text-zinc-800">
            Histórico de Estoque: {produto.nome}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex justify-center items-center h-full">
              <Loader2 className="animate-spin text-blue-500" size={32} />
            </div>
          ) : (
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-4 py-2 text-left font-semibold text-zinc-600">Data</th>
                  <th className="px-4 py-2 text-left font-semibold text-zinc-600">Tipo</th>
                  <th className="px-4 py-2 text-left font-semibold text-zinc-600">Qtd.</th>
                  <th className="px-4 py-2 text-left font-semibold text-zinc-600">Observação</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {movimentacoes.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center text-gray-500 py-10">
                      Nenhuma movimentação manual encontrada.
                      <p className="text-xs">(Movimentações de pedidos não aparecem aqui)</p>
                    </td>
                  </tr>
                ) : (
                  movimentacoes.map((mov) => (
                    <tr key={mov.id}>
                      <td className="px-4 py-3 text-zinc-600 whitespace-nowrap">{formatDate(mov.data)}</td>
                      <td className="px-4 py-3 text-zinc-600">{mov.tipo_display}</td>
                      <td className={`px-4 py-3 font-bold ${mov.quantidade > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {mov.quantidade > 0 ? `+${mov.quantidade}` : mov.quantidade}
                      </td>
                      <td className="px-4 py-3 text-zinc-600">{mov.observacao || '--'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
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