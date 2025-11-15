import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { User } from '../types';
import { getUserStats } from '../services/videoService';
import { getCurrentUser } from '../services/authService';

interface HomeScreenProps {
  user: User;
  onUserUpdate: (user: User) => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ user, onUserUpdate }) => {
  const { theme } = useTheme();
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    videosWatched: 0,
    videosLiked: 0,
    subscribes: 0,
    videosSubmitted: 0,
  });

  const loadStats = async () => {
    try {
      const userStats = await getUserStats(user.id);
      setStats(userStats);

      // Refresh user data
      const updatedUser = await getCurrentUser();
      if (updatedUser) {
        onUserUpdate(updatedUser);
      }
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadStats();
    setRefreshing(false);
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />
      }
    >
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.greeting, { color: theme.text }]}>
            Welcome back, {user.displayName}!
          </Text>
        </View>

        {/* Credit Balance */}
        <View style={[styles.balanceCard, { backgroundColor: theme.primary }]}>
          <Text style={styles.balanceLabel}>Your Credits</Text>
          <Text style={styles.balanceAmount}>{user.credits.toLocaleString()}</Text>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: theme.surface }]}>
            <Ionicons name="play-circle" size={32} color="#0A84FF" />
            <Text style={[styles.statValue, { color: theme.text }]}>
              {stats.videosWatched}
            </Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
              Videos Watched
            </Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: theme.surface }]}>
            <Ionicons name="heart" size={32} color="#FF3B30" />
            <Text style={[styles.statValue, { color: theme.text }]}>
              {stats.videosLiked}
            </Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
              Videos Liked
            </Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: theme.surface }]}>
            <Ionicons name="chatbubble-ellipses" size={32} color="#FF9500" />
            <Text style={[styles.statValue, { color: theme.text }]}>
              {stats.subscribes}
            </Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
              Subscribes Made
            </Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: theme.surface }]}>
            <Ionicons name="cloud-upload" size={32} color="#34C759" />
            <Text style={[styles.statValue, { color: theme.text }]}>
              {stats.videosSubmitted}
            </Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
              Videos Submitted
            </Text>
          </View>
        </View>

        {/* How It Works */}
        <View style={[styles.infoCard, { backgroundColor: theme.surface }]}>
          <Text style={[styles.infoTitle, { color: theme.text }]}>How It Works</Text>

          <View style={styles.infoSection}>
            <View style={styles.infoItem}>
              <Ionicons name="card" size={24} color={theme.primary} />
              <View style={styles.infoText}>
                <Text style={[styles.infoItemTitle, { color: theme.text }]}>
                  Earn Credits
                </Text>
                <Text style={[styles.infoItemDesc, { color: theme.textSecondary }]}>
                  Watch videos, like, and subscribe to earn credits
                </Text>
              </View>
            </View>

            <View style={styles.infoItem}>
              <Ionicons name="play-circle" size={24} color={theme.primary} />
              <View style={styles.infoText}>
                <Text style={[styles.infoItemTitle, { color: theme.text }]}>
                  Watch Video: 50 credits/min
                </Text>
                <Text style={[styles.infoItemDesc, { color: theme.textSecondary }]}>
                  Earn credits by watching videos for the required duration
                </Text>
              </View>
            </View>

            <View style={styles.infoItem}>
              <Ionicons name="heart" size={24} color={theme.primary} />
              <View style={styles.infoText}>
                <Text style={[styles.infoItemTitle, { color: theme.text }]}>
                  Like: 100 credits
                </Text>
                <Text style={[styles.infoItemDesc, { color: theme.textSecondary }]}>
                  Like videos to earn instant credits
                </Text>
              </View>
            </View>

            <View style={styles.infoItem}>
              <Ionicons name="chatbubble-ellipses" size={24} color={theme.primary} />
              <View style={styles.infoText}>
                <Text style={[styles.infoItemTitle, { color: theme.text }]}>
                  Subscribe: 150 credits
                </Text>
                <Text style={[styles.infoItemDesc, { color: theme.textSecondary }]}>
                  Subscribe to channels to earn the most credits
                </Text>
              </View>
            </View>

            <View style={styles.infoItem}>
              <Ionicons name="cloud-upload" size={24} color={theme.primary} />
              <View style={styles.infoText}>
                <Text style={[styles.infoItemTitle, { color: theme.text }]}>
                  Promote Your Videos
                </Text>
                <Text style={[styles.infoItemDesc, { color: theme.textSecondary }]}>
                  Use credits to promote your own YouTube videos
                </Text>
              </View>
            </View>
          </View>
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
  header: {
    marginBottom: 20,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  balanceCard: {
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    alignItems: 'center',
  },
  balanceLabel: {
    color: '#fff',
    fontSize: 16,
    opacity: 0.9,
    marginBottom: 8,
  },
  balanceAmount: {
    color: '#fff',
    fontSize: 48,
    fontWeight: 'bold',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    width: '48%',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
  infoCard: {
    borderRadius: 12,
    padding: 20,
  },
  infoTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  infoSection: {
    gap: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  infoText: {
    flex: 1,
    marginLeft: 12,
  },
  infoItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  infoItemDesc: {
    fontSize: 14,
    lineHeight: 20,
  },
});
