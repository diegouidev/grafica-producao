// src/app/(app)/orcamentos/novo/page.tsx

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Cliente, Produto } from "@/types";
import { api } from "@/lib/api";
import PageHeader from "@/components/layout/PageHeader";
import { Plus, ArrowLeft, Trash2, Save, Square, FileText } from "lucide-react";
import SelectProductModal from "./SelectProductModal";
import AddMetricProductModal from "./AddMetricProductModal";
import DescribeProductModal from "./DescribeProductModal";
import { toast } from "react-toastify";

// Definindo um tipo mais específico para os itens do carrinho
type CartItem = {
  id: number | string;
  produto_id?: number | null; // ID real do produto (ou ausente/null para item manual)
  produto: { nome: string };
  quantidade: number;
  preco: string; // preço unitário exibido na tabela
  total: string; // total (preço final do item = preco * quantidade)
  largura?: number;
  altura?: number;
  descricao_customizada?: string;
};

export default function NovoOrcamentoPage() {
  const router = useRouter();
  
  // Estados para os dados
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [itens, setItens] = useState<CartItem[]>([]);
  
  // Estados do formulário principal
  const [selectedCliente, setSelectedCliente] = useState<string>("");
  const [status, setStatus] = useState("Em Aberto");
  const [validade, setValidade] = useState("");
  const [observacao, setObservacao] = useState("");
  
  // Estados do resumo financeiro
  const [desconto, setDesconto] = useState<number>(0);
  const [frete, setFrete] = useState<number>(0);
  
  // Estados de controle dos modais
  const [isSelectProductModalOpen, setIsSelectProductModalOpen] = useState(false);
  const [isDescribeModalOpen, setIsDescribeModalOpen] = useState(false);
  const [isMetricModalOpen, setIsMetricModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchClientes = async () => {
      try {
        const response = await api.get("/clientes/");
        setClientes(response.data.results || response.data);
      } catch (error) {
        console.error("Erro ao buscar clientes", error);
      }
    };
    fetchClientes();
  }, []);

  const handleAddProduct = (produto: Produto) => {
    const unit = parseFloat(String(produto.preco) ?? "0") || 0;
    const newItem: CartItem = {
      id: produto.id,
      produto_id: produto.id,
      produto: { nome: produto.nome },
      quantidade: 1,
      preco: unit.toFixed(2),
      total: unit.toFixed(2),
    };
    setItens((prevItens) => [...prevItens, newItem]);
  };

  const handleAddCustomProduct = (customItem: any) => {
    setItens((prevItens) => [...prevItens, customItem]);
    setIsMetricModalOpen(false);
  };

  const handleRemoveItem = (itemId: number | string) => {
    setItens((prevItens) => prevItens.filter((item) => item.id !== itemId));
  };

  const handleQuantityChange = (itemId: number | string, newQuantity: number) => {
    const quantity = Math.max(1, newQuantity || 1);
    setItens((prevItens) =>
      prevItens.map((item) => {
        if (item.id === itemId) {
          const unit = parseFloat(item.preco) || 0;
          const newTotal = (unit * quantity).toFixed(2);
          return { ...item, quantidade: quantity, total: newTotal };
        }
        return item;
      })
    );
  };

  // Item MANUAL: não define produto_id, envia descricao_customizada e subtotal (total do item)
  const handleDescribeProduct = (describedItem: { descricao_customizada: string; preco: string; quantidade: number }) => {
    const totalNumber = parseFloat(describedItem.preco) || 0;
    const qty = Math.max(1, describedItem.quantidade || 1);
    const unit = qty > 0 ? totalNumber / qty : totalNumber;

    const newItem: CartItem = {
      id: `manual-${Date.now()}`,
      // produto_id AUSENTE → backend entende como item manual
      produto: { nome: describedItem.descricao_customizada },
      quantidade: qty,
      preco: unit.toFixed(2),       // unitário só para exibição/edição de quantidade
      total: totalNumber.toFixed(2),// subtotal que vamos enviar ao backend
      descricao_customizada: describedItem.descricao_customizada,
    };
    setItens((prevItens) => [...prevItens, newItem]);
  };

  const handleSaveOrcamento = async () => {
    if (!selectedCliente) {
      setError("Por favor, selecione um cliente.");
      return;
    }
    if (itens.length === 0) {
      setError("Adicione pelo menos um item ao orçamento.");
      return;
    }
    setIsLoading(true);
    setError(null);

    // Calcula os valores finais de frete e desconto
    const subtotal = itens.reduce((acc, item) => acc + (parseFloat(item.total) || 0), 0);
    const valorDescontoCalculado = subtotal * (desconto / 100);

    // Monta o payload com os nomes de campo que o backend espera
    const payload = {
      cliente_id: selectedCliente,
      status,
      

      valor_frete: frete.toFixed(2),
      valor_desconto: valorDescontoCalculado.toFixed(2),

      data_validade: validade || null, 

      itens_write: itens.map((item) => ({
        produto: item.produto_id ?? null,
        quantidade: item.quantidade,
        largura: item.largura ?? null,
        altura: item.altura ?? null,
        descricao_customizada: item.descricao_customizada ?? null,
        subtotal: item.total, // o backend usa 'subtotal' como total do item
      })),
    };

    try {
      await api.post("/orcamentos/", payload);
      toast.success("Orçamento criado com sucesso!");
      router.push("/orcamentos");
    } catch (err: any) {
      console.error("Erro ao salvar orçamento:", err);
      const errorMsg = err.response?.data ? JSON.stringify(err.response.data) : "Falha ao salvar. Verifique os dados.";
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const subtotal = itens.reduce((acc, item) => acc + (parseFloat(item.total) || 0), 0);
  const valorDesconto = subtotal * (desconto / 100);
  const total = subtotal - valorDesconto + frete;
  const addedProductIds = itens.map((item) => item.id);

  return (
    <>
      <SelectProductModal
        isOpen={isSelectProductModalOpen}
        onClose={() => setIsSelectProductModalOpen(false)}
        onAddProduct={handleAddProduct}
        addedProductIds={addedProductIds}
      />
      <AddMetricProductModal
        isOpen={isMetricModalOpen}
        onClose={() => setIsMetricModalOpen(false)}
        onAdd={handleAddCustomProduct}
      />

      <DescribeProductModal
        isOpen={isDescribeModalOpen}
        onClose={() => setIsDescribeModalOpen(false)}
        onAdd={handleDescribeProduct}
      />
      
      <PageHeader title="Orçamentos" />
      
      <div className="bg-white p-4 rounded-lg shadow-md mb-6 flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2 text-zinc-800">
          <span className="bg-blue-100 p-2 rounded-full">📄</span> Novo Orçamento
        </h2>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setIsMetricModalOpen(true)}
            className="flex items-center gap-2 text-zinc-600 hover:text-blue-600 transition-colors text-sm font-medium"
          >
            <Square size={16} /> Produto por Metro²
          </button>
          <button
            onClick={() => setIsDescribeModalOpen(true)}
            className="flex items-center gap-2 text-zinc-600 hover:text-blue-600 transition-colors text-sm font-medium"
          >
            <FileText size={16} /> Descrever Produto
          </button>
          <button
            onClick={() => router.back()}
            className="bg-white text-zinc-800 font-bold py-2 px-4 rounded-lg border hover:bg-gray-100 flex items-center gap-2"
          >
            <ArrowLeft size={18} /> Voltar
          </button>
          <button
            onClick={() => setIsSelectProductModalOpen(true)}
            className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2 hover:bg-blue-700"
          >
            <Plus size={18} /> Selecionar Produtos
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4 text-zinc-800">Itens do Orçamento</h3>
          {itens.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-3xl">🛒</p>
              <p className="font-semibold mt-2 text-zinc-800">Seu carrinho está vazio.</p>
              <p className="text-sm text-zinc-500">Clique em "Selecionar Produtos" para adicionar itens.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="py-2 text-left font-medium text-zinc-500">Produto</th>
                    <th className="py-2 text-left font-medium text-zinc-500">Preço</th>
                    <th className="w-24 py-2 text-left font-medium text-zinc-500">Qtd.</th>
                    <th className="py-2 text-left font-medium text-zinc-500">Total</th>
                    <th className="py-2 text-left font-medium text-zinc-500"></th>
                  </tr>
                </thead>
                <tbody>
                  {itens.map((item) => (
                    <tr key={item.id} className="border-b">
                      <td className="py-3 font-medium text-zinc-800">
                        {item.produto.nome}
                      </td>
                      <td className="py-3 text-zinc-600">R$ {(parseFloat(item.preco) || 0).toFixed(2)}</td>
                      <td className="py-3">
                        <input
                          type="number"
                          value={item.quantidade}
                          onChange={(e) => handleQuantityChange(item.id, parseInt(e.target.value) || 1)}
                          className="w-16 text-zinc-600 rounded-md border p-1 text-center"
                          min="1"
                        />
                      </td>
                      <td className="py-3 font-medium text-zinc-800">R$ {(parseFloat(item.total) || 0).toFixed(2)}</td>
                      <td className="py-3">
                        <button
                          onClick={() => handleRemoveItem(item.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        <div className="lg:col-span-1 bg-white p-6 rounded-lg shadow-md h-fit">
          <h3 className="text-lg font-semibold mb-4 text-zinc-800">Resumo do Orçamento</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between items-center text-zinc-600">
              <span>Subtotal:</span>
              <span className="font-medium text-zinc-800">R$ {subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center text-zinc-600">
              <span>Desconto:</span>
              <div className="flex gap-1">
                <input
                  type="number"
                  value={desconto}
                  onChange={(e) => setDesconto(parseFloat(e.target.value) || 0)}
                  className="w-16 border rounded-md p-1 text-right"
                />
                <span>%</span>
              </div>
            </div>
            <div className="flex justify-between items-center text-zinc-600">
              <span>Frete:</span>
              <input
                type="number"
                value={frete}
                onChange={(e) => setFrete(parseFloat(e.target.value) || 0)}
                className="w-24 border rounded-md p-1 text-right"
                placeholder="R$ 0,00"
              />
            </div>
            <div className="border-t pt-3 flex justify-between font-bold text-lg text-zinc-800">
              <span>Total:</span>
              <span>R$ {total.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-red-500 text-xs">
              <span>Valor de Desconto:</span>
              <span>- R$ {valorDesconto.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold mb-4 text-zinc-800">Dados do Orçamento</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1">
            <label className="block text-sm font-medium text-zinc-600 mb-1">Cliente</label>
            <select
              value={selectedCliente}
              onChange={(e) => setSelectedCliente(e.target.value)}
              className="w-full text-zinc-600 border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Selecione um cliente</option>
              {clientes.map((cliente) => (
                <option key={cliente.id} value={cliente.id}>
                  {cliente.nome}
                </option>
              ))}
            </select>
          </div>
          <div className="md:col-span-1">
            <label className="block text-sm font-medium text-zinc-600 mb-1">Status do Orçamento</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full text-zinc-600 border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option>Em Aberto</option>
              <option>Aprovado</option>
              <option>Rejeitado</option>
            </select>
          </div>
          <div className="md:col-span-1">
            <label className="block text-sm font-medium text-zinc-600 mb-1">Validade do Orçamento</label>
            <input
              type="date"
              value={validade}
              onChange={(e) => setValidade(e.target.value)}
              className="w-full text-zinc-600 border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium text-zinc-600 mb-1">Observação do Orçamento</label>
          <textarea
            value={observacao}
            onChange={(e) => setObservacao(e.target.value)}
            className="w-full text-zinc-600 border border-gray-300 rounded-md p-2"
            rows={4}
          ></textarea>
        </div>
      </div>
      
      {error && <div className="mt-4 text-center text-red-500">{error}</div>}

      <div className="mt-6 flex justify-end gap-4">
        <button
          onClick={() => router.back()}
          className="bg-gray-200 text-zinc-800 font-bold py-2 px-6 rounded-lg hover:bg-gray-300"
        >
          Voltar
        </button>
        <button
          onClick={handleSaveOrcamento}
          disabled={isLoading}
          className="bg-green-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-green-700 disabled:bg-green-400 flex items-center gap-2"
        >
          <Save size={18} />
          {isLoading ? "Salvando..." : "Salvar Orçamento"}
        </button>
      </div>
    </>
  );
}
