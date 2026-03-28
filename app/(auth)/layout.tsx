import Link from 'next/link';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Cabeçalho simples */}
      <header className="flex h-16 items-center px-4 sm:px-6 border-b border-border bg-white">
        <Link href="/" className="text-xl font-bold text-primary">
          Umbler Link
        </Link>
      </header>

      {/* Conteúdo centralizado */}
      <main className="flex flex-1 items-center justify-center px-4 py-12">
        {children}
      </main>

      <footer className="py-4 text-center text-sm text-gray-400">
        © {new Date().getFullYear()} Umbler. Todos os direitos reservados.
      </footer>
    </div>
  );
}
