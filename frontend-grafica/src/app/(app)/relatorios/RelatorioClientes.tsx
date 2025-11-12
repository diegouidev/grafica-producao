// src/app/(app)/relatorios/RelatorioClientes.tsx

"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { toast } from "react-toastify";
import { Users, UserCheck, UserX, UserPlus } from "lucide-react";

// Tipo para os dados do relatório
type RelatorioClientesData = {
  total_clientes: number;
  novos_clientes_30d: number;
  clientes_ativos_90d: number;
  clientes_inativos_90d: number;
  lista_inativos: any[]; // Vamos usar 'any' por enquanto para a lista
};

const formatCurrency = (value: string | number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value));

export default function RelatorioClientes() {
  const [data, setData] = useState<RelatorioClientesData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await api.get('/relatorios/clientes/');
        setData(response.data);
      } catch (error) {
        toast.error("Falha ao carregar o relatório de clientes.");
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
        <StatCard title="Total de Clientes" value={data.total_clientes} Icon={Users} />
        <StatCard title="Clientes Ativos" value={data.clientes_ativos_90d} subtitle="Últimos 90 dias" Icon={UserCheck} />
        <StatCard title="Clientes Inativos" value={data.clientes_inativos_90d} subtitle="+90 dias sem pedido" Icon={UserX} />
        <StatCard title="Novos Clientes" value={data.novos_clientes_30d} subtitle="Últimos 30 dias" Icon={UserPlus} />
      </div>

      {/* Tabela de Clientes Inativos */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h2 className="text-xl font-semibold text-zinc-800 flex items-center gap-2">
            <UserX className="text-red-500" />
            Clientes Inativos (+90 dias sem pedido)
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left font-semibold text-gray-600">Nome</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-600">Contato</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-600">Último Pedido</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-600">Dias Inativo</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-600">Total Gasto</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.lista_inativos.map((cliente: any) => (
                <tr key={cliente.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">{cliente.nome}</td>
                  <td className="px-6 py-4 text-gray-500">{cliente.telefone || '--'}</td>
                  <td className="px-6 py-4 text-gray-500">{cliente.ultimo_pedido ? new Date(cliente.ultimo_pedido).toLocaleDateString('pt-BR') : 'Nunca'}</td>
                  <td className="px-6 py-4">
                    <span className="font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded-full">
                      {cliente.dias_inativo || 'N/A'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-700">{formatCurrency(cliente.total_gasto)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// Componente de Card de Estatística (pode ser movido para components/layout se for reutilizado)
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