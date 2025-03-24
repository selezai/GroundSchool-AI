import React, { createContext, useContext } from 'react';

// Create the theme context
const ThemeContext = createContext();

// Theme provider component
export const ThemeProvider = ({ children }) => {
  // Theme values - always using dark blue aesthetic
  const theme = {
    // Always dark mode, no toggle needed
    isDarkMode: true,
    colors: {
      // Dark theme colors with original blue aesthetic
      background: '#0A0F24',
      card: 'rgba(255, 255, 255, 0.05)',
      text: '#FFFFFF',
      subText: '#E2E8F0',
      primary: '#00FFCC',
      border: 'rgba(255, 255, 255, 0.1)',
      accent: 'rgba(0, 255, 204, 0.2)',
      lightText: '#E2E8F0', // For secondary text
    },
  };

  return (
    <ThemeContext.Provider value={theme}>
      {typeof children === 'function' ? children(theme) : children}
    </ThemeContext.Provider>
  );
};

// Custom hook to use the theme context
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
