import Link from 'next/link';
import type { Metadata } from 'next';
import { buttonVariants } from '@/lib/button-variants';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

/* ── SEO Metadata ──────────────────────────────────────────────── */
export const metadata: Metadata = {
  title: 'Umbler Links — Página de Links Inteligente com Analytics e Teste A/B',
  description:
    'Crie sua página de links gratuita com analytics completo, teste A/B de títulos, ordenação automática por cliques e exportação de relatórios com prompts de IA. O link na bio mais inteligente do Brasil.',
  keywords: [
    'link na bio',
    'página de links',
    'linktree grátis',
    'link in bio',
    'teste AB links',
    'analytics link bio',
    'organizar links por cliques',
    'criar página de links',
    'umbler link',
  ],
  openGraph: {
    title: 'Umbler Links — Página de Links com Analytics, A/B e IA',
    description:
      'Não é só uma página de links. Faça testes A/B, acompanhe indicadores, exporte relatórios e use IA para crescer mais rápido. Grátis.',
    type: 'website',
    locale: 'pt_BR',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Umbler Links — O link na bio mais inteligente',
    description:
      'Analytics, Teste A/B, ordenação automática por cliques e prompts de IA. Crie sua página grátis.',
  },
};

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">

      {/* ── Navbar ─────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-white/80 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 flex h-16 items-center justify-between">
          <span className="text-xl font-bold text-primary">Umbler Links</span>
          <nav className="flex items-center gap-3">
            <Link href="/login" className={buttonVariants({ variant: 'ghost' })}>
              Entrar
            </Link>
            <Link href="/cadastro" className={buttonVariants({ variant: 'default' })}>
              Criar conta grátis
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">

        {/* ── Hero ───────────────────────────────────────────────── */}
        <section
          className="relative overflow-hidden bg-gradient-to-br from-[#13857f] via-[#006254] to-[#022720] py-24 sm:py-36 text-white"
          aria-label="Apresentação do Umbler Links"
        >
          <div className="pointer-events-none absolute -top-32 -right-32 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-white/10 blur-3xl" />

          <div className="relative mx-auto max-w-3xl px-4 sm:px-6 text-center">
            <span className="mb-6 inline-block rounded-full bg-white/20 px-4 py-1.5 text-sm font-medium tracking-wide">
              100% grátis · Analytics · Teste A/B · IA
            </span>

            <h1 className="flex flex-col items-center justify-center font-extrabold leading-tight tracking-tight">
              <span className="block whitespace-nowrap text-[clamp(1.75rem,5.2vw,3.75rem)]">Transforme seu link na bio</span>
              <span className="block text-[clamp(1.75rem,5.8vw,3.75rem)] text-[#67ffcf]">em resultados reais</span>
            </h1>

            <p className="mt-6 text-lg sm:text-xl text-white/85 max-w-2xl mx-auto leading-relaxed">
              <strong>Não é só uma página de links.</strong> Organize automaticamente seus links por performance,
              faça testes A/B, exporte relatórios e use Inteligência Artificial para crescer mais rápido.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/cadastro"
                className={cn(
                  buttonVariants({ size: 'lg' }),
                  'bg-[#67ffcf] text-black hover:bg-[#67ffcf]/80 font-bold text-base px-8 border-0 rounded-full shadow-lg shadow-black/20'
                )}
              >
                Criar minha página grátis
              </Link>
              <Link
                href="/login"
                className={cn(
                  buttonVariants({ size: 'lg' }),
                  'bg-white/10 text-white hover:bg-white/20 border border-white/30 font-semibold text-base px-8 rounded-full backdrop-blur'
                )}
              >
                Já tenho conta
              </Link>
            </div>
            <p className="mt-5 text-sm text-white/55">
              Sem cartão de crédito · Sem limite de links · Sempre grátis
            </p>
          </div>
        </section>

        {/* ── Barra de diferenciais ──────────────────────────────── */}
        <section className="border-b border-border bg-white py-6" aria-label="Diferenciais em destaque">
          <div className="mx-auto max-w-5xl px-4 sm:px-6">
            <ul className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
              {[
                { icone: <BarChartIcon className="h-5 w-5" />, texto: 'Analytics completo' },
                { icone: <AbIcon className="h-5 w-5" />, texto: 'Teste A/B de títulos' },
                { icone: <SortIcon className="h-5 w-5" />, texto: 'Ordenação automática' },
                { icone: <AiIcon className="h-5 w-5" />, texto: 'Relatórios com IA' },
              ].map(({ icone, texto }) => (
                <li key={texto} className="flex flex-col items-center gap-2 text-sm font-medium text-gray-700">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                    {icone}
                  </span>
                  {texto}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ── Features grid ──────────────────────────────────────── */}
        <section className="py-20 sm:py-28 bg-white" aria-labelledby="features-heading">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="text-center mb-14">
              <h2 id="features-heading" className="text-2xl sm:text-4xl font-bold text-gray-900">
                Tudo que você precisa para crescer, em um só lugar
              </h2>
              <p className="mt-4 text-lg text-gray-500 max-w-2xl mx-auto">
                Enquanto outros apenas exibem links, o Umbler Links trabalha pelos seus resultados.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  icone: <BarChartIcon className="h-6 w-6 text-primary" />,
                  titulo: 'Indicadores em tempo real',
                  descricao:
                    'Acompanhe visitas, cliques por link, dispositivos e horários de pico. Dados reais para decisões reais.',
                },
                {
                  icone: <AbIcon className="h-6 w-6 text-primary" />,
                  titulo: 'Teste A/B de títulos',
                  descricao:
                    'Compare dois títulos para o mesmo link e descubra qual converte mais. Relatório completo com vencedor automático.',
                },
                {
                  icone: <SortIcon className="h-6 w-6 text-primary" />,
                  titulo: 'Ordenação automática',
                  descricao:
                    'Coloque os links mais clicados no topo automaticamente. Seu conteúdo mais relevante sempre em destaque.',
                },
                {
                  icone: <PinIcon className="h-6 w-6 text-primary" />,
                  titulo: 'Fixar links por posição',
                  descricao:
                    'Fixe qualquer link em uma posição estratégica específica, independentemente da ordenação automática.',
                },
                {
                  icone: <AiIcon className="h-6 w-6 text-primary" />,
                  titulo: 'Export com Prompts de IA',
                  descricao:
                    'Exporte relatórios em XLSX e receba prompts prontos para analisar seus dados com ChatGPT ou Gemini.',
                },
                {
                  icone: <PaletteIcon className="h-6 w-6 text-primary" />,
                  titulo: 'Design 100% personalizável',
                  descricao:
                    'Cores, fontes, bordas e gradientes. Sua página reflete sua identidade visual com poucos cliques.',
                },
              ].map(({ icone, titulo, descricao }) => (
                <Card key={titulo} className="border border-border shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-6 flex flex-col items-start gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/8">
                      {icone}
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-gray-900">{titulo}</h3>
                      <p className="mt-2 text-gray-500 text-sm leading-relaxed">{descricao}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* ── Seção: Teste A/B ───────────────────────────────────── */}
        <section className="py-20 sm:py-28 bg-gray-50" aria-labelledby="ab-heading">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">

              {/* Visual */}
              <div className="flex-shrink-0 w-full lg:w-auto">
                <div className="mx-auto max-w-sm rounded-2xl border border-border bg-white shadow-lg overflow-hidden">
                  <div className="bg-primary/5 border-b border-border px-5 py-3 flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-green-400 animate-pulse" />
                    <span className="text-xs font-semibold text-gray-700">Teste A/B em andamento</span>
                  </div>
                  <div className="p-5 space-y-4">
                    {[
                      { label: 'A', titulo: 'Assine minha newsletter', cliques: 84, pct: 62, cor: 'bg-primary' },
                      { label: 'B', titulo: 'Receba conteúdo exclusivo', cliques: 51, pct: 38, cor: 'bg-gray-300' },
                    ].map(({ label, titulo, cliques, pct, cor }) => (
                      <div key={label} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <span className={`font-bold px-2 py-0.5 rounded-full text-[10px] ${label === 'A' ? 'bg-primary/10 text-primary' : 'bg-gray-100 text-gray-600'}`}>
                              {label}
                            </span>
                            <span className="text-gray-700 font-medium">{titulo}</span>
                            {label === 'A' && <span className="text-yellow-500 text-sm">🏆</span>}
                          </div>
                          <span className="font-semibold text-gray-900">{cliques} cliques</span>
                        </div>
                        <div className="h-2.5 w-full bg-gray-100 rounded-full overflow-hidden">
                          <div className={`h-full ${cor} rounded-full transition-all`} style={{ width: `${pct}%` }} />
                        </div>
                        <p className="text-[10px] text-gray-400 text-right">{pct}% do total</p>
                      </div>
                    ))}
                    <div className="pt-2 border-t border-border flex items-center justify-between">
                      <span className="text-xs text-gray-500">Duração: 7 dias</span>
                      <span className="text-[10px] bg-green-100 text-green-700 font-medium px-2 py-0.5 rounded-full">Vencedor: Variante A</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Texto */}
              <div className="flex-1 text-center lg:text-left">
                <span className="inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary mb-4">
                  Teste A/B
                </span>
                <h2 id="ab-heading" className="text-2xl sm:text-4xl font-bold text-gray-900">
                  Pare de adivinhar. Comece a testar.
                </h2>
                <p className="mt-4 text-lg text-gray-500 leading-relaxed">
                  Com o Teste A/B do Umbler Links você compara dois títulos para o mesmo link e descobre
                  qual gera mais cliques — com dados reais do seu público.
                </p>
                <ul className="mt-6 space-y-3">
                  {[
                    'Configure início e fim do teste com data e hora',
                    'Relatório completo com vencedor automático destacado',
                    'Histórico de todos os testes realizados',
                    'Exporte o relatório e analise com IA',
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-3 text-gray-700 text-sm">
                      <CheckIcon className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-8">
                  <Link href="/cadastro" className={buttonVariants({ size: 'lg' })}>
                    Criar minha conta grátis
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Seção: Ordenação + Fixar ───────────────────────────── */}
        <section className="py-20 sm:py-28 bg-white" aria-labelledby="sort-heading">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="flex flex-col lg:flex-row-reverse items-center gap-12 lg:gap-20">

              {/* Visual */}
              <div className="flex-shrink-0 w-full lg:w-auto">
                <div className="mx-auto max-w-sm rounded-2xl border border-border bg-white shadow-lg overflow-hidden">
                  <div className="px-5 py-3 border-b border-border flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-700">Organização dos links</span>
                    <span className="text-[10px] bg-primary/10 text-primary font-bold px-2 py-0.5 rounded-full">Mais cliques no topo</span>
                  </div>
                  <div className="p-4 space-y-2.5">
                    {[
                      { titulo: 'Meu curso online', cliques: 312, fixado: true, pos: 1 },
                      { titulo: 'Instagram', cliques: 289, fixado: false },
                      { titulo: 'YouTube', cliques: 174, fixado: false },
                      { titulo: 'WhatsApp', cliques: 98, fixado: false },
                    ].map(({ titulo, cliques, fixado, pos }) => (
                      <div
                        key={titulo}
                        className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 ${fixado ? 'border-primary/30 bg-primary/5' : 'border-border bg-white'}`}
                      >
                        <span className="text-gray-300 text-sm">⠿</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-gray-800 truncate">{titulo}</p>
                          <p className="text-[10px] text-gray-400">{cliques} cliques</p>
                        </div>
                        {fixado && (
                          <span className="text-[9px] bg-primary/10 text-primary font-bold px-1.5 py-0.5 rounded-full">
                            Fixado #{pos}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Texto */}
              <div className="flex-1 text-center lg:text-left">
                <span className="inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary mb-4">
                  Organização inteligente
                </span>
                <h2 id="sort-heading" className="text-2xl sm:text-4xl font-bold text-gray-900">
                  Seus melhores links sempre em destaque
                </h2>
                <p className="mt-4 text-lg text-gray-500 leading-relaxed">
                  Escolha entre organização manual, automática por mais cliques ou menos cliques.
                  Além disso, fixe qualquer link em uma posição estratégica específica.
                </p>
                <ul className="mt-6 space-y-3">
                  {[
                    'Modo "mais cliques no topo" reordena automaticamente a cada visita',
                    'Modo "menos cliques" para dar visibilidade a links novos',
                    'Fixe um link em qualquer posição e ele nunca sai do lugar',
                    'Arrastar e soltar para ordenação manual completa',
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-3 text-gray-700 text-sm">
                      <CheckIcon className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-8">
                  <Link href="/cadastro" className={buttonVariants({ size: 'lg' })}>
                    Experimentar grátis
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Seção: Relatórios + IA ─────────────────────────────── */}
        <section className="py-20 sm:py-28 bg-gray-50" aria-labelledby="ia-heading">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">

              {/* Visual */}
              <div className="flex-shrink-0 w-full lg:w-auto">
                <div className="mx-auto max-w-sm rounded-2xl border border-border bg-white shadow-lg overflow-hidden">
                  <div className="bg-gradient-to-r from-primary/10 to-primary/5 border-b border-border px-5 py-4 flex items-center gap-3">
                    <span className="text-2xl">✅</span>
                    <div>
                      <p className="text-sm font-bold text-gray-900">Relatório exportado!</p>
                      <p className="text-xs text-gray-500">Use IA para extrair insights agora</p>
                    </div>
                  </div>
                  <div className="p-5 space-y-3">
                    <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 flex items-center gap-3">
                      <span className="text-xl">🤖</span>
                      <p className="text-xs text-gray-700 leading-relaxed">
                        Um <strong>prompt especializado em Growth Marketing</strong> está pronto. Copie e cole na sua IA favorita.
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <div className="flex-1 rounded-lg bg-primary py-2 text-center text-xs font-semibold text-white">
                        Copiar prompt para IA
                      </div>
                      <div className="flex-1 rounded-lg border border-border py-2 text-center text-xs font-medium text-gray-600">
                        Baixar prompt
                      </div>
                    </div>
                    <p className="text-[10px] text-center text-gray-400">
                      Compatível com ChatGPT, Gemini, Claude e outros
                    </p>
                  </div>
                </div>
              </div>

              {/* Texto */}
              <div className="flex-1 text-center lg:text-left">
                <span className="inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary mb-4">
                  Relatórios + Inteligência Artificial
                </span>
                <h2 id="ia-heading" className="text-2xl sm:text-4xl font-bold text-gray-900">
                  Dados que viram estratégia com IA
                </h2>
                <p className="mt-4 text-lg text-gray-500 leading-relaxed">
                  Exporte seus relatórios de cliques e de Teste A/B em planilha XLSX e receba um prompt
                  profissional pronto para analisar seus dados com ChatGPT, Gemini ou qualquer IA de sua
                  preferência.
                </p>
                <ul className="mt-6 space-y-3">
                  {[
                    'Relatório de cliques com data, horário, link e dispositivo',
                    'Relatório de Teste A/B com vencedor, CTR e comparativo',
                    'Prompt de Growth Marketing pronto para uso imediato',
                    'Prompt de CRO e Copywriting especializado em testes A/B',
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-3 text-gray-700 text-sm">
                      <CheckIcon className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-8">
                  <Link href="/cadastro" className={buttonVariants({ size: 'lg' })}>
                    Começar agora — é grátis
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Como funciona ──────────────────────────────────────── */}
        <section className="py-20 sm:py-28 bg-white" aria-labelledby="como-funciona-heading">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 text-center">
            <h2 id="como-funciona-heading" className="text-2xl sm:text-4xl font-bold text-gray-900">
              Do zero à sua página em menos de 5 minutos
            </h2>
            <p className="mt-4 text-lg text-gray-500">Simples, rápido e sem complicação.</p>

            <div className="mt-14 grid grid-cols-1 sm:grid-cols-3 gap-8 text-left">
              {[
                {
                  numero: '01',
                  titulo: 'Crie sua conta',
                  descricao: 'Cadastre-se com e-mail ou Google. Escolha seu username único e configure seu perfil em minutos.',
                },
                {
                  numero: '02',
                  titulo: 'Adicione seus links',
                  descricao: 'Selecione as plataformas, personalize títulos, ative o design que combina com você e ative sua página.',
                },
                {
                  numero: '03',
                  titulo: 'Acompanhe e otimize',
                  descricao: 'Monitore cliques, faça Testes A/B, organize por performance e use IA para extrair insights dos seus dados.',
                },
              ].map(({ numero, titulo, descricao }) => (
                <div key={numero} className="flex flex-col gap-4">
                  <span className="text-4xl font-black text-primary/20">{numero}</span>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{titulo}</h3>
                    <p className="mt-2 text-sm text-gray-500 leading-relaxed">{descricao}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA Final ──────────────────────────────────────────── */}
        <section
          className="py-20 sm:py-28 bg-gradient-to-br from-[#13857f] via-[#006254] to-[#022720] text-white text-center"
          aria-label="Chamada para ação final"
        >
          <div className="mx-auto max-w-2xl px-4 sm:px-6">
            <h2 className="text-2xl sm:text-4xl font-bold">
              Seu link na bio merece ser mais inteligente
            </h2>
            <p className="mt-4 text-lg text-white/80 leading-relaxed">
              Analytics, Teste A/B, ordenação automática e Inteligência Artificial — tudo grátis,
              sem limite de links e sem precisar de cartão de crédito.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/cadastro"
                className={cn(
                  buttonVariants({ size: 'lg' }),
                  'bg-[#67ffcf] text-black hover:bg-[#67ffcf]/80 font-bold text-base px-10 border-0 rounded-full shadow-lg shadow-black/20'
                )}
              >
                Criar minha página grátis
              </Link>
            </div>
            <p className="mt-4 text-sm text-white/50">
              Sem cartão de crédito · Sempre grátis
            </p>
          </div>
        </section>
      </main>

      {/* ── Footer ─────────────────────────────────────────────── */}
      <footer className="border-t border-border bg-white py-8">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-500">
          <span className="font-semibold text-primary">Umbler Links</span>
          <div className="flex gap-6">
            <a href="https://umbler.com" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
              Umbler
            </a>
            <a href="https://umbler.com/br/contato" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
              Contato
            </a>
            <a href="https://umbler.com/br/politica-de-privacidade" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
              Privacidade
            </a>
          </div>
          <span>© {new Date().getFullYear()} Umbler. Todos os direitos reservados.</span>
        </div>
      </footer>
    </div>
  );
}

/* ── Ícones SVG inline ─────────────────────────────────────────── */

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

function BarChartIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 17h4V9H3v8zm7 0h4V5h-4v12zm7 0h4v-6h-4v6z" />
    </svg>
  );
}

function AbIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  );
}

function SortIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
    </svg>
  );
}

function PinIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z" />
    </svg>
  );
}

function AiIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15M14.25 3.104c.251.023.501.05.75.082M19.8 15a2.25 2.25 0 01.45 1.317c0 1.022-.83 1.87-1.85 1.87H5.6c-1.02 0-1.85-.848-1.85-1.87 0-.493.2-.94.52-1.265L8 11.5" />
    </svg>
  );
}

function PaletteIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 2C6.477 2 2 6.477 2 12c0 2.137.67 4.116 1.81 5.73C5.07 19.74 7.01 21 9.25 21c1.26 0 2.268-.504 3.15-1.26.584-.508 1.1-.84 1.6-.84.5 0 1.016.332 1.6.84.882.756 1.89 1.26 3.15 1.26 2.24 0 4.18-1.26 5.44-3.27A9.953 9.953 0 0022 12c0-5.523-4.477-10-10-10Z" />
      <circle cx="8.5" cy="13.5" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="15.5" cy="13.5" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="12" cy="9" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  );
}
