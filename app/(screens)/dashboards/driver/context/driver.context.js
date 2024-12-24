import React, { createContext, useState, useContext } from "react";

// Create the context
const DriverContext = createContext();

// Provider component
export const DriverContextProvider = ({ children }) => {
  const [tripStarted, setTripStarted] = useState(true);

  return (
    <DriverContext.Provider value={{ tripStarted, setTripStarted }}>
      {children}
    </DriverContext.Provider>
  );
};

// Custom hook to use the LoadingContext
export const useDriverContext = () => useContext(DriverContext);
