import React, { useReducer, useEffect } from 'react';
import { initialFormState, formReducer } from '../hooks/useYudisiumReducer';

const YudisiumFormContext = React.createContext();

// Handle Bug Refresh
const init = (initialState) => {
  try {
    const saved = localStorage.getItem('yudisium_form_draft');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.documents) {
        parsed.documents = parsed.documents.map(doc => ({ ...doc, file: null, fileUrl: null }));
      }
      return parsed;
    }
  } catch (e) {
    console.error("Failed to parse draft", e);
  }
  return initialState;
};

export function YudisiumFormProvider({ children }) {
  const [state, dispatch] = useReducer(formReducer, initialFormState, init);

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