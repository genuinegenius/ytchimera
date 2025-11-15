import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { User, Interaction } from '../types';
import { getUserInteractions } from '../services/videoService';
import { SkeletonCard } from '../components/SkeletonLoader';

interface CreditHistoryScreenProps {
  user: User;
}

export const CreditHistoryScreen: React.FC<CreditHistoryScreenProps> = ({ user }) => {
  const { theme } = useTheme();
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadInteractions = async () => {
    try {
      const userInteractions = await getUserInteractions(user.id);
      setInteractions(userInteractions);
    } catch (error) {
      console.error('Failed to load interactions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInteractions();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadInteractions();
    setRefreshing(false);
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

  const getInteractionLabel = (type: string) => {
    switch (type) {
      case 'view':
        return 'Watched Video';
      case 'like':
        return 'Liked Video';
      case 'subscribe':
        return 'Subscribed';
      case 'welcome_bonus':
        return 'Welcome Bonus';
      default:
        return 'Interaction';
    }
  };

  const formatDate = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  };

  const totalCreditsEarned = interactions.reduce((sum, i) => sum + i.creditsEarned, 0);
  const totalActivities = interactions.length;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />
      }
    >
      <View style={styles.content}>
        {/* Summary Card */}
        <View style={[styles.summaryCard, { backgroundColor: theme.primary }]}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{totalCreditsEarned.toLocaleString()}</Text>
            <Text style={styles.summaryLabel}>Total Credits Earned</Text>
          </View>
          <View style={[styles.summaryDivider, { backgroundColor: 'rgba(255,255,255,0.3)' }]} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{totalActivities}</Text>
            <Text style={styles.summaryLabel}>Total Activities</Text>
          </View>
        </View>

        {/* History Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Transaction History</Text>

          {loading ? (
            <>
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </>
          ) : interactions.length > 0 ? (
            interactions.map((interaction, index) => (
              <View
                key={interaction.id}
                style={[
                  styles.historyCard,
                  { backgroundColor: theme.surface },
                  index === 0 && styles.firstCard,
                ]}
              >
                <View
                  style={[
                    styles.iconContainer,
                    { backgroundColor: getInteractionColor(interaction.type) + '20' },
                  ]}
                >
                  <Ionicons
                    name={getInteractionIcon(interaction.type) as any}
                    size={24}
                    color={getInteractionColor(interaction.type)}
                  />
                </View>

                <View style={styles.historyContent}>
                  <Text style={[styles.historyTitle, { color: theme.text }]} numberOfLines={1}>
                    {interaction.videoTitle}
                  </Text>
                  <Text style={[styles.historyType, { color: theme.textSecondary }]}>
                    {getInteractionLabel(interaction.type)}
                    {interaction.watchTime
                      ? ` • ${Math.floor(interaction.watchTime / 60)}m ${interaction.watchTime % 60}s`
                      : ''}
                  </Text>
                  <Text style={[styles.historyDate, { color: theme.textSecondary }]}>
                    {formatDate(interaction.createdAt)}
                  </Text>
                </View>

                <View style={styles.creditsContainer}>
                  <Text style={[styles.creditsAmount, { color: theme.success }]}>
                    +{interaction.creditsEarned}
                  </Text>
                </View>
              </View>
            ))
          ) : (
            <View style={[styles.emptyState, { backgroundColor: theme.surface }]}>
              <Ionicons name="wallet-outline" size={64} color={theme.textSecondary} />
              <Text style={[styles.emptyTitle, { color: theme.text }]}>No History Yet</Text>
              <Text style={[styles.emptyDesc, { color: theme.textSecondary }]}>
                Start watching videos to earn credits and build your history!
              </Text>
            </View>
          )}
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
  summaryCard: {
    flexDirection: 'row',
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryValue: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  summaryLabel: {
    color: '#fff',
    fontSize: 12,
    opacity: 0.9,
    textAlign: 'center',
  },
  summaryDivider: {
    width: 1,
    marginHorizontal: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  historyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  firstCard: {
    marginTop: 0,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  historyContent: {
    flex: 1,
  },
  historyTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  historyType: {
    fontSize: 12,
    marginBottom: 2,
  },
  historyDate: {
    fontSize: 11,
  },
  creditsContainer: {
    alignItems: 'flex-end',
  },
  creditsAmount: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  emptyState: {
    borderRadius: 12,
    padding: 48,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDesc: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});
