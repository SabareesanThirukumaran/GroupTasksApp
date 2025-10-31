import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../firebase/config';
import { router } from 'expo-router';
import WaveBackgroundTop from '../../components/WaveBackgroundTop';
import WaveBackgroundBottom from "../../components/WaveBackgroundBottom"
import ToastAlert from '../../toastAlert';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const [alertVisible, setAlertVisible] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const showAlertText = (message) => {setAlertMessage(message); setAlertVisible(true);}

  const handleLogin = async () => {
    if (!email || !password) {
      showAlertText("Please fill in all fields")
      return;
    }

    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
        if (error.code === "auth/invalid-credential") {
          showAlertText("Login failed: Invalid email or password");
        } else if (error.code === "auth/user-not-found") {
          showAlertText("Login failed: No user found with that email");
        } else if (error.code === "auth/too-many-requests") {
          showAlertText("Too many attempts. Please try again later.");
        } else {
          showAlertText(`Login failed: ${error.message}`);
        }
    } finally {
      setLoading(false);
    }
  };

  return (
  <View style={styles.container}>
    <View style={styles.svgContainer}>
      <WaveBackgroundTop/>
    </View>

    <View style={styles.content}>
      <Text style={styles.title}>Welcome Back</Text>
      <Text style={styles.subtitle}>Login to your account</Text>
      
      <TextInput style={styles.input} placeholder="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address"/>
      
      <TextInput style={styles.input} placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry/>
      
      <TouchableOpacity style={[styles.button, loading && styles.buttonDisabled]}  onPress={handleLogin} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? 'Logging in...' : 'Login'}</Text>
      </TouchableOpacity>
      
      <TouchableOpacity onPress={() => router.push('/(auth)/signup')}>
        <Text style={styles.linkText}>Don't have an account? <Text style={styles.linkBold}>Sign up</Text></Text>
      </TouchableOpacity>
    </View>

    <View style={styles.svgContainerBottom}>
      <WaveBackgroundBottom/>
    </View>

    <ToastAlert message={alertMessage} visible={alertVisible} onHide={() => setAlertVisible(false)}/>
  </View>

);
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },

  svgContainer: {
    width: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },

  svgContainerBottom: {
    width: "100%",
    position: "absolute",
    bottom: 0,
    right: 0, 
    left: 0
  },

  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    paddingTop: 0,
  },

  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },

  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 30,
    textAlign: 'center',
  },

  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 15,
    marginBottom: 15,
    borderRadius: 8,
    fontSize: 16,
    backgroundColor: '#fff',
  },

  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    marginTop: 10,
  },

  buttonDisabled: {
    backgroundColor: '#ccc',
  },

  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
  },

  linkText: {
    marginTop: 20,
    textAlign: 'center',
    color: '#666',
  },

  linkBold: {
    color: '#007AFF',
    fontWeight: '600',
  },
});