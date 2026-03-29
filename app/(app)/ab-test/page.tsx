'use client';

import { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import {
  getUserProfile,
  saveUserProfile,
  getUserLinks,
  updateLink,
  getUserClicks,
  adicionarHistoricoAbTest,
} from '@/lib/firestore';
import { Link as LinkType, ClickEvent, AbTestRun } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Timestamp } from 'firebase/firestore';
import * as XLSX from 'xlsx';

function toDate(ts: unknown): Date {
  if (ts instanceof Timestamp) return ts.toDate();
  if (ts && typeof (ts as { toDate?: () => Date }).toDate === 'function') {
    return (ts as { toDate: () => Date }).toDate();
  }
  if (typeof ts === 'string') return new Date(ts);
  return new Date();
}

function gerarId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

const PROMPT_AB_IA = `Atue como um Especialista em CRO (Conversion Rate Optimization) e Copywriter Sênior.

Contexto: Estou te enviando um relatório de um Teste A/B de Títulos realizado em um aplicativo de links (Link in Bio). O objetivo é entender qual variação de texto gerou maior engajamento e conversão.

Sua Missão: Analisar os dados em anexo, declarar um vencedor com base em métricas de performance e traçar os próximos passos estratégicos.

Por favor, estruture sua resposta nos seguintes tópicos:

1. Veredito de Performance
Análise de Vencedor: Com base no número de visualizações e cliques, qual versão (A ou B) teve a melhor Taxa de Cliques (CTR)?

Significância: A diferença entre os resultados é grande o suficiente para ser uma tendência real ou foi um empate técnico?

2. Engenharia Reversa do Título (Psicologia)
Gatilho Identificado: Qual gatilho mental estava presente no título vencedor? (Ex: Urgência, Escassez, Curiosidade, Pertencimento, Autoridade).

Perfil do Público: O que o sucesso deste título específico revela sobre os desejos e medos do meu público durante um evento como a Copa do Mundo?

3. Plano de Ação Imediato
Escalabilidade: Como posso replicar a "fórmula" desse título vencedor em outros canais (Legendas de Instagram, Assuntos de E-mail ou Anúncios)?

Otimização de Layout: Sugira se o título vencedor deve ser fixado no topo da página ou se deve ser acompanhado de algum elemento visual (emoji ou ícone) para potencializar o resultado.

4. Roadmaps de Novos Testes A/B (Sugestões)
Sugestão 1 (Atrito): Um teste comparando o título vencedor contra uma versão ainda mais curta e direta.

Sugestão 2 (Benefício vs. Curiosidade): Um teste comparando um título focado em "Ganho/Desconto" contra um focado em "Segredo/Exclusividade".

Sugestão 3 (Personalização): Um teste usando algo mais especifico vs. um título mais geral.

Instrução Adicional: Seja extremamente analítico. Não se limite a dizer quem ganhou, mas explique POR QUE as palavras escolhidas funcionaram melhor naquele contexto. Use uma linguagem focada em conversão e crescimento de métricas.`;

type Aba = 'configuracao' | 'relatorios';

interface AbTestAtivo {
  runId: string;
  nome: string;
  inicioEm: string;
  desativarEm: string;
}

// Calcula stats de um teste para cada link — filtra por runId (confiável) com fallback por timestamp
function calcularStats(
  run: AbTestRun,
  links: LinkType[],
  cliques: ClickEvent[]
) {
  return links.map((link) => {
    const doLink = cliques.filter((c) => {
      if (c.linkId !== link.id) return false;
      // Filtra por runId quando disponível (cliques novos)
      if (c.abTestRunId) return c.abTestRunId === run.id;
      // Fallback por timestamp para cliques antigos sem runId
      const t = toDate(c.timestamp);
      const inicio = new Date(run.inicioEm);
      const fim = new Date(run.fimEm);
      return t >= inicio && t <= fim;
    });
    const varA = doLink.filter((c) => c.variant === 'A' || !c.variant).length;
    const varB = doLink.filter((c) => c.variant === 'B').length;
    const total = varA + varB;
    return {
      link,
      varA,
      varB,
      total,
      pctA: total > 0 ? Math.round((varA / total) * 100) : 0,
      pctB: total > 0 ? Math.round((varB / total) * 100) : 0,
    };
  });
}

