'use client';

import * as XLSX from 'xlsx';
import { ClickEvent, Link as LinkType } from '@/types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Timestamp } from 'firebase/firestore';

interface ExportButtonProps {
  cliques: ClickEvent[];
  links: LinkType[];
  username: string;
}

export function ExportButton({ cliques, links, username }: ExportButtonProps) {
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
  }

  return (
    <button
      onClick={exportar}
      className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
    >
      <IconePlanilha className="h-4 w-4" />
      Exportar planilha
    </button>
  );
}

function IconePlanilha({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}
