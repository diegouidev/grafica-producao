// src/app/(app)/contas-a-pagar/ContasAPagarList.tsx
// (Arquivo Modificado - Simplificado)

"use client";

import { useState, useEffect } from "react"; 
import { useRouter } from "next/navigation";
import { ContaAPagar, Despesa, CustoFornecedorPedido } from "@/types";
import { api } from "@/lib/api";
import { toast } from 'react-toastify';
import { Loader2 } from "lucide-react";
import PagarContaModal from "./PagarContaModal"; 

type ContasAPagarListProps = {
  initialContas: ContaAPagar[];
};

// (Tipo ContaPaga permanece o mesmo)
type ContaPaga = (Despesa | CustoFornecedorPedido) & { tipo_display: string };

export default function ContasAPagarList({ initialContas }: ContasAPagarListProps) {
  const router = useRouter();
  
  // --- ABAS REMOVIDAS ---
  
  // Listas
  const [contasAPagar, setContasAPagar] = useState<ContaAPagar[]>(initialContas);
  // --- ESTADO DE CONTAS PAGAS REMOVIDO (será movido para a página principal) ---
  
  // Estado
  const [isLoading, setIsLoading] = useState(false);
  
  // Modal
  const [isPagarModalOpen, setIsPagarModalOpen] = useState(false);
  const [contaSelecionada, setContaSelecionada] = useState<ContaAPagar | null>(null);

  // Sincroniza o estado com os dados iniciais do server component
  useEffect(() => {
    setContasAPagar(initialContas);
  }, [initialContas]);

  // --- FUNÇÃO fetchContasPagas REMOVIDA (agora é na página principal) ---

  const handleOpenPagarModal = (conta: ContaAPagar) => {
    setContaSelecionada(conta);
    setIsPagarModalOpen(true);
  };

  const handleClosePagarModal = () => {
    setContaSelecionada(null);
    setIsPagarModalOpen(false);
  };

  const handleContaPaga = () => {
    handleClosePagarModal();
    // Atualiza a lista de "A Pagar" removendo o item
    setContasAPagar(prev => prev.filter(c => c.id !== contaSelecionada?.id));
    // Damos um refresh completo para garantir que o Dashboard e outros locais atualizem
    router.refresh(); 
  };
  
  const formatCurrency = (value: string | number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value));
  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('pt-BR', { timeZone: 'UTC' });

  const totalAPagar = contasAPagar.reduce((acc, conta) => acc + parseFloat(conta.valor), 0);

  return (
    <>
      <PagarContaModal
        isOpen={isPagarModalOpen}
        onClose={handleClosePagarModal}
        conta={contaSelecionada}
        onSuccess={handleContaPaga}
      />

      {/* --- ABAS REMOVIDAS --- */}
      
      {/* Tabela vai direto */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        {/* Renderiza a tabela de Contas a Pagar diretamente */}
        <TabelaContasAPagar 
          contas={contasAPagar} 
          total={totalAPagar}
          onPagar={handleOpenPagarModal} 
          formatCurrency={formatCurrency}
          formatDate={formatDate}
        />
      </div>
    </>
  );
}


// --- Sub-componente Tabela A Pagar (sem alteração) ---
function TabelaContasAPagar({ contas, total, onPagar, formatCurrency, formatDate }: any) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left font-semibold text-gray-600 uppercase">Vencimento</th>
            <th className="px-6 py-3 text-left font-semibold text-gray-600 uppercase">Tipo</th>
            <th className="px-6 py-3 text-left font-semibold text-gray-600 uppercase">Descrição</th>
            <th className="px-6 py-3 text-left font-semibold text-gray-600 uppercase">Valor</th>
            <th className="px-6 py-3 text-left font-semibold text-gray-600 uppercase">Ação</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {contas.length === 0 ? (
            <tr><td colSpan={5} className="text-center py-10 text-gray-500">Nenhuma conta a pagar.</td></tr>
          ) : (
            contas.map((conta: ContaAPagar) => (
              <tr key={conta.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-gray-500 whitespace-nowrap">{formatDate(conta.data_vencimento)}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    conta.tipo === 'Despesa Geral' ? 'bg-gray-100 text-gray-800' : 'bg-indigo-100 text-indigo-800'
                  }`}>
                    {conta.tipo}
                  </span>
                </td>
                <td className="px-6 py-4 font-medium text-gray-900">{conta.descricao}</td>
                <td className="px-6 py-4 text-gray-700 font-bold">{formatCurrency(conta.valor)}</td>
                <td className="px-6 py-4">
                  <button onClick={() => onPagar(conta)} className="bg-green-500 text-white font-bold py-1 px-3 rounded-lg text-xs hover:bg-green-600">
                    Marcar como Pago
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
        <tfoot className="bg-gray-50 border-t-2">
          <tr>
            <td colSpan={3} className="px-6 py-3 text-right font-bold text-gray-700 uppercase">Total a Pagar:</td>
            <td className="px-6 py-3 font-bold text-lg text-red-600">{formatCurrency(total)}</td>
            <td></td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

// --- Sub-componente Tabela Pagas REMOVIDO (será adicionado à página principal se necessário) ---