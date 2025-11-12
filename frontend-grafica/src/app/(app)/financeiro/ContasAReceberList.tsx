// src/app/(app)/financeiro/ContasAReceberList.tsx
// (Novo Arquivo)

"use client";

import { useState } from "react"; 
import { useRouter } from "next/navigation";
import { ContasAReceber } from "@/types";
import { toast } from 'react-toastify';
import Link from 'next/link';

type ContasAReceberListProps = {
  initialData: ContasAReceber[];
};

export default function ContasAReceberList({ initialData }: ContasAReceberListProps) {
  const router = useRouter();
  const [contas, setContas] = useState<ContasAReceber[]>(initialData);
  
  const formatCurrency = (value: string | number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value));
  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('pt-BR', { timeZone: 'UTC' });

  const totalAReceber = contas.reduce((acc, conta) => acc + parseFloat(conta.valor_a_receber), 0);

  return (
    <>
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left font-semibold text-gray-600 uppercase">Pedido</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-600 uppercase">Cliente</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-600 uppercase">Data</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-600 uppercase">Status Pag.</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-600 uppercase">Valor Total</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-600 uppercase">Valor a Receber</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-600 uppercase">Ação</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {contas.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-10 text-gray-500">Nenhuma conta a receber.</td></tr>
              ) : (
                contas.map((conta: ContasAReceber) => (
                  <tr key={conta.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-blue-600">#{conta.id}</td>
                    <td className="px-6 py-4 font-medium text-gray-900">{conta.cliente_nome}</td>
                    <td className="px-6 py-4 text-gray-500 whitespace-nowrap">{formatDate(conta.data_criacao)}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        conta.status_pagamento === 'PENDENTE' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {conta.status_pagamento}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-700">{formatCurrency(conta.valor_total)}</td>
                    <td className="px-6 py-4 text-red-600 font-bold">{formatCurrency(conta.valor_a_receber)}</td>
                    <td className="px-6 py-4">
                      <Link
                        href={`/pedidos/${conta.id}/editar`}
                        className="bg-blue-500 text-white font-bold py-1 px-3 rounded-lg text-xs hover:bg-blue-600"
                      >
                        Receber
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            <tfoot className="bg-gray-50 border-t-2">
              <tr>
                <td colSpan={5} className="px-6 py-3 text-right font-bold text-gray-700 uppercase">Total a Receber:</td>
                <td className="px-6 py-3 font-bold text-lg text-green-600">{formatCurrency(totalAReceber)}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </>
  );
}