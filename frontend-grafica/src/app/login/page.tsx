// src/app/login/page.tsx

"use client";

import { useState, FormEvent, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Image from 'next/image';
import { ArrowRight, Eye, EyeOff, Lock } from 'lucide-react';


const BACKEND_URL = 'http://92.112.176.145';

type EmpresaPublicData = {
  nome_empresa: string;
  logo_grande_dashboard: string | null;
};

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { login } = useAuth();

  // --- NOVO ESTADO PARA OS DADOS DA EMPRESA ---
  const [empresaData, setEmpresaData] = useState<EmpresaPublicData | null>(null);

  // --- EFEITO PARA BUSCAR OS DADOS PÚBLICOS DA EMPRESA ---
  useEffect(() => {
    const fetchEmpresaData = async () => {
      try {
        // Usamos fetch padrão pois a 'api' pode ter interceptors de auth
        const response = await fetch(`${BACKEND_URL}/api/public/empresa/`);
        if (!response.ok) {
          throw new Error('Falha ao buscar dados da empresa');
        }
        const data = await response.json();
        setEmpresaData(data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchEmpresaData();
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await login(username, password);
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4">
      <div className="mb-10 text-center">
        {/* --- LOGO DINÂMICA --- */}
        {empresaData?.logo_grande_dashboard ? (
          <Image
            src={`${BACKEND_URL}${empresaData.logo_grande_dashboard}`}
            alt={empresaData.nome_empresa}
            width={280} // Ajuste o tamanho conforme necessário
            height={70}
            unoptimized
            className="object-contain"
          />
        ) : (
          <h1 className="text-5xl font-bold text-gray-800 tracking-wider">
            {empresaData?.nome_empresa || 'Cloud Gráfica Rápida'}
          </h1>
        )}
      </div>
      
      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-lg">
        <div className="text-center">
            <h2 className="text-2xl font-semibold text-gray-900">Entrar</h2>
            <p className="mt-2 text-sm text-gray-500">Insira sua credencial abaixo:</p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div>
            <label htmlFor="email" className="mb-2 block text-sm font-medium text-gray-700">Email</label>
            <input
              id="email"
              type="email"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full rounded-md border text-zinc-700 border-gray-300 p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          
          <div>
            <label htmlFor="password" className="mb-2 block text-sm font-medium text-gray-700">Senha</label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-md border border-gray-300 text-zinc-700 p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)} 
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <input type="checkbox" id="remember" className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"/>
              <label htmlFor="remember" className="text-gray-600">Permanecer conectado</label>
            </div>
            <a href="#" className="font-medium text-blue-600 hover:underline">Esqueci a senha</a>
          </div>

          {error && <p className="text-center text-sm text-red-500">{error}</p>}
          
          <button 
            type="submit" 
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 py-3 font-bold text-white hover:bg-blue-700 transition-all"
          >
            Entrar
            <ArrowRight size={20} />
          </button>
        </form>
      </div>

      <div className="mt-6 text-center text-sm text-gray-600">
        <p>Ainda não é cadastrado? <a href="#" className="font-medium text-blue-600 hover:underline">Crie sua conta!</a></p>
      </div>

      <div className="mt-8 flex items-center justify-center gap-2 text-xs text-gray-500">
        <Lock size={14} />
        <span>Ambiente seguro</span>
      </div>
    </main>
  );
}
