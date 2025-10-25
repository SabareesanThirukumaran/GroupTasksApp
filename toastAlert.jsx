import React, { useEffect } from 'react';
import {View, Text, Animated, StyleSheet} from "react-native";

export default function ToastAlert({message, visible, duration = 2000, onHide}) {
    const translateY = React.useRef(new Animated.Value(-100)).current;

    useEffect(() => {
        if (visible) {
            Animated.timing(translateY, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
            }).start();

            const timeOnDisplay = setTimeout(() => {
                Animated.timing(translateY, {
                    toValue: -100,
                    duration: 300,
                    useNativeDriver: true,
                }).start(() => {onHide();});
            }, duration);

            return () => clearTimeout(timeOnDisplay);
        }
    }, [visible]);

    if (!visible) return null;

    return (
        <Animated.View style={[styles.toastContainer, { transform: [{ translateY }] }]}>
            <Text style={styles.toastText}>{message}</Text>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
  toastContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: "#0F6EC6",
    padding: 12,
    zIndex: 1000,
    alignItems: "center",
  },
  
  toastText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
});
