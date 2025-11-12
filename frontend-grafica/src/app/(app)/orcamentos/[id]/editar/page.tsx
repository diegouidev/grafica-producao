// diegouidev/frontend-grafica/frontend-grafica-b318a2e5ae2688e371728c27479b389149866698/src/app/(app)/orcamentos/[id]/editar/page.tsx
// (Arquivo Corrigido)

"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { Cliente, Produto, Orcamento } from "@/types"; // Importar Orcamento
import { api } from "@/lib/api";
import PageHeader from "@/components/layout/PageHeader";
import { Plus, ArrowLeft, Trash2, Save, Square, FileText } from "lucide-react";
import SelectProductModal from "../../novo/SelectProductModal";
import AddMetricProductModal from "../../novo/AddMetricProductModal";
import DescribeProductModal from "../../novo/DescribeProductModal";
import { toast } from "react-toastify";

type CartItem = {
  id: number | string;
  produto_id?: number | null;
  produto: { nome: string } | null; // null quando item manual
  quantidade: number;
  subtotal: string;                 // total do item
  largura?: number | null;
  altura?: number | null;
  descricao_customizada?: string | null; // usado em itens manuais
};

const formatCurrency = (value: string | number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value));

export default function EditarOrcamentoPage() {
  const router = useRouter();
  const params = useParams();
  const orcamentoId = params.id as string;

  // Estados dos dados
  const [itens, setItens] = useState<CartItem[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  
  // Estados do formulário
  const [selectedCliente, setSelectedCliente] = useState<string>("");
  const [status, setStatus] = useState("");
  const [validade, setValidade] = useState("");
  const [observacao, setObservacao] = useState("");
  
  // --- ESTADOS FINANCEIROS ATUALIZADOS ---
  const [descontoPercent, setDescontoPercent] = useState<number>(0); // Para o input de %
  const [valorDescontoCarregado, setValorDescontoCarregado] = useState<number>(0); // Valor vindo da API
  const [frete, setFrete] = useState<number>(0);
  // ---------------------------------------
  
  // Estados de controle
  const [isSelectProductModalOpen, setIsSelectProductModalOpen] = useState(false);
  const [isMetricModalOpen, setIsMetricModalOpen] = useState(false);
  const [isDescribeModalOpen, setIsDescribeModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // --- fetchOrcamentoData ATUALIZADO COM A CORREÇÃO ---
  const fetchOrcamentoData = useCallback(async () => {
    if (!orcamentoId) return;
    setIsLoading(true);
    try {
      const [orcamentoResponse, clientesResponse] = await Promise.all([
        api.get(`/orcamentos/${orcamentoId}/`),
        api.get("/clientes/"),
      ]);

      const orcamento: Orcamento = orcamentoResponse.data; // Usar o Type
      setClientes(clientesResponse.data.results || clientesResponse.data);

      const mapped: CartItem[] = (orcamento.itens || []).map((item: any) => {
        
        // --- ESTA É A LINHA QUE FALTAVA ---
        const produto = item.produto ?? null; 
        // -----------------------------------

        const isManual = !produto;
        
        return {
          id: item.id,
          produto_id: produto ? produto.id : null,
          produto: produto ? { nome: produto.nome } : { nome: item.descricao_customizada || "Item manual" },
          quantidade: Number(item.quantidade || 1),
          subtotal: String(item.subtotal ?? "0"),
          largura: item.largura ?? null,
          altura: item.altura ?? null,
          descricao_customizada: isManual ? (item.descricao_customizada ?? null) : null,
        };
      });

      setItens(mapped);
      setSelectedCliente(String(orcamento.cliente?.id || ""));
      setStatus(orcamento.status || "Em Aberto");

      setFrete(Number(orcamento.valor_frete) || 0);
      setValorDescontoCarregado(Number(orcamento.valor_desconto) || 0);
      setDescontoPercent(0); // Reseta o campo de percentual
      setValidade(orcamento.data_validade || "");
      

      setError(null);
    } catch (err) {
      console.error("Erro ao carregar dados:", err);
      setError("Não foi possível carregar os dados do orçamento.");
    } finally {
      setIsLoading(false);
    }
  }, [orcamentoId]);
  // --- FIM DA ATUALIZAÇÃO ---

  useEffect(() => {
    fetchOrcamentoData();
  }, [fetchOrcamentoData]);

  // Handlers de itens
  const handleAddProduct = (produto: Produto) => {
    const unit = parseFloat(String(produto.preco) ?? "0") || 0;
    const newItem: CartItem = {
      id: `p-${produto.id}-${Date.now()}`,
      produto_id: produto.id,
      produto: { nome: produto.nome },
      quantidade: 1,
      subtotal: unit.toFixed(2),
    };
    setItens((prev) => [...prev, newItem]);
  };

  const handleAddCustomProduct = (customItem: any) => {
    const newItem: CartItem = {
      id: `m2-${Date.now()}`,
      produto_id: customItem.produto_id ?? null,
      produto: { nome: customItem.produto?.nome || customItem.descricao_customizada || "Item" },
      quantidade: customItem.quantidade ?? 1,
      subtotal: String(customItem.total ?? customItem.subtotal ?? "0"),
      largura: customItem.largura ?? null,
      altura: customItem.altura ?? null,
      descricao_customizada: customItem.descricao_customizada ?? null,
    };
    setItens((prev) => [...prev, newItem]);
    setIsMetricModalOpen(false);
  };

  const handleDescribeProduct = (described: { descricao_customizada: string; preco: string; quantidade: number }) => {
    const totalNumber = parseFloat(described.preco) || 0;
    const qty = Math.max(1, described.quantidade || 1);
    const newItem: CartItem = {
      id: `manual-${Date.now()}`,
      produto_id: null, 
      produto: { nome: described.descricao_customizada },
      quantidade: qty,
      subtotal: totalNumber.toFixed(2), 
      descricao_customizada: described.descricao_customizada,
      largura: null,
      altura: null,
    };
    setItens((prev) => [...prev, newItem]);
    setIsDescribeModalOpen(false);
  };

  const handleRemoveItem = (itemId: number | string) => {
    setItens((prev) => prev.filter((i) => i.id !== itemId));
  };

  const handleQuantityChange = (itemId: number | string, newQuantity: number) => {
    const quantity = Math.max(1, newQuantity || 1);
    setItens((prev) =>
      prev.map((item) => {
        if (item.id === itemId) {
          const currentSubtotal = parseFloat(item.subtotal) || 0;
          const currentQty = Math.max(1, item.quantidade || 1);
          const unit = currentSubtotal / currentQty;
          const newSubtotal = (unit * quantity).toFixed(2);
          return { ...item, quantidade: quantity, subtotal: newSubtotal };
        }
        return item;
      })
    );
  };
  
  // --- CÁLCULO DE TOTAIS ATUALIZADO ---
  const subtotal = itens.reduce((acc, item) => acc + (parseFloat(item.subtotal) || 0), 0);
  const valorDescontoPercentual = subtotal * (descontoPercent / 100);
  const valorDescontoFinal = descontoPercent > 0 ? valorDescontoPercentual : valorDescontoCarregado;
  const total = subtotal - valorDescontoFinal + frete;
  // ------------------------------------

  // --- handleUpdateOrcamento ATUALIZADO (Bug e UX) ---
  const handleUpdateOrcamento = async () => {
    if (!selectedCliente) { setError("Por favor, selecione um cliente."); return; }
    if (itens.length === 0) { setError("Adicione pelo menos um item ao orçamento."); return; }

    setIsSaving(true);
    setError(null);

    const payload = {
      cliente_id: selectedCliente,
      status, // Envia o status selecionado (Ex: "Aprovado")
      valor_frete: frete.toFixed(2),
      valor_desconto: valorDescontoFinal.toFixed(2),
      data_validade: validade || null,
      itens_write: itens.map((item) => ({
        produto: item.produto_id ?? null,
        quantidade: item.quantidade,
        largura: item.largura ?? null,
        altura: item.altura ?? null,
        descricao_customizada: item.produto_id ? null : (item.descricao_customizada ?? item.produto?.nome ?? null),
        subtotal: item.subtotal,
      })),
    };

    try {
      // A mágica acontece no backend:
      // O backend.update() vai ver que status="Aprovado" e chamar a conversão.
      await api.put(`/orcamentos/${orcamentoId}/`, payload);
      
      // --- CORREÇÃO DE UX ---
      if (status === 'Aprovado') {
        toast.success("Orçamento aprovado e convertido em pedido!");
        router.push("/pedidos"); // Redireciona para a lista de Pedidos
      } else {
        toast.success("Orçamento atualizado com sucesso!");
        router.push("/orcamentos"); // Comportamento antigo
      }
      // ----------------------
      
      router.refresh();
    } catch (err: any) {
      console.error("Erro ao atualizar orçamento:", err?.response?.data || err);
      setError("Falha ao atualizar o orçamento. Verifique os dados.");
    } finally {
      setIsSaving(false);
    }
  };
  // --- FIM DA ATUALIZAÇÃO ---

  const addedProductIds = itens.map((item) => String(item.produto_id ?? item.id));

  if (isLoading) return <div className="p-8 text-center">Carregando dados do orçamento...</div>;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;

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
          <span className="bg-blue-100 p-2 rounded-full">📄</span> Editar Orçamento #{orcamentoId}
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
          {itens.length > 0 ? (
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
                        {item.produto?.nome || item.descricao_customizada || "Item manual"}
                      </td>
                      <td className="py-3 text-zinc-600">
                        {formatCurrency(
                          item.quantidade > 0
                            ? (parseFloat(item.subtotal) || 0) / item.quantidade
                            : 0
                        )}
                      </td>
                      <td className="py-3">
                        <input
                          type="number"
                          value={item.quantidade}
                          onChange={(e) => handleQuantityChange(item.id, parseInt(e.target.value) || 1)}
                          className="w-16 rounded-md border border-gray-300 text-zinc-600 p-1 text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                          min="1"
                        />
                      </td>
                      <td className="py-3 font-medium text-zinc-800">
                        {formatCurrency(item.subtotal)}
                      </td>
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
          ) : (
            <p className="text-zinc-500 py-10 text-center">Nenhum item adicionado a este orçamento.</p>
          )}
        </div>

        {/* --- Resumo do Orçamento ATUALIZADO --- */}
        <div className="lg:col-span-1 bg-white p-6 rounded-lg shadow-md h-fit">
          <h3 className="text-lg font-semibold mb-4 text-zinc-800">Resumo do Orçamento</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between items-center text-zinc-600">
              <span>Subtotal:</span>
              <span className="font-medium text-zinc-800">{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between items-center text-zinc-600">
              <span>Desconto (%):</span>
              <div className="flex gap-1">
                <input
                  type="number"
                  value={descontoPercent} // Usa o estado de percentual
                  onChange={(e) => setDescontoPercent(parseFloat(e.target.value) || 0)}
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
              <span>{formatCurrency(total)}</span>
            </div>
            <div className="flex justify-between text-red-500 text-xs">
              <span>Valor de Desconto:</span>
              <span>- {formatCurrency(valorDescontoFinal)}</span> 
            </div>
          </div>
        </div>
        {/* --- FIM DA ATUALIZAÇÃO --- */}
      </div>

      <div className="mt-6 bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold mb-4 text-zinc-800">Dados do Orçamento</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1">
            <label className="block text-sm font-medium text-zinc-600 mb-1">Cliente</label>
            <select
              value={selectedCliente}
              onChange={(e) => setSelectedCliente(e.target.value)}
              className="w-full text-zinc-500 border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Selecione um cliente</option>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
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
            className="w-full text-zinc-600 border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
          onClick={handleUpdateOrcamento}
          disabled={isSaving}
          className="bg-green-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-green-700 flex items-center gap-2"
        >
          <Save size={18} />
          {isSaving ? "Salvando..." : "Salvar Alterações"}
        </button>
      </div>
    </>
  );
}