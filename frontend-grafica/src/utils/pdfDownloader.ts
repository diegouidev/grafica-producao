// src/utils/pdfDownloader.ts

import { api } from "@/lib/api";

export const handleDownloadPdf = async (apiUrl: string, filename: string) => {
  try {
    const response = await api.get(apiUrl, {
      responseType: 'blob', // Essencial para tratar a resposta como um arquivo
    });

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    
    link.parentNode?.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error(`Erro ao gerar o PDF de ${apiUrl}:`, error);
    alert('Não foi possível gerar o PDF.');
  }
};