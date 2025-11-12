// src/app/(app)/empresa/page.tsx
// (Arquivo Modificado)

"use client";

import { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import { api } from '@/lib/api';
import PageHeader from '@/components/layout/PageHeader';
import { Save, Building, Users2 } from 'lucide-react'; // <-- 1. IMPORTAR ÍCONES
import Image from 'next/image';
import { toast } from 'react-toastify';
import { useAuth } from '@/contexts/AuthContext'; // <-- 2. IMPORTAR useAuth
import UserManagementTab from './UserManagementTab'; // <-- 3. IMPORTAR A NOVA ABA

type EmpresaData = any;

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:8000';

export default function EmpresaPage() {
  const { hasRole } = useAuth(); // <-- 4. PEGAR A FUNÇÃO hasRole
  const [activeTab, setActiveTab] = useState('empresa'); // <-- 5. ESTADO DA ABA

  const [data, setData] = useState<EmpresaData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [logoGrandeFile, setLogoGrandeFile] = useState<File | null>(null);
  const [logoPequenaFile, setLogoPequenaFile] = useState<File | null>(null);
  const [logoPdfFile, setLogoPdfFile] = useState<File | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Esta chamada agora funciona para todos os usuários logados
        const response = await api.get('/empresa-settings/');
        setData(response.data);
      } catch (error) {
        console.error("Erro ao buscar dados da empresa", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setData((prev) => (prev ? { ...prev, [name]: value } : null));
  };
  
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, files } = e.target;
    if (files && files[0]) {
      if (name === 'logo_grande_dashboard') setLogoGrandeFile(files[0]);
      if (name === 'logo_pequena_dashboard') setLogoPequenaFile(files[0]);
      if (name === 'logo_orcamento_pdf') setLogoPdfFile(files[0]);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!data) return;
    setIsSaving(true);
    
    const formData = new FormData();

    Object.keys(data).forEach(key => {
        if(data[key] !== null && typeof data[key] !== 'undefined' && key.indexOf('logo') === -1) {
            formData.append(key, data[key]);
        }
    });
    
    if (logoGrandeFile) formData.append('logo_grande_dashboard', logoGrandeFile);
    if (logoPequenaFile) formData.append('logo_pequena_dashboard', logoPequenaFile);
    if (logoPdfFile) formData.append('logo_orcamento_pdf', logoPdfFile);

    try {
      // Esta chamada PUT só funcionará para o Admin (como definido no backend)
      const response = await api.put('/empresa-settings/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setData(response.data);
      toast.success('Dados da empresa salvos com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar dados da empresa', error);
      toast.error('Falha ao salvar os dados da empresa. Somente Admins podem alterar.');
    } finally {
      setIsSaving(false);
    }
  };

  // Componente de carregamento
  if (isLoading) return <div className="p-8 text-center">Carregando configurações...</div>;
  if (!data) return <div className="p-8 text-center">Não foi possível carregar os dados da empresa.</div>;
  
  const isAdmin = hasRole('Admin'); // Verifica se é Admin

  return (
    <>
      <PageHeader title="Configurações" />

      {/* --- 6. ADICIONAR SELETOR DE ABAS --- */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex space-x-6" aria-label="Tabs">
          <button
            onClick={() => setActiveTab('empresa')}
            className={`
              ${activeTab === 'empresa' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
              whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2
            `}
          >
            <Building size={16} /> Dados da Empresa
          </button>
          
          {/* A aba 'Funcionários' só aparece se for Admin */}
          {isAdmin && (
            <button
              onClick={() => setActiveTab('funcionarios')}
              className={`
                ${activeTab === 'funcionarios' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
                whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2
              `}
            >
              <Users2 size={16} /> Funcionários
            </button>
          )}
        </nav>
      </div>

      {/* --- 7. CONTEÚDO DA ABA DADOS DA EMPRESA --- */}
      <div className={activeTab === 'empresa' ? 'block' : 'hidden'}>
        <form onSubmit={handleSubmit}>
          {/* O botão de Salvar só aparece para o Admin */}
          {isAdmin && (
            <div className="flex items-center justify-end mb-6">
              <button type="submit" disabled={isSaving} className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2 hover:bg-blue-700 disabled:bg-blue-300">
                <Save size={18} /> {isSaving ? 'Salvando...' : 'Salvar Dados da Empresa'}
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-lg font-semibold mb-4 text-zinc-800">Dados Pessoais</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Os inputs agora são 'readOnly' se o usuário NÃO for admin */}
                  <div><label className="block text-sm font-medium text-zinc-600 mb-1">Nome da Empresa</label><input name="nome_empresa" value={data.nome_empresa || ''} onChange={handleInputChange} readOnly={!isAdmin} className={`w-full p-2 border rounded-md text-zinc-700 ${!isAdmin ? 'bg-gray-100 text-zinc-500' : 'border-gray-300'}`}/></div>
                  <div><label className="block text-sm font-medium text-zinc-600 mb-1">Razão Social</label><input name="razao_social" value={data.razao_social || ''} onChange={handleInputChange} readOnly={!isAdmin} className={`w-full p-2 border rounded-md text-zinc-700 ${!isAdmin ? 'bg-gray-100 text-zinc-500' : 'border-gray-300'}`}/></div>
                  <div><label className="block text-sm font-medium text-zinc-600 mb-1">CNPJ</label><input name="cnpj" value={data.cnpj || ''} onChange={handleInputChange} readOnly={!isAdmin} className={`w-full p-2 border rounded-md text-zinc-700 ${!isAdmin ? 'bg-gray-100 text-zinc-500' : 'border-gray-300'}`}/></div>
                  <div><label className="block text-sm font-medium text-zinc-600 mb-1">Email</label><input name="email" type="email" value={data.email || ''} onChange={handleInputChange} readOnly={!isAdmin} className={`w-full p-2 border rounded-md text-zinc-700 ${!isAdmin ? 'bg-gray-100 text-zinc-500' : 'border-gray-300'}`}/></div>
                  <div><label className="block text-sm font-medium text-zinc-600 mb-1">Whatsapp</label><input name="whatsapp" value={data.whatsapp || ''} onChange={handleInputChange} readOnly={!isAdmin} className={`w-full p-2 border rounded-md text-zinc-700 ${!isAdmin ? 'bg-gray-100 text-zinc-500' : 'border-gray-300'}`}/></div>
                  <div><label className="block text-sm font-medium text-zinc-600 mb-1">Instagram</label><input name="instagram" value={data.instagram || ''} onChange={handleInputChange} readOnly={!isAdmin} placeholder="@seuusuario" className={`w-full p-2 border rounded-md text-zinc-700 ${!isAdmin ? 'bg-gray-100 text-zinc-500' : 'border-gray-300'}`}/></div>
                  <div className="md:col-span-2"><label className="block text-sm font-medium text-zinc-600 mb-1">Site</label><input name="site" type="url" value={data.site || ''} onChange={handleInputChange} readOnly={!isAdmin} placeholder="https://..." className={`w-full p-2 border rounded-md text-zinc-700 ${!isAdmin ? 'bg-gray-100 text-zinc-500' : 'border-gray-300'}`}/></div>
                </div>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-lg font-semibold mb-4 text-zinc-800">Endereço da Empresa</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="md:col-span-1"><label className="block text-sm font-medium text-zinc-600 mb-1">CEP</label><input name="cep" value={data.cep || ''} onChange={handleInputChange} readOnly={!isAdmin} className={`w-full p-2 border rounded-md text-zinc-700 ${!isAdmin ? 'bg-gray-100 text-zinc-500' : 'border-gray-300'}`}/></div>
                  <div className="md:col-span-3"><label className="block text-sm font-medium text-zinc-600 mb-1">Endereço</label><input name="endereco" value={data.endereco || ''} onChange={handleInputChange} readOnly={!isAdmin} className={`w-full p-2 border rounded-md text-zinc-700 ${!isAdmin ? 'bg-gray-100 text-zinc-500' : 'border-gray-300'}`}/></div>
                  <div className="md:col-span-1"><label className="block text-sm font-medium text-zinc-600 mb-1">Número</label><input name="numero" value={data.numero || ''} onChange={handleInputChange} readOnly={!isAdmin} className={`w-full p-2 border rounded-md text-zinc-700 ${!isAdmin ? 'bg-gray-100 text-zinc-500' : 'border-gray-300'}`}/></div>
                  <div className="md:col-span-3"><label className="block text-sm font-medium text-zinc-600 mb-1">Bairro</label><input name="bairro" value={data.bairro || ''} onChange={handleInputChange} readOnly={!isAdmin} className={`w-full p-2 border rounded-md text-zinc-700 ${!isAdmin ? 'bg-gray-100 text-zinc-500' : 'border-gray-300'}`}/></div>
                  <div className="md:col-span-4"><label className="block text-sm font-medium text-zinc-600 mb-1">Complemento</label><input name="complemento" value={data.complemento || ''} onChange={handleInputChange} readOnly={!isAdmin} className={`w-full p-2 border rounded-md text-zinc-700 ${!isAdmin ? 'bg-gray-100 text-zinc-500' : 'border-gray-300'}`}/></div>
                  <div className="md:col-span-3"><label className="block text-sm font-medium text-zinc-600 mb-1">Cidade</label><input name="cidade" value={data.cidade || ''} onChange={handleInputChange} readOnly={!isAdmin} className={`w-full p-2 border rounded-md text-zinc-700 ${!isAdmin ? 'bg-gray-100 text-zinc-500' : 'border-gray-300'}`}/></div>
                  <div className="md:col-span-1"><label className="block text-sm font-medium text-zinc-600 mb-1">Estado</label><input name="estado" value={data.estado || ''} onChange={handleInputChange} readOnly={!isAdmin} maxLength={2} className={`w-full p-2 border rounded-md text-zinc-700 ${!isAdmin ? 'bg-gray-100 text-zinc-500' : 'border-gray-300'}`}/></div>
                </div>
              </div>
            </div>
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-lg font-semibold mb-2 text-zinc-800">Logo Grande Dashboard</h3>
                {data.logo_grande_dashboard && <Image src={`${BACKEND_URL}${data.logo_grande_dashboard}`} alt="Logo Grande" width={200} height={100} className="my-2 object-contain" unoptimized />}
                {isAdmin && <input name="logo_grande_dashboard" type="file" onChange={handleFileChange} className="text-sm  text-zinc-600 w-full"/>}
              </div>
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-lg font-semibold mb-2 text-zinc-800">Logo Pequena Dashboard</h3>
                {data.logo_pequena_dashboard && <Image src={`${BACKEND_URL}${data.logo_pequena_dashboard}`} alt="Logo Pequena" width={50} height={50} className="my-2 object-contain" unoptimized />}
                {isAdmin && <input name="logo_pequena_dashboard" type="file" onChange={handleFileChange} className="text-sm text-zinc-600 w-full"/>}
              </div>
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-lg font-semibold mb-2 text-zinc-800">Logo Orçamento PDF</h3>
                {data.logo_orcamento_pdf && <Image src={`${BACKEND_URL}${data.logo_orcamento_pdf}`} alt="Logo PDF" width={200} height={100} className="my-2 object-contain" unoptimized />}
                {isAdmin && <input name="logo_orcamento_pdf" type="file" onChange={handleFileChange} className="text-sm text-zinc-600 w-full"/>}
              </div>
            </div>
          </div>
        </form>
      </div>

      {/* --- 8. CONTEÚDO DA ABA FUNCIONÁRIOS --- */}
      {/* O conteúdo (UserManagementTab) já é protegido internamente, mas */}
      {/* renderizar condicionalmente a aba inteira é mais limpo. */}
      {isAdmin && (
        <div className={activeTab === 'funcionarios' ? 'block' : 'hidden'}>
          <UserManagementTab />
        </div>
      )}
    </>
  );
}