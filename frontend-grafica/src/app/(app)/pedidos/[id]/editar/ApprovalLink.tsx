// src/app/(app)/pedidos/[id]/editar/ApprovalLink.tsx
// (Novo Arquivo)

"use client";

import { useState, useEffect } from "react";
import { Copy, Check } from "lucide-react";
import { toast } from "react-toastify";

type ApprovalLinkProps = {
  token: string | null;
};

export default function ApprovalLink({ token }: ApprovalLinkProps) {
  const [baseUrl, setBaseUrl] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Garante que o window.location.origin seja lido apenas no cliente
    setBaseUrl(window.location.origin);
  }, []);

  if (!token) {
    return (
      <div className="mt-4 p-4 border border-dashed rounded-lg text-center text-sm text-zinc-500">
        <p>Envie a primeira arte para gerar o link de aprovação para o cliente.</p>
      </div>
    );
  }

  const approvalLink = `${baseUrl}/aprovacao/${token}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(approvalLink).then(() => {
      setCopied(true);
      toast.success("Link copiado para a área de transferência!");
      setTimeout(() => setCopied(false), 2000);
    }).catch(err => {
      toast.error("Falha ao copiar o link.");
      console.error('Falha ao copiar:', err);
    });
  };

  return (
    <div className="mt-6 p-4 border rounded-lg bg-gray-50">
      <label className="block text-sm font-medium text-zinc-700 mb-2">
        Link Público de Aprovação
      </label>
      <div className="flex gap-2">
        <input
          type="text"
          value={approvalLink}
          readOnly
          className="w-full p-2 border rounded-md text-zinc-500 bg-gray-200 focus:outline-none"
        />
        <button
          onClick={handleCopy}
          className={`w-12 h-10 flex-shrink-0 flex items-center justify-center rounded-md ${
            copied
              ? 'bg-green-600 text-white'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
          title="Copiar Link"
        >
          {copied ? <Check size={18} /> : <Copy size={18} />}
        </button>
      </div>
      <p className="text-xs text-zinc-500 mt-2">
        Envie este link para seu cliente. Ele poderá aprovar ou solicitar revisões da arte por esta página.
      </p>
    </div>
  );
}