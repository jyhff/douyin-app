import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { VideoFeed } from '../components/feed/VideoFeed';
import { MY_WORKS, VIDEOS } from '../data/videos';
import type { Video } from '../data/types';
import { colors } from '../theme/tokens';

export default function FeedDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { initialVideoId } = useLocalSearchParams<{ initialVideoId?: string }>();

  const allVideos = useMemo(() => {
    // 聚合全部可能展示的视频（推荐流 + 我的作品）
    const map = new Map<string, Video>();
    [...VIDEOS, ...MY_WORKS].forEach((v) => map.set(v.id, v));
    const list = Array.from(map.values());

    if (!initialVideoId) return list;

    // 将 initialVideoId 对应的视频置顶为第一个
    const target = list.find((v) => v.id === initialVideoId);
    if (!target) return list;
    const others = list.filter((v) => v.id !== initialVideoId);
    return [target, ...others];
  }, [initialVideoId]);

  return (
    <View style={styles.screen}>
      <VideoFeed videos={allVideos} />

      {/* 顶部左上角悬浮返回按钮 */}
      <Pressable
        style={[styles.backBtn, { top: insets.top + 8 }]}
        onPress={() => router.back()}
        hitSlop={10}
        accessibilityRole="button"
        accessibilityLabel="返回"
      >
        <Ionicons name="chevron-back" size={28} color="#FFFFFF" style={styles.backIcon} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  backBtn: {
    position: 'absolute',
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 90,
  },
  backIcon: {
    textShadowColor: 'rgba(0, 0, 0, 0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
});
