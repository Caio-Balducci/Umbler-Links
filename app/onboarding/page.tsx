'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth, storage } from '@/lib/firebase';
import { isUsernameAvailable, saveUserProfile, addLink } from '@/lib/firestore';
import { ThemeConfig, PlatformType } from '@/types';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { AvatarCropModal } from '@/components/editor/AvatarCropModal';
import { onAuthStateChanged } from 'firebase/auth';

// ─── Temas pré-definidos ─────────────────────────────────────────
const TEMAS_PRESET: { id: string; nome: string; config: ThemeConfig }[] = [
  {
    id: 'minimal-claro',
    nome: 'Minimal Claro',
    config: {
      avatarShape: 'circular',
      backgroundType: 'solido',
      backgroundColor: '#ffffff',
      titleFont: 'Inter',
      titleColor: '#111827',
      descriptionFont: 'Inter',
      descriptionColor: '#6b7280',
      linkFont: 'Inter',
      linkColor: '#ffffff',
      buttonStyle: 'solido',
      buttonBorderRadius: 'arredondado',
      buttonColor: '#111827',
      buttonTextColor: '#ffffff',
      nameColor: '#111827',
    },
  },
  {
    id: 'minimal-escuro',
    nome: 'Minimal Escuro',
    config: {
      avatarShape: 'circular',
      backgroundType: 'solido',
      backgroundColor: '#111827',
      titleFont: 'Inter',
      titleColor: '#f9fafb',
      descriptionFont: 'Inter',
      descriptionColor: '#9ca3af',
      linkFont: 'Inter',
      linkColor: '#111827',
      buttonStyle: 'solido',
      buttonBorderRadius: 'arredondado',
      buttonColor: '#f9fafb',
      buttonTextColor: '#111827',
      nameColor: '#f9fafb',
    },
  },
  {
    id: 'roxo-umbler',
    nome: 'Roxo Umbler',
    config: {
      avatarShape: 'circular',
      backgroundType: 'gradiente',
      backgroundColor: '#6B2FD9',
      gradientTop: '#6B2FD9',
      gradientBottom: '#8B4FF0',
      titleFont: 'Inter',
      titleColor: '#ffffff',
      descriptionFont: 'Inter',
      descriptionColor: 'rgba(255,255,255,0.8)',
      linkFont: 'Inter',
      linkColor: '#6B2FD9',
      buttonStyle: 'solido',
      buttonBorderRadius: 'full',
      buttonColor: '#ffffff',
      buttonTextColor: '#6B2FD9',
      nameColor: '#ffffff',
    },
  },
  {
    id: 'gradiente-oceano',
    nome: 'Gradiente Oceano',
    config: {
      avatarShape: 'circular',
      backgroundType: 'gradiente',
      backgroundColor: '#0ea5e9',
      gradientTop: '#0ea5e9',
      gradientBottom: '#6366f1',
      titleFont: 'Poppins',
      titleColor: '#ffffff',
      descriptionFont: 'Poppins',
      descriptionColor: 'rgba(255,255,255,0.85)',
      linkFont: 'Poppins',
      linkColor: '#ffffff',
      buttonStyle: 'borda',
      buttonBorderRadius: 'full',
      buttonColor: 'transparent',
      buttonTextColor: '#ffffff',
      nameColor: '#ffffff',
    },
  },
];

// ─── Plataformas ─────────────────────────────────────────────────
const PLATAFORMAS: { id: PlatformType; label: string; urlBase: string; placeholder: string }[] = [
  { id: 'instagram', label: 'Instagram', urlBase: 'https://instagram.com/', placeholder: 'instagram.com/seu-usuario' },
  { id: 'facebook', label: 'Facebook', urlBase: 'https://facebook.com/', placeholder: 'facebook.com/sua-pagina' },
  { id: 'linkedin', label: 'LinkedIn', urlBase: 'https://linkedin.com/in/', placeholder: 'linkedin.com/in/seu-perfil' },
  { id: 'twitter', label: 'X (Twitter)', urlBase: 'https://x.com/', placeholder: 'x.com/seu-usuario' },
  { id: 'youtube', label: 'YouTube', urlBase: 'https://youtube.com/@', placeholder: 'youtube.com/@seu-canal' },
  { id: 'email', label: 'E-mail', urlBase: 'mailto:', placeholder: 'seu@email.com' },
  { id: 'whatsapp', label: 'WhatsApp', urlBase: 'https://wa.me/', placeholder: '5511999999999' },
  { id: 'threads', label: 'Threads', urlBase: 'https://threads.net/@', placeholder: 'threads.net/@seu-usuario' },
  { id: 'substack', label: 'Substack', urlBase: '', placeholder: 'seusite.substack.com' },
  { id: 'website', label: 'Website', urlBase: '', placeholder: 'https://seu-site.com' },
];

