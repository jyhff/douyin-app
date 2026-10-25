import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  GestureResponderEvent,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import * as Haptics from 'expo-haptics';

import { getCreator } from '../../data/creators';
import type { Video } from '../../data/types';
import { USE_NATIVE_DRIVER } from '../../lib/animation';
import { useAnimatedValue } from '../../lib/useAnimatedValue';
import { useTabBarHeight } from '../../lib/useTabBarHeight';
import { useAppStore, displayLikes } from '../../store/useAppStore';
import { colors } from '../../theme/tokens';
import { FILL } from '../../theme/styles';
import { ActionRail } from './ActionRail';
import { CaptionBlock } from './CaptionBlock';
import { HeartBurst } from './HeartBurst';
import { VideoLayer } from './VideoLayer';
import {
  VideoLongPressSheet,
  PlaybackRate,
} from '../overlays/VideoLongPressSheet';
import { TripleBurst } from '../overlays/TripleBurst';

/** Window in which a second tap counts as a double tap. */
const DOUBLE_TAP_MS = 280;

interface VideoPageProps {
  video: Video;
  isActive: boolean;
  /** Mount the native player: true for the active page and its neighbours. */
  shouldMountPlayer: boolean;
  muted: boolean;
  paused: boolean;
  onSingleTap: () => void;
}

/**
 * One full-screen page of the feed: video, gesture layer and all overlays.
 *
 * The player itself lives in `VideoLayer`, which is only mounted when this page
 * is near the viewport — see `shouldMountPlayer`.
 */
