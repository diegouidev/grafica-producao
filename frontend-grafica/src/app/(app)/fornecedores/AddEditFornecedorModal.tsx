// src/app/(app)/fornecedores/AddEditFornecedorModal.tsx
// (Arquivo Modificado)

"use client";

import { useState, FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Fornecedor } from '@/types';
import { api } from '@/lib/api';
import { toast } from 'react-toastify';
import { IMaskInput } from 'react-imask'; // <-- 1. IMPORTAR MÁSCARA
import { Loader2 } from 'lucide-react'; // <-- 2. IMPORTAR LOADER

type AddEditFornecedorModalProps = {
  isOpen: boolean;
  onClose: () => void;
  fornecedorToEdit: Fornecedor | null;
};

const initialState = {
  nome: '',
  cnpj: '', // <-- 3. ADICIONAR CNPJ
  contato_nome: '',
  email: '',
  telefone: '',
  servicos_prestados: '',
};

export default function AddEditFornecedorModal({ isOpen, onClose, fornecedorToEdit }: AddEditFornecedorModalProps) {
  const router = useRouter();
  const [formData, setFormData] = useState(initialState);
  const [isLoading, setIsLoading] = useState(false);
  const [isCnpjLoading, setIsCnpjLoading] = useState(false); // <-- 4. ESTADO DE LOADING DO CNPJ
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      if (fornecedorToEdit) {
        setFormData({
          nome: fornecedorToEdit.nome || '',
          cnpj: fornecedorToEdit.cnpj || '', // <-- 5. POPULAR CNPJ
          contato_nome: fornecedorToEdit.contato_nome || '',
          email: fornecedorToEdit.email || '',
          telefone: fornecedorToEdit.telefone || '',
          servicos_prestados: fornecedorToEdit.servicos_prestados || '',
        });
      } else {
        setFormData(initialState);
      }
    }
  }, [fornecedorToEdit, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prevState => ({ ...prevState, [name]: value }));
  };

  // --- 6. HANDLER PARA CAMPOS COM MÁSCARA ---
  const handleMaskedChange = (name: string, unmaskedValue: string) => {
    setFormData(prevState => ({ ...prevState, [name]: unmaskedValue }));
  };

  // --- 7. HANDLER PARA BUSCAR CNPJ NA API ---
  const handleCnpjBlur = async () => {
    const cnpj = formData.cnpj;
    if (cnpj.length !== 14) { // Valida o CNPJ limpo (sem máscara)
      return;
    }
    
    setIsCnpjLoading(true);
    try {
      // Chama o novo endpoint da API
      const response = await api.get(`/consulta-cnpj/${cnpj}/`);
      const data = response.data;
      
      // Preenche os campos com os dados da BrasilAPI
      setFormData(prev => ({
        ...prev,
        nome: data.razao_social || prev.nome,
        telefone: data.ddd_telefone_1 || prev.telefone,
        email: data.email || prev.email,
        // Você pode adicionar mais campos se quiser (ex: cep, endereco)
      }));
      toast.success("Dados do CNPJ carregados!");
      
    } catch (err: any) {
      console.error("Erro ao buscar CNPJ:", err);
      if (err.response?.status === 404) {
        toast.error("CNPJ não encontrado na base da Receita.");
      } else {
        toast.error("Erro ao consultar CNPJ.");
      }
    } finally {
      setIsCnpjLoading(false);
    }
  };
  
  // --- 8. HANDLER DE SUBMIT ATUALIZADO ---
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    // Validação de telefone (mínimo 10 dígitos)
    const cleanedTelefone = formData.telefone.replace(/\D/g, '');
    if (cleanedTelefone.length > 0 && cleanedTelefone.length < 10) {
      setError("Número de telefone/WhatsApp incompleto.");
      setIsLoading(false);
      return;
    }

    // Validação de CNPJ (se preenchido, deve ter 14 dígitos)
    const cleanedCnpj = formData.cnpj.replace(/\D/g, '');
    if (cleanedCnpj.length > 0 && cleanedCnpj.length !== 14) {
      setError("CNPJ incompleto.");
      setIsLoading(false);
      return;
    }

    const payload = {
      ...formData,
      // Envia os valores já limpos (sem máscara) para o backend
      telefone: cleanedTelefone || null,
      cnpj: cleanedCnpj || null,
      email: formData.email || null,
    };

    try {
      if (fornecedorToEdit) {
        // O serializer do backend validará a unicidade do CNPJ
        await api.put(`/fornecedores/${fornecedorToEdit.id}/`, payload);
        toast.success("Fornecedor atualizado com sucesso!");
      } else {
        await api.post('/fornecedores/', payload);
        toast.success("Fornecedor criado com sucesso!");
      }
      router.refresh(); 
      onClose();
    } catch (err: any) {
      console.error("Erro ao salvar fornecedor:", err.response?.data);
      let errorMsg = "Falha ao salvar. Verifique os dados.";
      
      // Pega o erro de validação do serializer (ex: CNPJ já existe)
      if (err.response?.data) {
        if (err.response.data.cnpj) {
          errorMsg = `CNPJ: ${err.response.data.cnpj[0]}`;
        } else {
           errorMsg = Object.values(err.response.data).join(', ');
        }
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
          {fornecedorToEdit ? 'Editar Fornecedor' : 'Novo Fornecedor'}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">

          {/* --- 9. CAMPO CNPJ MODIFICADO --- */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">CNPJ (Opcional)</label>
            <div className="flex gap-2">
              <IMaskInput
                mask="00.000.000/0000-00"
                type="text" 
                name="cnpj"
                value={formData.cnpj}
                unmask={true} // Salva só os números no estado
                onAccept={(value) => handleMaskedChange('cnpj', value as string)}
                onBlur={handleCnpjBlur} // <-- CHAMA A API NO BLUR
                placeholder="Digite o CNPJ e saia do campo"
                className="w-full p-2 border rounded-md text-zinc-700 border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button 
                type="button" 
                onClick={handleCnpjBlur}
                disabled={isCnpjLoading}
                className="w-32 flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300"
              >
                {isCnpjLoading ? <Loader2 className="animate-spin" size={20} /> : "Buscar"}
              </button>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Nome do Fornecedor / Empresa</label>
            <input type="text" name="nome" value={formData.nome} onChange={handleChange} className="w-full p-2 border rounded-md text-zinc-700 border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500" required />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Nome do Contato</label>
              <input type="text" name="contato_nome" value={formData.contato_nome} onChange={handleChange} className="w-full p-2 border rounded-md text-zinc-700 border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>

            {/* --- 10. CAMPO TELEFONE MODIFICADO --- */}
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Telefone / Whatsapp</label>
              <IMaskInput
                mask="(00) 00000-0000"
                type="text" 
                name="telefone" 
                value={formData.telefone}
                unmask={true}
                onAccept={(value) => handleMaskedChange('telefone', value as string)}
                className="w-full p-2 border rounded-md text-zinc-700 border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Email</label>
            <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full p-2 border rounded-md text-zinc-700 border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Serviços Prestados / Observações</label>
            <textarea name="servicos_prestados" value={formData.servicos_prestados} onChange={handleChange} placeholder="Ex: Impressão Lona, Corte Vinil, Acrílico" className="w-full p-2 border rounded-md text-zinc-700 border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500" rows={3}></textarea>
          </div>
          
          {error && <p className="text-red-500 text-sm mt-2 text-center">{error}</p>}
          
          <div className="flex items-center justify-end gap-4 pt-4 border-t mt-6">
            <button type="button" onClick={onClose} className="bg-white text-gray-800 font-bold py-2 px-6 rounded-lg hover:bg-gray-100 border">
              Cancelar
            </button>
            <button type="submit" disabled={isLoading} className="bg-blue-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-blue-700 disabled:bg-blue-300">
              {isLoading ? 'Salvando...' : (fornecedorToEdit ? 'Salvar Alterações' : 'Adicionar Fornecedor')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}