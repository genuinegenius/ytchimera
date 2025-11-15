import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { loadRewardedAd, showRewardedAd } from '../services/adService';

interface AdModalProps {
  visible: boolean;
  onClose: () => void;
  onReward: (credits: number) => void;
}

export const AdModal: React.FC<AdModalProps> = ({ visible, onClose, onReward }) => {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [watching, setWatching] = useState(false);

  const handleWatchAd = async () => {
    setLoading(true);

    try {
      // Load ad
      const loaded = await loadRewardedAd();

      if (!loaded) {
        alert('Failed to load ad. Please try again.');
        setLoading(false);
        return;
      }

      setLoading(false);
      setWatching(true);

      // Show ad
      const reward = await showRewardedAd();

      setWatching(false);
      onReward(reward.credits);
      onClose();
    } catch (error) {
      setLoading(false);
      setWatching(false);
      alert('Failed to show ad. Please try again.');
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.modal, { backgroundColor: theme.surface }]}>
          {watching ? (
            <View style={styles.watchingContainer}>
              <ActivityIndicator size="large" color={theme.primary} />
              <Text style={[styles.watchingText, { color: theme.text }]}>
                Watching ad...
              </Text>
            </View>
          ) : (
            <>
              <Text style={[styles.title, { color: theme.text }]}>Watch Ad</Text>
              <Text style={[styles.description, { color: theme.textSecondary }]}>
                Watch a short video ad to earn 50 credits!
              </Text>

              {loading ? (
                <ActivityIndicator size="large" color={theme.primary} style={styles.loader} />
              ) : (
                <View style={styles.buttons}>
                  <TouchableOpacity
                    style={[styles.button, styles.cancelButton, { borderColor: theme.border }]}
                    onPress={onClose}
                  >
                    <Text style={[styles.buttonText, { color: theme.text }]}>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.button, styles.watchButton, { backgroundColor: theme.primary }]}
                    onPress={handleWatchAd}
                  >
                    <Text style={[styles.buttonText, { color: '#fff' }]}>Watch Ad</Text>
                  </TouchableOpacity>
                </View>
              )}
            </>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    width: '80%',
    borderRadius: 16,
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  loader: {
    marginVertical: 24,
  },
  buttons: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    borderWidth: 1,
  },
  watchButton: {},
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  watchingContainer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  watchingText: {
    fontSize: 16,
    marginTop: 16,
  },
});
