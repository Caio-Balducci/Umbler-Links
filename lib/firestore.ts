import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  orderBy,
  addDoc,
  deleteDoc,
  serverTimestamp,
  limit,
  arrayUnion,
} from 'firebase/firestore';
import { db } from './firebase';
import { UserProfile, Link, ClickEvent, VisitEvent, ThemeConfig, AbTestRun } from '@/types';

// ——— Usuários ———

// Busca perfil por UID
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const docRef = doc(db, 'users', uid);
  const snap = await getDoc(docRef);
  return snap.exists() ? (snap.data() as UserProfile) : null;
}

// Busca perfil por username (para página pública)
export async function getUserByUsername(username: string): Promise<UserProfile | null> {
  const q = query(collection(db, 'users'), where('username', '==', username), limit(1));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return snap.docs[0].data() as UserProfile;
}

// Verifica se username está disponível
export async function isUsernameAvailable(username: string): Promise<boolean> {
  const q = query(collection(db, 'users'), where('username', '==', username), limit(1));
  const snap = await getDocs(q);
  return snap.empty;
}

// Cria ou atualiza perfil do usuário
export async function saveUserProfile(uid: string, data: Partial<UserProfile>): Promise<void> {
  const docRef = doc(db, 'users', uid);
  await setDoc(docRef, data, { merge: true });
}

// Atualiza tema do usuário
export async function updateUserTheme(uid: string, theme: ThemeConfig): Promise<void> {
  const docRef = doc(db, 'users', uid);
  await updateDoc(docRef, { theme });
}

// Adiciona entrada ao histórico de testes A/B (usa arrayUnion para não sobrescrever)
export async function adicionarHistoricoAbTest(uid: string, run: AbTestRun): Promise<void> {
  const docRef = doc(db, 'users', uid);
  await updateDoc(docRef, { abTestHistorico: arrayUnion(run) });
}

// ——— Links ———

// Busca todos os links do usuário
export async function getUserLinks(uid: string): Promise<Link[]> {
  const q = query(
    collection(db, 'users', uid, 'links'),
    orderBy('order', 'asc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Link));
}

// Busca links ativos do usuário (para página pública)
export async function getActiveUserLinks(uid: string): Promise<Link[]> {
  const q = query(
    collection(db, 'users', uid, 'links'),
    orderBy('order', 'asc')
  );
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() } as Link))
    .filter((l) => l.active);
}

// Adiciona novo link
export async function addLink(uid: string, link: Omit<Link, 'id' | 'createdAt'>): Promise<string> {
  const colRef = collection(db, 'users', uid, 'links');
  const docRef = await addDoc(colRef, {
    ...link,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

// Atualiza link existente
export async function updateLink(uid: string, linkId: string, data: Partial<Link>): Promise<void> {
  const docRef = doc(db, 'users', uid, 'links', linkId);
  await updateDoc(docRef, data);
}

// Remove link
export async function deleteLink(uid: string, linkId: string): Promise<void> {
  const docRef = doc(db, 'users', uid, 'links', linkId);
  await deleteDoc(docRef);
}

// ——— Cliques ———

// Registra evento de clique
export async function registerClick(event: Omit<ClickEvent, 'timestamp'>): Promise<void> {
  await addDoc(collection(db, 'clicks'), {
    ...event,
    timestamp: serverTimestamp(),
  });
}

// Busca cliques do usuário (para analytics)
export async function getUserClicks(userId: string): Promise<ClickEvent[]> {
  const q = query(collection(db, 'clicks'), where('userId', '==', userId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as ClickEvent);
}

// ——— Visitas ———

// Busca visitas do usuário (para analytics)
export async function getUserVisits(userId: string): Promise<VisitEvent[]> {
  const q = query(collection(db, 'visits'), where('userId', '==', userId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as VisitEvent);
}
