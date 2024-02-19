import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import 'bootstrap/dist/css/bootstrap.min.css';
import './index.css';

const Root: React.FC = () => {

  useEffect(() => {
    document.body.classList.toggle('dark-mode');
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
 