'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { getUserClicks, getUserLinks, getUserVisits } from '@/lib/firestore';
import { ClickEvent, Link as LinkType, VisitEvent } from '@/types';
import { ClickChart } from '@/components/analytics/ClickChart';
import { ExportButton } from '@/components/analytics/ExportButton';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Timestamp } from 'firebase/firestore';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';

function toDate(ts: unknown): Date {
  if (ts instanceof Timestamp) return ts.toDate();
  if (ts && typeof (ts as { toDate?: () => Date }).toDate === 'function') {
    return (ts as { toDate: () => Date }).toDate();
  }
  if (typeof ts === 'string') return new Date(ts);
  return new Date();
}

// ── Tooltip com "?" ──────────────────────────────────────────────
function Tooltip({ texto }: { texto: string }) {
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  function calcularPos() {
    if (!btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    setPos({ top: rect.top - 8, left: rect.left + rect.width / 2 });
  }

  return (
    <div className="relative inline-flex">
      <button
        ref={btnRef}
        type="button"
        onMouseEnter={calcularPos}
        onMouseLeave={() => setPos(null)}
        onClick={() => (pos ? setPos(null) : calcularPos())}
        className="flex items-center justify-center h-4 w-4 rounded-full border border-gray-300 text-gray-400 hover:border-gray-400 hover:text-gray-500 transition-colors cursor-pointer"
        aria-label="Mais informações"
      >
        <span className="text-[9px] font-bold leading-none">?</span>
      </button>
      {pos && (
        <div
          className="fixed z-[9999] w-52 rounded-lg bg-gray-900 px-3 py-2 text-xs text-white shadow-xl pointer-events-none"
          style={{ top: pos.top, left: pos.left, transform: 'translate(-50%, -100%)' }}
        >
          {texto}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
        </div>
      )}
    </div>
  );
}

const TOOLTIPS = {
  visitas: 'Número de vezes que sua página foi aberta no período selecionado. Cada acesso conta como uma visita, independentemente de o visitante clicar em algum link.',
  cliques: 'Total de cliques em todos os seus links no período selecionado.',
  linkTop: 'O link que recebeu mais cliques no período selecionado.',
  taxa: 'Percentual de visitantes que clicaram em pelo menos um link no período selecionado. Calculado como: (cliques ÷ visitas) × 100.',
};

const PERIODOS = [
  { label: '7 dias', dias: 7 },
  { label: '30 dias', dias: 30 },
  { label: '90 dias', dias: 90 },
  { label: 'Personalizado', dias: -1 },
];

const DISPOSITIVOS = [
  { label: 'Todos', valor: 'todos' },
  { label: 'Mobile', valor: 'mobile' },
  { label: 'Desktop', valor: 'desktop' },
  { label: 'Tablet', valor: 'tablet' },
];

export default function PaginaIndicadores() {
  const [uid, setUid] = useState<string | null>(null);
  const [username, setUsername] = useState('');
  const [cliques, setCliques] = useState<ClickEvent[]>([]);
  const [visitas, setVisitas] = useState<VisitEvent[]>([]);
  const [links, setLinks] = useState<LinkType[]>([]);
  const [carregando, setCarregando] = useState(true);

  // Filtros
  const [periodoSelecionado, setPeriodoSelecionado] = useState(30);
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [dispositivo, setDispositivo] = useState('todos');

  useEffect(() => {
    const cancelar = onAuthStateChanged(auth, async (user) => {
      if (!user) return;
      setUid(user.uid);
      const [c, l, v] = await Promise.all([
        getUserClicks(user.uid),
        getUserLinks(user.uid),
        getUserVisits(user.uid),
      ]);
      setCliques(c);
      setLinks(l);
      setVisitas(v);
      if (c.length > 0) setUsername(c[0].username);
      setCarregando(false);
    });
    return () => cancelar();
  }, []);

  // Calcula intervalo de datas
  const { inicio, fim } = useMemo(() => {
    const agora = new Date();
    if (periodoSelecionado === -1) {
      return {
        inicio: dataInicio ? startOfDay(new Date(dataInicio + 'T00:00:00')) : new Date(0),
        fim: dataFim ? endOfDay(new Date(dataFim + 'T00:00:00')) : agora,
      };
    }
    return {
      inicio: startOfDay(subDays(agora, periodoSelecionado)),
      fim: agora,
    };
  }, [periodoSelecionado, dataInicio, dataFim]);

  // Dados filtrados
  const cliquesFiltrados = useMemo(() => {
    return cliques.filter((c) => {
      const d = toDate(c.timestamp);
      const passaData = d >= inicio && d <= fim;
      const passaDevice = dispositivo === 'todos' || c.device === dispositivo;
      return passaData && passaDevice;
    });
  }, [cliques, inicio, fim, dispositivo]);

  const visitasFiltradas = useMemo(() => {
    return visitas.filter((v) => {
      const d = toDate(v.timestamp);
      const passaData = d >= inicio && d <= fim;
      const passaDevice = dispositivo === 'todos' || v.device === dispositivo;
      return passaData && passaDevice;
    });
  }, [visitas, inicio, fim, dispositivo]);

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
  const porLink: Record<string, number> = {};
  cliquesFiltrados.forEach((c) => { porLink[c.linkId] = (porLink[c.linkId] ?? 0) + 1; });

  let linkMaisClicado = '—';
  let maxCliques = 0;
  Object.entries(porLink).forEach(([id, total]) => {
    if (total > maxCliques) {
      maxCliques = total;
      linkMaisClicado = links.find((l) => l.id === id)?.title ?? id;
    }
  });

  const totalVisitas = visitasFiltradas.length;
  const totalCliques = cliquesFiltrados.length;
  const taxaClique = totalVisitas > 0
    ? ((totalCliques / totalVisitas) * 100).toFixed(1)
    : '0';

  const metricas = [
    { label: 'Visitas', valor: totalVisitas.toLocaleString('pt-BR'), tooltip: TOOLTIPS.visitas },
    { label: 'Cliques', valor: totalCliques.toLocaleString('pt-BR'), tooltip: TOOLTIPS.cliques },
    { label: 'Link mais clicado', valor: linkMaisClicado, pequeno: true, tooltip: TOOLTIPS.linkTop },
    { label: 'Taxa de clique', valor: `${taxaClique}%`, tooltip: TOOLTIPS.taxa },
  ];

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Cabeçalho */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Indicadores</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Dados de acesso da sua página de links
        </p>
      </div>

      {/* Filtros + Exportar */}
      <div className="flex flex-col sm:flex-row sm:items-end gap-3 flex-wrap">
        {/* Período */}
        <div className="space-y-1">
          <p className="text-xs font-medium text-gray-500">Período</p>
          <div className="flex gap-1 flex-wrap">
            {PERIODOS.map((p) => (
              <button
                key={p.dias}
                onClick={() => setPeriodoSelecionado(p.dias)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                  periodoSelecionado === p.dias
                    ? 'bg-primary text-white'
                    : 'border border-border text-gray-600 hover:bg-gray-50'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
          {periodoSelecionado === -1 && (
            <div className="flex items-center gap-2 mt-1.5">
              <input
                type="date"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
                max={dataFim || format(new Date(), 'yyyy-MM-dd')}
                className="rounded-lg border border-border px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-primary"
              />
              <span className="text-xs text-gray-400">até</span>
              <input
                type="date"
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
                min={dataInicio}
                max={format(new Date(), 'yyyy-MM-dd')}
                className="rounded-lg border border-border px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          )}
        </div>

        {/* Dispositivo */}
        <div className="space-y-1">
          <p className="text-xs font-medium text-gray-500">Dispositivo</p>
          <div className="flex gap-1 flex-wrap">
            {DISPOSITIVOS.map((d) => (
              <button
                key={d.valor}
                onClick={() => setDispositivo(d.valor)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                  dispositivo === d.valor
                    ? 'bg-primary text-white'
                    : 'border border-border text-gray-600 hover:bg-gray-50'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        {/* Exportar — empurrado para a direita */}
        <div className="sm:ml-auto">
          <ExportButton cliques={cliquesFiltrados} links={links} username={username} />
        </div>
      </div>

      {/* Cards de métricas */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {metricas.map((m) => (
          <Card key={m.label} className="border border-border shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-1.5">
                <p className="text-xs text-muted-foreground">{m.label}</p>
                <Tooltip texto={m.tooltip} />
              </div>
              <p
                className={`font-bold text-gray-900 mt-1 ${m.pequeno ? 'text-sm truncate' : 'text-2xl'}`}
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
            <ClickChart cliques={cliquesFiltrados} links={links} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
