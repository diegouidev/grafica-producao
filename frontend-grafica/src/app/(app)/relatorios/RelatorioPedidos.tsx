// src/app/(app)/relatorios/RelatorioPedidos.tsx

"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { toast } from "react-toastify";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { ShoppingCart, Clock, AlertCircle, TrendingUp, XCircle } from "lucide-react";

type RelatorioPedidosData = {
  total_pedidos: number;
  pedidos_atrasados_count: number;
  lucro_medio_pedido: number;
  tempo_medio_producao_dias: number;
  lista_pedidos_atrasados: any[];
  pedidos_por_forma_pagamento: any[];
};

const formatCurrency = (value: string | number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value));

export default function RelatorioPedidos() {
  const [data, setData] = useState<RelatorioPedidosData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await api.get('/relatorios/pedidos/');
        setData(response.data);
      } catch (error) {
        toast.error("Falha ao carregar o relatório de pedidos.");
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
        <StatCard title="Total de Pedidos" value={data.total_pedidos} Icon={ShoppingCart} />
        <StatCard title="Tempo Médio Produção" value={`${data.tempo_medio_producao_dias} dias`} Icon={Clock} />
        <StatCard title="Pedidos Atrasados" value={data.pedidos_atrasados_count} Icon={AlertCircle} isError={data.pedidos_atrasados_count > 0} />
        <StatCard title="Lucro Médio/Pedido" value={formatCurrency(data.lucro_medio_pedido)} Icon={TrendingUp} />
      </div>

      {/* Gráficos em Linha */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Pedidos por Forma de Pagamento */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-zinc-800 mb-4 flex items-center gap-2">
            <span className="text-green-500">$</span> Pedidos por Forma de Pagamento
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.pedidos_por_forma_pagamento}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis dataKey="forma_pagamento" fontSize={12} />
                <YAxis allowDecimals={false} />
                <Tooltip formatter={(value: number) => [value, "Pedidos"]} />
                <Bar dataKey="value" fill="#2dd4bf" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        {/* Placeholder para outro gráfico */}
        <div className="bg-white p-6 rounded-lg shadow-md flex items-center justify-center h-full">
          <p className="text-zinc-500">(Outro gráfico, ex: Pedidos por Status)</p>
        </div>
      </div>

      {/* Tabela de Pedidos Atrasados */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b bg-red-50">
          <h2 className="text-xl font-semibold text-red-700 flex items-center gap-2">
            <XCircle />
            Pedidos Atrasados - Atenção Necessária
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <tbody className="bg-white divide-y divide-gray-200">
              {data.lista_pedidos_atrasados.map((pedido: any) => (
                <tr key={pedido.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <p className="font-bold text-gray-900">Pedido #PED-{String(pedido.id).padStart(3, '0')}</p>
                    <p className="text-gray-500">{pedido.cliente_nome}</p>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="font-bold text-red-600 bg-red-100 px-3 py-1 rounded-full">
                      {Math.abs(pedido.dias_atraso)} dias de atraso
                    </span>
                  </td>
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