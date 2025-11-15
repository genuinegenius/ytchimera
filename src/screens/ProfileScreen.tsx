import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Image,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../contexts/ThemeContext';
import { User, Interaction } from '../types';
import { getUserInteractions } from '../services/videoService';
import { signOut } from '../services/authService';
import { SkeletonCard } from '../components/SkeletonLoader';

interface ProfileScreenProps {
  user: User;
  onSignOut: () => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ user, onSignOut }) => {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const [refreshing, setRefreshing] = useState(false);
  const [recentInteractions, setRecentInteractions] = useState<Interaction[]>([]);
  const [loading, setLoading] = useState(true);

  const loadRecentInteractions = async () => {
    try {
      const interactions = await getUserInteractions(user.id);
      setRecentInteractions(interactions.slice(0, 3));
    } catch (error) {
      console.error('Failed to load interactions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecentInteractions();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadRecentInteractions();
    setRefreshing(false);
  };

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          try {
            await signOut();
            onSignOut();
          } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to sign out');
          }
        },
      },
    ]);
  };

  const getInteractionIcon = (type: string) => {
    switch (type) {
      case 'view':
        return 'play-circle';
      case 'like':
        return 'heart';
      case 'subscribe':
        return 'chatbubble-ellipses';
      case 'welcome_bonus':
        return 'gift';
      default:
        return 'star';
    }
  };

  const getInteractionColor = (type: string) => {
    switch (type) {
      case 'view':
        return '#0A84FF';
      case 'like':
        return '#FF3B30';
      case 'subscribe':
        return '#FF9500';
      case 'welcome_bonus':
        return '#34C759';
      default:
        return theme.primary;
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />
      }
    >
      <View style={styles.content}>
        {/* Profile Header */}
        <View style={[styles.profileCard, { backgroundColor: theme.surface }]}>
          <View style={styles.avatarContainer}>
            {user.avatar ? (
              <Image source={{ uri: user.avatar }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatarPlaceholder, { backgroundColor: theme.primary }]}>
                <Text style={styles.avatarText}>
                  {user.displayName.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
          </View>

          <Text style={[styles.displayName, { color: theme.text }]}>{user.displayName}</Text>
          <Text style={[styles.email, { color: theme.textSecondary }]}>{user.email}</Text>

          <View style={[styles.creditsContainer, { backgroundColor: theme.background }]}>
            <Ionicons name="wallet" size={20} color={theme.primary} />
            <Text style={[styles.creditsText, { color: theme.text }]}>
              {user.credits.toLocaleString()} Credits
            </Text>
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Recent Activity</Text>
            <TouchableOpacity onPress={() => navigation.navigate('CreditHistory' as never)}>
              <Text style={[styles.sectionLink, { color: theme.primary }]}>View All</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <>
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </>
          ) : recentInteractions.length > 0 ? (
            recentInteractions.map(interaction => (
              <View
                key={interaction.id}
                style={[styles.activityCard, { backgroundColor: theme.surface }]}
              >
                <View
                  style={[
                    styles.activityIcon,
                    { backgroundColor: getInteractionColor(interaction.type) + '20' },
                  ]}
                >
                  <Ionicons
                    name={getInteractionIcon(interaction.type) as any}
                    size={24}
                    color={getInteractionColor(interaction.type)}
                  />
                </View>
                <View style={styles.activityContent}>
                  <Text style={[styles.activityTitle, { color: theme.text }]} numberOfLines={1}>
                    {interaction.videoTitle}
                  </Text>
                  <Text style={[styles.activityDesc, { color: theme.textSecondary }]}>
                    {interaction.type === 'view' && 'Watched video'}
                    {interaction.type === 'like' && 'Liked video'}
                    {interaction.type === 'subscribe' && 'Subscribed to channel'}
                    {interaction.type === 'welcome_bonus' && 'Welcome bonus'}
                  </Text>
                </View>
                <Text style={[styles.activityCredits, { color: theme.success }]}>
                  +{interaction.creditsEarned}
                </Text>
              </View>
            ))
          ) : (
            <View style={[styles.emptyState, { backgroundColor: theme.surface }]}>
              <Ionicons name="time-outline" size={48} color={theme.textSecondary} />
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                No recent activity
              </Text>
            </View>
          )}
        </View>

        {/* Settings Menu */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Account Settings</Text>

          <TouchableOpacity
            style={[styles.menuItem, { backgroundColor: theme.surface }]}
            onPress={() => navigation.navigate('EditProfile' as never)}
          >
            <View style={styles.menuLeft}>
              <Ionicons name="person-outline" size={24} color={theme.text} />
              <Text style={[styles.menuText, { color: theme.text }]}>Edit Profile</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color={theme.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuItem, { backgroundColor: theme.surface }]}
            onPress={() => Alert.alert('Coming Soon', 'Notifications feature coming soon!')}
          >
            <View style={styles.menuLeft}>
              <Ionicons name="notifications-outline" size={24} color={theme.text} />
              <Text style={[styles.menuText, { color: theme.text }]}>Notifications</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color={theme.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuItem, { backgroundColor: theme.surface }]}
            onPress={() => Alert.alert('Coming Soon', 'Help & Support feature coming soon!')}
          >
            <View style={styles.menuLeft}>
              <Ionicons name="help-circle-outline" size={24} color={theme.text} />
              <Text style={[styles.menuText, { color: theme.text }]}>Help & Support</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color={theme.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuItem, { backgroundColor: theme.surface }]}
            onPress={() => Alert.alert('Coming Soon', 'Privacy Policy feature coming soon!')}
          >
            <View style={styles.menuLeft}>
              <Ionicons name="shield-outline" size={24} color={theme.text} />
              <Text style={[styles.menuText, { color: theme.text }]}>Privacy Policy</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color={theme.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuItem, styles.signOutItem, { backgroundColor: theme.surface }]}
            onPress={handleSignOut}
          >
            <View style={styles.menuLeft}>
              <Ionicons name="log-out-outline" size={24} color={theme.error} />
              <Text style={[styles.menuText, { color: theme.error }]}>Sign Out</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  profileCard: {
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 40,
    fontWeight: 'bold',
  },
  displayName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    marginBottom: 16,
  },
  creditsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
  },
  creditsText: {
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  sectionLink: {
    fontSize: 14,
    fontWeight: '600',
  },
  activityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  activityIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  activityDesc: {
    fontSize: 12,
  },
  activityCredits: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyState: {
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    marginTop: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuText: {
    fontSize: 16,
    fontWeight: '500',
  },
  signOutItem: {
    marginTop: 8,
  },
});
