import { cookies } from 'next/headers';
import PageHeader from "@/components/layout/PageHeader";
import { PaginatedResponse } from "@/types"; // Importando dos seus tipos
import { EtiquetaPortaria } from "@/types"; // Importando dos seus tipos
import EtiquetaList from "./EtiquetaList"; // Nosso novo componente de lista

async function getEtiquetas(): Promise<PaginatedResponse<EtiquetaPortaria>> {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('access_token')?.value;
    if (!token) {
      return { count: 0, next: null, previous: null, results: [] };
    }

    const API_URL = process.env.INTERNAL_API_URL || 'http://127.0.0.1:8000/api';

    // Usamos o novo endpoint 'etiquetas-portaria'
    const response = await fetch(`${API_URL}/etiquetas-portaria/`, { 
      cache: 'no-store',
      headers: { 'Authorization': `Bearer ${token}` } 
    });

    if (!response.ok) {
      console.error('Falha ao buscar etiquetas:', response.statusText);
      return { count: 0, next: null, previous: null, results: [] };
    }

    return response.json(); 
  } catch (error) {
    console.error("Erro de conexão ao buscar etiquetas:", error);
    return { count: 0, next: null, previous: null, results: [] };
  }
}

export default async function EtiquetasPage() {
  const etiquetasResponse = await getEtiquetas();

  return (
    <>
      <PageHeader title="Etiquetas de Portaria" />
      <EtiquetaList initialData={etiquetasResponse} />
    </>
  );
}