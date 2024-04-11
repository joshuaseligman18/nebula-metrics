import React, { createContext, useContext, useEffect, useState } from "react";

interface ProcessContextType {
  selectedPID: number;
  setSelectedPID: (pid: number) => void;
}

const ProcessContext = createContext<ProcessContextType>({
  selectedPID: 1,
  setSelectedPID: () => {},
});

export const ProcessContextProvider: React.FC = ({ children }) => {
  const [selectedPID, setSelectedPIDState] = useState<number>(() => {
    // Initialize selectedPID from local storage, or default to null
    const storedPID = sessionStorage.getItem("selectedPID");
    return storedPID ? parseInt(storedPID) : 1;
  });

  // Update local storage whenever selectedPID changes
  useEffect(() => {
    sessionStorage.setItem("selectedPID", selectedPID.toString());
  }, [selectedPID]);

  const setSelectedPID: ProcessContextType["setSelectedPID"] = (pid) => {
    setSelectedPIDState(pid);
  };

  return (
    <ProcessContext.Provider value={{ selectedPID, setSelectedPID }}>
      {children}
    </ProcessContext.Provider>
  );
};

export const useProcessContext = () => useContext(ProcessContext);
