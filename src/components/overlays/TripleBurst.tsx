import { Ionicons } from '@expo/vector-icons';
import { useEffect } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';

import { useAnimatedValue } from '../../lib/useAnimatedValue';

const PARTICLE_COUNT = 16;
const RADIUS = 130;

const COLORS = [
  '#FE2C55', // Douyin red
  '#25F4EE', // Douyin cyan
  '#FFD700', // Gold
  '#FFA500', // Orange
  '#FF69B4', // Pink
];

interface Particle {
  angle: number;
  color: string;
  size: number;
  icon: 'heart' | 'star' | 'sparkles';
}

interface TripleBurstProps {
  visible: boolean;
  onFinish?: () => void;
}

const STATIC_PARTICLES: Particle[] = Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
  angle: (i * 2 * Math.PI) / PARTICLE_COUNT + (Math.sin(i) * 0.2),
  color: COLORS[i % COLORS.length],
  size: 16 + (i % 3) * 6,
  icon: i % 3 === 0 ? 'heart' : i % 3 === 1 ? 'star' : 'sparkles',
}));

export function TripleBurst({ visible, onFinish }: TripleBurstProps) {
  const anim = useAnimatedValue(0);

  useEffect(() => {
    if (visible) {
      anim.setValue(0);
      Animated.sequence([
        Animated.timing(anim, {
          toValue: 1,
          duration: 1100,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start(() => {
        onFinish?.();
      });
    }
  }, [visible, anim, onFinish]);

  if (!visible) return null;

  const centerScale = anim.interpolate({
    inputRange: [0, 0.25, 0.7, 1],
    outputRange: [0.3, 1.25, 1, 0.85],
  });

  const centerOpacity = anim.interpolate({
    inputRange: [0, 0.15, 0.8, 1],
    outputRange: [0, 1, 1, 0],
  });

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <View style={styles.container}>
        {/* 四散粒子 */}
        {STATIC_PARTICLES.map((p, index) => {
          const translateX = anim.interpolate({
            inputRange: [0, 1],
            outputRange: [0, Math.cos(p.angle) * RADIUS * (0.8 + (index % 3) * 0.2)],
          });
          const translateY = anim.interpolate({
            inputRange: [0, 1],
            outputRange: [0, Math.sin(p.angle) * RADIUS * (0.8 + (index % 3) * 0.2)],
          });
          const particleScale = anim.interpolate({
            inputRange: [0, 0.3, 1],
            outputRange: [0.2, 1.2, 0.4],
          });
          const particleOpacity = anim.interpolate({
            inputRange: [0, 0.15, 0.7, 1],
            outputRange: [0, 1, 1, 0],
          });

          return (
            <Animated.View
              key={index}
              style={[
                styles.particle,
                {
                  transform: [{ translateX }, { translateY }, { scale: particleScale }],
                  opacity: particleOpacity,
                },
              ]}
            >
              <Ionicons name={p.icon} size={p.size} color={p.color} />
            </Animated.View>
          );
        })}

        {/* 核心中央大徽标 */}
        <Animated.View
          style={[
            styles.centerBadge,
            {
              transform: [{ scale: centerScale }],
              opacity: centerOpacity,
            },
          ]}
        >
          <View style={styles.badgeInner}>
            <Ionicons name="sparkles" size={32} color="#FFD700" />
            <Text style={styles.badgeText}>一键三连</Text>
            <Text style={styles.subBadgeText}>点赞 · 收藏 · 推荐</Text>
          </View>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  particle: {
    position: 'absolute',
  },
  centerBadge: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeInner: {
    backgroundColor: 'rgba(20, 20, 26, 0.92)',
    paddingHorizontal: 24,
    paddingVertical: 18,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: '#FFD700',
    alignItems: 'center',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 16,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    marginTop: 6,
    letterSpacing: 2,
  },
  subBadgeText: {
    color: 'rgba(255, 215, 0, 0.9)',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
});
