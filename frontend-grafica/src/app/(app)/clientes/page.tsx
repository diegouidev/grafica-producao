// src/app/(app)/clientes/page.tsx

import { Cliente, PaginatedResponse } from "@/types";
import PageHeader from "@/components/layout/PageHeader";
import { cookies } from 'next/headers';
import ClientList from "./ClientList";

// A função agora promete retornar o objeto de paginação completo
async function getClientes(): Promise<PaginatedResponse<Cliente>> {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('access_token')?.value;
    if (!token) {
      return { count: 0, next: null, previous: null, results: [] };
    }

    const API_URL = process.env.INTERNAL_API_URL || 'http://127.0.0.1:8000/api';

    const response = await fetch(`${API_URL}/clientes/`, { 
      cache: 'no-store',
      headers: { 'Authorization': `Bearer ${token}` } 
    });

    if (!response.ok) {
      console.error('Falha ao buscar clientes:', response.statusText);
      return { count: 0, next: null, previous: null, results: [] };
    }

    // Retornamos o JSON completo da API
    return response.json(); 
  } catch (error) {
    console.error("Erro de conexão ao buscar clientes:", error);
    return { count: 0, next: null, previous: null, results: [] };
  }
}

export default async function ClientesPage() {
  const clientesResponse = await getClientes();

  return (
    <>
      <PageHeader title="Clientes" />
      {/* Passamos o objeto de resposta completo para o componente de lista */}
      <ClientList initialData={clientesResponse} />
    </>
  );
}