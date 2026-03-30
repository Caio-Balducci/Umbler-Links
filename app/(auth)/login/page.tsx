'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

const esquema = z.object({
  email: z.string().email('E-mail inválido'),
  senha: z.string().min(1, 'Informe sua senha'),
});

type FormData = z.infer<typeof esquema>;

const mensagensErroFirebase: Record<string, string> = {
  'auth/user-not-found': 'Nenhuma conta encontrada com este e-mail.',
  'auth/wrong-password': 'Senha incorreta.',
  'auth/invalid-credential': 'E-mail ou senha inválidos.',
  'auth/invalid-email': 'E-mail inválido.',
  'auth/too-many-requests': 'Muitas tentativas. Aguarde alguns minutos e tente novamente.',
  'auth/network-request-failed': 'Erro de conexão. Verifique sua internet.',
  'auth/popup-closed-by-user': 'Login com Google cancelado.',
};

function traduzirErro(codigo: string): string {
  return mensagensErroFirebase[codigo] ?? 'Ocorreu um erro inesperado. Tente novamente.';
}

export default function PaginaLogin() {
  const router = useRouter();
  const [erroGeral, setErroGeral] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [carregandoGoogle, setCarregandoGoogle] = useState(false);
  const [resetEnviado, setResetEnviado] = useState(false);

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(esquema) });

  async function onSubmit(dados: FormData) {
    setErroGeral('');
    setCarregando(true);
    try {
      await signInWithEmailAndPassword(auth, dados.email, dados.senha);
      router.push('/dashboard');
    } catch (erro: unknown) {
      const codigo = (erro as { code?: string }).code ?? '';
      setErroGeral(traduzirErro(codigo));
    } finally {
      setCarregando(false);
    }
  }

  async function entrarComGoogle() {
    setErroGeral('');
    setCarregandoGoogle(true);
    try {
      const provedor = new GoogleAuthProvider();
      await signInWithPopup(auth, provedor);
      router.push('/dashboard');
    } catch (erro: unknown) {
      const codigo = (erro as { code?: string }).code ?? '';
      setErroGeral(traduzirErro(codigo));
    } finally {
      setCarregandoGoogle(false);
    }
  }

  async function esqueceuSenha() {
    const email = getValues('email');
    if (!email) {
      setErroGeral('Informe seu e-mail acima para redefinir a senha.');
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      setResetEnviado(true);
      setErroGeral('');
    } catch {
      setErroGeral('Não foi possível enviar o e-mail de redefinição. Verifique o endereço informado.');
    }
  }

  return (
    <Card className="w-full max-w-md shadow-sm">
      <CardHeader className="text-center pb-4">
        <CardTitle className="text-2xl">Entrar na sua conta</CardTitle>
        <CardDescription>Bem-vindo de volta ao Umbler Links</CardDescription>
      </CardHeader>

      <CardContent className="space-y-5">
        {/* Login com Google */}
        <button
          type="button"
          onClick={entrarComGoogle}
          disabled={carregandoGoogle}
          className="w-full flex items-center justify-center gap-3 rounded-lg border border-border bg-white py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-60 cursor-pointer disabled:cursor-not-allowed"
        >
          <GoogleIcon />
          {carregandoGoogle ? 'Conectando...' : 'Continuar com Google'}
        </button>

        <div className="flex items-center gap-3">
          <Separator className="flex-1" />
          <span className="text-xs text-muted-foreground">ou</span>
          <Separator className="flex-1" />
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              placeholder="joao@exemplo.com"
              autoComplete="email"
              aria-invalid={!!errors.email}
              {...register('email')}
            />
            {errors.email && (
              <p className="text-xs text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="senha">Senha</Label>
              <button
                type="button"
                onClick={esqueceuSenha}
                className="text-xs text-primary hover:underline cursor-pointer"
              >
                Esqueci minha senha
              </button>
            </div>
            <Input
              id="senha"
              type="password"
              placeholder="Sua senha"
              autoComplete="current-password"
              aria-invalid={!!errors.senha}
              {...register('senha')}
            />
            {errors.senha && (
              <p className="text-xs text-destructive">{errors.senha.message}</p>
            )}
          </div>

          {resetEnviado && (
            <div className="rounded-md bg-green-50 px-4 py-3 text-sm text-green-700">
              E-mail de redefinição enviado! Verifique sua caixa de entrada.
            </div>
          )}

          {erroGeral && (
            <div className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {erroGeral}
            </div>
          )}

          <Button type="submit" className="w-full" disabled={carregando}>
            {carregando ? 'Entrando...' : 'Entrar'}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          Não tem uma conta?{' '}
          <Link href="/cadastro" className="font-medium text-primary hover:underline">
            Criar conta grátis
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48">
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </svg>
  );
}
