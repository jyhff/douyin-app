import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getCreator } from '../data/creators';
import { VIDEOS } from '../data/videos';
import type { Video } from '../data/types';
import { useAppStore } from '../store/useAppStore';
import { useTheme } from '../theme/useTheme';

function formatHistoryTime(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const mins = Math.floor(diff / (1000 * 60));
  if (mins < 1) return '刚刚看过了';
  if (mins < 60) return `${mins} 分钟前看过`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} 小时前看过`;
  const days = Math.floor(hours / 24);
  return `${days} 天前看过`;
}

export default function HistoryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  const historyVideos = useAppStore((state) => state.historyVideos);
  const clearWatchHistory = useAppStore((state) => state.clearWatchHistory);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 1600);
  };

  const videoMap = useMemo(() => {
    return new Map<string, Video>(VIDEOS.map((v) => [v.id, v]));
  }, []);

  const historyList = useMemo(() => {
    return historyVideos
      .map((h) => {
        const v = videoMap.get(h.videoId);
        return v ? { video: v, watchedAt: h.watchedAt } : null;
      })
      .filter(Boolean) as { video: Video; watchedAt: number }[];
  }, [historyVideos, videoMap]);

  const handleClear = () => {
    if (historyList.length === 0) return;
    clearWatchHistory();
    showToast('观看历史已清空');
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      {/* 顶部标题栏 */}
      <View style={[styles.header, { borderBottomColor: colors.divider }]}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={10}
          style={styles.backBtn}
          accessibilityRole="button"
          accessibilityLabel="返回"
        >
          <Ionicons name="chevron-back" size={26} color={colors.textPrimary} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>观看历史</Text>
        <Pressable
          onPress={handleClear}
          hitSlop={8}
          style={styles.clearBtn}
          disabled={historyList.length === 0}
        >
          <Text
            style={[
              styles.clearBtnText,
              { color: historyList.length > 0 ? colors.brand : colors.textTertiary },
            ]}
          >
            清空
          </Text>
        </Pressable>
      </View>

      <FlatList
        data={historyList}
        keyExtractor={(item) => `${item.video.id}-${item.watchedAt}`}
        contentContainerStyle={{
          padding: 16,
          paddingBottom: insets.bottom + 24,
          gap: 12,
        }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Ionicons name="time-outline" size={56} color={colors.textTertiary} />
            <Text style={[styles.emptyText, { color: colors.textTertiary }]}>暂无观看历史</Text>
            <Text style={[styles.emptySubText, { color: colors.textTertiary }]}>
              你在抖音刷过的视频都会记录在这里哦
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const { video, watchedAt } = item;
          const creator = video.creator ?? getCreator(video.creatorId);

          return (
            <Pressable
              style={[
                styles.historyCard,
                { backgroundColor: colors.surface, borderColor: colors.cardBorder },
              ]}
              onPress={() => {
                router.push({
                  pathname: '/feed-detail',
                  params: { initialVideoId: video.id },
                });
              }}
            >
              <Image source={video.thumbnail} style={styles.thumb} resizeMode="cover" />

              <View style={styles.cardInfo}>
                <Text style={[styles.caption, { color: colors.textPrimary }]} numberOfLines={2}>
                  {video.caption}
                </Text>

                <View style={styles.creatorRow}>
                  <Text style={[styles.creatorName, { color: colors.textSecondary }]}>
                    @{creator.name}
                  </Text>
                </View>

                <View style={styles.timeRow}>
                  <Ionicons name="eye-outline" size={13} color={colors.textTertiary} />
                  <Text style={[styles.timeLabel, { color: colors.textTertiary }]}>
                    {formatHistoryTime(watchedAt)}
                  </Text>
                </View>
              </View>

              <Ionicons
                name="play-circle-outline"
                size={24}
                color={colors.textTertiary}
                style={styles.playIcon}
              />
            </Pressable>
          );
        }}
      />

      {/* 提示 Toast */}
      {toastMsg ? (
        <View style={styles.toastWrap} pointerEvents="none">
          <View style={styles.toastBox}>
            <Text style={styles.toastText}>{toastMsg}</Text>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  header: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: {
    width: 36,
    height: 36,
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  clearBtn: {
    padding: 6,
  },
  clearBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  historyCard: {
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 1,
    padding: 10,
    gap: 12,
    alignItems: 'center',
  },
  thumb: {
    width: 76,
    height: 102,
    borderRadius: 8,
    backgroundColor: '#000',
  },
  cardInfo: {
    flex: 1,
    gap: 6,
  },
  caption: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 19,
  },
  creatorName: {
    fontSize: 12,
  },
  creatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  timeLabel: {
    fontSize: 11,
  },
  playIcon: {
    paddingRight: 6,
  },
  emptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 100,
    gap: 10,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
  },
  emptySubText: {
    fontSize: 12,
  },
  toastWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 50,
    alignItems: 'center',
  },
  toastBox: {
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
  },
  toastText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
});
