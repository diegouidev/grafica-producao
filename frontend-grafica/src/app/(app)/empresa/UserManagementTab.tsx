// src/app/(app)/empresa/UserManagementTab.tsx
// (Arquivo Corrigido)

"use client";

import { useState, useEffect } from "react";
import { UserManagement, Group } from "@/types";
import { api } from "@/lib/api";
import { toast } from "react-toastify";
import { Loader2, Plus, Edit2, Trash2 } from "lucide-react";
import AddEditUserModal from "./AddEditUserModal";
import DeleteUserModal from "./DeleteUserModal";

export default function UserManagementTab() {
  const [users, setUsers] = useState<UserManagement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Estados dos Modais
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<UserManagement | null>(null);
  const [userToDelete, setUserToDelete] = useState<UserManagement | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Função para buscar os usuários
  const fetchUsers = () => {
    setIsLoading(true);
    api.get('/admin/users/')
      .then(response => {
        setUsers(response.data.results || response.data);
      })
      .catch(err => {
        console.error("Erro ao buscar usuários", err);
        toast.error("Não foi possível carregar a lista de funcionários.");
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  // Busca inicial
  useEffect(() => {
    fetchUsers();
  }, []);
  
  // Handlers dos Modais
  const handleOpenAddModal = () => {
    setUserToEdit(null);
    setIsAddEditModalOpen(true);
  };
  
  const handleOpenEditModal = (user: UserManagement) => {
    setUserToEdit(user);
    setIsAddEditModalOpen(true);
  };
  
  const handleOpenDeleteModal = (user: UserManagement) => {
    setUserToDelete(user);
    setIsDeleteModalOpen(true);
  };

  const handleCloseModals = () => {
    setIsAddEditModalOpen(false);
    setIsDeleteModalOpen(false);
    setUserToEdit(null);
    setUserToDelete(null);
  };
  
  // Handler de exclusão
  const handleDeleteConfirm = async () => {
    if (!userToDelete) return;
    setIsSubmitting(true);
    try {
      await api.delete(`/admin/users/${userToDelete.id}/`);
      toast.success("Funcionário excluído com sucesso!");
      fetchUsers(); // Recarrega a lista
      handleCloseModals();
    } catch (err) {
      toast.error("Falha ao excluir o funcionário.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="animate-spin text-blue-500" size={32} />
      </div>
    );
  }

  return (
    <>
      <AddEditUserModal
        isOpen={isAddEditModalOpen}
        onClose={handleCloseModals}
        userToEdit={userToEdit}
        onSave={fetchUsers} // Passa a função de recarregar
      />
      <DeleteUserModal
        isOpen={isDeleteModalOpen}
        onClose={handleCloseModals}
        isLoading={isSubmitting}
        onConfirm={handleDeleteConfirm}
        usuario={userToDelete}
      />
    
      <div className="flex justify-end mb-4">
        <button
          onClick={handleOpenAddModal}
          className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2 hover:bg-blue-700"
        >
          <Plus size={18} /> Novo Funcionário
        </button>
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left font-semibold text-gray-600 uppercase">Nome</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-600 uppercase">Email (Login)</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-600 uppercase">Cargos</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-600 uppercase">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">
                    {user.first_name || user.last_name ? `${user.first_name} ${user.last_name}`.trim() : '(Sem nome)'}
                  </td>
                  <td className="px-6 py-4 text-gray-500">{user.email}</td>
                  <td className="px-6 py-4 text-gray-500">
                    <div className="flex flex-wrap gap-1">
                      
                      {/* --- INÍCIO DA CORREÇÃO --- */}
                      {/* Verificamos se 'user.grupos' é um array e se tem itens.
                        Se 'user.grupos' for undefined ou null, ele pulará para o "else".
                      */}
                      {Array.isArray(user.grupos) && user.grupos.length > 0 ? user.grupos.map(g => (
                        <span key={g} className="px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                          {g}
                        </span>
                      )) : (
                        <span className="text-xs italic">Nenhum cargo</span>
                      )}
                      {/* --- FIM DA CORREÇÃO --- */}

                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4 text-gray-500">
                      <button onClick={() => handleOpenEditModal(user)} className="hover:text-yellow-500" title="Editar">
                        <Edit2 size={18} />
                      </button>
                      <button onClick={() => handleOpenDeleteModal(user)} className="hover:text-red-500" title="Excluir">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}