// ─── Schemas de validação ────────────────────────────────────────
const esquemaUsername = z
  .string()
  .min(3, 'Mínimo 3 caracteres')
  .max(30, 'Máximo 30 caracteres')
  .regex(/^[a-z0-9_-]+$/, 'Use apenas letras minúsculas, números, _ ou -');

const esquemaDados = z.object({
  nome: z.string().min(2, 'Nome obrigatório'),
  telefone: z.string().optional(),
  comoConheceu: z.string().optional(),
});

const esquemaPerfil = z.object({
  titulo: z.string().min(1, 'Informe sua profissão ou título').max(60, 'Máximo 60 caracteres'),
  bio: z.string().max(160, 'Máximo 160 caracteres').optional(),
});

type DadosForm = z.infer<typeof esquemaDados>;
type PerfilForm = z.infer<typeof esquemaPerfil>;

// ─── Componente principal ────────────────────────────────────────
export default function PaginaOnboarding() {
  const router = useRouter();
  const [etapa, setEtapa] = useState(1);
  const [uid, setUid] = useState<string | null>(null);
  const [nomeUsuario, setNomeUsuario] = useState('');

  // Estado de cada etapa
  const [username, setUsername] = useState('');
  const [statusUsername, setStatusUsername] = useState<'idle' | 'verificando' | 'disponivel' | 'indisponivel'>('idle');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [temaSelecionado, setTemaSelecionado] = useState('roxo-umbler');
  const [plataformasSelecionadas, setPlataformasSelecionadas] = useState<PlatformType[]>([]);
  const [urlsPlataformas, setUrlsPlataformas] = useState<Record<string, string>>({});
  const [avatarBlob, setAvatarBlob] = useState<Blob | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');

  const dadosForm = useForm<DadosForm>({ resolver: zodResolver(esquemaDados) });
  const perfilForm = useForm<PerfilForm>({ resolver: zodResolver(esquemaPerfil) });

  // Detecta usuário logado
  useEffect(() => {
    const cancelar = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.push('/login');
        return;
      }
      setUid(user.uid);
      setNomeUsuario(user.displayName ?? '');
      if (user.displayName) {
        dadosForm.setValue('nome', user.displayName);
      }
    });
    return () => cancelar();
  }, [router, dadosForm]);

  // Debounce verificação de username
  useEffect(() => {
    if (username.length < 3) {
      setStatusUsername('idle');
      return;
    }
    setStatusUsername('verificando');
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      const disponivel = await isUsernameAvailable(username);
      setStatusUsername(disponivel ? 'disponivel' : 'indisponivel');
    }, 500);
  }, [username]);

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setCropSrc(reader.result as string);
    reader.readAsDataURL(file);
    // reset input so o mesmo arquivo pode ser selecionado novamente
    e.target.value = '';
  }

  async function confirmarCrop(blob: Blob) {
    setAvatarBlob(blob);
    setAvatarPreview(URL.createObjectURL(blob));
    setCropSrc(null);
  }

  function togglePlataforma(id: PlatformType) {
    setPlataformasSelecionadas((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  }

  function aplicarMascaraTelefone(valor: string) {
    const numeros = valor.replace(/\D/g, '').slice(0, 11);
    if (numeros.length <= 2) return numeros;
    if (numeros.length <= 7) return `(${numeros.slice(0, 2)}) ${numeros.slice(2)}`;
    return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 7)}-${numeros.slice(7)}`;
  }

  async function concluirOnboarding(perfil: PerfilForm) {
    if (!uid) return;
    setSalvando(true);
    setErro('');
    try {
      // Upload do avatar
      let avatarUrl = '';
      if (avatarBlob) {
        const avatarRef = ref(storage, `avatars/${uid}`);
        await uploadBytes(avatarRef, avatarBlob);
        avatarUrl = await getDownloadURL(avatarRef);
      }

      const tema = TEMAS_PRESET.find((t) => t.id === temaSelecionado)!.config;
      const dadosPessoais = dadosForm.getValues();

      // Salva perfil no Firestore
      await saveUserProfile(uid, {
        uid,
        username,
        displayName: dadosPessoais.nome,
        title: perfil.titulo,
        bio: perfil.bio ?? '',
        avatarUrl,
        phone: dadosPessoais.telefone ?? '',
        howFoundUs: dadosPessoais.comoConheceu,
        theme: tema,
      });

      // Salva os links de cada plataforma selecionada
      for (let i = 0; i < plataformasSelecionadas.length; i++) {
        const plataforma = plataformasSelecionadas[i];
        const url = urlsPlataformas[plataforma] ?? '';
        if (!url) continue;
        const plat = PLATAFORMAS.find((p) => p.id === plataforma)!;
        await addLink(uid, {
          type: plataforma,
          title: plat.label,
          url,
          order: i,
          active: true,
          clickCount: 0,
        });
      }

      router.push('/dashboard');
    } catch {
      setErro('Ocorreu um erro ao salvar seus dados. Tente novamente.');
    } finally {
      setSalvando(false);
    }
  }

  const totalEtapas = 6;
  const progresso = (etapa / totalEtapas) * 100;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {cropSrc && (
        <AvatarCropModal
          imageSrc={cropSrc}
          onConfirmar={confirmarCrop}
          onCancelar={() => setCropSrc(null)}
        />
      )}
      {/* Cabeçalho com progresso */}
      <header className="bg-white border-b border-border px-4 sm:px-6 py-4">
        <div className="mx-auto max-w-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-base font-bold text-primary">Umbler Links</span>
            <span className="text-sm text-muted-foreground">
              Etapa {etapa} de {totalEtapas}
            </span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-gray-200">
            <div
              className="h-1.5 rounded-full bg-primary transition-all duration-300"
              style={{ width: `${progresso}%` }}
            />
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-start justify-center px-4 py-10">
        <div className="w-full max-w-lg bg-white rounded-xl border border-border shadow-sm p-6 sm:p-8">

          {/* ── Etapa 1: Username ─────────────────────── */}
          {etapa === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Escolha seu link</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Esse será seu endereço único: <strong>umbler.link/seu-nome</strong>
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="username">Seu username</Label>
                <div className="flex items-center rounded-lg border border-border overflow-hidden focus-within:ring-2 focus-within:ring-primary/50">
                  <span className="px-3 py-2 bg-gray-50 text-sm text-muted-foreground border-r border-border whitespace-nowrap">
                    umbler.link/
                  </span>
                  <input
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                    placeholder="seu-nome"
                    className="flex-1 px-3 py-2 text-sm outline-none bg-white"
                    autoComplete="off"
                    autoCapitalize="off"
                  />
                  <span className="px-3">
                    {statusUsername === 'verificando' && (
                      <span className="text-xs text-muted-foreground">...</span>
                    )}
                    {statusUsername === 'disponivel' && (
                      <span className="text-green-600 text-lg">✓</span>
                    )}
                    {statusUsername === 'indisponivel' && (
                      <span className="text-destructive text-lg">✗</span>
                    )}
                  </span>
                </div>
                {statusUsername === 'disponivel' && (
                  <p className="text-xs text-green-600">Disponível!</p>
                )}
                {statusUsername === 'indisponivel' && (
                  <p className="text-xs text-destructive">Este username já está em uso.</p>
                )}
                {username.length > 0 && username.length < 3 && (
                  <p className="text-xs text-destructive">Mínimo 3 caracteres.</p>
                )}
              </div>

              <Button
                className="w-full"
                disabled={statusUsername !== 'disponivel'}
                onClick={() => setEtapa(2)}
              >
                Continuar
              </Button>
            </div>
          )}

          {/* ── Etapa 2: Dados pessoais ───────────────── */}
          {etapa === 2 && (
            <form
              onSubmit={dadosForm.handleSubmit(() => setEtapa(3))}
              className="space-y-6"
            >
              <div>
                <h2 className="text-xl font-bold text-gray-900">Seus dados</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Informações básicas do seu perfil
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="nome">Nome completo *</Label>
                  <Input
                    id="nome"
                    placeholder={nomeUsuario || 'João Silva'}
                    {...dadosForm.register('nome')}
                  />
                  {dadosForm.formState.errors.nome && (
                    <p className="text-xs text-destructive">
                      {dadosForm.formState.errors.nome.message}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="telefone">Telefone</Label>
                  <Input
                    id="telefone"
                    placeholder="(11) 99999-9999"
                    value={dadosForm.watch('telefone') ?? ''}
                    onChange={(e) =>
                      dadosForm.setValue('telefone', aplicarMascaraTelefone(e.target.value))
                    }
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="comoConheceu">Como você conheceu o Umbler Links?</Label>
                  <select
                    id="comoConheceu"
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50"
                    {...dadosForm.register('comoConheceu')}
                  >
                    <option value="">Selecione (opcional)</option>
                    <option value="redes-sociais">Redes sociais</option>
                    <option value="indicacao">Indicação</option>
                    <option value="busca-google">Busca no Google</option>
                    <option value="outros">Outros</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setEtapa(1)}>
                  Voltar
                </Button>
                <Button type="submit" className="flex-1">
                  Continuar
                </Button>
              </div>
            </form>
          )}

          {/* ── Etapa 3: Tema ─────────────────────────── */}
          {etapa === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Escolha seu tema</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Selecione a aparência da sua página de links
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {TEMAS_PRESET.map((tema) => {
                  const isGrad = tema.config.backgroundType === 'gradiente';
                  const bg = isGrad
                    ? `linear-gradient(to bottom, ${tema.config.gradientTop}, ${tema.config.gradientBottom})`
                    : tema.config.backgroundColor;

                  return (
                    <button
                      key={tema.id}
                      type="button"
                      onClick={() => setTemaSelecionado(tema.id)}
                      className={`relative rounded-xl border-2 p-0 overflow-hidden transition-all cursor-pointer ${
                        temaSelecionado === tema.id
                          ? 'border-primary ring-2 ring-primary/30'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      {/* Miniatura */}
                      <div
                        className="h-28 flex flex-col items-center justify-center gap-1.5 px-2"
                        style={{ background: bg }}
                      >
                        <div
                          className="h-7 w-7 rounded-full flex-shrink-0"
                          style={{ backgroundColor: tema.config.nameColor + '40', border: `1.5px solid ${tema.config.nameColor}60` }}
                        />
                        <span
                          className="text-[9px] font-semibold leading-none"
                          style={{ color: tema.config.nameColor }}
                        >
                          Seu Nome
                        </span>
                        {['Meu Instagram', 'Meu Site'].map((label, i) => (
                          <div
                            key={i}
                            className="w-24 h-4 flex items-center justify-center"
                            style={{
                              backgroundColor:
                                tema.config.buttonStyle === 'borda'
                                  ? 'transparent'
                                  : tema.config.buttonColor,
                              border:
                                tema.config.buttonStyle === 'borda'
                                  ? `1px solid ${tema.config.buttonColor}`
                                  : 'none',
                              borderRadius:
                                tema.config.buttonBorderRadius === 'full'
                                  ? '9999px'
                                  : tema.config.buttonBorderRadius === 'arredondado'
                                  ? '8px'
                                  : tema.config.buttonBorderRadius === 'quadrado'
                                  ? '4px'
                                  : '0px',
                            }}
                          >
                            <span
                              className="text-[7px] font-medium leading-none truncate px-1"
                              style={{ color: tema.config.buttonTextColor }}
                            >
                              {label}
                            </span>
                          </div>
                        ))}
                      </div>
                      <div className="py-1.5 text-center text-xs font-medium text-gray-700 bg-white">
                        {tema.nome}
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setEtapa(2)}>
                  Voltar
                </Button>
                <Button className="flex-1" onClick={() => setEtapa(4)}>
                  Continuar
                </Button>
              </div>
            </div>
          )}

          {/* ── Etapa 4: Plataformas ──────────────────── */}
          {etapa === 4 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Suas plataformas</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Selecione as redes e canais que deseja adicionar
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {PLATAFORMAS.map((p) => {
                  const selecionado = plataformasSelecionadas.includes(p.id);
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => togglePlataforma(p.id)}
                      className={`flex items-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium transition-all cursor-pointer ${
                        selecionado
                          ? 'border-primary bg-primary/5 text-primary'
                          : 'border-border text-gray-700 hover:border-primary/50'
                      }`}
                    >
                      <span className="text-base">{selecionado ? '✓' : '+'}</span>
                      {p.label}
                    </button>
                  );
                })}
              </div>

              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setEtapa(3)}>
                  Voltar
                </Button>
                <Button
                  className="flex-1"
                  disabled={plataformasSelecionadas.length === 0}
                  onClick={() => setEtapa(5)}
                >
                  Continuar
                </Button>
              </div>
            </div>
          )}

          {/* ── Etapa 5: URLs ─────────────────────────── */}
          {etapa === 5 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Seus links</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Informe a URL de cada plataforma selecionada
                </p>
              </div>

              <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                {plataformasSelecionadas.map((id) => {
                  const plat = PLATAFORMAS.find((p) => p.id === id)!;
                  return (
                    <div key={id} className="space-y-1">
                      <Label>{plat.label}</Label>
                      <Input
                        placeholder={plat.placeholder}
                        value={urlsPlataformas[id] ?? ''}
                        onChange={(e) =>
                          setUrlsPlataformas((prev) => ({ ...prev, [id]: e.target.value }))
                        }
                      />
                    </div>
                  );
                })}
              </div>

              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setEtapa(4)}>
                  Voltar
                </Button>
                <Button className="flex-1" onClick={() => setEtapa(6)}>
                  Continuar
                </Button>
              </div>
            </div>
          )}

          {/* ── Etapa 6: Perfil ───────────────────────── */}
          {etapa === 6 && (
            <form
              onSubmit={perfilForm.handleSubmit(concluirOnboarding)}
              className="space-y-6"
            >
              <div>
                <h2 className="text-xl font-bold text-gray-900">Seu perfil</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Finalize adicionando sua foto e uma breve descrição
                </p>
              </div>

              {/* Upload de avatar */}
              <div className="flex flex-col items-center gap-3">
                <div className="relative">
                  <div className="h-20 w-20 rounded-full overflow-hidden border-2 border-border bg-gray-100 flex items-center justify-center">
                    {avatarPreview ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={avatarPreview} alt="Avatar" className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-3xl text-gray-400">👤</span>
                    )}
                  </div>
                </div>
                <label className="cursor-pointer text-sm font-medium text-primary hover:underline">
                  {avatarPreview ? 'Trocar foto' : 'Adicionar foto de perfil'}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarChange}
                  />
                </label>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="titulo">O que você faz? *</Label>
                  <Input
                    id="titulo"
                    placeholder="Ex: Designer Gráfico, Advogada, Criador de Conteúdo"
                    {...perfilForm.register('titulo')}
                  />
                  {perfilForm.formState.errors.titulo && (
                    <p className="text-xs text-destructive">
                      {perfilForm.formState.errors.titulo.message}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="bio">Bio curta</Label>
                    <span className="text-xs text-muted-foreground">
                      {(perfilForm.watch('bio') ?? '').length}/160
                    </span>
                  </div>
                  <textarea
                    id="bio"
                    rows={3}
                    placeholder="Conte um pouco sobre você..."
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                    {...perfilForm.register('bio')}
                  />
                  {perfilForm.formState.errors.bio && (
                    <p className="text-xs text-destructive">
                      {perfilForm.formState.errors.bio.message}
                    </p>
                  )}
                </div>
              </div>

              {erro && (
                <div className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  {erro}
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setEtapa(5)}
                  disabled={salvando}
                >
                  Voltar
                </Button>
                <Button type="submit" className="flex-1" disabled={salvando}>
                  {salvando ? 'Salvando...' : 'Criar minha página'}
                </Button>
              </div>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
