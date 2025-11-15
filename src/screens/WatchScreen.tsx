import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import YoutubePlayer from 'react-native-youtube-iframe';
import { useTheme } from '../contexts/ThemeContext';
import { User, Video } from '../types';
import { getRandomVideo, recordInteraction } from '../services/videoService';
import { getCurrentUser } from '../services/authService';

interface WatchScreenProps {
  user: User;
  onUserUpdate: (user: User) => void;
}

export const WatchScreen: React.FC<WatchScreenProps> = ({ user, onUserUpdate }) => {
  const { theme } = useTheme();
  const [video, setVideo] = useState<Video | null>(null);
  const [loading, setLoading] = useState(true);
  const [watchTime, setWatchTime] = useState(0);
  const [canClaim, setCanClaim] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [hasLiked, setHasLiked] = useState(false);
  const [hasSubscribed, setHasSubscribed] = useState(false);
  const watchInterval = useRef<NodeJS.Timeout>();

  const loadVideo = async () => {
    setLoading(true);
    setWatchTime(0);
    setCanClaim(false);
    setHasLiked(false);
    setHasSubscribed(false);

    try {
      const randomVideo = await getRandomVideo(user.id);
      if (randomVideo) {
        setVideo(randomVideo);
      } else {
        Alert.alert('No Videos', 'No videos available to watch at the moment.');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to load video');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVideo();

    return () => {
      if (watchInterval.current) {
        clearInterval(watchInterval.current);
      }
    };
  }, []);

  useEffect(() => {
    if (video && !canClaim) {
      watchInterval.current = setInterval(() => {
        setWatchTime(prev => {
          const newTime = prev + 1;
          if (newTime >= video.watchTimeRequired) {
            setCanClaim(true);
            if (watchInterval.current) {
              clearInterval(watchInterval.current);
            }
          }
          return newTime;
        });
      }, 1000);
    }

    return () => {
      if (watchInterval.current) {
        clearInterval(watchInterval.current);
      }
    };
  }, [video, canClaim]);

  const handleClaimReward = async () => {
    if (!video || !canClaim) return;

    setClaiming(true);

    try {
      const result = await recordInteraction(user.id, video, 'view', watchTime);

      // Update user
      const updatedUser = await getCurrentUser();
      if (updatedUser) {
        onUserUpdate(updatedUser);
      }

      Alert.alert(
        'Credits Earned!',
        `You earned ${result.credits} credits for watching this video!`,
        [{ text: 'Next Video', onPress: loadVideo }]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to claim reward');
    } finally {
      setClaiming(false);
    }
  };

  const handleLike = async () => {
    if (!video || hasLiked || !video.interactionTypes.includes('like')) return;

    try {
      const result = await recordInteraction(user.id, video, 'like');
      setHasLiked(true);

      // Update user
      const updatedUser = await getCurrentUser();
      if (updatedUser) {
        onUserUpdate(updatedUser);
      }

      Alert.alert('Credits Earned!', `You earned ${result.credits} credits for liking!`);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to record like');
    }
  };

  const handleSubscribe = async () => {
    if (!video || hasSubscribed || !video.interactionTypes.includes('subscribe')) return;

    try {
      const result = await recordInteraction(user.id, video, 'subscribe');
      setHasSubscribed(true);

      // Update user
      const updatedUser = await getCurrentUser();
      if (updatedUser) {
        onUserUpdate(updatedUser);
      }

      Alert.alert('Credits Earned!', `You earned ${result.credits} credits for subscribing!`);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to record subscribe');
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={[styles.loadingText, { color: theme.text }]}>Loading video...</Text>
      </View>
    );
  }

  if (!video) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: theme.background }]}>
        <Ionicons name="videocam-off" size={64} color={theme.textSecondary} />
        <Text style={[styles.emptyText, { color: theme.text }]}>No videos available</Text>
        <TouchableOpacity
          style={[styles.retryButton, { backgroundColor: theme.primary }]}
          onPress={loadVideo}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Video Player */}
      <View style={styles.videoContainer}>
        <YoutubePlayer
          height={220}
          videoId={video.videoId}
          play={true}
        />
      </View>

      {/* Video Info */}
      <View style={styles.content}>
        <Text style={[styles.videoTitle, { color: theme.text }]} numberOfLines={2}>
          {video.title}
        </Text>

        {/* Watch Progress */}
        <View style={[styles.progressCard, { backgroundColor: theme.surface }]}>
          <View style={styles.progressHeader}>
            <Text style={[styles.progressLabel, { color: theme.text }]}>Watch Progress</Text>
            <Text style={[styles.progressTime, { color: theme.primary }]}>
              {formatTime(watchTime)} / {formatTime(video.watchTimeRequired)}
            </Text>
          </View>

          <View style={[styles.progressBar, { backgroundColor: theme.border }]}>
            <View
              style={[
                styles.progressFill,
                {
                  backgroundColor: theme.primary,
                  width: `${Math.min((watchTime / video.watchTimeRequired) * 100, 100)}%`,
                },
              ]}
            />
          </View>

          {canClaim ? (
            <TouchableOpacity
              style={[styles.claimButton, { backgroundColor: theme.success }]}
              onPress={handleClaimReward}
              disabled={claiming}
            >
              {claiming ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={24} color="#fff" />
                  <Text style={styles.claimButtonText}>
                    Claim {video.creditsPerView} Credits
                  </Text>
                </>
              )}
            </TouchableOpacity>
          ) : (
            <Text style={[styles.watchHint, { color: theme.textSecondary }]}>
              Keep watching to earn credits!
            </Text>
          )}
        </View>

        {/* Interaction Buttons */}
        <View style={styles.interactionContainer}>
          <Text style={[styles.interactionTitle, { color: theme.text }]}>
            Earn More Credits
          </Text>

          <View style={styles.interactionButtons}>
            {video.interactionTypes.includes('like') && (
              <TouchableOpacity
                style={[
                  styles.interactionButton,
                  {
                    backgroundColor: hasLiked ? theme.border : theme.surface,
                    borderColor: theme.border,
                  },
                ]}
                onPress={handleLike}
                disabled={hasLiked}
              >
                <Ionicons
                  name={hasLiked ? 'heart' : 'heart-outline'}
                  size={24}
                  color={hasLiked ? '#FF3B30' : theme.text}
                />
                <Text style={[styles.interactionButtonText, { color: theme.text }]}>
                  Like
                </Text>
                <Text style={[styles.interactionCredits, { color: theme.primary }]}>
                  +{video.creditsPerLike}
                </Text>
              </TouchableOpacity>
            )}

            {video.interactionTypes.includes('subscribe') && (
              <TouchableOpacity
                style={[
                  styles.interactionButton,
                  {
                    backgroundColor: hasSubscribed ? theme.border : theme.surface,
                    borderColor: theme.border,
                  },
                ]}
                onPress={handleSubscribe}
                disabled={hasSubscribed}
              >
                <Ionicons
                  name={hasSubscribed ? 'chatbubble-ellipses' : 'chatbubble-ellipses-outline'}
                  size={24}
                  color={hasSubscribed ? '#FF9500' : theme.text}
                />
                <Text style={[styles.interactionButtonText, { color: theme.text }]}>
                  Subscribe
                </Text>
                <Text style={[styles.interactionCredits, { color: theme.primary }]}>
                  +{video.creditsPerSubscribe}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Skip Button */}
        <TouchableOpacity
          style={[styles.skipButton, { borderColor: theme.border }]}
          onPress={loadVideo}
        >
          <Text style={[styles.skipButtonText, { color: theme.text }]}>Skip to Next Video</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    marginTop: 16,
  },
  emptyText: {
    fontSize: 18,
    marginTop: 16,
    marginBottom: 24,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  videoContainer: {
    width: '100%',
    backgroundColor: '#000',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  videoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  progressCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  progressLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  progressTime: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 16,
  },
  progressFill: {
    height: '100%',
  },
  claimButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  claimButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  watchHint: {
    fontSize: 14,
    textAlign: 'center',
  },
  interactionContainer: {
    marginBottom: 16,
  },
  interactionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  interactionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  interactionButton: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  interactionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
  },
  interactionCredits: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 4,
  },
  skipButton: {
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  skipButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
