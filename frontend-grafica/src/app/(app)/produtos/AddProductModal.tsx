// src/app/(app)/produtos/AddProductModal.tsx

"use client";

import { useState, FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Produto } from '@/types';
import { api } from '@/lib/api';
import { toast } from 'react-toastify';

type AddProductModalProps = {
  isOpen: boolean;
  onClose: () => void;
  productToEdit: Produto | null;
};

const initialState = {
  nome: '',
  tipo_precificacao: 'UNICO' as 'UNICO' | 'M2',
  preco: '',
  custo: '',
  estoque_atual: 0,
  estoque_minimo: 0,
};

export default function AddProductModal({ isOpen, onClose, productToEdit }: AddProductModalProps) {
  const router = useRouter();
  const [formData, setFormData] = useState<any>(initialState);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (productToEdit) {
        setFormData({
          nome: productToEdit.nome || '',
          tipo_precificacao: productToEdit.tipo_precificacao || 'UNICO',
          preco: productToEdit.preco || '',
          custo: productToEdit.custo || '',
          estoque_atual: productToEdit.estoque_atual || 0,
          estoque_minimo: productToEdit.estoque_minimo || 0,
        });
      } else {
        setFormData(initialState);
      }
    }
  }, [productToEdit, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prevState => ({ 
      ...prevState, 
      [name]: name.includes('estoque') ? (parseInt(value) || 0) : value 
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Converte estoque para null se for 0, se o backend preferir assim
    const payload = {
      ...formData,
      estoque_atual: formData.estoque_atual || null,
      estoque_minimo: formData.estoque_minimo || null,
    };

    try {
      if (productToEdit) {
        await api.put(`/produtos/${productToEdit.id}/`, payload);
        toast.success("Produto atualizado com sucesso!");
      } else {
        await api.post('/produtos/', payload);
        toast.success("Produto criado com sucesso!");
      }
      router.refresh();
      onClose();
    } catch (err: any) {
      console.error("Erro ao salvar produto:", err);
      toast.error("Falha ao salvar. Verifique os dados.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-2xl">
        <h2 className="text-xl font-bold mb-4 border-b pb-4 text-zinc-800">
          {productToEdit ? 'Editar Produto' : 'Novo Produto'}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Nome do Produto</label>
            <input name="nome" value={formData.nome} onChange={handleChange} className="w-full p-2 border rounded-md text-zinc-700 border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Tipo de Precificação</label>
            <select name="tipo_precificacao" value={formData.tipo_precificacao} onChange={handleChange} className="w-full p-2 border rounded-md text-zinc-700 border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="UNICO">Preço por Unidade</option>
              <option value="M2">Preço por m²</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Preço de Venda (R$)</label>
              <input name="preco" type="number" step="0.01" value={formData.preco} onChange={handleChange} placeholder="Ex: 15.50" className="w-full p-2 border rounded-md text-zinc-700 border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Custo de Produção (R$)</label>
              <input name="custo" type="number" step="0.01" value={formData.custo} onChange={handleChange} placeholder="Ex: 7.25" className="w-full p-2 border rounded-md text-zinc-700 border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Estoque Atual</label>
              <input name="estoque_atual" type="number" value={formData.estoque_atual} onChange={handleChange} className="w-full p-2 border rounded-md text-zinc-700 border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Estoque Mínimo (Alerta)</label>
              <input name="estoque_minimo" type="number" value={formData.estoque_minimo} onChange={handleChange} className="w-full p-2 border rounded-md text-zinc-700 border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          
          <div className="flex items-center justify-end gap-4 pt-4 border-t mt-6">
            <button type="button" onClick={onClose} className="bg-white text-gray-800 font-bold py-2 px-6 rounded-lg hover:bg-gray-100 border">
              Cancelar
            </button>
            <button type="submit" disabled={isLoading} className="bg-blue-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-blue-700 disabled:bg-blue-300">
              {isLoading ? 'Salvando...' : (productToEdit ? 'Salvar Alterações' : 'Adicionar Produto')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}