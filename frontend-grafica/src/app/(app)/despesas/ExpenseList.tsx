// src/app/(app)/despesas/ExpenseList.tsx

"use client";

import { useState, useEffect } from "react"; 
import { useRouter } from "next/navigation";
import { Despesa } from "@/types";
import { Plus, Search, Edit2, Trash2 } from "lucide-react";
import AddEditExpenseModal from "./AddEditExpenseModal";
import { api } from "@/lib/api";
import { useDebounce } from "@/hooks/useDebounce"; // Importa nosso hook de debounce

type ExpenseListProps = {
  initialDespesas: any[]; // Usamos 'any' pois a lista é consolidada
};

export default function ExpenseList({ initialDespesas }: ExpenseListProps) {
  const router = useRouter();
  const [despesas, setDespesas] = useState<any[]>(initialDespesas);
  
  // 1. Estados para controlar a busca
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300); // Um debounce mais rápido para busca local

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [expenseToEdit, setExpenseToEdit] = useState<Despesa | null>(null);

  // 2. Efeito para filtrar os dados no lado do cliente quando a busca mudar
  useEffect(() => {
    if (debouncedSearchTerm) {
      const filtered = initialDespesas.filter(d => 
        d.descricao.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        (d.categoria && d.categoria.toLowerCase().includes(debouncedSearchTerm.toLowerCase()))
      );
      setDespesas(filtered);
    } else {
      setDespesas(initialDespesas); // Se a busca estiver vazia, mostra a lista completa
    }
  }, [debouncedSearchTerm, initialDespesas]);

  const handleOpenAddModal = () => {
    setExpenseToEdit(null);
    setIsModalOpen(true);
  };
  
  const handleOpenEditModal = (despesa: Despesa) => {
    setExpenseToEdit(despesa);
    setIsModalOpen(true);
  };
  
  const handleDelete = async (id: number) => {
    // A rota para deletar é a de despesas-gerais
    if (confirm('Tem certeza que deseja excluir esta despesa?')) {
      try {
        await api.delete(`/despesas-gerais/${id}/`);
        router.refresh();
      } catch (error) {
        alert('Falha ao excluir a despesa.');
      }
    }
  };

  const formatCurrency = (value: string) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(parseFloat(value));
  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('pt-BR', { timeZone: 'UTC' });

  return (
    <>
      <AddEditExpenseModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        expenseToEdit={expenseToEdit}
      />

      <div className="bg-white p-4 rounded-lg shadow-md mb-6 flex items-center justify-between">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          {/* 3. Conectamos o input ao nosso estado 'searchTerm' */}
          <input 
            type="text" 
            placeholder="Buscar por descrição ou categoria" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border rounded-lg  text-zinc-700 border-gray-300 p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 py-2 pl-10 pr-4 w-80" 
          />
        </div>
        <button onClick={handleOpenAddModal} className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2 hover:bg-blue-700">
          <Plus size={20} /> Nova Despesa Geral
        </button>
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b"><h2 className="text-xl font-semibold text-gray-800">Lista de Despesas Gerais</h2></div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left font-semibold text-gray-600 uppercase">Descrição</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-600 uppercase">Tipo</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-600 uppercase">Categoria</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-600 uppercase">Data</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-600 uppercase">Valor</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-600 uppercase">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {despesas.map((despesa) => (
                <tr key={despesa.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">{despesa.descricao}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${despesa.tipo === 'Produção' ? 'bg-indigo-100 text-indigo-800' : 'bg-gray-100 text-gray-800'}`}>
                      {despesa.tipo}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-500">{despesa.categoria || '--'}</td>
                  <td className="px-6 py-4 text-gray-500">{formatDate(despesa.data)}</td>
                  <td className="px-6 py-4 text-gray-700">{formatCurrency(despesa.valor)}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4 text-gray-500">
                      {despesa.tipo === 'Geral' ? (
                        <>
                          <button onClick={() => handleOpenEditModal(despesa)} className="hover:text-yellow-500" title="Editar"><Edit2 size={18} /></button>
                          <button onClick={() => handleDelete(despesa.id)} className="hover:text-red-500" title="Excluir"><Trash2 size={18} /></button>
                        </>
                      ) : (
                        <span className="text-xs italic">Gerenciado no Pedido</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}