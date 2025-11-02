import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Modal, ScrollView, Switch, Image, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../../context/AuthContext';
import { deleteAccount, uploadProfilePicture, updateUserProfile} from '../../../firebase/firebaseService';
import LoadingScreen from '../../../components/loadingScreen';
import { useTheme } from "../../../context/ThemeContext";
import { signOut, EmailAuthProvider, reauthenticateWithCredential, updatePassword } from "firebase/auth";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from "../../../firebase/config";
import ToastAlert from "../../../toastAlert";
import * as Clipboard from "expo-clipboard";

export default function SettingsScreen() {
  const { user, userData, loading } = useAuth();
  const { theme, isDarkMode, themePreference, setThemePreference } = useTheme();
  
  const [userName, setUserName] = useState(userData?.name || '');
  const [userEmail, setUserEmail] = useState(user?.email || '');
  const [profilePicture, setProfilePicture] = useState(userData?.profilePicture || null);

  useEffect(() => {
    if (userData) {
      setUserName(userData.name || '');
      setProfilePicture(userData.profilePicture || null);
    }
  }, [userData]);

  useEffect(() => {
    if (user) {
      setUserEmail(user.email || '');
    }
  }, [user]);

  useEffect(() => {
    loadNotificationPreference();
  }, []);

  const loadNotificationPreference = async () => {
    try {
      const saved = await AsyncStorage.getItem(`notificationsEnabled_${user.uid}`);
      if (saved !== null) {
        setNotificationsEnabled(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Error loading notification preference:', error);
    }
  };

  const handleToggleNotifications = async (value) => {
    try {
      setNotificationsEnabled(value);
      await AsyncStorage.setItem(`notificationsEnabled_${user.uid}`, JSON.stringify(value));
      
      if (value) {
        showAlertText('Notifications enabled');
      } else {
        showAlertText('Notifications disabled');
      }
    } catch (error) {
      console.error('Error saving notification preference:', error);
      showAlertText('Failed to update notification settings');
    }
  };
    
  const [showNameModal, setShowNameModal] = useState(false);
  const [tempName, setTempName] = useState(userName);
  const [uploading, setUploading] = useState(false);

  const [showEmailModal, setShowEmailModal] = useState(false);
  const [tempEmail, setTempEmail] = useState(userEmail);
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');

  const [showHelpModal, setShowHelpModal] = useState(false);

  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  const [showPasswordModalChange, setShowPasswordModalChange] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showThemeModal, setShowThemeModal] = useState(false);

  const showAlertText = (message) => {
    setAlertMessage(message);
    setAlertVisible(true);
  };

  if (loading) {
    return <LoadingScreen progress={50} />;
  }

  const pickImage = async () => {
    Alert.alert(
    "Coming Soon",
    "Profile picture uploads will be available in a future update! 🚀"
    );
    return;
    // try {
    //   const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
    //   if (status !== 'granted') {
    //     Alert.alert('Permission needed', 'Please allow access to your photos to change your profile picture.');
    //     return;
    //   }

    //   const result = await ImagePicker.launchImageLibraryAsync({
    //     mediaTypes: ['images'],
    //     allowsEditing: true,
    //     aspect: [1, 1],
    //     quality: 0.5,
    //   });

    //   if (!result.canceled && result.assets[0]) {
    //     await handleImageUpload(result.assets[0].uri);
    //   }
    // } catch (error) {
    //   console.error('Error picking image:', error);
    //   showAlertText('Failed to select image');
    // }
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
        showAlertText(result.error || 'Failed to update profile picture');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      showAlertText(error.message || 'Failed to upload image');
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

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword) {
      showAlertText("Please fill in all fields");
      return;
    }

    if (newPassword !== confirmPassword) {
      showAlertText("New passwords do not match");
      return;
    }

    try {
      const credential = EmailAuthProvider.credential(user.email, currentPassword);

      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);

      showAlertText("Password updated successfully!");
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');

    } catch (error) {
      console.error(error);
      if (error.code === 'auth/wrong-password') {
        showAlertText("Current password is incorrect");
      } else if (error.code === 'auth/weak-password') {
        showAlertText("Password is too weak (min 6 characters)");
      } else {
        showAlertText(error.message);
      }
    }
  }

  const getThemeDisplayText = () => {
    if (themePreference === 'system') return 'System Default';
    if (themePreference === 'dark') return 'Dark Mode';
    return 'Light Mode';
  };

  const SettingsSection = ({ title, children }) => (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: theme.grayText }]}>{title}</Text>
      <View style={[styles.sectionContent, { backgroundColor: theme.surface }]}>{children}</View>
    </View>
  );

  const SettingsItem = ({ icon, title, subtitle, onPress, showArrow = true, rightComponent }) => (
     <TouchableOpacity style={[styles.settingsItem, { borderBottomColor: theme.surfaceBorder }]} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.settingsItemLeft}>
        <View style={[styles.iconContainer, { backgroundColor: `${theme.primary}15` }]}>
          <Ionicons name={icon} size={24} color={theme.primary} />
        </View>
        <View style={styles.settingsItemText}>
          <Text style={[styles.settingsItemTitle, { color: theme.defaultText }]}>{title}</Text>
          {subtitle && <Text style={[styles.settingsItemSubtitle, { color: theme.grayText }]}>{subtitle}</Text>}
        </View>
      </View>
      {rightComponent || (showArrow && (
        <Ionicons name="chevron-forward" size={20} color={theme.grayText} />
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

  const copyCode = (code) => {
    Clipboard.setStringAsync(code);
  }

  return (
    <View style={[styles.container, {backgroundColor: theme.background}]}>
      <ScrollView showsVerticalScrollIndicator={false}>

        <View style={[styles.topHeader, { backgroundColor: theme.surface, borderBottomColor: theme.surfaceBorder }]}>
          <Ionicons name="settings-outline" color={theme.primary} size={40}></Ionicons>
          <Text style={[styles.topHeaderText, { color: theme.defaultText }]}>Settings</Text>
        </View>

        <View style={[styles.profileCard, {backgroundColor: theme.surface,}]}>
          <TouchableOpacity style={styles.profilePictureWrapper} onPress={pickImage}disabled={uploading}>
            {profilePicture ? (
              <Image source={{ uri: profilePicture }} style={[styles.profilePicture, { borderColor: theme.primary }]} />
            ) : (
              <View style={[styles.profilePicturePlaceholder, { borderColor: theme.primary, backgroundColor: theme.surfaceBorder }]}>
                <Ionicons name="person" size={50} color={theme.grayText} />
              </View>
            )}
            <View style={[styles.editBadge, { backgroundColor: theme.primary, borderColor: theme.surface }]}>
              {uploading ? (
                <ActivityIndicator size="small" color={theme.primaryText} />
              ) : (
                <Ionicons name="camera" size={16} color={theme.primaryText} />
              )}
            </View>
          </TouchableOpacity>
          
          <View style={styles.profileInfo}>
            <Text style={[styles.profileName, { color: theme.defaultText }]}>{userName}</Text>
            <Text style={[styles.profileEmail, { color: theme.grayText }]}>{userEmail}</Text>
          </View>

          <TouchableOpacity 
            style={[styles.editProfileButton, { backgroundColor: `${theme.primary}15` }]}
            onPress={() => setShowNameModal(true)}
          >
            <Text style={[styles.editProfileButtonText, { color: theme.primary }]}>Edit Profile</Text>
            <Ionicons name="create-outline" size={18} color={theme.primary} />
          </TouchableOpacity>
        </View>

        <SettingsSection title="Account">
          <SettingsItem icon="person-outline" title="Change Name" subtitle={userName} onPress={() => setShowNameModal(true)}/>
          <SettingsItem icon="mail-outline" title="Email" subtitle={userEmail} showArrow={false}/>
          <SettingsItem icon="key-outline" title="Change Password" onPress={() => setShowPasswordModalChange(true)}/>
          <SettingsItem icon="image-outline" title="Change Profile Picture" onPress={pickImage}/>
        </SettingsSection>

        <SettingsSection title="Preferences">
          <SettingsItem icon="notifications-outline"title="Notifications"subtitle="Push notifications for tasks"showArrow={false}rightComponent={<Switch value={notificationsEnabled} onValueChange={handleToggleNotifications} trackColor={{ false: '#ddd', true: theme.primary }} thumbColor={theme.primaryText}/>}/>
          <SettingsItem  icon={isDarkMode ? "moon" : "sunny"} title="Theme" subtitle={getThemeDisplayText()}
            onPress={() => setShowThemeModal(true)}/>  
        </SettingsSection>

        <SettingsSection title="About">
          <SettingsItem icon="information-circle-outline" title="About App" subtitle="Version 1.0.0" onPress={() => setShowAboutModal(true)}/>
          <SettingsItem icon="help-circle-outline" title="Help & Support" onPress={() => setShowHelpModal(true)}/>
          <SettingsItem icon="shield-checkmark-outline" title="Privacy Policy" onPress={() => setShowPrivacyModal(true)}/>
        </SettingsSection>

        <SettingsSection title="Danger Zone">
          <SettingsItem icon="log-out-outline" title="Logout" onPress={() => {handleLogout()}}/>
          <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteAccountPress}>
            <Ionicons name="trash-outline" size={20} color={theme.primaryText} />
            <Text style={[styles.deleteButtonText, { color: theme.primaryText }]}>Delete Account</Text>
          </TouchableOpacity>
        </SettingsSection>

        <View style={{ height: 40 }} />
      </ScrollView>

      <Modal visible={showNameModal} animationType="fade" transparent={true} onRequestClose={() => setShowNameModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { backgroundColor: theme.surface }]}>
            <TouchableOpacity style={[styles.modalClose, { backgroundColor: theme.primary }]} onPress={() => setShowNameModal(false)}>
              <Ionicons name="close-circle" size={28} color="white" />
            </TouchableOpacity>

            <Text style={[styles.modalTitle, { color: theme.defaultText }]}>Change Name</Text>
            <Text style={[styles.modalSubtitle, { color: theme.grayText }]}>Enter your new display name</Text>

            <TextInput 
              style={[styles.nameInput, { backgroundColor: theme.background, borderColor: theme.surfaceBorder, color: theme.defaultText }]} value={tempName} onChangeText={setTempName} placeholder="Enter your name" placeholderTextColor={theme.grayText}/>

            <TouchableOpacity style={[styles.saveButton, { backgroundColor: theme.primary }]} onPress={handleSaveName}>
              <Text style={[styles.saveButtonText, { color: theme.primaryText }]}>Save Changes</Text>
              <Ionicons name="checkmark-circle" size={20} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={showThemeModal} animationType="fade" transparent={true} onRequestClose={() => setShowThemeModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { backgroundColor: theme.surface }]}>
            <TouchableOpacity style={[styles.modalClose, { backgroundColor: theme.primary }]} onPress={() => setShowThemeModal(false)}>
              <Ionicons name="close-circle" size={28} color="white" />
            </TouchableOpacity>

            <Text style={[styles.modalTitle, { color: theme.defaultText }]}>Choose Theme</Text>
            <Text style={[styles.modalSubtitle, { color: theme.grayText }]}>Select your preferred theme</Text>

            <View style={styles.themeOptions}>
              <TouchableOpacity 
                style={[
                  styles.themeOption, 
                  { 
                    backgroundColor: theme.background, 
                    borderColor: themePreference === 'light' ? theme.primary : theme.surfaceBorder,
                    borderWidth: themePreference === 'light' ? 2 : 1
                  }
                ]} 
                onPress={() => {
                  setThemePreference('light');
                  setShowThemeModal(false);
                  showAlertText('Theme changed to Light Mode');
                }}
              >
                <Ionicons name="sunny" size={32} color={theme.primary} />
                <Text style={[styles.themeOptionText, { color: theme.defaultText }]}>Light</Text>
                {themePreference === 'light' && (
                  <Ionicons name="checkmark-circle" size={20} color={theme.primary} style={styles.checkmark} />
                )}
              </TouchableOpacity>

              <TouchableOpacity 
                style={[
                  styles.themeOption, 
                  { 
                    backgroundColor: theme.background, 
                    borderColor: themePreference === 'dark' ? theme.primary : theme.surfaceBorder,
                    borderWidth: themePreference === 'dark' ? 2 : 1
                  }
                ]} 
                onPress={() => {
                  setThemePreference('dark');
                  setShowThemeModal(false);
                  showAlertText('Theme changed to Dark Mode');
                }}
              >
                <Ionicons name="moon" size={32} color={theme.primary} />
                <Text style={[styles.themeOptionText, { color: theme.defaultText }]}>Dark</Text>
                {themePreference === 'dark' && (
                  <Ionicons name="checkmark-circle" size={20} color={theme.primary} style={styles.checkmark} />
                )}
              </TouchableOpacity>

              <TouchableOpacity 
                style={[
                  styles.themeOption, 
                  { 
                    backgroundColor: theme.background, 
                    borderColor: themePreference === 'system' ? theme.primary : theme.surfaceBorder,
                    borderWidth: themePreference === 'system' ? 2 : 1
                  }
                ]} 
                onPress={() => {
                  setThemePreference('system');
                  setShowThemeModal(false);
                  showAlertText('Theme set to System Default');
                }}
              >
                <Ionicons name="phone-portrait-outline" size={32} color={theme.primary} />
                <Text style={[styles.themeOptionText, { color: theme.defaultText }]}>System</Text>
                {themePreference === 'system' && (
                  <Ionicons name="checkmark-circle" size={20} color={theme.primary} style={styles.checkmark} />
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showAboutModal} animationType="fade" transparent={true} onRequestClose={() => setShowAboutModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { backgroundColor: theme.surface }]}>
            <TouchableOpacity style={[styles.modalClose, { backgroundColor: theme.primary }]} onPress={() => setShowAboutModal(false)}>
              <Ionicons name="close-circle" size={28} color="white" />
            </TouchableOpacity>

            <View style={styles.aboutContent}>
              <View style={[styles.appIconLarge, { backgroundColor: `${theme.primary}15` }]}>
                <Ionicons name="checkmark-done-circle" size={60} color={theme.primary} />
              </View>
              <Text style={[styles.aboutTitle, { color: theme.defaultText }]}>TaskFlow</Text>
              <Text style={[styles.aboutVersion, { color: theme.grayText }]}>Version 1.0.0</Text>
              <Text style={[styles.aboutDescription, { color: theme.grayText }]}>
                A modern task management app designed to help you stay organized and productive.
              </Text>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showPasswordModal} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { backgroundColor: theme.surface }]}>
            <Text style={[styles.modalTitle, { color: theme.defaultText }]}>Confirm Delete</Text>
            <Text style={[styles.modalSubtitle, { color: theme.grayText }]}>
              Enter your password to permanently delete your account
            </Text>
            
            <TextInput 
              placeholder="Password" 
              placeholderTextColor={theme.grayText} 
              secureTextEntry 
              value={deletePassword} 
              onChangeText={setDeletePassword}
              style={[styles.nameInput, { backgroundColor: theme.background, borderColor: theme.surfaceBorder, color: theme.defaultText }]}
            />

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 10 }}>
              <TouchableOpacity 
                style={[styles.saveButton, { flex: 1, backgroundColor: '#999' }]}
                onPress={() => setShowPasswordModal(false)}
              >
                <Text style={[styles.saveButtonText, { color: theme.primaryText }]}>Cancel</Text>
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
                <Text style={[styles.saveButtonText, { color: theme.primaryText }]}>Delete Forever</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showPasswordModalChange} animationType="fade" transparent onRequestClose={() => setShowPasswordModalChange(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { backgroundColor: theme.surface }]}>
            <TouchableOpacity style={[styles.modalClose, { backgroundColor: theme.primary }]} onPress={() => setShowPasswordModalChange(false)}>
              <Ionicons name="close-circle" size={28} color="white" />
            </TouchableOpacity>

            <Text style={[styles.modalTitle, { color: theme.defaultText }]}>Change Password</Text>
            <TextInput 
              placeholder="Current Password" 
              placeholderTextColor={theme.grayText} 
              secureTextEntry 
              value={currentPassword} 
              onChangeText={setCurrentPassword}
              style={[styles.nameInput, { backgroundColor: theme.background, borderColor: theme.surfaceBorder, color: theme.defaultText }]}
            />
            <TextInput 
              placeholder="New Password" 
              placeholderTextColor={theme.grayText} 
              secureTextEntry 
              value={newPassword} 
              onChangeText={setNewPassword} 
              style={[styles.nameInput, { backgroundColor: theme.background, borderColor: theme.surfaceBorder, color: theme.defaultText }]}
            />
            <TextInput 
              placeholder="Confirm New Password" 
              placeholderTextColor={theme.grayText} 
              secureTextEntry 
              value={confirmPassword} 
              onChangeText={setConfirmPassword} 
              style={[styles.nameInput, { backgroundColor: theme.background, borderColor: theme.surfaceBorder, color: theme.defaultText }]}
            />

            <TouchableOpacity style={[styles.saveButton, { backgroundColor: theme.primary }]} onPress={handleChangePassword}>
              <Text style={[styles.saveButtonText, { color: theme.primaryText }]}>Save Changes</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={showHelpModal} animationType='fade' transparent onRequestClose={() => setShowHelpModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { paddingVertical: 30, paddingHorizontal: 25, backgroundColor: theme.surface }]}>
            <TouchableOpacity style={[styles.modalClose, { backgroundColor: theme.primary }]} onPress={() => setShowHelpModal(false)}>
              <Ionicons name="close-circle" size={30} color="white" />
            </TouchableOpacity>

            <View style={styles.helpContent}>
              <Ionicons name="help-circle-outline" size={60} color={theme.primary} style={{ alignSelf: "center", marginBottom: 15 }}/>
              <Text style={[styles.helpTitle, { color: theme.primary }]}>Need Help?</Text>
              <Text style={[styles.helpSubtitle, { color: theme.grayText }]}>
                Feel free to reach out anytime — we're happy to assist you!
              </Text>

              <View style={[styles.helpCard, { backgroundColor: theme.surfaceBorder }]}>
                <View style={[styles.iconWrapper, { backgroundColor: theme.primary }]}>
                  <Ionicons name="mail-open-outline" size={26} color={theme.primaryText} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.helpLabel, { color: theme.primary }]}>Email</Text>
                  <TouchableOpacity onPress={() => copyCode("sabareesanthirukumaran@gmail.com")}>
                    <Text style={[styles.helpLink, { color: theme.defaultText }]}>sabareesanthirukumaran@gmail.com</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={[styles.helpCard, { backgroundColor: theme.surfaceBorder }]}>
                <View style={[styles.iconWrapper, { backgroundColor: theme.primary }]}>
                  <Ionicons name="git-network-outline" size={26} color={theme.primaryText} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.helpLabel, { color: theme.primary }]}>Website</Text>
                  <TouchableOpacity onPress={() => copyCode("https://github.com/SabareesanThirukumaran")}>
                    <Text style={[styles.helpLink, { color: theme.defaultText }]}>github.com/SabareesanThirukumaran</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showPrivacyModal} animationType='fade' transparent onRequestClose={() => setShowPrivacyModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { maxHeight: "80%", paddingHorizontal: 20, paddingTop: 30, backgroundColor: theme.surface }]}>
            <TouchableOpacity style={[styles.modalClose, { backgroundColor: theme.primary }]} onPress={() => setShowPrivacyModal(false)}>
              <Ionicons name="close-circle" size={30} color="white" />
            </TouchableOpacity>

            <View style={styles.privacyHeader}>
              <Ionicons name="shield-checkmark-outline" size={50} color={theme.primary} />
              <Text style={[styles.privacyTitle, { color: theme.primary }]}>Privacy Policy</Text>
              <Text style={[styles.privacySubtitle, { color: theme.grayText }]}>We value your trust. Here is how we protect your data.</Text>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingVertical: 10 }}>
              <Text style={[styles.policySectionTitle, { color: theme.primary }]}>1. Data Collection</Text>
              <Text style={[styles.policyText, { color: theme.defaultText }]}>
                We collect minimal information necessary to provide you with the best experience,
                including your name, email address, and any data related to your tasks or preferences.
              </Text>

              <Text style={[styles.policySectionTitle, { color: theme.primary }]}>2. Data Usage</Text>
              <Text style={[styles.policyText, { color: theme.defaultText }]}>
                Your data is used solely to enhance app functionality — for example, syncing tasks,
                improving performance, and enabling personalized features.
              </Text>

              <Text style={[styles.policySectionTitle, { color: theme.primary }]}>3. Data Sharing</Text>
              <Text style={[styles.policyText, { color: theme.defaultText }]}>
                We never sell or rent your personal information. We may share anonymous analytics to
                understand app performance and usage patterns.
              </Text>

              <Text style={[styles.policySectionTitle, { color: theme.primary }]}>4. Account & Security</Text>
              <Text style={[styles.policyText, { color: theme.defaultText }]}>
                You can delete your account at any time. All associated data will be permanently removed
                from our servers. We follow strict security measures to prevent unauthorized access.
              </Text>

              <Text style={[styles.policySectionTitle, { color: theme.primary }]}>5. Updates</Text>
              <Text style={[styles.policyText, { color: theme.defaultText }]}>
                We may update this Privacy Policy occasionally. You will be notified about major changes
                via in-app messages or email.
              </Text>

              <Text style={[styles.policySectionTitle, { color: theme.primary }]}>6. Contact Us</Text>
              <Text style={[styles.policyText, { color: theme.defaultText }]}>
                If you have any concerns or questions, reach out at{" "}
                <TouchableOpacity onPress={() => copyCode("sabareesanthirukumaran@gmail.com")}>
                  <Text style={{ color: theme.primary, fontWeight: "600" }}>sabareesanthirukumaran@gmail.com.</Text>
                </TouchableOpacity>
              </Text>

              <TouchableOpacity style={[styles.acceptButton, { backgroundColor: theme.primary }]} onPress={() => setShowPrivacyModal(false)}>
                <Text style={[styles.acceptButtonText, { color: theme.primaryText }]}>Got it</Text>
                <Ionicons name="checkmark-circle" size={20} color="white" />
              </TouchableOpacity>
            </ScrollView>
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
  },
  
  header: {
    marginBottom: 20,
  },
  
  topHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 18,
    elevation: 4,
    borderBottomWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    zIndex: 10,
    marginBottom: 2,
  },

  topHeaderText: {
    fontWeight: "700",
    fontSize: 26,
    marginLeft: 10,
  },
  
  profileCard: {
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
  },
  
  profilePicturePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
  },
  
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    borderRadius: 15,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
  },
  
  profileInfo: {
    alignItems: 'center',
    marginBottom: 15,
  },
  
  profileName: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  
  profileEmail: {
    fontSize: 14,
  },
  
  editProfileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 25,
    gap: 8,
  },
  
  editProfileButtonText: {
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
    marginBottom: 12,
    marginLeft: 5,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  
  sectionContent: {
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
    marginBottom: 2,
  },
  
  settingsItemSubtitle: {
    fontSize: 13,
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
    textAlign: 'center',
    marginBottom: 8,
  },
  
  modalSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 25,
  },
  
  nameInput: {
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    borderWidth: 2,
    marginBottom: 20,
  },
  
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: 12,
    gap: 10,
  },
  
  saveButtonText: {
    fontSize: 17,
    fontWeight: '700',
  },

  themeOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 10,
  },

  themeOption: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    paddingHorizontal: 10,
    borderRadius: 15,
    position: 'relative',
  },

  themeOptionText: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '600',
  },

  checkmark: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  
  aboutContent: {
    alignItems: 'center',
    paddingTop: 20,
  },
  
  appIconLarge: {
    width: 100,
    height: 100,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  
  aboutTitle: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 5,
  },
  
  aboutVersion: {
    fontSize: 14,
    marginBottom: 15,
  },
  
  aboutDescription: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 25,
  },

  helpContent: {
    alignItems: "center",
    justifyContent: "center",
  },

  helpTitle: {
    fontSize: 26,
    fontWeight: "800",
    marginBottom: 8,
    textAlign: "center",
  },

  helpSubtitle: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 20,
  },

  helpCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 15,
    width: "100%",
    marginBottom: 15,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },

  iconWrapper: {
    width: 45,
    height: 45,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  helpLabel: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 2,
  },

  helpLink: {
    fontSize: 14,
    textDecorationLine: "underline",
  },

  privacyHeader: {
    alignItems: "center",
  },

  privacyTitle: {
    fontSize: 26,
    fontWeight: "800",
    marginTop: 10,
    textAlign: "center",
  },

  privacySubtitle: {
    fontSize: 14,
    textAlign: "center",
    marginTop: 4,
    lineHeight: 20,
    paddingHorizontal: 10,
  },

  policySectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginTop: 18,
    marginBottom: 5,
  },

  policyText: {
    fontSize: 14,
    lineHeight: 22,
    textAlign: "justify",
  },

  acceptButton: {
    flexDirection: "row",
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 25,
    gap: 8,
  },

  acceptButtonText: {
    fontSize: 15,
    fontWeight: "700",
  },
});