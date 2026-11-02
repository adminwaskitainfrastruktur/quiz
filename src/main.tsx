import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { installRipple } from './fx';
import './styles.css';

installRipple();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
