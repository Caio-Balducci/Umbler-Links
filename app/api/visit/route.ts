import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

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
    const { userId, username } = body;

    if (!userId || !username) {
      return NextResponse.json({ erro: 'Dados incompletos' }, { status: 400 });
    }

    const userAgent = request.headers.get('user-agent') ?? '';
    const device = detectarDispositivo(userAgent);
    const db = getAdminDb();

    // Registra o evento de visita
    await db.collection('visits').add({
      userId,
      username,
      device,
      timestamp: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ ok: true });
  } catch (erro) {
    console.error('Erro ao registrar visita:', erro);
    return NextResponse.json({ erro: 'Erro interno' }, { status: 500 });
  }
}
