import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { ThemeProvider, useTheme } from './src/contexts/ThemeContext';
import { AppNavigator } from './src/navigation/AppNavigator';
import { User } from './src/types';
import { getCurrentUser } from './src/services/authService';
import { auth } from './src/services/firebase';
import { onAuthStateChanged } from 'firebase/auth';

const AppContent: React.FC = () => {
  const { theme, isDark, setTheme } = useTheme();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listen to auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userData = await getCurrentUser();
          if (userData) {
            setUser(userData);
            // Apply user's theme preference
            if (userData.theme && userData.theme !== (isDark ? 'dark' : 'light')) {
              setTheme(userData.theme);
            }
          }
        } catch (error) {
          console.error('Failed to get user data:', error);
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleUserUpdate = (updatedUser: User) => {
    setUser(updatedUser);
  };

  const handleAuthSuccess = async () => {
    try {
      const userData = await getCurrentUser();
      if (userData) {
        setUser(userData);
        // Apply user's theme preference
        if (userData.theme && userData.theme !== (isDark ? 'dark' : 'light')) {
          setTheme(userData.theme);
        }
      }
    } catch (error) {
      console.error('Failed to get user data:', error);
    }
  };

  const handleSignOut = () => {
    setUser(null);
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <NavigationContainer>
        <AppNavigator
          user={user}
          onUserUpdate={handleUserUpdate}
          onAuthSuccess={handleAuthSuccess}
          onSignOut={handleSignOut}
        />
      </NavigationContainer>
    </>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
