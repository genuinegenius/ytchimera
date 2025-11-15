// Mock ad service for development
// In production, this would integrate with react-native-google-mobile-ads

export interface AdReward {
  credits: number;
}

export const loadRewardedAd = async (): Promise<boolean> => {
  // Simulate loading delay
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Mock 80% success rate
  return Math.random() > 0.2;
};

export const showRewardedAd = async (): Promise<AdReward> => {
  // Simulate ad display
  await new Promise(resolve => setTimeout(resolve, 3000));

  // Mock reward (50 credits per ad)
  return {
    credits: 50,
  };
};

export const isAdAvailable = (): boolean => {
  // In production, check if ad is loaded
  return true;
};
