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
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Fecha ao clicar fora
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        btnRef.current &&
        !btnRef.current.contains(e.target as Node)
      ) {
        setAberto(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Recalcula posição ao rolar ou redimensionar
  useEffect(() => {
    if (!aberto) return;
    function update() {
      if (!btnRef.current || !popoverRef.current) return;
      const rect = btnRef.current.getBoundingClientRect();
      const popH = popoverRef.current.offsetHeight;
      setPos({
        top: rect.top - popH - 6,
        left: rect.left,
      });
    }
    update();
    window.addEventListener('scroll', update, true);
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update, true);
      window.removeEventListener('resize', update);
    };
  }, [aberto]);

  function toggle() {
    if (!aberto && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      // Estimativa antes de montar — ajuste fino feito pelo useEffect após render
      setPos({ top: rect.top - 240, left: rect.left });
    }
    setAberto((v) => !v);
  }

  return (
    <div className="flex flex-col gap-1.5">
      {label && <span className="text-xs font-medium text-gray-700">{label}</span>}
      <button
        ref={btnRef}
        type="button"
        onClick={toggle}
        className="flex items-center gap-2 rounded-lg border border-border px-2.5 py-1.5 hover:bg-gray-50 transition-colors cursor-pointer"
        title={cor}
      >
        <span
          className="h-5 w-5 rounded border border-black/10 flex-shrink-0"
          style={{ backgroundColor: cor }}
        />
        <span className="text-xs font-mono text-gray-700">{cor}</span>
      </button>

      {aberto && (
        <div
          ref={popoverRef}
          className="fixed z-[9999] shadow-xl rounded-xl overflow-hidden border border-border bg-white p-2"
          style={{ top: pos.top, left: pos.left }}
        >
          <HexColorPicker color={cor} onChange={onChange} />
          <input
            type="text"
            value={cor}
            onChange={(e) =>
              /^#[0-9A-Fa-f]{0,6}$/.test(e.target.value) && onChange(e.target.value)
            }
            className="mt-2 w-full rounded border border-border px-2 py-1 text-xs font-mono outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      )}
    </div>
  );
}
