import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Slot} from "expo-router";
import * as SystemUI from 'expo-system-ui';
SystemUI.setBackgroundColorAsync('transparent');

export default function App() {
  return (
    
    <GestureHandlerRootView style={styles.container}>
      <Slot />
      <StatusBar style="auto" />
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});
