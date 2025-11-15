import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { auth, db } from './firebase';
import { User } from '../types';

const WELCOME_BONUS = 1000;

export const signUp = async (
  email: string,
  password: string,
  displayName: string
): Promise<User> => {
  try {
    // Create Firebase Auth user
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;

    // Create user document in Firestore
    const userData: Omit<User, 'id'> = {
      email,
      displayName,
      credits: WELCOME_BONUS,
      videosWatchedToday: 0,
      theme: 'dark',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await setDoc(doc(db, 'users', firebaseUser.uid), {
      ...userData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // Record welcome bonus interaction
    await setDoc(doc(db, 'interactions', `${firebaseUser.uid}_welcome`), {
      userId: firebaseUser.uid,
      videoId: 'welcome',
      youtubeVideoId: 'welcome',
      videoTitle: 'Welcome Bonus',
      type: 'welcome_bonus',
      creditsEarned: WELCOME_BONUS,
      createdAt: serverTimestamp(),
    });

    return {
      id: firebaseUser.uid,
      ...userData,
    };
  } catch (error: any) {
    throw new Error(error.message || 'Failed to sign up');
  }
};

export const signIn = async (email: string, password: string): Promise<User> => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;

    // Fetch user data from Firestore
    const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));

    if (!userDoc.exists()) {
      throw new Error('User data not found');
    }

    const userData = userDoc.data();

    return {
      id: firebaseUser.uid,
      email: userData.email,
      displayName: userData.displayName,
      credits: userData.credits,
      videosWatchedToday: userData.videosWatchedToday,
      theme: userData.theme || 'dark',
      avatar: userData.avatar,
      bio: userData.bio,
      website: userData.website,
      socialLinks: userData.socialLinks,
      contactPreferences: userData.contactPreferences,
      privacySettings: userData.privacySettings,
      createdAt: userData.createdAt?.toDate() || new Date(),
      updatedAt: userData.updatedAt?.toDate() || new Date(),
    };
  } catch (error: any) {
    throw new Error(error.message || 'Failed to sign in');
  }
};

export const signOut = async (): Promise<void> => {
  try {
    await firebaseSignOut(auth);
  } catch (error: any) {
    throw new Error(error.message || 'Failed to sign out');
  }
};

export const getCurrentUser = async (): Promise<User | null> => {
  const firebaseUser = auth.currentUser;

  if (!firebaseUser) {
    return null;
  }

  try {
    const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));

    if (!userDoc.exists()) {
      return null;
    }

    const userData = userDoc.data();

    return {
      id: firebaseUser.uid,
      email: userData.email,
      displayName: userData.displayName,
      credits: userData.credits,
      videosWatchedToday: userData.videosWatchedToday,
      theme: userData.theme || 'dark',
      avatar: userData.avatar,
      bio: userData.bio,
      website: userData.website,
      socialLinks: userData.socialLinks,
      contactPreferences: userData.contactPreferences,
      privacySettings: userData.privacySettings,
      createdAt: userData.createdAt?.toDate() || new Date(),
      updatedAt: userData.updatedAt?.toDate() || new Date(),
    };
  } catch (error) {
    return null;
  }
};
