import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar, openUserProfile } from '../components/ui/Avatar';
import { CREATORS, getCreator } from '../data/creators';
import type { Creator, Video } from '../data/types';
import { VIDEOS } from '../data/videos';
import { formatCount } from '../lib/format';
import { useRemoteFeed } from '../lib/useRemoteFeed';
import { useAppStore } from '../store/useAppStore';
import { colors as defaultColors } from '../theme/tokens';
import { useTheme } from '../theme/useTheme';

const STORAGE_KEY_SEARCH_HISTORY = 'douyin_search_history_v1';

const DEFAULT_HISTORY = ['落日', '橘猫', '城市夜景', '手冲咖啡'];

interface TrendingItem {
  rank: number;
  word: string;
  heat: string;
  tag?: '热' | '新' | '爆';
}

const TRENDING_LIST: TrendingItem[] = [
  { rank: 1, word: '青岛石老人绝美落日', heat: '894.2万', tag: '爆' },
  { rank: 2, word: '凌晨三点的外滩摄影', heat: '752.6万', tag: '热' },
  { rank: 3, word: '手冲咖啡慢生活指南', heat: '618.9万', tag: '热' },
  { rank: 4, word: '两只橘猫的日常互怼', heat: '542.1万', tag: '新' },
  { rank: 5, word: '城市天台夜行纪实', heat: '439.8万' },
  { rank: 6, word: '海边住一整年是什么体验', heat: '382.4万' },
  { rank: 7, word: '治愈系白噪音与雨声', heat: '320.1万', tag: '新' },
  { rank: 8, word: '街头摄影的瞬间捕捉', heat: '298.5万' },
  { rank: 9, word: '独居青年的慢节奏周末', heat: '264.0万' },
  { rank: 10, word: '日落收集者的旅行地图', heat: '215.3万' },
];

type ResultTab = 'all' | 'video' | 'user' | 'topic';

