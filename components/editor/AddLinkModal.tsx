'use client';

import { useState } from 'react';
import { PLATFORMS } from '@/lib/platforms';
import { PlatformType } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

interface AddLinkModalProps {
  aberto: boolean;
  onFechar: () => void;
  onAdicionar: (dados: { type: PlatformType | 'personalizado'; title: string; url: string }) => Promise<void>;
}

export function AddLinkModal({ aberto, onFechar, onAdicionar }: AddLinkModalProps) {
  const [plataformaSelecionada, setPlataformaSelecionada] = useState<PlatformType | 'personalizado' | null>(null);
  const [titulo, setTitulo] = useState('');
  const [url, setUrl] = useState('');
  const [salvando, setSalvando] = useState(false);

  function selecionarPlataforma(tipo: PlatformType | 'personalizado') {
    setPlataformaSelecionada(tipo);
    if (tipo === 'personalizado') {
      setTitulo('');
      setUrl('');
    } else {
      setTitulo(PLATFORMS[tipo].label);
      setUrl(PLATFORMS[tipo].urlBase);
    }
  }

  async function confirmar() {
    if (!plataformaSelecionada || !url) return;
    setSalvando(true);
    try {
      await onAdicionar({
        type: plataformaSelecionada,
        title: titulo || (plataformaSelecionada !== 'personalizado' ? PLATFORMS[plataformaSelecionada].label : 'Meu Link'),
        url,
      });
      fechar();
    } finally {
      setSalvando(false);
    }
  }

  function fechar() {
    setPlataformaSelecionada(null);
    setTitulo('');
    setUrl('');
    onFechar();
  }

  return (
    <Dialog open={aberto} onOpenChange={(open) => !open && fechar()}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Adicionar link</DialogTitle>
        </DialogHeader>

        {!plataformaSelecionada ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Escolha a plataforma:</p>

            <div className="grid grid-cols-2 gap-2">
              {(Object.entries(PLATFORMS) as [PlatformType, typeof PLATFORMS[PlatformType]][]).map(
                ([tipo, config]) => (
                  <button
                    key={tipo}
                    onClick={() => selecionarPlataforma(tipo)}
                    className="flex items-center gap-2.5 rounded-lg border border-border px-3 py-2.5 text-sm font-medium text-gray-700 hover:border-primary/50 hover:bg-gray-50 transition-colors text-left cursor-pointer"
                  >
                    <div
                      className="h-7 w-7 rounded-md flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: config.color + '20' }}
                    >
                      <config.icon
                        className="h-4 w-4"
                        style={{ color: config.color } as React.CSSProperties}
                      />
                    </div>
                    {config.label}
                  </button>
                )
              )}

              {/* Link personalizado */}
              <button
                onClick={() => selecionarPlataforma('personalizado')}
                className="flex items-center gap-2.5 rounded-lg border border-dashed border-border px-3 py-2.5 text-sm font-medium text-gray-700 hover:border-primary/50 hover:bg-gray-50 transition-colors text-left cursor-pointer"
              >
                <div className="h-7 w-7 rounded-md bg-gray-100 flex items-center justify-center flex-shrink-0">
                  <IconeLink className="h-4 w-4 text-gray-500" />
                </div>
                Link personalizado
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <button
              onClick={() => setPlataformaSelecionada(null)}
              className="flex items-center gap-1 text-sm text-primary hover:underline cursor-pointer"
            >
              ← Voltar
            </button>

            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="link-titulo">Título do botão</Label>
                <Input
                  id="link-titulo"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  placeholder="Ex: Meu Instagram"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="link-url">URL</Label>
                <Input
                  id="link-url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://..."
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={fechar}>
                Cancelar
              </Button>
              <Button
                className="flex-1"
                onClick={confirmar}
                disabled={!url || salvando}
              >
                {salvando ? 'Adicionando...' : 'Adicionar link'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function IconeLink({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 0 0-5.656 0l-4 4a4 4 0 1 0 5.656 5.656l1.102-1.101m-.758-4.899a4 4 0 0 0 5.656 0l4-4a4 4 0 0 0-5.656-5.656l-1.1 1.1" />
    </svg>
  );
}
