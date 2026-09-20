import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';

const Skeleton = ({ height = 100, borderRadius = 20, style }) => {
  const blinkAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const blink = Animated.loop(
      Animated.sequence([
        Animated.timing(blinkAnim, {
          toValue: 1,
          duration: 700,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(blinkAnim, {
          toValue: 0,
          duration: 700,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    blink.start();
    return () => blink.stop();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const opacity = blinkAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.4, 1],
  });

  return (
    <View
      style={[
        styles.skeletonCard,
        { height, borderRadius },
        style,
      ]}
    >
      {/* BASE */}
      <View style={styles.base} />

      {/* BLINK WAVE */}
      <Animated.View
        style={[
          styles.wave,
          {
            opacity,
          },
        ]}
      />
    </View>
  );
};

export default Skeleton;

// Web skeleton colours: base --card #171B1B family (#1C2221) with a #27302E
// shimmer wave — no grey.
const styles = StyleSheet.create({
  skeletonCard: {
    backgroundColor: '#1C2221',
    marginBottom: 16,
    overflow: 'hidden',
  },
  base: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#1C2221',
  },
  wave: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#27302E',
  },
});
