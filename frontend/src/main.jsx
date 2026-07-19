import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { CustomThemeProvider } from './context/ThemeContext';
import { SettingsProvider } from './context/SettingsContext';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <SettingsProvider>
      <CustomThemeProvider>
        <AuthProvider>
          <SocketProvider>
            <App />
          </SocketProvider>
        </AuthProvider>
      </CustomThemeProvider>
    </SettingsProvider>
  </StrictMode>,
)
