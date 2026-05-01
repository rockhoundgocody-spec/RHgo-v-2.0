import React, { createContext, useContext, useState, useCallback } from 'react';

const OracleContext = createContext(null);

export function OracleProvider({ children }) {
  const [open, setOpen] = useState(false);
  const [autoLive, setAutoLive] = useState(false);
  const openOracle = useCallback((opts = {}) => {
    setAutoLive(!!opts.live);
    setOpen(true);
  }, []);
  const closeOracle = useCallback(() => {
    setOpen(false);
    setAutoLive(false);
  }, []);
  const toggleOracle = useCallback(() => setOpen((o) => !o), []);
  return (
    <OracleContext.Provider
      value={{ open, autoLive, openOracle, closeOracle, toggleOracle }}
    >
      {children}
    </OracleContext.Provider>
  );
}

export function useOracle() {
  const ctx = useContext(OracleContext);
  if (!ctx) throw new Error('useOracle must be used within OracleProvider');
  return ctx;
}