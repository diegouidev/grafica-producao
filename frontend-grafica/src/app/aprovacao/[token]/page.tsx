"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import axios from "axios"; 
import { PedidoPublico, ArtePedido } from "@/types";
import { toast } from "react-toastify";
import Image from "next/image";
import { Loader2, Check, X, FileWarning, MessageSquare } from "lucide-react";

const formatCurrency = (value: string | number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value) || 0);
  
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://http://92.112.176.145//api";


export default function PaginaAprovacao() {
  const params = useParams();
  const token = params.token as string;

  const [pedido, setPedido] = useState<PedidoPublico | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [action, setAction] = useState<'aprovar' | 'rejeitar' | null>(null);
  const [comentarioRejeicao, setComentarioRejeicao] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    if (token) {
      const fetchPedidoData = async () => {
        setIsLoading(true);
        try {
          
          const response = await axios.get(`${API_URL}/public/aprovacao/${token}/`);
          setPedido(response.data);
          if (response.data.status_arte === 'APROVADO' || response.data.status_arte === 'REJEITADO') {
            setIsCompleted(true); 
          }
        } catch (err) {
          console.error(err);
          setError("Link inválido ou expirado. Por favor, entre em contato com a gráfica.");
        } finally {
          setIsLoading(false);
        }
      };
      fetchPedidoData();
    }
  }, [token]);

  const handleAction = async () => {
    if (!action || !token) return;
    
    if (action === 'rejeitar' && !comentarioRejeicao) {
        toast.error("Por favor, descreva o motivo da rejeição.");
        return;
    }

    setIsSubmitting(true);
    const url = `${API_URL}/public/aprovacao/${token}/${action}/`;
    const payload = action === 'rejeitar' ? { comentarios_cliente: comentarioRejeicao } : {};

    try {
        await axios.post(url, payload);
        
        setIsCompleted(true);
        setPedido(prev => prev ? { ...prev, status_arte: action === 'aprovar' ? 'APROVADO' : 'REJEITADO' } : null);
        toast.success(`Arte ${action === 'aprovar' ? 'aprovada' : 'rejeitada'} com sucesso!`);
    } catch (err: any) {
        console.error(err);
        if (err.response && err.response.data) {
          const errorMsg = Object.values(err.response.data).join(', ');
          toast.error(`Falha: ${errorMsg}`);
        } else {
          toast.error("Ocorreu um erro ao processar sua solicitação.");
        }
    } finally {
        setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-100">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-100 p-4">
        <div className="text-center bg-white p-10 rounded-lg shadow-md">
          <FileWarning className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-zinc-800">Erro</h1>
          <p className="text-zinc-600 mt-2">{error}</p>
        </div>
      </div>
    );
  }

  if (!pedido) return null;
  
  const arteMaisRecente = pedido.artes.length > 0 
    ? [...pedido.artes].sort((a, b) => new Date(b.data_upload).getTime() - new Date(a.data_upload).getTime())[0]
    : null;

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-10">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-xl overflow-hidden">
        
        <header className="p-6 border-b text-center">
          <h1 className="text-2xl font-bold text-zinc-900">Aprovação de Arte</h1>
          <p className="text-zinc-600">
            Pedido <strong>#{pedido.id}</strong> para <strong>{pedido.cliente_nome}</strong>
          </p>
        </header>

        {isCompleted ? (
          <div className="p-10 text-center">
            {pedido.status_arte === 'APROVADO' ? (
                <>
                    <Check className="h-16 w-16 text-green-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-semibold text-green-700">Arte Aprovada!</h2>
                    <p className="text-zinc-600 mt-2">Obrigado! Recebemos sua aprovação e seu pedido seguirá para a produção.</p>
                </>
            ) : (
                <>
                    <MessageSquare className="h-16 w-16 text-yellow-600 mx-auto mb-4" />
                    <h2 className="text-2xl font-semibold text-yellow-700">Revisão Solicitada</h2>
                    <p className="text-zinc-600 mt-2">Recebemos seus comentários. Nossa equipe fará os ajustes e enviará uma nova versão em breve.</p>
                </>
            )}
            <p className="text-sm text-zinc-500 mt-6">Você já pode fechar esta janela.</p>
          </div>
        ) : (
          <>
            <div className="p-6 md:p-10 bg-gray-50">
              <h2 className="text-lg font-semibold text-zinc-800 mb-4">Arte para Aprovação:</h2>
              {arteMaisRecente ? (
                <div className="border rounded-lg p-4 bg-white">
                  <a href={arteMaisRecente.layout} target="_blank" rel="noopener noreferrer">
                    <Image
                      src={arteMaisRecente.layout}
                      alt="Layout do Pedido"
                      width={800}
                      height={600}
                      unoptimized
                      className="w-full h-auto object-contain rounded-md border"
                    />
                  </a>
                  {arteMaisRecente.comentarios_admin && (
                    <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                      <p className="text-sm font-semibold text-blue-700">Comentários da Gráfica:</p>
                      <p className="text-sm text-zinc-700 italic">"{arteMaisRecente.comentarios_admin}"</p>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-zinc-500">Nenhuma arte foi enviada para este pedido ainda.</p>
              )}
            </div>

            <div className="p-6 md:p-10">
              <h2 className="text-lg font-semibold text-zinc-800 mb-4">O que você gostaria de fazer?</h2>
              
              <div className="space-y-4">
                <div>
                  <button
                    onClick={() => setAction('rejeitar')}
                    className={`w-full text-left p-4 border rounded-lg ${action === 'rejeitar' ? 'border-yellow-500 bg-yellow-50' : 'border-gray-300'}`}
                  >
                    <label className="font-semibold text-zinc-700 flex items-center gap-2">
                      <input 
                        type="radio" 
                        name="acao" 
                        checked={action === 'rejeitar'} 
                        onChange={() => setAction('rejeitar')} 
                        className="form-radio text-yellow-500"
                      />
                      Solicitar Revisão
                    </label>
                    <p className="text-sm text-zinc-600 ml-6">Pedir alterações na arte (descreva abaixo).</p>
                  </button>
                  {action === 'rejeitar' && (
                    <div className="mt-2 pl-6">
                      <textarea
                        value={comentarioRejeicao}
                        onChange={(e) => setComentarioRejeicao(e.target.value)}
                        rows={3}
                        placeholder="Por favor, descreva as alterações necessárias..."
                        className="w-full text-sm text-zinc-700 border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                      />
                    </div>
                  )}
                </div>
                
                <div>
                  <button
                    onClick={() => setAction('aprovar')}
                    className={`w-full text-left p-4 border rounded-lg ${action === 'aprovar' ? 'border-green-500 bg-green-50' : 'border-gray-300'}`}
                  >
                    <label className="font-semibold text-zinc-700 flex items-center gap-2">
                      <input 
                        type="radio" 
                        name="acao" 
                        checked={action === 'aprovar'} 
                        onChange={() => setAction('aprovar')}
                        className="form-radio text-green-500"
                      />
                      Aprovar Arte
                    </label>
                    <p className="text-sm text-zinc-600 ml-6">Confirmar que a arte está correta e pronta para produção.</p>
                  </button>
                </div>
              </div>
              
              <div className="mt-6 text-right">
                <button
                  onClick={handleAction}
                  disabled={!action || isSubmitting}
                  className={`py-3 px-6 rounded-lg font-semibold text-white flex items-center justify-center gap-2
                    ${!action ? 'bg-gray-400 cursor-not-allowed' : ''}
                    ${action === 'aprovar' ? 'bg-green-600 hover:bg-green-700' : ''}
                    ${action === 'rejeitar' ? 'bg-yellow-600 hover:bg-yellow-700' : ''}
                    disabled:opacity-70
                  `}
                >
                  {isSubmitting ? (
                    <Loader2 className="animate-spin" size={20} />
                  ) : (
                    action === 'aprovar' ? <Check size={20} /> : <MessageSquare size={20} />
                  )}
                  {isSubmitting ? 'Enviando...' : (action === 'aprovar' ? 'Confirmar Aprovação' : 'Enviar Solicitação')}
                </button>
              </div>
            </div>
          </>
        )}
        
        <footer className="p-6 border-t bg-gray-50">
          <h3 className="text-base font-semibold text-zinc-700 mb-2">Resumo do Pedido</h3>
          <ul className="divide-y divide-gray-200 text-sm">
            {pedido.itens.map(item => (
              <li key={item.id} className="flex justify-between py-2">
                <span className="text-zinc-600">{item.quantidade}x {item.nome_exibido}</span>
                <span className="font-medium text-zinc-800">{formatCurrency(item.subtotal)}</span>
              </li>
            ))}
          </ul>
          <div className="flex justify-between font-bold text-lg text-zinc-900 mt-2 pt-2 border-t">
            <span>Total:</span>
            <span>{formatCurrency(pedido.valor_total)}</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
