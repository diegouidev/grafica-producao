// src/app/(app)/financeiro/FinanceiroDashboard.tsx
// (Novo Arquivo)

"use client";

import { useState } from 'react';
import { ContaAPagar, ContasAReceber } from '@/types';
import { TrendingUp, TrendingDown, LayoutGrid, BarChart3 } from 'lucide-react';

// Importando os componentes das abas
import ContasAPagarList from '@/app/(app)/contas-a-pagar/ContasAPagarList'; // <-- O componente existente
import ContasAReceberList from './ContasAReceberList'; // <-- Novo componente
import FluxoCaixaChart from './FluxoCaixaChart'; // <-- Novo componente

type FinanceiroDashboardProps = {
  initialContasAPagar: ContaAPagar[];
  initialContasAReceber: ContasAReceber[];
};

type Tab = 'fluxo' | 'receber' | 'pagar';

export default function FinanceiroDashboard({
  initialContasAPagar,
  initialContasAReceber
}: FinanceiroDashboardProps) {
  
  const [activeTab, setActiveTab] = useState<Tab>('fluxo');

  // Os dados iniciais são passados para os componentes filhos
  
  return (
    <div>
      {/* Abas de Navegação */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex space-x-6" aria-label="Tabs">
          <TabButton
            icon={BarChart3}
            label="Fluxo de Caixa"
            isActive={activeTab === 'fluxo'}
            onClick={() => setActiveTab('fluxo')}
          />
          <TabButton
            icon={TrendingUp}
            label="Contas a Receber"
            isActive={activeTab === 'receber'}
            onClick={() => setActiveTab('receber')}
            count={initialContasAReceber.length}
          />
          <TabButton
            icon={TrendingDown}
            label="Contas a Pagar"
            isActive={activeTab === 'pagar'}
            onClick={() => setActiveTab('pagar')}
            count={initialContasAPagar.length}
          />
        </nav>
      </div>
      
      {/* Conteúdo das Abas */}
      <div>
        <div className={activeTab === 'fluxo' ? 'block' : 'hidden'}>
          <FluxoCaixaChart />
        </div>
        
        <div className={activeTab === 'receber' ? 'block' : 'hidden'}>
          <ContasAReceberList initialData={initialContasAReceber} />
        </div>

        <div className={activeTab === 'pagar' ? 'block' : 'hidden'}>
          {/* Agora o ContasAPagarList é renderizado aqui dentro */}
          <ContasAPagarList initialContas={initialContasAPagar} />
        </div>
      </div>
    </div>
  );
}


// Componente de botão de aba
function TabButton({ icon: Icon, label, isActive, onClick, count }: any) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        ${isActive ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
        whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2
      `}
    >
      <Icon size={16} />
      {label}
      {count !== undefined && (
        <span className={`ml-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
          isActive ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
        }`}>
          {count}
        </span>
      )}
    </button>
  );
}