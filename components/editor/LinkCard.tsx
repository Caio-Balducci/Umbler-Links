'use client';

import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Link as LinkType } from '@/types';
import { PLATFORMS } from '@/lib/platforms';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';

interface LinkCardProps {
  link: LinkType;
  onUpdate: (id: string, dados: Partial<LinkType>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function LinkCard({ link, onUpdate, onDelete }: LinkCardProps) {
  const [titulo, setTitulo] = useState(link.title);
  const [url, setUrl] = useState(link.url);
  const [confirmandoExclusao, setConfirmandoExclusao] = useState(false);
  const [salvando, setSalvando] = useState(false);

  const plat = link.type !== 'personalizado' ? PLATFORMS[link.type] : null;

  // Drag & drop
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: link.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  async function salvarCampo(campo: 'title' | 'url', valor: string) {
    if (valor === (campo === 'title' ? link.title : link.url)) return;
    setSalvando(true);
    await onUpdate(link.id, { [campo]: valor });
    setSalvando(false);
  }

  async function toggleAtivo() {
    await onUpdate(link.id, { active: !link.active });
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-start gap-3 rounded-xl border border-border bg-white p-3 shadow-sm"
    >
      {/* Handle de drag */}
      <button
        {...attributes}
        {...listeners}
        className="mt-1 cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 flex-shrink-0 touch-none"
        title="Arrastar"
      >
        <IconeDrag className="h-5 w-5" />
      </button>

      {/* Ícone da plataforma */}
      <div
        className="mt-0.5 h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: plat ? plat.color + '20' : '#f3f4f6' }}
      >
        {plat ? (
          <plat.icon
            className="h-5 w-5"
            style={{ color: plat.color } as React.CSSProperties}
          />
        ) : (
          <IconeLink className="h-5 w-5 text-gray-500" />
        )}
      </div>

      {/* Campos editáveis */}
      <div className="flex-1 min-w-0 space-y-1.5">
        <input
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          onBlur={() => salvarCampo('title', titulo)}
          placeholder="Título do botão"
          className="w-full text-sm font-medium text-gray-900 bg-transparent border-b border-transparent hover:border-border focus:border-primary outline-none pb-0.5 transition-colors"
        />
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onBlur={() => salvarCampo('url', url)}
          placeholder="URL do link"
          className="w-full text-xs text-muted-foreground bg-transparent border-b border-transparent hover:border-border focus:border-primary outline-none pb-0.5 transition-colors"
        />
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
            {link.clickCount} {link.clickCount === 1 ? 'clique' : 'cliques'}
          </Badge>
          {salvando && (
            <span className="text-[10px] text-muted-foreground">Salvando...</span>
          )}
        </div>
      </div>

      {/* Controles direitos */}
      <div className="flex flex-col items-end gap-2 flex-shrink-0">
        <Switch
          checked={link.active}
          onCheckedChange={toggleAtivo}
          aria-label={link.active ? 'Desativar link' : 'Ativar link'}
        />

        {confirmandoExclusao ? (
          <div className="flex gap-1">
            <button
              onClick={() => onDelete(link.id)}
              className="text-[10px] text-destructive font-medium hover:underline"
            >
              Confirmar
            </button>
            <span className="text-[10px] text-gray-400">|</span>
            <button
              onClick={() => setConfirmandoExclusao(false)}
              className="text-[10px] text-gray-500 hover:underline"
            >
              Cancelar
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmandoExclusao(true)}
            className="text-gray-400 hover:text-destructive transition-colors"
            title="Excluir link"
          >
            <IconeLixeira className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}

/* ── Ícones ─────────────────────────────────────────────────────── */

function IconeDrag({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" d="M8 6h.01M8 12h.01M8 18h.01M16 6h.01M16 12h.01M16 18h.01" />
    </svg>
  );
}

function IconeLink({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 0 0-5.656 0l-4 4a4 4 0 1 0 5.656 5.656l1.102-1.101m-.758-4.899a4 4 0 0 0 5.656 0l4-4a4 4 0 0 0-5.656-5.656l-1.1 1.1" />
    </svg>
  );
}

function IconeLixeira({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0 1 16.138 21H7.862a2 2 0 0 1-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v3M4 7h16" />
    </svg>
  );
}
