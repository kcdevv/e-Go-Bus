import { Animated } from 'react-native';

const animateRotation = (rotateAnim, busHeading) => {
  Animated.timing(rotateAnim, {
    toValue: busHeading,
    duration: 500,
    useNativeDriver: true,
  }).start();
};

export default animateRotation;
