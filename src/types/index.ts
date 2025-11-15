export interface User {
  id: string;
  email: string;
  displayName: string;
  credits: number;
  videosWatchedToday: number;
  theme: 'light' | 'dark';
  avatar?: string;
  bio?: string;
  website?: string;
  socialLinks?: {
    twitter?: string;
    instagram?: string;
    youtube?: string;
    linkedin?: string;
  };
  contactPreferences?: 'public' | 'private' | 'friends';
  privacySettings?: 'everyone' | 'friends' | 'private';
  createdAt: Date;
  updatedAt: Date;
}

export interface Video {
  id: string;
  userId: string;
  youtubeUrl: string;
  videoId: string;
  title: string;
  thumbnail: string;
  duration: number;
  watchTimeRequired: number;
  creditsPerView: number;
  creditsPerLike: number;
  creditsPerSubscribe: number;
  views: number;
  likes: number;
  subscribes: number;
  targetViews: number;
  interactionTypes: ('view' | 'like' | 'subscribe')[];
  totalCreditsSpent: number;
  isActive: boolean;
  embeddable: boolean;
  publicStatsViewable: boolean;
  privacyStatus: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Interaction {
  id: string;
  userId: string;
  videoId: string;
  youtubeVideoId: string;
  videoTitle: string;
  type: 'view' | 'like' | 'subscribe' | 'welcome_bonus';
  watchTime?: number;
  subscribeText?: string;
  creditsEarned: number;
  createdAt: Date;
}

export interface Theme {
  primary: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  border: string;
  success: string;
  error: string;
  warning: string;
  info: string;
}

export interface YouTubeVideoDetails {
  title: string;
  thumbnail: string;
  duration: number;
  embeddable: boolean;
  publicStatsViewable: boolean;
  privacyStatus: string;
}
