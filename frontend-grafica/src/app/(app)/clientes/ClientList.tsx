// src/app/(app)/clientes/ClientList.tsx
// (Arquivo Modificado)

"use client";

import { useState, useEffect } from "react"; 
import { useRouter } from 'next/navigation';
import { Cliente, PaginatedResponse } from "@/types";
import { Plus, MessageSquare, Eye, Edit2, Trash2, Search, ChevronLeft, ChevronRight } from "lucide-react";
import AddClientModal from "./AddClientModal";
import DeleteClientModal from "./DeleteClientModal";
import ViewClientModal from "./ViewClientModal";
import { api } from '@/lib/api';
import { useDebounce } from "@/hooks/useDebounce";
import { toast } from 'react-toastify';

type ClientListProps = {
  initialData: PaginatedResponse<Cliente>;
};

// --- NOVA FUNÇÃO HELPER ---
const formatPhoneNumberForWhatsApp = (phone: string | null | undefined): string => {
  if (!phone) return '';
  // Remove tudo que não for dígito
  const cleaned = phone.replace(/\D/g, '');
  // Assume DDI 55 (Brasil) se não for informado
  if (cleaned.length <= 11) {
    return `55${cleaned}`;
  }
  return cleaned;
};
// ----------------------------


export default function ClientList({ initialData }: ClientListProps) {
  const router = useRouter();
  
  const [data, setData] = useState<PaginatedResponse<Cliente>>(initialData);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const [isSearching, setIsSearching] = useState(false);
  
  const [isAddOrEditModalOpen, setIsAddOrEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  
  const [clientToEdit, setClientToEdit] = useState<Cliente | null>(null);
  const [clientToView, setClientToView] = useState<Cliente | null>(null);
  const [clientToDelete, setClientToDelete] = useState<Cliente | null>(null);
  
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (debouncedSearchTerm === undefined || (debouncedSearchTerm === '' && searchTerm !== '')) {
      return;
    }
    const fetchClients = async () => {
      setIsSearching(true);
      try {
        const response = await api.get(`/clientes/?search=${debouncedSearchTerm}`);
        setData(response.data);
      } catch (error) {
        console.error("Erro ao buscar clientes:", error);
      } finally {
        setIsSearching(false);
      }
    };
    fetchClients();
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

  const handleOpenAddModal = () => { setClientToEdit(null); setIsAddOrEditModalOpen(true); };
  const handleOpenEditModal = (cliente: Cliente) => { setClientToEdit(cliente); setIsAddOrEditModalOpen(true); };
  const handleOpenViewModal = (cliente: Cliente) => { setClientToView(cliente); setIsViewModalOpen(true); };
  const handleOpenDeleteModal = (cliente: Cliente) => { setClientToDelete(cliente); setIsDeleteModalOpen(true); };
  
  const handleDeleteConfirm = async () => {
    if (!clientToDelete) return;
    setIsLoading(true);
    try {
      await api.delete(`/clientes/${clientToDelete.id}/`);
      setIsDeleteModalOpen(false);
      toast.success('Cliente excluído com sucesso!');
      router.refresh(); 
    } catch (error) {
      console.error("Falha ao excluir cliente:", error);
      toast.error("Ocorreu um erro ao excluir o cliente.");
    } finally {
      setIsLoading(false);
      setClientToDelete(null);
    }
  };

  const { count, next, previous, results: clientes } = data;
  const itemsPerPage = 15;
  const currentPageMatch = previous ? previous.match(/page=(\d+)/) : null;
  const currentPage = currentPageMatch ? parseInt(currentPageMatch[1]) + 1 : 1;
  const totalPages = Math.ceil(count / itemsPerPage);

  return (
    <>
      <AddClientModal 
        isOpen={isAddOrEditModalOpen} 
        onClose={() => setIsAddOrEditModalOpen(false)}
        clientToEdit={clientToEdit}
      />
      <ViewClientModal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        cliente={clientToView}
      />
      <DeleteClientModal 
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        isLoading={isLoading}
        cliente={clientToDelete}
      />

      {/* ... (Barra de busca e botão de adicionar sem mudanças) ... */}
      <div className="bg-white p-4 rounded-lg shadow-md mb-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input 
              type="text" 
              placeholder="Buscar por nome, CPF/CNPJ ou email"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border rounded-lg text-zinc-700 border-gray-300 p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 py-2 pl-10 pr-4 w-full"
            />
          </div>
          <button onClick={handleOpenAddModal} className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors w-full md:w-auto">
            <Plus size={20} />
            Cliente
          </button>
        </div>
      </div>


      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h2 className="text-xl font-semibold text-gray-800">Lista de Clientes</h2>
        </div>

        {/* 1. VISÃO EM TABELA (DESKTOP) */}
        <div className="overflow-x-auto hidden md:block">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left font-semibold text-gray-600 uppercase tracking-wider">Nome</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-600 uppercase tracking-wider">CPF/CNPJ</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-600 uppercase tracking-wider">Whatsapp</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-600 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-600 uppercase tracking-wider">Localidade</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-600 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isSearching ? (
                <tr><td colSpan={6} className="text-center py-10 text-gray-500">Buscando...</td></tr>
              ) : (
                clientes.map((cliente) => (
                  <tr key={cliente.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-gray-900 font-medium">{cliente.nome}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">{cliente.cpf_cnpj || '--'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">{cliente.telefone}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">{cliente.email || '--'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">{(cliente as any).cidade ? `${(cliente as any).cidade}/${(cliente as any).estado}` : '--'}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      
                      {/* --- MODIFICAÇÃO BOTÃO WHATSAPP (DESKTOP) --- */}
                      <div className="flex items-center gap-4 text-gray-500">
                        <a 
                          href={`https://wa.me/${formatPhoneNumberForWhatsApp(cliente.telefone)}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className={`hover:text-green-500 ${!cliente.telefone ? 'opacity-30 cursor-not-allowed' : ''}`}
                          title={cliente.telefone ? 'Abrir WhatsApp' : 'Telefone não cadastrado'}
                          onClick={(e) => !cliente.telefone && e.preventDefault()} // Impede o clique se não houver telefone
                        >
                          <MessageSquare size={18} />
                        </a>
                        <button onClick={() => handleOpenViewModal(cliente)} className="hover:text-blue-500" title="Visualizar"><Eye size={18} /></button>
                        <button onClick={() => handleOpenEditModal(cliente)} className="hover:text-yellow-500" title="Editar"><Edit2 size={18} /></button>
                        <button onClick={() => handleOpenDeleteModal(cliente)} className="hover:text-red-500" title="Excluir"><Trash2 size={18} /></button>
                      </div>
                      {/* ------------------------------------------- */}

                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* 2. VISÃO EM CARDS (MOBILE) */}
        <div className="block md:hidden">
          {isSearching ? (
            <div className="text-center py-10 text-gray-500">Buscando...</div>
          ) : (
            <div className="divide-y divide-gray-200">
              {clientes.map((cliente) => (
                <div key={cliente.id} className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-900">{cliente.nome}</span>
                    
                    {/* --- MODIFICAÇÃO BOTÃO WHATSAPP (MOBILE) --- */}
                    <div className="flex items-center gap-3 text-gray-500">
                      <a 
                        href={`https://wa.me/${formatPhoneNumberForWhatsApp(cliente.telefone)}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className={`hover:text-green-500 ${!cliente.telefone ? 'opacity-30 cursor-not-allowed' : ''}`}
                        title={cliente.telefone ? 'Abrir WhatsApp' : 'Telefone não cadastrado'}
                        onClick={(e) => !cliente.telefone && e.preventDefault()}
                      >
                        <MessageSquare size={18} />
                      </a>
                      <button onClick={() => handleOpenViewModal(cliente)} className="hover:text-blue-500" title="Visualizar"><Eye size={18} /></button>
                      <button onClick={() => handleOpenEditModal(cliente)} className="hover:text-yellow-500" title="Editar"><Edit2 size={18} /></button>
                      <button onClick={() => handleOpenDeleteModal(cliente)} className="hover:text-red-500" title="Excluir"><Trash2 size={18} /></button>
                    </div>
                    {/* ------------------------------------------ */}
                    
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-gray-600">
                    <div>
                      <strong>Whatsapp:</strong> {cliente.telefone || '--'}
                    </div>
                    <div>
                      <strong>CPF/CNPJ:</strong> {cliente.cpf_cnpj || '--'}
                    </div>
                    <div className="col-span-2">
                      <strong>Email:</strong> {cliente.email || '--'}
                    </div>
                    <div className="col-span-2">
                      <strong>Localidade:</strong> {(cliente as any).cidade ? `${(cliente as any).cidade}/${(cliente as any).estado}` : '--'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 3. PAGINAÇÃO (Unificada para ambas as visões) */}
        <div className="px-6 py-4 border-t flex items-center justify-between text-sm">
          {/* ... (Paginação sem mudanças) ... */}
          <span className="text-gray-600">{count} Clientes Cadastrados</span>
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