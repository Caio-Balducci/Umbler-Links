'use client';

import { useState, useEffect, useRef } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { getUserProfile, getUserLinks, updateUserTheme } from '@/lib/firestore';
import { UserProfile, Link as LinkType, ThemeConfig } from '@/types';
import { MobilePreview } from '@/components/editor/MobilePreview';
import { ColorPicker } from '@/components/design/ColorPicker';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Skeleton } from '@/components/ui/skeleton';

const FONTES = ['Inter', 'Roboto', 'Poppins', 'Playfair Display', 'Space Mono'];

const ESQUEMAS_PRONTOS = [
  {
    nome: 'Roxo Umbler',
    tema: {
      backgroundType: 'gradiente' as const,
      backgroundColor: '#6B2FD9',
      gradientTop: '#6B2FD9',
      gradientBottom: '#8B4FF0',
      nameColor: '#ffffff',
      titleColor: '#ffffff',
      descriptionColor: 'rgba(255,255,255,0.8)',
      buttonColor: '#ffffff',
      buttonTextColor: '#6B2FD9',
    },
  },
  {
    nome: 'Minimal Claro',
    tema: {
      backgroundType: 'solido' as const,
      backgroundColor: '#ffffff',
      gradientTop: undefined,
      gradientBottom: undefined,
      nameColor: '#111827',
      titleColor: '#374151',
      descriptionColor: '#6b7280',
      buttonColor: '#111827',
      buttonTextColor: '#ffffff',
    },
  },
  {
    nome: 'Minimal Escuro',
    tema: {
      backgroundType: 'solido' as const,
      backgroundColor: '#111827',
      gradientTop: undefined,
      gradientBottom: undefined,
      nameColor: '#f9fafb',
      titleColor: '#e5e7eb',
      descriptionColor: '#9ca3af',
      buttonColor: '#f9fafb',
      buttonTextColor: '#111827',
    },
  },
  {
    nome: 'Oceano',
    tema: {
      backgroundType: 'gradiente' as const,
      backgroundColor: '#0ea5e9',
      gradientTop: '#0ea5e9',
      gradientBottom: '#6366f1',
      nameColor: '#ffffff',
      titleColor: '#ffffff',
      descriptionColor: 'rgba(255,255,255,0.85)',
      buttonColor: 'rgba(255,255,255,0.2)',
      buttonTextColor: '#ffffff',
    },
  },
];

