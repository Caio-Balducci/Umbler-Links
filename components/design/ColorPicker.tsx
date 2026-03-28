'use client';

import { HexColorPicker } from 'react-colorful';
import { useState, useRef, useEffect } from 'react';

interface ColorPickerProps {
  cor: string;
  onChange: (cor: string) => void;
  label?: string;
}

export function ColorPicker({ cor, onChange, label }: ColorPickerProps) {
  const [aberto, setAberto] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Fecha ao clicar fora
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setAberto(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="flex flex-col gap-1.5" ref={ref}>
      {label && <span className="text-xs font-medium text-gray-700">{label}</span>}
      <div className="relative">
        <button
          type="button"
          onClick={() => setAberto(!aberto)}
          className="flex items-center gap-2 rounded-lg border border-border px-2.5 py-1.5 hover:bg-gray-50 transition-colors"
          title={cor}
        >
          <span
            className="h-5 w-5 rounded border border-black/10 flex-shrink-0"
            style={{ backgroundColor: cor }}
          />
          <span className="text-xs font-mono text-gray-700">{cor}</span>
        </button>

        {aberto && (
          <div className="absolute z-50 top-full mt-1 left-0 shadow-lg rounded-xl overflow-hidden border border-border bg-white p-2">
            <HexColorPicker color={cor} onChange={onChange} />
            <input
              type="text"
              value={cor}
              onChange={(e) => /^#[0-9A-Fa-f]{0,6}$/.test(e.target.value) && onChange(e.target.value)}
              className="mt-2 w-full rounded border border-border px-2 py-1 text-xs font-mono outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        )}
      </div>
    </div>
  );
}
