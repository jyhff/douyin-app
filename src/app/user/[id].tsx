import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
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

import { Avatar } from '../../components/ui/Avatar';
import { CURRENT_USER, getCreator } from '../../data/creators';
import type { Video } from '../../data/types';
import { VIDEOS } from '../../data/videos';
import { formatCount } from '../../lib/format';
import { useAppStore } from '../../store/useAppStore';
import { useTheme } from '../../theme/useTheme';

type TabType = 'works' | 'likes';

export default function UserProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const params = useLocalSearchParams<{ id: string }>();
  const creatorId = params.id || 'u1';

  const [activeTab, setActiveTab] = useState<TabType>('works');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const followedCreators = useAppStore((state) => state.followedCreators);
  const toggleFollow = useAppStore((state) => state.toggleFollow);

  const isMe = creatorId === 'me' || creatorId === CURRENT_USER.id;
  const creator = isMe ? CURRENT_USER : getCreator(creatorId);
  const isFollowing = Boolean(followedCreators[creator.id]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 1600);
  };

  // 该创作者的作品
  const works = useMemo<Video[]>(() => {
    const list = VIDEOS.filter((v) => v.creatorId === creator.id);
    if (list.length > 0) return list;
    // 若特定创作者无专属视频，推荐部分相关视频作为作品展示
    return VIDEOS.slice(0, 3);
  }, [creator.id]);

  const handleCopyHandle = () => {
    showToast('抖音号已复制到剪贴板');
  };

  const handleChat = () => {
    router.push({
      pathname: '/chat',
      params: { creatorId: creator.id },
    });
  };

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      {/* 顶部封面渐变 */}
      <LinearGradient
        colors={
          isDark
            ? ['#381D35', '#201625', colors.background]
            : ['#FFE6EC', '#F4ECF8', colors.background]
        }
        style={[styles.coverGradient, { paddingTop: insets.top + 8 }]}
      >
        {/* 顶部操作条 */}
        <View style={styles.navBar}>
          <Pressable
            hitSlop={12}
            onPress={() => router.back()}
            style={styles.navBtn}
            accessibilityRole="button"
            accessibilityLabel="返回"
          >
            <Ionicons name="chevron-back" size={26} color={colors.textPrimary} />
          </Pressable>

          <View style={styles.navActions}>
            <Pressable
              hitSlop={10}
              onPress={() => showToast('已分享该主页链接')}
              style={styles.navBtn}
              accessibilityRole="button"
              accessibilityLabel="分享"
            >
              <Ionicons name="share-outline" size={22} color={colors.textPrimary} />
            </Pressable>
            <Pressable
              hitSlop={10}
              onPress={() => showToast('更多操作')}
              style={styles.navBtn}
              accessibilityRole="button"
              accessibilityLabel="更多"
            >
              <Ionicons name="ellipsis-horizontal" size={22} color={colors.textPrimary} />
            </Pressable>
          </View>
        </View>

        {/* 头像与身份区 */}
        <View style={styles.profileInfo}>
          <View style={styles.avatarWrap}>
            <Avatar source={creator.avatar} size={82} ring />
            {creator.verified ? (
              <View style={[styles.verifiedBadge, { borderColor: colors.background }]}>
                <Ionicons name="checkmark-circle" size={18} color="#00C8D6" />
              </View>
            ) : null}
          </View>

          <View style={styles.nameSection}>
            <View style={styles.nameRow}>
              <Text style={[styles.nameText, { color: colors.textPrimary }]} numberOfLines={1}>
                {creator.name}
              </Text>
            </View>

            <Pressable onPress={handleCopyHandle} style={styles.handleRow} hitSlop={6}>
              <Text style={[styles.handleText, { color: colors.textTertiary }]}>
                抖音号：{creator.handle}
              </Text>
              <Ionicons name="copy-outline" size={13} color={colors.textTertiary} />
            </Pressable>
          </View>
        </View>

        {/* 签名/简介 */}
        <Text style={[styles.bioText, { color: colors.textSecondary }]}>
          {creator.bio || '这个人很神秘，什么都没写~'}
        </Text>

        {/* 标签区 */}
        <View style={styles.tagRow}>
          {creator.verified ? (
            <View style={[styles.tagChip, { backgroundColor: colors.surfaceMuted }]}>
              <Ionicons name="shield-checkmark" size={12} color="#00C8D6" />
              <Text style={[styles.tagText, { color: colors.textSecondary }]}>平台认证创作者</Text>
            </View>
          ) : null}
          <View style={[styles.tagChip, { backgroundColor: colors.surfaceMuted }]}>
            <Text style={[styles.tagText, { color: colors.textTertiary }]}>IP: 属地未知</Text>
          </View>
        </View>

        {/* 获赞/关注/粉丝统计 */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.textPrimary }]}>
              {formatCount(creator.stats.likes)}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textTertiary }]}>获赞</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.textPrimary }]}>
              {formatCount(creator.stats.following)}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textTertiary }]}>关注</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.textPrimary }]}>
              {formatCount(creator.stats.followers + (isFollowing ? 1 : 0))}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textTertiary }]}>粉丝</Text>
          </View>
        </View>

        {/* 交互按钮栏：关注 / 私信 */}
        {!isMe ? (
          <View style={styles.actionBtnRow}>
            <Pressable
              style={[
                styles.followBtn,
                {
                  backgroundColor: isFollowing ? colors.surfaceMuted : colors.brand,
                  borderColor: isFollowing ? colors.cardBorder : 'transparent',
                },
              ]}
              onPress={() => toggleFollow(creator.id)}
              accessibilityRole="button"
            >
              <Ionicons
                name={isFollowing ? 'checkmark' : 'add'}
                size={16}
                color={isFollowing ? colors.textPrimary : '#FFFFFF'}
                style={{ marginRight: 4 }}
              />
              <Text
                style={[
                  styles.followBtnText,
                  { color: isFollowing ? colors.textPrimary : '#FFFFFF' },
                ]}
              >
                {isFollowing ? '已关注' : '关注'}
              </Text>
            </Pressable>

            <Pressable
              style={[
                styles.chatBtn,
                {
                  backgroundColor: colors.surfaceMuted,
                  borderColor: colors.cardBorder,
                },
              ]}
              onPress={handleChat}
              accessibilityRole="button"
            >
              <Ionicons
                name="chatbubble-ellipses-outline"
                size={16}
                color={colors.textPrimary}
                style={{ marginRight: 4 }}
              />
              <Text style={[styles.chatBtnText, { color: colors.textPrimary }]}>发私信</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.actionBtnRow}>
            <Pressable
              style={[
                styles.editBtn,
                {
                  backgroundColor: colors.surfaceMuted,
                  borderColor: colors.cardBorder,
                },
              ]}
              onPress={() => router.push('/(tabs)/me')}
            >
              <Text style={[styles.editBtnText, { color: colors.textPrimary }]}>
                前往我的完整主页
              </Text>
            </Pressable>
          </View>
        )}
      </LinearGradient>

      {/* 作品 / 喜欢 Tab 栏 */}
      <View style={[styles.tabBar, { borderBottomColor: colors.divider }]}>
        <Pressable
          style={[styles.tabItem, activeTab === 'works' && styles.tabItemActive]}
          onPress={() => setActiveTab('works')}
        >
          <Text
            style={[
              styles.tabText,
              {
                color: activeTab === 'works' ? colors.textPrimary : colors.textTertiary,
                fontWeight: activeTab === 'works' ? '700' : '500',
              },
            ]}
          >
            作品 {works.length}
          </Text>
          {activeTab === 'works' ? (
            <View style={[styles.activeIndicator, { backgroundColor: colors.brand }]} />
          ) : null}
        </Pressable>

        <Pressable
          style={[styles.tabItem, activeTab === 'likes' && styles.tabItemActive]}
          onPress={() => setActiveTab('likes')}
        >
          <Text
            style={[
              styles.tabText,
              {
                color: activeTab === 'likes' ? colors.textPrimary : colors.textTertiary,
                fontWeight: activeTab === 'likes' ? '700' : '500',
              },
            ]}
          >
            喜欢
          </Text>
          {activeTab === 'likes' ? (
            <View style={[styles.activeIndicator, { backgroundColor: colors.brand }]} />
          ) : null}
        </Pressable>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={activeTab === 'works' ? works : []}
        keyExtractor={(item) => item.id}
        numColumns={3}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="folder-open-outline" size={44} color={colors.textTertiary} />
            <Text style={[styles.emptyText, { color: colors.textTertiary }]}>
              {activeTab === 'likes' ? '创作者已设为私密' : '暂无作品'}
            </Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 20) + 20 }}
        renderItem={({ item }) => (
          <Pressable
            style={styles.gridItem}
            onPress={() => {
              showToast(`播放视频：${item.caption.slice(0, 10)}...`);
              router.back();
            }}
          >
            <Image source={item.thumbnail} style={styles.thumbnail} resizeMode="cover" />
            <View style={styles.itemOverlay}>
              <Ionicons name="play" size={13} color="#FFFFFF" />
              <Text style={styles.playCount}>{formatCount(item.metrics.likes)}</Text>
            </View>
          </Pressable>
        )}
      />

      {/* 浮动 Toast */}
      {toastMessage ? (
        <View style={styles.toastWrap} pointerEvents="none">
          <View style={styles.toastBox}>
            <Text style={styles.toastText}>{toastMessage}</Text>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    width: '100%',
  },
  coverGradient: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  navBtn: {
    padding: 4,
  },
  navActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarWrap: {
    position: 'relative',
    marginRight: 16,
  },
  verifiedBadge: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    borderWidth: 2,
    borderRadius: 10,
  },
  nameSection: {
    flex: 1,
    justifyContent: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  nameText: {
    fontSize: 20,
    fontWeight: '700',
  },
  handleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  handleText: {
    fontSize: 12,
  },
  bioText: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  tagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  tagText: {
    fontSize: 11,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
    marginBottom: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 12,
  },
  actionBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 4,
  },
  followBtn: {
    flex: 1,
    height: 40,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  followBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  chatBtn: {
    flex: 1,
    height: 40,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  chatBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  editBtn: {
    flex: 1,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  editBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 16,
  },
  tabItem: {
    paddingVertical: 12,
    marginRight: 24,
    position: 'relative',
    alignItems: 'center',
  },
  tabItemActive: {},
  tabText: {
    fontSize: 15,
  },
  activeIndicator: {
    position: 'absolute',
    bottom: 0,
    width: 24,
    height: 2.5,
    borderRadius: 2,
  },
  gridItem: {
    flex: 1 / 3,
    aspectRatio: 3 / 4,
    padding: 1,
    position: 'relative',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
    backgroundColor: '#1E1E1E',
  },
  itemOverlay: {
    position: 'absolute',
    left: 6,
    bottom: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  playCount: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
  },
  toastWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toastBox: {
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 20,
  },
  toastText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '500',
  },
});