export function VideoPage({
  video,
  isActive,
  shouldMountPlayer,
  muted,
  paused,
  onSingleTap,
}: VideoPageProps) {
  // Server-supplied videos carry their own author; bundled ones use the fixture table.
  const creator = video.creator ?? getCreator(video.creatorId);
  const tabBarHeight = useTabBarHeight();

  const liked = useAppStore((s) => Boolean(s.likedVideos[video.id]));
  const favorited = useAppStore((s) => Boolean(s.favoritedVideos[video.id]));
  const following = useAppStore((s) => Boolean(s.followedCreators[video.creatorId]));
  const toggleLike = useAppStore((s) => s.toggleLike);
  const toggleFavorite = useAppStore((s) => s.toggleFavorite);
  const toggleFollow = useAppStore((s) => s.toggleFollow);
  const openComments = useAppStore((s) => s.openComments);
  const openShare = useAppStore((s) => s.openShare);

  const [ready, setReady] = useState(false);
  const [expanded, setExpanded] = useState(false);

  // 扩展功能状态
  const [sheetVisible, setSheetVisible] = useState(false);
  const [playbackRate, setPlaybackRate] = useState<PlaybackRate>(1.0);
  const [cleanMode, setCleanMode] = useState(false);
  const [tripleBurstVisible, setTripleBurstVisible] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const progress = useAnimatedValue(0);
  const burst = useAnimatedValue(0);
  const [burstAt, setBurstAt] = useState({ x: 0, y: 0 });

  const lastTap = useRef(0);
  const singleTapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
    setTimeout(() => {
      setToastMsg(null);
    }, 1800);
  }, []);

  useEffect(
    () => () => {
      if (singleTapTimer.current) clearTimeout(singleTapTimer.current);
    },
    [],
  );

  const handleReady = useCallback(() => setReady(true), []);

  const handleDoubleTap = useCallback(
    (x: number, y: number) => {
      setBurstAt({ x, y });
      burst.setValue(0);
      Animated.timing(burst, {
        toValue: 1,
        duration: 900,
        easing: Easing.out(Easing.quad),
        useNativeDriver: USE_NATIVE_DRIVER,
      }).start();
      // Double tap always likes; it never un-likes.
      if (!liked) toggleLike(video.id);
    },
    [burst, liked, toggleLike, video.id],
  );

  /**
   * Single tap toggles playback or exits clean mode.
   */
  const handlePress = useCallback(
    (event: GestureResponderEvent) => {
      if (cleanMode) {
        setCleanMode(false);
        return;
      }

      const { locationX, locationY, pageX, pageY } = event.nativeEvent;
      const x = locationX ?? pageX ?? 0;
      const y = locationY ?? pageY ?? 0;
      const now = Date.now();

      if (now - lastTap.current < DOUBLE_TAP_MS) {
        lastTap.current = 0;
        if (singleTapTimer.current) {
          clearTimeout(singleTapTimer.current);
          singleTapTimer.current = null;
        }
        handleDoubleTap(x, y);
        return;
      }

      lastTap.current = now;
      singleTapTimer.current = setTimeout(() => {
        singleTapTimer.current = null;
        onSingleTap();
      }, DOUBLE_TAP_MS);
    },
    [cleanMode, handleDoubleTap, onSingleTap],
  );

  const handleLongPress = useCallback(() => {
    if (cleanMode) return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {
      // web ignore
    }
    setSheetVisible(true);
  }, [cleanMode]);

  // 一键三连处理
  const handleTripleBurst = useCallback(() => {
    if (!liked) toggleLike(video.id);
    if (!favorited) toggleFavorite(video.id);
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      // web ignore
    }
    setTripleBurstVisible(true);
  }, [liked, favorited, toggleLike, toggleFavorite, video.id]);

  return (
    <View style={styles.page}>
      <Image
        source={video.thumbnail}
        style={[FILL, { opacity: ready ? 0 : 1 }]}
        resizeMode="cover"
      />

      {shouldMountPlayer ? (
        <VideoLayer
          source={video.source}
          isActive={isActive}
          paused={paused}
          muted={muted}
          playbackRate={playbackRate}
          progress={progress}
          onReady={handleReady}
        />
      ) : null}

      <Pressable
        style={StyleSheet.absoluteFill}
        onPress={handlePress}
        onLongPress={handleLongPress}
        delayLongPress={450}
        accessibilityRole="button"
        accessibilityLabel={`${creator.name} 的视频，${video.caption}`}
      />

      {paused && !cleanMode ? (
        <View style={styles.pauseIndicator} pointerEvents="none">
          <Ionicons name="play" size={74} color="rgba(255, 255, 255, 0.72)" />
        </View>
      ) : null}

      {/* 普通双击点赞红心 */}
      <HeartBurst progress={burst} x={burstAt.x} y={burstAt.y} />

      {/* 长按一键三连炫彩粒子爆散 */}
      <TripleBurst
        visible={tripleBurstVisible}
        onFinish={() => setTripleBurstVisible(false)}
      />

      {/* 非清屏模式下渲染侧边栏和文案 */}
      {!cleanMode ? (
        <>
          <CaptionBlock
            video={video}
            creator={creator}
            expanded={expanded}
            onToggleExpanded={() => setExpanded((value) => !value)}
          />

          <ActionRail
            video={video}
            creator={creator}
            liked={liked}
            favorited={favorited}
            following={following}
            likeCount={displayLikes(video, liked)}
            spinning={isActive && !paused}
            onLike={() => toggleLike(video.id)}
            onLongPressLike={handleTripleBurst}
            onComment={() => openComments(video.id)}
            onFavorite={() => toggleFavorite(video.id)}
            onShare={() => openShare(video.id)}
            onFollow={() => toggleFollow(video.creatorId)}
          />

          <View style={[styles.progressTrack, { bottom: tabBarHeight }]} pointerEvents="none">
            <Animated.View
              style={[
                styles.progressFill,
                {
                  width: progress.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0%', '100%'],
                  }),
                },
              ]}
            />
          </View>
        </>
      ) : (
        /* 清屏模式顶部浮动提示 */
        <Pressable
          style={styles.exitCleanBtn}
          onPress={() => setCleanMode(false)}
        >
          <Ionicons name="scan-outline" size={14} color="#FFFFFF" />
          <Text style={styles.exitCleanText}>退出清屏</Text>
        </Pressable>
      )}

      {/* 长按快捷面板 */}
      <VideoLongPressSheet
        visible={sheetVisible}
        currentRate={playbackRate}
        onSelectRate={(rate) => {
          setPlaybackRate(rate);
          showToast(`已切换为 ${rate}X 倍速播放`);
        }}
        onEnterCleanMode={() => {
          setCleanMode(true);
          showToast('已进入清屏模式，轻触屏幕任意处退出');
        }}
        onDislike={() => {
          showToast('已收到反馈，将减少此类视频推荐');
          onSingleTap();
        }}
        onSaveVideo={() => {
          showToast('视频已保存到相册');
        }}
        onCopyLink={() => {
          showToast('视频分享链接已复制到剪贴板');
        }}
        onClose={() => setSheetVisible(false)}
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
  page: {
    flex: 1,
    backgroundColor: colors.background,
    overflow: 'hidden',
  },
  pauseIndicator: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressTrack: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
  },
  progressFill: {
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
  },
  exitCleanBtn: {
    position: 'absolute',
    top: 50,
    left: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  exitCleanText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  toastWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 120,
    alignItems: 'center',
    zIndex: 100,
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

