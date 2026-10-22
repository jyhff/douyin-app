import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar, openUserProfile } from '../../components/ui/Avatar';
import { SOCIAL_NOTIFICATIONS, type NotificationItem } from '../../data/chat';
import { INBOX_SHORTCUTS } from '../../data/conversations';
import { getCreator } from '../../data/creators';
import { useTabBarHeight } from '../../lib/useTabBarHeight';
import { useAppStore } from '../../store/useAppStore';
import { colors } from '../../theme/tokens';
import { useTheme } from '../../theme/useTheme';

type IconName = React.ComponentProps<typeof Ionicons>['name'];
type ShortcutType = 'fan' | 'like' | 'mention' | 'comment';

/** 消息 tab: quick entries (粉丝 / 赞 / @ / 评论) then the conversation list. */
export default function InboxScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useTabBarHeight();
  const { colors } = useTheme();

  const conversations = useAppStore((state) => state.conversations);
  const followedCreators = useAppStore((state) => state.followedCreators);
  const toggleFollow = useAppStore((state) => state.toggleFollow);

  // 社交互动通知弹层状态
  const [activeNoticeType, setActiveNoticeType] = useState<ShortcutType | null>(null);

  const getNoticeTitle = (type: ShortcutType) => {
    switch (type) {
      case 'fan':
        return '新粉丝';
      case 'like':
        return '赞';
      case 'mention':
        return '@我的';
      case 'comment':
        return '评论';
    }
  };

  const currentNoticeList: NotificationItem[] = activeNoticeType
    ? SOCIAL_NOTIFICATIONS[activeNoticeType] || []
    : [];

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <FlatList
        data={conversations}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{
          paddingTop: insets.top + 12,
          paddingBottom: tabBarHeight + 24,
        }}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View>
            <View style={styles.titleRow}>
              <Text style={[styles.title, { color: colors.textPrimary }]}>消息</Text>
              <Pressable
                style={[styles.createChatBtn, { backgroundColor: colors.surfaceMuted }]}
                onPress={() => router.push({ pathname: '/chat', params: { creatorId: 'u4' } })}
                accessibilityRole="button"
                accessibilityLabel="发起私信"
              >
                <Ionicons name="create-outline" size={17} color={colors.textPrimary} />
                <Text style={[styles.createChatBtnText, { color: colors.textPrimary }]}>发起聊天</Text>
              </Pressable>
            </View>

            <View style={styles.shortcuts}>
              {INBOX_SHORTCUTS.map((shortcut) => {
                const typeMap: Record<string, ShortcutType> = {
                  s1: 'fan',
                  s2: 'like',
                  s3: 'mention',
                  s4: 'comment',
                };
                const sType = typeMap[shortcut.id] || 'fan';

                return (
                  <Pressable
                    key={shortcut.id}
                    style={styles.shortcut}
                    onPress={() => setActiveNoticeType(sType)}
                    accessibilityRole="button"
                    accessibilityLabel={shortcut.label}
                  >
                    <View style={[styles.shortcutIcon, { backgroundColor: `${shortcut.tint}22` }]}>
                      <Ionicons
                        name={shortcut.icon as IconName}
                        size={24}
                        color={shortcut.tint}
                      />
                      {shortcut.badge > 0 ? (
                        <View style={styles.shortcutBadge}>
                          <Text style={styles.shortcutBadgeText}>
                            {shortcut.badge > 99 ? '99+' : shortcut.badge}
                          </Text>
                        </View>
                      ) : null}
                    </View>
                    <Text style={[styles.shortcutLabel, { color: colors.textSecondary }]}>
                      {shortcut.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={[styles.divider, { backgroundColor: colors.divider }]} />
          </View>
        }
        renderItem={({ item }) => {
          const creator = getCreator(item.creatorId);
          return (
            <Pressable
              style={styles.row}
              onPress={() =>
                router.push({ pathname: '/chat', params: { creatorId: item.creatorId } })
              }
              accessibilityRole="button"
              accessibilityLabel={`与 ${creator.name} 的对话`}
            >
              <View>
                <Avatar
                  source={creator.avatar}
                  size={50}
                  onPress={() => openUserProfile(router, creator.id)}
                  accessibilityLabel={`进入 ${creator.name} 的主页`}
                />
                {item.unread > 0 ? (
                  <View style={styles.unread}>
                    <Text style={styles.unreadText}>
                      {item.unread > 99 ? '99+' : item.unread}
                    </Text>
                  </View>
                ) : null}
              </View>

              <View style={styles.rowBody}>
                <View style={styles.rowTop}>
                  <Text style={[styles.rowName, { color: colors.textPrimary }]} numberOfLines={1}>
                    {creator.name}
                  </Text>
                  <Text style={[styles.rowTime, { color: colors.textTertiary }]}>{item.timeLabel}</Text>
                </View>
                <Text style={[styles.rowMessage, { color: colors.textTertiary }]} numberOfLines={1}>
                  {item.lastMessage}
                </Text>
                {item.context ? (
                  <View style={[styles.contextChip, { backgroundColor: colors.surfaceMuted }]}>
                    <Text style={[styles.contextText, { color: colors.textTertiary }]}>{item.context}</Text>
                  </View>
                ) : null}
              </View>
            </Pressable>
          );
        }}
      />

      {/* 社交互动消息弹层 Modal */}
      <Modal
        visible={Boolean(activeNoticeType)}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setActiveNoticeType(null)}
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View
            style={[
              styles.modalHeader,
              {
                paddingTop: insets.top + 8,
                backgroundColor: colors.surface,
                borderBottomColor: colors.divider,
              },
            ]}
          >
            <Pressable
              onPress={() => setActiveNoticeType(null)}
              hitSlop={10}
              style={styles.modalCloseBtn}
              accessibilityRole="button"
              accessibilityLabel="关闭"
            >
              <Ionicons name="close" size={24} color={colors.textPrimary} />
            </Pressable>
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
              {activeNoticeType ? getNoticeTitle(activeNoticeType) : ''}
            </Text>
            <View style={{ width: 36 }} />
          </View>

          <FlatList
            data={currentNoticeList}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.noticeList}
            renderItem={({ item }) => {
              const creator = getCreator(item.creatorId);
              const isFollowing = Boolean(followedCreators[item.creatorId]);

              return (
                <View
                  style={[
                    styles.noticeRow,
                    { backgroundColor: colors.surface, borderColor: colors.cardBorder },
                  ]}
                >
                  <Pressable
                    onPress={() => {
                      setActiveNoticeType(null);
                      openUserProfile(router, item.creatorId);
                    }}
                    hitSlop={4}
                    accessibilityRole="button"
                    accessibilityLabel={`进入 ${creator.name} 的主页`}
                  >
                    <Avatar source={creator.avatar} size={44} />
                  </Pressable>

                  <View style={styles.noticeBody}>
                    <Pressable
                      onPress={() => {
                        setActiveNoticeType(null);
                        openUserProfile(router, item.creatorId);
                      }}
                      hitSlop={4}
                    >
                      <Text style={[styles.noticeName, { color: colors.textPrimary }]}>
                        {creator.name}
                      </Text>
                    </Pressable>
                    <Text style={[styles.noticeAction, { color: colors.textSecondary }]}>
                      {item.content}
                    </Text>
                    {item.quote ? (
                      <View style={[styles.quoteBox, { backgroundColor: colors.surfaceMuted }]}>
                        <Text style={[styles.quoteText, { color: colors.textTertiary }]} numberOfLines={1}>
                          {item.quote}
                        </Text>
                      </View>
                    ) : null}
                    <Text style={[styles.noticeTime, { color: colors.textTertiary }]}>
                      {item.timeLabel}
                    </Text>
                  </View>

                  <View style={styles.noticeActions}>
                    {activeNoticeType === 'fan' ? (
                      <Pressable
                        style={[
                          styles.noticeFollowBtn,
                          {
                            backgroundColor: isFollowing ? colors.surfaceMuted : colors.brand,
                          },
                        ]}
                        onPress={() => toggleFollow(item.creatorId)}
                        accessibilityRole="button"
                      >
                        <Text
                          style={[
                            styles.noticeFollowText,
                            { color: isFollowing ? colors.textSecondary : '#FFFFFF' },
                          ]}
                        >
                          {isFollowing ? '已关注' : '回关'}
                        </Text>
                      </Pressable>
                    ) : (
                      <Pressable
                        style={[styles.noticeChatBtn, { backgroundColor: colors.surfaceMuted }]}
                        onPress={() => {
                          setActiveNoticeType(null);
                          router.push({ pathname: '/chat', params: { creatorId: item.creatorId } });
                        }}
                        accessibilityRole="button"
                        accessibilityLabel="发私信"
                      >
                        <Text style={[styles.noticeChatText, { color: colors.textPrimary }]}>
                          私信
                        </Text>
                      </Pressable>
                    )}
                  </View>
                </View>
              );
            }}
          />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  title: {
    paddingHorizontal: 16,
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  shortcuts: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  shortcut: {
    alignItems: 'center',
    gap: 8,
  },
  shortcutIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shortcutBadge: {
    position: 'absolute',
    top: -2,
    right: -4,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: 9,
    backgroundColor: colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shortcutBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
  },
  shortcutLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  divider: {
    marginTop: 22,
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.divider,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  rowBody: {
    flex: 1,
    gap: 3,
  },
  rowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  rowName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  rowTime: {
    fontSize: 11,
    color: colors.textTertiary,
  },
  rowMessage: {
    fontSize: 13,
    color: colors.textTertiary,
  },
  contextChip: {
    alignSelf: 'flex-start',
    marginTop: 2,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: colors.surfaceMuted,
  },
  contextText: {
    fontSize: 10,
    color: colors.textTertiary,
  },
  unread: {
    position: 'absolute',
    top: -3,
    right: -3,
    minWidth: 19,
    height: 19,
    paddingHorizontal: 5,
    borderRadius: 10,
    backgroundColor: colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.background,
  },
  unreadText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingRight: 16,
  },
  createChatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  createChatBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  modalCloseBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  noticeList: {
    padding: 16,
    gap: 12,
  },
  noticeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
  },
  noticeBody: {
    flex: 1,
    gap: 3,
  },
  noticeName: {
    fontSize: 15,
    fontWeight: '600',
  },
  noticeAction: {
    fontSize: 13,
  },
  quoteBox: {
    marginTop: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
  },
  quoteText: {
    fontSize: 12,
  },
  noticeTime: {
    fontSize: 11,
    marginTop: 4,
  },
  noticeActions: {
    alignSelf: 'center',
  },
  noticeFollowBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
  },
  noticeFollowText: {
    fontSize: 13,
    fontWeight: '600',
  },
  noticeChatBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
  },
  noticeChatText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
