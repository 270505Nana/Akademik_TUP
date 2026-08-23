import React, { useReducer, useEffect } from 'react';
import { initialFormState, formReducer } from '../hooks/useYudisiumReducer';

const YudisiumFormContext = React.createContext();

export function YudisiumFormProvider({ children }) {
  const [state, dispatch] = useReducer(formReducer, initialFormState);

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('yudisium_form_draft');
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
    localStorage.setItem('yudisium_form_draft', JSON.stringify(state));
  }, [state]);

  return (
    <YudisiumFormContext.Provider value={{ state, dispatch }}>
      {children}
    </YudisiumFormContext.Provider>
  );
}

export function useYudisiumContext() {
  const context = React.useContext(YudisiumFormContext);
  if (!context) {
    throw new Error('useYudisiumContext must be used within a YudisiumFormProvider');
  }
  return context;
}