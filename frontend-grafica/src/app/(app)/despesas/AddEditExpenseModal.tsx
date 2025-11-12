// src/app/(app)/despesas/AddEditExpenseModal.tsx

"use client";

import { useState, FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Despesa } from '@/types';
import { api } from '@/lib/api';

type AddEditExpenseModalProps = {
  isOpen: boolean;
  onClose: () => void;
  expenseToEdit: Despesa | null;
};

const initialState = {
  descricao: '',
  valor: '',
  data: '',
  categoria: '',
};

export default function AddEditExpenseModal({ isOpen, onClose, expenseToEdit }: AddEditExpenseModalProps) {
  const router = useRouter();
  const [formData, setFormData] = useState(initialState);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      if (expenseToEdit) {
        setFormData({
          descricao: expenseToEdit.descricao || '',
          valor: expenseToEdit.valor || '',
          data: expenseToEdit.data || '',
          categoria: expenseToEdit.categoria || '',
        });
      } else {
        setFormData(initialState);
      }
    }
  }, [expenseToEdit, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prevState => ({ ...prevState, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      
      if (expenseToEdit) {
        await api.put(`/despesas-gerais/${expenseToEdit.id}/`, formData);
      } else {
        await api.post('/despesas-gerais/', formData);
      }
      router.refresh();
      onClose();
    } catch (err: any) {
      console.error("Erro ao salvar despesa:", err);
      setError("Falha ao salvar. Verifique os dados.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-lg">
        <h2 className="text-xl text-zinc-800 font-bold mb-4 border-b pb-4">
          {expenseToEdit ? 'Editar Despesa' : 'Nova Despesa'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Descrição</label>
            <input name="descricao" value={formData.descricao} onChange={handleChange} className="w-full p-2 border rounded-md text-zinc-700 border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500" required />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Valor (R$)</label>
              <input name="valor" type="number" step="0.01" value={formData.valor} onChange={handleChange} className="w-full p-2 border rounded-md text-zinc-700 border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Data</label>
              <input name="data" type="date" value={formData.data} onChange={handleChange} className="w-full p-2 border rounded-md text-zinc-700 border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500" required />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Categoria</label>
            <input name="categoria" value={formData.categoria} onChange={handleChange} placeholder="Ex: Suprimentos, Salários" className="w-full p-2 border rounded-md text-zinc-700 border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button type="button" onClick={onClose} className="bg-white text-gray-700 font-bold py-2 px-4 rounded-lg border hover:bg-gray-100">Cancelar</button>
            <button type="submit" disabled={isLoading} className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700">{isLoading ? 'Salvando...' : 'Salvar'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}