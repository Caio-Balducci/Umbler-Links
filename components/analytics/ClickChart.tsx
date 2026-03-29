'use client';

import { useState, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { ClickEvent, Link as LinkType } from '@/types';
import { PLATFORMS } from '@/lib/platforms';
import { format, subDays, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Timestamp } from 'firebase/firestore';

interface ClickChartProps {
  cliques: ClickEvent[];
  links: LinkType[];
}

function toDate(ts: unknown): Date {
  if (ts instanceof Timestamp) return ts.toDate();
  if (ts && typeof (ts as { toDate?: () => Date }).toDate === 'function') {
    return (ts as { toDate: () => Date }).toDate();
  }
  if (typeof ts === 'string') return new Date(ts);
  return new Date();
}

const CORES = [
  '#6B2FD9','#8B4FF0','#E1306C','#1877F2','#25D366',
  '#FF0000','#0A66C2','#FF6719','#EA4335','#000000',
];

function corDaPlataforma(tipo: string, index: number): string {
  if (tipo !== 'personalizado' && PLATFORMS[tipo as keyof typeof PLATFORMS]) {
    return PLATFORMS[tipo as keyof typeof PLATFORMS].color;
  }
  return CORES[index % CORES.length];
}

export function ClickChart({ cliques, links }: ClickChartProps) {
  const [visao, setVisao] = useState<'barras' | 'pizza' | 'horarios'>('barras');
  const [plataformaFiltro, setPlataformaFiltro] = useState<string>('todas');

  const mapaLinks: Record<string, LinkType> = {};
  links.forEach((l) => (mapaLinks[l.id] = l));

  // Lista de plataformas que têm cliques
  const plataformasComCliques = useMemo(() => {
    const tipos = new Set<string>();
    cliques.forEach((c) => {
      const tipo = mapaLinks[c.linkId]?.type ?? 'personalizado';
      tipos.add(tipo);
    });
    return Array.from(tipos);
  }, [cliques, mapaLinks]);

  // Cliques filtrados pela plataforma selecionada
  const cliquesFiltrados = useMemo(() => {
    if (plataformaFiltro === 'todas') return cliques;
    return cliques.filter((c) => (mapaLinks[c.linkId]?.type ?? 'personalizado') === plataformaFiltro);
  }, [cliques, plataformaFiltro, mapaLinks]);

  // ── Cliques por dia — separado por plataforma ─────────────────
  const { dadosPorDia, plataformasNoDia } = useMemo(() => {
    // Quais plataformas aparecem nos cliques filtrados (para as barras)
    const tipos = new Set<string>();
    cliquesFiltrados.forEach((c) => {
      tipos.add(mapaLinks[c.linkId]?.type ?? 'personalizado');
    });
    const plataformasNoDia = Array.from(tipos);

    const dadosPorDia = Array.from({ length: 7 }, (_, i) => {
      const dia = subDays(new Date(), 6 - i);
      const inicio = startOfDay(dia).getTime();
      const fim = inicio + 86400000;
      const cliquesdoDia = cliquesFiltrados.filter((c) => {
        const t = toDate(c.timestamp).getTime();
        return t >= inicio && t < fim;
      });

      const entrada: Record<string, number | string> = {
        dia: format(dia, 'EEE', { locale: ptBR }),
      };
      plataformasNoDia.forEach((tipo) => {
        entrada[tipo] = cliquesdoDia.filter(
          (c) => (mapaLinks[c.linkId]?.type ?? 'personalizado') === tipo
        ).length;
      });
      return entrada;
    });

    return { dadosPorDia, plataformasNoDia };
  }, [cliquesFiltrados, mapaLinks]);

  // ── Distribuição por link (pizza) ─────────────────────────────
  const dadosPizza = useMemo(() => {
    const porLink: Record<string, number> = {};
    cliques.forEach((c) => {
      porLink[c.linkId] = (porLink[c.linkId] ?? 0) + 1;
    });
    return Object.entries(porLink)
      .map(([id, total]) => ({
        nome: mapaLinks[id]?.title ?? id,
        tipo: mapaLinks[id]?.type ?? 'personalizado',
        total,
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 8);
  }, [cliques, mapaLinks]);

  // ── Horários quentes — separado por plataforma ────────────────
  const { dadosPorHora, plataformasNaHora } = useMemo(() => {
    const tipos = new Set<string>();
    cliquesFiltrados.forEach((c) => {
      tipos.add(mapaLinks[c.linkId]?.type ?? 'personalizado');
    });
    const plataformasNaHora = Array.from(tipos);

    const dadosPorHora = Array.from({ length: 24 }, (_, h) => {
      const cliquesNaHora = cliquesFiltrados.filter(
        (c) => toDate(c.timestamp).getHours() === h
      );
      const entrada: Record<string, number | string> = {
        hora: `${String(h).padStart(2, '0')}h`,
      };
      plataformasNaHora.forEach((tipo) => {
        entrada[tipo] = cliquesNaHora.filter(
          (c) => (mapaLinks[c.linkId]?.type ?? 'personalizado') === tipo
        ).length;
      });
      return entrada;
    });

    return { dadosPorHora, plataformasNaHora };
  }, [cliquesFiltrados, mapaLinks]);

  // Label legível da plataforma
  function labelPlataforma(tipo: string): string {
    if (tipo !== 'personalizado' && PLATFORMS[tipo as keyof typeof PLATFORMS]) {
      return PLATFORMS[tipo as keyof typeof PLATFORMS].label;
    }
    return 'Personalizado';
  }

  const mostrarFiltro = visao === 'barras' || visao === 'horarios';

  return (
    <div className="space-y-4">
      {/* Seletor de visão */}
      <div className="flex gap-2 flex-wrap">
        {([['barras', 'Cliques por dia da semana'], ['pizza', 'Por link'], ['horarios', 'Horários']] as const).map(([v, label]) => (
          <button
            key={v}
            onClick={() => setVisao(v)}
            className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-colors cursor-pointer ${
              visao === v
                ? 'bg-primary text-primary-foreground'
                : 'border border-border text-gray-600 hover:bg-gray-50'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Filtro por plataforma */}
      {mostrarFiltro && plataformasComCliques.length > 1 && (
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-xs text-muted-foreground font-medium">Plataforma:</span>
          <button
            onClick={() => setPlataformaFiltro('todas')}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors cursor-pointer ${
              plataformaFiltro === 'todas'
                ? 'bg-gray-800 text-white'
                : 'border border-border text-gray-600 hover:bg-gray-50'
            }`}
          >
            Todas
          </button>
          {plataformasComCliques.map((tipo) => (
            <button
              key={tipo}
              onClick={() => setPlataformaFiltro(tipo)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors cursor-pointer ${
                plataformaFiltro === tipo
                  ? 'text-white'
                  : 'border border-border text-gray-600 hover:bg-gray-50'
              }`}
              style={plataformaFiltro === tipo ? { backgroundColor: corDaPlataforma(tipo, 0) } : {}}
            >
              {labelPlataforma(tipo)}
            </button>
          ))}
        </div>
      )}

      {/* Gráfico */}
      <div className="h-60 w-full">
        {visao === 'barras' && (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dadosPorDia} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <XAxis dataKey="dia" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip
                formatter={(v, name) => [`${v} clique${v !== 1 ? 's' : ''}`, labelPlataforma(name as string)]}
                labelFormatter={(l) => `Dia: ${l}`}
              />
              {plataformasNoDia.length > 1 && (
                <Legend formatter={(v) => labelPlataforma(v)} />
              )}
              {plataformasNoDia.map((tipo, i) => (
                <Bar
                  key={tipo}
                  dataKey={tipo}
                  stackId="a"
                  fill={corDaPlataforma(tipo, i)}
                  radius={i === plataformasNoDia.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        )}

        {visao === 'pizza' && (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={dadosPizza}
                dataKey="total"
                nameKey="nome"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label={({ name, percent }) =>
                  `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
                }
                labelLine={false}
              >
                {dadosPizza.map((entry, i) => (
                  <Cell
                    key={entry.nome}
                    fill={corDaPlataforma(entry.tipo, i)}
                  />
                ))}
              </Pie>
              <Legend formatter={(v) => v} />
              <Tooltip formatter={(v) => [`${v} cliques`, '']} />
            </PieChart>
          </ResponsiveContainer>
        )}

        {visao === 'horarios' && (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dadosPorHora} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <XAxis dataKey="hora" tick={{ fontSize: 9 }} interval={3} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip
                formatter={(v, name) => [`${v} clique${v !== 1 ? 's' : ''}`, labelPlataforma(name as string)]}
                labelFormatter={(l) => `Horário: ${l}`}
              />
              {plataformasNaHora.length > 1 && (
                <Legend formatter={(v) => labelPlataforma(v)} />
              )}
              {plataformasNaHora.map((tipo, i) => (
                <Bar
                  key={tipo}
                  dataKey={tipo}
                  stackId="a"
                  fill={corDaPlataforma(tipo, i)}
                  radius={i === plataformasNaHora.length - 1 ? [3, 3, 0, 0] : [0, 0, 0, 0]}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
