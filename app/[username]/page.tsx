import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { UserProfile, Link as LinkType } from '@/types';
import PaginaPublica from './PaginaPublica';

export const dynamic = 'force-dynamic'; // sempre busca dados frescos do Firestore

// ─── Firebase Admin (server-side only) ──────────────────────────
// Usa ADC — no Firebase App Hosting as credenciais são injetadas automaticamente
function getAdminDb() {
  if (getApps().length === 0) {
    initializeApp();
  }
  return getFirestore();
}

// Converte qualquer valor para tipos simples serializáveis pelo Next.js
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function serializar(obj: Record<string, any>): Record<string, any> {
  const resultado: Record<string, any> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v === null || v === undefined) {
      resultado[k] = v ?? null;
    } else if (typeof v?.toDate === 'function') {
      // Firestore Admin Timestamp → string ISO
      resultado[k] = (v.toDate() as Date).toISOString();
    } else if (typeof v === 'object' && !Array.isArray(v)) {
      resultado[k] = serializar(v as Record<string, any>);
    } else {
      resultado[k] = v;
    }
  }
  return resultado;
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
  const perfil = serializar(perfilDoc.data()) as unknown as UserProfile;

  const linksSnap = await db
    .collection('users')
    .doc(perfilDoc.id)
    .collection('links')
    .orderBy('order', 'asc')
    .get();

  const links = linksSnap.docs
    .map((d) => serializar({ id: d.id, ...d.data() }) as unknown as LinkType)
    .filter((l) => l.active);

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
    title: `${perfil.displayName} — Umbler Links`,
    description: perfil.bio || `Veja todos os links de ${perfil.displayName} em um só lugar.`,
    openGraph: {
      title: `${perfil.displayName} — Umbler Links`,
      description: perfil.bio || `Veja todos os links de ${perfil.displayName}.`,
      images: perfil.avatarUrl ? [{ url: perfil.avatarUrl }] : [],
      url: `${appUrl}/${username}`,
      type: 'profile',
    },
    twitter: {
      card: 'summary',
      title: `${perfil.displayName} — Umbler Links`,
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

