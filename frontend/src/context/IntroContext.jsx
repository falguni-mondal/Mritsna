import React, { createContext, useState } from 'react';

export const IntroContext = createContext();

export const IntroProvider = ({ children }) => {
  // 1. Initialize state lazily by checking sessionStorage first.
  // If they have been here this session, it returns true. Otherwise, false.
  const [introPlayed, setIntroPlayedState] = useState(() => {
    return sessionStorage.getItem("introPlayed") === "true";
  });

  // 2. Create a custom setter function that updates BOTH React State and Session Storage
  const setIntroPlayed = (value) => {
    setIntroPlayedState(value);
    sessionStorage.setItem("introPlayed", value.toString());
  };

  return (
    <IntroContext.Provider value={{ introPlayed, setIntroPlayed }}>
      {children}
    </IntroContext.Provider>
  );
};


// import React, { createContext, useState } from 'react';

// export const IntroContext = createContext();

// export const IntroProvider = ({ children }) => {
//   // False on first load or hard refresh. 
//   const [introPlayed, setIntroPlayed] = useState(false);

//   return (
//     <IntroContext.Provider value={{ introPlayed, setIntroPlayed }}>
//       {children}
//     </IntroContext.Provider>
//   );
// };