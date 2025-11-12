// src/app/(app)/clientes/AddClientModal.tsx
// (Arquivo Modificado)

"use client";

import { useState, FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Cliente, PedidoHistory, OrcamentoHistory } from '@/types'; // <-- 1. IMPORTAR NOVOS TIPOS
import { api } from '@/lib/api';
import axios from 'axios';
import { IMaskInput } from 'react-imask';
import { toast } from 'react-toastify';
import Link from 'next/link'; // <-- 2. IMPORTAR LINK
import { Loader2, ListOrdered, FileText, User } from 'lucide-react'; // <-- 3. IMPORTAR ÍCONES

type AddClientModalProps = {
  isOpen: boolean;
  onClose: () => void;
  clientToEdit: Cliente | null;
};

const initialState = {
  nome: '',
  cpf_cnpj: '',
  email: '',
  telefone: '',
  observacao: '',
  cep: '',
  endereco: '',
  numero: '',
  bairro: '',
  complemento: '',
  cidade: '',
  estado: '',
};

// (Funções de validação validateCPF e validateCNPJ permanecem iguais)
const validateCPF = (cpf: string) => {
  if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;
  let sum = 0, rest;
  for (let i = 1; i <= 9; i++) sum = sum + parseInt(cpf.substring(i-1, i)) * (11 - i);
  rest = (sum * 10) % 11;
  if ((rest === 10) || (rest === 11)) rest = 0;
  if (rest !== parseInt(cpf.substring(9, 10))) return false;
  sum = 0;
  for (let i = 1; i <= 10; i++) sum = sum + parseInt(cpf.substring(i-1, i)) * (12 - i);
  rest = (sum * 10) % 11;
  if ((rest === 10) || (rest === 11)) rest = 0;
  if (rest !== parseInt(cpf.substring(10, 11))) return false;
  return true;
};
const validateCNPJ = (cnpj: string) => {
  if (cnpj.length !== 14 || /^(\d)\1+$/.test(cnpj)) return false;
  let size = cnpj.length - 2;
  let numbers = cnpj.substring(0, size);
  let digits = cnpj.substring(size);
  let sum = 0;
  let pos = size - 7;
  for (let i = size; i >= 1; i--) {
    sum += parseInt(numbers.charAt(size - i)) * pos--;
    if (pos < 2) pos = 9;
  }
  let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(0))) return false;
  size = size + 1;
  numbers = cnpj.substring(0, size);
  sum = 0;
  pos = size - 7;
  for (let i = size; i >= 1; i--) {
    sum += parseInt(numbers.charAt(size - i)) * pos--;
    if (pos < 2) pos = 9;
  }
  result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(1))) return false;
  return true;
};
// ----------------------------------------


