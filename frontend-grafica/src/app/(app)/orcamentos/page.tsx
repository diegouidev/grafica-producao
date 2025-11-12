// src/app/(app)/orcamentos/page.tsx

import { Orcamento, PaginatedResponse } from "@/types";
import PageHeader from "@/components/layout/PageHeader";
import { cookies } from 'next/headers';
import QuoteList from "./QuoteList";

async function getOrcamentos(): Promise<PaginatedResponse<Orcamento>> {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('access_token')?.value;
    if (!token) {
      return { count: 0, next: null, previous: null, results: [] };
    }

    const API_URL = process.env.INTERNAL_API_URL || 'http://127.0.0.1:8000/api';

    const response = await fetch(`${API_URL}/orcamentos/`, {
      cache: 'no-store',
      headers: { 'Authorization': `Bearer ${token}` } 
    });

    if (!response.ok) {
      console.error('Falha ao buscar orçamentos:', response.statusText);
      return { count: 0, next: null, previous: null, results: [] };
    }

    return response.json(); 
  } catch (error) {
    console.error("Erro de conexão ao buscar orçamentos:", error);
    return { count: 0, next: null, previous: null, results: [] };
  }
}

export default async function OrcamentosPage() {
  const orcamentosResponse = await getOrcamentos();

  return (
    <>
      <PageHeader title="Orçamentos" />
      <QuoteList initialData={orcamentosResponse} />
    </>
  );
}