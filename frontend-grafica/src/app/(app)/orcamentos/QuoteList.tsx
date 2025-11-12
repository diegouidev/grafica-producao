// src/app/(app)/orcamentos/QuoteList.tsx

"use client";

import { useState, useEffect } from "react"; 
import { useRouter } from "next/navigation";
import { Orcamento, PaginatedResponse } from "@/types";
import { Plus, Search, Edit2, Trash2, Eye, MessageSquare, Printer, ChevronLeft, ChevronRight, CheckCircle } from "lucide-react";
import ViewQuoteModal from "./ViewQuoteModal";
import DeleteQuoteModal from "./DeleteQuoteModal";
import ApproveQuoteModal from "./ApproveQuoteModal";
import { api } from "@/lib/api";
import { useDebounce } from "@/hooks/useDebounce";
import { handleDownloadPdf } from "@/utils/pdfDownloader";
import { toast } from "react-toastify";

type QuoteListProps = {
  initialData: PaginatedResponse<Orcamento>;
};

export default function QuoteList({ initialData }: QuoteListProps) {
  const router = useRouter();
  const [data, setData] = useState<PaginatedResponse<Orcamento>>(initialData);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const [isSearching, setIsSearching] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [quoteToView, setQuoteToView] = useState<Orcamento | null>(null);
  const [quoteToDelete, setQuoteToDelete] = useState<Orcamento | null>(null);
  const [quoteToApprove, setQuoteToApprove] = useState<Orcamento | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Não executa a busca na primeira renderização se o termo estiver vazio
    if (debouncedSearchTerm === undefined || (debouncedSearchTerm === '' && searchTerm !== '')) {
      return;
    }
    const fetchQuotes = async () => {
      setIsSearching(true);
      try {
        const response = await api.get(`/orcamentos/?search=${debouncedSearchTerm}`);
        setData(response.data);
      } catch (error) { console.error("Erro ao buscar orçamentos:", error); } 
      finally { setIsSearching(false); }
    };
    if (debouncedSearchTerm) { fetchQuotes(); } 
    else { setData(initialData); }
  }, [debouncedSearchTerm]);
  
  // Sincroniza o estado com os dados iniciais se eles mudarem (após um router.refresh)
  useEffect(() => {
    setData(initialData);
  }, [initialData]);

  const handlePageChange = async (url: string | null) => {
    if (!url) return;
    setIsSearching(true);
    try {
      const response = await api.get(url);
      setData(response.data);
    } catch (error) { console.error("Erro ao mudar de página:", error); } 
    finally { setIsSearching(false); }
  };

  const handleOpenViewModal = (orcamento: Orcamento) => { setQuoteToView(orcamento); setIsViewModalOpen(true); };
  const handleOpenDeleteModal = (orcamento: Orcamento) => { setQuoteToDelete(orcamento); setIsDeleteModalOpen(true); };
  const handleOpenApproveModal = (orcamento: Orcamento) => { setQuoteToApprove(orcamento); setIsApproveModalOpen(true); };
  const handleEdit = (orcamentoId: number) => { router.push(`/orcamentos/${orcamentoId}/editar`); };
  
  const handlePrint = (orcamentoId: number) => {
    handleDownloadPdf(`/orcamentos/${orcamentoId}/pdf/`, `orcamento_${orcamentoId}.pdf`);
  };

  const handleDeleteConfirm = async () => {
    if (!quoteToDelete) return;
    setIsLoading(true);
    try {
      await api.delete(`/orcamentos/${quoteToDelete.id}/`);
      setIsDeleteModalOpen(false);
      toast.success("Orçamento excluído com sucesso!");
      router.refresh();
    } catch (error) { 
      toast.error("Ocorreu um erro ao excluir o orçamento."); 
    } 
    finally { setIsLoading(false); setQuoteToDelete(null); }
  };
  
  const handleApproveConfirm = async () => {
    if (!quoteToApprove) return;
    setIsLoading(true);
    try {
      await api.post(`/orcamentos/${quoteToApprove.id}/converter-para-pedido/`);
      toast.success(`Orçamento #${quoteToApprove.id} aprovado com sucesso!`);
      setIsApproveModalOpen(false);
      router.refresh();
    } catch (error) { 
      toast.error("Ocorreu um erro ao aprovar o orçamento."); 
    } 
    finally { setIsLoading(false); setQuoteToApprove(null); }
  };

  const formatCurrency = (value: string) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(parseFloat(value));
  const formatDate = (dateString: string) => new Date(dateString).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  const { count, next, previous, results: orcamentos } = data;
  const itemsPerPage = 15;
  const currentPageMatch = previous ? previous.match(/page=(\d+)/) : null;
  const currentPage = currentPageMatch ? parseInt(currentPageMatch[1]) + 1 : 1;
  const totalPages = Math.ceil(count / itemsPerPage);

  return (
    <>
      <ViewQuoteModal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} orcamento={quoteToView} />
      <DeleteQuoteModal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} onConfirm={handleDeleteConfirm} isLoading={isLoading} orcamento={quoteToDelete} />
      <ApproveQuoteModal isOpen={isApproveModalOpen} onClose={() => setIsApproveModalOpen(false)} onConfirm={handleApproveConfirm} isLoading={isLoading} orcamento={quoteToApprove} />
      
      <div className="bg-white p-4 rounded-lg shadow-md mb-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="relative w-full md:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input 
                  type="text" 
                  placeholder="Buscar por cliente ou ID" 
                  value={searchTerm} 
                  onChange={(e) => setSearchTerm(e.target.value)} 
                  className="border rounded-lg text-zinc-700 border-gray-300 p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 py-2 pl-10 pr-4 w-full" 
                />
            </div>
            <button 
              onClick={() => router.push('/orcamentos/novo')} 
              className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2 hover:bg-blue-700 w-full md:w-auto"
            >
                <Plus size={20} /> Orçamento
            </button>
        </div>
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b"><h2 className="text-xl font-semibold text-gray-800">Lista de Orçamentos</h2></div>
        {/* --- VISÃO EM TABELA (DESKTOP) --- */}
        {/* 'hidden' em telas pequenas, 'md:block' em telas médias e maiores */}
        <div className="overflow-x-auto hidden md:block">
            <table className="min-w-full text-sm">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-6 py-3 text-left font-semibold text-gray-600 uppercase">Orçamento</th>
                        <th className="px-6 py-3 text-left font-semibold text-gray-600 uppercase">Data</th>
                        <th className="px-6 py-3 text-left font-semibold text-gray-600 uppercase">Cliente</th>
                        <th className="px-6 py-3 text-left font-semibold text-gray-600 uppercase">Itens</th>
                        <th className="px-6 py-3 text-left font-semibold text-gray-600 uppercase">Valor</th>
                        <th className="px-6 py-3 text-left font-semibold text-gray-600 uppercase">Status</th>
                        <th className="px-6 py-3 text-left font-semibold text-gray-600 uppercase">Ações</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {isSearching ? (
                        <tr><td colSpan={7} className="text-center py-10 text-gray-500">Buscando...</td></tr>
                    ) : (
                        orcamentos.map((orcamento) => (
                            <tr key={orcamento.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 font-medium text-blue-600">N-{orcamento.id}</td>
                                <td className="px-6 py-4 text-gray-500">{formatDate(orcamento.data_criacao)}</td>
                                <td className="px-6 py-4 text-gray-700 font-medium">{orcamento.cliente.nome}</td>
                                <td className="px-6 py-4 text-blue-600 font-medium">{orcamento.itens.length} Itens</td>
                                <td className="px-6 py-4 text-gray-700">{formatCurrency(orcamento.valor_total)}</td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800`}>
                                        {orcamento.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-4 text-gray-500">
                                        {orcamento.status === 'Em Aberto' && (
                                            <button onClick={() => handleOpenApproveModal(orcamento)} className="hover:text-green-500" title="Aprovar e Converter"><CheckCircle size={18} /></button>
                                        )}
                                        <button onClick={() => handleOpenViewModal(orcamento)} className="hover:text-blue-500" title="Visualizar"><Eye size={18} /></button>
                                        <button onClick={() => handleEdit(orcamento.id)} className="hover:text-yellow-500" title="Editar"><Edit2 size={18} /></button>
                                        <button onClick={() => handleOpenDeleteModal(orcamento)} className="hover:text-red-500" title="Excluir"><Trash2 size={18} /></button>
                                        <button onClick={() => handlePrint(orcamento.id)} className="hover:text-gray-700" title="Imprimir"><Printer size={18} /></button>
                                    </div>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>

        {/* --- VISÃO EM CARDS (MOBILE) --- */}
        {/* 'block' em telas pequenas, 'md:hidden' em telas médias e maiores */}
        <div className="block md:hidden">
          {isSearching ? (
            <div className="text-center py-10 text-gray-500">Buscando...</div>
          ) : (
            <div className="divide-y divide-gray-200">
              {orcamentos.map((orcamento) => (
                <div key={orcamento.id} className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="font-medium text-blue-600">N-{orcamento.id}</p>
                      <p className="text-lg font-semibold text-gray-900">{orcamento.cliente.nome}</p>
                    </div>
                    <div className="flex items-center gap-3 text-gray-500">
                      {orcamento.status === 'Em Aberto' && (
                        <button onClick={() => handleOpenApproveModal(orcamento)} className="hover:text-green-500" title="Aprovar"><CheckCircle size={18} /></button>
                      )}
                      <button onClick={() => handleOpenViewModal(orcamento)} className="hover:text-blue-500" title="Visualizar"><Eye size={18} /></button>
                      <button onClick={() => handleEdit(orcamento.id)} className="hover:text-yellow-500" title="Editar"><Edit2 size={18} /></button>
                    </div>
                  </div>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p><strong>Data:</strong> {formatDate(orcamento.data_criacao)}</p>
                    <p><strong>Valor:</strong> <span className="font-medium text-gray-800">{formatCurrency(orcamento.valor_total)}</span></p>
                    <p><strong>Status:</strong> <span className={`px-2 py-0.5 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800`}>{orcamento.status}</span></p>
                    <p><strong>Itens:</strong> {orcamento.itens.length}</p>
                  </div>
                  <div className="flex items-center gap-3 text-gray-500 mt-2">
                     <button onClick={() => handleOpenDeleteModal(orcamento)} className="hover:text-red-500" title="Excluir"><Trash2 size={18} /></button>
                     <button onClick={() => handlePrint(orcamento.id)} className="hover:text-gray-700" title="Imprimir"><Printer size={18} /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* --- PAGINAÇÃO (Unificada) --- */}
        <div className="px-6 py-4 border-t flex items-center justify-between text-sm">
            <span className="text-gray-600">{count} orçamentos cadastrados</span>
            <div className="flex items-center gap-3">
                <span className="text-gray-600">{currentPage} de {totalPages}</span>
                <div className="flex items-center gap-1">
                    <button onClick={() => handlePageChange(previous)} disabled={!previous || isSearching} className="p-1.5 rounded-md hover:bg-gray-100 disabled:opacity-50"><ChevronLeft size={16} /></button>
                    <button onClick={() => handlePageChange(next)} disabled={!next || isSearching} className="p-1.5 rounded-md hover:bg-gray-100 disabled:opacity-50"><ChevronRight size={16} /></button>
                </div>
            </div>
        </div>
      </div>
    </>
  );
}