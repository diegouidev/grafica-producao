"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { EtiquetaPortaria, PaginatedResponse } from "@/types"; // Importando dos seus tipos
import { Plus, Search, Trash2, Printer, ChevronLeft, ChevronRight } from "lucide-react";
import { api } from "@/lib/api";
import { useDebounce } from "@/hooks/useDebounce";
import { handleDownloadPdf } from "@/utils/pdfDownloader"; // Importando o downloader de PDF
import { toast } from 'react-toastify';
import AddEtiquetaModal from "./AddEtiquetaModal"; // Nosso novo modal de adição
import DeleteEtiquetaModal from "./DeleteEtiquetaModal"; // Nosso novo modal de exclusão

type EtiquetaListProps = {
  initialData: PaginatedResponse<EtiquetaPortaria>;
};

export default function EtiquetaList({ initialData }: EtiquetaListProps) {
  const router = useRouter();
  
  const [data, setData] = useState<PaginatedResponse<EtiquetaPortaria>>(initialData);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const [isSearching, setIsSearching] = useState(false);
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  
  const [etiquetaToDelete, setEtiquetaToDelete] = useState<EtiquetaPortaria | null>(null);
  
  const [isLoading, setIsLoading] = useState(false);

  // Efeito para buscar com debounce
  useEffect(() => {
    // Evita busca inicial desnecessária se o termo já for vazio
    if (debouncedSearchTerm === '' && searchTerm === '') {
      // Se o termo inicial é vazio, apenas usamos os dados iniciais
      setData(initialData);
      return;
    }

    const fetchEtiquetas = async () => {
      setIsSearching(true);
      try {
        const response = await api.get(`/etiquetas-portaria/?search=${debouncedSearchTerm}`);
        setData(response.data);
      } catch (error) {
        console.error("Erro ao buscar etiquetas:", error);
        toast.error("Erro ao buscar etiquetas.");
      } finally {
        setIsSearching(false);
      }
    };
    
    fetchEtiquetas();
  }, [debouncedSearchTerm, initialData]); // Adiciona initialData para re-setar

  // Sincroniza com dados iniciais (após refresh do router)
  useEffect(() => {
    setData(initialData);
    setSearchTerm(''); // Limpa a busca ao receber novos dados
  }, [initialData]);

  // Navegação de página
  const handlePageChange = async (url: string | null) => {
    if (!url) return;
    setIsSearching(true);
    try {
      // Adiciona o termo de busca atual à URL de paginação
      const searchParam = searchTerm ? `&search=${searchTerm}` : '';
      const response = await api.get(url + searchParam);
      setData(response.data);
    } catch (error) {
      console.error("Erro ao mudar de página:", error);
      toast.error("Erro ao carregar página.");
    } finally {
      setIsSearching(false);
    }
  };

  // Funções de Ação
  const handleOpenAddModal = () => setIsAddModalOpen(true);
  
  const handlePrint = (etiquetaId: number) => {
    handleDownloadPdf(`/etiquetas-portaria/${etiquetaId}/pdf/`, `etiqueta_${etiquetaId}.pdf`);
  };

  const handleOpenDeleteModal = (etiqueta: EtiquetaPortaria) => {
    setEtiquetaToDelete(etiqueta);
    setIsDeleteModalOpen(true);
  };
  
  const handleDeleteConfirm = async () => {
    if (!etiquetaToDelete) return;
    setIsLoading(true);
    try {
      await api.delete(`/etiquetas-portaria/${etiquetaToDelete.id}/`);
      setIsDeleteModalOpen(false);
      toast.success('Etiqueta excluída com sucesso!');
      router.refresh(); 
    } catch (error) {
      console.error("Falha ao excluir etiqueta:", error);
      toast.error("Ocorreu um erro ao excluir a etiqueta.");
    } finally {
      setIsLoading(false);
      setEtiquetaToDelete(null);
    }
  };
  
  // Formatadores
  const formatDate = (dateString: string) => 
    new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit", month: "2-digit", year: "numeric"
    });
    
  const formatTipo = (tipo: 'CONDOMINIO' | 'RETIRADA') => 
    tipo === 'CONDOMINIO' ? 'Condomínio' : 'Retirada';

  const formatLocal = (etiqueta: EtiquetaPortaria) => 
    etiqueta.bloco ? `Bloco ${etiqueta.bloco} / Apto ${etiqueta.apartamento}` : '--';

  const { count, next, previous, results: etiquetas } = data;
  const itemsPerPage = 15; // Assumindo o padrão da API
  
  // Cálculo de página mais robusto
  let currentPage = 1;
  if (next) {
      const match = next.match(/page=(\d+)/);
      if (match) currentPage = parseInt(match[1]) - 1;
  } else if (previous) {
      const match = previous.match(/page=(\d+)/);
      if (match) currentPage = parseInt(match[1]) + 1;
      else if (count > itemsPerPage) currentPage = Math.ceil(count / itemsPerPage); // Última página
  } else if (count === 0) {
      currentPage = 0; // Nenhuma página
  }
  
  const totalPages = Math.max(1, Math.ceil(count / itemsPerPage));
  if (count === 0) currentPage = 0;


  return (
    <>
      <AddEtiquetaModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)}
      />
      <DeleteEtiquetaModal 
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        isLoading={isLoading}
        etiqueta={etiquetaToDelete}
      />

      {/* Barra de Ações */}
      <div className="bg-white p-4 rounded-lg shadow-md mb-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input 
              type="text" 
              placeholder="Buscar por responsável, bloco ou apto"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border rounded-lg text-zinc-700 border-gray-300 p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 py-2 pl-10 pr-4 w-full"
            />
          </div>
          <button onClick={handleOpenAddModal} className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors w-full md:w-auto">
            <Plus size={20} />
            Nova Etiqueta
          </button>
        </div>
      </div>

      {/* Tabela de Resultados */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h2 className="text-xl font-semibold text-gray-800">Etiquetas Geradas</h2>
        </div>

        {/* Visão em Tabela (Desktop) */}
        <div className="overflow-x-auto hidden md:block">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left font-semibold text-gray-600 uppercase">ID</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-600 uppercase">Responsável</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-600 uppercase">Tipo</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-600 uppercase">Localização (Bloco/Apto)</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-600 uppercase">Data</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-600 uppercase">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isSearching ? (
                <tr><td colSpan={6} className="text-center py-10 text-gray-500">Buscando...</td></tr>
              ) : etiquetas.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-10 text-gray-500">Nenhuma etiqueta encontrada.</td></tr>
              ) : (
                etiquetas.map((etiqueta) => (
                  <tr key={etiqueta.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-gray-900 font-medium">#{etiqueta.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-700">{etiqueta.nome_responsavel}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${etiqueta.tipo_cliente === 'CONDOMINIO' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>
                        {formatTipo(etiqueta.tipo_cliente)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">{formatLocal(etiqueta)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">{formatDate(etiqueta.data_criacao)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-4 text-gray-500">
                        <button onClick={() => handlePrint(etiqueta.id)} className="hover:text-blue-500" title="Imprimir Etiqueta (A6)">
                          <Printer size={18} />
                        </button>
                        <button onClick={() => handleOpenDeleteModal(etiqueta)} className="hover:text-red-500" title="Excluir">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Visão em Cards (Mobile) */}
        <div className="block md:hidden">
          {isSearching ? (
            <div className="text-center py-10 text-gray-500">Buscando...</div>
          ) : etiquetas.length === 0 ? (
             <div className="text-center py-10 text-gray-500">Nenhuma etiqueta encontrada.</div>
          ) : (
            <div className="divide-y divide-gray-200">
              {etiquetas.map((etiqueta) => (
                <div key={etiqueta.id} className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-900">{etiqueta.nome_responsavel}</span>
                    <div className="flex items-center gap-3 text-gray-500">
                      <button onClick={() => handlePrint(etiqueta.id)} className="hover:text-blue-500" title="Imprimir">
                        <Printer size={18} />
                      </button>
                      <button onClick={() => handleOpenDeleteModal(etiqueta)} className="hover:text-red-500" title="Excluir">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-gray-600">
                    <div>
                      <strong>Tipo:</strong> 
                      <span className={`ml-1 px-2 py-0.5 text-xs font-semibold rounded-full ${etiqueta.tipo_cliente === 'CONDOMINIO' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>
                        {formatTipo(etiqueta.tipo_cliente)}
                      </span>
                    </div>
                    <div><strong>Data:</strong> {formatDate(etiqueta.data_criacao)}</div>
                    <div className="col-span-2">
                      <strong>Local:</strong> {formatLocal(etiqueta)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Paginação (Unificada) */}
        <div className="px-6 py-4 border-t flex items-center justify-between text-sm">
          <span className="text-gray-600">{count} etiquetas cadastradas</span>
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