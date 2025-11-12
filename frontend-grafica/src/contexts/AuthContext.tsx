// src/contexts/AuthContext.tsx
// (Arquivo Modificado)

"use client";

import { createContext, useState, useEffect, ReactNode, useContext } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { jwtDecode } from 'jwt-decode';
import Cookies from 'js-cookie';
import { useCallback } from 'react';


// 1. Definição do tipo para os dados da empresa
type EmpresaData = {
  id: number;
  nome_empresa: string;
  logo_grande_dashboard: string | null;
  logo_pequena_dashboard: string | null;
  logo_orcamento_pdf: string | null;
};

// 2. Definição do tipo para o token
interface DecodedToken {
  user_id: number;
  exp: number;
  email: string;
  username: string;
  password?: string;
}

// 3. TIPO PARA O PERFIL COMPLETO DO USUÁRIO (ATUALIZADO)
type UserProfile = {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  profile_pic_url: string | null;
  grupos: string[]; // <-- CAMPO ADICIONADO PARA OS CARGOS
};

// 4. Tipo para Notificação
export type NotificationType = {
  id: number;
  mensagem: string;
  link: string | null;
  lida: boolean;
  data_criacao: string;
};

// 5. ATUALIZAR O TIPO DO CONTEXTO
interface AuthContextType {
  isAuthenticated: boolean;
  empresaData: EmpresaData | null;
  user: DecodedToken | null;
  userProfile: UserProfile | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  fetchUserProfile: () => Promise<void>;
  notifications: NotificationType[];
  notificationCount: number;
  fetchNotifications: () => Promise<void>;
  markAllNotificationsAsRead: () => Promise<void>;
  
  // --- NOVOS ITENS ADICIONADOS ---
  userRoles: string[]; // A lista de cargos
  hasRole: (roles: string | string[]) => boolean; // A função helper
  // ---------------------------------
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<DecodedToken | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  
  // --- 6. NOVO ESTADO PARA OS CARGOS ---
  const [userRoles, setUserRoles] = useState<string[]>([]);
  // ------------------------------------

  const [empresaData, setEmpresaData] = useState<EmpresaData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const [notifications, setNotifications] = useState<NotificationType[]>([]);
  const [notificationCount, setNotificationCount] = useState(0);
  
  // 7. ATUALIZAR fetchUserProfile
  const fetchUserProfile = useCallback(async () => {
    try {
      const response = await api.get<UserProfile>('/profile/');
      setUserProfile(response.data);
      // --- ADICIONADO ---
      // Popula o estado de cargos com os dados do backend
      setUserRoles(response.data.grupos || []);
      // ------------------
    } catch (error) {
      console.error("Não foi possível carregar o perfil do usuário", error);
    }
  }, []);

  const fetchNotifications = useCallback(async () => {
    // ... (sem alterações)
    const token = Cookies.get('access_token');
    if (!token) return; 

    try {
      const response = await api.get('/notificacoes/');
      const data: NotificationType[] = response.data.results || response.data;
      setNotifications(data);
      const unreadCount = data.filter(n => !n.lida).length;
      setNotificationCount(unreadCount);
    } catch (error) {
      console.error("Falha ao buscar notificações:", error);
    }
  }, []);

  const markAllNotificationsAsRead = async () => {
    // ... (sem alterações)
    try {
      await api.post('/notificacoes/marcar-todas-como-lidas/');
      setNotifications(prev => prev.map(n => ({ ...n, lida: true })));
      setNotificationCount(0);
    } catch (error) {
      console.error("Falha ao marcar notificações como lidas:", error);
    }
  };

  // 8. ATUALIZAR logout
  const logout = useCallback(() => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    Cookies.remove('access_token');
    
    api.defaults.headers.common['Authorization'] = undefined;
    setIsAuthenticated(false);
    setUser(null);
    setUserProfile(null);
    
    // --- ADICIONADO ---
    setUserRoles([]); // Limpa os cargos ao sair
    // ------------------

    setEmpresaData(null);
    setIsLoading(false);
    setNotifications([]);
    setNotificationCount(0);
    router.push('/login');
  }, [router]);

  useEffect(() => {
    // ... (checkAuth sem alterações, pois ele chama fetchUserProfile que foi atualizado)
    const checkAuth = async () => {
      const token = Cookies.get('access_token');
      if (token) {
        try {
          const decodedToken: DecodedToken = jwtDecode(token);
          if (decodedToken.exp * 1000 > Date.now()) {
            api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            setUser(decodedToken);
            setIsAuthenticated(true);
            
            await Promise.all([
              fetchEmpresaData(),
              fetchNotifications(),
              fetchUserProfile() // Este já atualiza os cargos (userRoles)
            ]);

          } else {
            logout(); 
          }
        } catch (error) {
          console.error("Token inválido:", error);
          logout(); 
        }
      } else {
        setIsAuthenticated(false);
      }
      setIsLoading(false);
    };
    checkAuth();
  }, [logout, fetchNotifications, fetchUserProfile]); 

  // ... (interceptor de API sem alterações)
  useEffect(() => {
    const responseInterceptor = api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response && error.response.status === 401) {
          logout();
        }
        return Promise.reject(error);
      }
    );
    return () => {
      api.interceptors.response.eject(responseInterceptor);
    };
  }, [logout]); 

  const fetchEmpresaData = async () => {
    // ... (sem alterações)
    try {
      const response = await api.get<EmpresaData>('/empresa-settings/');
      setEmpresaData(response.data);
    } catch (error) {
      console.error("Não foi possível carregar os dados da empresa", error);
    }
  };

  const login = async (username: string, password: string) => {
    // ... (login sem alterações, pois ele chama fetchUserProfile que foi atualizado)
    try {
      const response = await api.post('/token/', { username, password });
      const { access, refresh } = response.data;
      
      localStorage.setItem('access_token', access);
      Cookies.set('access_token', access, { expires: 1 });
      localStorage.setItem('refresh_token', refresh);
      
      api.defaults.headers.common['Authorization'] = `Bearer ${access}`;
      
      const decodedToken: DecodedToken = jwtDecode(access);
      setUser(decodedToken);
      setIsAuthenticated(true);
      
      await Promise.all([
        fetchEmpresaData(),
        fetchNotifications(),
        fetchUserProfile() // Este já atualiza os cargos (userRoles)
      ]);
      
      router.push('/dashboard');
    } catch (error) {
      console.error("Erro no login:", error);
      throw new Error('Usuário ou senha inválidos.');
    }
  };

  // --- 9. IMPLEMENTAR A FUNÇÃO HELPER hasRole ---
  const hasRole = useCallback((roles: string | string[]): boolean => {
    // O "Admin" sempre tem permissão
    if (userRoles.includes('Admin')) {
      return true;
    }

    if (Array.isArray(roles)) {
      // Se for uma lista (ex: ['Atendimento', 'Financeiro'])
      // retorna true se o usuário tiver PELO MENOS UM dos cargos
      return roles.some(role => userRoles.includes(role));
    }
    
    // Se for uma string única (ex: 'Producao')
    return userRoles.includes(roles);
  }, [userRoles]);
  // ---------------------------------------------

  return (
    <AuthContext.Provider value={{ 
        isAuthenticated, 
        empresaData, 
        user, 
        userProfile,
        isLoading, 
        login, 
        logout,
        fetchUserProfile,
        notifications,
        notificationCount,
        fetchNotifications,
        markAllNotificationsAsRead,

        // --- 10. FORNECER OS NOVOS VALORES ---
        userRoles,
        hasRole
        // ------------------------------------
      }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
}