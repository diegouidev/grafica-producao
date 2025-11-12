// src/app/(app)/empresa/AddEditUserModal.tsx
// (NOVO ARQUIVO)

"use client";

import { useState, FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { UserManagement, Group, UserFormData } from '@/types';
import { api } from '@/lib/api';
import { toast } from 'react-toastify';
import { Loader2 } from 'lucide-react';

type AddEditUserModalProps = {
  isOpen: boolean;
  onClose: () => void;
  userToEdit: UserManagement | null;
  onSave: () => void; // Para forçar a atualização da lista
};

const initialState: UserFormData = {
  username: '',
  email: '',
  first_name: '',
  last_name: '',
  password: '',
  grupos: [],
};

export default function AddEditUserModal({ isOpen, onClose, userToEdit, onSave }: AddEditUserModalProps) {
  const [formData, setFormData] = useState<UserFormData>(initialState);
  const [availableGroups, setAvailableGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditMode = !!userToEdit;

  useEffect(() => {
    if (isOpen) {
      setError(null);

      // Buscar os grupos (cargos) disponíveis
      api.get('/admin/groups/')
        .then(response => {
          setAvailableGroups(response.data);
        })
        .catch(err => {
          console.error("Erro ao buscar cargos", err);
          toast.error("Não foi possível carregar os cargos disponíveis.");
        });

      if (userToEdit) {
        // Modo Edição
        setFormData({
          id: userToEdit.id,
          username: userToEdit.username,
          email: userToEdit.email,
          first_name: userToEdit.first_name,
          last_name: userToEdit.last_name,
          grupos: userToEdit.grupos || [],
          password: '', // Senha fica em branco na edição
        });
      } else {
        // Modo Criação
        setFormData(initialState);
      }
    }
  }, [userToEdit, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prevState => ({ ...prevState, [name]: value }));
    
    // Sincroniza username e email
    if (name === 'email') {
      setFormData(prevState => ({ ...prevState, username: value }));
    }
    if (name === 'username') {
      setFormData(prevState => ({ ...prevState, email: value }));
    }
  };

  const handleGroupChange = (groupName: string) => {
    setFormData(prev => {
      const newGrupos = prev.grupos.includes(groupName)
        ? prev.grupos.filter(g => g !== groupName) // Remove
        : [...prev.grupos, groupName]; // Adiciona
      return { ...prev, grupos: newGrupos };
    });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const payload: UserFormData = {
      ...formData,
      username: formData.email, // Garante que username é o email
    };

    // Remove a senha do payload se estiver vazia (para não alterar a senha)
    if (!payload.password) {
      delete payload.password;
    }
    
    // Garante que a senha é obrigatória ao criar
    if (!isEditMode && !payload.password) {
        setError("A senha é obrigatória para criar um novo funcionário.");
        setIsLoading(false);
        return;
    }

    try {
      if (isEditMode && userToEdit) {
        await api.put(`/admin/users/${userToEdit.id}/`, payload);
        toast.success("Funcionário atualizado com sucesso!");
      } else {
        await api.post('/admin/users/', payload);
        toast.success("Funcionário criado com sucesso!");
      }
      onSave(); // Chama a função de recarregar a lista
      onClose(); // Fecha o modal
    } catch (err: any) {
      console.error("Erro ao salvar funcionário:", err.response?.data);
      let errorMsg = "Falha ao salvar. Verifique os dados.";
      if (err.response?.data) {
        errorMsg = Object.values(err.response.data).map(e => (e as string[])[0]).join(' ');
      }
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-start pt-8 pb-8 overflow-y-auto">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-2xl">
        <h2 className="text-xl font-bold mb-4 border-b pb-4 text-zinc-600">
          {isEditMode ? 'Editar Funcionário' : 'Novo Funcionário'}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Nome</label>
              <input type="text" name="first_name" value={formData.first_name} onChange={handleChange} className="w-full p-2 border rounded-md text-zinc-700 border-gray-300" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Sobrenome</label>
              <input type="text" name="last_name" value={formData.last_name} onChange={handleChange} className="w-full p-2 border rounded-md text-zinc-700 border-gray-300" />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Email (Login)</label>
            <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full p-2 border rounded-md text-zinc-700 border-gray-300" required />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Senha</label>
            <input 
              type="password" 
              name="password" 
              value={formData.password} 
              onChange={handleChange} 
              placeholder={isEditMode ? "Deixe em branco para não alterar" : "Senha de acesso"}
              className="w-full p-2 border rounded-md text-zinc-700 border-gray-300" 
              required={!isEditMode}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Cargos (Permissões)</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
              {availableGroups.map(group => (
                <label key={group.id} className="flex items-center gap-2 p-2 border rounded-md cursor-pointer hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={formData.grupos.includes(group.name)}
                    onChange={() => handleGroupChange(group.name)}
                    className="form-checkbox h-4 w-4 text-blue-600 rounded"
                  />
                  <span className="text-sm text-zinc-700">{group.name}</span>
                </label>
              ))}
            </div>
          </div>
          
          {error && <p className="text-red-500 text-sm mt-2 text-center">{error}</p>}
          
          <div className="flex items-center justify-end gap-4 pt-4 border-t mt-6">
            <button type="button" onClick={onClose} className="bg-white text-gray-800 font-bold py-2 px-6 rounded-lg hover:bg-gray-100 border">
              Cancelar
            </button>
            <button type="submit" disabled={isLoading} className="bg-blue-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-blue-700 disabled:bg-blue-300 flex items-center gap-2">
              {isLoading && <Loader2 className="animate-spin" size={18} />}
              {isLoading ? 'Salvando...' : (isEditMode ? 'Salvar Alterações' : 'Criar Funcionário')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}