import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  FlatList,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar, openUserProfile } from '../components/ui/Avatar';
import { getCreator } from '../data/creators';
import type { Video } from '../data/types';
import { VIDEOS } from '../data/videos';
import { formatCount } from '../lib/format';
import { useRemoteFeed } from '../lib/useRemoteFeed';
import { colors as defaultColors } from '../theme/tokens';
import { useAnimatedValue } from '../lib/useAnimatedValue';
import { useTheme } from '../theme/useTheme';

export default function MusicDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const params = useLocalSearchParams<{
    name?: string;
    creatorName?: string;
    creatorId?: string;
  }>();

  const musicName = params.name || 'Golden Hour - JVKE';
  const creatorId = params.creatorId || 'u1';
  const creator = getCreator(creatorId);

  const [isPlaying, setIsPlaying] = useState(true);
  const [isFavorited, setIsFavorited] = useState(false);
  const [previewVideo, setPreviewVideo] = useState<Video | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const rotateAnim = useAnimatedValue(0);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => {
      setToastMsg(null);
    }, 1600);
  };

  // 旋转大唱片动画
  useEffect(() => {
    if (isPlaying) {
      rotateAnim.setValue(0);
      const loop = Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 7000,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      );
      loop.start();
      return () => loop.stop();
    }
  }, [isPlaying, rotateAnim]);

  const discRotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const remoteVideos = useRemoteFeed();
  const allVideos = useMemo(() => {
    return remoteVideos && remoteVideos.length > 0 ? remoteVideos : VIDEOS;
  }, [remoteVideos]);

  // 匹配该音乐或相似推荐的视频
  const relatedVideos = useMemo(() => {
    const list = allVideos.filter((v) => v.music.toLowerCase() === musicName.toLowerCase());
    return list.length > 0 ? list : allVideos;
  }, [allVideos, musicName]);

  const handleShootSame = () => {
    router.push({
      pathname: '/publish',
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* 顶部导航栏 */}
      <View style={[styles.navBar, { paddingTop: insets.top + 6 }]}>
        <Pressable
          style={styles.navBtn}
          onPress={() => router.back()}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="返回"
        >
          <Ionicons name="chevron-back" size={26} color={colors.textPrimary} />
        </Pressable>

        <Text style={[styles.navTitle, { color: colors.textPrimary }]} numberOfLines={1}>
          音乐原声
        </Text>

        <Pressable
          style={styles.navBtn}
          onPress={() => showToast('音乐链接已复制')}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="分享"
        >
          <Ionicons name="share-social-outline" size={22} color={colors.textPrimary} />
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* 音乐信息卡片 */}
        <View style={styles.musicHeader}>
          {/* 大黑胶唱片 */}
          <Pressable
            style={styles.discContainer}
            onPress={() => setIsPlaying(!isPlaying)}
            accessibilityRole="button"
            accessibilityLabel={isPlaying ? '暂停试听' : '播放试听'}
          >
            <View style={styles.vinylBorder}>
              <Animated.View style={{ transform: [{ rotate: isPlaying ? discRotate : '0deg' }] }}>
                <Image source={creator.avatar} style={styles.discArtwork} resizeMode="cover" />
              </Animated.View>
            </View>
            <View style={styles.playCenter}>
              <Ionicons
                name={isPlaying ? 'pause' : 'play'}
                size={20}
                color="#FFFFFF"
              />
            </View>
          </Pressable>

          <View style={styles.musicMeta}>
            <Text style={[styles.musicTitle, { color: colors.textPrimary }]}>{musicName}</Text>
            <Text style={[styles.creatorName, { color: colors.textTertiary }]}>
              原声 · {params.creatorName || creator.name}
            </Text>
            <Text style={[styles.usageCount, { color: colors.textSecondary }]}>
              {relatedVideos.length * 12 + 18}.6 万个视频正在使用
            </Text>

            {/* 收藏按钮 */}
            <Pressable
              style={[
                styles.favBtn,
                { backgroundColor: colors.surfaceMuted },
                isFavorited && styles.favBtnActive,
              ]}
              onPress={() => {
                setIsFavorited(!isFavorited);
                showToast(isFavorited ? '已取消收藏音乐' : '已收藏音乐');
              }}
            >
              <Ionicons
                name={isFavorited ? 'bookmark' : 'bookmark-outline'}
                size={16}
                color={isFavorited ? '#FFC53D' : colors.textPrimary}
              />
              <Text style={[styles.favBtnText, { color: colors.textPrimary }]}>
                {isFavorited ? '已收藏' : '收藏'}
              </Text>
            </Pressable>
          </View>
        </View>

        {/* 拍同款醒目大按钮 */}
        <Pressable
          style={({ pressed }) => [
            styles.shootBtn,
            { backgroundColor: colors.brand },
            pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
          ]}
          onPress={handleShootSame}
        >
          <Ionicons name="videocam" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
          <Text style={styles.shootBtnText}>拍同款视频</Text>
        </Pressable>

        {/* 使用该音乐的精选作品网格 */}
        <View style={styles.worksSection}>
          <View style={styles.worksHeader}>
            <Text style={[styles.worksTitle, { color: colors.textPrimary }]}>使用此音乐的作品</Text>
            <Text style={[styles.worksSubtitle, { color: colors.textTertiary }]}>
              共 {relatedVideos.length} 条热门视频
            </Text>
          </View>

          <View style={styles.videoGrid}>
            {relatedVideos.map((item) => {
              const author = item.creator ?? getCreator(item.creatorId);
              return (
                <Pressable
                  key={item.id}
                  style={[
                    styles.videoCard,
                    { backgroundColor: colors.surface, borderColor: colors.cardBorder },
                  ]}
                  onPress={() => setPreviewVideo(item)}
                >
                  <View style={styles.coverWrap}>
                    <Image source={item.thumbnail} style={styles.coverImg} resizeMode="cover" />
                    <View style={styles.playBadge}>
                      <Ionicons name="play" size={13} color="#FFFFFF" />
                      <Text style={styles.playCount}>{formatCount(item.metrics.likes)}</Text>
                    </View>
                  </View>
                  <View style={styles.videoInfo}>
                    <Text
                      style={[styles.captionText, { color: colors.textPrimary }]}
                      numberOfLines={2}
                    >
                      {item.caption}
                    </Text>
                    <Pressable
                      style={styles.authorLine}
                      onPress={(e) => {
                        e.stopPropagation();
                        openUserProfile(router, item.creatorId);
                      }}
                    >
                      <Avatar source={author.avatar} size={18} creatorId={item.creatorId} />
                      <Text
                        style={[styles.authorName, { color: colors.textTertiary }]}
                        numberOfLines={1}
                      >
                        {author.name}
                      </Text>
                    </Pressable>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>
      </ScrollView>

      {/* 视频点击弹窗播放预览 */}
      {previewVideo ? (
        <Modal visible animationType="fade" transparent onRequestClose={() => setPreviewVideo(null)}>
          <View style={styles.modalBg}>
            <Pressable style={StyleSheet.absoluteFill} onPress={() => setPreviewVideo(null)} />
            <View style={styles.modalCard}>
              <VideoPreviewView video={previewVideo} />
              <Pressable
                style={styles.modalCloseBtn}
                onPress={() => setPreviewVideo(null)}
                hitSlop={10}
              >
                <Ionicons name="close" size={24} color="#FFFFFF" />
              </Pressable>
            </View>
          </View>
        </Modal>
      ) : null}

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

function VideoPreviewView({ video }: { video: Video }) {
  const player = useVideoPlayer(video.source, (p) => {
    p.loop = true;
    p.play();
  });
  return <VideoView player={player} style={StyleSheet.absoluteFill} contentFit="cover" />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingBottom: 10,
  },
  navBtn: {
    padding: 6,
  },
  navTitle: {
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  musicHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 16,
  },
  discContainer: {
    width: 100,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  vinylBorder: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#121216',
    borderWidth: 5,
    borderColor: '#24242A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  discArtwork: {
    width: 54,
    height: 54,
    borderRadius: 27,
  },
  playCenter: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  musicMeta: {
    flex: 1,
  },
  musicTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  creatorName: {
    fontSize: 13,
    marginBottom: 4,
  },
  usageCount: {
    fontSize: 12,
    marginBottom: 10,
  },
  favBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  favBtnActive: {},
  favBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  shootBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 28,
  },
  shootBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  worksSection: {
    marginBottom: 20,
  },
  worksHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  worksTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  worksSubtitle: {
    fontSize: 12,
  },
  videoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  videoCard: {
    width: '48.5%',
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  coverWrap: {
    width: '100%',
    aspectRatio: 3 / 4,
    backgroundColor: '#000',
    position: 'relative',
  },
  coverImg: {
    width: '100%',
    height: '100%',
  },
  playBadge: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  playCount: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  videoInfo: {
    padding: 8,
  },
  captionText: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
    marginBottom: 6,
  },
  authorLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  authorName: {
    fontSize: 11,
    flex: 1,
  },
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCard: {
    width: '90%',
    maxWidth: 420,
    aspectRatio: 9 / 16,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#000',
    position: 'relative',
  },
  modalCloseBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  toastWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 120,
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
