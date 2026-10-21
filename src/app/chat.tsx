import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar } from '../components/ui/Avatar';
import { CREATOR_AUTOREPLIES, type ChatMessage } from '../data/chat';
import { CURRENT_USER, getCreator } from '../data/creators';
import { useAppStore } from '../store/useAppStore';
import { useTheme } from '../theme/useTheme';

const QUICK_EMOJIS = ['❤️', '👍', '😂', '🔥', '👏', '🥰', '🙏', '💯', '✨', '☕'];

export default function ChatScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ id?: string; creatorId?: string }>();
  const creatorId = params.creatorId || params.id || 'u4';
  const creator = getCreator(creatorId);

  const { colors } = useTheme();

  const chatMessages = useAppStore((state) => state.chatMessages);
  const sendChatMessage = useAppStore((state) => state.sendChatMessage);
  const receiveChatMessage = useAppStore((state) => state.receiveChatMessage);
  const markConversationRead = useAppStore((state) => state.markConversationRead);
  const followedCreators = useAppStore((state) => state.followedCreators);
  const toggleFollow = useAppStore((state) => state.toggleFollow);

  const isFollowed = Boolean(followedCreators[creatorId]);
  const messages = chatMessages[creatorId] ?? [];

  const [inputVal, setInputVal] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const flatListRef = useRef<FlatList<ChatMessage>>(null);

  // 进入聊天页面时标记为已读
  useEffect(() => {
    markConversationRead(creatorId);
  }, [creatorId, markConversationRead]);

  // 发送消息
  const handleSend = (textToSend?: string) => {
    const text = (textToSend || inputVal).trim();
    if (!text) return;

    sendChatMessage(creatorId, text);
    if (!textToSend) setInputVal('');

    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);

    // 智能模拟对方回复
    triggerAutoReply();
  };

  const triggerAutoReply = () => {
    const replies = CREATOR_AUTOREPLIES[creatorId] || [
      '哈哈，收到啦！有空常聊哦~',
      '太棒了，感谢支持！❤️',
      '在呢在呢！刚刚去忙了一下下。',
    ];

    setTimeout(() => {
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        const randomReply = replies[Math.floor(Math.random() * replies.length)];
        receiveChatMessage(creatorId, randomReply);
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }, 1400);
    }, 800);
  };

  const insertEmoji = (emoji: string) => {
    setInputVal((prev) => prev + emoji);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* 顶部导航栏 */}
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + 8,
            backgroundColor: colors.surface,
            borderBottomColor: colors.divider,
          },
        ]}
      >
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="返回"
        >
          <Ionicons name="chevron-back" size={26} color={colors.textPrimary} />
        </Pressable>

        <View style={styles.headerTitleWrap}>
          <View style={styles.headerAvatarWrap}>
            <Avatar source={creator.avatar} size={34} />
            <View style={[styles.onlineDot, { borderColor: colors.surface }]} />
          </View>
          <View style={styles.headerNameWrap}>
            <Text style={[styles.headerName, { color: colors.textPrimary }]} numberOfLines={1}>
              {creator.name}
            </Text>
            <Text style={[styles.headerStatus, { color: isTyping ? colors.brand : colors.textTertiary }]}>
              {isTyping ? '正在输入...' : '在线'}
            </Text>
          </View>
        </View>

        <View style={styles.headerRightActions}>
          <Pressable
            style={[
              styles.followBtn,
              {
                backgroundColor: isFollowed ? colors.surfaceMuted : colors.brand,
                borderColor: isFollowed ? colors.divider : 'transparent',
              },
            ]}
            onPress={() => toggleFollow(creatorId)}
            accessibilityRole="button"
          >
            <Text
              style={[
                styles.followBtnText,
                { color: isFollowed ? colors.textSecondary : '#FFFFFF' },
              ]}
            >
              {isFollowed ? '已关注' : '+ 关注'}
            </Text>
          </Pressable>
        </View>
      </View>

      {/* 聊天消息列表 */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.chatArea}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            styles.messageList,
            { paddingBottom: 16 },
          ]}
          showsVerticalScrollIndicator={false}
          onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
          ListHeaderComponent={
            <View style={styles.chatIntro}>
              <Avatar source={creator.avatar} size={64} />
              <Text style={[styles.introName, { color: colors.textPrimary }]}>{creator.name}</Text>
              <Text style={[styles.introBio, { color: colors.textTertiary }]}>
                {creator.bio || `抖音号：${creator.handle}`}
              </Text>
              <View style={[styles.introDivider, { backgroundColor: colors.divider }]} />
              <Text style={[styles.introNotice, { color: colors.textTertiary }]}>
                开始与 {creator.name} 的私信聊天吧
              </Text>
            </View>
          }
          renderItem={({ item, index }) => {
            const isMe = item.senderId === 'me';
            const showTime =
              index === 0 ||
              item.createdAt - (messages[index - 1]?.createdAt || 0) > 1000 * 60 * 5;

            return (
              <View style={styles.msgItemWrapper}>
                {showTime ? (
                  <View style={styles.timeTagWrap}>
                    <Text style={[styles.timeTag, { color: colors.textTertiary }]}>
                      {item.timeLabel}
                    </Text>
                  </View>
                ) : null}

                <View style={[styles.msgRow, isMe ? styles.msgRowMe : styles.msgRowOther]}>
                  {!isMe ? <Avatar source={creator.avatar} size={36} /> : null}

                  <View
                    style={[
                      styles.msgBubble,
                      isMe
                        ? [styles.msgBubbleMe, { backgroundColor: colors.brand }]
                        : [
                            styles.msgBubbleOther,
                            {
                              backgroundColor: colors.surface,
                              borderColor: colors.cardBorder,
                              borderWidth: 1,
                            },
                          ],
                    ]}
                  >
                    <Text
                      style={[
                        styles.msgText,
                        { color: isMe ? '#FFFFFF' : colors.textPrimary },
                      ]}
                      selectable
                    >
                      {item.text}
                    </Text>
                  </View>

                  {isMe ? <Avatar source={CURRENT_USER.avatar} size={36} /> : null}
                </View>
              </View>
            );
          }}
        />

        {/* 对方正在输入打字动效指示器 */}
        {isTyping ? (
          <View style={styles.typingIndicatorRow}>
            <Avatar source={creator.avatar} size={24} />
            <View
              style={[
                styles.typingBubble,
                { backgroundColor: colors.surface, borderColor: colors.divider },
              ]}
            >
              <Text style={[styles.typingDots, { color: colors.brand }]}>● ● ●</Text>
            </View>
          </View>
        ) : null}

        {/* 快捷 Emoji 表情条 */}
        <View
          style={[
            styles.quickEmojiBar,
            { backgroundColor: colors.surface, borderTopColor: colors.divider },
          ]}
        >
          {QUICK_EMOJIS.map((emoji) => (
            <Pressable
              key={emoji}
              onPress={() => insertEmoji(emoji)}
              style={styles.quickEmojiBtn}
              accessibilityRole="button"
              accessibilityLabel={`输入表情 ${emoji}`}
            >
              <Text style={styles.quickEmojiText}>{emoji}</Text>
            </Pressable>
          ))}
        </View>

        {/* 底部输入框与工具栏 */}
        <View
          style={[
            styles.inputBar,
            {
              paddingBottom: Math.max(insets.bottom, 10),
              backgroundColor: colors.surface,
              borderTopColor: colors.divider,
            },
          ]}
        >
          <View style={[styles.inputWrapper, { backgroundColor: colors.surfaceMuted }]}>
            <TextInput
              value={inputVal}
              onChangeText={setInputVal}
              placeholder={`发私信给 @${creator.name}...`}
              placeholderTextColor={colors.textTertiary}
              style={[styles.inputField, { color: colors.textPrimary }]}
              multiline
              maxLength={500}
              returnKeyType="send"
              onSubmitEditing={() => handleSend()}
            />
          </View>

          {inputVal.trim().length > 0 ? (
            <Pressable
              onPress={() => handleSend()}
              style={[styles.sendBtn, { backgroundColor: colors.brand }]}
              accessibilityRole="button"
              accessibilityLabel="发送"
            >
              <Ionicons name="send" size={17} color="#FFFFFF" />
            </Pressable>
          ) : (
            <View style={styles.actionTools}>
              <Pressable
                onPress={() => insertEmoji('❤️')}
                hitSlop={8}
                style={styles.toolBtn}
                accessibilityRole="button"
                accessibilityLabel="快捷爱心"
              >
                <Ionicons name="heart" size={24} color={colors.brand} />
              </Pressable>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -6,
  },
  headerTitleWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 4,
    gap: 10,
  },
  headerAvatarWrap: {
    position: 'relative',
  },
  onlineDot: {
    position: 'absolute',
    right: -1,
    bottom: -1,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#3ED598',
    borderWidth: 2,
  },
  headerNameWrap: {
    flex: 1,
  },
  headerName: {
    fontSize: 16,
    fontWeight: '700',
  },
  headerStatus: {
    fontSize: 11,
    marginTop: 1,
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  followBtn: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
  },
  followBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  chatArea: {
    flex: 1,
  },
  messageList: {
    paddingHorizontal: 14,
    paddingTop: 16,
  },
  chatIntro: {
    alignItems: 'center',
    paddingVertical: 20,
    gap: 6,
  },
  introName: {
    fontSize: 17,
    fontWeight: '700',
    marginTop: 6,
  },
  introBio: {
    fontSize: 12,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  introDivider: {
    width: 60,
    height: StyleSheet.hairlineWidth,
    marginVertical: 10,
  },
  introNotice: {
    fontSize: 12,
  },
  msgItemWrapper: {
    marginBottom: 14,
  },
  timeTagWrap: {
    alignItems: 'center',
    marginBottom: 10,
  },
  timeTag: {
    fontSize: 11,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  msgRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  msgRowMe: {
    justifyContent: 'flex-end',
  },
  msgRowOther: {
    justifyContent: 'flex-start',
  },
  msgBubble: {
    maxWidth: '74%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
  },
  msgBubbleMe: {
    borderBottomRightRadius: 4,
  },
  msgBubbleOther: {
    borderBottomLeftRadius: 4,
  },
  msgText: {
    fontSize: 15,
    lineHeight: 21,
  },
  typingIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 10,
    gap: 8,
  },
  typingBubble: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
  },
  typingDots: {
    fontSize: 12,
    letterSpacing: 2,
  },
  quickEmojiBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  quickEmojiBtn: {
    padding: 6,
    borderRadius: 8,
  },
  quickEmojiText: {
    fontSize: 19,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingTop: 8,
    gap: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  inputWrapper: {
    flex: 1,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    minHeight: 38,
    maxHeight: 100,
    justifyContent: 'center',
  },
  inputField: {
    fontSize: 15,
    padding: 0,
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionTools: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  toolBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
