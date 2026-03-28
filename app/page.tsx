import Link from 'next/link';
import { buttonVariants } from '@/lib/button-variants';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* ── Navbar ─────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-white/80 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 flex h-16 items-center justify-between">
          <span className="text-xl font-bold text-primary">Umbler Link</span>
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
        <section className="relative overflow-hidden bg-gradient-to-br from-[#6B2FD9] via-[#8B4FF0] to-[#B07AF5] py-24 sm:py-36 text-white">
          {/* círculos decorativos */}
          <div className="pointer-events-none absolute -top-32 -right-32 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-white/10 blur-3xl" />

          <div className="relative mx-auto max-w-3xl px-4 sm:px-6 text-center">
            <span className="mb-6 inline-block rounded-full bg-white/20 px-4 py-1.5 text-sm font-medium">
              100% gratuito para sempre
            </span>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight tracking-tight">
              Todos os seus links <br className="hidden sm:block" />
              em um só lugar
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-white/85 max-w-xl mx-auto">
              Crie sua página personalizada, compartilhe nas bio das redes sociais e acompanhe os
              cliques em tempo real. Simples assim.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/cadastro"
                className={cn(
                  buttonVariants({ size: 'lg' }),
                  'bg-white text-[#6B2FD9] hover:bg-white/90 font-semibold text-base px-8'
                )}
              >
                Criar minha página grátis
              </Link>
              <Link
                href="/login"
                className={cn(
                  buttonVariants({ variant: 'outline', size: 'lg' }),
                  'border-white text-white hover:bg-white/10 font-semibold text-base px-8'
                )}
              >
                Já tenho conta, entrar
              </Link>
            </div>
            <p className="mt-4 text-sm text-white/60">
              Sem cartão de crédito · Sem período de teste · Grátis para sempre
            </p>
          </div>
        </section>

        {/* ── Funcionalidades ────────────────────────────────────── */}
        <section className="py-20 sm:py-28 bg-white">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="text-center mb-14">
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
                Tudo que você precisa, sem complicação
              </h2>
              <p className="mt-4 text-lg text-gray-500 max-w-xl mx-auto">
                Crie, personalize e acompanhe sua página de links em minutos.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
              <Card className="border border-border shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-6 flex flex-col items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                    <PaletteIcon className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Personalização total</h3>
                    <p className="mt-2 text-gray-500 text-sm leading-relaxed">
                      Escolha cores, fontes, estilos de botão e layout. Sua página reflete sua
                      identidade visual com poucos cliques.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-border shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-6 flex flex-col items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                    <BarChartIcon className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Analytics em tempo real
                    </h3>
                    <p className="mt-2 text-gray-500 text-sm leading-relaxed">
                      Saiba quantas pessoas acessaram sua página, quais links tiveram mais cliques
                      e os melhores horários para engajar.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-border shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-6 flex flex-col items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                    <GiftIcon className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Grátis para sempre</h3>
                    <p className="mt-2 text-gray-500 text-sm leading-relaxed">
                      Sem planos pagos escondidos. Crie sua conta agora e use todos os recursos sem
                      gastar nada.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* ── Preview ────────────────────────────────────────────── */}
        <section className="py-20 sm:py-28 bg-gray-50">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
              <div className="flex-1 text-center lg:text-left">
                <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
                  Sua página, do seu jeito
                </h2>
                <p className="mt-4 text-lg text-gray-500 leading-relaxed">
                  Configure em minutos. Adicione links para Instagram, WhatsApp, YouTube, site
                  próprio e muito mais — tudo em uma URL fácil de compartilhar.
                </p>
                <ul className="mt-8 space-y-3">
                  {[
                    'Link personalizado: umbler.link/seu-nome',
                    'Foto de perfil e bio customizável',
                    '10+ plataformas pré-configuradas',
                    'Reordene links com arrastar e soltar',
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-3 text-gray-700">
                      <CheckIcon className="h-5 w-5 text-primary flex-shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-10">
                  <Link href="/cadastro" className={buttonVariants({ size: 'lg' })}>
                    Começar agora — é grátis
                  </Link>
                </div>
              </div>

              {/* Mockup smartphone */}
              <div className="flex-shrink-0">
                <div className="relative mx-auto w-[260px]">
                  <div className="rounded-[2.5rem] border-[6px] border-gray-800 bg-white shadow-2xl overflow-hidden">
                    <div className="flex justify-center py-2 bg-gray-800">
                      <div className="h-2 w-14 rounded-full bg-gray-600" />
                    </div>
                    <div className="bg-gradient-to-b from-[#6B2FD9] to-[#8B4FF0] px-4 pb-6 pt-8 min-h-[480px]">
                      <div className="flex flex-col items-center gap-2 mb-6">
                        <div className="h-16 w-16 rounded-full bg-white/30 border-2 border-white/50" />
                        <p className="text-white font-bold text-sm">João Silva</p>
                        <p className="text-white/75 text-xs">Designer & Criador de Conteúdo</p>
                      </div>
                      {['Instagram', 'YouTube', 'WhatsApp', 'Meu Site'].map((link) => (
                        <div
                          key={link}
                          className="mb-3 rounded-xl bg-white/20 py-3 px-4 text-center text-white text-xs font-medium"
                        >
                          {link}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="mx-auto mt-3 h-4 w-3/4 rounded-full bg-gray-900/20 blur-md" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── CTA Final ──────────────────────────────────────────── */}
        <section className="py-20 sm:py-28 bg-[#6B2FD9] text-white text-center">
          <div className="mx-auto max-w-2xl px-4 sm:px-6">
            <h2 className="text-3xl sm:text-4xl font-bold">
              Pronto para centralizar seus links?
            </h2>
            <p className="mt-4 text-lg text-white/80">
              Crie sua conta gratuita agora e tenha sua página no ar em menos de 5 minutos.
            </p>
            <div className="mt-10">
              <Link
                href="/cadastro"
                className={cn(
                  buttonVariants({ size: 'lg' }),
                  'bg-white text-[#6B2FD9] hover:bg-white/90 font-semibold text-base px-10'
                )}
              >
                Criar minha página grátis
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* ── Footer ─────────────────────────────────────────────── */}
      <footer className="border-t border-border bg-white py-8">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-500">
          <span className="font-semibold text-primary">Umbler Link</span>
          <div className="flex gap-6">
            <a
              href="https://umbler.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-primary transition-colors"
            >
              Umbler
            </a>
            <a
              href="https://umbler.com/br/contato"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-primary transition-colors"
            >
              Contato
            </a>
            <a
              href="https://umbler.com/br/politica-de-privacidade"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-primary transition-colors"
            >
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

function PaletteIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.8}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 2C6.477 2 2 6.477 2 12c0 2.137.67 4.116 1.81 5.73C5.07 19.74 7.01 21 9.25 21c1.26 0 2.268-.504 3.15-1.26.584-.508 1.1-.84 1.6-.84.5 0 1.016.332 1.6.84.882.756 1.89 1.26 3.15 1.26 2.24 0 4.18-1.26 5.44-3.27A9.953 9.953 0 0 0 22 12c0-5.523-4.477-10-10-10Z"
      />
      <circle cx="8.5" cy="13.5" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="15.5" cy="13.5" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="12" cy="9" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

function BarChartIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.8}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 17h4V9H3v8zm7 0h4V5h-4v12zm7 0h4v-6h-4v6z"
      />
    </svg>
  );
}

function GiftIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.8}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M20 12v10H4V12M22 7H2v5h20V7zM12 22V7m0 0a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm0 0a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"
      />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2.5}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}
