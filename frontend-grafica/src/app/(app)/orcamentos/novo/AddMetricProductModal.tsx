// src/app/(app)/orcamentos/novo/AddMetricProductModal.tsx

"use client";

import { useState, useEffect } from 'react';
import { Produto } from '@/types';
import { api } from '@/lib/api';

type AddMetricProductModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (item: any) => void;
};

export default function AddMetricProductModal({ isOpen, onClose, onAdd }: AddMetricProductModalProps) {
  const [selectedProduct, setSelectedProduct] = useState<Produto | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [largura, setLargura] = useState('');
  const [altura, setAltura] = useState('');
  const [quantidade, setQuantidade] = useState(1);
  const [precoM2, setPrecoM2] = useState('');
  
  const [sugestoes, setSugestoes] = useState<Produto[]>([]);
  const [todosProdutosM2, setTodosProdutosM2] = useState<Produto[]>([]);

  const [totalM2, setTotalM2] = useState(0);
  const [precoVenda, setPrecoVenda] = useState(0);

  // Limpa o estado inteiro quando o modal é fechado ou aberto
  useEffect(() => {
    if (!isOpen) {
      setSearchTerm(''); setLargura(''); setAltura(''); setQuantidade(1);
      setPrecoM2(''); setSelectedProduct(null); setSugestoes([]);
    } else {
      const fetchMetricProducts = async () => {
        try {
          const response = await api.get('/produtos/?tipo_precificacao=M2');
          setTodosProdutosM2(response.data.results || response.data);
        } catch (error) { console.error("Erro ao buscar produtos por m²:", error); }
      };
      fetchMetricProducts();
    }
  }, [isOpen]);

  // Filtra as sugestões
  useEffect(() => {
    if (searchTerm) {
      const filtered = todosProdutosM2.filter(p => p.nome.toLowerCase().includes(searchTerm.toLowerCase()));
      setSugestoes(filtered);
    } else {
      setSugestoes([]);
    }
  }, [searchTerm, todosProdutosM2]);
  
  // Recalcula os totais
  useEffect(() => {
    const l = parseFloat(largura) || 0;
    const a = parseFloat(altura) || 0;
    const p = parseFloat(precoM2) || 0;
    const q = Number(quantidade) || 0;
    const areaTotal = l * a;
    setTotalM2(areaTotal);
    setPrecoVenda(areaTotal * p * q);
  }, [largura, altura, quantidade, precoM2]);
  
  const handleSuggestionClick = (produto: Produto) => {
    setSelectedProduct(produto);
    setSearchTerm(produto.nome); // Preenche o input com o nome completo
    setPrecoM2(produto.preco);
    setSugestoes([]);
  };

  const handleSubmit = () => {
    // A VALIDAÇÃO CRUCIAL: Só permite adicionar se um produto do catálogo foi selecionado
    if (!selectedProduct) {
      alert("Por favor, selecione um produto da lista de sugestões.");
      return;
    }

    const newItem = {
      id: `custom-${Date.now()}`,
      produto_id: selectedProduct.id, // Garante que o ID do produto é enviado
      produto: { nome: `${selectedProduct.nome} (${largura}x${altura}m)` }, // Nome customizado
      quantidade,
      preco: (totalM2 * parseFloat(precoM2)).toFixed(2),
      total: precoVenda.toFixed(2),
      largura: parseFloat(largura),
      altura: parseFloat(altura),
    };
    onAdd(newItem);
    onClose();
  };
  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-2xl">
        <h2 className="text-xl font-bold text-zinc-900 mb-4">Adicionar produto por Metro²</h2>
        <div className="space-y-4 text-sm">
          <div className="relative">
            <label className="block font-medium text-zinc-600 mb-1">Buscar Produto por m²</label>
            <input 
              type="text" 
              value={searchTerm} 
              onChange={e => setSearchTerm(e.target.value)} 
              placeholder="Digite para buscar..."
              className="w-full p-2 border rounded-md text-zinc-700 border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {sugestoes.length > 0 && (
              <div className="absolute z-10 w-full bg-white text-zinc-600 rounded-md mt-1 max-h-40 overflow-y-auto shadow-lg">
                {sugestoes.map(sugestao => (
                  <div key={sugestao.id} onClick={() => handleSuggestionClick(sugestao)} className="p-2 border border-zinc-500 hover:bg-gray-100 cursor-pointer">
                    {sugestao.nome}
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block font-medium text-zinc-600 mb-1">Largura (m)</label>
              <input type="number" value={largura} onChange={e => setLargura(e.target.value)} className="w-full p-2 border rounded-md text-zinc-700 border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"/>
            </div>
            <div>
              <label className="block font-medium text-zinc-600 mb-1">Altura (m)</label>
              <input type="number" value={altura} onChange={e => setAltura(e.target.value)} className="w-full p-2 border rounded-md text-zinc-700 border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"/>
            </div>
            <div>
              <label className="block font-medium text-zinc-600 mb-1">Total (m²)</label>
              <input type="text" value={totalM2.toFixed(2)} readOnly className="w-full text-zinc-600 border rounded-md p-2 bg-gray-100"/>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block font-medium text-zinc-600 mb-1">Quantidade</label>
              <input type="number" value={quantidade} onChange={e => setQuantidade(Number(e.target.value))} className="w-full p-2 border rounded-md text-zinc-700 border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"/>
            </div>
            <div>
              <label className="block font-medium text-zinc-600 mb-1">Preço do m²</label>
              <input type="number" value={precoM2} readOnly className="w-full text-zinc-500 border rounded-md p-2 bg-gray-100" />
            </div>
            <div>
              <label className="block font-medium text-zinc-600 mb-1">Preço de Venda</label>
              <input type="text" value={`R$ ${precoVenda.toFixed(2)}`} readOnly className="w-full border rounded-md p-2 bg-gray-100 font-bold text-zinc-800"/>
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-4 mt-6">
          <button onClick={onClose} className="bg-white text-zinc-800 font-bold py-2 px-6 rounded-lg border hover:bg-gray-100">
            Fechar
          </button>
          <button onClick={handleSubmit} className="bg-blue-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-blue-700">
            Adicionar ao Carrinho
          </button>
        </div>
      </div>
    </div>
  );
}