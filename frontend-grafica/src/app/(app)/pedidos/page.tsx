
import { Pedido, PaginatedResponse } from "@/types";
import PageHeader from "@/components/layout/PageHeader";
import { cookies } from 'next/headers';
import OrderList from "./OrderList";

const API_URL = process.env.INTERNAL_API_URL || 'http://127.0.0.1:8000/api';

async function getPedidos(): Promise<PaginatedResponse<Pedido>> {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('access_token')?.value;
    if (!token) {
      return { count: 0, next: null, previous: null, results: [] };
    }


    const response = await fetch(`${API_URL}/pedidos/`, { 
      cache: 'no-store',
      headers: { 'Authorization': `Bearer ${token}` } 
    });


    if (!response.ok) {
      console.error('Falha ao buscar pedidos:', response.statusText);
      return { count: 0, next: null, previous: null, results: [] };
    }

    return response.json(); 
  } catch (error) {
    console.error("Erro de conexão ao buscar pedidos:", error);
    return { count: 0, next: null, previous: null, results: [] };
  }
}

export default async function PedidosPage() {
  const pedidosResponse = await getPedidos();

  return (
    <>
      <PageHeader title="Pedidos" />
      <OrderList initialData={pedidosResponse} />
    </>
  );
}