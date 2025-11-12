// src/app/(app)/pedidos/[id]/editar/page.tsx
// (Arquivo Modificado)

"use client";

import { useState, useEffect, useCallback, ChangeEvent, FormEvent } from "react"; 
import { useRouter, useParams } from "next/navigation";
import { Cliente, Produto, Pedido, ArtePedido, Fornecedor, CustoFornecedorPedido } from "@/types"; 
import { api } from "@/lib/api";
import PageHeader from "@/components/layout/PageHeader";
import { 
  Plus, ArrowLeft, Trash2, Save, Square, FileText, 
  Image as ImageIcon, UploadCloud, Loader2, FileWarning, 
  DollarSign,
  Printer // <-- 1. IMPORTAR PRINTER
} from "lucide-react";
import SelectProductModal from "@/app/(app)/orcamentos/novo/SelectProductModal";
import AddMetricProductModal from "@/app/(app)/orcamentos/novo/AddMetricProductModal";
import DescribeProductModal from "@/app/(app)/orcamentos/novo/DescribeProductModal";
import { toast } from "react-toastify";
import Image from "next/image";
import ApprovalLink from "./ApprovalLink"; 
import { useAuth } from "@/contexts/AuthContext";
import { handleDownloadPdf } from "@/utils/pdfDownloader"; // <-- 2. IMPORTAR O HELPER DE PDF

// --- 3. ATUALIZAR TIPO CartItem ---
type CartItem = {
  id: number | string;
  produto_id?: number | null;
  produto: { nome: string } | null;
  quantidade: number;
  subtotal: string;
  largura?: number | null;
  altura?: number | null;
  descricao_customizada?: string | null;
  observacoes_producao?: string | null; // <-- ADICIONADO
};

const formatCurrency = (value: string | number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value) || 0);

const statusArteOptions = [
  { value: "PENDENTE", label: "Pendente" },
  { value: "EM_APROVACAO", label: "Em Aprovação" },
  { value: "APROVADO", label: "Aprovado" },
  { value: "REJEITADO", label: "Rejeitado" },
];

