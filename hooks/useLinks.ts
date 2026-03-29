'use client';

import { useState, useEffect, useCallback } from 'react';
import { Link } from '@/types';
import { getUserLinks, addLink, updateLink, deleteLink } from '@/lib/firestore';

export function useLinks(uid: string | null) {
  const [links, setLinks] = useState<Link[]>([]);
  const [carregando, setCarregando] = useState(true);

  const carregar = useCallback(async () => {
    if (!uid) {
      setLinks([]);
      setCarregando(false);
      return;
    }
    setCarregando(true);
    try {
      const dados = await getUserLinks(uid);
      setLinks(dados);
    } finally {
      setCarregando(false);
    }
  }, [uid]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const adicionar = useCallback(
    async (link: Omit<Link, 'id' | 'createdAt'>) => {
      if (!uid) return;
      const id = await addLink(uid, link);
      await carregar();
      return id;
    },
    [uid, carregar]
  );

  const atualizar = useCallback(
    async (linkId: string, dados: Partial<Link>) => {
      if (!uid) return;
      await updateLink(uid, linkId, dados);
      setLinks((prev) => prev.map((l) => (l.id === linkId ? { ...l, ...dados } : l)));
    },
    [uid]
  );

  const remover = useCallback(
    async (linkId: string) => {
      if (!uid) return;
      await deleteLink(uid, linkId);
      setLinks((prev) => prev.filter((l) => l.id !== linkId));
    },
    [uid]
  );

  const reordenar = useCallback(
    (reordenados: Link[]) => {
      if (!uid) return;
      // Atualiza local imediatamente para não ter snap-back
      setLinks(reordenados);
      // Salva no Firestore em paralelo (sem await para não bloquear UI)
      Promise.all(
        reordenados.map((l) => updateLink(uid, l.id, { order: l.order }))
      ).catch(console.error);
    },
    [uid]
  );

  return { links, carregando, carregar, adicionar, atualizar, remover, reordenar };
}
