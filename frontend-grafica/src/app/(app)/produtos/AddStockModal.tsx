"use client";

import { useState, FormEvent, useEffect } from 'react';
import { Produto } from '@/types';
import { api } from '@/lib/api';
import { toast } from 'react-toastify';
import { Loader2 } from 'lucide-react';

type AddStockModalProps = {
  isOpen: boolean;
  onClose: () => void;
  produto: Produto | null;
  onStockAdded: () => void; // Callback para atualizar a lista
};

type TipoMovimentacao = 'ENTRADA_COMPRA' | 'ENTRADA_AJUSTE' | 'SAIDA_AJUSTE';

export default function AddStockModal({ isOpen, onClose, produto, onStockAdded }: AddStockModalProps) {
  const [tipo, setTipo] = useState<TipoMovimentacao>('ENTRADA_COMPRA');
  const [quantidade, setQuantidade] = useState('');
  const [observacao, setObservacao] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Reseta o formulário quando o modal é aberto
    if (isOpen) {
      setTipo('ENTRADA_COMPRA');
      setQuantidade('');
      setObservacao('');
      setError(null);
      setIsLoading(false);
    }
  }, [isOpen]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!produto) return;

    const qtyNum = parseFloat(quantidade);
    if (isNaN(qtyNum) || qtyNum <= 0) {
      setError("A quantidade deve ser um número positivo.");
      return;
    }

    setIsLoading(true);
    setError(null);

    // Lógica inteligente de UX:
    // O usuário *sempre* digita um número positivo.
    // O backend espera um número negativo para saídas.
    // Nós fazemos a conversão aqui.
    let valorFinal = qtyNum;
    if (tipo === 'SAIDA_AJUSTE') {
      valorFinal = -Math.abs(qtyNum);
    }

    const payload = {
      produto: produto.id,
      tipo: tipo,
      quantidade: valorFinal,
      observacao: observacao || null,
    };

    try {
      await api.post('/movimentacoes-estoque/', payload);
      toast.success("Estoque atualizado com sucesso!");
      onStockAdded(); // Chama o callback (que vai fechar o modal e atualizar a lista)
    } catch (err: any) {
      console.error("Erro ao salvar movimentação:", err.response?.data);
      let errorMsg = "Falha ao salvar. Verifique os dados.";
      if (err.response?.data) {
         errorMsg = Object.values(err.response.data).join(', ');
      }
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen || !produto) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-lg">
        <h2 className="text-xl font-bold mb-4 border-b pb-4 text-zinc-800">
          Movimentar Estoque
        </h2>
        <p className="text-sm text-zinc-700 mb-4">
          Produto: <strong className="font-semibold">{produto.nome}</strong>
        </p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Tipo de Movimentação</label>
            <select 
              name="tipo" 
              value={tipo} 
              onChange={(e) => setTipo(e.target.value as TipoMovimentacao)} 
              className="w-full border-gray-300 rounded-md p-2"
            >
              <option value="ENTRADA_COMPRA">Entrada (Compra)</option>
              <option value="ENTRADA_AJUSTE">Entrada (Ajuste Manual)</option>
              <option value="SAIDA_AJUSTE">Saída (Ajuste Manual/Perda)</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">
              Quantidade
            </label>
            <input 
              name="quantidade" 
              type="number" 
              step="1"
              min="1"
              value={quantidade} 
              onChange={(e) => setQuantidade(e.target.value)} 
              placeholder="Ex: 50" 
              className="w-full border-gray-300 rounded-md p-2" 
              required 
            />
            {tipo === 'SAIDA_AJUSTE' && (
              <p className="text-xs text-yellow-700 mt-1">
                A quantidade {quantidade || 0} será <strong>subtraída</strong> do estoque atual.
              </p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Observação (Opcional)</label>
            <textarea 
              name="observacao" 
              value={observacao} 
              onChange={(e) => setObservacao(e.target.value)} 
              placeholder="Ex: NF 1234, Contagem de inventário" 
              className="w-full p-2 border rounded-md text-zinc-700 border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500" 
              rows={3}
            ></textarea>
          </div>
          
          {error && <p className="text-red-500 text-sm mt-2 text-center">{error}</p>}
          
          <div className="flex items-center justify-end gap-4 pt-4 border-t mt-6">
            <button type="button" onClick={onClose} className="bg-white text-gray-800 font-bold py-2 px-6 rounded-lg hover:bg-gray-100 border">
              Cancelar
            </button>
            <button type="submit" disabled={isLoading} className="bg-blue-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-blue-700 disabled:bg-blue-300 flex items-center gap-2">
              {isLoading && <Loader2 className="animate-spin" size={18} />}
              {isLoading ? 'Salvando...' : 'Salvar Movimentação'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}