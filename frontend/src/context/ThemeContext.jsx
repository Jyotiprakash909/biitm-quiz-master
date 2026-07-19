import React, { createContext, useState, useMemo, useContext, useEffect } from 'react';
import { createTheme, ThemeProvider, CssBaseline } from '@mui/material';

import { useSettings } from './SettingsContext';

const ThemeContext = createContext({ toggleTheme: () => {} });

export const useThemeToggle = () => useContext(ThemeContext);

export const CustomThemeProvider = ({ children }) => {
  const { settings } = useSettings();
  const [mode, setMode] = useState(() => {
    return localStorage.getItem('themeMode') || 'light';
  });

  useEffect(() => {
    localStorage.setItem('themeMode', mode);
  }, [mode]);

  const toggleTheme = () => {
    setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
  };

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          primary: {
            main: settings?.primaryColor || '#4F46E5',
          },
          secondary: {
            main: settings?.secondaryColor || '#EC4899',
          },
          background: {
            default: mode === 'light' ? '#F8FAFC' : '#0f172a',
            paper: mode === 'light' ? '#FFFFFF' : '#1e293b',
          },
        },
        typography: {
          fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
          h4: { fontWeight: 800, letterSpacing: '-0.02em' },
          h5: { fontWeight: 700, letterSpacing: '-0.01em' },
          h6: { fontWeight: 700, letterSpacing: '-0.01em' },
        },
        components: {
          MuiButton: {
            styleOverrides: {
              root: {
                textTransform: 'none',
                borderRadius: 8,
                fontWeight: 600,
                padding: '8px 16px',
              },
              contained: {
                boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
                '&:hover': {
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
                }
              }
            },
          },
          MuiCard: {
            styleOverrides: {
              root: {
                borderRadius: 16,
                boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
                border: mode === 'light' ? '1px solid #e2e8f0' : '1px solid #334155',
              },
            },
          },
          MuiPaper: {
            styleOverrides: {
              root: {
                backgroundImage: 'none',
              }
            }
          }
        },
      }),
    [mode, settings?.primaryColor, settings?.secondaryColor],
  );

  return (
    <ThemeContext.Provider value={{ toggleTheme, mode }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ThemeContext.Provider>
  );
};
