// src/app/(app)/produtos/page.tsx

import { Produto, PaginatedResponse } from "@/types";
import PageHeader from "@/components/layout/PageHeader";
import { cookies } from 'next/headers';
import ProductList from "./ProductList";

async function getProdutos(): Promise<PaginatedResponse<Produto>> {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('access_token')?.value;
    if (!token) {
      return { count: 0, next: null, previous: null, results: [] };
    }

    const API_URL = process.env.INTERNAL_API_URL || 'http://127.0.0.1:8000/api';

    const response = await fetch(`${API_URL}/produtos/`, {
      cache: 'no-store',
      headers: { 'Authorization': `Bearer ${token}` } 
    });

    if (!response.ok) {
      console.error('Falha ao buscar produtos:', response.statusText);
      return { count: 0, next: null, previous: null, results: [] };
    }

    return response.json(); 
  } catch (error) {
    console.error("Erro de conexão ao buscar produtos:", error);
    return { count: 0, next: null, previous: null, results: [] };
  }
}

export default async function ProdutosPage() {
  const produtosResponse = await getProdutos();

  return (
    <>
      <PageHeader title="Produtos" />
      <ProductList initialData={produtosResponse} />
    </>
  );
}