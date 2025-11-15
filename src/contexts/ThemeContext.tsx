import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { Theme } from '../types';

interface ThemeContextType {
  theme: Theme;
  isDark: boolean;
  toggleTheme: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
}

const darkTheme: Theme = {
  primary: '#0A84FF',
  background: '#0C090A',
  surface: '#242124',
  text: '#ccccff',
  textSecondary: '#ccccff80',
  border: '#242124',
  success: '#34C759',
  error: '#FF3B30',
  warning: '#FF9500',
  info: '#0A84FF',
};

const lightTheme: Theme = {
  primary: '#007AFF',
  background: '#f8f9fa',
  surface: '#ffffff',
  text: '#333333',
  textSecondary: '#0C090A80',
  border: '#e9ecef',
  success: '#34C759',
  error: '#FF3B30',
  warning: '#FF9500',
  info: '#007AFF',
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: ReactNode; userId?: string }> = ({
  children,
  userId,
}) => {
  const [isDark, setIsDark] = useState(true);

  const theme = isDark ? darkTheme : lightTheme;

  const toggleTheme = async () => {
    const newTheme = !isDark;
    setIsDark(newTheme);

    // Update user's theme preference in Firestore
    if (userId) {
      try {
        const userDocRef = doc(db, 'users', userId);
        await updateDoc(userDocRef, {
          theme: newTheme ? 'dark' : 'light',
        });
      } catch (error) {
        console.error('Failed to update theme:', error);
      }
    }
  };

  const setTheme = async (themeMode: 'light' | 'dark') => {
    const newIsDark = themeMode === 'dark';
    setIsDark(newIsDark);

    // Update user's theme preference in Firestore
    if (userId) {
      try {
        const userDocRef = doc(db, 'users', userId);
        await updateDoc(userDocRef, {
          theme: themeMode,
        });
      } catch (error) {
        console.error('Failed to update theme:', error);
      }
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, isDark, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
