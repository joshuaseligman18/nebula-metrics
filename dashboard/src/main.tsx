import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "bootstrap/dist/css/bootstrap.min.css";
import "./index.css";
import { ModeProvider } from "./context/ModeContext";
import { ProcessContextProvider } from "./context/PIDcontext.tsx";

const Root: React.FC = () => {
  return (
    <React.StrictMode>
      <ProcessContextProvider>
        <ModeProvider>
          <App />
        </ModeProvider>
      </ProcessContextProvider>
    </React.StrictMode>
  );
};

ReactDOM.createRoot(document.getElementById("root")!).render(<Root />);