export default function AddClientModal({ isOpen, onClose, clientToEdit }: AddClientModalProps) {
  const router = useRouter();
  const [tipoPessoa, setTipoPessoa] = useState<'fisica' | 'juridica'>('fisica');
  const [formData, setFormData] = useState(initialState);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // --- 4. NOVOS ESTADOS PARA O HISTÓRICO E ABAS ---
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('dados');
  const [fullClientData, setFullClientData] = useState<Cliente | null>(null);
  // -----------------------------------------------

  // --- 5. USEEFFECT ATUALIZADO ---
  useEffect(() => {
    if (isOpen) {
      setError(null);
      if (clientToEdit) {
        // --- MODO DE EDIÇÃO ---
        setIsHistoryLoading(true);
        setActiveTab('dados');
        
        // 1. Popula o formulário imediatamente com os dados da lista
        setFormData({
          nome: clientToEdit.nome || '',
          cpf_cnpj: clientToEdit.cpf_cnpj || '',
          email: clientToEdit.email || '',
          telefone: clientToEdit.telefone || '',
          observacao: (clientToEdit as any).observacao || '',
          cep: (clientToEdit as any).cep || '',
          endereco: (clientToEdit as any).endereco || '',
          numero: (clientToEdit as any).numero || '',
          bairro: (clientToEdit as any).bairro || '',
          complemento: (clientToEdit as any).complemento || '',
          cidade: (clientToEdit as any).cidade || '',
          estado: (clientToEdit as any).estado || '',
        });
        
        if (clientToEdit.cpf_cnpj && clientToEdit.cpf_cnpj.length > 11) {
          setTipoPessoa('juridica');
        } else {
          setTipoPessoa('fisica');
        }

        // 2. Busca os dados completos (com histórico)
        const fetchFullClientData = async () => {
          try {
            const response = await api.get(`/clientes/${clientToEdit.id}/`);
            setFullClientData(response.data);
          } catch (err) {
            console.error("Erro ao buscar histórico do cliente", err);
            toast.error("Não foi possível carregar o histórico do cliente.");
          } finally {
            setIsHistoryLoading(false);
          }
        };
        fetchFullClientData();

      } else {
        // --- MODO DE ADIÇÃO ---
        setFormData(initialState);
        setTipoPessoa('fisica');
        setActiveTab('dados');
        setFullClientData(null);
        setIsHistoryLoading(false);
      }
    }
  }, [clientToEdit, isOpen]);
  
  // (handleChange, handleMaskedChange, handleCepBlur permanecem iguais)
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prevState => ({ ...prevState, [name]: value }));
  };
  const handleMaskedChange = (name: string, unmaskedValue: string) => {
    setFormData(prevState => ({ ...prevState, [name]: unmaskedValue }));
  };
  const handleCepBlur = async () => {
    const cep = formData.cep;
    if (cep.length !== 8) return;
    
    try {
      const response = await axios.get(`https://viacep.com.br/ws/${cep}/json/`);
      if (response.data && !response.data.erro) {
        setFormData(prev => ({
          ...prev,
          endereco: response.data.logradouro,
          bairro: response.data.bairro,
          cidade: response.data.localidade,
          estado: response.data.uf,
          complemento: response.data.complemento,
        }));
      }
    } catch (err) {
      console.error("Erro ao buscar CEP", err);
    }
  };

  // (handleSubmit permanece igual)
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    const cleanedCpfCnpj = formData.cpf_cnpj; 
    if (tipoPessoa === 'fisica' && cleanedCpfCnpj.length > 0 && !validateCPF(cleanedCpfCnpj)) {
      setError("CPF inválido. Verifique o número.");
      setIsLoading(false);
      return;
    }
    if (tipoPessoa === 'juridica' && cleanedCpfCnpj.length > 0 && !validateCNPJ(cleanedCpfCnpj)) {
      setError("CNPJ inválido. Verifique o número.");
      setIsLoading(false);
      return;
    }
    
    const cleanedTelefone = formData.telefone; 
    if (cleanedTelefone.length > 0 && cleanedTelefone.length < 10) {
      setError("Número de telefone/WhatsApp incompleto.");
      setIsLoading(false);
      return;
    }
    
    const payload = {
      ...formData,
      cpf_cnpj: cleanedCpfCnpj,
      telefone: cleanedTelefone,
      cep: formData.cep, 
    };

    try {
      if (clientToEdit) {
        await api.put(`/clientes/${clientToEdit.id}/`, payload);
        toast.success("Cliente atualizado com sucesso!");
      } else {
        await api.post('/clientes/', payload);
        toast.success("Cliente criado com sucesso!");
      }
      router.refresh(); 
      onClose();
    } catch (err) {
      console.error("Erro ao salvar cliente:", err);
      let errorMsg = "Falha ao salvar. Verifique os dados.";
      if (axios.isAxiosError(err) && err.response?.data) {
        errorMsg = Object.values(err.response.data).join(', ');
      }
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const isEditMode = !!clientToEdit;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-start pt-8 pb-8 overflow-y-auto">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-3xl">
        <h2 className="text-xl font-bold mb-4 border-b pb-4 text-zinc-600">
          {clientToEdit ? 'Editar Cliente' : 'Novo Cliente'}
        </h2>
        
        {/* --- 6. RENDERIZAÇÃO DAS ABAS --- */}
        {isEditMode && (
          <div className="mb-4 border-b border-gray-200">
            <nav className="-mb-px flex space-x-6" aria-label="Tabs">
              <TabButton
                icon={User}
                label="Dados Cadastrais"
                isActive={activeTab === 'dados'}
                onClick={() => setActiveTab('dados')}
              />
              <TabButton
                icon={ListOrdered}
                label="Pedidos"
                isActive={activeTab === 'pedidos'}
                onClick={() => setActiveTab('pedidos')}
                count={fullClientData?.pedidos?.length}
              />
              <TabButton
                icon={FileText}
                label="Orçamentos"
                isActive={activeTab === 'orcamentos'}
                onClick={() => setActiveTab('orcamentos')}
                count={fullClientData?.orcamentos?.length}
              />
            </nav>
          </div>
        )}

        {/* --- 7. PAINÉIS DAS ABAS --- */}
        <div>
          {/* Painel de Dados Cadastrais (O Formulário) */}
          <div className={activeTab === 'dados' ? 'block' : 'hidden'}>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-700 mb-3">Dados Pessoais</h3>
                <div className="flex items-center gap-6 mb-4">
                  <label className="flex items-center gap-2 cursor-pointer text-zinc-600">
                    <input type="radio" name="tipoPessoa" value="fisica" checked={tipoPessoa === 'fisica'} onChange={() => setTipoPessoa('fisica')} />
                    Pessoa Física
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-zinc-600">
                    <input type="radio" name="tipoPessoa" value="juridica" checked={tipoPessoa === 'juridica'} onChange={() => setTipoPessoa('juridica')} />
                    Pessoa Jurídica
                  </label>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">{tipoPessoa === 'fisica' ? 'Nome do Cliente' : 'Razão Social'}</label>
                    <input type="text" name="nome" value={formData.nome} onChange={handleChange} className="w-full p-2 border rounded-md text-zinc-700 border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">{tipoPessoa === 'fisica' ? 'CPF' : 'CNPJ'}</label>
                    <IMaskInput
                      mask={tipoPessoa === 'fisica' ? '000.000.000-00' : '00.000.000/0000-00'}
                      type="text" 
                      name="cpf_cnpj" 
                      value={formData.cpf_cnpj} 
                      unmask={true} 
                      onAccept={(value) => handleMaskedChange('cpf_cnpj', value as string)}
                      className="w-full p-2 border rounded-md text-zinc-700 border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Email</label>
                    <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full p-2 border rounded-md text-zinc-700 border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Whatsapp</label>
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
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-600 mb-1">Observação do Cliente</label>
                  <textarea name="observacao" value={formData.observacao} onChange={handleChange} className="w-full p-2 border rounded-md text-zinc-700 border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500" rows={3}></textarea>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-gray-700 mb-3">Endereço</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="md:col-span-1">
                    <label className="block text-sm font-medium text-zinc-600 mb-1">CEP</label>
                    <IMaskInput
                      mask="00000-000"
                      type="text"
                      name="cep" 
                      value={formData.cep} 
                      unmask={true}
                      onAccept={(value) => handleMaskedChange('cep', value as string)}
                      onBlur={handleCepBlur}
                      className="w-full p-2 border rounded-md text-zinc-700 border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="md:col-span-3"><label className="block text-sm font-medium text-zinc-600 mb-1">Endereço</label><input name="endereco" value={formData.endereco} onChange={handleChange} className="w-full p-2 border rounded-md text-zinc-700 border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
                  <div className="md:col-span-1"><label className="block text-sm font-medium text-zinc-600 mb-1">Número</label><input name="numero" value={formData.numero} onChange={handleChange} className="w-full p-2 border rounded-md text-zinc-700 border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
                  <div className="md:col-span-3"><label className="block text-sm font-medium text-zinc-600 mb-1">Bairro</label><input name="bairro" value={formData.bairro} onChange={handleChange} className="w-full p-2 border rounded-md text-zinc-700 border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
                  <div className="md:col-span-4"><label className="block text-sm font-medium text-zinc-600 mb-1">Complemento</label><input name="complemento" value={formData.complemento} onChange={handleChange} className="w-full p-2 border rounded-md text-zinc-700 border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
                  <div className="md:col-span-3"><label className="block text-sm font-medium text-zinc-600 mb-1">Cidade</label><input name="cidade" value={formData.cidade} onChange={handleChange} className="w-full p-2 border rounded-md text-zinc-700 border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
                  <div className="md:col-span-1"><label className="block text-sm font-medium text-zinc-600 mb-1">Estado</label><input name="estado" value={formData.estado} onChange={handleChange} maxLength={2} className="w-full p-2 border rounded-md text-zinc-700 border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
                </div>
              </div>
              
              {error && <p className="text-red-500 text-sm mt-2 text-center">{error}</p>}
              
              <div className="flex items-center justify-end gap-4 pt-4 border-t mt-6">
                <button type="button" onClick={onClose} className="bg-white text-gray-800 font-bold py-2 px-6 rounded-lg hover:bg-gray-100 border">
                  Cancelar
                </button>
                <button type="submit" disabled={isLoading} className="bg-blue-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-blue-700 disabled:bg-blue-300">
                  {isLoading ? 'Salvando...' : (clientToEdit ? 'Salvar Alterações' : 'Adicionar Cliente')}
                </button>
              </div>
            </form>
          </div>

          {/* Painel de Pedidos */}
          <div className={activeTab === 'pedidos' ? 'block' : 'hidden'}>
            <HistoryTabContent
              isLoading={isHistoryLoading}
              items={fullClientData?.pedidos || []}
              type="pedido"
              onCloseModal={onClose}
            />
          </div>

          {/* Painel de Orçamentos */}
          <div className={activeTab === 'orcamentos' ? 'block' : 'hidden'}>
            <HistoryTabContent
              isLoading={isHistoryLoading}
              items={fullClientData?.orcamentos || []}
              type="orcamento"
              onCloseModal={onClose}
            />
          </div>
        </div>

      </div>
    </div>
  );
}