function exportarXLSX(run: AbTestRun, links: LinkType[], cliques: ClickEvent[]) {
  const stats = calcularStats(run, links, cliques);
  const linhas = stats.map(({ link, varA, varB, pctA, pctB }) => ({
    'Link': link.title,
    'Título A': link.title,
    'Cliques A': varA,
    '% A': `${pctA}%`,
    'Título B': link.titleB || link.title,
    'Cliques B': varB,
    '% B': `${pctB}%`,
    'Vencedor': varA > varB ? 'Variante A' : varB > varA ? 'Variante B' : 'Empate',
  }));

  const ws = XLSX.utils.json_to_sheet(linhas);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Resultado');
  const nomeArquivo = `ab-test-${run.nome.replace(/\s+/g, '-')}-${format(new Date(run.fimEm), 'yyyy-MM-dd')}.xlsx`;
  XLSX.writeFile(wb, nomeArquivo);
}

export default function PaginaAbTest() {
  const [uid, setUid] = useState<string | null>(null);
  const [links, setLinks] = useState<LinkType[]>([]);
  const [cliques, setCliques] = useState<ClickEvent[]>([]);
  const [carregandoCliques, setCarregandoCliques] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [aba, setAba] = useState<Aba>('configuracao');
  const [confirmandoDeletar, setConfirmandoDeletar] = useState(false);
  const [modalExportAberto, setModalExportAberto] = useState(false);
  const [promptCopiado, setPromptCopiado] = useState(false);
  const [abaRelatorio, setAbaRelatorio] = useState<string | null>(null);
  const [alertaTesteEncerrado, setAlertaTesteEncerrado] = useState<string | null>(null);

  // Estado do teste ativo
  const [testeAtivo, setTesteAtivo] = useState<AbTestAtivo | null>(null);
  const [historico, setHistorico] = useState<AbTestRun[]>([]);

  // Formulário de novo teste
  const [nomeNovo, setNomeNovo] = useState('');
  const [inicioData, setInicioData] = useState('');
  const [inicioHora, setInicioHora] = useState('');
  const [fimData, setFimData] = useState('');
  const [fimHora, setFimHora] = useState('');
  const [salvando, setSalvando] = useState(false);

  // Títulos B
  const [titulosB, setTitulosB] = useState<Record<string, string>>({});
  const [salvandoTitulos, setSalvandoTitulos] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const cancelar = onAuthStateChanged(auth, async (user) => {
      if (!user) return;
      setUid(user.uid);
      const [perfil, ls, cs] = await Promise.all([
        getUserProfile(user.uid),
        getUserLinks(user.uid),
        getUserClicks(user.uid),
      ]);
      setLinks(ls);
      setCliques(cs);

      const hist = perfil?.abTestHistorico ?? [];
      setHistorico(hist);
      if (hist.length > 0) setAbaRelatorio(hist[hist.length - 1].id);

      // Verifica se o teste ativo expirou
      const ab = perfil?.abTest;
      if (ab?.ativo && ab.desativarEm && new Date() >= new Date(ab.desativarEm)) {
        // Auto-encerra — usa o runId salvo para que os cliques já tagueados sejam encontrados
        const run: AbTestRun = {
          id: ab.runId ?? gerarId(),
          nome: ab.nome ?? 'Teste sem nome',
          inicioEm: ab.inicioEm ?? ab.desativarEm,
          fimEm: ab.desativarEm,
        };
        const novoHist = [...hist, run];
        await Promise.all([
          saveUserProfile(user.uid, { abTest: { ativo: false } }),
          adicionarHistoricoAbTest(user.uid, run),
        ]);
        setHistorico(novoHist);
        setAbaRelatorio(run.id);
        setTesteAtivo(null);
        setAlertaTesteEncerrado(run.nome);
      } else if (ab?.ativo && ab.runId && ab.nome && ab.inicioEm && ab.desativarEm) {
        setTesteAtivo({ runId: ab.runId, nome: ab.nome, inicioEm: ab.inicioEm, desativarEm: ab.desativarEm });
      }

      const tb: Record<string, string> = {};
      ls.forEach((l) => { tb[l.id] = l.titleB ?? ''; });
      setTitulosB(tb);
      setCarregando(false);
    });
    return () => cancelar();
  }, []);

  async function recarregarCliques() {
    if (!uid) return;
    setCarregandoCliques(true);
    const cs = await getUserClicks(uid);
    setCliques(cs);
    setCarregandoCliques(false);
  }

  async function iniciarTeste() {
    if (!uid || !nomeNovo || !inicioData || !fimData) return;
    setSalvando(true);
    // inicioEm: usa o momento atual se a data configurada já passou
    const inicioConfigurado = new Date(`${inicioData}T${inicioHora || '00:00'}:00`);
    const inicioIso = inicioConfigurado <= new Date() ? new Date().toISOString() : inicioConfigurado.toISOString();
    const fimIso = new Date(`${fimData}T${fimHora || '23:59'}:00`).toISOString();
    // runId único identifica este teste — usado para taguear cliques durante o período
    const runId = gerarId();
    await saveUserProfile(uid, {
      abTest: { ativo: true, runId, nome: nomeNovo, inicioEm: inicioIso, desativarEm: fimIso },
    });
    setTesteAtivo({ runId, nome: nomeNovo, inicioEm: inicioIso, desativarEm: fimIso });
    setNomeNovo(''); setInicioData(''); setInicioHora(''); setFimData(''); setFimHora('');
    setSalvando(false);
  }

  async function encerrarTeste() {
    if (!uid || !testeAtivo) return;
    setSalvando(true);
    const fimEm = new Date().toISOString();
    // Usa o mesmo runId do teste ativo para que os cliques já tagueados sejam encontrados no relatório
    const run: AbTestRun = {
      id: testeAtivo.runId,
      nome: testeAtivo.nome,
      inicioEm: testeAtivo.inicioEm,
      fimEm,
    };
    const novoHist = [...historico, run];
    await Promise.all([
      saveUserProfile(uid, { abTest: { ativo: false } }),
      adicionarHistoricoAbTest(uid, run),
    ]);
    setHistorico(novoHist);
    setAbaRelatorio(run.id);
    setTesteAtivo(null);
    setAlertaTesteEncerrado(run.nome);
    setSalvando(false);
    // Recarrega cliques para garantir dados atualizados no relatório
    await recarregarCliques();
  }

  async function deletarRelatorio(runId: string) {
    if (!uid) return;
    const novoHist = historico.filter((r) => r.id !== runId);
    await saveUserProfile(uid, { abTestHistorico: novoHist });
    setHistorico(novoHist);
    setAbaRelatorio(novoHist.length > 0 ? novoHist[novoHist.length - 1].id : null);
    setConfirmandoDeletar(false);
  }

  async function salvarTituloB(linkId: string) {
    if (!uid) return;
    setSalvandoTitulos((p) => ({ ...p, [linkId]: true }));
    await updateLink(uid, linkId, { titleB: titulosB[linkId] || undefined });
    setSalvandoTitulos((p) => ({ ...p, [linkId]: false }));
  }

  async function copiarPromptAb() {
    await navigator.clipboard.writeText(PROMPT_AB_IA);
    setPromptCopiado(true);
    setTimeout(() => setPromptCopiado(false), 2000);
  }

  function baixarPromptAb() {
    const blob = new Blob([PROMPT_AB_IA], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'prompt-analise-ab-ia.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  const hoje = format(new Date(), 'yyyy-MM-dd');
  const agoraHora = format(new Date(), 'HH:mm');

  if (carregando) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-32 rounded-xl" />
        <Skeleton className="h-48 rounded-xl" />
      </div>
    );
  }

  const runSelecionado = historico.find((r) => r.id === abaRelatorio) ?? null;

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-2xl">
      {/* Cabeçalho */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Teste A/B</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Teste títulos alternativos para seus links e descubra quais convertem mais
        </p>
      </div>

      {/* Alerta de teste encerrado */}
      {alertaTesteEncerrado && (
        <div className="flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3">
          <span className="text-green-600 text-lg">✓</span>
          <div className="flex-1">
            <p className="text-sm font-medium text-green-800">
              Teste &ldquo;{alertaTesteEncerrado}&rdquo; encerrado
            </p>
            <p className="text-xs text-green-700 mt-0.5">
              O relatório foi salvo e está disponível na aba{' '}
              <button
                onClick={() => { setAba('relatorios'); setAlertaTesteEncerrado(null); }}
                className="font-semibold underline cursor-pointer"
              >
                Relatórios
              </button>.
            </p>
          </div>
          <button
            onClick={() => setAlertaTesteEncerrado(null)}
            className="text-green-500 hover:text-green-700 cursor-pointer text-lg leading-none"
          >
            ×
          </button>
        </div>
      )}

      {/* Abas */}
      <div className="flex gap-1 border-b border-border">
        {([['configuracao', 'Configuração'], ['relatorios', 'Relatórios']] as const).map(([v, label]) => (
          <button
            key={v}
            onClick={() => { setAba(v); if (v === 'relatorios') recarregarCliques(); }}
            className={`px-4 py-2 text-sm font-medium transition-colors cursor-pointer border-b-2 -mb-px ${
              aba === v ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {label}
            {v === 'relatorios' && historico.length > 0 && (
              <span className="ml-1.5 text-[10px] bg-primary/10 text-primary font-bold px-1.5 py-0.5 rounded-full">
                {historico.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Aba Configuração ─────────────────────────────────────── */}
      {aba === 'configuracao' && (
        <div className="space-y-5">
          {testeAtivo ? (
            /* Teste em andamento */
            <Card className="border border-primary/30 bg-primary/5 shadow-sm">
              <CardContent className="p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                      <p className="text-sm font-bold text-gray-900">{testeAtivo.nome}</p>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(new Date(testeAtivo.inicioEm), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      {' → '}
                      {format(new Date(testeAtivo.desativarEm), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                  <span className="text-xs bg-green-100 text-green-700 font-medium px-2 py-1 rounded-full">Em andamento</span>
                </div>
                <button
                  onClick={encerrarTeste}
                  disabled={salvando}
                  className="w-full rounded-lg border border-red-200 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors cursor-pointer disabled:opacity-50"
                >
                  {salvando ? 'Encerrando...' : 'Encerrar teste agora'}
                </button>
              </CardContent>
            </Card>
          ) : (
            /* Formulário de novo teste */
            <Card className="border border-border shadow-sm">
              <CardContent className="p-5 space-y-4">
                <p className="text-sm font-semibold text-gray-900">Criar novo teste A/B</p>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-gray-700">Nome do teste</label>
                  <input
                    value={nomeNovo}
                    onChange={(e) => setNomeNovo(e.target.value)}
                    placeholder="Ex: Teste de CTA — Março 2025"
                    className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-gray-700">Data de início</label>
                    <input
                      type="date"
                      value={inicioData}
                      onChange={(e) => setInicioData(e.target.value)}
                      min={hoje}
                      className="w-full rounded-lg border border-border px-2.5 py-2 text-sm outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-gray-700">Hora de início</label>
                    <input
                      type="time"
                      value={inicioHora}
                      onChange={(e) => setInicioHora(e.target.value)}
                      className="w-full rounded-lg border border-border px-2.5 py-2 text-sm outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-gray-700">Data de término</label>
                    <input
                      type="date"
                      value={fimData}
                      onChange={(e) => setFimData(e.target.value)}
                      min={inicioData || hoje}
                      className="w-full rounded-lg border border-border px-2.5 py-2 text-sm outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-gray-700">Hora de término</label>
                    <input
                      type="time"
                      value={fimHora}
                      onChange={(e) => setFimHora(e.target.value)}
                      className="w-full rounded-lg border border-border px-2.5 py-2 text-sm outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                    />
                  </div>
                </div>

                {inicioData && fimData && (
                  <p className="text-[11px] text-muted-foreground">
                    Duração: {format(new Date(`${inicioData}T${inicioHora || '00:00'}:00`), "dd/MM 'às' HH:mm", { locale: ptBR })}
                    {' até '}
                    {format(new Date(`${fimData}T${fimHora || '23:59'}:00`), "dd/MM 'às' HH:mm", { locale: ptBR })}
                  </p>
                )}

                <button
                  onClick={iniciarTeste}
                  disabled={salvando || !nomeNovo || !inicioData || !fimData}
                  className="w-full rounded-lg bg-primary py-2.5 text-sm font-medium text-white hover:bg-primary/90 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {salvando ? 'Ativando...' : 'Ativar teste A/B'}
                </button>
              </CardContent>
            </Card>
          )}

          {/* Títulos B */}
          <div className="space-y-3">
            <div>
              <p className="text-sm font-semibold text-gray-900">Títulos alternativos (Variante B)</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Deixe em branco para usar o mesmo título em ambas as variantes
              </p>
            </div>
            {links.length === 0 ? (
              <Card className="border border-border shadow-sm">
                <CardContent className="py-10 text-center text-sm text-muted-foreground">
                  Nenhum link adicionado ainda
                </CardContent>
              </Card>
            ) : (
              links.map((link) => (
                <Card key={link.id} className="border border-border shadow-sm">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs bg-primary/10 text-primary font-bold px-2 py-0.5 rounded-full">A</span>
                      <p className="text-sm font-medium text-gray-900">{link.title}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs bg-gray-100 text-gray-600 font-bold px-2 py-0.5 rounded-full">B</span>
                      <input
                        value={titulosB[link.id] ?? ''}
                        onChange={(e) => setTitulosB((p) => ({ ...p, [link.id]: e.target.value }))}
                        onBlur={() => salvarTituloB(link.id)}
                        placeholder={`Título alternativo para "${link.title}"`}
                        className="flex-1 text-sm bg-transparent border-b border-transparent hover:border-border focus:border-primary outline-none pb-0.5 transition-colors text-gray-700"
                      />
                      {salvandoTitulos[link.id] && (
                        <span className="text-[10px] text-muted-foreground">Salvando...</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      )}

      {/* ── Aba Relatórios ──────────────────────────────────────── */}
      {aba === 'relatorios' && (
        <div className="space-y-4">
          {carregandoCliques && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="h-3.5 w-3.5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
              Atualizando dados...
            </div>
          )}
          {historico.length === 0 ? (
            <Card className="border border-border shadow-sm">
              <CardContent className="py-16 text-center">
                <p className="text-muted-foreground text-sm">
                  Nenhum teste A/B encerrado ainda. Crie e conclua um teste para ver os relatórios.
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Sub-abas por teste */}
              <div className="flex gap-1 flex-wrap border-b border-border">
                {historico.map((run) => (
                  <button
                    key={run.id}
                    onClick={() => setAbaRelatorio(run.id)}
                    className={`px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer border-b-2 -mb-px ${
                      abaRelatorio === run.id
                        ? 'border-primary text-primary'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {run.nome}
                  </button>
                ))}
              </div>

              {runSelecionado && (() => {
                const stats = calcularStats(runSelecionado, links, cliques);
                const totalA = stats.reduce((s, r) => s + r.varA, 0);
                const totalB = stats.reduce((s, r) => s + r.varB, 0);
                const grandTotal = totalA + totalB;

                return (
                  <div className="space-y-4">
                    {/* Info do teste */}
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(runSelecionado.inicioEm), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                          {' → '}
                          {format(new Date(runSelecionado.fimEm), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => { exportarXLSX(runSelecionado, links, cliques); setModalExportAberto(true); }}
                          className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
                        >
                          <IconePlanilha className="h-3.5 w-3.5" />
                          Exportar XLSX
                        </button>
                        <button
                          onClick={() => setConfirmandoDeletar(true)}
                          className="flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50 hover:border-red-300 transition-colors cursor-pointer"
                        >
                          <IconeLixeira className="h-3.5 w-3.5" />
                          Deletar
                        </button>
                      </div>
                    </div>

                    {/* Totais */}
                    <div className="grid grid-cols-2 gap-3">
                      {(['A', 'B'] as const).map((v) => {
                        const total = v === 'A' ? totalA : totalB;
                        const pct = grandTotal > 0 ? Math.round((total / grandTotal) * 100) : 0;
                        const vencedor = (v === 'A' && totalA > totalB) || (v === 'B' && totalB > totalA);
                        return (
                          <Card key={v} className={`border shadow-sm ${vencedor ? 'border-yellow-300 bg-yellow-50' : 'border-border'}`}>
                            <CardContent className="p-4">
                              <div className="flex items-center gap-2 mb-1">
                                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${v === 'A' ? 'bg-primary/10 text-primary' : 'bg-gray-100 text-gray-600'}`}>
                                  Variante {v}
                                </span>
                                {vencedor && <span title="Vencedor">🏆</span>}
                              </div>
                              <p className="text-2xl font-bold text-gray-900">{total}</p>
                              <p className="text-xs text-muted-foreground">cliques · {pct}% do total</p>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>

                    {/* Por link */}
                    <div className="space-y-3">
                      {stats.filter((s) => s.link.titleB || s.total > 0).map(({ link, varA, varB, total, pctA, pctB }) => {
                        const venceA = varA > varB;
                        const venceB = varB > varA;
                        return (
                          <Card key={link.id} className="border border-border shadow-sm">
                            <CardContent className="p-4 space-y-3">
                              <p className="text-sm font-semibold text-gray-800">{link.title}</p>

                              {/* Variante A */}
                              <div className="space-y-1">
                                <div className="flex items-center justify-between text-xs">
                                  <div className="flex items-center gap-1.5">
                                    <span className="bg-primary/10 text-primary font-bold px-1.5 py-0.5 rounded-full">A</span>
                                    <span className="text-gray-700">{link.title}</span>
                                    {venceA && <span title="Vencedor" className="text-yellow-500">🏆</span>}
                                  </div>
                                  <span className="font-medium text-gray-900">{varA} cliques · {pctA}%</span>
                                </div>
                                <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                                  <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pctA}%` }} />
                                </div>
                              </div>

                              {/* Variante B */}
                              <div className="space-y-1">
                                <div className="flex items-center justify-between text-xs">
                                  <div className="flex items-center gap-1.5">
                                    <span className="bg-gray-100 text-gray-600 font-bold px-1.5 py-0.5 rounded-full">B</span>
                                    <span className="text-gray-700">{link.titleB || link.title}</span>
                                    {venceB && <span title="Vencedor" className="text-yellow-500">🏆</span>}
                                  </div>
                                  <span className="font-medium text-gray-900">{varB} cliques · {pctB}%</span>
                                </div>
                                <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                                  <div className="h-full bg-gray-400 rounded-full transition-all" style={{ width: `${pctB}%` }} />
                                </div>
                              </div>

                              <p className="text-[11px] text-muted-foreground">{total} cliques totais no período</p>
                            </CardContent>
                          </Card>
                        );
                      })}
                      {stats.every((s) => !s.link.titleB && s.total === 0) && (
                        <p className="text-sm text-muted-foreground text-center py-6">
                          Nenhum clique registrado neste período de teste.
                        </p>
                      )}
                    </div>
                  </div>
                );
              })()}
            </>
          )}
        </div>
      )}

      {/* Modal de exportação com prompt IA */}
      {modalExportAberto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
          onClick={(e) => { if (e.target === e.currentTarget) setModalExportAberto(false); }}
        >
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 space-y-5">
            {/* Cabeçalho */}
            <div className="relative">
              <button
                onClick={() => setModalExportAberto(false)}
                className="absolute -top-1 -right-1 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                aria-label="Fechar"
              >
                <IconeX className="h-5 w-5" />
              </button>
              <div className="flex items-center gap-2 mb-2 pr-6">
                <span className="text-xl">✅</span>
                <h2 className="text-base font-bold text-gray-900">
                  Relatório do teste A/B exportado com sucesso!
                </h2>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">
                Quer ir além dos números? Você sabia que pode usar{' '}
                <span className="font-semibold text-gray-800">Inteligência Artificial</span>{' '}
                para analisar esses dados de forma avançada? Junto com o seu arquivo,
                disponibilizamos um comando (prompt) pronto. Basta anexar a sua planilha baixada
                na sua IA favorita (como{' '}
                <span className="font-semibold text-gray-800">Gemini ou ChatGPT</span>), colar o
                prompt e descobrir insights valiosos e planos de ação práticos para o seu projeto.
              </p>
            </div>

            {/* Bloco de destaque */}
            <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 flex items-center gap-3">
              <span className="text-2xl">🤖</span>
              <p className="text-xs text-gray-700 leading-relaxed">
                Um <span className="font-semibold">prompt especializado em CRO e Copywriting</span> está
                pronto para ser usado. Copie ou baixe para começar sua análise.
              </p>
            </div>

            {/* Botões */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={copiarPromptAb}
                className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary/90 transition-colors cursor-pointer whitespace-nowrap"
              >
                {promptCopiado ? (
                  <>
                    <IconeCheck className="h-4 w-4" />
                    Copiado!
                  </>
                ) : (
                  <>
                    <IconeCopiar className="h-4 w-4" />
                    Copiar prompt para IA
                  </>
                )}
              </button>
              <button
                onClick={baixarPromptAb}
                className="flex-1 flex items-center justify-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer whitespace-nowrap"
              >
                <IconeDownload className="h-4 w-4" />
                Baixar prompt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmação de exclusão */}
      {confirmandoDeletar && runSelecionado && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
          onClick={(e) => { if (e.target === e.currentTarget) setConfirmandoDeletar(false); }}
        >
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-red-100">
                <IconeLixeira className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-gray-900">Deletar relatório</h2>
                <p className="mt-1 text-sm text-gray-600">
                  Deseja deletar o relatório <span className="font-semibold">&ldquo;{runSelecionado.nome}&rdquo;</span>? Esta ação não pode ser desfeita.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmandoDeletar(false)}
                className="flex-1 rounded-lg border border-border py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={() => deletarRelatorio(runSelecionado.id)}
                className="flex-1 rounded-lg bg-red-600 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors cursor-pointer"
              >
                Deletar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function IconeX({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function IconeCopiar({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  );
}

function IconeCheck({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

function IconeDownload({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
  );
}

function IconePlanilha({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}

function IconeLixeira({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0 1 16.138 21H7.862a2 2 0 0 1-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v3M4 7h16" />
    </svg>
  );
}
