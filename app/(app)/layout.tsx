'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { getUserProfile } from '@/lib/firestore';
import { UserProfile } from '@/types';
import { cn } from '@/lib/utils';

const ITENS_NAV = [
  { href: '/dashboard', label: 'Conteúdo', icone: IconeConteudo },
  { href: '/indicadores', label: 'Indicadores', icone: IconeIndicadores },
  { href: '/design', label: 'Design', icone: IconeDesign },
  { href: '/configuracoes', label: 'Configurações', icone: IconeConfiguracoes },
] as const;

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [perfil, setPerfil] = useState<UserProfile | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    const cancelar = onAuthStateChanged(auth, async (usuario) => {
      if (!usuario) {
        router.push('/login');
        return;
      }
      setUser(usuario);
      const dados = await getUserProfile(usuario.uid);
      if (!dados?.username) {
        // Ainda não completou onboarding
        router.push('/onboarding');
        return;
      }
      setPerfil(dados);
      setCarregando(false);
    });
    return () => cancelar();
  }, [router]);

  if (carregando) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="h-8 w-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  const iniciais = perfil?.displayName
    ? perfil.displayName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : '?';

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* ── Sidebar (desktop) ─────────────────────────────────────── */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-border">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-border">
          <span className="text-lg font-bold text-primary">Umbler Link</span>
        </div>

        {/* Perfil do usuário */}
        <div className="px-4 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm flex-shrink-0 overflow-hidden">
              {perfil?.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={perfil.avatarUrl} alt={perfil.displayName} className="h-full w-full object-cover" />
              ) : (
                iniciais
              )}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">
                {perfil?.displayName}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                umbler.link/{perfil?.username}
              </p>
            </div>
          </div>

          {/* Botão ver minha página */}
          <a
            href={`/${perfil?.username}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 flex items-center justify-center gap-1.5 w-full rounded-lg border border-border py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <IconeExternalLink className="h-3.5 w-3.5" />
            Ver minha página
          </a>
        </div>

        {/* Navegação */}
        <nav className="flex-1 px-3 py-3 space-y-1">
          {ITENS_NAV.map(({ href, label, icone: Icone }) => {
            const ativo = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  ativo
                    ? 'bg-primary/10 text-primary'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                )}
              >
                <Icone className="h-5 w-5 flex-shrink-0" />
                {label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* ── Conteúdo principal ────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Header mobile */}
        <header className="md:hidden flex items-center justify-between px-4 h-14 bg-white border-b border-border">
          <span className="text-base font-bold text-primary">Umbler Link</span>
          <a
            href={`/${perfil?.username}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs font-medium text-gray-600 hover:text-primary"
          >
            <IconeExternalLink className="h-4 w-4" />
            Ver página
          </a>
        </header>

        {/* Área de conteúdo */}
        <main className="flex-1 pb-20 md:pb-0">{children}</main>
      </div>

      {/* ── Bottom bar (mobile) ───────────────────────────────────── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-border flex">
        {ITENS_NAV.map(({ href, label, icone: Icone }) => {
          const ativo = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex-1 flex flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-medium transition-colors',
                ativo ? 'text-primary' : 'text-gray-500 hover:text-gray-700'
              )}
            >
              <Icone className="h-5 w-5" />
              {label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

/* ── Ícones SVG inline ─────────────────────────────────────────── */

function IconeConteudo({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <rect x="3" y="3" width="7" height="7" rx="1" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="14" y="3" width="7" height="7" rx="1" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="3" y="14" width="7" height="7" rx="1" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="14" y="14" width="7" height="7" rx="1" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconeIndicadores({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 17h4V9H3v8zm7 0h4V5h-4v12zm7 0h4v-6h-4v6z" />
    </svg>
  );
}

function IconeDesign({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="3" />
      <path strokeLinecap="round" d="M12 2v3M12 19v3M2 12h3M19 12h3" />
    </svg>
  );
}

function IconeConfiguracoes({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 0 0 2.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 0 0 1.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 0 0-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 0 0-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 0 0-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 0 0-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 0 0 1.066-2.573c-.94-1.543.826-3.31 2.37-2.37a1.724 1.724 0 0 0 2.572-1.065Z"
      />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function IconeExternalLink({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4M14 4h6m0 0v6m0-6L10 14" />
    </svg>
  );
}
