import React, { createContext, useContext, useEffect, useState } from "react";

interface ProcessContextType {
  selectedPID: number | null;
  setSelectedPID: (pid: number | null) => void;
}

const ProcessContext = createContext<ProcessContextType>({
  selectedPID: null,
  setSelectedPID: () => {},
});

export const ProcessContextProvider: React.FC = ({ children }) => {
  const [selectedPID, setSelectedPIDState] = useState<number | null>(() => {
    // Initialize selectedPID from local storage, or default to null
    const storedPID = localStorage.getItem("selectedPID");
    return storedPID ? parseInt(storedPID) : null;
  });

  // Update local storage whenever selectedPID changes
  useEffect(() => {
    if (selectedPID !== null) {
      localStorage.setItem("selectedPID", selectedPID.toString());
    } else {
      localStorage.removeItem("selectedPID");
    }
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
