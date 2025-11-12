// src/app/(app)/relatorios/RelatorioOrcamentos.tsx

"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { toast } from "react-toastify";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell, Legend } from 'recharts';
import { FileText, Percent, Clock, DollarSign, CheckCircle, XCircle } from "lucide-react";

type RelatorioOrcamentosData = {
  cards: {
    total_orcamentos: number;
    taxa_conversao: number;
    tempo_medio_resposta: string;
    valor_total_orcado: number;
    valor_total_aprovado: number;
    aprovados_count: number;
    recusados_count: number;
  };
  grafico_status: any[];
  grafico_produtos: any[];
  tabela_recentes: any[];
};

const formatCurrency = (value: string | number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value));

const STATUS_COLORS: { [key: string]: string } = {
  'Aprovado': '#22c55e', // verde
  'Recusado': '#ef4444', // vermelho
  'Em Aberto': '#f59e0b', // laranja
};

export default function RelatorioOrcamentos() {
  const [data, setData] = useState<RelatorioOrcamentosData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await api.get('/relatorios/orcamentos/');
        setData(response.data);
      } catch (error) {
        toast.error("Falha ao carregar o relatório de orçamentos.");
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
        <StatCard title="Total de Orçamentos" value={data.cards.total_orcamentos} Icon={FileText} />
        <StatCard title="Taxa de Conversão" value={`${data.cards.taxa_conversao.toFixed(1)}%`} subtitle={`${data.cards.aprovados_count} aprovados`} Icon={Percent} />
        <StatCard title="Tempo Médio de Resposta" value={data.cards.tempo_medio_resposta} Icon={Clock} />
        <StatCard title="Valor Total Orçado" value={formatCurrency(data.cards.valor_total_orcado)} subtitle={`${formatCurrency(data.cards.valor_total_aprovado)} aprovados`} Icon={DollarSign} />
      </div>

      {/* Gráficos em Linha */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Status dos Orçamentos (Pizza) */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-zinc-800 mb-2">Status dos Orçamentos</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data.grafico_status} dataKey="value" nameKey="status" cx="50%" cy="50%" outerRadius={80} label>
                  {data.grafico_status.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.status] || '#8884d8'} />
                  ))}
                </Pie>
                <Tooltip formatter={(value, name) => [value, name]} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-around mt-4">
            <div className="text-center">
              <CheckCircle className="h-6 w-6 text-green-500 mx-auto" />
              <p className="font-semibold text-lg">{data.cards.aprovados_count}</p>
              <p className="text-sm text-zinc-500">Aprovados</p>
            </div>
            <div className="text-center">
              <XCircle className="h-6 w-6 text-red-500 mx-auto" />
              <p className="font-semibold text-lg">{data.cards.recusados_count}</p>
              <p className="text-sm text-zinc-500">Recusados</p>
            </div>
          </div>
        </div>
        
        {/* Orçamentos por Produto (Barras) */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-zinc-800 mb-4">Orçamentos por Produto</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.grafico_produtos} layout="vertical" margin={{ left: 50 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis type="number" hide />
                <YAxis dataKey="produto__nome" type="category" fontSize={12} interval={0} />
                <Tooltip formatter={(value: number) => [value, "Orçamentos"]} />
                <Bar dataKey="value" fill="#8884d8" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Tabela de Orçamentos Recentes */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h2 className="text-xl font-semibold text-zinc-800">Orçamentos Recentes</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left font-semibold text-gray-600">Número</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-600">Cliente</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-600">Produto</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-600">Valor</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-600">Data Envio</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-600">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.tabela_recentes.map((orc: any) => (
                <tr key={orc.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-blue-600">ORC-{String(orc.id).padStart(3, '0')}</td>
                  <td className="px-6 py-4 text-gray-700">{orc.cliente_nome}</td>
                  <td className="px-6 py-4 text-gray-500">{orc.produto_principal}</td>
                  <td className="px-6 py-4 text-gray-700 font-bold">{formatCurrency(orc.valor_total)}</td>
                  <td className="px-6 py-4 text-gray-500">{new Date(orc.data_criacao).toLocaleDateString('pt-BR')}</td>
                  <td className="px-6 py-4"><span className={`px-2 py-1 text-xs font-semibold rounded-full ${STATUS_COLORS[orc.status] ? '' : 'bg-gray-100 text-gray-800'}`} style={{backgroundColor: STATUS_COLORS[orc.status] + '20', color: STATUS_COLORS[orc.status]}}>{orc.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// Componente de Card de Estatística (Copie e cole ou importe)
function StatCard({ title, value, subtitle, Icon }: { title: string, value: string | number, subtitle?: string, Icon: any }) {
  return (
    <div className="bg-white p-5 rounded-lg shadow-md flex items-start gap-4">
      <div className="flex-shrink-0">
        <Icon className="h-8 w-8 text-blue-500" />
      </div>
      <div>
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <p className="text-3xl font-bold text-gray-800">{value}</p>
        {subtitle && <p className="text-xs text-gray-400">{subtitle}</p>}
      </div>
    </div>
  );
}