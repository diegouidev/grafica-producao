
"use client";

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { FluxoCaixaData } from '@/types';
import { toast } from 'react-toastify';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { Loader2 } from 'lucide-react';

const formatDateForAPI = (date: Date) => date.toISOString().split('T')[0];
const formatCurrency = (value: number | string) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value) || 0);
const formatDateForChart = (dateStr: string) => {
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}`;
}

const filtroOptions = ['Mês Atual', 'Últimos 30 dias', 'Personalizado'];

export default function FluxoCaixaChart() {
  const [data, setData] = useState<FluxoCaixaData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [filtroAtivo, setFiltroAtivo] = useState('Mês Atual');

  const fetchFluxoCaixa = async (inicio: string, fim: string) => {
    setIsLoading(true);
    try {
      const params = { data_inicio: inicio, data_fim: fim };
      const response = await api.get('/relatorios/fluxo-caixa/', { params });
      
      // --- INÍCIO DA CORREÇÃO ---
      // A API envia decimais como strings ("750.00").
      // Precisamos convertê-los para números para o 'reduce' funcionar.
      const parsedData: FluxoCaixaData[] = response.data.map((item: any) => ({
        date: item.date,
        inflows: Number(item.inflows) || 0,
        outflows: Number(item.outflows) || 0
      }));
      setData(parsedData);
      // --- FIM DA CORREÇÃO ---

    } catch (error) {
      console.error("Erro ao buscar dados do fluxo de caixa:", error);
      toast.error("Não foi possível carregar o gráfico de fluxo de caixa.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Carga inicial
    handleFiltroChange('Mês Atual');
  }, []);

  const handleFiltroChange = (filtro: string) => {
    setFiltroAtivo(filtro);
    const hoje = new Date();
    let inicio = hoje;
    const fim = hoje;

    if (filtro === 'Mês Atual') {
      inicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    } else if (filtro === 'Últimos 30 dias') {
      // Corrigindo para subtrair 30 dias
      inicio = new Date(new Date().setDate(hoje.getDate() - 30));
    }
    
    if (filtro !== 'Personalizado') {
      const inicioStr = formatDateForAPI(inicio);
      const fimStr = formatDateForAPI(fim);
      setDataInicio(inicioStr);
      setDataFim(fimStr);
      fetchFluxoCaixa(inicioStr, fimStr);
    }
  };

  const handleFiltroPersonalizado = () => {
    if (dataInicio && dataFim) {
      setFiltroAtivo('Personalizado');
      fetchFluxoCaixa(dataInicio, dataFim);
    } else {
      toast.error("Por favor, selecione as duas datas.");
    }
  };
  
  // Agora que 'data' contém NÚMEROS, esta soma funcionará corretamente.
  const totalInflows = data.reduce((acc, item) => acc + item.inflows, 0);
  const totalOutflows = data.reduce((acc, item) => acc + item.outflows, 0);
  const saldo = totalInflows - totalOutflows;

  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded-lg shadow-md flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-lg font-semibold text-gray-700">
          Fluxo de Caixa
        </h3>
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
      
      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-5 rounded-lg shadow-md">
          <p className="text-sm font-medium text-gray-500">Total de Entradas</p>
          <p className="text-3xl font-bold text-green-600">{formatCurrency(totalInflows)}</p>
        </div>
        <div className="bg-white p-5 rounded-lg shadow-md">
          <p className="text-sm font-medium text-gray-500">Total de Saídas</p>
          <p className="text-3xl font-bold text-red-600">{formatCurrency(totalOutflows)}</p>
        </div>
        <div className="bg-white p-5 rounded-lg shadow-md">
          <p className="text-sm font-medium text-gray-500">Saldo do Período</p>
          <p className={`text-3xl font-bold ${saldo >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
            {formatCurrency(saldo)}
          </p>
        </div>
      </div>

      {/* Gráfico */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold text-zinc-800 mb-4">Entradas vs. Saídas por Dia</h3>
        {isLoading ? (
          <div className="h-80 flex items-center justify-center">
            <Loader2 className="animate-spin text-blue-500" size={32} />
          </div>
        ) : (
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis dataKey="date" tickFormatter={formatDateForChart} fontSize={12} />
                <YAxis tickFormatter={(val) => `R$ ${val / 1000}k`} fontSize={12} />
                <Tooltip formatter={(value: number) => [formatCurrency(value), ""]} />
                <Legend />
                <Bar dataKey="inflows" name="Entradas" fill="#22c55e" radius={[4, 4, 0, 0]} />
                <Bar dataKey="outflows" name="Saídas" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}