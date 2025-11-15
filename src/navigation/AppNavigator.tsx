import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { User } from '../types';

// Import Screens
import { AuthScreen } from '../screens/AuthScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { WatchScreen } from '../screens/WatchScreen';
import { SubmitVideoScreen } from '../screens/SubmitVideoScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { EditProfileScreen } from '../screens/EditProfileScreen';
import { CreditHistoryScreen } from '../screens/CreditHistoryScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

interface ProfileStackProps {
  user: User;
  onUserUpdate: (user: User) => void;
  onSignOut: () => void;
}

const ProfileStack: React.FC<ProfileStackProps> = ({ user, onUserUpdate, onSignOut }) => {
  const { theme } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.background,
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 1,
          borderBottomColor: theme.border,
        },
        headerTintColor: theme.text,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen
        name="ProfileMain"
        options={{ headerShown: false }}
      >
        {() => <ProfileScreen user={user} onSignOut={onSignOut} />}
      </Stack.Screen>

      <Stack.Screen
        name="EditProfile"
        options={{ title: 'Edit Profile' }}
      >
        {() => <EditProfileScreen user={user} onUserUpdate={onUserUpdate} />}
      </Stack.Screen>

      <Stack.Screen
        name="CreditHistory"
        options={{ title: 'Credit History' }}
      >
        {() => <CreditHistoryScreen user={user} />}
      </Stack.Screen>
    </Stack.Navigator>
  );
};

interface MainTabsProps {
  user: User;
  onUserUpdate: (user: User) => void;
  onSignOut: () => void;
}

const MainTabs: React.FC<MainTabsProps> = ({ user, onUserUpdate, onSignOut }) => {
  const { theme } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'home';

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Earn') {
            iconName = focused ? 'play-circle' : 'play-circle-outline';
          } else if (route.name === 'Submit') {
            iconName = focused ? 'cloud-upload' : 'cloud-upload-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.textSecondary,
        tabBarStyle: {
          backgroundColor: theme.surface,
          borderTopColor: theme.border,
          borderTopWidth: 1,
          elevation: 0,
          shadowOpacity: 0,
        },
        headerStyle: {
          backgroundColor: theme.background,
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 1,
          borderBottomColor: theme.border,
        },
        headerTintColor: theme.text,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      })}
    >
      <Tab.Screen
        name="Home"
        options={{ title: 'Home' }}
      >
        {() => <HomeScreen user={user} onUserUpdate={onUserUpdate} />}
      </Tab.Screen>

      <Tab.Screen
        name="Earn"
        options={{ title: 'Earn Credits' }}
      >
        {() => <WatchScreen user={user} onUserUpdate={onUserUpdate} />}
      </Tab.Screen>

      <Tab.Screen
        name="Submit"
        options={{ title: 'Submit Video' }}
      >
        {() => <SubmitVideoScreen user={user} onUserUpdate={onUserUpdate} />}
      </Tab.Screen>

      <Tab.Screen
        name="Profile"
        options={{ headerShown: false }}
      >
        {() => <ProfileStack user={user} onUserUpdate={onUserUpdate} onSignOut={onSignOut} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
};

interface AppNavigatorProps {
  user: User | null;
  onUserUpdate: (user: User) => void;
  onAuthSuccess: () => void;
  onSignOut: () => void;
}

export const AppNavigator: React.FC<AppNavigatorProps> = ({
  user,
  onUserUpdate,
  onAuthSuccess,
  onSignOut,
}) => {
  const { theme } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      {!user ? (
        <Stack.Screen name="Auth">
          {() => <AuthScreen onAuthSuccess={onAuthSuccess} />}
        </Stack.Screen>
      ) : (
        <Stack.Screen name="MainTabs">
          {() => <MainTabs user={user} onUserUpdate={onUserUpdate} onSignOut={onSignOut} />}
        </Stack.Screen>
      )}
    </Stack.Navigator>
  );
};
