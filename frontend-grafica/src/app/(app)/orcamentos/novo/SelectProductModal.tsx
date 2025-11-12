// src/app/(app)/orcamentos/novo/SelectProductModal.tsx

"use client";

import { useState, useEffect } from "react";
import { Produto } from "@/types";
import { api } from "@/lib/api";
import { Plus, Search, X, Check } from "lucide-react";

type SelectProductModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onAddProduct: (produto: Produto) => void;
  // A prop onAddCustomProduct não é mais necessária aqui
  addedProductIds: (number | string)[];
};

export default function SelectProductModal({ isOpen, onClose, onAddProduct, addedProductIds }: SelectProductModalProps) {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (isOpen) {
      const fetchProdutos = async () => {
        try {
          // Esta chamada usa nossa instância 'api' que já anexa o token
          const response = await api.get('/produtos/'); 
          setProdutos(response.data.results || response.data);
        } catch (error) {
          console.error("Erro ao buscar produtos", error);
        }
      };
      fetchProdutos();
    }
}, [isOpen]);

  const filteredProdutos = produtos.filter(p => 
    p.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl h-[90vh] flex flex-col">
        <header className="p-4 border-b flex justify-between items-center">
          <h2 className="text-lg font-semibold text-zinc-800">Selecionar produtos</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800"><X size={24} /></button>
        </header>
        
        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input 
              type="text" 
              placeholder="Buscar um produto ou serviço"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full border rounded-lg py-2 pl-10 pr-4"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <table className="min-w-full text-sm">
            <thead className="sticky top-0 bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left font-medium text-zinc-600">Nome do Produto</th>
                <th className="px-6 py-3 text-left font-medium text-zinc-600">Preço</th>
                <th className="px-6 py-3 text-left font-medium text-zinc-600">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredProdutos.map(produto => {
                const isAdded = addedProductIds.includes(produto.id);
                return (
                  <tr key={produto.id} className="hover:bg-gray-50">
                    <td className="px-6 py-3 font-medium text-zinc-800">{produto.nome}</td>
                    <td className="px-6 py-3 text-zinc-600">R$ {parseFloat(produto.preco).toFixed(2)}</td>
                    <td className="px-6 py-3">
                      <button 
                        onClick={() => onAddProduct(produto)} 
                        disabled={isAdded}
                        className={`p-1.5 rounded-full transition-colors ${isAdded ? 'bg-green-100 text-green-600 cursor-not-allowed' : 'bg-blue-100 text-blue-600 hover:bg-blue-200'}`}
                      >
                        {isAdded ? <Check size={16} /> : <Plus size={16} />}
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {/* O rodapé com o botão foi removido daqui */}
      </div>
    </div>
  );
}