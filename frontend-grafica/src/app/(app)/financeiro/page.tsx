// src/app/(app)/financeiro/page.tsx
// (Novo Arquivo)

import { cookies } from 'next/headers';
import PageHeader from "@/components/layout/PageHeader";
import { ContaAPagar, ContasAReceber } from "@/types";
import FinanceiroDashboard from "./FinanceiroDashboard"; // Nosso novo componente de cliente

const API_URL = process.env.INTERNAL_API_URL || 'http://127.0.0.1:8000/api';

// Busca Contas a Pagar
async function getContasAPagar(): Promise<ContaAPagar[]> { 
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('access_token')?.value;
    if (!token) return [];

    const response = await fetch(`${API_URL}/contas-a-pagar/`, { 
      cache: 'no-store',
      headers: { 'Authorization': `Bearer ${token}` } 
    });

    if (!response.ok) {
        console.error("Falha ao buscar contas a pagar", response.statusText);
        return [];
    };
    return response.json();
  } catch (error) {
    console.error("Erro de conexão ao buscar contas a pagar", error);
    return [];
  }
}

// Busca Contas a Receber
async function getContasAReceber(): Promise<ContasAReceber[]> { 
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('access_token')?.value;
    if (!token) return [];

    const response = await fetch(`${API_URL}/contas-a-receber/`, { 
      cache: 'no-store',
      headers: { 'Authorization': `Bearer ${token}` } 
    });

    if (!response.ok) {
        console.error("Falha ao buscar contas a receber", response.statusText);
        return [];
    };
    return response.json();
  } catch (error) {
    console.error("Erro de conexão ao buscar contas a receber", error);
    return [];
  }
}


export default async function FinanceiroPage() {
  // Busca os dados iniciais no servidor
  const [contasAPagar, contasAReceber] = await Promise.all([
    getContasAPagar(),
    getContasAReceber()
  ]);

  return (
    <>
      <PageHeader title="Financeiro" />
      <FinanceiroDashboard
        initialContasAPagar={contasAPagar}
        initialContasAReceber={contasAReceber}
      />
    </>
  );
}