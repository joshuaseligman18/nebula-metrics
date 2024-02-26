import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "bootstrap/dist/css/bootstrap.min.css";
import "./index.css";
import { ModeProvider } from "./context/ModeContext";

const Root: React.FC = () => {
  return (
    <React.StrictMode>
      <ModeProvider>
        <App />
      </ModeProvider>
    </React.StrictMode>
  );
};

ReactDOM.createRoot(document.getElementById("root")!).render(<Root />);
