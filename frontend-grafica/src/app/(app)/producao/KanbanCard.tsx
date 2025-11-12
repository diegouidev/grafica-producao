
"use client";

import { PedidoKanban } from "@/types";
import { Draggable } from "@hello-pangea/dnd";
import { DollarSign, Calendar, User } from "lucide-react";

type KanbanCardProps = {
  pedido: PedidoKanban;
  index: number;
};

export default function KanbanCard({ pedido, index }: KanbanCardProps) {
  return (
    <Draggable draggableId={String(pedido.id)} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`
            bg-white p-4 rounded-lg shadow-md border mb-3
            ${snapshot.isDragging ? 'ring-2 ring-blue-500 shadow-lg' : ''}
          `}
        >
          {/* Cabeçalho do Card */}
          <div className="flex justify-between items-center mb-2">
            <span className="font-bold text-blue-600">PEDIDO #{pedido.id}</span>
            <span className="text-sm font-semibold text-zinc-700">
              {pedido.valor_formatado}
            </span>
          </div>
          
          {/* Cliente */}
          <p className="text-sm font-medium text-zinc-800 flex items-center gap-2">
            <User size={14} className="text-zinc-500" />
            {pedido.cliente_nome}
          </p>
          
          {/* Data de Entrega */}
          {pedido.previsto_entrega_formatado && (
            <p className="text-xs text-red-600 font-medium mt-2 flex items-center gap-1.5">
              <Calendar size={14} />
              Entrega: {pedido.previsto_entrega_formatado}
            </p>
          )}
        </div>
      )}
    </Draggable>
  );
}