"use client";

import { useState, FormEvent, useEffect } from 'react';
import { ContaAPagar } from '@/types';
import { api } from '@/lib/api';
import { toast } from 'react-toastify';
import { Loader2, AlertTriangle } from 'lucide-react';

type PagarContaModalProps = {
  isOpen: boolean;
  onClose: () => void;
  conta: ContaAPagar | null;
  onSuccess: () => void; // Callback para atualizar a lista
};

// Helper para pegar a data de hoje no formato YYYY-MM-DD
const getTodayDateString = () => {
  const today = new Date();
  return today.toISOString().split('T')[0];
};

export default function PagarContaModal({ isOpen, onClose, conta, onSuccess }: PagarContaModalProps) {
  const [dataPagamento, setDataPagamento] = useState(getTodayDateString());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setDataPagamento(getTodayDateString());
      setError(null);
      setIsLoading(false);
    }
  }, [isOpen]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!conta) return;

    setIsLoading(true);
    setError(null);

    const payload = {
      data_pagamento: dataPagamento,
    };
    
    // O endpoint_type nos diz qual URL chamar
    const url = `/${conta.endpoint_type}/${conta.original_id}/pagar/`;

    try {
      await api.post(url, payload);
      toast.success("Conta marcada como paga!");
      onSuccess(); // Chama o callback (fecha o modal e atualiza a lista)
    } catch (err: any) {
      console.error("Erro ao pagar conta:", err.response?.data);
      let errorMsg = "Falha ao salvar. Verifique os dados.";
      if (err.response?.data) {
         errorMsg = Object.values(err.response.data).join(', ');
      }
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen || !conta) return null;

  const formatCurrency = (value: string | number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value));

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
        
        <div className="flex items-start gap-4 mb-4">
          <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-green-100 sm:mx-0 sm:h-10 sm:w-10">
            <AlertTriangle className="h-6 w-6 text-green-600" aria-hidden="true" />
          </div>
          <div className="mt-0 text-left">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Confirmar Pagamento
            </h3>
            <div className="mt-2 text-sm text-gray-600">
              <p>
                Você está prestes a marcar a seguinte conta como paga:
              </p>
              <p className="font-semibold text-gray-800 mt-2">
                {conta.descricao}
              </p>
              <p className="font-bold text-xl text-green-600 mt-1">
                {formatCurrency(conta.valor)}
              </p>
            </div>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Data do Pagamento</label>
            <input 
              name="data_pagamento" 
              type="date"
              value={dataPagamento} 
              onChange={(e) => setDataPagamento(e.target.value)} 
              className="w-full border-gray-300 rounded-md p-2" 
              required 
            />
          </div>
          
          {error && <p className="text-red-500 text-sm mt-2 text-center">{error}</p>}
          
          <div className="flex items-center justify-end gap-4 pt-4 border-t mt-6">
            <button type="button" onClick={onClose} className="bg-white text-gray-800 font-bold py-2 px-6 rounded-lg hover:bg-gray-100 border">
              Cancelar
            </button>
            <button type="submit" disabled={isLoading} className="bg-green-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-green-700 disabled:bg-green-300 flex items-center gap-2">
              {isLoading && <Loader2 className="animate-spin" size={18} />}
              {isLoading ? 'Confirmando...' : 'Confirmar Pagamento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}