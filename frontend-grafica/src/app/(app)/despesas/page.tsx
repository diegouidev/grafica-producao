// src/app/(app)/despesas/page.tsx

import PageHeader from "@/components/layout/PageHeader";
import { cookies } from 'next/headers';
import ExpenseList from "./ExpenseList";

// A API de despesas consolidadas retorna um array simples, não um objeto paginado
async function getDespesas(): Promise<any[]> { 
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('access_token')?.value;
    if (!token) return [];

    const API_URL = process.env.INTERNAL_API_URL || 'http://127.0.0.1:8000/api';

    const response = await fetch(`${API_URL}/despesas/`, { 
      cache: 'no-store',
      headers: { 'Authorization': `Bearer ${token}` } 
    });

    if (!response.ok) {
        console.error("Falha ao buscar despesas", response.statusText);
        return [];
    };
    return response.json();
  } catch (error) {
    console.error("Erro de conexão ao buscar despesas", error);
    return [];
  }
}

export default async function DespesasPage() {
  const despesas = await getDespesas();

  return (
    <>
      <PageHeader title="Despesas" />
      <ExpenseList initialDespesas={despesas} />
    </>
  );
}