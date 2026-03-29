'use client';

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { Link as LinkType } from '@/types';
import { LinkCard } from './LinkCard';

interface LinkListProps {
  links: LinkType[];
  modoOrdenacao: 'manual' | 'mais-cliques' | 'menos-cliques';
  onReordenar: (links: LinkType[]) => void;
  onUpdate: (id: string, dados: Partial<LinkType>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onFixar: (id: string, posicao: number) => void;
}

export function LinkList({ links, modoOrdenacao, onReordenar, onUpdate, onDelete, onFixar }: LinkListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const overLink = links.find((l) => l.id === over.id);

    // Não permite arrastar para cima de um link fixado
    if (overLink?.pinned) return;

    // Posições fixadas no array atual (índice → link fixado)
    const posicoesPinadas: Record<number, LinkType> = {};
    links.forEach((l, i) => { if (l.pinned) posicoesPinadas[i] = l; });

    // Reordena apenas os links livres
    const livres = links.filter((l) => !l.pinned);
    const oldFreeIndex = livres.findIndex((l) => l.id === active.id);
    const newFreeIndex = livres.findIndex((l) => l.id === over.id);
    const livresReordenados = arrayMove(livres, oldFreeIndex, newFreeIndex);

    // Reconstrói o array completo: fixados nas posições originais, livres nas demais
    const resultado: LinkType[] = new Array(links.length);
    Object.entries(posicoesPinadas).forEach(([idx, link]) => {
      resultado[parseInt(idx)] = link;
    });
    let livreIdx = 0;
    for (let i = 0; i < resultado.length; i++) {
      if (!resultado[i]) resultado[i] = livresReordenados[livreIdx++];
    }

    onReordenar(resultado.map((l, i) => ({ ...l, order: i })));
  }

  if (links.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="h-14 w-14 rounded-full bg-gray-100 flex items-center justify-center mb-3">
          <IconeLink className="h-7 w-7 text-gray-400" />
        </div>
        <p className="text-sm font-medium text-gray-900">Nenhum link adicionado</p>
        <p className="text-xs text-muted-foreground mt-1">
          Clique em &quot;Adicionar link&quot; para começar
        </p>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
      modifiers={[restrictToVerticalAxis]}
    >
      <SortableContext items={links.map((l) => l.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-2">
          {links.map((link, idx) => (
            <LinkCard
              key={link.id}
              link={link}
              modoOrdenacao={modoOrdenacao}
              totalLinks={links.length}
              posicoesFixadas={links
                .map((l, i) => (l.pinned && i !== idx ? i : -1))
                .filter((i) => i !== -1)}
              onUpdate={onUpdate}
              onDelete={onDelete}
              onFixar={onFixar}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

function IconeLink({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 0 0-5.656 0l-4 4a4 4 0 1 0 5.656 5.656l1.102-1.101m-.758-4.899a4 4 0 0 0 5.656 0l4-4a4 4 0 0 0-5.656-5.656l-1.1 1.1" />
    </svg>
  );
}
