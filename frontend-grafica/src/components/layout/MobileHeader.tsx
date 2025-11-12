// src/components/layout/MobileHeader.tsx

"use client";

import { Menu } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import Image from 'next/image';

type MobileHeaderProps = {
  onMenuClick: () => void;
};

const BACKEND_URL = 'http://127.0.0.1:8000';

export default function MobileHeader({ onMenuClick }: MobileHeaderProps) {
  const { empresaData } = useAuth();

  return (
    // Este header só é visível em telas pequenas (md:hidden)
    <header className="bg-white shadow-md p-4 flex items-center justify-between md:hidden sticky top-0 z-10">
      {/* Logo */}
      <div className="flex items-center gap-2">
        {empresaData?.logo_pequena_dashboard ? (
          <Image 
            src={`${BACKEND_URL}${empresaData.logo_pequena_dashboard}`}
            alt="Logo"
            width={100}
            height={100}
            unoptimized
            className="object-contain"
          />
        ) : (
          <span className="text-lg font-bold text-blue-600">
            {empresaData?.nome_empresa || 'Cloud Gráfica'}
          </span>
        )}
      </div>

      {/* Botão de Menu (Hambúrguer) */}
      <button onClick={onMenuClick} className="text-gray-700">
        <Menu size={24} />
      </button>
    </header>
  );
}