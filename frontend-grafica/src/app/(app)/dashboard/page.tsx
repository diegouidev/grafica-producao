// src/app/(app)/dashboard/page.tsx
// (Arquivo Modificado)

"use client";

import { useState, useEffect, ComponentType } from "react";
import { api } from "@/lib/api";
import PageHeader from "@/components/layout/PageHeader";
import StatCard from "@/components/dashboard/StatCard";
import { DollarSign, TrendingDown, TrendingUp, CircleDollarSign, Wallet, Landmark, CreditCard, Ticket, MessageSquare, Eye, Edit2, ChevronDown } from "lucide-react";
import { Pedido } from "@/types";
import EvolucaoVendasChart from "@/components/dashboard/EvolucaoVendasChart";
import PedidosPorStatusChart from "@/components/dashboard/PedidosPorStatusChart";
import TopProductsChart from "@/components/dashboard/TopProductsChart";
import TopClientsList from "@/components/dashboard/TopClientsList";
import { toast } from "react-toastify";
import { useAuth } from "@/contexts/AuthContext";

// --- NOVAS IMPORTAÇÕES ---
// Importamos os modais que já existem no projeto
import ViewOrderModal from "@/app/(app)/pedidos/ViewOrderModal";
import UpdateStatusModal from "@/app/(app)/pedidos/UpdateStatusModal";
// -------------------------

type DashboardStats = { faturamento: number; despesas: number; lucro: number; valor_a_receber: number; };
type VendasRecentes = Pedido[];
type FaturamentoPorPagamento = { forma_pagamento: string; total: number; }[];

const formatDateForAPI = (date: Date) => date.toISOString().split('T')[0];
const formatCurrency = (value: number | string) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value) || 0);

const paymentMethodDetails: { [key: string]: { Icon: ComponentType<any>; color: string } } = {
  DINHEIRO: { Icon: Wallet, color: 'text-green-500' },
  PIX: { Icon: Landmark, color: 'text-blue-500' },
  CARTAO: { Icon: CreditCard, color: 'text-pink-500' },
  BOLETO: { Icon: Ticket, color: 'text-gray-500' },
};

const filtroOptions = ['Hoje', 'Semana Atual', 'Mês Atual', 'Ano Atual', 'Personalizado'];

