// src/app/(app)/produtos/ProductList.tsx

"use client";

import { useState, useEffect } from "react"; 
import { useRouter } from 'next/navigation';
import { Produto, PaginatedResponse } from "@/types";
import { 
  Plus, Search, Edit2, Trash2, ChevronLeft, ChevronRight, 
  Box, // <-- 1. IMPORTAR ÍCONES NOVOS
  History 
} from "lucide-react";
import AddProductModal from "./AddProductModal";
import DeleteProductModal from "./DeleteProductModal";
import { api } from "@/lib/api";
import { useDebounce } from "@/hooks/useDebounce";
import { toast } from 'react-toastify'; 

// --- 2. IMPORTAR NOVOS MODAIS ---
import AddStockModal from "./AddStockModal";
import StockHistoryModal from "./StockHistoryModal";

type ProductListProps = {
  initialData: PaginatedResponse<Produto>;
};

export default function ProductList({ initialData }: ProductListProps) {
  const router = useRouter();
  const [data, setData] = useState<PaginatedResponse<Produto>>(initialData);
  
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const [isSearching, setIsSearching] = useState(false);
  
  // Modais de Produto (Editar/Deletar)
  const [isAddOrEditModalOpen, setIsAddOrEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Produto | null>(null);
  const [productToDelete, setProductToDelete] = useState<Produto | null>(null);

  // --- 3. ESTADOS PARA NOVOS MODAIS DE ESTOQUE ---
  const [isAddStockModalOpen, setIsAddStockModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [selectedProduto, setSelectedProduto] = useState<Produto | null>(null);
  // ----------------------------------------------
  
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // (useEffect de busca sem alteração)
    if (debouncedSearchTerm === undefined || (debouncedSearchTerm === '' && searchTerm !== '')) {
      return;
    }
    const fetchProducts = async () => {
      setIsSearching(true);
      try {
        const response = await api.get(`/produtos/?search=${debouncedSearchTerm}`);
        setData(response.data);
      } catch (error) { 
        console.error("Erro ao buscar produtos:", error); 
        toast.error("Erro ao buscar produtos.");
      } 
      finally { setIsSearching(false); }
    };
    fetchProducts();
  }, [debouncedSearchTerm]);
  
  useEffect(() => {
    setData(initialData);
  }, [initialData]);

  const handlePageChange = async (url: string | null) => {
    // (handlePageChange sem alteração)
    if (!url) return;
    setIsSearching(true);
    try {
      const response = await api.get(url);
      setData(response.data);
    } catch (error) { 
      console.error("Erro ao mudar de página:", error); 
      toast.error("Erro ao carregar página.");
    } 
    finally { setIsSearching(false); }
  };

  // Funções para Modais de Produto
  const handleOpenAddModal = () => { setProductToEdit(null); setIsAddOrEditModalOpen(true); };
  const handleOpenEditModal = (produto: Produto) => { setProductToEdit(produto); setIsAddOrEditModalOpen(true); };
  const handleOpenDeleteModal = (produto: Produto) => { setProductToDelete(produto); setIsDeleteModalOpen(true); };
  
  const handleDeleteConfirm = async () => {
    // (handleDeleteConfirm sem alteração)
    if (!productToDelete) return;
    setIsLoading(true);
    try {
      await api.delete(`/produtos/${productToDelete.id}/`);
      setIsDeleteModalOpen(false);
      toast.success("Produto excluído com sucesso!");
      router.refresh();
    } catch (error) { 
      toast.error("Ocorreu um erro ao excluir o produto.");
    } 
    finally { setIsLoading(false); setProductToDelete(null); }
  };

  // --- 4. FUNÇÕES PARA NOVOS MODAIS DE ESTOQUE ---
  const handleCloseModals = () => {
    setIsAddStockModalOpen(false);
    setIsHistoryModalOpen(false);
    setSelectedProduto(null);
  };

  const handleOpenAddStockModal = (produto: Produto) => {
    setSelectedProduto(produto);
    setIsAddStockModalOpen(true);
  };
  
  const handleOpenHistoryModal = (produto: Produto) => {
    setSelectedProduto(produto);
    setIsHistoryModalOpen(true);
  };

  const handleStockAdded = () => {
    handleCloseModals();
    router.refresh(); // Atualiza a lista de produtos (para mostrar o novo estoque)
  };
  // ----------------------------------------------
  
  const formatTipoPrecificacao = (tipo: 'UNICO' | 'M2') => tipo === 'UNICO' ? 'Preço por Unidade' : 'Preço por m²';
  const formatCurrency = (value: string) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(parseFloat(value));

  const { count, next, previous, results: produtos } = data;
  const itemsPerPage = 15;
  const currentPageMatch = previous ? previous.match(/page=(\d+)/) : null;
  const currentPage = currentPageMatch ? parseInt(currentPageMatch[1]) + 1 : 1;
  const totalPages = Math.ceil(count / itemsPerPage);

  return (
    <>
      <AddProductModal isOpen={isAddOrEditModalOpen} onClose={() => setIsAddOrEditModalOpen(false)} productToEdit={productToEdit} />
      <DeleteProductModal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} onConfirm={handleDeleteConfirm} isLoading={isLoading} produto={productToDelete} />
      
      {/* --- 5. RENDERIZAR OS NOVOS MODAIS --- */}
      <AddStockModal 
        isOpen={isAddStockModalOpen}
        onClose={handleCloseModals}
        produto={selectedProduto}
        onStockAdded={handleStockAdded}
      />
      <StockHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={handleCloseModals}
        produto={selectedProduto}
      />
      {/* ----------------------------------- */}


      <div className="bg-white p-4 rounded-lg shadow-md mb-6">
        {/* (Barra de busca sem alteração) */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input 
              type="text" 
              placeholder="Buscar um produto" 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
              className="border rounded-lg text-zinc-700 border-gray-300 p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 py-2 pl-10 pr-4 w-full" 
            />
          </div>
          <button onClick={handleOpenAddModal} className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2 hover:bg-blue-700 w-full md:w-auto">
            <Plus size={20} /> Produto
          </button>
        </div>
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b"><h2 className="text-xl font-semibold text-gray-800">Lista de Produtos</h2></div>
        
        {/* --- 6. ATUALIZAR TABELA DESKTOP --- */}
        <div className="overflow-x-auto hidden md:block">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left font-semibold text-gray-600 uppercase">Nome</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-600 uppercase">Tipo</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-600 uppercase">Preço</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-600 uppercase">Estoque</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-600 uppercase">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isSearching ? (
                <tr><td colSpan={5} className="text-center py-10 text-gray-500">Buscando...</td></tr>
              ) : (
                produtos.map((produto) => (
                  <tr key={produto.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">{produto.nome}</td>
                    <td className="px-6 py-4 text-gray-500">{formatTipoPrecificacao(produto.tipo_precificacao)}</td>
                    <td className="px-6 py-4 text-gray-500">{formatCurrency(produto.preco)}</td>
                    <td className="px-6 py-4">
                      {produto.estoque_atual !== null ? (
                        <span className={`font-bold ${
                          (produto.estoque_minimo && produto.estoque_atual <= produto.estoque_minimo) 
                          ? 'text-red-500' 
                          : 'text-gray-700'
                        }`}>
                          {produto.estoque_atual}
                        </span>
                      ) : (
                        <span className="text-gray-400">N/A</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4 text-gray-500">
                        {produto.estoque_atual !== null && (
                          <button onClick={() => handleOpenAddStockModal(produto)} className="hover:text-blue-500" title="Movimentar Estoque">
                            <Box size={18} />
                          </button>
                        )}
                        <button onClick={() => handleOpenHistoryModal(produto)} className="hover:text-purple-500" title="Ver Histórico">
                          <History size={18} />
                        </button>
                        <button onClick={() => handleOpenEditModal(produto)} className="hover:text-yellow-500" title="Editar"><Edit2 size={18} /></button>
                        <button onClick={() => handleOpenDeleteModal(produto)} className="hover:text-red-500" title="Excluir"><Trash2 size={18} /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {/* --- FIM DA TABELA DESKTOP --- */}


        {/* --- 7. ATUALIZAR CARD MOBILE --- */}
        <div className="block md:hidden">
          {isSearching ? (
            <div className="text-center py-10 text-gray-500">Buscando...</div>
          ) : (
            <div className="divide-y divide-gray-200">
              {produtos.map((produto) => (
                <div key={produto.id} className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-900">{produto.nome}</span>
                    <div className="flex items-center gap-3 text-gray-500">
                      {produto.estoque_atual !== null && (
                        <button onClick={() => handleOpenAddStockModal(produto)} className="hover:text-blue-500" title="Movimentar Estoque">
                          <Box size={18} />
                        </button>
                      )}
                      <button onClick={() => handleOpenHistoryModal(produto)} className="hover:text-purple-500" title="Ver Histórico">
                        <History size={18} />
                      </button>
                      <button onClick={() => handleOpenEditModal(produto)} className="hover:text-yellow-500" title="Editar"><Edit2 size={18} /></button>
                      <button onClick={() => handleOpenDeleteModal(produto)} className="hover:text-red-500" title="Excluir"><Trash2 size={18} /></button>
                    </div>
                  </div>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p><strong>Tipo:</strong> {formatTipoPrecificacao(produto.tipo_precificacao)}</p>
                    <p><strong>Preço:</strong> {formatCurrency(produto.preco)}</p>
                    <p><strong>Estoque:</strong> 
                      {produto.estoque_atual !== null ? (
                          <span className={`font-bold ml-1 ${
                            (produto.estoque_minimo && produto.estoque_atual <= produto.estoque_minimo) 
                            ? 'text-red-500' 
                            : 'text-gray-700'
                          }`}>
                            {produto.estoque_atual}
                          </span>
                        ) : (
                          <span className="text-gray-400 ml-1">N/A</span>
                        )}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        {/* --- FIM DO CARD MOBILE --- */}

        {/* --- PAGINAÇÃO (Unificada) --- */}
        <div className="px-6 py-4 border-t flex items-center justify-between text-sm">
          {/* (Paginação sem alteração) */}
          <span className="text-gray-600">{count} produtos cadastrados</span>
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