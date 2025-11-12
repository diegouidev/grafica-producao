
"use client";

import PageHeader from "@/components/layout/PageHeader";
import { useAuth, NotificationType } from "@/contexts/AuthContext";
import { AlertTriangle, Package, Check, BellRing, BellOff } from "lucide-react";
import Link from "next/link";

// Função para formatar o tempo (ex: "5m atrás", "2h atrás")
function formatTime(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// Ícone baseado no tipo de mensagem
function getIcon(mensagem: string) {
  if (mensagem.includes('atrasado')) {
    return <AlertTriangle className="h-6 w-6 text-red-500" />;
  }
  if (mensagem.includes('Estoque')) {
    return <Package className="h-6 w-6 text-yellow-500" />;
  }
  return <BellRing className="h-6 w-6 text-blue-500" />;
}

export default function NotificacoesPage() {
  const { 
    notifications, 
    notificationCount, 
    markAllNotificationsAsRead 
  } = useAuth();

  const unreadNotifications = notifications.filter(n => !n.lida);
  const readNotifications = notifications.filter(n => n.lida);

  return (
    <>
      <PageHeader title="Notificações" />

      <div className="bg-white p-4 rounded-lg shadow-md mb-6 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-zinc-800">
          Todas as Notificações
        </h2>
        <button
          onClick={markAllNotificationsAsRead}
          disabled={notificationCount === 0}
          className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2 hover:bg-blue-700 disabled:opacity-50"
        >
          <Check size={18} /> Marcar todas como lidas
        </button>
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        {notifications.length === 0 ? (
            <div className="p-16 text-center text-gray-500 flex flex-col items-center">
              <BellOff size={48} className="mb-4 text-gray-400" />
              <h3 className="text-lg font-semibold">Tudo em ordem!</h3>
              <p>Você não possui nenhuma notificação no momento.</p>
            </div>
        ) : (
          <div className="divide-y divide-gray-200">
            
            {/* Notificações Não Lidas */}
            {unreadNotifications.map(notif => (
              <NotificationPageItem key={notif.id} notif={notif} />
            ))}

            {/* Notificações Lidas */}
            {readNotifications.map(notif => (
              <NotificationPageItem key={notif.id} notif={notif} />
            ))}

          </div>
        )}
      </div>
    </>
  );
}


// Componente de Item da Página
function NotificationPageItem({ notif }: { notif: NotificationType }) {
  const content = (
    <div className={`flex items-start gap-4 p-4 ${notif.lida ? 'bg-white opacity-70' : 'bg-blue-50'}`}>
      <div className="flex-shrink-0 mt-1">
        {getIcon(notif.mensagem)}
      </div>
      <div className="flex-1">
        <p className={`font-medium ${notif.lida ? 'text-gray-600' : 'text-gray-900'}`}>
          {notif.mensagem}
        </p>
        <span className="text-sm text-gray-500">
          {formatTime(notif.data_criacao)}
        </span>
      </div>
      {!notif.lida && (
        <div className="w-3 h-3 rounded-full bg-blue-500 self-center" title="Não lida"></div>
      )}
    </div>
  );

  if (notif.link) {
    return (
      <Link href={notif.link} className="block cursor-pointer hover:bg-gray-100 transition-colors">
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