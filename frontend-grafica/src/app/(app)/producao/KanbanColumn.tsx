// diegouidev/frontend-grafica/frontend-grafica-b318a2e5ae2688e371728c27479b389149866698/src/app/(app)/producao/KanbanColumn.tsx

"use client";

import { PedidoKanban } from "@/types";
import { Droppable } from "@hello-pangea/dnd";
import KanbanCard from "./KanbanCard";

type KanbanColumnProps = {
  statusId: string;
  title: string;
  pedidos: PedidoKanban[];
};

export default function KanbanColumn({ statusId, title, pedidos }: KanbanColumnProps) {
  return (
    <div className="w-80 bg-gray-100 rounded-lg p-3 flex-shrink-0">
      {/* Cabeçalho da Coluna */}
      <h3 className="text-sm font-semibold text-zinc-700 uppercase mb-3 px-1 flex justify-between">
        {title}
        <span className="text-xs bg-gray-300 text-zinc-600 font-bold px-2 py-0.5 rounded-full">
          {pedidos.length}
        </span>
      </h3>

      <Droppable droppableId={statusId}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`
              min-h-[400px] transition-colors
              ${snapshot.isDraggingOver ? 'bg-blue-50' : 'bg-gray-100'}
            `}
          >
            {pedidos.map((pedido, index) => (
              <KanbanCard key={pedido.id} pedido={pedido} index={index} />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
}