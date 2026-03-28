'use client';

import { useState, useEffect, useRef } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth, storage } from '@/lib/firebase';
import { getUserProfile, saveUserProfile, updateLink } from '@/lib/firestore';
import { useLinks } from '@/hooks/useLinks';
import { UserProfile, Link as LinkType } from '@/types';
import { AddLinkModal } from '@/components/editor/AddLinkModal';
import { LinkList } from '@/components/editor/LinkList';
import { MobilePreview } from '@/components/editor/MobilePreview';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

export default function PaginaDashboard() {
  const [uid, setUid] = useState<string | null>(null);
  const [perfil, setPerfil] = useState<UserProfile | null>(null);
  const [carregandoPerfil, setCarregandoPerfil] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);
  const [copiado, setCopiado] = useState(false);

  // Campos inline editáveis
  const [editandoNome, setEditandoNome] = useState(false);
  const [editandoTitulo, setEditandoTitulo] = useState(false);
  const [editandoBio, setEditandoBio] = useState(false);
  const [nomeTemp, setNomeTemp] = useState('');
  const [tituloTemp, setTituloTemp] = useState('');
  const [bioTemp, setBioTemp] = useState('');

  const inputAvatarRef = useRef<HTMLInputElement>(null);
  const { links, carregando: carregandoLinks, adicionar, atualizar, remover } = useLinks(uid);

  useEffect(() => {
    const cancelar = onAuthStateChanged(auth, async (user) => {
      if (!user) return;
      setUid(user.uid);
      const dados = await getUserProfile(user.uid);
      if (dados) {
        setPerfil(dados);
        setNomeTemp(dados.displayName);
        setTituloTemp(dados.title);
        setBioTemp(dados.bio);
      }
      setCarregandoPerfil(false);
    });
    return () => cancelar();
  }, []);

  async function salvarCampoPerfil(campo: 'displayName' | 'title' | 'bio', valor: string) {
    if (!uid || !perfil) return;
    const atualizado = { ...perfil, [campo]: valor };
    setPerfil(atualizado);
    await saveUserProfile(uid, { [campo]: valor });
  }

  async function trocarAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !uid) return;
    const avatarRef = ref(storage, `avatars/${uid}`);
    await uploadBytes(avatarRef, file);
    const avatarUrl = await getDownloadURL(avatarRef);
    await saveUserProfile(uid, { avatarUrl });
    setPerfil((prev) => prev ? { ...prev, avatarUrl } : prev);
  }

  async function adicionarLink(dados: { type: LinkType['type']; title: string; url: string }) {
    if (!uid) return;
    await adicionar({
      type: dados.type,
      title: dados.title,
      url: dados.url,
      order: links.length,
      active: true,
      clickCount: 0,
    });
  }

  async function reordenarLinks(reordenados: LinkType[]) {
    if (!uid) return;
    // Atualiza localmente de imediato
    for (const link of reordenados) {
      await updateLink(uid, link.id, { order: link.order });
    }
  }

  function copiarLink() {
    if (!perfil) return;
    const url = `${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/${perfil.username}`;
    navigator.clipboard.writeText(url);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  }

  const iniciais = perfil?.displayName
    ? perfil.displayName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : '?';

  return (
    <div className="flex gap-0 min-h-screen">
      {/* ── Coluna principal ──────────────────────────────────────── */}
      <div className="flex-1 max-w-2xl mx-auto px-4 sm:px-6 py-6 space-y-6">

        {/* Seção de perfil */}
        <section className="bg-white rounded-xl border border-border p-5 space-y-4">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Perfil</h2>

          {carregandoPerfil ? (
            <div className="space-y-3">
              <Skeleton className="h-16 w-16 rounded-full" />
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-56" />
            </div>
          ) : (
            <div className="flex items-start gap-4">
              {/* Avatar clicável */}
              <div className="relative group flex-shrink-0">
                <div
                  className="h-16 w-16 rounded-full overflow-hidden bg-primary/10 flex items-center justify-center cursor-pointer border-2 border-transparent group-hover:border-primary transition-colors"
                  onClick={() => inputAvatarRef.current?.click()}
                >
                  {perfil?.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={perfil.avatarUrl}
                      alt={perfil.displayName}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-xl font-bold text-primary">{iniciais}</span>
                  )}
                </div>
                <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                  <IconeCamera className="h-5 w-5 text-white" />
                </div>
                <input
                  ref={inputAvatarRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={trocarAvatar}
                />
              </div>

              {/* Campos inline */}
              <div className="flex-1 min-w-0 space-y-1">
                {/* Nome */}
                {editandoNome ? (
                  <input
                    value={nomeTemp}
                    onChange={(e) => setNomeTemp(e.target.value)}
                    onBlur={async () => {
                      setEditandoNome(false);
                      await salvarCampoPerfil('displayName', nomeTemp);
                    }}
                    onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
                    autoFocus
                    className="text-base font-bold text-gray-900 w-full border-b border-primary outline-none bg-transparent"
                  />
                ) : (
                  <p
                    className="text-base font-bold text-gray-900 cursor-pointer hover:text-primary transition-colors"
                    onClick={() => setEditandoNome(true)}
                    title="Clique para editar"
                  >
                    {perfil?.displayName || 'Seu nome'}
                  </p>
                )}

                {/* Título */}
                {editandoTitulo ? (
                  <input
                    value={tituloTemp}
                    onChange={(e) => setTituloTemp(e.target.value)}
                    onBlur={async () => {
                      setEditandoTitulo(false);
                      await salvarCampoPerfil('title', tituloTemp);
                    }}
                    onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
                    autoFocus
                    placeholder="Sua profissão ou título"
                    className="text-sm text-gray-600 w-full border-b border-primary outline-none bg-transparent"
                  />
                ) : (
                  <p
                    className="text-sm text-gray-600 cursor-pointer hover:text-primary transition-colors"
                    onClick={() => setEditandoTitulo(true)}
                    title="Clique para editar"
                  >
                    {perfil?.title || 'Adicione um título'}
                  </p>
                )}

                {/* Bio */}
                {editandoBio ? (
                  <textarea
                    value={bioTemp}
                    onChange={(e) => setBioTemp(e.target.value)}
                    onBlur={async () => {
                      setEditandoBio(false);
                      await salvarCampoPerfil('bio', bioTemp);
                    }}
                    autoFocus
                    rows={2}
                    placeholder="Sua bio..."
                    className="text-xs text-gray-500 w-full border-b border-primary outline-none bg-transparent resize-none"
                  />
                ) : (
                  <p
                    className="text-xs text-gray-500 cursor-pointer hover:text-primary transition-colors line-clamp-2"
                    onClick={() => setEditandoBio(true)}
                    title="Clique para editar"
                  >
                    {perfil?.bio || 'Adicione uma bio'}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Copiar link */}
          {perfil && (
            <div className="flex items-center gap-2 pt-1">
              <code className="flex-1 text-xs bg-gray-50 rounded-lg px-3 py-2 truncate text-gray-600 border border-border">
                umbler.link/{perfil.username}
              </code>
              <button
                onClick={copiarLink}
                className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors whitespace-nowrap"
              >
                {copiado ? (
                  <>
                    <IconeCheck className="h-3.5 w-3.5 text-green-600" />
                    Copiado!
                  </>
                ) : (
                  <>
                    <IconeCopiar className="h-3.5 w-3.5" />
                    Copiar link
                  </>
                )}
              </button>
            </div>
          )}
        </section>

        {/* Seção de links */}
        <section className="bg-white rounded-xl border border-border p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Links</h2>
            <Button size="sm" onClick={() => setModalAberto(true)}>
              + Adicionar link
            </Button>
          </div>

          {carregandoLinks ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-20 w-full rounded-xl" />
              ))}
            </div>
          ) : (
            <LinkList
              links={links}
              onReordenar={reordenarLinks}
              onUpdate={atualizar}
              onDelete={remover}
            />
          )}
        </section>
      </div>

      {/* ── Preview mobile (desktop only) ────────────────────────── */}
      <div className="hidden xl:flex items-start pt-6 pr-8 sticky top-6">
        {perfil && <MobilePreview perfil={perfil} links={links} />}
      </div>

      {/* Modal de adicionar link */}
      <AddLinkModal
        aberto={modalAberto}
        onFechar={() => setModalAberto(false)}
        onAdicionar={adicionarLink}
      />
    </div>
  );
}

/* ── Ícones ─────────────────────────────────────────────────────── */

function IconeCamera({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 0 1 2-2h.93a2 2 0 0 0 1.664-.89l.812-1.22A2 2 0 0 1 10.07 4h3.86a2 2 0 0 1 1.664.89l.812 1.22A2 2 0 0 0 18.07 7H19a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9z" />
      <circle cx="12" cy="13" r="3" />
    </svg>
  );
}

function IconeCopiar({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v2m-6 12h8a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2h-8a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2z" />
    </svg>
  );
}

function IconeCheck({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}
