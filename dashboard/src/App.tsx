import { useState } from "react";
import AppRouter from "./components/router/Router";
import NavBar from "./components/nav/NavBar";
import { QueryClient, QueryClientProvider } from "react-query";
import ModeSelectorModal from "./components/config/ModeSelector";
import Button from "react-bootstrap/Button";
import { useMode } from "./context/ModeContext";

function App() {
  const { mode, toggleMode } = useMode();

  const queryClient = new QueryClient();

  const [showModal, setShowModal] = useState(false);

  return (
    <div className={`${mode === "dark" ? "dark-mode bg-dark" : "bg-light"}`}>
      <QueryClientProvider client={queryClient}>
        <NavBar mode={mode} />
        <div className={`${mode === "dark" ? "dark-mode bg-dark" : ""}`}>
          <Button
            className={`ml-4 mt-1 ${mode === "dark" ? "text-light" : "text-dark"}`}
            onClick={() => setShowModal(true)}
          >
            Color Mode
          </Button>
        </div>

        <ModeSelectorModal
          show={showModal} // Whether to show the modal
          onHide={() => setShowModal(false)} // Function to hide the modal
          onModeSelect={toggleMode} // Function to handle mode selection
          mode={mode} // Current mode
        />

        <AppRouter />
      </QueryClientProvider>
    </div>
  );
}

export default App;
