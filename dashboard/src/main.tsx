import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import 'bootstrap/dist/css/bootstrap.min.css';
import './index.css';

const Root: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(/* set initial dark mode state */);

  useEffect(() => {
    // Your condition to determine dark mode
    const condition = true;
    setIsDarkMode(condition);

    // Toggle dark mode class on the body element
    document.body.classList.toggle('dark-mode', condition);
  }, []);

  return (
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <Root />,
);
 