// --- 8. COMPONENTES INTERNOS ---

// Botão de Aba customizado
function TabButton({ icon: Icon, label, isActive, onClick, count }: any) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        ${isActive ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
        whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2
      `}
    >
      <Icon size={16} />
      {label}
      {count !== undefined && (
        <span className={`ml-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
          isActive ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
        }`}>
          {count}
        </span>
      )}
    </button>
  );
}

// Componente de Conteúdo da Aba de Histórico
function HistoryTabContent({ isLoading, items, type, onCloseModal }: {
  isLoading: boolean;
  items: PedidoHistory[] | OrcamentoHistory[];
  type: 'pedido' | 'orcamento';
  onCloseModal: () => void;
}) {
  const formatCurrency = (value: string | number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value));
  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('pt-BR');

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="animate-spin text-blue-500" size={32} />
      </div>
    );
  }

  if (items.length === 0) {
    return <p className="text-center text-gray-500 py-10">Nenhum {type === 'pedido' ? 'pedido' : 'orçamento'} encontrado para este cliente.</p>;
  }

  return (
    <div className="max-h-96 overflow-y-auto">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-50 sticky top-0">
          <tr>
            <th className="px-4 py-2 text-left font-semibold text-zinc-600">ID</th>
            <th className="px-4 py-2 text-left font-semibold text-zinc-600">Data</th>
            <th className="px-4 py-2 text-left font-semibold text-zinc-600">Status</th>
            <th className="px-4 py-2 text-left font-semibold text-zinc-600">Valor</th>
            <th className="px-4 py-2 text-left font-semibold text-zinc-600">Ação</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {items.map((item) => {
            
            // --- INÍCIO DA CORREÇÃO ---
            const itemStatus = type === 'pedido' ? (item as PedidoHistory).status_producao : (item as OrcamentoHistory).status;
            
            // Define se o link "Ver" deve ser mostrado
            const showLink = !(type === 'orcamento' && itemStatus === 'Aprovado');
            // --- FIM DA CORREÇÃO ---

            return (
              <tr key={item.id}>
                <td className="px-4 py-3 font-medium text-blue-600">#{item.id}</td>
                <td className="px-4 py-3 text-zinc-600">{formatDate(item.data_criacao)}</td>
                <td className="px-4 py-3 text-zinc-600">
                  {itemStatus}
                </td>
                <td className="px-4 py-3 text-zinc-800 font-medium">{formatCurrency(item.valor_total)}</td>
                <td className="px-4 py-3">
                  
                  {/* --- LÓGICA CONDICIONAL APLICADA --- */}
                  {showLink ? (
                    <Link
                      href={`/${type}s/${item.id}/editar`}
                      onClick={onCloseModal} // Fecha o modal ao navegar
                      className="text-blue-600 hover:underline font-medium"
                    >
                      Ver
                    </Link>
                  ) : (
                    <span className="text-gray-400 text-xs italic">Convertido</span>
                  )}
                  {/* --- FIM DA LÓGICA --- */}

                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}