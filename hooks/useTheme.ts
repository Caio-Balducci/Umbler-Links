'use client';

import { useState, useCallback, useRef } from 'react';
import { ThemeConfig } from '@/types';
import { updateUserTheme } from '@/lib/firestore';

const DEBOUNCE_MS = 1000;

export function useTheme(uid: string | null, temaInicial: ThemeConfig | null) {
  const [tema, setTema] = useState<ThemeConfig | null>(temaInicial);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const atualizarTema = useCallback(
    (novoTema: Partial<ThemeConfig>) => {
      setTema((prev) => {
        if (!prev) return prev;
        const atualizado = { ...prev, ...novoTema };

        // Salva no Firestore com debounce de 1s
        if (timerRef.current) clearTimeout(timerRef.current);
        if (uid) {
          timerRef.current = setTimeout(() => {
            updateUserTheme(uid, atualizado).catch(console.error);
          }, DEBOUNCE_MS);
        }

        return atualizado;
      });
    },
    [uid]
  );

  return { tema, atualizarTema, setTema };
}
