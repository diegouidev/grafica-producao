
"use client";

import { useState, useEffect } from "react";
import PageHeader from "@/components/layout/PageHeader";
import { api } from "@/lib/api";
import { PedidoKanban } from "@/types";
import { toast } from "react-toastify";
import {
    DragDropContext,
    DropResult,
    DragStart,
    ResponderProvided,
  } from "@hello-pangea/dnd";
import KanbanColumn from "./KanbanColumn";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

// 1. Definir as colunas e seus títulos
const COLUNAS_PRODUCAO = [
  { id: "Aguardando", title: "Aguardando" },
  { id: "Aguardando Arte", title: "Aguardando Arte" },
  { id: "Em Produção", title: "Em Produção" },
  { id: "Finalizado", title: "Finalizado" },
];

// 2. Definir o tipo para o estado que armazena os pedidos
type PedidosPorStatus = Record<string, PedidoKanban[]>;

export default function ProducaoPage() {
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const [pedidosState, setPedidosState] = useState<PedidosPorStatus>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isDragging, setIsDragging] = useState(false); // Estado para feedback visual

  // 3. Função para buscar os dados
  const fetchKanbanData = async () => {
    setIsLoading(true);
    try {
      const response = await api.get("/pedidos-kanban/");
      setPedidosState(response.data);
    } catch (error) {
      console.error("Erro ao buscar dados do Kanban", error);
      toast.error("Falha ao carregar o quadro de produção.");
    } finally {
      setIsLoading(false);
    }
  };

  // 4. Buscar dados quando o componente montar (e estiver autenticado)
  useEffect(() => {
    if (isAuthenticated && !isAuthLoading) {
      fetchKanbanData();
    }
  }, [isAuthenticated, isAuthLoading]);

  // 5. Função principal que lida com o "soltar" (drop)
  const onDragEnd = (result: DropResult, provided: ResponderProvided) => {
    setIsDragging(false);
    const { source, destination, draggableId } = result;

    // Se soltou fora de uma coluna, não faz nada
    if (!destination) return;

    // Se soltou na mesma coluna e mesma posição, não faz nada
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return;
    }

    const startColumnId = source.droppableId;
    const endColumnId = destination.droppableId;
    const pedidoId = draggableId; // O ID do pedido

    // --- Atualização Otimista da UI ---
    
    // Criar cópias dos arrays de origem e destino
    const startPedidos = Array.from(pedidosState[startColumnId] || []);
    const endPedidos = (startColumnId === endColumnId) 
      ? startPedidos 
      : Array.from(pedidosState[endColumnId] || []);

    // Remover o card da coluna de origem
    const [movedPedido] = startPedidos.splice(source.index, 1);
    
    // Adicionar o card na coluna de destino
    endPedidos.splice(destination.index, 0, movedPedido);

    // Atualiza o estado da UI imediatamente
    const newState = {
      ...pedidosState,
      [startColumnId]: startPedidos,
      [endColumnId]: endPedidos,
    };
    setPedidosState(newState);

    // --- Chamada para a API ---
    // Apenas chama a API se o status (coluna) realmente mudou
    if (startColumnId !== endColumnId) {
      api.patch(`/pedidos/${pedidoId}/`, {
        status_producao: endColumnId,
      })
      .then(() => {
        toast.success(`Pedido #${pedidoId} movido para "${endColumnId}"`);
      })
      .catch((err) => {
        console.error("Falha ao atualizar status", err);
        toast.error("Falha ao atualizar o pedido. Revertendo...");
        
        // --- Rollback em caso de erro ---
        // Pega o estado *anterior* ao 'setState' otimista
        // (Isso é uma simplificação. Em um app complexo, usaríamos o 'pedidosState' de antes do onDragEnd)
        fetchKanbanData(); // A forma mais simples de reverter é buscar os dados de novo
      });
    }
  };

  // 6. Lida com o início do "arrastar" (drag)
  const onDragStart = (start: DragStart, provided: ResponderProvided) => {
    setIsDragging(true);
  };

  if (isLoading || isAuthLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <>
      <PageHeader title="Chão de Fábrica" />
      <p className="text-gray-600 mb-6 -mt-6">
        Arraste os pedidos entre as colunas para atualizar o status da produção.
      </p>

      {/* O overflow-x-auto permite que as colunas rolem horizontalmente
        em telas menores, sem quebrar o layout.
      */}
      <DragDropContext onDragStart={onDragStart} onDragEnd={onDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {COLUNAS_PRODUCAO.map((coluna) => (
            <KanbanColumn
              key={coluna.id}
              statusId={coluna.id}
              title={coluna.title}
              pedidos={pedidosState[coluna.id] || []}
            />
          ))}
        </div>
      </DragDropContext>
    </>
  );
}