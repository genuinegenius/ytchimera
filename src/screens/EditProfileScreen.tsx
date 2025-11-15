import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useTheme } from '../contexts/ThemeContext';
import { User } from '../types';

interface EditProfileScreenProps {
  user: User;
  onUserUpdate: (user: User) => void;
}

export const EditProfileScreen: React.FC<EditProfileScreenProps> = ({ user, onUserUpdate }) => {
  const { theme, setTheme } = useTheme();
  const navigation = useNavigation();
  const [saving, setSaving] = useState(false);

  const [displayName, setDisplayName] = useState(user.displayName);
  const [bio, setBio] = useState(user.bio || '');
  const [website, setWebsite] = useState(user.website || '');
  const [avatar, setAvatar] = useState(user.avatar || '');
  const [selectedTheme, setSelectedTheme] = useState<'light' | 'dark'>(user.theme);
  const [contactPreferences, setContactPreferences] = useState<'public' | 'private' | 'friends'>(
    user.contactPreferences || 'public'
  );
  const [privacySettings, setPrivacySettings] = useState<'everyone' | 'friends' | 'private'>(
    user.privacySettings || 'everyone'
  );

  const [socialLinks, setSocialLinks] = useState({
    twitter: user.socialLinks?.twitter || '',
    instagram: user.socialLinks?.instagram || '',
    youtube: user.socialLinks?.youtube || '',
    linkedin: user.socialLinks?.linkedin || '',
  });

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'We need camera roll permissions to change your avatar.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      setAvatar(`data:image/jpeg;base64,${result.assets[0].base64}`);
    }
  };

  const handleSave = async () => {
    if (!displayName.trim()) {
      Alert.alert('Error', 'Display name is required');
      return;
    }

    setSaving(true);

    try {
      const userDocRef = doc(db, 'users', user.id);
      const updateData: any = {
        displayName: displayName.trim(),
        bio: bio.trim(),
        website: website.trim(),
        theme: selectedTheme,
        contactPreferences,
        privacySettings,
        socialLinks: {
          twitter: socialLinks.twitter.trim(),
          instagram: socialLinks.instagram.trim(),
          youtube: socialLinks.youtube.trim(),
          linkedin: socialLinks.linkedin.trim(),
        },
        updatedAt: new Date(),
      };

      if (avatar) {
        updateData.avatar = avatar;
      }

      await updateDoc(userDocRef, updateData);

      // Update theme
      if (selectedTheme !== user.theme) {
        await setTheme(selectedTheme);
      }

      // Update user object
      onUserUpdate({
        ...user,
        ...updateData,
      });

      Alert.alert('Success', 'Profile updated successfully');
      navigation.goBack();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.content}>
        {/* Avatar Section */}
        <View style={styles.avatarSection}>
          <TouchableOpacity onPress={handlePickImage}>
            {avatar ? (
              <Image source={{ uri: avatar }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatarPlaceholder, { backgroundColor: theme.primary }]}>
                <Text style={styles.avatarText}>
                  {displayName.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
            <View style={[styles.editBadge, { backgroundColor: theme.primary }]}>
              <Ionicons name="camera" size={16} color="#fff" />
            </View>
          </TouchableOpacity>
          <Text style={[styles.avatarHint, { color: theme.textSecondary }]}>
            Tap to change photo
          </Text>
        </View>

        {/* Basic Info */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Basic Information</Text>

          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: theme.text }]}>Display Name</Text>
            <TextInput
              style={[
                styles.input,
                { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border },
              ]}
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="Your name"
              placeholderTextColor={theme.textSecondary}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: theme.text }]}>Bio</Text>
            <TextInput
              style={[
                styles.input,
                styles.textArea,
                { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border },
              ]}
              value={bio}
              onChangeText={setBio}
              placeholder="Tell us about yourself"
              placeholderTextColor={theme.textSecondary}
              multiline
              numberOfLines={4}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: theme.text }]}>Email</Text>
            <TextInput
              style={[
                styles.input,
                { backgroundColor: theme.border, color: theme.textSecondary, borderColor: theme.border },
              ]}
              value={user.email}
              editable={false}
            />
            <Text style={[styles.hint, { color: theme.textSecondary }]}>
              Email cannot be changed
            </Text>
          </View>

          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: theme.text }]}>Website</Text>
            <TextInput
              style={[
                styles.input,
                { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border },
              ]}
              value={website}
              onChangeText={setWebsite}
              placeholder="https://yourwebsite.com"
              placeholderTextColor={theme.textSecondary}
              keyboardType="url"
              autoCapitalize="none"
            />
          </View>
        </View>

        {/* Theme */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Appearance</Text>

          <View style={styles.themeButtons}>
            <TouchableOpacity
              style={[
                styles.themeButton,
                {
                  backgroundColor: theme.surface,
                  borderColor: selectedTheme === 'light' ? theme.primary : theme.border,
                  borderWidth: selectedTheme === 'light' ? 2 : 1,
                },
              ]}
              onPress={() => setSelectedTheme('light')}
            >
              <Ionicons name="sunny" size={24} color={theme.text} />
              <Text style={[styles.themeButtonText, { color: theme.text }]}>Light</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.themeButton,
                {
                  backgroundColor: theme.surface,
                  borderColor: selectedTheme === 'dark' ? theme.primary : theme.border,
                  borderWidth: selectedTheme === 'dark' ? 2 : 1,
                },
              ]}
              onPress={() => setSelectedTheme('dark')}
            >
              <Ionicons name="moon" size={24} color={theme.text} />
              <Text style={[styles.themeButtonText, { color: theme.text }]}>Dark</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Social Links */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Social Links</Text>

          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: theme.text }]}>Twitter</Text>
            <View style={styles.socialInputContainer}>
              <Ionicons name="logo-twitter" size={20} color="#1DA1F2" style={styles.socialIcon} />
              <TextInput
                style={[
                  styles.input,
                  styles.socialInput,
                  { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border },
                ]}
                value={socialLinks.twitter}
                onChangeText={text => setSocialLinks({ ...socialLinks, twitter: text })}
                placeholder="@username"
                placeholderTextColor={theme.textSecondary}
                autoCapitalize="none"
              />
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: theme.text }]}>Instagram</Text>
            <View style={styles.socialInputContainer}>
              <Ionicons name="logo-instagram" size={20} color="#E4405F" style={styles.socialIcon} />
              <TextInput
                style={[
                  styles.input,
                  styles.socialInput,
                  { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border },
                ]}
                value={socialLinks.instagram}
                onChangeText={text => setSocialLinks({ ...socialLinks, instagram: text })}
                placeholder="@username"
                placeholderTextColor={theme.textSecondary}
                autoCapitalize="none"
              />
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: theme.text }]}>YouTube</Text>
            <View style={styles.socialInputContainer}>
              <Ionicons name="logo-youtube" size={20} color="#FF0000" style={styles.socialIcon} />
              <TextInput
                style={[
                  styles.input,
                  styles.socialInput,
                  { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border },
                ]}
                value={socialLinks.youtube}
                onChangeText={text => setSocialLinks({ ...socialLinks, youtube: text })}
                placeholder="Channel URL"
                placeholderTextColor={theme.textSecondary}
                autoCapitalize="none"
              />
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: theme.text }]}>LinkedIn</Text>
            <View style={styles.socialInputContainer}>
              <Ionicons name="logo-linkedin" size={20} color="#0077B5" style={styles.socialIcon} />
              <TextInput
                style={[
                  styles.input,
                  styles.socialInput,
                  { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border },
                ]}
                value={socialLinks.linkedin}
                onChangeText={text => setSocialLinks({ ...socialLinks, linkedin: text })}
                placeholder="Profile URL"
                placeholderTextColor={theme.textSecondary}
                autoCapitalize="none"
              />
            </View>
          </View>
        </View>

        {/* Privacy Settings */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Privacy</Text>

          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: theme.text }]}>Contact Preferences</Text>
            <View style={styles.radioGroup}>
              {['public', 'private', 'friends'].map(option => (
                <TouchableOpacity
                  key={option}
                  style={[
                    styles.radioOption,
                    {
                      backgroundColor: theme.surface,
                      borderColor: contactPreferences === option ? theme.primary : theme.border,
                      borderWidth: contactPreferences === option ? 2 : 1,
                    },
                  ]}
                  onPress={() => setContactPreferences(option as any)}
                >
                  <Text style={[styles.radioText, { color: theme.text }]}>
                    {option.charAt(0).toUpperCase() + option.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: theme.text }]}>Profile Visibility</Text>
            <View style={styles.radioGroup}>
              {['everyone', 'friends', 'private'].map(option => (
                <TouchableOpacity
                  key={option}
                  style={[
                    styles.radioOption,
                    {
                      backgroundColor: theme.surface,
                      borderColor: privacySettings === option ? theme.primary : theme.border,
                      borderWidth: privacySettings === option ? 2 : 1,
                    },
                  ]}
                  onPress={() => setPrivacySettings(option as any)}
                >
                  <Text style={[styles.radioText, { color: theme.text }]}>
                    {option.charAt(0).toUpperCase() + option.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: theme.primary }]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>Save Changes</Text>
          )}
        </TouchableOpacity>

        <View style={styles.bottomSpacing} />
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
  avatarSection: {
    alignItems: 'center',
    marginBottom: 32,
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
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  avatarHint: {
    fontSize: 14,
    marginTop: 8,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    height: 50,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    borderWidth: 1,
  },
  textArea: {
    height: 100,
    paddingTop: 12,
    textAlignVertical: 'top',
  },
  hint: {
    fontSize: 12,
    marginTop: 4,
  },
  themeButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  themeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  themeButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  socialInputContainer: {
    position: 'relative',
  },
  socialIcon: {
    position: 'absolute',
    left: 16,
    top: 15,
    zIndex: 1,
  },
  socialInput: {
    paddingLeft: 48,
  },
  radioGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  radioOption: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  radioText: {
    fontSize: 14,
    fontWeight: '600',
  },
  saveButton: {
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  bottomSpacing: {
    height: 32,
  },
});
