import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { useTheme } from '../contexts/ThemeContext';
import { User } from '../types';
import { extractVideoId, fetchVideoDetails, submitVideo } from '../services/videoService';
import { getCurrentUser } from '../services/authService';
import { Skeleton } from '../components/SkeletonLoader';

interface SubmitVideoScreenProps {
  user: User;
  onUserUpdate: (user: User) => void;
}

export const SubmitVideoScreen: React.FC<SubmitVideoScreenProps> = ({ user, onUserUpdate }) => {
  const { theme } = useTheme();
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [watchTime, setWatchTime] = useState(60); // Default 1 minute
  const [targetViews, setTargetViews] = useState(10);
  const [interactionTypes, setInteractionTypes] = useState<('view' | 'like' | 'subscribe')[]>([
    'view',
  ]);
  const [validating, setValidating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [videoPreview, setVideoPreview] = useState<{
    title: string;
    thumbnail: string;
    duration: number;
  } | null>(null);
  const [urlError, setUrlError] = useState('');

  const handleValidateUrl = async () => {
    if (!youtubeUrl) {
      setUrlError('Please enter a YouTube URL');
      return;
    }

    const videoId = extractVideoId(youtubeUrl);
    if (!videoId) {
      setUrlError('Invalid YouTube URL');
      setVideoPreview(null);
      return;
    }

    setValidating(true);
    setUrlError('');

    try {
      const details = await fetchVideoDetails(videoId);

      if (!details.embeddable) {
        setUrlError('This video cannot be embedded');
        setVideoPreview(null);
        return;
      }

      setVideoPreview({
        title: details.title,
        thumbnail: details.thumbnail,
        duration: details.duration,
      });
    } catch (error: any) {
      setUrlError(error.message || 'Failed to validate video');
      setVideoPreview(null);
    } finally {
      setValidating(false);
    }
  };

  const toggleInteractionType = (type: 'view' | 'like' | 'subscribe') => {
    if (type === 'view') return; // View is always required

    if (interactionTypes.includes(type)) {
      setInteractionTypes(interactionTypes.filter(t => t !== type));
    } else {
      setInteractionTypes([...interactionTypes, type]);
    }
  };

  const calculateCost = (): number => {
    const creditsPerView = Math.floor((watchTime / 60) * 50);
    const creditsPerLike = interactionTypes.includes('like') ? 100 : 0;
    const creditsPerSubscribe = interactionTypes.includes('subscribe') ? 150 : 0;
    return (creditsPerView + creditsPerLike + creditsPerSubscribe) * targetViews;
  };

  const handleSubmit = async () => {
    if (!videoPreview) {
      Alert.alert('Error', 'Please validate the YouTube URL first');
      return;
    }

    const cost = calculateCost();
    if (cost > user.credits) {
      Alert.alert('Insufficient Credits', `You need ${cost} credits but only have ${user.credits}`);
      return;
    }

    Alert.alert(
      'Confirm Submission',
      `This will cost ${cost} credits. Do you want to continue?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Submit',
          onPress: async () => {
            setSubmitting(true);

            try {
              await submitVideo(user.id, youtubeUrl, watchTime, interactionTypes, targetViews);

              // Update user
              const updatedUser = await getCurrentUser();
              if (updatedUser) {
                onUserUpdate(updatedUser);
              }

              Alert.alert('Success', 'Your video has been submitted successfully!');

              // Reset form
              setYoutubeUrl('');
              setWatchTime(60);
              setTargetViews(10);
              setInteractionTypes(['view']);
              setVideoPreview(null);
              setUrlError('');
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to submit video');
            } finally {
              setSubmitting(false);
            }
          },
        },
      ]
    );
  };

  const totalCost = calculateCost();
  const canAfford = totalCost <= user.credits;

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.content}>
        {/* Credits Display */}
        <View style={[styles.creditsCard, { backgroundColor: theme.surface }]}>
          <Text style={[styles.creditsLabel, { color: theme.textSecondary }]}>
            Available Credits
          </Text>
          <Text style={[styles.creditsAmount, { color: theme.text }]}>
            {user.credits.toLocaleString()}
          </Text>
        </View>

        {/* YouTube URL Input */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>YouTube URL</Text>
          <View style={styles.urlInputContainer}>
            <TextInput
              style={[
                styles.urlInput,
                {
                  backgroundColor: theme.surface,
                  color: theme.text,
                  borderColor: urlError ? theme.error : theme.border,
                },
              ]}
              value={youtubeUrl}
              onChangeText={text => {
                setYoutubeUrl(text);
                setUrlError('');
              }}
              placeholder="https://youtube.com/watch?v=..."
              placeholderTextColor={theme.textSecondary}
              autoCapitalize="none"
              onBlur={handleValidateUrl}
            />
            {validating && (
              <ActivityIndicator
                size="small"
                color={theme.primary}
                style={styles.urlInputLoader}
              />
            )}
            {videoPreview && !validating && (
              <Ionicons
                name="checkmark-circle"
                size={24}
                color={theme.success}
                style={styles.urlInputIcon}
              />
            )}
          </View>
          {urlError ? (
            <Text style={[styles.errorText, { color: theme.error }]}>{urlError}</Text>
          ) : null}
        </View>

        {/* Video Preview */}
        {validating ? (
          <View style={[styles.previewCard, { backgroundColor: theme.surface }]}>
            <Skeleton height={120} width="100%" borderRadius={8} style={styles.previewSkeleton} />
            <Skeleton height={20} width="80%" style={styles.previewTitleSkeleton} />
          </View>
        ) : videoPreview ? (
          <View style={[styles.previewCard, { backgroundColor: theme.surface }]}>
            <Image source={{ uri: videoPreview.thumbnail }} style={styles.previewImage} />
            <Text style={[styles.previewTitle, { color: theme.text }]} numberOfLines={2}>
              {videoPreview.title}
            </Text>
          </View>
        ) : null}

        {/* Watch Time Selection */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Required Watch Time</Text>
          <View style={styles.sliderContainer}>
            <Text style={[styles.sliderValue, { color: theme.primary }]}>
              {Math.floor(watchTime / 60)} min {watchTime % 60} sec
            </Text>
            <Slider
              style={styles.slider}
              minimumValue={60}
              maximumValue={600}
              step={30}
              value={watchTime}
              onValueChange={setWatchTime}
              minimumTrackTintColor={theme.primary}
              maximumTrackTintColor={theme.border}
            />
          </View>
        </View>

        {/* Interaction Types */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Interaction Types</Text>

          <TouchableOpacity
            style={[
              styles.interactionOption,
              {
                backgroundColor: theme.surface,
                borderColor: theme.primary,
                borderWidth: 2,
              },
            ]}
            activeOpacity={1}
          >
            <View style={styles.interactionLeft}>
              <Ionicons name="play-circle" size={24} color="#0A84FF" />
              <View style={styles.interactionText}>
                <Text style={[styles.interactionTitle, { color: theme.text }]}>Watch Video</Text>
                <Text style={[styles.interactionDesc, { color: theme.textSecondary }]}>
                  Required
                </Text>
              </View>
            </View>
            <Text style={[styles.interactionCredits, { color: theme.primary }]}>
              {Math.floor((watchTime / 60) * 50)} credits
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.interactionOption,
              {
                backgroundColor: theme.surface,
                borderColor: interactionTypes.includes('like') ? theme.primary : theme.border,
                borderWidth: interactionTypes.includes('like') ? 2 : 1,
              },
            ]}
            onPress={() => toggleInteractionType('like')}
          >
            <View style={styles.interactionLeft}>
              <Ionicons name="heart" size={24} color="#FF3B30" />
              <View style={styles.interactionText}>
                <Text style={[styles.interactionTitle, { color: theme.text }]}>Like Video</Text>
                <Text style={[styles.interactionDesc, { color: theme.textSecondary }]}>
                  Optional
                </Text>
              </View>
            </View>
            <Text style={[styles.interactionCredits, { color: theme.primary }]}>
              +100 credits
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.interactionOption,
              {
                backgroundColor: theme.surface,
                borderColor: interactionTypes.includes('subscribe') ? theme.primary : theme.border,
                borderWidth: interactionTypes.includes('subscribe') ? 2 : 1,
              },
            ]}
            onPress={() => toggleInteractionType('subscribe')}
          >
            <View style={styles.interactionLeft}>
              <Ionicons name="chatbubble-ellipses" size={24} color="#FF9500" />
              <View style={styles.interactionText}>
                <Text style={[styles.interactionTitle, { color: theme.text }]}>
                  Subscribe to Channel
                </Text>
                <Text style={[styles.interactionDesc, { color: theme.textSecondary }]}>
                  Optional
                </Text>
              </View>
            </View>
            <Text style={[styles.interactionCredits, { color: theme.primary }]}>
              +150 credits
            </Text>
          </TouchableOpacity>
        </View>

        {/* Target Views */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Target Number of Views</Text>
          <View style={styles.sliderContainer}>
            <Text style={[styles.sliderValue, { color: theme.primary }]}>{targetViews} views</Text>
            <Slider
              style={styles.slider}
              minimumValue={1}
              maximumValue={100}
              step={1}
              value={targetViews}
              onValueChange={setTargetViews}
              minimumTrackTintColor={theme.primary}
              maximumTrackTintColor={theme.border}
            />
          </View>
        </View>

        {/* Cost Summary */}
        <View style={[styles.costCard, { backgroundColor: theme.surface }]}>
          <View style={styles.costRow}>
            <Text style={[styles.costLabel, { color: theme.text }]}>Cost per interaction:</Text>
            <Text style={[styles.costValue, { color: theme.text }]}>
              {Math.floor(totalCost / targetViews)} credits
            </Text>
          </View>
          <View style={styles.costRow}>
            <Text style={[styles.costLabel, { color: theme.text }]}>Total views:</Text>
            <Text style={[styles.costValue, { color: theme.text }]}>{targetViews}</Text>
          </View>
          <View style={[styles.costDivider, { backgroundColor: theme.border }]} />
          <View style={styles.costRow}>
            <Text style={[styles.costTotalLabel, { color: theme.text }]}>Total Cost:</Text>
            <Text
              style={[
                styles.costTotalValue,
                { color: canAfford ? theme.primary : theme.error },
              ]}
            >
              {totalCost.toLocaleString()} credits
            </Text>
          </View>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[
            styles.submitButton,
            {
              backgroundColor: canAfford && videoPreview ? theme.primary : theme.border,
            },
          ]}
          onPress={handleSubmit}
          disabled={!canAfford || !videoPreview || submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>Submit Video</Text>
          )}
        </TouchableOpacity>

        {!canAfford && (
          <Text style={[styles.warningText, { color: theme.error }]}>
            Insufficient credits. You need {totalCost - user.credits} more credits.
          </Text>
        )}
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
  creditsCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    alignItems: 'center',
  },
  creditsLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  creditsAmount: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  urlInputContainer: {
    position: 'relative',
  },
  urlInput: {
    height: 50,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingRight: 48,
    fontSize: 14,
    borderWidth: 1,
  },
  urlInputLoader: {
    position: 'absolute',
    right: 16,
    top: 13,
  },
  urlInputIcon: {
    position: 'absolute',
    right: 16,
    top: 13,
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
  },
  previewCard: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 24,
  },
  previewImage: {
    width: '100%',
    height: 180,
    borderRadius: 8,
    marginBottom: 12,
  },
  previewSkeleton: {
    marginBottom: 12,
  },
  previewTitleSkeleton: {
    marginBottom: 4,
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  sliderContainer: {
    paddingHorizontal: 8,
  },
  sliderValue: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  interactionOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  interactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  interactionText: {
    marginLeft: 12,
    flex: 1,
  },
  interactionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  interactionDesc: {
    fontSize: 12,
  },
  interactionCredits: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  costCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  costRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  costLabel: {
    fontSize: 14,
  },
  costValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  costDivider: {
    height: 1,
    marginVertical: 8,
  },
  costTotalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  costTotalValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  submitButton: {
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  warningText: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 12,
  },
});
