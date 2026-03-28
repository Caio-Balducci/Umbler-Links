import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { UserProfile, Link as LinkType } from '@/types';
import PaginaPublica from './PaginaPublica';

export const revalidate = 60; // ISR: revalida a cada 60 segundos

// ─── Firebase Admin (server-side only) ──────────────────────────
function getAdminDb() {
  if (getApps().length === 0) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const serviceAccount = require('../../SDK-firebase.json');
    initializeApp({ credential: cert(serviceAccount) });
  }
  return getFirestore();
}

// ─── generateStaticParams ────────────────────────────────────────
export async function generateStaticParams() {
  try {
    const db = getAdminDb();
    const snap = await db.collection('users').limit(100).get();
    return snap.docs
      .map((doc) => ({ username: doc.data().username as string }))
      .filter(Boolean);
  } catch {
    return [];
  }
}

// ─── Busca de dados ──────────────────────────────────────────────
async function buscarDadosUsuario(username: string): Promise<{
  perfil: UserProfile;
  links: LinkType[];
} | null> {
  const db = getAdminDb();

  const usersSnap = await db
    .collection('users')
    .where('username', '==', username)
    .limit(1)
    .get();

  if (usersSnap.empty) return null;

  const perfilDoc = usersSnap.docs[0];
  const perfil = perfilDoc.data() as UserProfile;

  const linksSnap = await db
    .collection('users')
    .doc(perfilDoc.id)
    .collection('links')
    .where('active', '==', true)
    .orderBy('order', 'asc')
    .get();

  const links = linksSnap.docs.map((d) => ({ id: d.id, ...d.data() } as LinkType));

  return { perfil, links };
}

// ─── Metadata dinâmica (Open Graph) ─────────────────────────────
export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const { username } = await params;
  const dados = await buscarDadosUsuario(username);

  if (!dados) {
    return { title: 'Página não encontrada' };
  }

  const { perfil } = dados;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://umbler.link';

  return {
    title: `${perfil.displayName} — Umbler Link`,
    description: perfil.bio || `Veja todos os links de ${perfil.displayName} em um só lugar.`,
    openGraph: {
      title: `${perfil.displayName} — Umbler Link`,
      description: perfil.bio || `Veja todos os links de ${perfil.displayName}.`,
      images: perfil.avatarUrl ? [{ url: perfil.avatarUrl }] : [],
      url: `${appUrl}/${username}`,
      type: 'profile',
    },
    twitter: {
      card: 'summary',
      title: `${perfil.displayName} — Umbler Link`,
      description: perfil.bio || `Veja todos os links de ${perfil.displayName}.`,
      images: perfil.avatarUrl ? [perfil.avatarUrl] : [],
    },
  };
}

// ─── Página ─────────────────────────────────────────────────────
export default async function Page({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const dados = await buscarDadosUsuario(username);

  if (!dados) notFound();

  return <PaginaPublica perfil={dados.perfil} links={dados.links} />;
}

