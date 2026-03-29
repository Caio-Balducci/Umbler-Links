import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { revalidatePath } from 'next/cache';

// Inicializa o Firebase Admin SDK — apenas server-side, nunca exposto ao cliente
function getAdminDb() {
  if (getApps().length === 0) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const serviceAccount = require('../../../SDK-firebase.json');
    initializeApp({ credential: cert(serviceAccount) });
  }
  return getFirestore();
}

function detectarDispositivo(userAgent: string): 'mobile' | 'desktop' | 'tablet' {
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobile))/i.test(userAgent)) return 'tablet';
  if (/mobile|android|iphone|ipod|blackberry|opera mini|iemobile/i.test(userAgent)) return 'mobile';
  return 'desktop';
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { linkId, userId, username, variant, abTestRunId } = body;

    if (!linkId || !userId || !username) {
      return NextResponse.json({ erro: 'Dados incompletos' }, { status: 400 });
    }

    const userAgent = request.headers.get('user-agent') ?? '';
    const device = detectarDispositivo(userAgent);
    const db = getAdminDb();

    // Registra o evento de clique e incrementa contador atomicamente
    await Promise.all([
      db.collection('clicks').add({
        linkId,
        userId,
        username,
        device,
        timestamp: FieldValue.serverTimestamp(),
        ...(variant ? { variant } : {}),
        ...(abTestRunId ? { abTestRunId } : {}),
      }),
      db.doc(`users/${userId}/links/${linkId}`).update({
        clickCount: FieldValue.increment(1),
      }),
    ]);

    // Verifica o modo de ordenação do usuário
    const userDoc = await db.doc(`users/${userId}`).get();
    const modoOrdenacao = userDoc.data()?.modoOrdenacao as string | undefined;

    if (modoOrdenacao === 'mais-cliques' || modoOrdenacao === 'menos-cliques') {
      // Busca todos os links com o clickCount já atualizado
      const linksSnap = await db
        .collection(`users/${userId}/links`)
        .orderBy('order', 'asc')
        .get();

      const links = linksSnap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as { order: number; clickCount: number; pinned?: boolean }),
      }));

      // Separa fixados (mantêm posição) e livres (serão ordenados)
      const posicoesPinadas: Record<number, typeof links[0]> = {};
      links.forEach((l, i) => { if (l.pinned) posicoesPinadas[i] = l; });

      const livres = links.filter((l) => !l.pinned);
      const livresOrdenados = [...livres].sort((a, b) =>
        modoOrdenacao === 'mais-cliques'
          ? b.clickCount - a.clickCount
          : a.clickCount - b.clickCount
      );

      // Reconstrói array com fixados nas posições originais
      const resultado: typeof links[0][] = new Array(links.length);
      Object.entries(posicoesPinadas).forEach(([idx, link]) => {
        resultado[parseInt(idx)] = link;
      });
      let livreIdx = 0;
      for (let i = 0; i < resultado.length; i++) {
        if (!resultado[i]) resultado[i] = livresOrdenados[livreIdx++];
      }

      // Salva novos valores de order em batch
      const batch = db.batch();
      resultado.forEach((link, i) => {
        batch.update(db.doc(`users/${userId}/links/${link.id}`), { order: i });
      });
      await batch.commit();

      // Invalida o cache da página pública
      revalidatePath(`/${username}`);
    }

    return NextResponse.json({ ok: true });
  } catch (erro) {
    console.error('Erro ao registrar clique:', erro);
    return NextResponse.json({ erro: 'Erro interno' }, { status: 500 });
  }
}
