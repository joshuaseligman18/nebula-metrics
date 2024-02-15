import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import ProcessPage from "../../pages/ProcessPage";
import HomePage from "../../pages/HomePage";
import SystemPage from "../../pages/SystemPage";

const AppRouter: React.FC = () => {
  return (
    <Router basename="/web">
      <Routes>
        <Route path="/" Component={HomePage} />
        <Route path="/process" Component={ProcessPage} />
        <Route path="/system" Component={SystemPage} />
      </Routes>
    </Router>
  );
};

export default AppRouter;
