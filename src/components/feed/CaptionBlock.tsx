import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { Creator, Video } from '../../data/types';
import { useTabBarHeight } from '../../lib/useTabBarHeight';
import { colors } from '../../theme/tokens';
import { openUserProfile } from '../ui/Avatar';
import { Marquee } from '../ui/Marquee';

interface CaptionBlockProps {
  video: Video;
  creator: Creator;
  /** Caption is clamped until the user taps "展开". */
  expanded: boolean;
  onToggleExpanded: () => void;
  danmakuEnabled?: boolean;
  onToggleDanmaku?: () => void;
  onOpenDanmakuInput?: () => void;
}

/** Bottom-left overlay: danmaku entry, handle, caption, hashtags and the music line. */
export function CaptionBlock({
  video,
  creator,
  expanded,
  onToggleExpanded,
  danmakuEnabled = true,
  onToggleDanmaku,
  onOpenDanmakuInput,
}: CaptionBlockProps) {
  const router = useRouter();
  const tabBarHeight = useTabBarHeight();

  return (
    <View style={[styles.container, { bottom: tabBarHeight + 14 }]} pointerEvents="box-none">
      {/* 弹幕输入框和按钮：位于标题区域最上方，避免与底部进度条重合 */}
      <View style={styles.danmakuBar} pointerEvents="box-none">
        <Pressable
          style={[styles.danmakuToggle, danmakuEnabled && styles.danmakuToggleActive]}
          onPress={onToggleDanmaku}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={danmakuEnabled ? '关闭弹幕' : '开启弹幕'}
        >
          <Text
            style={[
              styles.danmakuToggleText,
              danmakuEnabled && styles.danmakuToggleTextActive,
            ]}
          >
            弹
          </Text>
        </Pressable>

        {danmakuEnabled ? (
          <Pressable
            style={styles.danmakuInputBtn}
            onPress={onOpenDanmakuInput}
            accessibilityRole="button"
            accessibilityLabel="发送弹幕"
          >
            <Ionicons name="chatbox-ellipses-outline" size={13} color="rgba(255,255,255,0.7)" />
            <Text style={styles.danmakuInputPlaceholder}>发一条友善的弹幕吧...</Text>
          </Pressable>
        ) : null}
      </View>

      {video.location ? (
        <View style={styles.locationChip}>
          <Ionicons name="location-outline" size={12} color="#fff" />
          <Text style={styles.locationText}>{video.location}</Text>
        </View>
      ) : null}

      <Pressable
        onPress={() => openUserProfile(router, creator.id)}
        hitSlop={6}
        accessibilityRole="button"
        accessibilityLabel={`进入 ${creator.name} 的主页`}
      >
        <Text style={styles.handle}>@{creator.name}</Text>
      </Pressable>

      <Pressable onPress={onToggleExpanded} accessibilityRole="button">
        <Text style={styles.caption} numberOfLines={expanded ? undefined : 2}>
          {video.caption}
          {video.tags.length > 0 ? (
            <Text style={styles.tags}>{`  ${video.tags.join(' ')}`}</Text>
          ) : null}
        </Text>
        {!expanded && video.caption.length > 30 ? (
          <Text style={styles.expand}>展开</Text>
        ) : null}
      </Pressable>

      <Pressable
        style={styles.musicRow}
        onPress={() =>
          router.push({
            pathname: '/music',
            params: {
              name: video.music,
              creatorName: creator.name,
              creatorId: creator.id,
            },
          })
        }
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={`进入音乐 ${video.music}`}
      >
        <Ionicons name="musical-note" size={13} color={colors.textPrimary} />
        <Marquee text={video.music} containerStyle={styles.marquee} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 14,
    right: 82,
    gap: 7,
  },
  danmakuBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
    alignSelf: 'flex-start',
  },
  danmakuToggle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  danmakuToggleActive: {
    backgroundColor: colors.brand,
    borderColor: colors.brand,
  },
  danmakuToggleText: {
    fontSize: 12,
    fontWeight: '800',
    color: 'rgba(255, 255, 255, 0.65)',
  },
  danmakuToggleTextActive: {
    color: '#FFFFFF',
  },
  danmakuInputBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.48)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255, 255, 255, 0.22)',
  },
  danmakuInputPlaceholder: {
    color: 'rgba(255, 255, 255, 0.75)',
    fontSize: 11,
    fontWeight: '500',
  },
  locationChip: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
  },
  locationText: {
    fontSize: 11,
    color: '#fff',
    fontWeight: '500',
  },
  handle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  caption: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.textPrimary,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  tags: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontWeight: '600',
  },
  expand: {
    marginTop: 2,
    fontSize: 13,
    color: colors.textTertiary,
  },
  musicRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  marquee: {
    flex: 1,
  },
});