export default function SearchScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();

  const [keyword, setKeyword] = useState('');
  const [history, setHistory] = useState<string[]>(DEFAULT_HISTORY);
  const [activeTab, setActiveTab] = useState<ResultTab>('all');
  const [hasSearched, setHasSearched] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // 视频预览弹窗状态
  const [previewVideo, setPreviewVideo] = useState<Video | null>(null);

  const inputRef = useRef<TextInput>(null);

  const followedCreators = useAppStore((state) => state.followedCreators);
  const toggleFollow = useAppStore((state) => state.toggleFollow);

  const remoteVideos = useRemoteFeed();
  const allVideos = useMemo(() => {
    return remoteVideos && remoteVideos.length > 0 ? remoteVideos : VIDEOS;
  }, [remoteVideos]);

  // 从本地持久化加载历史记录
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY_SEARCH_HISTORY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setHistory(parsed);
          }
        }
      } catch {
        // ignore fallback to default
      }
    })();
  }, []);

  const saveHistory = async (newList: string[]) => {
    setHistory(newList);
    try {
      await AsyncStorage.setItem(STORAGE_KEY_SEARCH_HISTORY, JSON.stringify(newList));
    } catch {
      // ignore
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 1600);
  };

  // 执行搜索
  const handleSearch = (textToSearch?: string) => {
    const query = (textToSearch !== undefined ? textToSearch : keyword).trim();
    if (!query) {
      showToast('请输入搜索内容');
      return;
    }
    setKeyword(query);
    setHasSearched(true);

    // 更新搜索历史
    const updated = [query, ...history.filter((item) => item !== query)].slice(0, 10);
    saveHistory(updated);
  };

  const handleClearHistory = () => {
    saveHistory([]);
    showToast('搜索历史已清空');
  };

  const handleRemoveHistoryItem = (itemToRemove: string) => {
    const updated = history.filter((item) => item !== itemToRemove);
    saveHistory(updated);
  };

  // 搜索匹配结果
  const cleanKey = keyword.trim().toLowerCase();

  const matchedVideos = useMemo(() => {
    if (!cleanKey) return [];
    return allVideos.filter((v) => {
      const matchCaption = v.caption.toLowerCase().includes(cleanKey);
      const matchTags = v.tags.some((t) => t.toLowerCase().includes(cleanKey));
      const matchMusic = v.music.toLowerCase().includes(cleanKey);
      const matchLoc = v.location ? v.location.toLowerCase().includes(cleanKey) : false;
      const creator = v.creator ?? getCreator(v.creatorId);
      const matchAuthor = creator ? creator.name.toLowerCase().includes(cleanKey) : false;
      return matchCaption || matchTags || matchMusic || matchLoc || matchAuthor;
    });
  }, [allVideos, cleanKey]);

  const matchedUsers = useMemo(() => {
    if (!cleanKey) return [];
    return CREATORS.filter((c) => {
      const matchName = c.name.toLowerCase().includes(cleanKey);
      const matchHandle = c.handle.toLowerCase().includes(cleanKey);
      const matchBio = c.bio.toLowerCase().includes(cleanKey);
      return matchName || matchHandle || matchBio;
    });
  }, [cleanKey]);

  // 从所有视频聚合匹配到的话题
  const matchedTopics = useMemo(() => {
    if (!cleanKey) return [];
    const topicMap: Record<string, { tag: string; count: number }> = {};
    for (const v of allVideos) {
      for (const t of v.tags) {
        const pure = t.replace(/^#/, '');
        if (pure.toLowerCase().includes(cleanKey) || cleanKey.includes(pure.toLowerCase())) {
          if (!topicMap[t]) {
            topicMap[t] = { tag: t, count: 0 };
          }
          topicMap[t].count += 1;
        }
      }
    }
    return Object.values(topicMap);
  }, [allVideos, cleanKey]);

  const isSearching = cleanKey.length > 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* 顶部搜索栏 */}
      <View style={[styles.header, { paddingTop: insets.top + 6 }]}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.6 }]}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="返回"
        >
          <Ionicons name="chevron-back" size={26} color={colors.textPrimary} />
        </Pressable>

        <View style={[styles.inputBox, { backgroundColor: colors.surfaceMuted }]}>
          <Ionicons name="search" size={18} color={colors.textTertiary} style={styles.searchIcon} />
          <TextInput
            ref={inputRef}
            style={[styles.input, { color: colors.textPrimary }]}
            placeholder="搜索用户、视频、话题、音乐"
            placeholderTextColor={colors.textTertiary}
            value={keyword}
            onChangeText={(val) => {
              setKeyword(val);
              if (!val.trim()) {
                setHasSearched(false);
              }
            }}
            returnKeyType="search"
            onSubmitEditing={() => handleSearch()}
            autoFocus
          />
          {keyword.length > 0 ? (
            <Pressable
              onPress={() => {
                setKeyword('');
                setHasSearched(false);
                inputRef.current?.focus();
              }}
              style={styles.clearBtn}
              hitSlop={8}
            >
              <Ionicons name="close-circle" size={18} color={colors.textTertiary} />
            </Pressable>
          ) : null}
        </View>

        <Pressable
          onPress={() => handleSearch()}
          style={({ pressed }) => [styles.searchActionBtn, pressed && { opacity: 0.7 }]}
          hitSlop={8}
        >
          <Text style={[styles.searchActionText, { color: colors.brand }]}>搜索</Text>
        </Pressable>
      </View>

      {/* 搜索分类 Tabs (有搜索词时显示) */}
      {isSearching ? (
        <View style={[styles.tabsBar, { borderBottomColor: colors.divider }]}>
          {(
            [
              { key: 'all', label: '全部' },
              { key: 'video', label: `视频 (${matchedVideos.length})` },
              { key: 'user', label: `用户 (${matchedUsers.length})` },
              { key: 'topic', label: `话题 (${matchedTopics.length})` },
            ] as const
          ).map((tab) => {
            const active = activeTab === tab.key;
            return (
              <Pressable
                key={tab.key}
                onPress={() => setActiveTab(tab.key)}
                style={styles.tabItem}
              >
                <Text
                  style={[
                    styles.tabItemText,
                    { color: active ? colors.textPrimary : colors.textTertiary },
                    active && styles.tabItemTextActive,
                  ]}
                >
                  {tab.label}
                </Text>
                {active ? (
                  <View style={[styles.tabUnderline, { backgroundColor: colors.brand }]} />
                ) : null}
              </Pressable>
            );
          })}
        </View>
      ) : null}

      {/* 内容区域：初始态 or 搜索结果态 */}
      {!isSearching ? (
        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* 搜索历史 */}
          {history.length > 0 ? (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>搜索历史</Text>
                <Pressable
                  onPress={handleClearHistory}
                  hitSlop={8}
                  style={styles.clearHistoryBtn}
                >
                  <Ionicons name="trash-outline" size={17} color={colors.textTertiary} />
                </Pressable>
              </View>

              <View style={styles.historyTags}>
                {history.map((item) => (
                  <View
                    key={item}
                    style={[styles.historyChip, { backgroundColor: colors.surfaceMuted }]}
                  >
                    <Pressable
                      onPress={() => handleSearch(item)}
                      style={styles.historyChipPress}
                    >
                      <Text style={[styles.historyText, { color: colors.textSecondary }]}>
                        {item}
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={() => handleRemoveHistoryItem(item)}
                      hitSlop={6}
                      style={styles.historyChipClose}
                    >
                      <Ionicons name="close" size={14} color={colors.textTertiary} />
                    </Pressable>
                  </View>
                ))}
              </View>
            </View>
          ) : null}

          {/* 抖音热搜榜 */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.trendingTitleRow}>
                <Ionicons name="flame" size={20} color={colors.brand} />
                <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                  抖音热搜
                </Text>
                <Text style={[styles.subSectionTitle, { color: colors.textTertiary }]}>
                  实时更新
                </Text>
              </View>
            </View>

            <View style={[styles.trendingCard, { backgroundColor: colors.surface }]}>
              {TRENDING_LIST.map((item) => {
                const isTop1 = item.rank === 1;
                const isTop2 = item.rank === 2;
                const isTop3 = item.rank === 3;
                const rankColor = isTop1
                  ? '#FE2C55'
                  : isTop2
                  ? '#FF7A00'
                  : isTop3
                  ? '#FFB800'
                  : colors.textTertiary;

                return (
                  <Pressable
                    key={item.rank}
                    style={({ pressed }) => [
                      styles.trendingRow,
                      { borderBottomColor: colors.divider },
                      pressed && { opacity: 0.7 },
                    ]}
                    onPress={() => handleSearch(item.word)}
                  >
                    <Text style={[styles.rankNumber, { color: rankColor }]}>{item.rank}</Text>
                    <Text
                      style={[styles.trendingWord, { color: colors.textPrimary }]}
                      numberOfLines={1}
                    >
                      {item.word}
                    </Text>

                    {item.tag ? (
                      <View
                        style={[
                          styles.trendBadge,
                          item.tag === '爆'
                            ? styles.badgeHot
                            : item.tag === '热'
                            ? styles.badgeWarm
                            : styles.badgeNew,
                        ]}
                      >
                        <Text style={styles.trendBadgeText}>{item.tag}</Text>
                      </View>
                    ) : null}

                    <Text style={[styles.heatText, { color: colors.textTertiary }]}>
                      {item.heat}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </ScrollView>
      ) : (
        /* 搜索结果区域 */
        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* 空结果提示 */}
          {matchedVideos.length === 0 && matchedUsers.length === 0 && matchedTopics.length === 0 ? (
            <View style={styles.emptyWrap}>
              <Ionicons name="search-outline" size={64} color={colors.textTertiary} />
              <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
                暂无与 &ldquo;{keyword}&rdquo; 相关的内容
              </Text>
              <Text style={[styles.emptySubtitle, { color: colors.textTertiary }]}>
                试试换一个搜索词，或者查看下方的推荐热搜
              </Text>
            </View>
          ) : null}

          {/* 1. 全部 Tab 或 用户 Tab: 用户结果 */}
          {(activeTab === 'all' || activeTab === 'user') && matchedUsers.length > 0 ? (
            <View style={styles.resultGroup}>
              {activeTab === 'all' ? (
                <View style={styles.groupHeader}>
                  <Text style={[styles.groupTitle, { color: colors.textPrimary }]}>用户</Text>
                  <Pressable onPress={() => setActiveTab('user')}>
                    <Text style={[styles.viewMore, { color: colors.brand }]}>
                      查看全部 ({matchedUsers.length}) &gt;
                    </Text>
                  </Pressable>
                </View>
              ) : null}

              {matchedUsers.map((creator) => {
                const isFollowing = Boolean(followedCreators[creator.id]);
                return (
                  <Pressable
                    key={creator.id}
                    style={[
                      styles.userCard,
                      { backgroundColor: colors.surface, borderColor: colors.cardBorder },
                    ]}
                    onPress={() => openUserProfile(router, creator.id)}
                  >
                    <Avatar source={creator.avatar} size={54} creatorId={creator.id} />
                    <View style={styles.userInfo}>
                      <View style={styles.userNameRow}>
                        <Text
                          style={[styles.userName, { color: colors.textPrimary }]}
                          numberOfLines={1}
                        >
                          {creator.name}
                        </Text>
                        {creator.verified ? (
                          <Ionicons
                            name="checkmark-circle"
                            size={15}
                            color="#20D5EC"
                            style={styles.verifyIcon}
                          />
                        ) : null}
                      </View>
                      <Text style={[styles.userHandle, { color: colors.textTertiary }]}>
                        抖音号：{creator.handle}
                      </Text>
                      <Text
                        style={[styles.userBio, { color: colors.textSecondary }]}
                        numberOfLines={1}
                      >
                        {creator.bio}
                      </Text>
                      <View style={styles.userStats}>
                        <Text style={[styles.statItem, { color: colors.textTertiary }]}>
                          <Text style={{ color: colors.textPrimary, fontWeight: '600' }}>
                            {formatCount(creator.stats.followers)}
                          </Text>{' '}
                          粉丝
                        </Text>
                        <Text style={[styles.statDot, { color: colors.textTertiary }]}>·</Text>
                        <Text style={[styles.statItem, { color: colors.textTertiary }]}>
                          <Text style={{ color: colors.textPrimary, fontWeight: '600' }}>
                            {formatCount(creator.stats.likes)}
                          </Text>{' '}
                          获赞
                        </Text>
                      </View>
                    </View>

                    {/* 关注按钮 */}
                    <Pressable
                      style={[
                        styles.followBtn,
                        isFollowing
                          ? [styles.followBtnDone, { backgroundColor: colors.surfaceMuted }]
                          : [styles.followBtnNormal, { backgroundColor: colors.brand }],
                      ]}
                      onPress={(e) => {
                        e.stopPropagation();
                        toggleFollow(creator.id);
                        showToast(isFollowing ? `已取消关注 ${creator.name}` : `已关注 ${creator.name}`);
                      }}
                    >
                      <Text
                        style={[
                          styles.followBtnText,
                          { color: isFollowing ? colors.textTertiary : '#FFFFFF' },
                        ]}
                      >
                        {isFollowing ? '已关注' : '+ 关注'}
                      </Text>
                    </Pressable>
                  </Pressable>
                );
              })}
            </View>
          ) : null}

          {/* 2. 全部 Tab 或 话题 Tab: 话题结果 */}
          {(activeTab === 'all' || activeTab === 'topic') && matchedTopics.length > 0 ? (
            <View style={styles.resultGroup}>
              {activeTab === 'all' ? (
                <View style={styles.groupHeader}>
                  <Text style={[styles.groupTitle, { color: colors.textPrimary }]}>相关话题</Text>
                </View>
              ) : null}
              <View style={styles.topicsGrid}>
                {matchedTopics.map((item) => (
                  <Pressable
                    key={item.tag}
                    style={[styles.topicChip, { backgroundColor: colors.surfaceMuted }]}
                    onPress={() => {
                      setKeyword(item.tag.replace(/^#/, ''));
                      setActiveTab('video');
                    }}
                  >
                    <Ionicons name="pricetag" size={14} color={colors.brand} />
                    <Text style={[styles.topicText, { color: colors.textPrimary }]}>
                      {item.tag}
                    </Text>
                    <Text style={[styles.topicCount, { color: colors.textTertiary }]}>
                      {item.count} 条作品
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          ) : null}

          {/* 3. 全部 Tab 或 视频 Tab: 视频结果 (网格/瀑布流卡片) */}
          {(activeTab === 'all' || activeTab === 'video') && matchedVideos.length > 0 ? (
            <View style={styles.resultGroup}>
              {activeTab === 'all' ? (
                <View style={styles.groupHeader}>
                  <Text style={[styles.groupTitle, { color: colors.textPrimary }]}>
                    相关视频 ({matchedVideos.length})
                  </Text>
                </View>
              ) : null}

              <View style={styles.videoGrid}>
                {matchedVideos.map((item) => {
                  const creator = item.creator ?? getCreator(item.creatorId);
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
                        <Image
                          source={item.thumbnail}
                          style={styles.videoCover}
                          resizeMode="cover"
                        />
                        <View style={styles.playOverlay}>
                          <Ionicons name="play" size={13} color="#FFFFFF" />
                          <Text style={styles.playText}>{formatCount(item.metrics.likes)}</Text>
                        </View>
                      </View>
                      <View style={styles.cardInfo}>
                        <Text
                          style={[styles.videoCaption, { color: colors.textPrimary }]}
                          numberOfLines={2}
                        >
                          {item.caption}
                        </Text>
                        <Pressable
                          style={styles.authorRow}
                          onPress={(e) => {
                            e.stopPropagation();
                            openUserProfile(router, item.creatorId);
                          }}
                        >
                          <Avatar source={creator.avatar} size={20} creatorId={item.creatorId} />
                          <Text
                            style={[styles.authorName, { color: colors.textTertiary }]}
                            numberOfLines={1}
                          >
                            {creator.name}
                          </Text>
                        </Pressable>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ) : null}
        </ScrollView>
      )}

      {/* 视频点击全屏/弹窗播放预览 */}
      {previewVideo ? (
        <VideoPreviewModal
          video={previewVideo}
          onClose={() => setPreviewVideo(null)}
          onAuthorPress={(creatorId) => {
            setPreviewVideo(null);
            openUserProfile(router, creatorId);
          }}
        />
      ) : null}

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

/** 视频预览弹出层 */
function VideoPreviewModal({
  video,
  onClose,
  onAuthorPress,
}: {
  video: Video;
  onClose: () => void;
  onAuthorPress: (creatorId: string) => void;
}) {
  const insets = useSafeAreaInsets();
  const player = useVideoPlayer(video.source, (p) => {
    p.loop = true;
    p.play();
  });
  const creator = video.creator ?? getCreator(video.creatorId);

  return (
    <Modal visible animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.modalBg}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={[styles.modalCard, { marginTop: insets.top + 20, marginBottom: insets.bottom + 20 }]}>
          <VideoView player={player} style={styles.modalVideo} contentFit="cover" />

          {/* 顶部关闭按钮 */}
          <Pressable
            style={styles.modalCloseBtn}
            onPress={onClose}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="关闭预览"
          >
            <Ionicons name="close" size={24} color="#FFFFFF" />
          </Pressable>

          {/* 底部信息浮层 */}
          <View style={styles.modalBottomInfo} pointerEvents="box-none">
            <Pressable
              style={styles.modalAuthorRow}
              onPress={() => onAuthorPress(video.creatorId)}
            >
              <Avatar source={creator.avatar} size={36} ring />
              <Text style={styles.modalAuthorName}>@{creator.name}</Text>
            </Pressable>
            <Text style={styles.modalCaption}>{video.caption}</Text>
            <View style={styles.modalTagsRow}>
              {video.tags.map((t) => (
                <Text key={t} style={styles.modalTag}>
                  {t}
                </Text>
              ))}
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingBottom: 10,
    gap: 10,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputBox: {
    flex: 1,
    height: 38,
    borderRadius: 19,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 6,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 14,
    padding: 0,
  },
  clearBtn: {
    padding: 4,
  },
  searchActionBtn: {
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  searchActionText: {
    fontSize: 15,
    fontWeight: '600',
  },
  tabsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  tabItem: {
    paddingVertical: 10,
    marginRight: 24,
    alignItems: 'center',
  },
  tabItemText: {
    fontSize: 14,
    fontWeight: '500',
  },
  tabItemTextActive: {
    fontWeight: '700',
  },
  tabUnderline: {
    position: 'absolute',
    bottom: 0,
    width: 20,
    height: 2.5,
    borderRadius: 2,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 12,
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  trendingTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  subSectionTitle: {
    fontSize: 12,
    marginLeft: 4,
  },
  clearHistoryBtn: {
    padding: 4,
  },
  historyTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  historyChip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    paddingLeft: 12,
    paddingRight: 6,
    paddingVertical: 6,
  },
  historyChipPress: {
    marginRight: 4,
  },
  historyText: {
    fontSize: 13,
  },
  historyChipClose: {
    padding: 2,
  },
  trendingCard: {
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  trendingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rankNumber: {
    width: 24,
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
    marginRight: 10,
  },
  trendingWord: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },
  trendBadge: {
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 8,
  },
  badgeHot: {
    backgroundColor: '#FE2C55',
  },
  badgeWarm: {
    backgroundColor: '#FF7A00',
  },
  badgeNew: {
    backgroundColor: '#25F4EE',
  },
  trendBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  heatText: {
    fontSize: 12,
  },
  emptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 6,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: 'center',
  },
  resultGroup: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  groupTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  viewMore: {
    fontSize: 13,
    fontWeight: '600',
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 10,
  },
  userInfo: {
    flex: 1,
    marginLeft: 12,
    marginRight: 10,
  },
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userName: {
    fontSize: 15,
    fontWeight: '700',
  },
  verifyIcon: {
    marginLeft: 4,
  },
  userHandle: {
    fontSize: 12,
    marginTop: 2,
  },
  userBio: {
    fontSize: 12,
    marginTop: 4,
  },
  userStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  statItem: {
    fontSize: 11,
  },
  statDot: {
    marginHorizontal: 6,
    fontSize: 11,
  },
  followBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 16,
  },
  followBtnNormal: {
    backgroundColor: '#FE2C55',
  },
  followBtnDone: {},
  followBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  topicsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  topicChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  topicText: {
    fontSize: 13,
    fontWeight: '600',
  },
  topicCount: {
    fontSize: 11,
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
  videoCover: {
    width: '100%',
    height: '100%',
  },
  playOverlay: {
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
  playText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  cardInfo: {
    padding: 8,
  },
  videoCaption: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
    marginBottom: 6,
  },
  authorRow: {
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
    backgroundColor: 'rgba(0, 0, 0, 0.92)',
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
  modalVideo: {
    width: '100%',
    height: '100%',
  },
  modalCloseBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  modalBottomInfo: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalAuthorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  modalAuthorName: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  modalCaption: {
    color: '#FFFFFF',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 6,
  },
  modalTagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  modalTag: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
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
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  toastText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '500',
  },
});