export default function PaginaDesign() {
  const [uid, setUid] = useState<string | null>(null);
  const [perfil, setPerfil] = useState<UserProfile | null>(null);
  const [links, setLinks] = useState<LinkType[]>([]);
  const [tema, setTema] = useState<ThemeConfig | null>(null);
  const [carregando, setCarregando] = useState(true);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const cancelar = onAuthStateChanged(auth, async (user) => {
      if (!user) return;
      setUid(user.uid);
      const [p, l] = await Promise.all([getUserProfile(user.uid), getUserLinks(user.uid)]);
      if (p) {
        setPerfil(p);
        setTema(p.theme);
      }
      setLinks(l);
      setCarregando(false);
    });
    return () => cancelar();
  }, []);

  function atualizarTema(parcial: Partial<ThemeConfig>) {
    if (!tema || !uid) return;
    const novoTema = { ...tema, ...parcial };
    setTema(novoTema);
    setPerfil((prev) => prev ? { ...prev, theme: novoTema } : prev);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      updateUserTheme(uid, novoTema).catch(console.error);
    }, 1000);
  }

  function aplicarEsquema(esquema: typeof ESQUEMAS_PRONTOS[0]) {
    atualizarTema(esquema.tema);
  }

  if (carregando || !tema) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-72 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="flex gap-0 min-h-screen">
      {/* ── Editor ───────────────────────────────────────────────── */}
      <div className="flex-1 max-w-2xl px-4 sm:px-6 py-6 space-y-2">
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-gray-900">Design</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Personalize a aparência da sua página. Salvo automaticamente.
          </p>
        </div>

        {/* Esquemas prontos */}
        <div className="bg-white rounded-xl border border-border p-4 space-y-3">
          <h3 className="text-sm font-semibold text-gray-700">Esquemas rápidos</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {ESQUEMAS_PRONTOS.map((e) => (
              <button
                key={e.nome}
                onClick={() => aplicarEsquema(e)}
                className="rounded-lg border border-border p-2 text-xs font-medium text-gray-700 hover:border-primary hover:bg-primary/5 transition-colors text-center"
              >
                {e.nome}
              </button>
            ))}
          </div>
        </div>

        <Accordion multiple defaultValue={['cabecalho', 'fundo']} className="space-y-2">
          {/* ── Cabeçalho ─────────────────────────────── */}
          <AccordionItem value="cabecalho" className="bg-white rounded-xl border border-border px-4">
            <AccordionTrigger className="text-sm font-semibold text-gray-700 hover:no-underline">
              Cabeçalho
            </AccordionTrigger>
            <AccordionContent className="pb-4 space-y-3">
              <p className="text-xs text-muted-foreground">Forma do avatar</p>
              <div className="flex gap-2">
                {(['circular', 'quadrado', 'fundo'] as const).map((shape) => (
                  <button
                    key={shape}
                    onClick={() => atualizarTema({ avatarShape: shape })}
                    className={`flex-1 py-2 text-xs font-medium rounded-lg border transition-colors ${tema.avatarShape === shape
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border text-gray-600 hover:border-primary/50'
                      }`}
                  >
                    {shape === 'circular' ? 'Circular' : shape === 'quadrado' ? 'Quadrado' : 'Com fundo'}
                  </button>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* ── Fundo ────────────────────────────────── */}
          <AccordionItem value="fundo" className="bg-white rounded-xl border border-border px-4">
            <AccordionTrigger className="text-sm font-semibold text-gray-700 hover:no-underline">
              Fundo
            </AccordionTrigger>
            <AccordionContent className="pb-4 space-y-4">
              <div className="flex gap-2">
                {(['solido', 'gradiente'] as const).map((tipo) => (
                  <button
                    key={tipo}
                    onClick={() => atualizarTema({ backgroundType: tipo })}
                    className={`flex-1 py-2 text-xs font-medium rounded-lg border transition-colors ${tema.backgroundType === tipo
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border text-gray-600 hover:border-primary/50'
                      }`}
                  >
                    {tipo === 'solido' ? 'Cor sólida' : 'Gradiente'}
                  </button>
                ))}
              </div>

              {tema.backgroundType === 'solido' ? (
                <ColorPicker
                  label="Cor do fundo"
                  cor={tema.backgroundColor}
                  onChange={(c) => atualizarTema({ backgroundColor: c })}
                />
              ) : (
                <div className="flex gap-4 flex-wrap">
                  <ColorPicker
                    label="Cor superior"
                    cor={tema.gradientTop ?? '#6B2FD9'}
                    onChange={(c) => atualizarTema({ gradientTop: c })}
                  />
                  <ColorPicker
                    label="Cor inferior"
                    cor={tema.gradientBottom ?? '#8B4FF0'}
                    onChange={(c) => atualizarTema({ gradientBottom: c })}
                  />
                </div>
              )}
            </AccordionContent>
          </AccordionItem>

          {/* ── Texto ─────────────────────────────────── */}
          <AccordionItem value="texto" className="bg-white rounded-xl border border-border px-4">
            <AccordionTrigger className="text-sm font-semibold text-gray-700 hover:no-underline">
              Texto
            </AccordionTrigger>
            <AccordionContent className="pb-4 space-y-5">
              {([
                ['Título / Nome', 'titleFont', 'titleColor', 'nameColor'],
                ['Descrição', 'descriptionFont', 'descriptionColor', null],
                ['Links', 'linkFont', 'linkColor', null],
              ] as const).map(([label, fontKey, colorKey, extraColorKey]) => (
                <div key={label} className="space-y-2">
                  <p className="text-xs font-medium text-gray-600">{label}</p>
                  <div className="flex flex-wrap gap-3 items-end">
                    <div className="space-y-1">
                      <span className="text-xs text-gray-500">Fonte</span>
                      <select
                        value={tema[fontKey]}
                        onChange={(e) => atualizarTema({ [fontKey]: e.target.value })}
                        className="rounded-lg border border-border bg-white px-2.5 py-1.5 text-xs outline-none focus:ring-1 focus:ring-primary"
                      >
                        {FONTES.map((f) => <option key={f} value={f}>{f}</option>)}
                      </select>
                    </div>
                    <ColorPicker
                      label="Cor"
                      cor={tema[colorKey] as string}
                      onChange={(c) => atualizarTema({ [colorKey]: c })}
                    />
                    {extraColorKey && (
                      <ColorPicker
                        label="Cor do nome"
                        cor={tema[extraColorKey] as string}
                        onChange={(c) => atualizarTema({ [extraColorKey]: c })}
                      />
                    )}
                  </div>
                </div>
              ))}
            </AccordionContent>
          </AccordionItem>

          {/* ── Botões ─────────────────────────────────── */}
          <AccordionItem value="botoes" className="bg-white rounded-xl border border-border px-4">
            <AccordionTrigger className="text-sm font-semibold text-gray-700 hover:no-underline">
              Estilo de botão
            </AccordionTrigger>
            <AccordionContent className="pb-4 space-y-4">
              {/* Sólido / Borda */}
              <div className="flex gap-2">
                {(['solido', 'borda'] as const).map((estilo) => (
                  <button
                    key={estilo}
                    onClick={() => atualizarTema({ buttonStyle: estilo })}
                    className={`flex-1 py-2 text-xs font-medium rounded-lg border transition-colors ${tema.buttonStyle === estilo
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border text-gray-600 hover:border-primary/50'
                      }`}
                  >
                    {estilo === 'solido' ? 'Sólido' : 'Borda'}
                  </button>
                ))}
              </div>

              {/* Border radius */}
              <div className="space-y-2">
                <p className="text-xs text-gray-500">Arredondamento</p>
                <div className="grid grid-cols-4 gap-2">
                  {([
                    ['retangular', '0px'],
                    ['quadrado', '4px'],
                    ['arredondado', '8px'],
                    ['full', '9999px'],
                  ] as const).map(([val, radius]) => (
                    <button
                      key={val}
                      onClick={() => atualizarTema({ buttonBorderRadius: val })}
                      className={`py-2.5 border transition-colors text-xs font-medium ${tema.buttonBorderRadius === val
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border text-gray-600 hover:border-primary/50'
                        }`}
                      style={{ borderRadius: radius }}
                    >
                      Aa
                    </button>
                  ))}
                </div>
              </div>

              {/* Cores */}
              <div className="flex flex-wrap gap-4">
                <ColorPicker
                  label="Cor do botão"
                  cor={tema.buttonColor}
                  onChange={(c) => atualizarTema({ buttonColor: c })}
                />
                <ColorPicker
                  label="Cor do texto"
                  cor={tema.buttonTextColor}
                  onChange={(c) => atualizarTema({ buttonTextColor: c })}
                />
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* ── Esquema de cores ─────────────────────────── */}
          <AccordionItem value="cores" className="bg-white rounded-xl border border-border px-4">
            <AccordionTrigger className="text-sm font-semibold text-gray-700 hover:no-underline">
              Esquema de cores
            </AccordionTrigger>
            <AccordionContent className="pb-4">
              <div className="flex flex-wrap gap-4">
                <ColorPicker label="Fundo" cor={tema.backgroundColor} onChange={(c) => atualizarTema({ backgroundColor: c })} />
                <ColorPicker label="Nome" cor={tema.nameColor} onChange={(c) => atualizarTema({ nameColor: c })} />
                <ColorPicker label="Título" cor={tema.titleColor} onChange={(c) => atualizarTema({ titleColor: c })} />
                <ColorPicker label="Descrição" cor={tema.descriptionColor} onChange={(c) => atualizarTema({ descriptionColor: c })} />
                <ColorPicker label="Botão" cor={tema.buttonColor} onChange={(c) => atualizarTema({ buttonColor: c })} />
                <ColorPicker label="Texto botão" cor={tema.buttonTextColor} onChange={(c) => atualizarTema({ buttonTextColor: c })} />
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>

      {/* ── Preview mobile (desktop only) ────────────────────────── */}
      <div className="hidden xl:flex items-start pt-6 pr-8 sticky top-6 self-start">
        {perfil && <MobilePreview perfil={perfil} links={links} />}
      </div>
    </div>
  );
}
