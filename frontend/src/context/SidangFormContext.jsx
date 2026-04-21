
import React, { useReducer, useEffect } from 'react';
import { initialFormState, formReducer } from '../hooks/useSidangReducer';

const SidangFormContext = React.createContext();

export function SidangFormProvider({ children }) {
  const [state, dispatch] = useReducer(formReducer, initialFormState);

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('sidang_form_draft');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        dispatch({ type: 'RESTORE_DRAFT', payload: parsed });
      } catch (e) {
        console.error("Failed to parse draft", e);
      }
    }
  }, []);

  // Save to localStorage 
  useEffect(() => {
    localStorage.setItem('sidang_form_draft', JSON.stringify(state));
  }, [state]);

  return (
    <SidangFormContext.Provider value={{ state, dispatch }}>
      {children}
    </SidangFormContext.Provider>
  );
}

export function useSidangContext() {
  const context = React.useContext(SidangFormContext);
  if (!context) {
    throw new Error('useSidangContext must be used within a SidangFormProvider');
  }
  return context;
}
