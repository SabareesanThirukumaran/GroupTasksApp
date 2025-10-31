import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../firebase/config';
import { createUser, usernameTaken } from '../../firebase/firebaseService';
import ToastAlert from "../../toastAlert";
import { router } from 'expo-router';
import Svg, {Path} from 'react-native-svg';

export default function Signup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const [alertVisible, setAlertVisible] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const showAlertText = (message) => {setAlertMessage(message); setAlertVisible(true);}

  const handleSignup = async () => {
    if (!name || !email || !password || !confirmPassword) {
      showAlertText("Please fill in all the fields")
      return;
    }

    if (password !== confirmPassword) {
      showAlertText("Passwords do not match")
      return;
    }

    if (password.length < 6) {
      showAlertText("Passwords must be atleast 6 characters long")
      return;
    }

    if (!/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
      showAlertText("Passwords must include a capital letter and a number")
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(name)) {
      showAlertText("Usernames can only include letters, numbers, and underscores")
      return;
    }

    if (!emailRegex.test(email)) { 
      showAlertText("Please enter a valid email")
      return; 
    }

    const taken = await usernameTaken(name.trim().toLowerCase());
    if (taken) {
      showAlertText("Username is already taken. Please enter another one")
      return;
    }

    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      await createUser(userCredential.user.uid, {
        name: name,
        email: email,
      });

    } catch (error) {
      console.error(error);
      showAlertText(`Sign up failed : ${error}`)
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.svgContainer}>
        <Svg 
          width="100%" 
          height="200"
          viewBox="0 0 1440 690" 
          preserveAspectRatio="none"
        >
          <Path 
            d="M 0,700 L 0,325 C 119.17857142857142,359.7678571428571 238.35714285714283,394.5357142857143 344,378 
            C 449.64285714285717,361.4642857142857 541.7500000000001,293.625 665,263 
            C 788.2499999999999,232.375 942.6428571428571,238.96428571428572 1077,218 
            C 1211.357142857143,197.03571428571428 1325.6785714285716,148.51785714285714 1440,100 L 1440,700 L 0,700 Z" 
            fill="#8ed1fc" 
            fillOpacity="0.53"
            transform="rotate(-180 720 350)"
          />
          <Path 
            d="M 0,700 L 0,558 C 107.64285714285714,539.0178571428571 215.28571428571428,520.0357142857143 334,531 
            C 452.7142857142857,541.9642857142857 582.5,582.875 709,540 C 835.5,497.125 958.7142857142858,370.4642857142857 1080,322 
            C 1201.2857142857142,273.5357142857143 1320.642857142857,303.2678571428571 1440,333 L 1440,700 L 0,700 Z" 
            fill="#75c1f0"
            fillOpacity="1"
            transform="rotate(-180 720 350)"
          />
        </Svg>
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Sign up to get started</Text>
        
        <TextInput style={styles.input} placeholder="Full Name" value={name} onChangeText={setName}/>
        
        <TextInput style={styles.input} placeholder="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address"/>
        
        <TextInput style={styles.input} placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry/>
        
        <TextInput style={styles.input} placeholder="Confirm Password" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry/>
        
        <TouchableOpacity style={[styles.button, loading && styles.buttonDisabled]} onPress={handleSignup} disabled={loading}>
          <Text style={styles.buttonText}>{loading ? 'Creating Account...' : 'Sign Up'}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
          <Text style={styles.linkText}>Already have an account? <Text style={styles.linkBold}>Login</Text></Text>
        </TouchableOpacity>
      </View>

      <View style={styles.svgContainerBottom}>
        <Svg 
          width="100%" 
          height="250"
          viewBox="0 0 1440 690" 
          preserveAspectRatio="none"
        >
          <Path 
            d="M 0,700 L 0,325 C 119.17857142857142,359.7678571428571 238.35714285714283,394.5357142857143 344,378 
            C 449.64285714285717,361.4642857142857 541.7500000000001,293.625 665,263 
            C 788.2499999999999,232.375 942.6428571428571,238.96428571428572 1077,218 
            C 1211.357142857143,197.03571428571428 1325.6785714285716,148.51785714285714 1440,100 L 1440,700 L 0,700 Z" 
            fill="#8ed1fc" 
            fillOpacity="0.53"
          />
          <Path 
            d="M 0,700 L 0,558 C 107.64285714285714,539.0178571428571 215.28571428571428,520.0357142857143 334,531 
            C 452.7142857142857,541.9642857142857 582.5,582.875 709,540 C 835.5,497.125 958.7142857142858,370.4642857142857 1080,322 
            C 1201.2857142857142,273.5357142857143 1320.642857142857,303.2678571428571 1440,333 L 1440,700 L 0,700 Z" 
            fill="#75c1f0"
            fillOpacity="1"
          />
        </Svg>
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
    bottom: -25,
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