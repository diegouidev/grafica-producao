// src/hooks/useDebounce.ts

import { useState, useEffect } from 'react';

// Este é um hook customizado que recebe um valor e um tempo de atraso (delay)
export function useDebounce<T>(value: T, delay: number): T {
  // Estado para guardar o valor "atrasado" (debounced)
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Cria um temporizador que só vai atualizar o estado 'debouncedValue'
    // após o tempo de 'delay' ter passado
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Esta é a função de limpeza. Ela é executada toda vez que o 'value' ou 'delay' muda.
    // Ela cancela o temporizador anterior, garantindo que apenas o último seja executado.
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]); // O efeito só roda novamente se o valor ou o delay mudarem

  return debouncedValue;
}