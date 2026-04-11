// src/context/IntroContext.jsx
import React, { createContext, useState } from 'react';

export const IntroContext = createContext();

export const IntroProvider = ({ children }) => {
  // False on first load or hard refresh. 
  const [introPlayed, setIntroPlayed] = useState(false);

  return (
    <IntroContext.Provider value={{ introPlayed, setIntroPlayed }}>
      {children}
    </IntroContext.Provider>
  );
};