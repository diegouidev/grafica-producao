// src/components/layout/Sidebar.tsx
// (Arquivo Modificado)

"use client";

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext'; // <-- 1. useAuth já está importado
// --- 2. Ícones (sem alteração) ---
import { BarChart, Home, Package, Receipt, Users, X, ShoppingCart, Wrench, Building2, Tag, KanbanIcon, PiggyBank } from 'lucide-react';

// --- 3. ADICIONAR A PROPRIEDADE 'roles' AOS ITENS DE NAVEGAÇÃO ---
// Esta propriedade define QUEM PODE VER o link.
// Se 'roles' não for definido (ou for vazio), todos logados podem ver.
// Se 'roles' for ['Admin'], só o Admin pode ver.
// Se 'roles' for ['Admin', 'Producao'], Admin ou Produção podem ver.
const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: Home, roles: [] }, // Todos logados
  { href: '/pedidos', label: 'Pedidos', icon: ShoppingCart, roles: ['Admin', 'Atendimento', 'Financeiro'] },
  { href: '/orcamentos', label: 'Orçamentos', icon: Receipt, roles: ['Admin', 'Atendimento', 'Financeiro'] },
  { href: '/clientes', label: 'Clientes', icon: Users, roles: ['Admin', 'Atendimento'] },
  { href: '/produtos', label: 'Produtos', icon: Package, roles: ['Admin', 'Atendimento', 'Produção'] }, // Todos menos financeiro, por ex.
  { href: '/fornecedores', label: 'Fornecedores', icon: Wrench, roles: ['Admin', 'Financeiro'] },
  { href: '/financeiro', label: 'Financeiro', icon: PiggyBank, roles: ['Admin', 'Financeiro'] },
  { href: '/despesas', label: 'Despesas Gerais', icon: Receipt, roles: ['Admin', 'Financeiro'] },
  { href: '/relatorios', label: 'Relatórios', icon: BarChart, roles: ['Admin', 'Financeiro'] },
  { href: '/producao', label: 'Produção', icon: KanbanIcon, roles: ['Admin', 'Atendimento', 'Produção'] },
  { href: '/etiquetas', label: 'Etiquetas', icon: Tag, roles: [] }, // Todos logados
  { href: '/empresa', label: 'Empresa', icon: Building2, roles: ['Admin'] }, // Só Admin
  { href: '/perfil', label: 'Perfil', icon: Users, roles: [] }, // Todos logados
];
// -----------------------------------------------------------------

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://92.112.176.145';

type SidebarProps = {
  isMobileOpen: boolean;
  onClose: () => void;
};

export default function Sidebar({ isMobileOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  // --- 4. PEGAR O 'hasRole' DO CONTEXTO ---
  const { empresaData, hasRole } = useAuth();
  // ---------------------------------------

  return (
    <>
      {/* Fundo escuro (overlay) para o menu mobile */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={onClose}
        ></div>
      )}

      {/* O Sidebar em si */}
      <aside 
        className={`
          fixed top-0 left-0 z-50 h-screen w-64 bg-white shadow-xl 
          transition-transform duration-300 ease-in-out
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'} 
          md:translate-x-0 
        `}
      >
        {/* Logo (Desktop) */}
        <div className="flex h-20 items-center justify-center border-b px-4">
          <Link href="/dashboard" className="flex items-center gap-2">
            {empresaData?.logo_grande_dashboard ? (
              <Image 
                src={`${BACKEND_URL}${empresaData.logo_grande_dashboard}`}
                alt="Logo da Empresa"
                width={150}
                height={150}
                unoptimized
                className="object-contain"
              />
            ) : null}
            
          </Link>
          {/* Botão de Fechar (Mobile) */}
          <button onClick={onClose} className="text-gray-700 md:hidden">
            <X size={24} />
          </button>
        </div>

        {/* Navegação */}
        <nav className="flex-1 space-y-2 p-4">
          {/* --- 5. ADICIONAR O FILTRO ANTES DO .map() --- */}
          {navItems
            .filter(item => {
              // Se 'roles' não existe ou está vazio, mostra para todos.
              if (!item.roles || item.roles.length === 0) {
                return true;
              }
              // Caso contrário, verifica se o usuário tem a permissão
              return hasRole(item.roles);
            })
            .map((item) => {
              const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={onClose} // Fecha o menu ao clicar em um link no mobile
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all ${
                    isActive
                      ? 'bg-blue-100 text-blue-600'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
          {/* --- FIM DA LÓGICA DE RENDERIZAÇÃO --- */}
        </nav>
      </aside>
    </>
  );
}
