import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Modal, ScrollView, Switch, Image, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../../context/AuthContext';
import { deleteAccount, uploadProfilePicture, updateUserProfile} from '../../../firebase/firebaseService';
import LoadingScreen from '../../../components/loadingScreen';
import { Color as Colours } from '../../../constants/colors';
import { signOut } from "firebase/auth";
import { auth } from "../../../firebase/config";
import ToastAlert from "../../../toastAlert";

export default function SettingsScreen() {
  const { user, userData, loading } = useAuth();
  
  const [userName, setUserName] = useState(userData?.name || '');
  const [userEmail] = useState(user?.email || '');
  const [profilePicture, setProfilePicture] = useState(userData?.profilePicture || null);
  
  const [showNameModal, setShowNameModal] = useState(false);
  const [tempName, setTempName] = useState(userName);
  const [uploading, setUploading] = useState(false);
  
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');

  const showAlertText = (message) => {
    setAlertMessage(message);
    setAlertVisible(true);
  };

  if (loading) {
    return <LoadingScreen progress={50} />;
  }

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please allow access to your photos to change your profile picture.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
      });

      if (!result.canceled && result.assets[0]) {
        await handleImageUpload(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      showAlertText('Failed to select image');
    }
  };

  const handleImageUpload = async (uri) => {
    setUploading(true);
    try {
      const downloadURL = await uploadProfilePicture(user.uid, uri);
      
      const result = await updateUserProfile(user.uid, { profilePicture: downloadURL });
      
      if (result.success) {
        setProfilePicture(downloadURL);
        showAlertText('Profile picture updated successfully!');
      } else {
        showAlertText('Failed to update profile picture');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      showAlertText('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleSaveName = async () => {
    if (!tempName.trim()) {
      Alert.alert('Error', 'Name cannot be empty');
      return;
    }

    const result = await updateUserProfile(user.uid, { name: tempName.trim() });
    
    if (result.success) {
      setUserName(tempName.trim());
      setShowNameModal(false);
      showAlertText('Name updated successfully!');
    } else {
      showAlertText('Failed to update name');
    }
  };

  const SettingsSection = ({ title, children }) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionContent}>{children}</View>
    </View>
  );

  const SettingsItem = ({ icon, title, subtitle, onPress, showArrow = true, rightComponent }) => (
    <TouchableOpacity style={styles.settingsItem} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.settingsItemLeft}>
        <View style={styles.iconContainer}>
          <Ionicons name={icon} size={24} color={Colours.primary} />
        </View>
        <View style={styles.settingsItemText}>
          <Text style={styles.settingsItemTitle}>{title}</Text>
          {subtitle && <Text style={styles.settingsItemSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      {rightComponent || (showArrow && (
        <Ionicons name="chevron-forward" size={20} color={Colours.grayText} />
      ))}
    </TouchableOpacity>
  );

  const handleLogout = async () => {
    try {
      await signOut(auth);
      console.log("Logged out Successfully");
    } catch (error) {
      Alert.alert("Error", error.message)
    }
  }

  const handleDeleteAccountPress = () => {
    setDeletePassword('');
    setShowPasswordModal(true);
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>

        <View style={styles.topHeader}>
          <Ionicons name="checkmark-done" color={Colours.primary} size={40}></Ionicons>
          <Text style={styles.topHeaderText}>Tasks</Text>
        </View>

        <View style={styles.profileCard}>
          <TouchableOpacity style={styles.profilePictureWrapper} onPress={pickImage}disabled={uploading}>
            {profilePicture ? (
              <Image source={{ uri: profilePicture }} style={styles.profilePicture} />
            ) : (
              <View style={styles.profilePicturePlaceholder}>
                <Ionicons name="person" size={50} color={Colours.grayText} />
              </View>
            )}
            <View style={styles.editBadge}>
              {uploading ? (
                <ActivityIndicator size="small" color={Colours.primaryText} />
              ) : (
                <Ionicons name="camera" size={16} color={Colours.primaryText} />
              )}
            </View>
          </TouchableOpacity>
          
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{userName}</Text>
            <Text style={styles.profileEmail}>{userEmail}</Text>
          </View>

          <TouchableOpacity 
            style={styles.editProfileButton}
            onPress={() => setShowNameModal(true)}
          >
            <Text style={styles.editProfileButtonText}>Edit Profile</Text>
            <Ionicons name="create-outline" size={18} color={Colours.primary} />
          </TouchableOpacity>
        </View>

        <SettingsSection title="Account">
          <SettingsItem icon="person-outline" title="Change Name" subtitle={userName} onPress={() => setShowNameModal(true)}/>
          <SettingsItem icon="mail-outline" title="Email" subtitle={userEmail} onPress={() => setShowEmailModal(true)}/>
          <SettingsItem icon="key-outline" title="Change Password" onPress={() => {}}/>
          <SettingsItem icon="image-outline" title="Change Profile Picture"onPress={pickImage}/>
        </SettingsSection>

        <SettingsSection title="Preferences">
          <SettingsItem icon="notifications-outline"title="Notifications"subtitle="Push notifications for tasks"showArrow={false}rightComponent={<Switch value={notificationsEnabled} onValueChange={setNotificationsEnabled} trackColor={{ false: '#ddd', true: Colours.primary }} thumbColor={Colours.primaryText}/>}/>
        </SettingsSection>

        <SettingsSection title="About">
          <SettingsItem icon="information-circle-outline" title="About App" subtitle="Version 1.0.0" onPress={() => setShowAboutModal(true)}/>
          <SettingsItem icon="help-circle-outline" title="Help & Support" onPress={() => {}}/>
          <SettingsItem icon="shield-checkmark-outline" title="Privacy Policy" onPress={() => {}}/>
        </SettingsSection>

        <SettingsSection title="Danger Zone">
          <SettingsItem icon="log-out-outline" title="Logout" onPress={() => {handleLogout()}}/>
          <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteAccountPress}>
            <Ionicons name="trash-outline" size={20} color={Colours.primaryText} />
            <Text style={styles.deleteButtonText}>Delete Account</Text>
          </TouchableOpacity>
        </SettingsSection>

        <View style={{ height: 40 }} />
      </ScrollView>

      <Modal visible={showNameModal} animationType="fade" transparent={true} onRequestClose={() => setShowNameModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <TouchableOpacity style={styles.modalClose} onPress={() => setShowNameModal(false)}>
              <Ionicons name="close-circle" size={28} color="white" />
            </TouchableOpacity>

            <Text style={styles.modalTitle}>Change Name</Text>
            <Text style={styles.modalSubtitle}>Enter your new display name</Text>

            <TextInput style={styles.nameInput} value={tempName} onChangeText={setTempName} placeholder="Enter your name" placeholderTextColor={Colours.grayText}/>

            <TouchableOpacity style={styles.saveButton} onPress={handleSaveName}>
              <Text style={styles.saveButtonText}>Save Changes</Text>
              <Ionicons name="checkmark-circle" size={20} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={showAboutModal} animationType="fade" transparent={true} onRequestClose={() => setShowAboutModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <TouchableOpacity style={styles.modalClose} onPress={() => setShowAboutModal(false)}>
              <Ionicons name="close-circle" size={28} color="white" />
            </TouchableOpacity>

            <View style={styles.aboutContent}>
              <View style={styles.appIconLarge}>
                <Ionicons name="checkmark-done-circle" size={60} color={Colours.primary} />
              </View>
              <Text style={styles.aboutTitle}>TaskFlow</Text>
              <Text style={styles.aboutVersion}>Version 1.0.0</Text>
              <Text style={styles.aboutDescription}>
                A modern task management app designed to help you stay organized and productive.
              </Text>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showPasswordModal} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Confirm Delete</Text>
            <Text style={styles.modalSubtitle}>
              Enter your password to permanently delete your account
            </Text>
            
            <TextInput placeholder="Password" placeholderTextColor={Colours.grayText} secureTextEntry value={deletePassword} onChangeText={setDeletePassword}style={styles.nameInput}></TextInput>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 10 }}>
              <TouchableOpacity style={[styles.saveButton, { flex: 1, backgroundColor: '#999' }]}onPress={() => setShowPasswordModal(false)}>
                <Text style={styles.saveButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.saveButton, { flex: 1, backgroundColor: '#e53935' }]}
                onPress={async () => {
                  if (!deletePassword.trim()) {
                    showAlertText('Password is required');
                    return;
                  }
                  setShowPasswordModal(false);
                  setUploading(true);
                  try {
                    const result = await deleteAccount(user.uid, user.email, deletePassword.trim());
                    if (result.success) {
                      showAlertText('Account deleted successfully');
                      await signOut(auth);
                    } else {
                      showAlertText(`Failed: ${result.error}`);
                    }
                  } catch (error) {
                    console.error(error);
                    showAlertText('Unexpected error occurred');
                  } finally {
                    setUploading(false);
                  }
                }}
              >
                <Text style={styles.saveButtonText}>Delete Forever</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>


      <ToastAlert message={alertMessage} visible={alertVisible} onHide={() => setAlertVisible(false)} />
    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colours.background,
  },
  
  header: {
    marginBottom: 20,
  },
  
  // =========================
  // TOP HEADER
  // =========================
  topHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 18,
    backgroundColor: Colours.surface,
    elevation: 4,
    borderBottomColor: "#ffffff10",
    borderBottomWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    zIndex: 10,
    marginBottom: 2,
  },

  topHeaderText: {
    color: Colours.defaultText,
    fontWeight: "700",
    fontSize: 26,
    marginLeft: 10,
  },
  
  profileCard: {
    backgroundColor: Colours.surface,
    marginHorizontal: 20,
    marginTop: 10,
    borderRadius: 20,
    padding: 25,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  
  profilePictureWrapper: {
    position: 'relative',
    marginBottom: 15,
  },
  
  profilePicture: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: Colours.primary,
  },
  
  profilePicturePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: Colours.primary,
  },
  
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: Colours.primary,
    borderRadius: 15,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: Colours.surface,
  },
  
  profileInfo: {
    alignItems: 'center',
    marginBottom: 15,
  },
  
  profileName: {
    fontSize: 24,
    fontWeight: '700',
    color: Colours.defaultText,
    marginBottom: 4,
  },
  
  profileEmail: {
    fontSize: 14,
    color: Colours.grayText,
  },
  
  editProfileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${Colours.primary}15`,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 25,
    gap: 8,
  },
  
  editProfileButtonText: {
    color: Colours.primary,
    fontWeight: '600',
    fontSize: 15,
  },
  
  section: {
    marginTop: 25,
    paddingHorizontal: 20,
  },
  
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colours.grayText,
    marginBottom: 12,
    marginLeft: 5,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  
  sectionContent: {
    backgroundColor: Colours.surface,
    borderRadius: 15,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  
  settingsItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: `${Colours.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  
  settingsItemText: {
    flex: 1,
  },
  
  settingsItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colours.defaultText,
    marginBottom: 2,
  },
  
  settingsItemSubtitle: {
    fontSize: 13,
    color: Colours.grayText,
  },
  
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e53935',
    padding: 16,
    gap: 10,
  },
  
  deleteButtonText: {
    color: Colours.primaryText,
    fontWeight: '700',
    fontSize: 16,
  },
  
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  
  modalBox: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: Colours.surface,
    borderRadius: 25,
    padding: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  
  modalClose: {
    position: 'absolute',
    top: 15,
    right: 15,
    backgroundColor: Colours.primary,
    borderRadius: 20,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  
  modalTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: Colours.defaultText,
    textAlign: 'center',
    marginBottom: 8,
  },
  
  modalSubtitle: {
    fontSize: 14,
    color: Colours.grayText,
    textAlign: 'center',
    marginBottom: 25,
  },
  
  nameInput: {
    backgroundColor: Colours.background,
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    color: Colours.defaultText,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    marginBottom: 20,
  },
  
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colours.primary,
    paddingVertical: 15,
    borderRadius: 12,
    gap: 10,
  },
  
  saveButtonText: {
    color: Colours.primaryText,
    fontSize: 17,
    fontWeight: '700',
  },
  
  aboutContent: {
    alignItems: 'center',
    paddingTop: 20,
  },
  
  appIconLarge: {
    width: 100,
    height: 100,
    borderRadius: 25,
    backgroundColor: `${Colours.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  
  aboutTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: Colours.defaultText,
    marginBottom: 5,
  },
  
  aboutVersion: {
    fontSize: 14,
    color: Colours.grayText,
    marginBottom: 15,
  },
  
  aboutDescription: {
    fontSize: 15,
    color: Colours.grayText,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 25,
  },
});