export default function EditarPedidoPage() {
  const router = useRouter();
  const params = useParams();
  const pedidoId = params.id as string;

  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();

  // Dados do pedido
  const [pedido, setPedido] = useState<Pedido | null>(null); 
  const [itens, setItens] = useState<CartItem[]>([]);
  
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);

  // Form do pedido
  const [statusProducao, setStatusProducao] = useState("");
  const [statusPagamento, setStatusPagamento] = useState("");
  const [statusArte, setStatusArte] = useState("PENDENTE"); 
  const [previstoEntrega, setPrevistoEntrega] = useState("");
  const [formaEnvio, setFormaEnvio] = useState("");
  const [codigoRastreio, setCodigoRastreio] = useState("");
  
  // Financeiro local (UI)
  const [desconto, setDesconto] = useState<number>(0);
  const [frete, setFrete] = useState<number>(0);

  // UI
  const [activeTab, setActiveTab] = useState('detalhes'); 
  const [isSelectProductModalOpen, setIsSelectProductModalOpen] = useState(false);
  const [isMetricModalOpen, setIsMetricModalOpen] = useState(false);
  const [isDescribeModalOpen, setIsDescribeModalOpen] = useState(false);
  
  const [isLoading, setIsLoading] = useState(true); 
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pagamentos
  const [novoValorEntrada, setNovoValorEntrada] = useState("");
  const [novaFormaPagamento, setNovaFormaPagamento] = useState("PIX");
  const formasDePagamento = [
    { value: "PIX", label: "Pix" },
    { value: "DINHEIRO", label: "Dinheiro" },
    { value: "CARTAO", label: "Cartão" },
    { value: "BOLETO", label: "Boleto" },
  ];

  // Upload de Arte
  const [arteFile, setArteFile] = useState<File | null>(null);
  const [arteComentario, setArteComentario] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  
  // Custos
  const [isAddingCusto, setIsAddingCusto] = useState(false);
  const [novoCustoFornecedorId, setNovoCustoFornecedorId] = useState("");
  const [novoCustoDescricao, setNovoCustoDescricao] = useState("");
  const [novoCustoValor, setNovoCustoValor] = useState("");

  const fetchPedidoData = useCallback(async () => {
    if (!pedidoId || !isAuthenticated) return; 

    setIsLoading(true);
    try {
      const [pedidoResponse, fornecedoresResponse] = await Promise.all([
        api.get(`/pedidos/${pedidoId}/`),
        api.get('/fornecedores/')
      ]);
      
      const pedidoData: Pedido = pedidoResponse.data; 
      setPedido(pedidoData);
      setFornecedores(fornecedoresResponse.data.results || fornecedoresResponse.data);

      // --- 4. ATUALIZAR MAPEAMENTO ---
      const mapped: CartItem[] = (pedidoData.itens || []).map((item: any) => {
        const produto = item.produto ?? null;
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
          observacoes_producao: item.observacoes_producao ?? null, // <-- ADICIONADO
        };
      });
      setItens(mapped);

      // (Restante do fetchPedidoData sem alteração)
      setStatusProducao(pedidoData.status_producao || "");
      setStatusPagamento(pedidoData.status_pagamento || "");
      setStatusArte(pedidoData.status_arte || "PENDENTE"); 
      setPrevistoEntrega(pedidoData.previsto_entrega || "");
      setFormaEnvio(pedidoData.forma_envio || "");
      setCodigoRastreio(pedidoData.codigo_rastreio || "");
      
      setError(null);
    } catch (err) {
      console.error("Erro ao buscar dados:", err);
      setError("Não foi possível carregar os dados do pedido.");
    } finally {
      setIsLoading(false);
    }
  }, [pedidoId, isAuthenticated]);

  useEffect(() => {
    if (!isAuthLoading && isAuthenticated) {
        fetchPedidoData();
    }
  }, [fetchPedidoData, isAuthLoading, isAuthenticated]);

  // Handlers de itens (sem alteração)
  const handleAddProduct = (produto: Produto) => {
    // ...
    const unit = parseFloat(String(produto.preco) ?? "0") || 0;
    const newItem: CartItem = {
      id: `p-${produto.id}-${Date.now()}`,
      produto_id: produto.id,
      produto: { nome: produto.nome },
      quantidade: 1,
      subtotal: unit.toFixed(2),
      observacoes_producao: null, // <-- Default
    };
    setItens((prev) => [...prev, newItem]);
  };
  const handleAddCustomProduct = (customItem: any) => {
    // ...
    const newItem: CartItem = {
      id: `m2-${Date.now()}`,
      produto_id: customItem.produto_id ?? null,
      produto: { nome: customItem.produto?.nome || customItem.descricao_customizada || "Item" },
      quantidade: customItem.quantidade ?? 1,
      subtotal: String(customItem.total ?? customItem.subtotal ?? "0"),
      largura: customItem.largura ?? null,
      altura: customItem.altura ?? null,
      descricao_customizada: customItem.descricao_customizada ?? null,
      observacoes_producao: null, // <-- Default
    };
    setItens((prev) => [...prev, newItem]);
    setIsMetricModalOpen(false);
  };
  const handleDescribeProduct = (described: { descricao_customizada: string; preco: string; quantidade: number }) => {
    // ...
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
      observacoes_producao: null, // <-- Default
    };
    setItens((prev) => [...prev, newItem]);
    setIsDescribeModalOpen(false);
  };
  const handleRemoveItem = (itemId: number | string) => {
    // ...
    setItens((prevItens) => prevItens.filter((item) => item.id !== itemId));
  };
  const handleQuantityChange = (itemId: number | string, newQuantity: number) => {
    // ...
    const quantity = Math.max(1, newQuantity || 1);
    setItens((prevItens) =>
      prevItens.map((item) => {
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
  
  // --- 5. NOVO HANDLER PARA OBSERVAÇÕES ---
  const handleObservacaoChange = (itemId: number | string, newObservacao: string) => {
    setItens((prevItens) =>
      prevItens.map((item) => {
        if (item.id === itemId) {
          return { ...item, observacoes_producao: newObservacao };
        }
        return item;
      })
    );
  };
  // ----------------------------------------

  // --- 6. ATUALIZAR handleUpdatePedido ---
  const handleUpdatePedido = async () => {
    setIsSaving(true);
    setError(null);

    const payload = {
      status_producao: statusProducao,
      status_pagamento: statusPagamento,
      status_arte: statusArte, 
      previsto_entrega: previstoEntrega || null,
      forma_envio: formaEnvio || null,
      codigo_rastreio: codigoRastreio || null,
      itens_write: itens.map((item) => ({
        produto: item.produto_id ?? null,
        quantidade: item.quantidade,
        largura: item.largura ?? null,
        altura: item.altura ?? null,
        descricao_customizada: item.produto_id ? null : (item.descricao_customizada ?? item.produto?.nome ?? null),
        subtotal: item.subtotal,
        observacoes_producao: item.observacoes_producao ?? null, // <-- ENVIAR CAMPO
      })),
    };

    try {
      await api.put(`/pedidos/${pedidoId}/`, payload);
      toast.success("Pedido atualizado com sucesso!");
      fetchPedidoData(); 
    } catch (err: any) {
      console.error("Erro ao atualizar pedido:", err?.response?.data || err);
      const errorMsg = err?.response?.data ? JSON.stringify(err.response.data) : "Falha ao atualizar o pedido.";
      setError(errorMsg);
      toast.error("Falha ao atualizar o pedido.");
    } finally {
      setIsSaving(false);
    }
  };

  // Handler de Pagamento (sem alteração)
  const handleAddPagamento = async () => {
    // ...
    if (!novoValorEntrada || parseFloat(novoValorEntrada) <= 0) {
      toast.error("Por favor, insira um valor de entrada válido.");
      return;
    }
    setIsSaving(true);
    try {
      await api.post("/pagamentos/", {
        pedido: pedidoId,
        valor: novoValorEntrada,
        forma_pagamento: novaFormaPagamento,
      });
      setNovoValorEntrada("");
      fetchPedidoData();
      toast.success("Pagamento lançado!");
    } catch (error) {
      console.error("Erro ao adicionar pagamento:", error);
      toast.error("Falha ao registrar o pagamento.");
    } finally {
      setIsSaving(false);
    }
  };

  // Handlers de Arte (sem alteração)
  const handleArteFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    // ...
    if (e.target.files && e.target.files[0]) {
      setArteFile(e.target.files[0]);
    } else {
      setArteFile(null);
    }
  };
  const handleUploadArte = async () => {
    // ...
    if (!arteFile) {
      toast.error("Por favor, selecione um arquivo de arte.");
      return;
    }
    if (!pedidoId) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('pedido', pedidoId);
    formData.append('layout', arteFile);
    formData.append('comentarios_admin', arteComentario);

    try {
      await api.post('/artes-pedido/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      toast.success("Arte enviada com sucesso!");
      setArteFile(null);
      setArteComentario("");
      fetchPedidoData(); 
    } catch (error) {
      console.error("Erro ao enviar arte:", error);
      toast.error("Falha ao enviar a arte.");
    } finally {
      setIsUploading(false);
    }
  };
  const handleDeleteArte = async (arteId: number) => {
    // ...
    if (!confirm("Tem certeza que deseja excluir esta arte?")) return;

    try {
      await api.delete(`/artes-pedido/${arteId}/`);
      toast.success("Arte excluída com sucesso.");
      fetchPedidoData(); 
    } catch (error) {
      console.error("Erro ao excluir arte:", error);
      toast.error("Falha ao excluir a arte.");
    }
  };
  
  
  // Handlers de Custos (sem alteração)
  const handleAddCusto = async (e: FormEvent) => {
    // ...
    e.preventDefault();
    if (!novoCustoFornecedorId || !novoCustoDescricao || !novoCustoValor) {
      toast.error("Preencha todos os campos do custo.");
      return;
    }
    
    setIsAddingCusto(true);
    try {
      await api.post('/custos-pedido/', {
        pedido: pedidoId,
        fornecedor: novoCustoFornecedorId,
        descricao: novoCustoDescricao,
        custo: novoCustoValor,
      });
      toast.success("Custo de fornecedor adicionado!");
      setNovoCustoFornecedorId("");
      setNovoCustoDescricao("");
      setNovoCustoValor("");
      fetchPedidoData();
    } catch (error) {
      console.error("Erro ao adicionar custo:", error);
      toast.error("Falha ao adicionar custo.");
    } finally {
      setIsAddingCusto(false);
    }
  };
  const handleDeleteCusto = async (custoId: number) => {
    // ...
    if (!confirm("Tem certeza que deseja excluir este custo?")) return;
    
    try {
      await api.delete(`/custos-pedido/${custoId}/`);
      toast.success("Custo excluído.");
      fetchPedidoData(); 
    } catch (error) {
      console.error("Erro ao excluir custo:", error);
      toast.error("Falha ao excluir custo.");
    }
  };

  // --- 7. NOVO HANDLER PARA IMPRIMIR O.S. PRODUÇÃO ---
  const handlePrintProducao = () => {
    handleDownloadPdf(`/pedidos/${pedidoId}/pdf/producao/`, `os_producao_${pedidoId}.pdf`);
  };
  // --------------------------------------------------


  const subtotal = itens.reduce((acc, item) => acc + (parseFloat(item.subtotal) || 0), 0);
  const valorDesconto = subtotal * (desconto / 100);
  const total = subtotal - valorDesconto + frete;
  const addedProductIds = itens.map((item) => String(item.produto_id ?? item.id));

  if (isAuthLoading || isLoading) return <div className="p-8 text-center">Carregando dados do pedido...</div>;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;
  if (!pedido) return <div className="p-8 text-center">Pedido não encontrado.</div>;

  const lucroDoPedido = (parseFloat(pedido.valor_total) || 0) - (parseFloat(pedido.custo_producao || "0") || 0);
  
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

      <PageHeader title="Pedidos" />

      {/* --- 8. ATUALIZAR HEADER COM NOVO BOTÃO --- */}
      <div className="bg-white p-4 rounded-lg shadow-md mb-6 flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2 text-zinc-800">
          <span className="bg-blue-100 p-2 rounded-full">📄</span> Editar Pedido N-{pedidoId}
        </h2>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-4 border-r pr-4">
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
          </div>
          <div className="flex items-center gap-2">
            {/* NOVO BOTÃO DE IMPRESSÃO (PRODUÇÃO) */}
            <button
              onClick={handlePrintProducao}
              className="bg-gray-100 text-gray-700 font-bold py-2 px-4 rounded-lg border hover:bg-gray-200 flex items-center gap-2"
              title="Imprimir Ordem de Produção (para o Chão de Fábrica)"
            >
              <Printer size={18} /> O.S. (Produção)
            </button>

            <button
              onClick={() => setIsSelectProductModalOpen(true)}
              className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2 hover:bg-blue-700"
            >
              <Plus size={18} /> Selecionar Produtos
            </button>
            <button
              onClick={() => router.push('/pedidos')}
              className="bg-white text-zinc-800 font-bold py-2 px-4 rounded-lg border hover:bg-gray-100 flex items-center gap-2"
            >
              <ArrowLeft size={18} /> Voltar para Lista
            </button>
          </div>
        </div>
      </div>
      {/* ------------------------------------------- */}

      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex space-x-6" aria-label="Tabs">
          <button
            onClick={() => setActiveTab('detalhes')}
            className={`
              ${activeTab === 'detalhes'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }
              whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
            `}
          >
            Detalhes do Pedido
          </button>
          <button
            onClick={() => setActiveTab('arte')}
            className={`
              ${activeTab === 'arte'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }
              whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2
            `}
          >
            <ImageIcon size={16} />
            Arte e Aprovação
            {pedido.artes && pedido.artes.length > 0 && (
                <span className="ml-2 bg-blue-100 text-blue-600 text-xs font-medium px-2.5 py-0.5 rounded-full">
                  {pedido.artes.length}
                </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('custos')}
            className={`
              ${activeTab === 'custos'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }
              whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2
            `}
          >
            <DollarSign size={16} />
            Custos de Produção
            {pedido.custos_fornecedores && pedido.custos_fornecedores.length > 0 && (
                <span className="ml-2 bg-yellow-100 text-yellow-700 text-xs font-medium px-2.5 py-0.5 rounded-full">
                  {pedido.custos_fornecedores.length}
                </span>
            )}
          </button>
        </nav>
      </div>

      {activeTab === 'detalhes' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow-md">
            {/* ... (Dados do Pedido sem alteração) ... */}
            <h3 className="text-lg font-semibold mb-4 text-zinc-800">Dados do Pedido</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div>
                <label className="block text-sm font-medium text-zinc-600 mb-1">Cliente</label>
                <input
                  type="text"
                  value={pedido.cliente?.nome || ""}
                  className="w-full border-gray-300 rounded-md p-2 bg-gray-100 text-gray-400"
                  readOnly
                />
              </div> 
              <div>
                <label className="block text-sm font-medium text-zinc-600 mb-1">Status do Pedido</label>
                <select value={statusProducao} onChange={(e) => setStatusProducao(e.target.value)} className="w-full text-zinc-600 border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option>Aguardando</option>
                  <option>Aguardando Arte</option>
                  <option>Em Produção</option>
                  <option>Finalizado</option>
                  <option>Entregue</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-600 mb-1">Status da Arte</label>
                <select value={statusArte} onChange={(e) => setStatusArte(e.target.value)} className="w-full text-zinc-600 border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {statusArteOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-600 mb-1">Previsto de Entrega</label>
                <input type="date" value={previstoEntrega || ""} onChange={(e) => setPrevistoEntrega(e.target.value)} className="w-full text-zinc-600 border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold mb-4 text-zinc-800">Itens do Pedido</h3>
              {itens.length > 0 ? (
                <div className="overflow-x-auto">
                  {/* --- 9. ATUALIZAR TABELA DE ITENS --- */}
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="py-2 text-left font-medium text-zinc-500">Produto</th>
                        <th className="py-2 text-left font-medium text-zinc-500">Preço Unit.</th>
                        <th className="w-24 py-2 text-left font-medium text-zinc-500">Qtd.</th>
                        <th className="py-2 text-left font-medium text-zinc-500">Total</th>
                        <th className="py-2 text-left font-medium text-zinc-500"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {itens.map((item: CartItem) => (
                        // Usar Fragment <> para agrupar as duas linhas por item
                        <>
                          <tr key={item.id} className="border-b">
                            <td className="py-3 font-medium text-zinc-800">
                              {item.produto?.nome || item.descricao_customizada || "Item manual"}
                            </td>
                            <td className="py-3 text-zinc-600">
                              {formatCurrency(item.quantidade > 0 ? (parseFloat(item.subtotal) || 0) / item.quantidade : 0)}
                            </td>
                            <td className="py-3">
                              <input
                                type="number"
                                value={item.quantidade}
                                onChange={(e) => handleQuantityChange(item.id, parseInt(e.target.value) || 1)}
                                className="w-16 text-zinc-700 rounded-md border p-1 text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                                min="1"
                              />
                            </td>
                            <td className="py-3 font-medium text-zinc-800">
                              {formatCurrency(item.subtotal)}
                            </td>
                            <td className="py-3">
                              <button onClick={() => handleRemoveItem(item.id)} className="text-red-500 hover:text-red-700">
                                <Trash2 size={16} />
                              </button>
                            </td>
                          </tr>
                          {/* NOVA LINHA PARA OBSERVAÇÕES */}
                          <tr key={`${item.id}-obs`}>
                            <td colSpan={5} className="pt-0 pb-3 px-2">
                              <label className="text-xs font-medium text-gray-500">Obs. Produção:</label>
                              <textarea
                                value={item.observacoes_producao || ''}
                                onChange={(e) => handleObservacaoChange(item.id, e.target.value)}
                                placeholder="Ex: Sangria de 3mm, cor Pantone 285C..."
                                className="w-full text-zinc-700 rounded-md border p-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                                rows={2}
                              />
                            </td>
                          </tr>
                        </>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t">
                        <td colSpan={3} className="py-3 text-right font-semibold text-zinc-800">Subtotal:</td>
                        <td className="py-3 font-semibold text-zinc-800">{formatCurrency(subtotal)}</td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                  {/* --- FIM DA ATUALIZAÇÃO DA TABELA --- */}
                </div>
              ) : (
                <p className="text-zinc-500 py-10 text-center">Nenhum item neste pedido.</p>
              )}
            </div>

            <div className="lg:col-span-1 bg-white p-6 rounded-lg shadow-md h-fit">
              {/* ... (Resumo do Pedido sem alteração) ... */}
              <h3 className="text-lg font-semibold mb-4 text-zinc-800">Resumo do Pedido</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center text-zinc-600">
                  <span>Subtotal:</span>
                  <span className="font-medium text-zinc-800">{formatCurrency(subtotal)}</span>
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
                  <span>{formatCurrency(total)}</span>
                </div>
                <div className="flex justify-between text-red-500 text-xs">
                  <span>Valor de Desconto:</span>
                  <span>- {formatCurrency(valorDesconto)}</span>
                </div>

                {pedido?.valor_pago !== undefined && (
                  <>
                    <hr className="my-2" />
                    <div className="flex justify-between text-green-600">
                      <span>Valor Pago:</span>
                      <span>{formatCurrency(pedido.valor_pago)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-red-600">
                      <span>Valor a Receber:</span>
                      <span>{formatCurrency(pedido.valor_a_receber)}</span>
                    </div>
                    <div className="flex justify-between text-zinc-600">
                      <span>Custo de Produção:</span>
                      <span>{formatCurrency(pedido.custo_producao || "0")}</span>
                    </div>
                    <div className="flex justify-between font-bold text-blue-600 border-t pt-2">
                      <span>Lucro do Pedido:</span>
                      <span>{formatCurrency(lucroDoPedido)}</span>
                    </div>
                  </>
                )}

              </div>
            </div>
          </div>

          <div className="mt-6 bg-white p-6 rounded-lg shadow-md">
            {/* ... (Informações de Pagamento sem alteração) ... */}
            <h3 className="text-lg font-semibold mb-4 text-zinc-800">Informações de Pagamento</h3>
            {pedido?.pagamentos?.length > 0 && (
              <div className="mb-6">
                <h4 className="text-sm font-semibold text-zinc-700 mb-2">Pagamentos Realizados</h4>
                <ul className="divide-y text-sm text-zinc-700">
                  {pedido.pagamentos.map((p: any) => (
                    <li key={p.id} className="py-2 flex justify-between">
                      <span>
                        {p.forma_pagamento} em {new Date(p.data).toLocaleDateString("pt-BR")}
                      </span>
                      <span className="font-medium">{formatCurrency(p.valor)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end border-t pt-4">
              <div>
                <label className="block text-sm font-medium text-zinc-600 mb-1">Nova Forma de Pagamento</label>
                <select
                  value={novaFormaPagamento}
                  onChange={(e) => setNovaFormaPagamento(e.target.value)}
                  className="w-full text-zinc-600 border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {formasDePagamento.map((forma) => (
                    <option key={forma.value} value={forma.value}>
                      {forma.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-600 mb-1">Valor de Entrada</label>
                <input
                  type="number"
                  value={novoValorEntrada}
                  onChange={(e) => setNovoValorEntrada(e.target.value)}
                  placeholder="R$ 0,00"
                  className="w-full text-zinc-600 border border-gray-300 rounded-md p-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-600 mb-1">Valor a Receber</label>
                <input
                  type="text"
                  value={formatCurrency(pedido.valor_a_receber)}
                  className="w-full text-zinc-600 border border-gray-300 rounded-md p-2 bg-gray-100"
                  readOnly
                />
              </div>
              <div>
                <button
                  onClick={handleAddPagamento}
                  disabled={isSaving}
                  className="bg-green-500 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2 hover:bg-green-600 w-full"
                >
                  <Plus size={18} /> Lançar Pagamento
                </button>
              </div>
            </div>
          </div>
          
          <div className="mt-6 bg-white p-6 rounded-lg shadow-md">
            {/* ... (Entrega sem alteração) ... */}
            <h3 className="text-lg font-semibold mb-4 text-zinc-800">Entrega</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-600 mb-1">Forma de Envio</label>
                <select value={formaEnvio} onChange={e => setFormaEnvio(e.target.value)} className="w-full text-zinc-600 border border-gray-300 rounded-md p-2">
                  <option value="">Selecione</option>
                  <option value="Correios">Correios</option>
                  <option value="Transportadora">Transportadora</option>
                  <option value="Retirada">Retirada no Local</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-600 mb-1">Código de Rastreio</label>
                <input type="text" value={codigoRastreio} onChange={e => setCodigoRastreio(e.target.value)} placeholder="Informe o código" className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
          </div>
          
        </div>
      )}

      {activeTab === 'arte' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ... (Aba de Arte sem alteração) ... */}
          <div className="lg:col-span-1 bg-white p-6 rounded-lg shadow-md h-fit">
            <h3 className="text-lg font-semibold mb-4 text-zinc-800">Enviar Nova Arte</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-600 mb-1">Arquivo (Layout)</label>
                <input 
                  type="file" 
                  onChange={handleArteFileChange}
                  accept="image/png, image/jpeg, .pdf, .cdr, .ai, .psd"
                  className="w-full text-sm text-zinc-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                {arteFile && <p className="text-xs text-zinc-500 mt-1">Selecionado: {arteFile.name}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-zinc-600 mb-1">Comentários (para o cliente)</label>
                <textarea 
                  value={arteComentario}
                  onChange={e => setArteComentario(e.target.value)}
                  rows={4}
                  placeholder="Ex: Por favor, verifique o layout e aprove."
                  className="w-full text-zinc-600 border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                ></textarea>
              </div>
              
              <button
                onClick={handleUploadArte}
                disabled={isUploading}
                className="w-full bg-blue-600 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2 hover:bg-blue-700 disabled:bg-blue-400"
              >
                {isUploading ? <Loader2 className="animate-spin" size={18} /> : <UploadCloud size={18} />}
                {isUploading ? "Enviando..." : "Enviar Arte"}
              </button>
            </div>

            <ApprovalLink token={pedido.token_aprovacao} />

          </div>

          <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-4 text-zinc-800">Artes Enviadas</h3>
            
            {pedido.artes.length === 0 ? (
              <div className="text-center py-10 text-zinc-500">
                <FileWarning size={40} className="mx-auto mb-2" />
                <p>Nenhuma arte foi enviada para este pedido.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pedido.artes.slice().reverse().map((arte: ArtePedido) => (
                  <div key={arte.id} className="border rounded-lg p-4 flex items-start gap-4">
                    
                    <a href={arte.layout} target="_blank" rel="noopener noreferrer">
                      <Image 
                        src={arte.layout} 
                        alt="Layout do Pedido"
                        width={100}
                        height={100}
                        unoptimized
                        className="object-cover rounded-md border bg-gray-100"
                      />
                    </a>
                    
                    <div className="flex-1">
                      <p className="text-sm font-medium text-zinc-800">
                        Enviado em: {new Date(arte.data_upload).toLocaleString('pt-BR')}
                      </p>
                      {arte.comentarios_admin && (
                        <p className="text-sm text-zinc-600 mt-1 italic">
                          "{arte.comentarios_admin}"
                        </p>
                      )}
                      {arte.comentarios_cliente && (
                        <p className="text-sm text-red-600 mt-2 font-semibold">
                          Revisão Cliente: "{arte.comentarios_cliente}"
                        </p>
                      )}
                    </div>
                    <button 
                      onClick={() => handleDeleteArte(arte.id)} 
                      className="text-red-500 hover:text-red-700"
                      title="Excluir Arte"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}
      
      {activeTab === 'custos' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ... (Aba de Custos sem alteração) ... */}
          <div className="lg:col-span-1 bg-white p-6 rounded-lg shadow-md h-fit">
            <h3 className="text-lg font-semibold mb-4 text-zinc-800">Lançar Custo de Produção</h3>
            <form onSubmit={handleAddCusto} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-600 mb-1">Fornecedor</label>
                <select 
                  value={novoCustoFornecedorId}
                  onChange={e => setNovoCustoFornecedorId(e.target.value)}
                  className="w-full text-zinc-600 border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Selecione um fornecedor</option>
                  {fornecedores.map(f => (
                    <option key={f.id} value={f.id}>{f.nome}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-zinc-600 mb-1">Descrição do Custo</label>
                <input 
                  type="text"
                  value={novoCustoDescricao}
                  onChange={e => setNovoCustoDescricao(e.target.value)}
                  placeholder="Ex: Impressão Lona 3x2m"
                  className="w-full text-zinc-600 border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-600 mb-1">Valor do Custo (R$)</label>
                <input 
                  type="number"
                  step="0.01"
                  value={novoCustoValor}
                  onChange={e => setNovoCustoValor(e.target.value)}
                  placeholder="R$ 0,00"
                  className="w-full text-zinc-600 border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <button
                type="submit"
                disabled={isAddingCusto}
                className="w-full bg-blue-600 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2 hover:bg-blue-700 disabled:bg-blue-400"
              >
                {isAddingCusto ? <Loader2 className="animate-spin" size={18} /> : <Plus size={18} />}
                {isAddingCusto ? "Lançando..." : "Lançar Custo"}
              </button>
            </form>
          </div>

          <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-4 text-zinc-800">Custos Lançados</h3>
            
            {pedido.custos_fornecedores.length === 0 ? (
              <div className="text-center py-10 text-zinc-500">
                <FileWarning size={40} className="mx-auto mb-2" />
                <p>Nenhum custo de produção foi lançado para este pedido.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr className="border-b">
                      <th className="py-2 text-left font-medium text-zinc-500">Fornecedor</th>
                      <th className="py-2 text-left font-medium text-zinc-500">Descrição</th>
                      <th className="py-2 text-left font-medium text-zinc-500">Valor</th>
                      <th className="py-2 text-left font-medium text-zinc-500"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {pedido.custos_fornecedores.map((custo) => (
                      <tr key={custo.id}>
                        <td className="py-3 font-medium text-zinc-800">
                          {custo.fornecedor_nome}
                        </td>
                        <td className="py-3 text-zinc-600">
                          {custo.descricao}
                        </td>
                        <td className="py-3 font-medium text-zinc-800">
                          {formatCurrency(custo.custo)}
                        </td>
                        <td className="py-3">
                          <button 
                            onClick={() => handleDeleteCusto(custo.id)} 
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="border-t-2 bg-gray-50">
                    <tr>
                      <td colSpan={2} className="py-3 text-right font-bold text-zinc-800">Custo Total:</td>
                      <td className="py-3 font-bold text-lg text-zinc-800">
                        {formatCurrency(pedido.custo_producao || "0")}
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
      
      {error && <div className="mt-4 text-center text-red-500">{error}</div>}

      <div className="mt-6 flex justify-end">
        <button
          onClick={handleUpdatePedido}
          disabled={isSaving}
          className="bg-green-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-green-700 flex items-center gap-2"
        >
          <Save size={18} />
          {isSaving ? "Salvando..." : "Salvar Alterações no Pedido"}
        </button>
      </div>
    </>
  );
}