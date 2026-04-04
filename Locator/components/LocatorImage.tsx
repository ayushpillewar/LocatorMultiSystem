import React from 'react';
import { ImageBackground, View, Text, StyleSheet } from 'react-native';

export default function LocatorImage() {
  return (
    <ImageBackground
      source={require('@/assets/images/login-bg.png')}
      style={styles.background}
      resizeMode="cover"
    >
      <View style={styles.overlay} />
      <View style={styles.content}>
        <Text style={styles.appName}>LOCATOR</Text>
        <Text style={styles.tagline}>Made with ❤️ in India</Text>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  appName: {
    fontSize: 52,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 10,
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  tagline: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '500',
    letterSpacing: 1,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
});
