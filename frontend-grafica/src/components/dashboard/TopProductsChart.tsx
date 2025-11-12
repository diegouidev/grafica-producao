// src/components/dashboard/TopProductsChart.tsx

"use client";

import { api } from '@/lib/api';
import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useAuth } from '@/contexts/AuthContext';

type ProductData = {
  name: string;
  value: number;
};

export default function TopProductsChart() {
  const [data, setData] = useState<ProductData[]>([]);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      const fetchData = async () => {
        try {
          const response = await api.get('/relatorios/produtos-mais-vendidos/');
          setData(response.data);
        } catch (error) {
          console.error("Erro ao buscar top produtos:", error);
        }
      };
      fetchData();
    }
  }, [isAuthenticated]);

  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ left: 20 }}>
          <XAxis type="number" hide />
          <YAxis 
            dataKey="name" 
            type="category" 
            axisLine={false} 
            tickLine={false} 
            fontSize={12} 
            width={80} 
            interval={0}
          />
          <Tooltip 
            formatter={(value: number, name: string) => [value, "Unidades"]} 
            cursor={{ fill: 'transparent' }} 
          />
          <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}