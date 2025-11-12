// src/app/(app)/clientes/ViewClientModal.tsx
// (Arquivo Modificado)

"use client";

import { useState, useEffect } from "react";
import { Cliente, PedidoHistory, OrcamentoHistory } from "@/types"; // <-- 1. IMPORTAR TIPOS
import { api } from "@/lib/api";
import { toast } from "react-toastify";
import Link from 'next/link';
import { Loader2, ListOrdered, FileText, User, X } from 'lucide-react'; // <-- 2. IMPORTAR ÍCONES

type ViewClientModalProps = {
  isOpen: boolean;
  onClose: () => void;
  cliente: Cliente | null; // Recebe o cliente da lista (sem histórico)
};

export default function ViewClientModal({ isOpen, onClose, cliente }: ViewClientModalProps) {
  
  // --- 3. NOVOS ESTADOS ---
  const [fullClientData, setFullClientData] = useState<Cliente | null>(null);
  const [isHistoryLoading, setIsHistoryLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dados');
  
  // --- 4. EFEITO PARA BUSCAR DADOS COMPLETOS ---
  useEffect(() => {
    if (isOpen && cliente) {
      // Reseta os estados ao abrir
      setActiveTab('dados');
      setIsHistoryLoading(true);
      
      const fetchFullClientData = async () => {
        try {
          const response = await api.get(`/clientes/${cliente.id}/`);
          setFullClientData(response.data);
        } catch (err) {
          console.error("Erro ao buscar dados do cliente", err);
          toast.error("Não foi possível carregar os dados completos do cliente.");
          setFullClientData(cliente); // Usa os dados parciais como fallback
        } finally {
          setIsHistoryLoading(false);
        }
      };
      fetchFullClientData();
      
    } else {
      // Limpa ao fechar
      setFullClientData(null);
    }
  }, [isOpen, cliente]);


  if (!isOpen || !cliente) return null;

  // Usa os dados completos se já carregou, senão, os dados parciais
  const data = fullClientData || cliente;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-start pt-8 pb-8 overflow-y-auto">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-3xl">
        <div className="flex justify-between items-center mb-4 border-b pb-4">
          <h2 className="text-xl font-bold text-zinc-800">
            Detalhes do Cliente
          </h2>
           <button onClick={onClose} className="text-gray-500 hover:text-gray-800">
            <X size={24} />
          </button>
        </div>
        
        {/* --- 5. RENDERIZAÇÃO DAS ABAS --- */}
        <div className="mb-4 border-b border-gray-200">
          <nav className="-mb-px flex space-x-6" aria-label="Tabs">
            <TabButton
              icon={User}
              label="Dados Cadastrais"
              isActive={activeTab === 'dados'}
              onClick={() => setActiveTab('dados')}
            />
            <TabButton
              icon={ListOrdered}
              label="Pedidos"
              isActive={activeTab === 'pedidos'}
              onClick={() => setActiveTab('pedidos')}
              count={data.pedidos?.length}
            />
            <TabButton
              icon={FileText}
              label="Orçamentos"
              isActive={activeTab === 'orcamentos'}
              onClick={() => setActiveTab('orcamentos')}
              count={data.orcamentos?.length}
            />
          </nav>
        </div>

        {/* --- 6. PAINÉIS DAS ABAS --- */}
        <div className="space-y-6 text-sm">
          
          {/* Painel de Dados Cadastrais */}
          <div className={activeTab === 'dados' ? 'block' : 'hidden'}>
            <div>
              <h3 className="text-lg font-semibold text-gray-700 mb-3">Dados Pessoais</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium text-gray-500">Nome / Razão Social</label>
                  <p className="text-gray-900 mt-1">{data.nome}</p>
                </div>
                <div>
                  <label className="block font-medium text-gray-500">CPF/CNPJ</label>
                  <p className="text-gray-900 mt-1">{data.cpf_cnpj || '--'}</p>
                </div>
                <div>
                  <label className="block font-medium text-gray-500">Email</label>
                  <p className="text-gray-900 mt-1">{data.email || '--'}</p>
                </div>
                <div>
                  <label className="block font-medium text-gray-500">Whatsapp</label>
                  <p className="text-gray-900 mt-1">{data.telefone || '--'}</p>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-700 mb-3">Endereço</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium text-gray-500">Endereço</label>
                  <p className="text-gray-900 mt-1">{(data as any).endereco || '--'}</p>
                </div>
                <div>
                  <label className="block font-medium text-gray-500">Cidade/Estado</label>
                  <p className="text-gray-900 mt-1">
                    {(data as any).cidade && (data as any).estado 
                      ? `${(data as any).cidade}/${(data as any).estado}` 
                      : '--'}
                  </p>
                </div>
                 <div>
                  <label className="block font-medium text-gray-500">CEP</label>
                  <p className="text-gray-900 mt-1">{(data as any).cep || '--'}</p>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-700 mb-3">Observações</h3>
              <p className="text-gray-900 mt-1 italic">
                {(data as any).observacao || 'Nenhuma observação.'}
              </p>
            </div>
          </div>
          
          {/* Painel de Pedidos */}
          <div className={activeTab === 'pedidos' ? 'block' : 'hidden'}>
            <HistoryTabContent
              isLoading={isHistoryLoading}
              items={data.pedidos || []}
              type="pedido"
              onCloseModal={onClose}
            />
          </div>

          {/* Painel de Orçamentos */}
          <div className={activeTab === 'orcamentos' ? 'block' : 'hidden'}>
            <HistoryTabContent
              isLoading={isHistoryLoading}
              items={data.orcamentos || []}
              type="orcamento"
              onCloseModal={onClose}
            />
          </div>

          {/* Botão de Fechar Fixo */}
          <div className="flex items-center justify-end gap-4 pt-4 border-t mt-6">
            <button type="button" onClick={onClose} className="bg-blue-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-blue-700">
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- 7. COMPONENTES INTERNOS ---

function TabButton({ icon: Icon, label, isActive, onClick, count }: any) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        ${isActive ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
        whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2
      `}
    >
      <Icon size={16} />
      {label}
      {count !== undefined && (
        <span className={`ml-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
          isActive ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
        }`}>
          {count}
        </span>
      )}
    </button>
  );
}

function HistoryTabContent({ isLoading, items, type, onCloseModal }: {
  isLoading: boolean;
  items: PedidoHistory[] | OrcamentoHistory[];
  type: 'pedido' | 'orcamento';
  onCloseModal: () => void;
}) {
  const formatCurrency = (value: string | number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value));
  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('pt-BR');

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="animate-spin text-blue-500" size={32} />
      </div>
    );
  }

  if (items.length === 0) {
    return <p className="text-center text-gray-500 py-10">Nenhum {type === 'pedido' ? 'pedido' : 'orçamento'} encontrado para este cliente.</p>;
  }

  return (
    <div className="max-h-96 overflow-y-auto">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-50 sticky top-0">
          <tr>
            <th className="px-4 py-2 text-left font-semibold text-zinc-600">ID</th>
            <th className="px-4 py-2 text-left font-semibold text-zinc-600">Data</th>
            <th className="px-4 py-2 text-left font-semibold text-zinc-600">Status</th>
            <th className="px-4 py-2 text-left font-semibold text-zinc-600">Valor</th>
            <th className="px-4 py-2 text-left font-semibold text-zinc-600">Ação</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {items.map((item) => {
            
            // --- INÍCIO DA CORREÇÃO ---
            const itemStatus = type === 'pedido' ? (item as PedidoHistory).status_producao : (item as OrcamentoHistory).status;
            
            // Define se o link "Ver" deve ser mostrado
            const showLink = !(type === 'orcamento' && itemStatus === 'Aprovado');
            // --- FIM DA CORREÇÃO ---
            
            return (
              <tr key={item.id}>
                <td className="px-4 py-3 font-medium text-blue-600">#{item.id}</td>
                <td className="px-4 py-3 text-zinc-600">{formatDate(item.data_criacao)}</td>
                <td className="px-4 py-3 text-zinc-600">
                  {itemStatus}
                </td>
                <td className="px-4 py-3 text-zinc-800 font-medium">{formatCurrency(item.valor_total)}</td>
                <td className="px-4 py-3">
                  
                  {/* --- LÓGICA CONDICIONAL APLICADA --- */}
                  {showLink ? (
                    <Link
                      href={`/${type}s/${item.id}/editar`}
                      onClick={onCloseModal} // Fecha o modal ao navegar
                      className="text-blue-600 hover:underline font-medium"
                    >
                      Ver
                    </Link>
                  ) : (
                    <span className="text-gray-400 text-xs italic">Convertido</span>
                  )}
                  {/* --- FIM DA LÓGICA --- */}

                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}