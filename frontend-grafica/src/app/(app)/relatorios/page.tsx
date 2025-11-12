// src/app/(app)/relatorios/page.tsx
// (Arquivo Modificado)

"use client";

import { useState } from "react";
import PageHeader from "@/components/layout/PageHeader";
import RelatorioClientes from "./RelatorioClientes";
import RelatorioPedidos from "./RelatorioPedidos";
import RelatorioOrcamentos from "./RelatorioOrcamentos";
import RelatorioProdutos from "./RelatorioProdutos";
import RelatorioFornecedores from "./RelatorioFornecedores"; // <-- IMPORTAR NOVO RELATÓRIO

const TABS = [
  { name: "Clientes", component: RelatorioClientes },
  { name: "Pedidos", component: RelatorioPedidos },
  { name: "Orçamentos", component: RelatorioOrcamentos }, 
  { name: "Produtos", component: RelatorioProdutos },
  { name: "Fornecedores", component: RelatorioFornecedores }, // <-- ADICIONAR NOVA ABA
];

export default function RelatoriosPage() {
  const [activeTab, setActiveTab] = useState("Clientes");

  const renderActiveTab = () => {
    const tab = TABS.find(t => t.name === activeTab);
    if (tab && tab.component) {
      return <tab.component />;
    }
    return <div className="p-4 text-center">Relatório em construção.</div>;
  };

  return (
    <>
      <PageHeader title="Central de Relatórios" />
      <p className="text-gray-600 mb-6 -mt-6">Acompanhe todos os indicadores e métricas da sua gráfica em tempo real.</p>
      
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-6 overflow-x-auto" aria-label="Tabs">
            {TABS.map((tab) => (
              <button
                key={tab.name}
                onClick={() => setActiveTab(tab.name)}
                className={`
                  ${activeTab === tab.name
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                  whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
                `}
              >
                {tab.name}
              </button>
            ))}
          </nav>
        </div>
      </div>

      <div>
        {renderActiveTab()}
      </div>
    </>
  );
}