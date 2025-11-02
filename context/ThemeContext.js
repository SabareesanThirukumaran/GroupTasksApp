import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from 'react-native';

const ThemeContext = createContext();

export const lightTheme = {
  background: "#f2f5ff",
  surface: "#f9f9f9",
  surfaceBorder: "#d9d9e0",
  primary: "#0F6EC6",
  secondary: "rgba(255, 255, 255, 1)",
  defaultText: "#000000",
  grayText: "#aaaaaa",
  primaryText: "#ffffff",
  secondaryText: "#ffffff",
  textSecondary: "#666666",
  success: "#3dd68c",
  lightWarning: "#ffcf66",
  warning: "#ff801f",
  failure: "#d50000",
  groupColours: ["#00bcd4", "#8bc34a", "#7c3391", "#616161"],
  StatsCard1: "#E3F2FD",
  StatsCard2: "#FFF3E0",
  StatsCard3: "#E8F5E9",
  StatsCard4: "#FFEBEE",
};

export const darkTheme = {
  background: "#121212",
  surface: "#1E1E1E",
  surfaceBorder: "#333333",
  primary: "#0F6EC6",
  secondary: "rgba(255, 255, 255, 0.1)",
  defaultText: "#ffffff",
  grayText: "#aaaaaa",
  primaryText: "#ffffff",
  secondaryText: "#cccccc",
  textSecondary: "#aaaaaa",
  success: "#3dd68c",
  lightWarning: "#ffcf66",
  warning: "#ff801f",
  failure: "#ff5252",
  groupColours: ["#00bcd4", "#8bc34a", "#7c3391", "#616161"],
  StatsCard1: "#252525ff",
  StatsCard2: "#222222ff",
  StatsCard3: "#212121",
  StatsCard4: "#292929",
};

export const ThemeProvider = ({ children, userId }) => {
  const systemColorScheme = useColorScheme();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [themePreference, setThemePreference] = useState('system');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      loadThemePreference(userId);
    } else {
      setThemePreference('system');
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (themePreference === 'system') {
      setIsDarkMode(systemColorScheme === 'dark');
    } else {
      setIsDarkMode(themePreference === 'dark');
    }
  }, [themePreference, systemColorScheme]);

  const loadThemePreference = async (uid) => {
    try {
      const savedPreference = await AsyncStorage.getItem(`themePreference_${uid}`);
      if (savedPreference) {
        setThemePreference(savedPreference);
      } else {
        setThemePreference('system');
      }
    } catch (error) {
      console.error('Error loading theme preference:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveThemePreference = async (preference) => {
    if (!userId) {
      console.warn('Cannot save theme preference: No user logged in');
      return;
    }
    
    try {
      await AsyncStorage.setItem(`themePreference_${userId}`, preference);
      setThemePreference(preference);
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
  };

  const toggleTheme = () => {
    const newPreference = isDarkMode ? 'light' : 'dark';
    saveThemePreference(newPreference);
  };

  const setSystemTheme = () => {
    saveThemePreference('system');
  };

  const theme = isDarkMode ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider 
      value={{ 
        theme, 
        isDarkMode, 
        toggleTheme, 
        themePreference,
        setThemePreference: saveThemePreference,
        setSystemTheme,
        loading 
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};