'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  onAuthStateChanged,
  reauthenticateWithCredential,
  EmailAuthProvider,
  updatePassword,
  signOut,
  User,
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

const esquemaSenha = z
  .object({
    senhaAtual: z.string().min(1, 'Informe sua senha atual'),
    novaSenha: z.string().min(8, 'Nova senha deve ter pelo menos 8 caracteres'),
    confirmarNovaSenha: z.string().min(1, 'Confirme a nova senha'),
  })
  .refine((d) => d.novaSenha === d.confirmarNovaSenha, {
    message: 'As senhas não coincidem',
    path: ['confirmarNovaSenha'],
  });

type FormSenha = z.infer<typeof esquemaSenha>;

const mensagensErro: Record<string, string> = {
  'auth/wrong-password': 'Senha atual incorreta.',
  'auth/too-many-requests': 'Muitas tentativas. Aguarde antes de tentar novamente.',
  'auth/requires-recent-login': 'Por segurança, faça login novamente antes de alterar a senha.',
  'auth/network-request-failed': 'Erro de conexão. Verifique sua internet.',
};

export default function PaginaConfiguracoes() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [sucesso, setSucesso] = useState('');
  const [erro, setErro] = useState('');
  const [alterando, setAlterando] = useState(false);
  const [confirmandoSaida, setConfirmandoSaida] = useState(false);
  const [ehProviderEmail, setEhProviderEmail] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormSenha>({ resolver: zodResolver(esquemaSenha) });

  useEffect(() => {
    const cancelar = onAuthStateChanged(auth, (u) => {
      if (!u) {
        router.push('/login');
        return;
      }
      setUser(u);
      // Verifica se o usuário usa email/senha (não só OAuth)
      const temEmail = u.providerData.some((p) => p.providerId === 'password');
      setEhProviderEmail(temEmail);
    });
    return () => cancelar();
  }, [router]);

  async function alterarSenha(dados: FormSenha) {
    if (!user?.email) return;
    setErro('');
    setSucesso('');
    setAlterando(true);

    try {
      const credencial = EmailAuthProvider.credential(user.email, dados.senhaAtual);
      await reauthenticateWithCredential(user, credencial);
      await updatePassword(user, dados.novaSenha);
      setSucesso('Senha alterada com sucesso!');
      reset();
    } catch (e: unknown) {
      const codigo = (e as { code?: string }).code ?? '';
      setErro(mensagensErro[codigo] ?? 'Ocorreu um erro ao alterar a senha. Tente novamente.');
    } finally {
      setAlterando(false);
    }
  }

  async function sairDaConta() {
    await signOut(auth);
    router.push('/login');
  }

  return (
    <div className="p-4 sm:p-6 max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Configurações</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Gerencie sua conta</p>
      </div>

      {/* Informações da conta */}
      <Card className="border border-border shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Informações da conta</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1.5">
            <Label>E-mail</Label>
            <Input value={user?.email ?? ''} readOnly className="bg-gray-50 cursor-not-allowed" />
            <p className="text-xs text-muted-foreground">O e-mail não pode ser alterado.</p>
          </div>
        </CardContent>
      </Card>

      {/* Alterar senha */}
      {ehProviderEmail && (
        <Card className="border border-border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Alterar senha</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(alterarSenha)} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="senhaAtual">Senha atual</Label>
                <Input
                  id="senhaAtual"
                  type="password"
                  placeholder="Sua senha atual"
                  autoComplete="current-password"
                  aria-invalid={!!errors.senhaAtual}
                  {...register('senhaAtual')}
                />
                {errors.senhaAtual && (
                  <p className="text-xs text-destructive">{errors.senhaAtual.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="novaSenha">Nova senha</Label>
                <Input
                  id="novaSenha"
                  type="password"
                  placeholder="Mínimo 8 caracteres"
                  autoComplete="new-password"
                  aria-invalid={!!errors.novaSenha}
                  {...register('novaSenha')}
                />
                {errors.novaSenha && (
                  <p className="text-xs text-destructive">{errors.novaSenha.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="confirmarNovaSenha">Confirmar nova senha</Label>
                <Input
                  id="confirmarNovaSenha"
                  type="password"
                  placeholder="Repita a nova senha"
                  autoComplete="new-password"
                  aria-invalid={!!errors.confirmarNovaSenha}
                  {...register('confirmarNovaSenha')}
                />
                {errors.confirmarNovaSenha && (
                  <p className="text-xs text-destructive">{errors.confirmarNovaSenha.message}</p>
                )}
              </div>

              {sucesso && (
                <div className="rounded-md bg-green-50 px-4 py-3 text-sm text-green-700">
                  {sucesso}
                </div>
              )}

              {erro && (
                <div className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  {erro}
                </div>
              )}

              <Button type="submit" disabled={alterando}>
                {alterando ? 'Alterando...' : 'Alterar senha'}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Sair da conta */}
      <Card className="border border-border shadow-sm">
        <CardContent className="pt-5">
          <Separator className="mb-5" />
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-gray-900">Sair da conta</p>
              <p className="text-xs text-muted-foreground">
                Você será desconectado deste dispositivo.
              </p>
            </div>

            {confirmandoSaida ? (
              <div className="flex gap-2">
                <Button variant="destructive" onClick={sairDaConta} size="sm">
                  Confirmar saída
                </Button>
                <Button variant="outline" onClick={() => setConfirmandoSaida(false)} size="sm">
                  Cancelar
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                onClick={() => setConfirmandoSaida(true)}
                size="sm"
                className="border-destructive text-destructive hover:bg-destructive/10"
              >
                Sair da conta
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
