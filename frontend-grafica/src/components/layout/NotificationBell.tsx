"use client";

import { useState, useEffect, useRef } from 'react';
import { useAuth, NotificationType } from '@/contexts/AuthContext';
import Link from 'next/link';
import { Bell, AlertTriangle, Package, Check } from 'lucide-react';

// Função para formatar o tempo (ex: "5m atrás", "2h atrás")
function formatTimeAgo(dateString: string) {
  const now = new Date();
  const date = new Date(dateString);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + "a";
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + "m";
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + "d";
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + "h";
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + "min";
  return Math.floor(seconds) + "s";
}

// Ícone baseado no tipo de mensagem
function getIcon(mensagem: string) {
  if (mensagem.includes('atrasado')) {
    return <AlertTriangle className="h-5 w-5 text-red-500" />;
  }
  if (mensagem.includes('Estoque')) {
    return <Package className="h-5 w-5 text-yellow-500" />;
  }
  // --- ADIÇÃO --- (Para arte aprovada/rejeitada)
  if (mensagem.includes('APROVADA')) {
    return <Check className="h-5 w-5 text-green-500" />;
  }
  return <Bell className="h-5 w-5 text-blue-500" />;
}

export default function NotificationBell() {
  const { 
    notifications, 
    notificationCount, 
    markAllNotificationsAsRead,
    fetchNotifications // <-- 1. IMPORTAR A FUNÇÃO
  } = useAuth();
  
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Lógica para fechar o menu ao clicar fora (igual ao UserMenu)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggle = () => {
    // --- 2. ADICIONAR LÓGICA DE ATUALIZAÇÃO ---
    if (!isOpen) {
      // Se estiver fechado e for abrir:
      // 1. Busca as notificações mais recentes
      fetchNotifications();
      // 2. Se tiver contador, marca como lidas (após um pequeno delay)
      if (notificationCount > 0) {
        setTimeout(() => {
            markAllNotificationsAsRead();
        }, 1500); // Dá 1.5s para o usuário ver o balão antes de zerar
      }
    }
    // ----------------------------------------
    setIsOpen(!isOpen);
  };
  
  const unreadNotifications = notifications.filter(n => !n.lida);
  const readNotifications = notifications.filter(n => n.lida);

  return (
    <div className="relative" ref={menuRef}>
      <button 
        onClick={handleToggle} 
        className="relative text-gray-500 hover:text-gray-800 p-2 rounded-full hover:bg-gray-100"
      >
        <Bell size={24} />
        {/* O contador de notificações não lidas */}
        {notificationCount > 0 && (
          <span className="absolute top-0 right-0 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
            {notificationCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 max-h-[80vh] flex flex-col bg-white rounded-lg shadow-lg border z-20">
          <div className="p-4 border-b flex justify-between items-center">
            <h3 className="text-sm font-medium text-gray-900">
              Notificações
            </h3>
            {/* Movido o botão de limpar para ser visível mesmo com count > 0 */}
            <button 
              onClick={markAllNotificationsAsRead}
              className="text-xs text-blue-600 hover:underline"
              disabled={notifications.filter(n => !n.lida).length === 0}
            >
              Marcar como lidas
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-sm text-gray-500">
                Nenhuma notificação por aqui.
              </div>
            ) : (
              <nav className="divide-y">
                {/* Mostra primeiro as não lidas */}
                {unreadNotifications.map(notif => (
                  <NotificationItem key={notif.id} notif={notif} onClick={() => setIsOpen(false)} />
                ))}
                {/* Depois as lidas */}
                {readNotifications.map(notif => (
                  <NotificationItem key={notif.id} notif={notif} onClick={() => setIsOpen(false)} />
                ))}
              </nav>
            )}
          </div>
          
          <div className="p-2 border-t text-center">
             <Link href="/notificacoes" onClick={() => setIsOpen(false)} className="text-sm text-blue-600 hover:underline">
               Ver todas
             </Link>
          </div>
        </div>
      )}
    </div>
  );
}

// Componente de item individual
function NotificationItem({ notif, onClick }: { notif: NotificationType, onClick: () => void }) {
  const content = (
    <div 
      className={`flex items-start gap-3 p-3 transition-colors ${notif.lida ? 'bg-white text-gray-500' : 'bg-blue-50 font-medium text-gray-800'} hover:bg-gray-100`}
      onClick={onClick}
    >
      <div className="flex-shrink-0 mt-1">
        {getIcon(notif.mensagem)}
      </div>
      <div className="flex-1">
        <p className="text-sm">{notif.mensagem}</p>
        <span className="text-xs text-gray-400">
          {formatTimeAgo(notif.data_criacao)}
        </span>
      </div>
      {!notif.lida && (
        <div className="w-2 h-2 rounded-full bg-blue-500 self-center" title="Não lida"></div>
      )}
    </div>
  );

  if (notif.link) {
    return (
      <Link href={notif.link} className="block cursor-pointer">
        {content}
      </Link>
    );
  }
  
  return (
    <div className="block cursor-default">
      {content}
    </div>
  );
}