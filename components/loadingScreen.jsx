import React, {useEffect, useRef} from 'react';
import {View, Text, StyleSheet, Animated} from 'react-native';
import {Color as Colours} from '../constants/colors'

export default function LoadingScreen({progress}) {
    const progressAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(progressAnim, {
            toValue: progress,
            duration: 300,
            useNativeDriver: false
        }).start()
    }, [progress])

    const width = progressAnim.interpolate({
        inputRange: [0, 100],
        outputRange: ['0%', '100%']
    });

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Loading your data...</Text>

            <View style={styles.progressBarContainer}>
                <Animated.View style={[styles.progressBar, {width}]}/>
            </View>

            <Text style={styles.percentage}>{Math.round(progress)}%</Text>
        </View>
    )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 40,
  },

  title: {
    fontSize: 20,
    fontWeight: '600',
    color: Colours.defaultText,
    marginBottom: 30,
  },

  progressBarContainer: {
    width: '100%',
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
  },

  progressBar: {
    height: '100%',
    backgroundColor: Colours.primary,
    borderRadius: 4,
  },
  
  percentage: {
    fontSize: 16,
    fontWeight: '600',
    color: Colours.primary,
    marginTop: 15,
  },
});