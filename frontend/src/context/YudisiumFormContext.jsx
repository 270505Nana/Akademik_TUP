import React, { createContext, useContext, useReducer, useEffect } from 'react';
import yudisiumReducer, { initialState } from '../hooks/useYudisiumReducer';

const YudisiumFormContext = createContext();

export function YudisiumFormProvider({ children }) {
  const [state, dispatch] = useReducer(yudisiumReducer, initialState);

  useEffect(() => {
    const saved = localStorage.getItem('yudisium_form_draft');
    if (saved) {
      const parsed = JSON.parse(saved);
      // yg di restore cuman datanta, bukan step terakhir
      dispatch({ type: 'UPDATE_DATA', payload: parsed.data });
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('yudisium_form_draft', JSON.stringify({ data: state.data }));
  }, [state.data]);

  return (
    <YudisiumFormContext.Provider value={{ state, dispatch }}>
      {children}
    </YudisiumFormContext.Provider>
  );
}

export function useYudisiumForm() {
  const context = useContext(YudisiumFormContext);
  if (!context) {
    throw new Error('useYudisiumForm must be used within a YudisiumFormProvider');
  }
  return context;
}
