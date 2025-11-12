// src/components/layout/UserMenu.tsx
// (Arquivo Modificado - baseado no seu upload)

"use client";

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { ChevronDown, User, Settings, LogOut, LifeBuoy } from 'lucide-react';
import Image from 'next/image'; // <-- 1. IMPORTAR O IMAGE

// --- 2. URL DO BACKEND ---
// const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:8000';

export default function UserMenu() {
  // 3. PEGAR O 'userProfile' DO CONTEXTO
  const { userProfile, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 4. LÓGICA PARA EXIBIR NOME
  const getDisplayName = () => {
    if (userProfile) {
      if (userProfile.first_name) {
        return `${userProfile.first_name} ${userProfile.last_name || ''}`.trim();
      }
      return userProfile.username;
    }
    return 'Admin'; // Fallback
  };

  return (
    <div className="relative" ref={menuRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="flex items-center gap-2 p-2 rounded-full hover:bg-gray-100"
      >
        {/* --- 5. LÓGICA DE EXIBIÇÃO DA FOTO --- */}
        <span className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
          {userProfile?.profile_pic_url ? (
            <Image
            src={userProfile.profile_pic_url} 
            alt="Foto do Perfil"
            width={32}
            height={32}
            className="object-cover w-full h-full"
            unoptimized 
            onError={(e) => (e.currentTarget.style.display = 'none')} 
          />
          ) : (
            <User size={18} className="text-gray-600" />
          )}
        </span>

        <ChevronDown size={16} className="text-gray-500" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border z-20">
          <div className="p-4 border-b">
            <p className="text-sm font-medium text-gray-900 truncate">
              {/* 6. USAR A FUNÇÃO DE NOME */}
              {getDisplayName()}
            </p>
          </div>
          <nav className="p-2">
            <Link href="/perfil" onClick={() => setIsOpen(false)} className="flex items-center gap-3 px-3 py-2 text-gray-700 rounded-md hover:bg-gray-100">
              <User size={16} /> Editar Perfil
            </Link>
            <Link href="/empresa" onClick={() => setIsOpen(false)} className="flex items-center gap-3 px-3 py-2 text-gray-700 rounded-md hover:bg-gray-100">
              <Settings size={16} /> Configurações
            </Link>
            <Link href="/ajuda" onClick={() => setIsOpen(false)} className="flex items-center gap-3 px-3 py-2 text-gray-700 rounded-md hover:bg-gray-100">
              <LifeBuoy size={16} /> Ajuda
            </Link>
            <hr className="my-2" />
            <button 
              onClick={logout} 
              className="w-full flex items-center gap-3 px-3 py-2 text-red-600 rounded-md hover:bg-red-50"
            >
              <LogOut size={16} /> Sair
            </button>
          </nav>
        </div>
      )}
    </div>
  );
}