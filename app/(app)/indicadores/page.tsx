'use client';

import { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { getUserClicks, getUserLinks } from '@/lib/firestore';
import { ClickEvent, Link as LinkType } from '@/types';
import { ClickChart } from '@/components/analytics/ClickChart';
import { ExportButton } from '@/components/analytics/ExportButton';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Timestamp } from 'firebase/firestore';

function toDate(ts: unknown): Date {
  if (ts instanceof Timestamp) return ts.toDate();
  if (ts && typeof (ts as { toDate?: () => Date }).toDate === 'function') {
    return (ts as { toDate: () => Date }).toDate();
  }
  return new Date();
}

export default function PaginaIndicadores() {
  const [uid, setUid] = useState<string | null>(null);
  const [username, setUsername] = useState('');
  const [cliques, setCliques] = useState<ClickEvent[]>([]);
  const [links, setLinks] = useState<LinkType[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    const cancelar = onAuthStateChanged(auth, async (user) => {
      if (!user) return;
      setUid(user.uid);

      const [c, l] = await Promise.all([
        getUserClicks(user.uid),
        getUserLinks(user.uid),
      ]);
      setCliques(c);
      setLinks(l);

      // Pegar username do primeiro clique ou do perfil
      if (c.length > 0) setUsername(c[0].username);
      setCarregando(false);
    });
    return () => cancelar();
  }, []);

  if (carregando) {
    return (
      <div className="p-6 space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
        <Skeleton className="h-72 rounded-xl" />
      </div>
    );
  }

  // ── Métricas ──────────────────────────────────────────────────
  const agora = new Date();
  const ha30Dias = new Date(agora.getTime() - 30 * 86400000);

  const cliquesRecentes = cliques.filter(
    (c) => toDate(c.timestamp) >= ha30Dias
  );

  // Contagem por link
  const porLink: Record<string, number> = {};
  cliques.forEach((c) => {
    porLink[c.linkId] = (porLink[c.linkId] ?? 0) + 1;
  });

  let linkMaisClicado = '—';
  let maxCliques = 0;
  Object.entries(porLink).forEach(([id, total]) => {
    if (total > maxCliques) {
      maxCliques = total;
      linkMaisClicado = links.find((l) => l.id === id)?.title ?? id;
    }
  });

  const totalCliques = cliques.length;
  const totalVisitas = cliquesRecentes.length; // aproximação: cliques únicos recentes
  const taxaClique =
    totalVisitas > 0 ? ((totalCliques / totalVisitas) * 100).toFixed(1) : '0';

  const metricas = [
    { label: 'Visitas (30 dias)', valor: cliquesRecentes.length.toLocaleString('pt-BR') },
    { label: 'Total de cliques', valor: totalCliques.toLocaleString('pt-BR') },
    { label: 'Link mais clicado', valor: linkMaisClicado, pequeno: true },
    { label: 'Taxa de clique', valor: `${taxaClique}%` },
  ];

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Indicadores</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Dados de acesso da sua página de links
          </p>
        </div>
        <ExportButton cliques={cliques} links={links} username={username} />
      </div>

      {/* Cards de métricas */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {metricas.map((m) => (
          <Card key={m.label} className="border border-border shadow-sm">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{m.label}</p>
              <p
                className={`font-bold text-gray-900 mt-1 ${
                  m.pequeno ? 'text-sm truncate' : 'text-2xl'
                }`}
                title={m.valor}
              >
                {m.valor}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Gráficos */}
      {cliques.length === 0 ? (
        <Card className="border border-border shadow-sm">
          <CardContent className="py-16 text-center">
            <p className="text-muted-foreground text-sm">
              Nenhum clique registrado ainda. Compartilhe sua página para começar a ver dados!
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="border border-border shadow-sm">
          <CardContent className="p-5">
            <ClickChart cliques={cliques} links={links} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