export default function DashboardPage() {
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [vendasRecentes, setVendasRecentes] = useState<VendasRecentes>([]);
  const [faturamentoPgto, setFaturamentoPgto] = useState<FaturamentoPorPagamento>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [filtroAtivo, setFiltroAtivo] = useState('Mês Atual');

  // --- NOVOS ESTADOS PARA OS MODAIS ---
  const [selectedPedido, setSelectedPedido] = useState<Pedido | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  // ------------------------------------

  const fetchDashboardData = async (inicio: string, fim: string) => {
    setIsLoading(true);
    try {
      const params = { data_inicio: inicio, data_fim: fim };
      
      const [statsRes, vendasRes, faturamentoRes] = await Promise.all([
        api.get('/dashboard-stats/', { params }),
        api.get('/vendas-recentes/'),
        api.get('/faturamento-por-pagamento/', { params }),
      ]);
      
      setStats(statsRes.data);
      setVendasRecentes(vendasRes.data);
      setFaturamentoPgto(faturamentoRes.data);
      
    } catch (error) {
      console.error("Erro ao buscar dados do dashboard:", error);
      toast.error("Não foi possível atualizar os dados do Dashboard.");
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    // Espera o contexto de autenticação estar pronto
    if (!isAuthLoading && isAuthenticated) {
      handleFiltroChange('Mês Atual');
    }
  }, [isAuthLoading, isAuthenticated]);

  const handleFiltroChange = (filtro: string) => {
    setFiltroAtivo(filtro);
    const hoje = new Date();
    let inicio = hoje;
    const fim = hoje;

    if (filtro === 'Hoje') {
      // Já é o padrão
    } else if (filtro === 'Semana Atual') {
      const primeiroDiaSemana = hoje.getDate() - hoje.getDay();
      inicio = new Date(hoje.setDate(primeiroDiaSemana));
    } else if (filtro === 'Mês Atual') {
      inicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    } else if (filtro === 'Ano Atual') {
      inicio = new Date(hoje.getFullYear(), 0, 1);
    }
    
    if (filtro !== 'Personalizado') {
      const inicioStr = formatDateForAPI(inicio);
      const fimStr = formatDateForAPI(fim);
      setDataInicio(inicioStr);
      setDataFim(fimStr);
      fetchDashboardData(inicioStr, fimStr);
    }
  };

  const handleFiltroPersonalizado = () => {
    if (dataInicio && dataFim) {
      setFiltroAtivo('Personalizado');
      fetchDashboardData(dataInicio, dataFim);
    } else {
      toast.error("Por favor, selecione as duas datas.");
    }
  };
  
  // --- NOVOS HANDLERS PARA OS MODAIS ---
  const handleOpenViewModal = (pedido: Pedido) => {
    setSelectedPedido(pedido);
    setIsViewModalOpen(true);
  };

  const handleOpenStatusModal = (pedido: Pedido) => {
    setSelectedPedido(pedido);
    setIsStatusModalOpen(true);
  };

  const handleCloseViewModal = () => {
    setSelectedPedido(null);
    setIsViewModalOpen(false);
  };

  const handleCloseStatusModal = () => {
    setSelectedPedido(null);
    setIsStatusModalOpen(false);
    // O modal 'UpdateStatusModal' já chama 'router.refresh()' internamente
    // Mas esta página busca dados via 'api.get' no 'useEffect'.
    // Para garantir que o status seja atualizado na lista,
    // re-buscamos as vendas recentes manualmente.
    api.get('/vendas-recentes/')
      .then(res => setVendasRecentes(res.data))
      .catch(err => console.error("Falha ao re-buscar vendas recentes", err));
  };
  // ------------------------------------

  const totalFaturadoNoMes = faturamentoPgto.reduce((acc, p) => acc + p.total, 0);

  return (
    <>
      <PageHeader title="Dashboard" />
      
      <div className="mb-6 bg-white p-4 rounded-lg shadow-md flex flex-wrap items-center justify-between gap-2">
        {/* ... (Conteúdo do Filtro de Data) ... */}
        <div className="flex items-center gap-2">
          <span className="text-lg font-semibold text-gray-700">
            Faturamento de {new Date().toLocaleString('pt-BR', { month: 'long' })}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {filtroAtivo === 'Personalizado' ? (
            <>
              <input type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)} className="border rounded-lg p-2 text-sm" />
              <input type="date" value={dataFim} onChange={e => setDataFim(e.target.value)} className="border rounded-lg p-2 text-sm" />
              <button 
                onClick={handleFiltroPersonalizado}
                className="py-2 px-4 rounded-lg text-sm font-medium bg-blue-600 text-white"
              >
                Filtrar
              </button>
            </>
          ) : (
            <select
              value={filtroAtivo}
              onChange={(e) => handleFiltroChange(e.target.value)}
              className="border rounded-lg p-2 text-sm font-medium bg-white text-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {filtroOptions.map(filtro => (
                <option key={filtro} value={filtro}>{filtro}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {(isLoading || isAuthLoading) ? (
        <div className="text-center p-10">Carregando dados...</div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4 mb-6">
            <StatCard title="Faturamento" value={formatCurrency(stats?.faturamento || 0)} Icon={DollarSign} color="blue" />
            <StatCard title="Despesas" value={formatCurrency(stats?.despesas || 0)} Icon={TrendingDown} color="red" />
            <StatCard title="Lucro" value={formatCurrency(stats?.lucro || 0)} Icon={TrendingUp} color="green" />
            <StatCard title="Valor a Receber" value={formatCurrency(stats?.valor_a_receber || 0)} Icon={CircleDollarSign} color="orange" />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 mb-6">
            <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Vendas Recentes</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="py-2 text-left font-medium text-gray-500">Pedido</th>
                      <th className="py-2 text-left font-medium text-gray-500">Cliente</th>
                      <th className="py-2 text-left font-medium text-gray-500">Valor</th>
                      <th className="py-2 text-left font-medium text-gray-500">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {vendasRecentes.map((venda) => (
                      <tr key={venda.id} className="border-b">
                        <td className="py-3 text-blue-600 font-medium">#{venda.id}</td>
                        <td className="py-3 text-gray-900 font-medium">{venda.cliente.nome}</td>
                        <td className="py-3 text-gray-700">{formatCurrency(venda.valor_total)}</td>
                        <td className="py-3">
                          <div className="flex items-center gap-3 text-gray-500">
                            <button className="hover:text-green-500"><MessageSquare size={16} /></button>
                            
                            {/* --- BOTÕES COM AÇÃO --- */}
                            <button onClick={() => handleOpenViewModal(venda)} className="hover:text-blue-500" title="Visualizar Pedido">
                              <Eye size={16} />
                            </button>
                            <button onClick={() => handleOpenStatusModal(venda)} className="hover:text-yellow-500" title="Atualizar Status">
                              <Edit2 size={16} />
                            </button>
                            {/* ------------------------ */}

                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            
            <div className="lg:col-span-1 bg-white p-6 rounded-lg shadow-md">
              {/* ... (Conteúdo Faturamento por Pagamento) ... */}
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Faturamento por Pagamento</h3>
              <div className="space-y-4">
                {faturamentoPgto.map((pagamento) => {
                  const details = paymentMethodDetails[pagamento.forma_pagamento] || paymentMethodDetails.PIX;
                  const percentual = totalFaturadoNoMes > 0 ? (pagamento.total / totalFaturadoNoMes) * 100 : 0;
                  return (
                    <div key={pagamento.forma_pagamento}>
                      <div className="flex items-center gap-3 mb-1">
                        <details.Icon className={`h-5 w-5 ${details.color}`} />
                        <span className="text-gray-600 font-medium">{pagamento.forma_pagamento}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-800 font-bold">{formatCurrency(pagamento.total)}</span>
                        <span className="text-xs text-gray-500">{percentual.toFixed(2)}%</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold text-zinc-800 mb-2">Evolução de Vendas</h3>
              <p className="text-sm text-zinc-500 mb-4">Receita dos últimos 6 meses</p>
              <EvolucaoVendasChart />
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold text-zinc-800 mb-2">Pedidos por Status</h3>
              <p className="text-sm text-zinc-500 mb-4">Distribuição atual dos pedidos</p>
              <PedidosPorStatusChart />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold text-zinc-800 mb-2">Produtos Mais Vendidos</h3>
              <p className="text-sm text-zinc-500 mb-4">Top 5 produtos do mês</p>
              <TopProductsChart />
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold text-zinc-800 mb-2">Clientes Mais Ativos</h3>
              <p className="text-sm text-zinc-500 mb-4">Top 5 clientes por valor total</p>
              <TopClientsList />
            </div>
          </div>
        </>
      )}

      {/* --- RENDERIZAÇÃO DOS MODAIS --- */}
      {/* Colocamos eles aqui no final, fora do 'isLoading' */}
      <ViewOrderModal
        isOpen={isViewModalOpen}
        onClose={handleCloseViewModal}
        pedido={selectedPedido}
      />
      
      <UpdateStatusModal
        isOpen={isStatusModalOpen}
        onClose={handleCloseStatusModal}
        pedido={selectedPedido}
      />
      {/* -------------------------------- */}
    </>
  );
}