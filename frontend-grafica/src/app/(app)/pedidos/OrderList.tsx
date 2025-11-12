"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Pedido, PaginatedResponse } from "@/types";
import { Search, Edit2, Trash2, Eye, ChevronLeft, ChevronRight, Printer } from "lucide-react";
import { api } from "@/lib/api";
import { useDebounce } from "@/hooks/useDebounce";
import { handleDownloadPdf } from "@/utils/pdfDownloader";
import { toast } from "react-toastify"; 
import DeleteOrderModal from "./DeleteOrderModal";

type OrderListProps = {
  initialData: PaginatedResponse<Pedido>;
};

export default function OrderList({ initialData }: OrderListProps) {
  const router = useRouter();
  const [data, setData] = useState<PaginatedResponse<Pedido>>(initialData);

  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const [isSearching, setIsSearching] = useState(false);

  // --- 3. ADICIONAR ESTADOS PARA O MODAL ---
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<Pedido | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  // ------------------------------------------

  useEffect(() => {
    if (
      debouncedSearchTerm === undefined ||
      (debouncedSearchTerm === "" && searchTerm !== "")
    ) {
      return;
    }

    const fetchOrders = async () => {
      setIsSearching(true);
      try {
        const response = await api.get(`/pedidos/?search=${debouncedSearchTerm}`);
        setData(response.data);
      } catch (error) {
        console.error("Erro ao buscar pedidos:", error);
      } finally {
        setIsSearching(false);
      }
    };

    fetchOrders();
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

  const handleView = (pedidoId: number) => router.push(`/pedidos/${pedidoId}`);
  const handleEdit = (pedidoId: number) => router.push(`/pedidos/${pedidoId}/editar`);
  const handlePrint = (pedidoId: number) => {
    handleDownloadPdf(`/pedidos/${pedidoId}/pdf/`, `pedido_os_${pedidoId}.pdf`);
  };

  // --- 4. ADICIONAR FUNÇÕES DO MODAL DE EXCLUSÃO ---
  const handleOpenDeleteModal = (pedido: Pedido) => {
    setOrderToDelete(pedido);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!orderToDelete) return;
    setIsLoading(true);
    try {
      await api.delete(`/pedidos/${orderToDelete.id}/`);
      setIsDeleteModalOpen(false);
      toast.success("Pedido excluído com sucesso!");
      router.refresh(); // Atualiza a lista
    } catch (error) {
      toast.error("Ocorreu um erro ao excluir o pedido.");
    } finally {
      setIsLoading(false);
      setOrderToDelete(null);
    }
  };
  // ------------------------------------------------

  const formatCurrency = (value: string) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(parseFloat(value));
  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

  const getStatusClass = (status: string) => {
    // ... (função getStatusClass sem alterações)
    switch (status) {
      case "PAGO":
        return "bg-green-100 text-green-800";
      case "PENDENTE":
        return "bg-yellow-100 text-yellow-800";
      case "PARCIAL":
        return "bg-blue-100 text-blue-800";
      case "Finalizado":
        return "bg-purple-100 text-purple-800";
      case "Em Produção":
        return "bg-indigo-100 text-indigo-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const { count, next, previous, results: pedidos } = data;
  const itemsPerPage = 15;
  const currentPageMatch = previous ? previous.match(/page=(\d+)/) : null;
  const currentPage = currentPageMatch ? parseInt(currentPageMatch[1]) + 1 : 1;
  const totalPages = Math.ceil(count / itemsPerPage);

  return (
    <>
      {/* --- 5. ADICIONAR O COMPONENTE MODAL AO JSX --- */}
      <DeleteOrderModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        isLoading={isLoading}
        pedido={orderToDelete}
      />
      {/* ------------------------------------------- */}

      {/* Busca */}
      <div className="bg-white p-4 rounded-lg shadow-md mb-4">
        {/* ... (código da busca sem alterações) ... */}
        <label className="sr-only" htmlFor="order-search">
          Pesquisar pedidos
        </label>
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            size={20}
            aria-hidden
          />
          <input
            id="order-search"
            type="text"
            placeholder="Pesquisar por cliente ou ID do pedido"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border rounded-lg text-zinc-700 border-gray-300 py-3 pl-10 pr-4 w-full md:w-96 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b"><h2 className="text-xl font-semibold text-gray-800">Lista de Pedidos</h2></div>
        {/* Lista MOBILE em cards */}
        <ul className="divide-y md:hidden">
          {isSearching ? (
            <li className="py-10 text-center text-gray-500">Buscando...</li>
          ) : (
            pedidos.map((pedido) => (
              <li key={pedido.id} className="p-4">
                {/* ... (código do card mobile sem alterações) ... */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm text-zinc-500">Pedido</div>
                    <div className="font-semibold text-blue-600">PED-{pedido.id}</div>
                  </div>
                  <span
                    className={`px-2 py-1 text-[11px] font-semibold rounded-full ${getStatusClass(
                      pedido.status_producao
                    )}`}
                  >
                    {pedido.status_producao}
                  </span>
                </div>
                
                <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  <div className="text-zinc-500">Cliente</div>
                  <div className="font-medium text-zinc-800 truncate">{pedido.cliente.nome}</div>

                  <div className="text-zinc-500">Data</div>
                  <div className="text-zinc-700">{formatDate(pedido.data_criacao)}</div>

                  <div className="text-zinc-500">Valor</div>
                  <div className="text-zinc-800">{formatCurrency(pedido.valor_total)}</div>

                  <div className="text-zinc-500">Status Pag.</div>
                  <div>
                    <span
                      className={`px-2 py-1 text-[11px] font-semibold rounded-full ${getStatusClass(
                        pedido.status_pagamento
                      )}`}
                    >
                      {pedido.status_pagamento}
                    </span>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    onClick={() => handleView(pedido.id)}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-md border text-sm text-zinc-700 hover:bg-gray-50"
                  >
                    <Eye size={16} /> Ver
                  </button>
                  <button
                    onClick={() => handleEdit(pedido.id)}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-md border text-sm text-zinc-700 hover:bg-gray-50"
                  >
                    <Edit2 size={16} /> Editar
                  </button>
                  {/* --- 6. ATUALIZAR BOTÃO DE EXCLUIR (MOBILE) --- */}
                  <button
                    onClick={() => handleOpenDeleteModal(pedido)}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-md border text-sm text-red-600 hover:bg-gray-50"
                    title="Excluir"
                  >
                    <Trash2 size={16} /> Excluir
                  </button>
                  {/* ---------------------------------------------- */}
                  <button
                    onClick={() => handlePrint(pedido.id)}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-md border text-sm text-zinc-700 hover:bg-gray-50"
                  >
                    <Printer size={16} /> OS
                  </button>
                </div>
              </li>
            ))
          )}
        </ul>

        {/* Tabela DESKTOP */}
        <div className="hidden md:block overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              {/* ... (cabeçalho da tabela sem alterações) ... */}
              <tr>
                <th className="px-6 py-3 text-left font-semibold text-gray-600 uppercase">Pedido</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-600 uppercase">Cliente</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-600 uppercase">Data</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-600 uppercase">Valor</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-600 uppercase">Status Pag.</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-600 uppercase">Status Prod.</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-600 uppercase">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isSearching ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-gray-500">
                    Buscando...
                  </td>
                </tr>
              ) : (
                pedidos.map((pedido) => (
                  <tr key={pedido.id} className="hover:bg-gray-50">
                    {/* ... (células da tabela sem alterações) ... */}
                    <td className="px-6 py-4 font-medium text-blue-600">PED-{pedido.id}</td>
                    <td className="px-6 py-4 text-gray-700 font-medium">{pedido.cliente.nome}</td>
                    <td className="px-6 py-4 text-gray-500">{formatDate(pedido.data_criacao)}</td>
                    <td className="px-6 py-4 text-gray-700">{formatCurrency(pedido.valor_total)}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusClass(
                          pedido.status_pagamento
                        )}`}
                      >
                        {pedido.status_pagamento}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusClass(
                          pedido.status_producao
                        )}`}
                      >
                        {pedido.status_producao}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3 text-gray-500">
                        <button
                          onClick={() => handleView(pedido.id)}
                          className="hover:text-blue-500"
                          title="Visualizar"
                        >
                          <Eye size={18} />
                        </button>
                        <button
                          onClick={() => handleEdit(pedido.id)}
                          className="hover:text-yellow-500"
                          title="Editar"
                        >
                          <Edit2 size={18} />
                        </button>
                        {/* --- 7. ATUALIZAR BOTÃO DE EXCLUIR (DESKTOP) --- */}
                        <button 
                          onClick={() => handleOpenDeleteModal(pedido)} 
                          className="hover:text-red-500" 
                          title="Excluir"
                        >
                          <Trash2 size={18} />
                        </button>
                        {/* ----------------------------------------------- */}
                        <button
                          onClick={() => handlePrint(pedido.id)}
                          className="hover:text-gray-700"
                          title="Imprimir OS"
                        >
                          <Printer size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Paginação */}
        <div className="px-4 sm:px-6 py-4 border-t flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between text-sm">
          {/* ... (código da paginação sem alterações) ... */}
          <span className="text-gray-600">{count} pedidos cadastrados</span>
          <div className="flex items-center justify-between sm:justify-end gap-3">
            <span className="text-gray-600">
              {currentPage} de {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(previous)}
                disabled={!previous || isSearching}
                className="rounded-md border border-slate-400 p-2 text-center
                  text-sm transition-all shadow-sm hover:shadow-lg text-slate-600 hover:text-white 
                  hover:bg-slate-700 hover:border-slate-700 focus:text-white focus:bg-slate-600 
                  focus:border-slate-800 active:border-slate-800 active:text-white active:bg-slate-800
                  disabled:opacity-50"
              >
                <span className="inline-flex items-center gap-1">
                  <ChevronLeft size={16} />
                </span>
              </button>
              <button
                onClick={() => handlePageChange(next)}
                disabled={!next || isSearching}
                className="rounded-md border border-slate-400 p-2 text-center
                  text-sm transition-all shadow-sm hover:shadow-lg text-slate-600 hover:text-white 
                  hover:bg-slate-700 hover:border-slate-700 focus:text-white focus:bg-slate-600 
                  focus:border-slate-800 active:border-slate-800 active:text-white active:bg-slate-800"
              >
                <span className="inline-flex items-center gap-1">
                 <ChevronRight size={16} />
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}