// src/app/(app)/pedidos/[id]/page.tsx

import { cookies } from "next/headers";
import { Pedido } from "@/types";
import PageHeader from "@/components/layout/PageHeader";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

async function getPedido(id: string): Promise<Pedido | null> {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get("access_token")?.value;
    if (!token) return null;

    const API_URL = process.env.INTERNAL_API_URL || 'http://127.0.0.1:8000/api'; 

    const response = await fetch(`${API_URL}/pedidos/${id}/`, {
      cache: "no-store",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) return null;
    return response.json();
  } catch (error) {
    console.error("Erro ao buscar pedido:", error);
    return null;
  }
}

const formatCurrency = (value: string | number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value) || 0);

const formatDate = (dateString?: string) =>
  dateString ? new Date(dateString).toLocaleString("pt-BR") : "-";

interface PedidoDetailPageProps {
  params: { id: string };
}

// 2. Use a interface na definição do seu componente
export default async function PedidoDetailPage({ params }: PedidoDetailPageProps) {
  const pedido = await getPedido(params.id);

  if (!pedido) {
    return <div className="p-8 text-center text-red-500">Pedido não encontrado.</div>;
  }

  // Itens podem ser de catálogo (com produto) ou manuais (sem produto)
  const itensDoPedido: any[] = Array.isArray((pedido as any).itens) ? (pedido as any).itens : [];

  const safeNumber = (v: any) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
    };

  const subtotal = itensDoPedido.reduce((acc: number, item: any) => acc + safeNumber(item?.subtotal), 0);

  const getItemNome = (item: any) =>
    item?.produto?.nome ?? item?.descricao_customizada ?? "Item manual";

  const getUnit = (item: any) => {
    const q = safeNumber(item?.quantidade);
    const sub = safeNumber(item?.subtotal);
    return q > 0 ? sub / q : 0;
  };

  return (
    <>
      <PageHeader title={`Pedidos`} />
      
      <div className="bg-white p-4 rounded-lg shadow-md mb-6 flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2 text-zinc-800">
          Detalhes do Pedido N-{pedido.id}
        </h2>
        <Link
          href="/pedidos"
          className="bg-white text-zinc-800 font-bold py-2 px-4 rounded-lg border hover:bg-gray-100 flex items-center gap-2"
        >
          <ArrowLeft size={18} /> Voltar
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="font-semibold text-zinc-800 mb-2">Dados do Pedido</h3>
          <p className="text-sm text-zinc-600">
            <strong>Data de Emissão:</strong> {formatDate(pedido.data_criacao as unknown as string)}
          </p>
          <p className="text-sm text-zinc-600">
            <strong>Status Produção:</strong> {pedido.status_producao}
          </p>
          <p className="text-sm text-zinc-600">
            <strong>Status Pagamento:</strong> {pedido.status_pagamento}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="font-semibold text-zinc-800 mb-2">Dados do Cliente</h3>
          <p className="text-sm text-zinc-600">
            <strong>Nome:</strong> {pedido.cliente?.nome}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="font-semibold text-zinc-800 mb-2">Histórico do Pedido</h3>
          <p className="text-sm text-zinc-600">
            {formatDate(pedido.data_criacao as unknown as string)} - {pedido.status_producao}
          </p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="font-semibold text-zinc-800 mb-4">Itens do Pedido</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm mb-4">
            <thead>
              <tr className="border-b">
                <th className="py-2 text-left font-medium text-zinc-500">Produto</th>
                <th className="py-2 text-right font-medium text-zinc-500">Preço</th>
                <th className="py-2 text-right font-medium text-zinc-500">Qtd.</th>
                <th className="py-2 text-right font-medium text-zinc-500">Total</th>
              </tr>
            </thead>
            <tbody>
              {itensDoPedido.map((item: any) => (
                <tr key={item.id} className="border-b">
                  <td className="py-3 font-medium text-zinc-800">
                    {getItemNome(item)}
                  </td>
                  <td className="py-3 text-right text-zinc-600">
                    {formatCurrency(getUnit(item))}
                  </td>
                  <td className="py-3 text-right text-zinc-600">
                    {safeNumber(item?.quantidade)}
                  </td>
                  <td className="py-3 text-right font-medium text-zinc-800">
                    {formatCurrency(safeNumber(item?.subtotal))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end">
          <div className="w-full max-w-xs space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-zinc-600">Subtotal:</span>
              <span className="font-medium text-zinc-800">{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between font-bold text-lg text-zinc-800 border-t pt-2">
              <span>Total:</span>
              <span>{formatCurrency(pedido.valor_total)}</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}