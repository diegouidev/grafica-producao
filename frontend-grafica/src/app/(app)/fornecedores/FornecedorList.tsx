// src/app/(app)/fornecedores/FornecedorList.tsx
// (Arquivo Modificado)

"use client";

import { useState, useEffect } from "react"; 
import { useRouter } from 'next/navigation';
import { Fornecedor, PaginatedResponse } from "@/types";
import { Plus, Edit2, Trash2, Search, ChevronLeft, ChevronRight, MessageSquare } from "lucide-react";
import AddEditFornecedorModal from "./AddEditFornecedorModal";
import DeleteFornecedorModal from "./DeleteFornecedorModal";
import { api } from '@/lib/api';
import { useDebounce } from "@/hooks/useDebounce";
import { toast } from 'react-toastify';

type FornecedorListProps = {
  initialData: PaginatedResponse<Fornecedor>;
};

const formatPhoneNumberForWhatsApp = (phone: string | null | undefined): string => {
  if (!phone) return '';
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length <= 11) {
    return `55${cleaned}`;
  }
  return cleaned;
};

export default function FornecedorList({ initialData }: FornecedorListProps) {
  const router = useRouter();
  
  const [data, setData] = useState<PaginatedResponse<Fornecedor>>(initialData);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const [isSearching, setIsSearching] = useState(false);
  
  const [isAddOrEditModalOpen, setIsAddOrEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  
  const [fornecedorToEdit, setFornecedorToEdit] = useState<Fornecedor | null>(null);
  const [fornecedorToDelete, setFornecedorToDelete] = useState<Fornecedor | null>(null);
  
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (debouncedSearchTerm === undefined || (debouncedSearchTerm === '' && searchTerm !== '')) {
      return;
    }
    const fetchFornecedores = async () => {
      setIsSearching(true);
      try {
        // A busca agora também funciona por CNPJ (definido no backend)
        const response = await api.get(`/fornecedores/?search=${debouncedSearchTerm}`);
        setData(response.data);
      } catch (error) {
        console.error("Erro ao buscar fornecedores:", error);
      } finally {
        setIsSearching(false);
      }
    };
    fetchFornecedores();
  }, [debouncedSearchTerm]);

  useEffect(() => {
    setData(initialData);
  }, [initialData]);

  const handlePageChange = async (url: string | null) => {
    if (!url) return;
    setIsSearching(true);
    try {
      const response = await api.get(url);
      setData(response.data);
    } catch (error) {
      console.error("Erro ao mudar de página:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleOpenAddModal = () => { setFornecedorToEdit(null); setIsAddOrEditModalOpen(true); };
  const handleOpenEditModal = (fornecedor: Fornecedor) => { setFornecedorToEdit(fornecedor); setIsAddOrEditModalOpen(true); };
  const handleOpenDeleteModal = (fornecedor: Fornecedor) => { setFornecedorToDelete(fornecedor); setIsDeleteModalOpen(true); };
  
  const handleDeleteConfirm = async () => {
    if (!fornecedorToDelete) return;
    setIsLoading(true);
    try {
      await api.delete(`/fornecedores/${fornecedorToDelete.id}/`);
      setIsDeleteModalOpen(false);
      toast.success('Fornecedor excluído com sucesso!');
      router.refresh(); 
    } catch (error) {
      console.error("Falha ao excluir fornecedor:", error);
      toast.error("Ocorreu um erro ao excluir o fornecedor.");
    } finally {
      setIsLoading(false);
      setFornecedorToDelete(null);
    }
  };

  const { count, next, previous, results: fornecedores } = data;
  const itemsPerPage = 15;
  const currentPageMatch = previous ? previous.match(/page=(\d+)/) : null;
  const currentPage = currentPageMatch ? parseInt(currentPageMatch[1]) + 1 : 1;
  const totalPages = Math.ceil(count / itemsPerPage);

  return (
    <>
      <AddEditFornecedorModal 
        isOpen={isAddOrEditModalOpen} 
        onClose={() => setIsAddOrEditModalOpen(false)}
        fornecedorToEdit={fornecedorToEdit}
      />
      <DeleteFornecedorModal 
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        isLoading={isLoading}
        fornecedor={fornecedorToDelete}
      />

      <div className="bg-white p-4 rounded-lg shadow-md mb-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input 
              type="text" 
              placeholder="Buscar por nome, serviço ou CNPJ"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border rounded-lg text-zinc-700 border-gray-300 p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 py-2 pl-10 pr-4 w-full"
            />
          </div>
          <button onClick={handleOpenAddModal} className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors w-full md:w-auto">
            <Plus size={20} />
            Fornecedor
          </button>
        </div>
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h2 className="text-xl font-semibold text-gray-800">Lista de Fornecedores</h2>
        </div>

        {/* Tabela (Desktop) */}
        <div className="overflow-x-auto hidden md:block">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left font-semibold text-gray-600 uppercase">Nome</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-600 uppercase">CNPJ</th> {/* <-- COLUNA ADICIONADA */}
                <th className="px-6 py-3 text-left font-semibold text-gray-600 uppercase">Contato</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-600 uppercase">Telefone</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-600 uppercase">Serviços</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-600 uppercase">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isSearching ? (
                <tr><td colSpan={6} className="text-center py-10 text-gray-500">Buscando...</td></tr>
              ) : (
                fornecedores.map((fornecedor) => (
                  <tr key={fornecedor.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-gray-900 font-medium">{fornecedor.nome}</td>
                    <td className="px-6 py-4 text-gray-500">{fornecedor.cnpj || '--'}</td> {/* <-- CAMPO ADICIONADO */}
                    <td className="px-6 py-4 text-gray-500">{fornecedor.contato_nome || '--'}</td>
                    <td className="px-6 py-4 text-gray-500">{fornecedor.telefone || '--'}</td>
                    <td className="px-6 py-4 text-gray-500 truncate" style={{ maxWidth: '200px' }}>{fornecedor.servicos_prestados || '--'}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4 text-gray-500">
                        <a 
                          href={`https://wa.me/${formatPhoneNumberForWhatsApp(fornecedor.telefone)}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className={`hover:text-green-500 ${!fornecedor.telefone ? 'opacity-30 cursor-not-allowed' : ''}`}
                          title={fornecedor.telefone ? 'Abrir WhatsApp' : 'Telefone não cadastrado'}
                          onClick={(e) => !fornecedor.telefone && e.preventDefault()}
                        >
                          <MessageSquare size={18} />
                        </a>
                        <button onClick={() => handleOpenEditModal(fornecedor)} className="hover:text-yellow-500" title="Editar"><Edit2 size={18} /></button>
                        <button onClick={() => handleOpenDeleteModal(fornecedor)} className="hover:text-red-500" title="Excluir"><Trash2 size={18} /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Paginação */}
        <div className="px-6 py-4 border-t flex items-center justify-between text-sm">
          <span className="text-gray-600">{count} fornecedores cadastrados</span>
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