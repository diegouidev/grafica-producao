// src/components/dashboard/PedidosPorStatusChart.tsx

"use client";

import { api } from '@/lib/api';
import { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { useAuth } from '@/contexts/AuthContext'; // 1. Importe o useAuth

type StatusData = { name: string; value: number; };
const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444'];

export default function PedidosPorStatusChart() {
  const [data, setData] = useState<StatusData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth(); // 2. Pegue os estados

  useEffect(() => {
    // 3. Só busca dados se a autenticação estiver pronta
    if (isAuthenticated && !isAuthLoading) {
      const fetchData = async () => {
        setIsLoading(true);
        try {
          const response = await api.get('/relatorios/pedidos-por-status/');
          setData(response.data);
        } catch (error) {
          console.error("Erro ao buscar dados do gráfico:", error);
        } finally {
          setIsLoading(false);
        }
      };
      fetchData();
    }
  }, [isAuthenticated, isAuthLoading]); // 4. Depende de ambos

  if (isLoading) {
    return <div className="h-80 bg-gray-50 rounded-md flex items-center justify-center text-gray-400">Carregando...</div>;
  }
  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" labelLine={false} outerRadius={100} fill="#8884d8" dataKey="value" label={(entry) => `${((entry.value / data.reduce((acc, curr) => acc + curr.value, 0)) * 100).toFixed(0)}%`}>
            {data.map((entry, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}
          </Pie>
          <Tooltip formatter={(value: number, name: string) => [value, name]} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}