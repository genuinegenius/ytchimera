import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  increment,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import { Video, Interaction, YouTubeVideoDetails } from '../types';

const YOUTUBE_API_KEY = 'AIzaSyBf1qwt53_dTlYZCGsZZAyjt6n1VROSV1E';

// Extract YouTube video ID from URL
export const extractVideoId = (url: string): string | null => {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /^([a-zA-Z0-9_-]{11})$/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return match[1];
    }
  }

  return null;
};

// Parse ISO 8601 duration to seconds
const parseDuration = (duration: string): number => {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;

  const hours = parseInt(match[1] || '0');
  const minutes = parseInt(match[2] || '0');
  const seconds = parseInt(match[3] || '0');

  return hours * 3600 + minutes * 60 + seconds;
};

// Fetch video details from YouTube API
export const fetchVideoDetails = async (videoId: string): Promise<YouTubeVideoDetails> => {
  try {
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,status&id=${videoId}&key=${YOUTUBE_API_KEY}`
    );

    const data = await response.json();

    if (!data.items || data.items.length === 0) {
      throw new Error('Video not found');
    }

    const video = data.items[0];
    const snippet = video.snippet;
    const contentDetails = video.contentDetails;
    const status = video.status;

    // Get the best quality thumbnail
    const thumbnail =
      snippet.thumbnails.maxres?.url ||
      snippet.thumbnails.high?.url ||
      snippet.thumbnails.medium?.url ||
      snippet.thumbnails.default?.url;

    return {
      title: snippet.title,
      thumbnail,
      duration: parseDuration(contentDetails.duration),
      embeddable: status.embeddable,
      publicStatsViewable: status.publicStatsViewable,
      privacyStatus: status.privacyStatus,
    };
  } catch (error: any) {
    throw new Error(error.message || 'Failed to fetch video details');
  }
};

// Submit a new video
export const submitVideo = async (
  userId: string,
  youtubeUrl: string,
  watchTimeRequired: number,
  interactionTypes: ('view' | 'like' | 'subscribe')[],
  targetViews: number
): Promise<Video> => {
  try {
    const videoId = extractVideoId(youtubeUrl);
    if (!videoId) {
      throw new Error('Invalid YouTube URL');
    }

    // Fetch video details
    const details = await fetchVideoDetails(videoId);

    if (!details.embeddable) {
      throw new Error('This video cannot be embedded');
    }

    // Calculate credits
    const creditsPerView = Math.floor((watchTimeRequired / 60) * 50);
    const creditsPerLike = interactionTypes.includes('like') ? 100 : 0;
    const creditsPerSubscribe = interactionTypes.includes('subscribe') ? 150 : 0;
    const totalCreditsSpent = (creditsPerView + creditsPerLike + creditsPerSubscribe) * targetViews;

    // Create video document
    const videoDocRef = doc(collection(db, 'videos'));
    const videoData = {
      userId,
      youtubeUrl,
      videoId,
      title: details.title,
      thumbnail: details.thumbnail,
      duration: details.duration,
      watchTimeRequired,
      creditsPerView,
      creditsPerLike,
      creditsPerSubscribe,
      views: 0,
      likes: 0,
      subscribes: 0,
      targetViews,
      interactionTypes,
      totalCreditsSpent,
      isActive: true,
      embeddable: details.embeddable,
      publicStatsViewable: details.publicStatsViewable,
      privacyStatus: details.privacyStatus,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await setDoc(videoDocRef, videoData);

    // Deduct credits from user
    const userDocRef = doc(db, 'users', userId);
    await updateDoc(userDocRef, {
      credits: increment(-totalCreditsSpent),
      updatedAt: serverTimestamp(),
    });

    return {
      id: videoDocRef.id,
      ...videoData,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as Video;
  } catch (error: any) {
    throw new Error(error.message || 'Failed to submit video');
  }
};

// Get random video for watching
export const getRandomVideo = async (userId: string): Promise<Video | null> => {
  try {
    const videosQuery = query(
      collection(db, 'videos'),
      where('isActive', '==', true),
      where('targetViews', '>', 0),
      orderBy('targetViews', 'desc'),
      limit(20)
    );

    const snapshot = await getDocs(videosQuery);
    const videos = snapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      }))
      .filter(video => video.userId !== userId) as Video[];

    if (videos.length === 0) {
      return null;
    }

    // Return random video
    return videos[Math.floor(Math.random() * videos.length)];
  } catch (error: any) {
    throw new Error(error.message || 'Failed to fetch video');
  }
};

// Record interaction (view, like, subscribe)
export const recordInteraction = async (
  userId: string,
  video: Video,
  type: 'view' | 'like' | 'subscribe',
  watchTime?: number
): Promise<{ credits: number }> => {
  try {
    // Validate interaction is allowed
    if (!video.interactionTypes.includes(type)) {
      throw new Error(`${type} interaction is not enabled for this video`);
    }

    if (video.targetViews <= 0) {
      throw new Error('This video has reached its target views');
    }

    // Calculate credits
    let creditsEarned = 0;
    if (type === 'view') {
      creditsEarned = video.creditsPerView;
    } else if (type === 'like') {
      creditsEarned = video.creditsPerLike;
    } else if (type === 'subscribe') {
      creditsEarned = video.creditsPerSubscribe;
    }

    // Create interaction document
    const interactionDocRef = doc(collection(db, 'interactions'));
    const interactionData = {
      userId,
      videoId: video.id,
      youtubeVideoId: video.videoId,
      videoTitle: video.title,
      type,
      watchTime: type === 'view' ? watchTime : undefined,
      creditsEarned,
      createdAt: serverTimestamp(),
    };

    await setDoc(interactionDocRef, interactionData);

    // Update video stats
    const videoDocRef = doc(db, 'videos', video.id);
    const updateData: any = {
      targetViews: increment(-1),
      updatedAt: serverTimestamp(),
    };

    if (type === 'view') {
      updateData.views = increment(1);
    } else if (type === 'like') {
      updateData.likes = increment(1);
    } else if (type === 'subscribe') {
      updateData.subscribes = increment(1);
    }

    // Check if video should be deactivated
    const videoDoc = await getDoc(videoDocRef);
    const currentTargetViews = videoDoc.data()?.targetViews || 0;
    if (currentTargetViews <= 1) {
      updateData.isActive = false;
    }

    await updateDoc(videoDocRef, updateData);

    // Add credits to user
    const userDocRef = doc(db, 'users', userId);
    await updateDoc(userDocRef, {
      credits: increment(creditsEarned),
      videosWatchedToday: increment(1),
      updatedAt: serverTimestamp(),
    });

    return { credits: creditsEarned };
  } catch (error: any) {
    throw new Error(error.message || 'Failed to record interaction');
  }
};

// Get user's submitted videos
export const getUserVideos = async (userId: string): Promise<Video[]> => {
  try {
    const videosQuery = query(
      collection(db, 'videos'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(videosQuery);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date(),
    })) as Video[];
  } catch (error: any) {
    throw new Error(error.message || 'Failed to fetch user videos');
  }
};

// Get user's interactions (credit history)
export const getUserInteractions = async (userId: string): Promise<Interaction[]> => {
  try {
    const interactionsQuery = query(
      collection(db, 'interactions'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(interactionsQuery);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
    })) as Interaction[];
  } catch (error: any) {
    throw new Error(error.message || 'Failed to fetch interactions');
  }
};

// Get user stats
export const getUserStats = async (userId: string): Promise<{
  videosWatched: number;
  videosLiked: number;
  subscribes: number;
  videosSubmitted: number;
}> => {
  try {
    const interactionsQuery = query(
      collection(db, 'interactions'),
      where('userId', '==', userId)
    );

    const snapshot = await getDocs(interactionsQuery);
    const interactions = snapshot.docs.map(doc => doc.data());

    const videosWatched = interactions.filter(i => i.type === 'view').length;
    const videosLiked = interactions.filter(i => i.type === 'like').length;
    const subscribes = interactions.filter(i => i.type === 'subscribe').length;

    const videosQuery = query(
      collection(db, 'videos'),
      where('userId', '==', userId)
    );
    const videosSnapshot = await getDocs(videosQuery);
    const videosSubmitted = videosSnapshot.size;

    return {
      videosWatched,
      videosLiked,
      subscribes,
      videosSubmitted,
    };
  } catch (error: any) {
    throw new Error(error.message || 'Failed to fetch user stats');
  }
};
