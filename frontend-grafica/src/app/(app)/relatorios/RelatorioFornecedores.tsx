// src/app/(app)/relatorios/RelatorioFornecedores.tsx
// (Novo Arquivo)

"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { toast } from "react-toastify";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { RelatorioFornecedorGasto, RelatorioFornecedorUso } from "@/types";

type RelatorioFornecedoresData = {
  grafico_mais_gastos: RelatorioFornecedorGasto[];
  grafico_mais_usados: RelatorioFornecedorUso[];
};

const formatCurrency = (value: string | number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value));

export default function RelatorioFornecedores() {
  const [data, setData] = useState<RelatorioFornecedoresData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await api.get('/relatorios/fornecedores/');
        setData(response.data);
      } catch (error) {
        toast.error("Falha ao carregar o relatório de fornecedores.");
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Gráfico Mais Gastos (Valor) */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-zinc-800 mb-2">Fornecedores (Mais Gasto)</h3>
          <p className="text-sm text-zinc-500 mb-4">Top 10 fornecedores por valor total de custo</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.grafico_mais_gastos} layout="vertical" margin={{ left: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" fontSize={12} interval={0} />
                <Tooltip formatter={(value: number) => [formatCurrency(value), "Total Gasto"]} />
                <Bar dataKey="total_gasto" fill="#8884d8" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* Gráfico Mais Usados (Pedidos) */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-zinc-800 mb-2">Fornecedores (Mais Usados)</h3>
          <p className="text-sm text-zinc-500 mb-4">Top 10 fornecedores por n° de pedidos</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.grafico_mais_usados} layout="vertical" margin={{ left: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" fontSize={12} interval={0} />
                <Tooltip formatter={(value: number) => [value, "Pedidos"]} />
                <Bar dataKey="total_pedidos" fill="#3b82f6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}