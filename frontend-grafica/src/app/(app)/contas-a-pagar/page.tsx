// src/app/(app)/contas-a-pagar/page.tsx
// (Arquivo Modificado para redirecionar)

import { redirect } from 'next/navigation';

export default async function ContasAPagarPage() {
  // Redireciona permanentemente para a nova página financeira,
  // especificamente para a aba de contas a pagar.
  // (O frontend cuidará de abrir a aba correta com base no hash,
  // mas por enquanto, só redirecionamos para a raiz do financeiro)
  redirect('/financeiro');

  // O código antigo de busca e renderização não é mais necessário aqui.
}