// src/app/(app)/perfil/page.tsx
// (Arquivo Corrigido)

"use client";

import { useState, useEffect, FormEvent, ChangeEvent } from "react";
import PageHeader from "@/components/layout/PageHeader";
import { api } from "@/lib/api";
import { toast } from "react-toastify";
import { Save, Camera } from "lucide-react";
import Image from "next/image"; 
import { useAuth } from "@/contexts/AuthContext"; 

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:8000';

export default function PerfilPage() {
  const { userProfile, fetchUserProfile } = useAuth(); 
  
  const [formData, setFormData] = useState({
    email: '',
    first_name: '',
    last_name: '',
  });
  
  const [profilePicFile, setProfilePicFile] = useState<File | null>(null);
  const [profilePicPreview, setProfilePicPreview] = useState<string | null>(null);
  
  const [passwordData, setPasswordData] = useState({
    old_password: '',
    new_password: '',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (userProfile) {
      setFormData({
        email: userProfile.email || '',
        first_name: userProfile.first_name || '',
        last_name: userProfile.last_name || '',
      });
      if(userProfile.profile_pic_url) {
        // Garantir que a URL completa seja usada se não for um blob
        setProfilePicPreview(userProfile.profile_pic_url);
      } else {
        setProfilePicPreview(null); 
      }
      setIsLoading(false);
    }
  }, [userProfile]);

  const handleInfoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setProfilePicFile(file); 
      setProfilePicPreview(URL.createObjectURL(file)); 
    }
  };

  const handleInfoSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    const data = new FormData();
    data.append('first_name', formData.first_name);
    data.append('last_name', formData.last_name);
    data.append('email', formData.email);
    
    if (profilePicFile) {
      data.append('profile_pic', profilePicFile);
    }
    
    try {
      await api.put('/profile/', data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      setProfilePicFile(null);
      await fetchUserProfile(); 
      
      toast.success("Perfil atualizado com sucesso!");
    } catch (error: any) {
      console.error(error.response?.data);
      toast.error("Falha ao atualizar o perfil.");
    } finally {
      setIsSaving(false);
    }
  };
  
  const handlePasswordSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await api.post('/profile/change-password/', passwordData);
      toast.success("Senha alterada com sucesso!");
      setPasswordData({ old_password: '', new_password: '' });
    } catch (error: any) {
      const errorMsg = error.response?.data?.old_password?.[0] || "Falha ao alterar a senha.";
      toast.error(errorMsg);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <div>Carregando perfil...</div>;

  return (
    <>
      <PageHeader title="Editar Perfil" />

      <form onSubmit={handleInfoSubmit} className="bg-white p-6 rounded-lg shadow-md mb-6">
        <h2 className="text-xl font-semibold text-zinc-800 mb-4">Informações Pessoais</h2>
        
        <div className="flex items-center gap-4 mb-6">
          <div className="relative w-24 h-24">
          <Image
              src={profilePicPreview || 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'}
              alt="Foto do Perfil"
              width={96}
              height={96}
              unoptimized={!!profilePicFile} 
              className="rounded-full object-cover w-24 h-24 border bg-gray-100"
              onError={(e) => (e.currentTarget.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7')} 
            />
            <label 
              htmlFor="profile_pic" 
              className="absolute -bottom-2 -right-2 bg-blue-600 text-white p-2 rounded-full cursor-pointer hover:bg-blue-700 transition-all"
            >
              <Camera size={16} />
              <input 
                id="profile_pic"
                name="profile_pic"
                type="file"
                accept="image/png, image/jpeg"
                onChange={handleFileChange}
                className="hidden" 
              />
            </label>
          </div>
          <div>
            <p className="font-semibold text-zinc-800">{formData.first_name || userProfile?.username}</p>
            <p className="text-sm text-zinc-500">Clique no ícone para alterar sua foto.</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Nome</label>
            <input name="first_name" value={formData.first_name} onChange={handleInfoChange} className="w-full p-2 border rounded-md text-zinc-700 border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Sobrenome</label>
            <input name="last_name" value={formData.last_name} onChange={handleInfoChange} className="w-full p-2 border rounded-md text-zinc-700 border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-zinc-700 mb-1">Email</label>
            <input name="email" type="email" value={formData.email} onChange={handleInfoChange} className="w-full p-2 border rounded-md text-zinc-700 border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>
        <div className="flex justify-end mt-6">
          {/* --- CORREÇÃO DO TYPO AQUI --- */}
          <button type="submit" disabled={isSaving} className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2 hover:bg-blue-700">
            <Save size={18} /> {isSaving ? 'Salvando...' : 'Salvar Informações'}
          </button>
        </div>
      </form>

      <form onSubmit={handlePasswordSubmit} className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold text-zinc-800 mb-4">Alterar Senha</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Senha Antiga</label>
            <input name="old_password" type="password" value={passwordData.old_password} onChange={handlePasswordChange} className="w-full p-2 border rounded-md text-zinc-700 border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Nova Senha</label>
            <input name="new_password" type="password" value={passwordData.new_password} onChange={handlePasswordChange} className="w-full p-2 border rounded-md text-zinc-700 border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500" required />
          </div>
        </div>
        <div className="flex justify-end mt-6">
          <button type="submit" disabled={isSaving} className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2 hover:bg-blue-700">
            <Save size={18} /> {isSaving ? 'Alterar Senha' : 'Alterar Senha'}
          </button>
        </div>
      </form>
    </>
  );
}