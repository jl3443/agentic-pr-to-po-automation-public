import { createContext, useContext } from 'react';
import type { ReactNode } from 'react';

interface CurrencyContextType {
  /** Format a number for display (no conversion, just formatting) */
  fmt: (n: number) => string;
  symbol: string;
}

const CurrencyContext = createContext<CurrencyContextType>({
  fmt: (n) => n.toLocaleString('en-US'),
  symbol: '€',
});

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const fmt = (n: number): string => n.toLocaleString('en-US');

  return (
    <CurrencyContext.Provider value={{ fmt, symbol: '€' }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export const useCurrency = () => useContext(CurrencyContext);
