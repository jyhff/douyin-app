import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';

import type { Creator, Video } from '../../data/types';
import { formatCount } from '../../lib/format';
import { USE_NATIVE_DRIVER } from '../../lib/animation';
import { useAnimatedValue } from '../../lib/useAnimatedValue';
import { useTabBarHeight } from '../../lib/useTabBarHeight';
import { colors } from '../../theme/tokens';
import { Avatar } from '../ui/Avatar';
import { MusicDisc } from './MusicDisc';

interface MetricButtonProps {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  /** The number rendered under the icon. */
  label: string;
  /** Spoken label, e.g. `点赞 1284`; the visible label is just a count. */
  a11yLabel: string;
  active?: boolean;
  /** Colour used when `active` — Douyin uses red for likes, amber for saves. */
  tone?: string;
  onPress: () => void;
  onLongPress?: () => void;
}

/** One icon-over-count stack in the right-hand rail. */
function MetricButton({
  icon,
  label,
  a11yLabel,
  active = false,
  tone,
  onPress,
  onLongPress,
}: MetricButtonProps) {
  const scale = useAnimatedValue(1);

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scale, {
        toValue: 0.8,
        duration: 90,
        easing: Easing.out(Easing.quad),
        useNativeDriver: USE_NATIVE_DRIVER,
      }),
      Animated.spring(scale, {
        toValue: 1,
        friction: 4,
        tension: 180,
        useNativeDriver: USE_NATIVE_DRIVER,
      }),
    ]).start();
    onPress();
  };

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        onPress={handlePress}
        onLongPress={onLongPress}
        delayLongPress={550}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={a11yLabel}
        accessibilityState={{ selected: active }}
        style={styles.metric}
      >
        <Ionicons
          name={icon}
          size={34}
          color={active && tone ? tone : colors.textPrimary}
          style={styles.metricIcon}
        />
        <Text style={styles.metricLabel}>{label}</Text>
      </Pressable>
    </Animated.View>
  );
}

interface ActionRailProps {
  video: Video;
  creator: Creator;
  liked: boolean;
  favorited: boolean;
  following: boolean;
  likeCount: number;
  spinning: boolean;
  onLike: () => void;
  onLongPressLike?: () => void;
  onComment: () => void;
  onFavorite: () => void;
  onShare: () => void;
  onFollow: () => void;
}

/** The vertical stack of actions pinned to the right edge of a video. */
export function ActionRail({
  video,
  creator,
  liked,
  favorited,
  following,
  likeCount,
  spinning,
  onLike,
  onLongPressLike,
  onComment,
  onFavorite,
  onShare,
  onFollow,
}: ActionRailProps) {
  const router = useRouter();
  const tabBarHeight = useTabBarHeight();

  return (
    <View style={[styles.rail, { bottom: tabBarHeight + 74 }]}>
      <View style={styles.avatarBlock}>
        <Avatar
          source={creator.avatar}
          size={46}
          ring
          creatorId={creator.id}
          accessibilityLabel={`进入 ${creator.name} 的主页`}
        />
        <Pressable
          onPress={onFollow}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={following ? `取消关注 ${creator.name}` : `关注 ${creator.name}`}
          style={[styles.followBadge, following && styles.followBadgeActive]}
        >
          <Ionicons name={following ? 'checkmark' : 'add'} size={14} color="#fff" />
        </Pressable>
      </View>

      <MetricButton
        icon={liked ? 'heart' : 'heart-outline'}
        label={formatCount(likeCount)}
        a11yLabel={`${liked ? '取消点赞' : '点赞'} ${creator.name} 的视频`}
        active={liked}
        tone={colors.brand}
        onPress={onLike}
        onLongPress={onLongPressLike}
      />
      <MetricButton
        icon="chatbubble-ellipses-outline"
        label={formatCount(video.metrics.comments)}
        a11yLabel="评论"
        onPress={onComment}
      />
      <MetricButton
        icon={favorited ? 'bookmark' : 'bookmark-outline'}
        label={formatCount(video.metrics.favorites)}
        a11yLabel={favorited ? '取消收藏' : '收藏'}
        active={favorited}
        tone="#FFC53D"
        onPress={onFavorite}
      />
      <MetricButton
        icon="arrow-redo-outline"
        label={formatCount(video.metrics.shares)}
        a11yLabel="分享"
        onPress={onShare}
      />

      <Pressable
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
        hitSlop={6}
        accessibilityRole="button"
        accessibilityLabel={`查看音乐 ${video.music}`}
      >
        <MusicDisc artwork={creator.avatar} spinning={spinning} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  rail: {
    position: 'absolute',
    right: 10,
    alignItems: 'center',
    gap: 18,
  },
  avatarBlock: {
    alignItems: 'center',
    marginBottom: 6,
  },
  followBadge: {
    position: 'absolute',
    bottom: -9,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#000',
  },
  followBadgeActive: {
    backgroundColor: colors.surfaceMuted,
  },
  metric: {
    alignItems: 'center',
  },
  metricIcon: {
    textShadowColor: 'rgba(0, 0, 0, 0.45)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  metricLabel: {
    marginTop: 3,
    fontSize: 12,
    fontWeight: '600',
    color: colors.textPrimary,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.45)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
});
