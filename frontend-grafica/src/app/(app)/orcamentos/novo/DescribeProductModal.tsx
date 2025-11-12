// src/app/(app)/orcamentos/novo/DescribeProductModal.tsx

"use client";

import { useState, FormEvent, useEffect } from "react";
import { toast } from "react-toastify";

type DescribeProductModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (item: { descricao_customizada: string; preco: string; quantidade: number }) => void;
};

export default function DescribeProductModal({ isOpen, onClose, onAdd }: DescribeProductModalProps) {
  const [descricao, setDescricao] = useState("");
  const [preco, setPreco] = useState("");
  const [quantidade, setQuantidade] = useState(1);

  useEffect(() => {
    // Limpa o formulário quando o modal é aberto
    if (isOpen) {
      setDescricao("");
      setPreco("");
      setQuantidade(1);
    }
  }, [isOpen]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const valorNumerico = parseFloat(preco);
    if (!descricao || isNaN(valorNumerico) || valorNumerico <= 0) {
      toast.error("Por favor, preencha a descrição e um preço válido.");
      return;
    }
    if (!quantidade || quantidade < 1) {
      toast.error("Quantidade deve ser pelo menos 1.");
      return;
    }

    // Aqui 'preco' representa o PREÇO TOTAL do item (subtotal)
    const newItem = {
      descricao_customizada: descricao,
      preco: valorNumerico.toFixed(2), // total do item
      quantidade: quantidade,
    };
    onAdd(newItem);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center">
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-xl w-full max-w-lg">
        <h2 className="text-xl text-zinc-800 font-bold mb-4">Descrever Produto</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Descrição do Produto/Serviço</label>
            <input
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              className="w-full text-zinc-600 border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Quantidade</label>
              <input
                type="number"
                value={quantidade}
                onChange={(e) => setQuantidade(Number(e.target.value) || 1)}
                min="1"
                className="w-full text-zinc-600 border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Preço Total (R$)</label>
              <input
                type="number"
                step="0.01"
                value={preco}
                onChange={(e) => setPreco(e.target.value)}
                placeholder="Ex: 50.00"
                className="w-full text-zinc-600 border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3 pt-4 border-t mt-6">
          <button
            type="button"
            onClick={onClose}
            className="bg-white text-gray-700 font-bold py-2 px-4 rounded-lg border hover:bg-gray-100"
          >
            Cancelar
          </button>
          <button type="submit" className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700">
            Adicionar ao Carrinho
          </button>
        </div>
      </form>
    </div>
  );
}
