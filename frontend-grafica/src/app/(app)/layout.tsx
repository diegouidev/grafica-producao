// src/app/(app)/layout.tsx

"use client"; // 1. Convertido para Client Component para gerenciar estado

import { useState } from 'react';
import Sidebar from "@/components/layout/Sidebar";
import MobileHeader from '@/components/layout/MobileHeader'; // 2. Importamos o novo cabeçalho mobile
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 3. Estado para controlar o menu mobile
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="flex min-h-screen">
      {/* 4. O Sidebar agora é inteligente e recebe o estado */}
      <Sidebar 
        isMobileOpen={isMobileMenuOpen} 
        onClose={() => setIsMobileMenuOpen(false)} 
      />

      <div className="flex-1 flex flex-col">
        {/* 5. Renderiza o cabeçalho APENAS em telas pequenas (md:hidden) */}
        <MobileHeader onMenuClick={() => setIsMobileMenuOpen(true)} />

        {/* 6. O conteúdo principal agora é responsivo:
            - ml-0 (sem margem) em telas pequenas
            - md:ml-64 (margem de 64) em telas de desktop (medium e acima)
            - p-4 (padding 4) em telas pequenas, p-8 em desktop
        */}
        <main className="flex-1 p-4 md:p-8 ml-0 md:ml-64">
          {children}
        </main>
      </div>

      {/* 7. O ToastContainer é mantido no layout */}
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </div>
  );
}