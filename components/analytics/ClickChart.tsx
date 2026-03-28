'use client';

import { useState } from 'react';
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
  return new Date();
}

export function ClickChart({ cliques, links }: ClickChartProps) {
  const [visao, setVisao] = useState<'barras' | 'pizza' | 'horarios'>('barras');

  const mapaLinks: Record<string, LinkType> = {};
  links.forEach((l) => (mapaLinks[l.id] = l));

  // ── Cliques por dia (últimos 7 dias) ──────────────────────────
  const dadosPorDia = Array.from({ length: 7 }, (_, i) => {
    const dia = subDays(new Date(), 6 - i);
    const inicio = startOfDay(dia).getTime();
    const fim = inicio + 86400000;
    const total = cliques.filter((c) => {
      const t = toDate(c.timestamp).getTime();
      return t >= inicio && t < fim;
    }).length;
    return { dia: format(dia, 'EEE', { locale: ptBR }), cliques: total };
  });

  // ── Distribuição por link ─────────────────────────────────────
  const porLink: Record<string, number> = {};
  cliques.forEach((c) => {
    porLink[c.linkId] = (porLink[c.linkId] ?? 0) + 1;
  });
  const dadosPizza = Object.entries(porLink)
    .map(([id, total]) => ({
      nome: mapaLinks[id]?.title ?? id,
      tipo: mapaLinks[id]?.type ?? 'website',
      total,
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 8);

  // ── Horários quentes (0–23) ───────────────────────────────────
  const porHora = Array.from({ length: 24 }, (_, h) => ({
    hora: `${String(h).padStart(2, '0')}h`,
    cliques: cliques.filter((c) => toDate(c.timestamp).getHours() === h).length,
  }));

  const cores = [
    '#6B2FD9','#8B4FF0','#E1306C','#1877F2','#25D366',
    '#FF0000','#0A66C2','#FF6719','#EA4335','#000000',
  ];

  return (
    <div className="space-y-4">
      {/* Seletor de visão */}
      <div className="flex gap-2 flex-wrap">
        {([['barras', 'Cliques por dia'], ['pizza', 'Por link'], ['horarios', 'Horários']] as const).map(([v, label]) => (
          <button
            key={v}
            onClick={() => setVisao(v)}
            className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-colors ${
              visao === v
                ? 'bg-primary text-primary-foreground'
                : 'border border-border text-gray-600 hover:bg-gray-50'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Gráfico */}
      <div className="h-60 w-full">
        {visao === 'barras' && (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dadosPorDia} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <XAxis dataKey="dia" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip
                formatter={(v) => [`${v} clique${v !== 1 ? 's' : ''}`, 'Total']}
                labelFormatter={(l) => `Dia: ${l}`}
              />
              <Bar dataKey="cliques" fill="#6B2FD9" radius={[4, 4, 0, 0]} />
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
                    fill={
                      entry.tipo !== 'personalizado'
                        ? PLATFORMS[entry.tipo as keyof typeof PLATFORMS]?.color ?? cores[i % cores.length]
                        : cores[i % cores.length]
                    }
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
            <BarChart data={porHora} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <XAxis
                dataKey="hora"
                tick={{ fontSize: 9 }}
                interval={3}
              />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip
                formatter={(v) => [`${v} clique${v !== 1 ? 's' : ''}`, '']}
                labelFormatter={(l) => `Horário: ${l}`}
              />
              <Bar dataKey="cliques" fill="#8B4FF0" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
