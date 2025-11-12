"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { toast } from "react-toastify";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Package, DollarSign, BarChart2, AlertTriangle, TrendingUp, TrendingDown } from "lucide-react";
import Link from "next/link";

// --- 1. INTERFACE PARA O NOVO DADO ---
type ProdutoAlerta = {
  id: number;
  nome: string;
  estoque_atual: number;
  estoque_minimo: number;
};

type RelatorioProdutosData = {
  cards: {
    total_produtos: number;
    custo_medio: number;
    preco_medio_venda: number;
    alertas_estoque: number;
  };
  grafico_mais_vendidos: any[];
  lista_mais_lucrativos: any[];
  tabela_baixa_demanda: any[];
  lista_alertas_estoque: ProdutoAlerta[]; // <-- 2. ADICIONAR AQUI
};

const formatCurrency = (value: string | number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value));

export default function RelatorioProdutos() {
  const [data, setData] = useState<RelatorioProdutosData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await api.get('/relatorios/produtos/');
        setData(response.data);
      } catch (error) {
        toast.error("Falha ao carregar o relatório de produtos.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  if (isLoading) return <div className="p-4 text-center">Carregando dados...</div>;
  if (!data) return <div className="p-4 text-center">Não foi possível carregar os dados.</div>;

  return (
    <div className="space-y-6">
      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total de Produtos" value={data.cards.total_produtos} Icon={Package} />
        <StatCard title="Custo Médio" value={formatCurrency(data.cards.custo_medio)} Icon={TrendingDown} />
        <StatCard title="Preço Médio Venda" value={formatCurrency(data.cards.preco_medio_venda)} Icon={TrendingUp} />
        <StatCard 
          title="Alertas de Estoque" 
          value={data.cards.alertas_estoque} 
          Icon={AlertTriangle} 
          isError={data.cards.alertas_estoque > 0} 
        />
      </div>

      {/* --- 3. NOVA TABELA DE ALERTAS DE ESTOQUE --- */}
      {/* Ela só aparece se houver alertas */}
      {data.lista_alertas_estoque && data.lista_alertas_estoque.length > 0 && (
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b bg-yellow-50">
            <h2 className="text-xl font-semibold text-yellow-700 flex items-center gap-2">
              <AlertTriangle />
              Produtos com Estoque Baixo
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left font-semibold text-gray-600">Produto</th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-600">Estoque Mínimo</th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-600">Estoque Atual</th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-600">Ação</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.lista_alertas_estoque.map((produto: ProdutoAlerta) => (
                  <tr key={produto.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">{produto.nome}</td>
                    <td className="px-6 py-4 text-gray-500">{produto.estoque_minimo}</td>
                    <td className="px-6 py-4">
                      <span className="font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded-full">
                        {produto.estoque_atual}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-blue-600 font-medium">
                      <Link href="/produtos">
                        Gerenciar
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {/* ------------------------------------------- */}


      {/* Gráficos em Linha */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-zinc-800 mb-2">Produtos Mais Vendidos</h3>
          <p className="text-sm text-zinc-500 mb-4">Top 5 produtos do mês (por quantidade)</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.grafico_mais_vendidos} layout="vertical" margin={{ left: 50 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" fontSize={12} interval={0} />
                <Tooltip formatter={(value: number) => [value, "Unidades"]} />
                <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-zinc-800 mb-2">Produtos Mais Lucrativos</h3>
          <p className="text-sm text-zinc-500 mb-4">Top 6 por margem de lucro</p>
          <div className="space-y-3 h-64 overflow-y-auto">
            {data.lista_mais_lucrativos.map((produto: any, index: number) => (
              <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center font-bold text-xs">{index + 1}º</span>
                  <div>
                    <p className="text-sm font-semibold text-zinc-800">{produto.name}</p>
                    <p className="text-xs text-zinc-500">Margem: {Number(produto.margem).toFixed(1)}%</p>
                  </div>
                </div>
                <span className="text-sm font-bold text-green-600">{formatCurrency(produto.total_lucro)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabela de Produtos em Baixa Demanda */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b bg-orange-50">
          <h2 className="text-xl font-semibold text-orange-700 flex items-center gap-2">
            <TrendingDown />
            Produtos em Baixa Demanda (+60 dias sem venda)
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left font-semibold text-gray-600">Produto</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-600">Última Venda</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-600">Dias sem Venda</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-600">Preço Venda</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.tabela_baixa_demanda.map((produto: any) => (
                <tr key={produto.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">{produto.nome}</td>
                  <td className="px-6 py-4 text-gray-500">{produto.ultima_venda ? new Date(produto.ultima_venda).toLocaleDateString('pt-BR') : 'Nunca'}</td>
                  <td className="px-6 py-4">
                    <span className="font-bold text-orange-600 bg-orange-100 px-2 py-0.5 rounded-full">
                      {produto.dias_sem_venda || 'N/A'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-700">{formatCurrency(produto.preco)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// Componente de Card de Estatística
function StatCard({ title, value, subtitle, Icon, isError = false }: { title: string, value: string | number, subtitle?: string, Icon: any, isError?: boolean }) {
  return (
    <div className="bg-white p-5 rounded-lg shadow-md flex items-start gap-4">
      <div className="flex-shrink-0">
        <Icon className={`h-8 w-8 ${isError ? 'text-red-500' : 'text-blue-500'}`} />
      </div>
      <div>
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <p className={`text-3xl font-bold ${isError ? 'text-red-500' : 'text-gray-800'}`}>{value}</p>
        {subtitle && <p className="text-xs text-gray-400">{subtitle}</p>}
      </div>
    </div>
  );
}