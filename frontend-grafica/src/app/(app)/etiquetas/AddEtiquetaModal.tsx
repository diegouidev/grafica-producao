"use client";

import { useState, FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { toast } from 'react-toastify';
import { EtiquetaPortaria } from '@/types';

type AddEtiquetaModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

// Define um tipo local para o formulário
type EtiquetaFormData = Omit<EtiquetaPortaria, 'id' | 'data_criacao'>;

const initialState: EtiquetaFormData = {
  tipo_cliente: 'CONDOMINIO',
  nome_responsavel: '',
  bloco: '',
  apartamento: '',
};

export default function AddEtiquetaModal({ isOpen, onClose }: AddEtiquetaModalProps) {
  const router = useRouter();
  const [formData, setFormData] = useState<EtiquetaFormData>(initialState);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFormData(initialState); // Reseta o form ao abrir
    }
  }, [isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prevState => ({ ...prevState, [name]: value }));
  };
  
  const handleRadioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newType = e.target.value as 'CONDOMINIO' | 'RETIRADA';
      setFormData(prev => ({
        ...prev,
        tipo_cliente: newType,
        // Limpa campos específicos ao trocar
        nome_responsavel: '',
        bloco: '',
        apartamento: '',
      }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Prepara o payload final
    const payload: Partial<EtiquetaFormData> = {
      tipo_cliente: formData.tipo_cliente,
      nome_responsavel: formData.nome_responsavel,
    };

    if (formData.tipo_cliente === 'CONDOMINIO') {
      payload.bloco = formData.bloco;
      payload.apartamento = formData.apartamento;
    }
    
    try {
      await api.post('/etiquetas-portaria/', payload);
      toast.success("Etiqueta criada com sucesso!");
      router.refresh();
      onClose();
    } catch (err: any) {
      console.error("Erro ao salvar etiqueta:", err?.response?.data || err);
      toast.error("Falha ao salvar. Verifique os dados.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-lg">
        <h2 className="text-xl font-bold mb-4 border-b pb-4 text-zinc-800">
          Nova Etiqueta de Portaria
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Seleção de Tipo */}
          <div className="flex items-center gap-6 mb-4">
            <label className="flex items-center gap-2 cursor-pointer text-zinc-600">
              <input 
                type="radio" 
                name="tipo_cliente_radio" // Nome diferente para o grupo de radio
                value="CONDOMINIO" 
                checked={formData.tipo_cliente === 'CONDOMINIO'} 
                onChange={handleRadioChange} 
                className="form-radio text-blue-600"
              />
              Cliente Condomínio
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-zinc-600">
              <input 
                type="radio" 
                name="tipo_cliente_radio"
                value="RETIRADA" 
                checked={formData.tipo_cliente === 'RETIRADA'} 
                onChange={handleRadioChange} 
                className="form-radio text-blue-600"
              />
              Cliente Retirada (Externo)
            </label>
          </div>

          {/* Campos Condicionais */}
          {formData.tipo_cliente === 'CONDOMINIO' && (
            <>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Nome do Responsável (Morador)</label>
                <input name="nome_responsavel" value={formData.nome_responsavel} onChange={handleChange} className="w-full p-2 border rounded-md text-zinc-700 border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">Bloco</label>
                  <input name="bloco" value={formData.bloco || ''} onChange={handleChange} className="w-full p-2 border rounded-md text-zinc-700 border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">Apartamento</label>
                  <input name="apartamento" value={formData.apartamento || ''} onChange={handleChange} className="w-full p-2 border rounded-md text-zinc-700 border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                </div>
              </div>
            </>
          )}
          
          {formData.tipo_cliente === 'RETIRADA' && (
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Quem vai retirar? (Nome do Responsável)</label>
              <input name="nome_responsavel" value={formData.nome_responsavel} onChange={handleChange} className="w-full p-2 border rounded-md text-zinc-700 border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500" required />
              <p className="text-xs text-zinc-500 mt-2">
                A etiqueta incluirá os dados da sua gráfica (Bloco/Apto) automaticamente, com base no cadastro da empresa.
              </p>
            </div>
          )}
          
          {/* Botões */}
          <div className="flex items-center justify-end gap-4 pt-4 border-t mt-6">
            <button type="button" onClick={onClose} className="bg-white text-gray-800 font-bold py-2 px-6 rounded-lg hover:bg-gray-100 border">
              Cancelar
            </button>
            <button type="submit" disabled={isLoading} className="bg-blue-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-blue-700 disabled:bg-blue-300">
              {isLoading ? 'Salvando...' : 'Salvar Etiqueta'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}