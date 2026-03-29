'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth, storage } from '@/lib/firebase';
import { getUserProfile, saveUserProfile } from '@/lib/firestore';
import { useLinks } from '@/hooks/useLinks';
import { UserProfile, Link as LinkType } from '@/types';
import { AddLinkModal } from '@/components/editor/AddLinkModal';
import { AvatarCropModal } from '@/components/editor/AvatarCropModal';
import { LinkList } from '@/components/editor/LinkList';
import { MobilePreview } from '@/components/editor/MobilePreview';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

export default function PaginaDashboard() {
  const [uid, setUid] = useState<string | null>(null);
  const [perfil, setPerfil] = useState<UserProfile | null>(null);
  const [carregandoPerfil, setCarregandoPerfil] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);
  const [modalPerfilAberto, setModalPerfilAberto] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const [imagemCrop, setImagemCrop] = useState<string | null>(null);
  const [modoOrdenacao, setModoOrdenacao] = useState<'manual' | 'mais-cliques' | 'menos-cliques'>('manual');

  // Campos do modal de edição
  const [nomeTemp, setNomeTemp] = useState('');
  const [tituloTemp, setTituloTemp] = useState('');
  const [bioTemp, setBioTemp] = useState('');
  const [salvando, setSalvando] = useState(false);

  const inputAvatarRef = useRef<HTMLInputElement>(null);
  const { links, carregando: carregandoLinks, adicionar, atualizar, remover, reordenar } = useLinks(uid);

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
        if (dados.modoOrdenacao) setModoOrdenacao(dados.modoOrdenacao);
      }
      setCarregandoPerfil(false);
    });
    return () => cancelar();
  }, []);

  function abrirModalPerfil() {
    if (!perfil) return;
    setNomeTemp(perfil.displayName);
    setTituloTemp(perfil.title);
    setBioTemp(perfil.bio);
    setModalPerfilAberto(true);
  }

  async function salvarPerfil() {
    if (!uid || !perfil) return;
    setSalvando(true);
    const atualizado = { ...perfil, displayName: nomeTemp, title: tituloTemp, bio: bioTemp };
    setPerfil(atualizado);
    await saveUserProfile(uid, { displayName: nomeTemp, title: tituloTemp, bio: bioTemp });
    setSalvando(false);
    setModalPerfilAberto(false);
  }

  function trocarAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    // Limpa o input para permitir selecionar o mesmo arquivo novamente
    e.target.value = '';
    const leitor = new FileReader();
    leitor.onload = () => setImagemCrop(leitor.result as string);
    leitor.readAsDataURL(file);
  }

  async function salvarAvatarCropado(blob: Blob) {
    if (!uid) return;
    const avatarRef = ref(storage, `avatars/${uid}`);
    await uploadBytes(avatarRef, blob);
    const avatarUrl = await getDownloadURL(avatarRef);
    await saveUserProfile(uid, { avatarUrl });
    setPerfil((prev) => prev ? { ...prev, avatarUrl } : prev);
    setImagemCrop(null);
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

  // Ordenação derivada do modoOrdenacao
  const linksOrdenados = useMemo(() => {
    if (modoOrdenacao === 'manual') return links;

    const fixados = links
      .map((l, i) => ({ link: l, index: i }))
      .filter(({ link }) => link.pinned);

    const livres = links.filter((l) => !l.pinned);
    const livresOrdenados = [...livres].sort((a, b) =>
      modoOrdenacao === 'mais-cliques'
        ? b.clickCount - a.clickCount
        : a.clickCount - b.clickCount
    );

    const resultado: LinkType[] = new Array(links.length);
    fixados.forEach(({ link, index }) => { resultado[index] = link; });
    let livreIdx = 0;
    for (let i = 0; i < resultado.length; i++) {
      if (!resultado[i]) resultado[i] = livresOrdenados[livreIdx++];
    }
    return resultado;
  }, [links, modoOrdenacao]);

  function alterarModoOrdenacao(novo: 'manual' | 'mais-cliques' | 'menos-cliques') {
    setModoOrdenacao(novo);
    if (uid) saveUserProfile(uid, { modoOrdenacao: novo });

    if (novo !== 'manual' && links.length > 0) {
      const fixados = links
        .map((l, i) => ({ link: l, index: i }))
        .filter(({ link }) => link.pinned);
      const livres = links.filter((l) => !l.pinned);
      const livresOrdenados = [...livres].sort((a, b) =>
        novo === 'mais-cliques' ? b.clickCount - a.clickCount : a.clickCount - b.clickCount
      );
      const resultado: LinkType[] = new Array(links.length);
      fixados.forEach(({ link, index }) => { resultado[index] = link; });
      let livreIdx = 0;
      for (let i = 0; i < resultado.length; i++) {
        if (!resultado[i]) resultado[i] = livresOrdenados[livreIdx++];
      }
      reordenar(resultado.map((l, i) => ({ ...l, order: i })));
    }
  }

  function reordenarLinks(reordenados: LinkType[]) {
    reordenar(reordenados);
  }

  function fixarEmPosicao(id: string, posicao: number) {
    const idx = links.findIndex((l) => l.id === id);
    if (idx === -1) return;
    const nova = [...links];
    const [link] = nova.splice(idx, 1);
    nova.splice(posicao, 0, { ...link, pinned: true });
    const comOrdem = nova.map((l, i) => ({ ...l, order: i }));
    reordenar(comOrdem);
    atualizar(id, { pinned: true });
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
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Perfil</h2>
            {!carregandoPerfil && (
              <button
                onClick={abrirModalPerfil}
                className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <IconeEditar className="h-3.5 w-3.5" />
                Editar
              </button>
            )}
          </div>

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

              {/* Informações */}
              <div className="flex-1 min-w-0 space-y-1">
                <p className="text-base font-bold text-gray-900">
                  {perfil?.displayName || 'Seu nome'}
                </p>
                <p className="text-sm text-gray-600">
                  {perfil?.title || <span className="text-gray-400 italic">Sem título</span>}
                </p>
                <p className="text-xs text-gray-500 line-clamp-2">
                  {perfil?.bio || <span className="text-gray-400 italic">Sem bio</span>}
                </p>
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
                className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors whitespace-nowrap cursor-pointer"
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

          {/* Modo de ordenação */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs text-gray-400 font-medium mr-0.5">Ordenar:</span>
            {([
              ['manual', 'Manual'],
              ['mais-cliques', 'Mais cliques'],
              ['menos-cliques', 'Menos cliques'],
            ] as const).map(([modo, label]) => (
              <button
                key={modo}
                onClick={() => alterarModoOrdenacao(modo)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors cursor-pointer ${
                  modoOrdenacao === modo
                    ? 'bg-primary text-white'
                    : 'border border-border text-gray-600 hover:bg-gray-50'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {carregandoLinks ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-20 w-full rounded-xl" />
              ))}
            </div>
          ) : (
            <LinkList
              links={linksOrdenados}
              modoOrdenacao={modoOrdenacao}
              onReordenar={reordenarLinks}
              onUpdate={atualizar}
              onDelete={remover}
              onFixar={fixarEmPosicao}
            />
          )}
        </section>
      </div>

      {/* ── Preview mobile (desktop only) ────────────────────────── */}
      <div className="hidden xl:flex items-start pt-6 pr-8 sticky top-6 self-start">
        {perfil && <MobilePreview perfil={perfil} links={linksOrdenados} />}
      </div>

      {/* ── Modal de crop do avatar ──────────────────────────────── */}
      {imagemCrop && (
        <AvatarCropModal
          imageSrc={imagemCrop}
          onConfirmar={salvarAvatarCropado}
          onCancelar={() => setImagemCrop(null)}
        />
      )}

      {/* ── Modal de adicionar link ───────────────────────────────── */}
      <AddLinkModal
        aberto={modalAberto}
        onFechar={() => setModalAberto(false)}
        onAdicionar={adicionarLink}
      />

      {/* ── Modal de editar perfil ────────────────────────────────── */}
      {modalPerfilAberto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
          onClick={(e) => { if (e.target === e.currentTarget) setModalPerfilAberto(false); }}
        >
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-gray-900">Editar perfil</h2>
              <button
                onClick={() => setModalPerfilAberto(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
              >
                <IconeX className="h-5 w-5" />
              </button>
            </div>

            {/* Avatar */}
            <div className="flex justify-center">
              <div className="relative group">
                <div
                  className="h-20 w-20 rounded-full overflow-hidden bg-primary/10 flex items-center justify-center cursor-pointer border-2 border-transparent group-hover:border-primary transition-colors"
                  onClick={() => inputAvatarRef.current?.click()}
                >
                  {perfil?.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={perfil.avatarUrl} alt={perfil.displayName} className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-2xl font-bold text-primary">{iniciais}</span>
                  )}
                </div>
                <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                  <IconeCamera className="h-5 w-5 text-white" />
                </div>
              </div>
            </div>
            <p className="text-center text-xs text-gray-400 -mt-2">Clique na foto para trocar</p>

            {/* Campos */}
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-700">Nome</label>
                <input
                  value={nomeTemp}
                  onChange={(e) => setNomeTemp(e.target.value)}
                  placeholder="Seu nome"
                  className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-700">Título</label>
                <input
                  value={tituloTemp}
                  onChange={(e) => setTituloTemp(e.target.value)}
                  placeholder="Ex: Designer, Dev, Creator..."
                  className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-700">Bio</label>
                <textarea
                  value={bioTemp}
                  onChange={(e) => setBioTemp(e.target.value)}
                  placeholder="Uma breve descrição sobre você..."
                  rows={3}
                  className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary resize-none"
                />
              </div>
            </div>

            {/* Ações */}
            <div className="flex gap-3 pt-1">
              <button
                onClick={() => setModalPerfilAberto(false)}
                className="flex-1 rounded-lg border border-border py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={salvarPerfil}
                disabled={salvando}
                className="flex-1 rounded-lg bg-primary py-2 text-sm font-medium text-white hover:bg-primary/90 transition-colors disabled:opacity-60 cursor-pointer disabled:cursor-not-allowed"
              >
                {salvando ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}
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

function IconeEditar({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-5m-1.414-9.414a2 2 0 1 1 2.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  );
}

function IconeX({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}
