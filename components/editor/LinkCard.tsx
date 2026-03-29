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
  modoOrdenacao: 'manual' | 'mais-cliques' | 'menos-cliques';
  totalLinks: number;
  posicoesFixadas: number[];
  onUpdate: (id: string, dados: Partial<LinkType>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onFixar: (id: string, posicao: number) => void;
}

export function LinkCard({ link, modoOrdenacao, totalLinks, posicoesFixadas, onUpdate, onDelete, onFixar }: LinkCardProps) {
  const [titulo, setTitulo] = useState(link.title);
  const [url, setUrl] = useState(link.url);
  const [confirmandoExclusao, setConfirmandoExclusao] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [modalFixarAberto, setModalFixarAberto] = useState(false);

  const plat = link.type !== 'personalizado' ? PLATFORMS[link.type] : null;
  const draggable = modoOrdenacao === 'manual' && !link.pinned;

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: link.id, disabled: !draggable });

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

  function clicarFixar() {
    if (link.pinned) {
      onUpdate(link.id, { pinned: false });
    } else {
      setModalFixarAberto(true);
    }
  }

  function escolherPosicao(posicao: number) {
    setModalFixarAberto(false);
    onFixar(link.id, posicao);
  }

  return (
    <>
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-start gap-3 rounded-xl border bg-white p-3 shadow-sm transition-colors ${
        link.pinned ? 'border-primary/40 bg-primary/5' : 'border-border'
      }`}
    >
      {/* Handle de drag */}
      <button
        {...(draggable ? { ...attributes, ...listeners } : {})}
        className={`mt-1 flex-shrink-0 touch-none ${
          draggable
            ? 'cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600'
            : 'cursor-not-allowed text-gray-200'
        }`}
        title={!draggable ? (link.pinned ? 'Link fixado' : 'Desative a ordenação automática para arrastar') : 'Arrastar'}
        tabIndex={-1}
      >
        <IconeDrag className="h-5 w-5" />
      </button>

      {/* Ícone da plataforma */}
      <div
        className="mt-0.5 h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: plat ? plat.color + '20' : '#f3f4f6' }}
      >
        {plat ? (
          <plat.icon className="h-5 w-5" style={{ color: plat.color } as React.CSSProperties} />
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

        {/* Fixar */}
        <button
          onClick={clicarFixar}
          className={`flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] font-medium transition-colors cursor-pointer ${
            link.pinned
              ? 'border-primary/40 bg-primary/5 text-primary hover:bg-primary/10'
              : 'border-border text-gray-500 hover:border-primary/40 hover:text-primary'
          }`}
        >
          <IconeFixar className="h-3 w-3" />
          {link.pinned ? 'Desafixar' : 'Fixar'}
        </button>

        {/* Excluir */}
        <button
          onClick={() => setConfirmandoExclusao(true)}
          className="flex items-center gap-1 rounded-md border border-red-200 px-2 py-1 text-[11px] font-medium text-red-500 hover:border-red-300 hover:bg-red-50 transition-colors cursor-pointer"
        >
          <IconeLixeira className="h-3 w-3" />
          Excluir
        </button>
      </div>
    </div>

    {/* Modal de confirmação de exclusão */}
    {confirmandoExclusao && (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
        onClick={(e) => { if (e.target === e.currentTarget) setConfirmandoExclusao(false); }}
      >
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-red-100">
              <IconeLixeira className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-900">Excluir link</h2>
              <p className="mt-1 text-sm text-gray-600">
                Deseja deletar o link <span className="font-semibold">&ldquo;{link.title}&rdquo;</span>? Esta ação não pode ser desfeita.
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setConfirmandoExclusao(false)}
              className="flex-1 rounded-lg border border-border py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              onClick={() => { setConfirmandoExclusao(false); onDelete(link.id); }}
              className="flex-1 rounded-lg bg-red-600 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors cursor-pointer"
            >
              Excluir
            </button>
          </div>
        </div>
      </div>
    )}

    {/* Modal de escolha de posição */}

    {modalFixarAberto && (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
        onClick={(e) => { if (e.target === e.currentTarget) setModalFixarAberto(false); }}
      >
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-xs p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-gray-900">Fixar link</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Escolha a posição</p>
            </div>
            <button
              onClick={() => setModalFixarAberto(false)}
              className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
            >
              <IconeX className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {Array.from({ length: totalLinks }, (_, i) => {
              const ocupada = posicoesFixadas.includes(i);
              return (
                <button
                  key={i}
                  onClick={() => !ocupada && escolherPosicao(i)}
                  disabled={ocupada}
                  className={`flex flex-col items-center gap-1 rounded-xl border py-3 transition-colors ${
                    ocupada
                      ? 'border-border bg-gray-50 opacity-40 cursor-not-allowed'
                      : 'border-border hover:border-primary hover:bg-primary/5 cursor-pointer'
                  }`}
                >
                  <span className="text-lg font-bold text-gray-800">{i + 1}</span>
                  <span className="text-[9px] text-muted-foreground">{ocupada ? 'fixado' : 'posição'}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    )}
    </>
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

function IconeFixar({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z" />
    </svg>
  );
}

function IconeX({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}
