import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar, openUserProfile } from '../../components/ui/Avatar';
import { CREATORS } from '../../data/creators';
import { useAppStore } from '../../store/useAppStore';
import { useTheme } from '../../theme/useTheme';

type RelTab = 'following' | 'followers';

export default function RelationshipsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const params = useLocalSearchParams<{ tab?: string }>();

  const [activeTab, setActiveTab] = useState<RelTab>(
    params.tab === 'followers' ? 'followers' : 'following',
  );
  const [searchQuery, setSearchQuery] = useState('');

  const followedCreators = useAppStore((state) => state.followedCreators);
  const toggleFollow = useAppStore((state) => state.toggleFollow);

  // 关注列表：包括 store 里关注的 creator 以及初始默认关注者
  const followingList = useMemo(() => {
    return CREATORS.filter((c) => Boolean(followedCreators[c.id]));
  }, [followedCreators]);

  // 粉丝列表：系统推荐和模拟粉丝
  const followersList = useMemo(() => {
    return CREATORS;
  }, []);

  const displayList = useMemo(() => {
    const list = activeTab === 'following' ? followingList : followersList;
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase().trim();
    return list.filter(
      (c) => c.name.toLowerCase().includes(q) || c.handle.toLowerCase().includes(q),
    );
  }, [activeTab, followingList, followersList, searchQuery]);

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
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>关系列表</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* Tabs 切换 */}
      <View style={[styles.tabBar, { borderBottomColor: colors.divider }]}>
        <Pressable
          style={styles.tabItem}
          onPress={() => setActiveTab('following')}
          accessibilityRole="tab"
          accessibilityLabel="关注"
        >
          <Text
            style={[
              styles.tabText,
              { color: activeTab === 'following' ? colors.textPrimary : colors.textTertiary },
              activeTab === 'following' && styles.tabTextActive,
            ]}
          >
            关注 ({followingList.length})
          </Text>
          {activeTab === 'following' ? (
            <View style={[styles.tabIndicator, { backgroundColor: colors.brand }]} />
          ) : null}
        </Pressable>

        <Pressable
          style={styles.tabItem}
          onPress={() => setActiveTab('followers')}
          accessibilityRole="tab"
          accessibilityLabel="粉丝"
        >
          <Text
            style={[
              styles.tabText,
              { color: activeTab === 'followers' ? colors.textPrimary : colors.textTertiary },
              activeTab === 'followers' && styles.tabTextActive,
            ]}
          >
            粉丝 ({followersList.length})
          </Text>
          {activeTab === 'followers' ? (
            <View style={[styles.tabIndicator, { backgroundColor: colors.brand }]} />
          ) : null}
        </Pressable>
      </View>

      {/* 搜索框 */}
      <View style={[styles.searchBoxWrap, { backgroundColor: colors.background }]}>
        <View style={[styles.searchBox, { backgroundColor: colors.surfaceMuted }]}>
          <Ionicons name="search" size={17} color={colors.textTertiary} />
          <TextInput
            style={[styles.searchInput, { color: colors.textPrimary }]}
            placeholder={activeTab === 'following' ? '搜索我的关注' : '搜索粉丝'}
            placeholderTextColor={colors.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
          />
          {searchQuery.length > 0 ? (
            <Pressable onPress={() => setSearchQuery('')} hitSlop={6}>
              <Ionicons name="close-circle" size={16} color={colors.textTertiary} />
            </Pressable>
          ) : null}
        </View>
      </View>

      {/* 用户列表 */}
      <FlatList
        data={displayList}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Ionicons name="people-outline" size={48} color={colors.textTertiary} />
            <Text style={[styles.emptyText, { color: colors.textTertiary }]}>
              {searchQuery ? '没有找到匹配的用户' : activeTab === 'following' ? '暂无关注的人' : '暂无粉丝'}
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const isFollowing = Boolean(followedCreators[item.id]);

          return (
            <Pressable
              style={[styles.userRow, { borderBottomColor: colors.cardBorder }]}
              onPress={() => openUserProfile(router, item.id)}
            >
              <Avatar source={item.avatar} size={50} ring={item.verified} />

              <View style={styles.userInfo}>
                <View style={styles.userNameRow}>
                  <Text style={[styles.userName, { color: colors.textPrimary }]} numberOfLines={1}>
                    {item.name}
                  </Text>
                  {item.verified ? (
                    <Ionicons name="checkmark-circle" size={14} color={colors.brandCyan} />
                  ) : null}
                </View>
                <Text style={[styles.userHandle, { color: colors.textTertiary }]} numberOfLines={1}>
                  @{item.handle}
                </Text>
                <Text style={[styles.userBio, { color: colors.textSecondary }]} numberOfLines={1}>
                  {item.bio}
                </Text>
              </View>

              <Pressable
                style={[
                  styles.followBtn,
                  isFollowing
                    ? [styles.followBtnDone, { backgroundColor: colors.surfaceMuted }]
                    : [styles.followBtnActive, { backgroundColor: colors.brand }],
                ]}
                onPress={(e) => {
                  e.stopPropagation();
                  toggleFollow(item.id);
                }}
              >
                <Text
                  style={[
                    styles.followBtnText,
                    { color: isFollowing ? colors.textSecondary : '#FFFFFF' },
                  ]}
                >
                  {isFollowing ? (activeTab === 'followers' ? '互相关注' : '已关注') : '+ 关注'}
                </Text>
              </Pressable>
            </Pressable>
          );
        }}
      />
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
  tabBar: {
    flexDirection: 'row',
    height: 44,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
  },
  tabTextActive: {
    fontWeight: '700',
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    width: 28,
    height: 3,
    borderRadius: 2,
  },
  searchBoxWrap: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    height: 38,
    borderRadius: 19,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 0,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  userInfo: {
    flex: 1,
    gap: 2,
  },
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  userName: {
    fontSize: 15,
    fontWeight: '600',
  },
  userHandle: {
    fontSize: 12,
  },
  userBio: {
    fontSize: 12,
    marginTop: 2,
  },
  followBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    minWidth: 74,
    alignItems: 'center',
  },
  followBtnActive: {},
  followBtnDone: {},
  followBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  emptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
  },
});
