// src/app/page.tsx

import PageHeader from "@/components/layout/PageHeader";
import StatCard from "@/components/dashboard/StatCard";
import { DollarSign, TrendingDown, TrendingUp, CircleDollarSign, Wallet, Landmark, CreditCard, Ticket, MessageSquare, Eye, Edit2 } from "lucide-react";

// Dados de exemplo para as listas
const vendasRecentes = [
  { pedido: '103387', cliente: 'Isoplost - Marketing', valor: 'R$ 1.500,00' },
  { pedido: '103344', cliente: 'Bruno Barbecho Mustoche', valor: 'R$ 121,90' },
];

const faturamentoPorPagamento = [
  { metodo: 'Dinheiro em Espécie', valor: 'R$ 3,00', percentual: '0.17%', Icon: Wallet, color: 'text-green-500' },
  { metodo: 'Pix/Transferência', valor: 'R$ 1.738,00', percentual: '98.75%', Icon: Landmark, color: 'text-blue-500' },
  { metodo: 'Cartão', valor: 'R$ 0,00', percentual: '0.00%', Icon: CreditCard, color: 'text-pink-500' },
  { metodo: 'Boleto', valor: 'R$ 0,00', percentual: '0.00%', Icon: Ticket, color: 'text-gray-500' },
];

export default function DashboardPage() {
  const mesAtual = new Date().toLocaleString('pt-BR', { month: 'long' });

  return (
    <>
      <PageHeader title="Dashboard" />
      
      {/* Filtro de Data */}
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-700">Faturamento de {mesAtual.charAt(0).toUpperCase() + mesAtual.slice(1)}</h2>
        <button className="text-sm font-medium bg-white border rounded-md px-3 py-1.5 hover:bg-gray-50">
          Mês Atual
        </button>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <StatCard title="Faturamento" value="R$ 2.489,00" Icon={DollarSign} color="blue" />
        <StatCard title="Despesas" value="R$ 921,44" Icon={TrendingDown} color="red" />
        <StatCard title="Lucro" value="R$ 1.567,56" Icon={TrendingUp} color="green" />
        <StatCard title="Valor a Receber" value="R$ 950,00" Icon={CircleDollarSign} color="orange" />
      </div>

      {/* Seção Principal (Vendas e Pagamentos) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Card de Vendas Recentes */}
        <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Vendas Recentes</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="py-2 text-left font-medium text-gray-500">Pedido</th>
                  <th className="py-2 text-left font-medium text-gray-500">Cliente</th>
                  <th className="py-2 text-left font-medium text-gray-500">Valor</th>
                  <th className="py-2 text-left font-medium text-gray-500">Ações</th>
                </tr>
              </thead>
              <tbody>
                {vendasRecentes.map((venda, index) => (
                  <tr key={index} className="border-b">
                    <td className="py-3 text-gray-700">{venda.pedido}</td>
                    <td className="py-3 text-gray-900 font-medium">{venda.cliente}</td>
                    <td className="py-3 text-gray-700">{venda.valor}</td>
                    <td className="py-3">
                      <div className="flex items-center gap-3 text-gray-500">
                        <button className="hover:text-green-500"><MessageSquare size={16} /></button>
                        <button className="hover:text-blue-500"><Eye size={16} /></button>
                        <button className="hover:text-yellow-500"><Edit2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        
        {/* Card de Faturamento por Pagamento */}
        <div className="lg:col-span-1 bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Faturamento por Pagamento</h3>
          <div className="space-y-4">
            {faturamentoPorPagamento.map((pagamento) => (
              <div key={pagamento.metodo}>
                <div className="flex items-center gap-3 mb-1">
                  <pagamento.Icon className={`h-5 w-5 ${pagamento.color}`} />
                  <span className="text-gray-600 font-medium">{pagamento.metodo}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-800 font-bold">{pagamento.valor}</span>
                  <span className="text-xs text-gray-500">{pagamento.percentual}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Card de Lançamentos do Dia (Simplificado) */}
      <div className="mt-6 bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Lançamentos de hoje {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</h3>
        {/* Aqui entraria um componente de gráfico no futuro */}
        <div className="h-20 bg-gray-100 rounded-md flex items-center justify-center text-gray-500">
          (Gráfico de Entradas e Saídas)
        </div>
      </div>
    </>
  );
}