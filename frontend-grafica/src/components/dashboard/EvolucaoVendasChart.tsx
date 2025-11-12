// src/components/dashboard/EvolucaoVendasChart.tsx

"use client";

import { api } from '@/lib/api';
import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useAuth } from '@/contexts/AuthContext'; // 1. Importe o useAuth

type VendaData = {
  name: string;
  Receita: number;
};

export default function EvolucaoVendasChart() {
  const [data, setData] = useState<VendaData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth(); // 2. Pegue os estados

  useEffect(() => {
    // 3. Só busca dados se a autenticação estiver pronta
    if (isAuthenticated && !isAuthLoading) {
      const fetchData = async () => {
        setIsLoading(true);
        try {
          const response = await api.get('/relatorios/evolucao-vendas/');
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
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
          <XAxis dataKey="name" fontSize={12} />
          <YAxis fontSize={12} tickFormatter={(value) => `R$ ${value / 1000}k`} />
          <Tooltip formatter={(value: number) => [new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value), "Receita"]} />
          <Line type="monotone" dataKey="Receita" stroke="#3b82f6" strokeWidth={2} activeDot={{ r: 8 }} dot={{ r: 4 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}