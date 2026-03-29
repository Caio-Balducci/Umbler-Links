'use client';

import { useState } from 'react';
import * as XLSX from 'xlsx';
import { ClickEvent, Link as LinkType } from '@/types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Timestamp } from 'firebase/firestore';

const PROMPT_IA = `Atue como um Especialista em Growth Marketing e Analista de Dados Sênior.

Contexto: Eu possuo um aplicativo de "Link in Bio" e estou te fornecendo um relatório de cliques detalhado (em anexo). Este relatório contém colunas de Data, Horário, Link de Destino e Dispositivo.

Sua Missão: Analisar os microdados deste relatório para criar um Plano de Ação de Marketing Estratégico focado em aumentar a conversão e otimizar minha presença digital.

Por favor, estruture sua resposta nos seguintes tópicos:

1. Diagnóstico de Comportamento (Análise de Dados)
Identificação de Padrões Temporais: Quais são os dias e horários de "pico de ouro" onde o público está mais propenso a clicar?

Análise de Preferência de Canal: Com base na contagem de cliques, qual destino (YouTube, Instagram, Site, etc.) é a nossa maior "âncora" de tráfego e qual está subperformando?

Perfil Tecnológico: O que a predominância de tipos de dispositivos (Desktop vs. Mobile) diz sobre o contexto em que meu usuário consome meu conteúdo?

2. Plano de Ação Estratégico (O que fazer agora)
Otimização de Layout: Com base nos cliques, como devo reordenar meus links para maximizar o CTR (Taxa de Clique)?

Estratégia de Conteúdo (Timing): Sugira um cronograma de postagens nas redes sociais para "surfar" nos horários de maior atividade detectados na planilha.

Estratégia de Conversão: Para os links menos clicados, sugira mudanças de "Copy" (texto do botão) ou incentivos para aumentar o interesse.

3. Sugestão de Teste A/B
Proponha um experimento prático para a próxima semana (ex: mudar o nome de um botão ou trocar a posição de dois links) e como mediremos o sucesso através do próximo relatório.

Instrução Adicional: Seja crítico. Se os dados mostrarem que estou perdendo tráfego em algum canal, aponte isso claramente. Use uma linguagem profissional, estratégica e focada em resultados (ROI e Conversão).`;

interface ExportButtonProps {
  cliques: ClickEvent[];
  links: LinkType[];
  username: string;
}

export function ExportButton({ cliques, links, username }: ExportButtonProps) {
  const [modalAberto, setModalAberto] = useState(false);
  const [copiado, setCopiado] = useState(false);

  function exportar() {
    const mapaLinks: Record<string, string> = {};
    links.forEach((l) => (mapaLinks[l.id] = l.title));

    const linhas = cliques.map((c) => {
      const ts = c.timestamp as unknown as Timestamp;
      const data = ts?.toDate ? ts.toDate() : new Date();
      return {
        Data: format(data, 'dd/MM/yyyy', { locale: ptBR }),
        Horário: format(data, 'HH:mm', { locale: ptBR }),
        Link: mapaLinks[c.linkId] ?? c.linkId,
        Dispositivo: c.device,
        País: c.country ?? '—',
      };
    });

    const planilha = XLSX.utils.json_to_sheet(linhas);
    const pasta = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(pasta, planilha, 'Cliques');

    const dataHoje = format(new Date(), 'yyyy-MM-dd');
    XLSX.writeFile(pasta, `umbler-link-relatorio-${username}-${dataHoje}.xlsx`);

    setModalAberto(true);
  }

  async function copiarPrompt() {
    await navigator.clipboard.writeText(PROMPT_IA);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  }

  function baixarPrompt() {
    const blob = new Blob([PROMPT_IA], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'prompt-analise-ia.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <>
      <button
        onClick={exportar}
        className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
      >
        <IconePlanilha className="h-4 w-4" />
        Exportar planilha
      </button>

      {modalAberto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
          onClick={(e) => { if (e.target === e.currentTarget) setModalAberto(false); }}
        >
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 space-y-5">
            {/* Cabeçalho */}
            <div className="relative">
              <button
                onClick={() => setModalAberto(false)}
                className="absolute -top-1 -right-1 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                aria-label="Fechar"
              >
                <IconeX className="h-5 w-5" />
              </button>
              <div className="flex items-center gap-2 mb-2 pr-6">
                <span className="text-xl">✅</span>
                <h2 className="text-base font-bold text-gray-900">
                  Relatório exportado com sucesso!
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
                Um <span className="font-semibold">prompt especializado em Growth Marketing</span> está
                pronto para ser usado. Copie ou baixe para começar sua análise.
              </p>
            </div>

            {/* Botões */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={copiarPrompt}
                className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary/90 transition-colors cursor-pointer whitespace-nowrap"
              >
                {copiado ? (
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
                onClick={baixarPrompt}
                className="flex-1 flex items-center justify-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <IconeDownload className="h-4 w-4" />
                Baixar prompt
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function IconePlanilha({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
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
