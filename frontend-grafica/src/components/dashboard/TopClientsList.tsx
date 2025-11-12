// src/components/dashboard/TopClientsList.tsx

"use client";

import { api } from '@/lib/api';
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

type ClientData = {
  name: string;
  total_pedidos: number;
  total_gasto: number;
};

const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

// Função para gerar as iniciais
const getInitials = (name: string) => {
  const names = name.split(' ');
  if (names.length === 1) return name.substring(0, 2).toUpperCase();
  return (names[0][0] + names[names.length - 1][0]).toUpperCase();
};

export default function TopClientsList() {
  const [data, setData] = useState<ClientData[]>([]);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      const fetchData = async () => {
        try {
          const response = await api.get('/relatorios/clientes-mais-ativos/');
          setData(response.data);
        } catch (error) {
          console.error("Erro ao buscar top clientes:", error);
        }
      };
      fetchData();
    }
  }, [isAuthenticated]);

  return (
    <div className="space-y-4 h-80 overflow-y-auto">
      {data.map((client) => (
        <div key={client.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-3">
            <span className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
              {getInitials(client.name)}
            </span>
            <div>
              <p className="text-sm font-semibold text-zinc-800">{client.name}</p>
              <p className="text-xs text-zinc-500">{client.total_pedidos} pedidos</p>
            </div>
          </div>
          <span className="text-sm font-bold text-zinc-800">
            {formatCurrency(client.total_gasto)}
          </span>
        </div>
      ))}
    </div>
  );
}