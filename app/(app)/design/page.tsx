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
import { Wand2, User, ImageIcon, Type, SquareDashed, Palette, X } from 'lucide-react';

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

type TabId = 'temas' | 'cabecalho' | 'fundo' | 'texto' | 'botoes' | 'cores';

const TABS_MOBILE: { id: TabId; label: string; Icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'temas', label: 'Temas', Icon: Wand2 },
  { id: 'cabecalho', label: 'Cabeçalho', Icon: User },
  { id: 'fundo', label: 'Fundo', Icon: ImageIcon },
  { id: 'texto', label: 'Texto', Icon: Type },
  { id: 'botoes', label: 'Botões', Icon: SquareDashed },
  { id: 'cores', label: 'Cores', Icon: Palette },
];

const LABEL_POR_TAB: Record<TabId, string> = {
  temas: 'Temas rápidos',
  cabecalho: 'Cabeçalho',
  fundo: 'Fundo',
  texto: 'Texto',
  botoes: 'Estilo de botão',
  cores: 'Esquema de cores',
};

export default function PaginaDesign() {
  const [uid, setUid] = useState<string | null>(null);
  const [perfil, setPerfil] = useState<UserProfile | null>(null);
  const [links, setLinks] = useState<LinkType[]>([]);
  const [tema, setTema] = useState<ThemeConfig | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [activeTab, setActiveTab] = useState<TabId | null>(null);
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

  /* ── Blocos de conteúdo reutilizados no mobile e no desktop ── */

  const conteudoTemas = (
    <div className="grid grid-cols-2 gap-2">
      {ESQUEMAS_PRONTOS.map((e) => (
        <button
          key={e.nome}
          onClick={() => aplicarEsquema(e)}
          className="rounded-lg border border-border p-2 text-xs font-medium text-gray-700 hover:border-primary hover:bg-primary/5 transition-colors text-center cursor-pointer"
        >
          {e.nome}
        </button>
      ))}
    </div>
  );

  const conteudoCabecalho = (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">Forma do avatar</p>
      <div className="flex gap-2">
        {(['circular', 'quadrado', 'fundo'] as const).map((shape) => (
          <button
            key={shape}
            onClick={() => atualizarTema({ avatarShape: shape })}
            className={`flex-1 py-2 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${tema.avatarShape === shape
              ? 'border-primary bg-primary/10 text-primary'
              : 'border-border text-gray-600 hover:border-primary/50'
              }`}
          >
            {shape === 'circular' ? 'Circular' : shape === 'quadrado' ? 'Quadrado' : 'Com fundo'}
          </button>
        ))}
      </div>
    </div>
  );

  const conteudoFundo = (
    <div className="space-y-4">
      <div className="flex gap-2">
        {(['solido', 'gradiente'] as const).map((tipo) => (
          <button
            key={tipo}
            onClick={() => atualizarTema({ backgroundType: tipo })}
            className={`flex-1 py-2 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${tema.backgroundType === tipo
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
    </div>
  );

  const conteudoTexto = (
    <div className="space-y-5">
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
    </div>
  );

  const conteudoBotoes = (
    <div className="space-y-4">
      <div className="flex gap-2">
        {(['solido', 'borda'] as const).map((estilo) => (
          <button
            key={estilo}
            onClick={() => atualizarTema({ buttonStyle: estilo })}
            className={`flex-1 py-2 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${tema.buttonStyle === estilo
              ? 'border-primary bg-primary/10 text-primary'
              : 'border-border text-gray-600 hover:border-primary/50'
              }`}
          >
            {estilo === 'solido' ? 'Sólido' : 'Borda'}
          </button>
        ))}
      </div>
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
              className={`py-2.5 border transition-colors text-xs font-medium cursor-pointer ${tema.buttonBorderRadius === val
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
    </div>
  );

  const conteudoCores = (
    <div className="flex flex-wrap gap-4">
      <ColorPicker label="Fundo" cor={tema.backgroundColor} onChange={(c) => atualizarTema({ backgroundColor: c })} />
      <ColorPicker label="Nome" cor={tema.nameColor} onChange={(c) => atualizarTema({ nameColor: c })} />
      <ColorPicker label="Título" cor={tema.titleColor} onChange={(c) => atualizarTema({ titleColor: c })} />
      <ColorPicker label="Descrição" cor={tema.descriptionColor} onChange={(c) => atualizarTema({ descriptionColor: c })} />
      <ColorPicker label="Botão" cor={tema.buttonColor} onChange={(c) => atualizarTema({ buttonColor: c })} />
      <ColorPicker label="Texto botão" cor={tema.buttonTextColor} onChange={(c) => atualizarTema({ buttonTextColor: c })} />
    </div>
  );

  const conteudoPorTab: Record<TabId, React.ReactNode> = {
    temas: conteudoTemas,
    cabecalho: conteudoCabecalho,
    fundo: conteudoFundo,
    texto: conteudoTexto,
    botoes: conteudoBotoes,
    cores: conteudoCores,
  };

  return (
    <>
      {/* ══════════════════════════════════════════════════════
          LAYOUT MOBILE  (visível abaixo de xl)
          - Preview compacto centralizado
          - Barra de ferramentas de design acima do nav do app
          - Bottom sheet ao selecionar uma aba
      ══════════════════════════════════════════════════════ */}
      <div className="xl:hidden">
        {/* Área do preview — ocupa o espaço entre o header e as duas barras inferiores */}
        {/* 56px header | ~52px barra design | ~52px nav app ≈ padding-bottom 110px */}
        <div
          className="flex items-center justify-center bg-gray-100 overflow-hidden"
          style={{ height: 'calc(100dvh - 56px - 108px)' }}
        >
          <div style={{ transform: 'scale(0.92)', transformOrigin: 'center center' }}>
            {perfil && <MobilePreview perfil={perfil} links={links} />}
          </div>
        </div>
      </div>

      {/* Barra de abas de design — fica entre o preview e o nav do app */}
      {/* z-[55] fica acima do nav do app (z-50) */}
      <div className="xl:hidden fixed bottom-14 left-0 right-0 z-[55] bg-white border-t border-border shadow-[0_-2px_12px_rgba(0,0,0,0.08)]">
        <div className="flex justify-around items-center py-1.5 px-1">
          {TABS_MOBILE.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab((prev) => (prev === tab.id ? null : tab.id))}
              className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl transition-colors cursor-pointer min-w-[44px] ${activeTab === tab.id
                ? 'bg-primary/10 text-primary'
                : 'text-gray-500 hover:text-gray-700'
                }`}
            >
              <tab.Icon className="h-[18px] w-[18px]" />
              <span className="text-[9px] font-medium leading-none">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Backdrop do bottom sheet */}
      {activeTab && (
        <div
          className="xl:hidden fixed inset-0 z-[58] bg-black/20"
          onClick={() => setActiveTab(null)}
        />
      )}

      {/* Bottom sheet da aba selecionada */}
      {activeTab && (
        <div
          className="xl:hidden fixed inset-x-0 bottom-0 z-[59] bg-white rounded-t-2xl shadow-2xl"
          style={{ maxHeight: '65vh' }}
        >
          {/* Handle visual */}
          <div className="flex justify-center pt-2.5 pb-1">
            <div className="h-1 w-10 rounded-full bg-gray-200" />
          </div>

          {/* Cabeçalho do sheet */}
          <div className="flex justify-between items-center px-4 py-2 border-b border-border">
            <h3 className="font-semibold text-sm text-gray-800">{LABEL_POR_TAB[activeTab]}</h3>
            <button
              onClick={() => setActiveTab(null)}
              className="text-gray-400 hover:text-gray-600 cursor-pointer p-1 rounded-lg hover:bg-gray-100"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Conteúdo scrollável */}
          <div className="overflow-y-auto p-4" style={{ maxHeight: 'calc(65vh - 68px)' }}>
            {conteudoPorTab[activeTab]}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          LAYOUT DESKTOP  (xl+)
          - Editor lateral com accordion
          - Preview mobile fixo à direita
      ══════════════════════════════════════════════════════ */}
      <div className="hidden xl:flex gap-0 min-h-screen">
        <div className="flex-1 max-w-2xl px-4 sm:px-6 py-6 space-y-2">
          <div className="mb-4">
            <h1 className="text-2xl font-bold text-gray-900">Design</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Personalize a aparência da sua página. Salvo automaticamente.
            </p>
          </div>

          <div className="bg-white rounded-xl border border-border p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-700">Esquemas rápidos</h3>
            {conteudoTemas}
          </div>

          <Accordion multiple defaultValue={['cabecalho', 'fundo']} className="space-y-2">
            <AccordionItem value="cabecalho" className="bg-white rounded-xl border border-border px-4">
              <AccordionTrigger className="text-sm font-semibold text-gray-700 hover:no-underline">
                Cabeçalho
              </AccordionTrigger>
              <AccordionContent className="pb-4">{conteudoCabecalho}</AccordionContent>
            </AccordionItem>

            <AccordionItem value="fundo" className="bg-white rounded-xl border border-border px-4">
              <AccordionTrigger className="text-sm font-semibold text-gray-700 hover:no-underline">
                Fundo
              </AccordionTrigger>
              <AccordionContent className="pb-4">{conteudoFundo}</AccordionContent>
            </AccordionItem>

            <AccordionItem value="texto" className="bg-white rounded-xl border border-border px-4">
              <AccordionTrigger className="text-sm font-semibold text-gray-700 hover:no-underline">
                Texto
              </AccordionTrigger>
              <AccordionContent className="pb-4">{conteudoTexto}</AccordionContent>
            </AccordionItem>

            <AccordionItem value="botoes" className="bg-white rounded-xl border border-border px-4">
              <AccordionTrigger className="text-sm font-semibold text-gray-700 hover:no-underline">
                Estilo de botão
              </AccordionTrigger>
              <AccordionContent className="pb-4">{conteudoBotoes}</AccordionContent>
            </AccordionItem>

            <AccordionItem value="cores" className="bg-white rounded-xl border border-border px-4">
              <AccordionTrigger className="text-sm font-semibold text-gray-700 hover:no-underline">
                Esquema de cores
              </AccordionTrigger>
              <AccordionContent className="pb-4">{conteudoCores}</AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>

        <div className="hidden xl:flex items-start pt-6 pr-8 sticky top-6 self-start">
          {perfil && <MobilePreview perfil={perfil} links={links} />}
        </div>
      </div>
    </>
  );
}
