import React, { useEffect, useRef } from 'react';
import { Animated, Easing } from 'react-native';
import Svg, { Path } from 'react-native-svg';

const AnimatedPath = Animated.createAnimatedComponent(Path);

export default function WaveBackgroundTop() {
  const wave1Opacity = useRef(new Animated.Value(1)).current;
  const wave2Opacity = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(wave1Opacity, {
          toValue: 0.3,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(wave1Opacity, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(wave2Opacity, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(wave2Opacity, {
          toValue: 0.5,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <Svg 
      width="100%" 
      height="250" 
      viewBox="0 0 1440 690" 
      preserveAspectRatio="none"
    >
      <AnimatedPath
        d="M 0,700 L 0,325 C 119.17857142857142,359.7678571428571 238.35714285714283,394.5357142857143 344,378 
        C 449.64285714285717,361.4642857142857 541.7500000000001,293.625 665,263 
        C 788.2499999999999,232.375 942.6428571428571,238.96428571428572 1077,218 
        C 1211.357142857143,197.03571428571428 1325.6785714285716,148.51785714285714 1440,100 L 1440,700 L 0,700 Z"
        fill="#8ed1fc"
        opacity={wave1Opacity}
        transform="rotate(-180 720 350)"
      />
      
      <AnimatedPath
        d="M 0,700 L 0,558 C 107.64285714285714,539.0178571428571 215.28571428571428,520.0357142857143 334,531 
        C 452.7142857142857,541.9642857142857 582.5,582.875 709,540 C 835.5,497.125 958.7142857142858,370.4642857142857 1080,322 
        C 1201.2857142857142,273.5357142857143 1320.642857142857,303.2678571428571 1440,333 L 1440,700 L 0,700 Z"
        fill="#75c1f0"
        opacity={wave2Opacity}
        transform="rotate(-180 720 350)"
      />
    </Svg>
  );
}