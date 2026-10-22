import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';

import { commentsFor } from '../../data/comments';
import { CREATORS, getCreator } from '../../data/creators';
import type { Comment } from '../../data/types';
import { VIDEOS } from '../../data/videos';
import { formatCount } from '../../lib/format';
import { useAppStore } from '../../store/useAppStore';
import { colors } from '../../theme/tokens';
import { useTheme } from '../../theme/useTheme';
import { Avatar, openUserProfile } from '../ui/Avatar';
import { BottomSheet } from '../ui/BottomSheet';

/** Share of the screen height the sheet occupies when open. */
const SHEET_RATIO = 0.75;
const COMMENT_EMOJIS = ['👍', '❤️', '😂', '👏', '🔥', '🙏', '🥰', '💯'];

interface CommentRowProps {
  comment: Comment;
  liked: boolean;
  onToggleLike: (id: string) => void;
  onReply: (commentId: string, authorName: string) => void;
  onDelete?: (commentId: string) => void;
  onGoProfile: (creatorId: string) => void;
  colors: ReturnType<typeof useTheme>['colors'];
}

function CommentRow({
  comment,
  liked,
  onToggleLike,
  onReply,
  onDelete,
  onGoProfile,
  colors,
}: CommentRowProps) {
  const author = getCreator(comment.authorId);
  const likeCount = comment.likes + (liked ? 1 : 0);
  const [showAllReplies, setShowAllReplies] = useState(false);
  const isMe = comment.authorId === 'me';

  const visibleReplies = showAllReplies ? comment.replies : comment.replies.slice(0, 2);

  return (
    <View style={styles.row}>
      <Avatar
        source={author.avatar}
        size={36}
        onPress={() => onGoProfile(author.id)}
        accessibilityLabel={`进入 ${author.name} 的主页`}
      />
      <View style={styles.rowBody}>
        <View style={styles.rowMeta}>
          <Pressable hitSlop={4} onPress={() => onGoProfile(author.id)}>
            <Text style={[styles.rowName, { color: colors.textTertiary }]}>{author.name}</Text>
          </Pressable>
          {comment.isPinned ? <Text style={styles.pinned}>作者置顶</Text> : null}
          {isMe ? <Text style={[styles.pinned, { color: colors.brandCyan, borderColor: colors.brandCyan }]}>我的</Text> : null}
        </View>
        <Text style={[styles.rowText, { color: colors.textPrimary }]}>{comment.text}</Text>
        <View style={styles.rowFooter}>
          <Text style={[styles.rowTime, { color: colors.textTertiary }]}>{comment.timeLabel}</Text>
          <Pressable
            hitSlop={6}
            onPress={() => onReply(comment.id, author.name)}
            accessibilityRole="button"
            accessibilityLabel={`回复 ${author.name}`}
          >
            <Text style={[styles.rowReply, { color: colors.textTertiary }]}>回复</Text>
          </Pressable>
          {isMe && onDelete ? (
            <Pressable
              hitSlop={6}
              onPress={() => onDelete(comment.id)}
              accessibilityRole="button"
              accessibilityLabel="删除评论"
            >
              <Text style={[styles.rowDelete, { color: colors.textTertiary }]}>删除</Text>
            </Pressable>
          ) : null}
        </View>

        {comment.replies.length > 0 ? (
          <View style={[styles.replies, { borderLeftColor: colors.divider }]}>
            {visibleReplies.map((reply) => {
              const replyAuthor = getCreator(reply.authorId);
              return (
                <Pressable
                  key={reply.id}
                  onPress={() => onReply(comment.id, replyAuthor.name)}
                  style={styles.replyItem}
                >
                  <Text style={[styles.replyText, { color: colors.textSecondary }]}>
                    <Text
                      style={[styles.replyName, { color: colors.textTertiary }]}
                      onPress={() => onGoProfile(replyAuthor.id)}
                    >
                      {replyAuthor.name}：
                    </Text>
                    {reply.text}
                  </Text>
                </Pressable>
              );
            })}
            {comment.replies.length > 2 && !showAllReplies ? (
              <Pressable onPress={() => setShowAllReplies(true)} hitSlop={6}>
                <Text style={[styles.replyMore, { color: colors.textTertiary }]}>
                  展开全部 {comment.replies.length} 条回复 ›
                </Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}
      </View>


      <Pressable
        onPress={() => onToggleLike(comment.id)}
        hitSlop={8}
        style={styles.rowLike}
        accessibilityRole="button"
        accessibilityLabel="点赞这条评论"
      >
        <Ionicons
          name={liked ? 'heart' : 'heart-outline'}
          size={16}
          color={liked ? colors.brand : colors.textTertiary}
        />
        <Text style={styles.rowLikeText}>{formatCount(likeCount)}</Text>
      </Pressable>
    </View>
  );
}

/** Comment sheet for the video currently open in the feed. */
export function CommentsSheet() {
  const contentId = useAppStore((state) => state.commentsVideoId);
  const open = useAppStore((state) => state.commentsOpen);
  const closeComments = useAppStore((state) => state.closeComments);
  const likedComments = useAppStore((state) => state.likedComments);
  const toggleCommentLike = useAppStore((state) => state.toggleCommentLike);

  const customComments = useAppStore((state) => state.customComments);
  const addComment = useAppStore((state) => state.addComment);
  const deleteComment = useAppStore((state) => state.deleteComment);

  const { colors } = useTheme();
  const router = useRouter();

  const handleGoProfile = (targetId: string) => {
    closeComments();
    openUserProfile(router, targetId);
  };

  const { height } = useWindowDimensions();
  const sheetHeight = Math.round(height * SHEET_RATIO);

  const [draft, setDraft] = useState('');
  const [replyTarget, setReplyTarget] = useState<{ commentId: string; authorName: string } | null>(
    null,
  );
  const [showMentionPicker, setShowMentionPicker] = useState(false);

  const comments = useMemo(() => {
    if (!contentId) return [];
    const localList = customComments[contentId] ?? [];
    return [...localList, ...commentsFor(contentId)];
  }, [contentId, customComments]);

  const totalCount = useMemo(() => {
    if (!contentId) return 0;
    const base = VIDEOS.find((video) => video.id === contentId)?.metrics.comments ?? comments.length;
    return base + (customComments[contentId]?.length ?? 0);
  }, [contentId, comments.length, customComments]);

  const handleSubmit = useCallback(() => {
    const text = draft.trim();
    if (!text || !contentId) return;

    addComment(contentId, text, replyTarget?.commentId);
    setDraft('');
    setReplyTarget(null);
    setShowMentionPicker(false);
  }, [addComment, contentId, draft, replyTarget]);

  const handleReply = (commentId: string, authorName: string) => {
    setReplyTarget({ commentId, authorName });
    setShowMentionPicker(false);
  };

  const insertEmoji = (emoji: string) => {
    setDraft((prev) => prev + emoji);
  };

  const insertMention = (creatorName: string) => {
    setDraft((prev) => `${prev}@${creatorName} `);
    setShowMentionPicker(false);
  };

  return (
    <BottomSheet visible={open} onClose={closeComments} height={sheetHeight}>
      <View style={styles.sheetHeader}>
        <Text style={[styles.sheetTitle, { color: colors.textSecondary }]}>
          {formatCount(totalCount)} 条评论
        </Text>
        <Pressable
          onPress={closeComments}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="关闭评论"
        >
          <Ionicons name="close" size={22} color={colors.textSecondary} />
        </Pressable>
      </View>

      <FlatList
        data={comments}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <CommentRow
            comment={item}
            liked={Boolean(likedComments[item.id])}
            onToggleLike={toggleCommentLike}
            onReply={handleReply}
            onDelete={contentId ? (id) => deleteComment(contentId, id) : undefined}
            onGoProfile={handleGoProfile}
            colors={colors}
          />
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          <Text style={[styles.empty, { color: colors.textTertiary }]}>
            还没有评论，来说点什么吧
          </Text>
        }
      />

      {/* 回复特定评论浮条 */}
      {replyTarget ? (
        <View
          style={[
            styles.replyingBar,
            { backgroundColor: colors.surfaceMuted, borderTopColor: colors.divider },
          ]}
        >
          <Text style={[styles.replyingText, { color: colors.textSecondary }]} numberOfLines={1}>
            正在回复 <Text style={{ color: colors.brand, fontWeight: '600' }}>@{replyTarget.authorName}</Text>
          </Text>
          <Pressable
            hitSlop={8}
            onPress={() => setReplyTarget(null)}
            accessibilityRole="button"
            accessibilityLabel="取消回复"
          >
            <Ionicons name="close-circle" size={18} color={colors.textTertiary} />
          </Pressable>
        </View>
      ) : null}

      {/* 快捷 Emoji 表情条 */}
      <View
        style={[
          styles.quickEmojiRow,
          { backgroundColor: colors.surface, borderTopColor: colors.divider },
        ]}
      >
        {COMMENT_EMOJIS.map((emoji) => (
          <Pressable
            key={emoji}
            onPress={() => insertEmoji(emoji)}
            style={styles.emojiBtn}
            accessibilityRole="button"
            accessibilityLabel={`输入表情 ${emoji}`}
          >
            <Text style={styles.emojiBtnText}>{emoji}</Text>
          </Pressable>
        ))}
      </View>

      {/* @ 好友快速选择条 */}
      {showMentionPicker ? (
        <View
          style={[
            styles.mentionPickerBar,
            { backgroundColor: colors.surfaceMuted, borderTopColor: colors.divider },
          ]}
        >
          <Text style={[styles.mentionLabel, { color: colors.textTertiary }]}>选择要@的好友：</Text>
          <FlatList
            horizontal
            data={CREATORS.slice(0, 6)}
            keyExtractor={(item) => item.id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.mentionRow}
            renderItem={({ item }) => (
              <Pressable
                style={[styles.mentionChip, { backgroundColor: colors.surface }]}
                onPress={() => insertMention(item.name)}
                accessibilityRole="button"
              >
                <Avatar source={item.avatar} size={20} />
                <Text style={[styles.mentionChipText, { color: colors.textPrimary }]}>
                  {item.name}
                </Text>
              </Pressable>
            )}
          />
        </View>
      ) : null}

      {/* 输入框主栏 */}
      <View style={[styles.inputBar, { borderTopColor: colors.divider }]}>
        <View style={[styles.inputWrapper, { backgroundColor: colors.surfaceMuted }]}>
          <Ionicons name="create-outline" size={17} color={colors.textTertiary} />
          <TextInput
            value={draft}
            onChangeText={setDraft}
            onSubmitEditing={handleSubmit}
            placeholder={replyTarget ? `回复 @${replyTarget.authorName}...` : '说点什么...'}
            placeholderTextColor={colors.textTertiary}
            style={[styles.input, { color: colors.textPrimary }]}
            returnKeyType="send"
            accessibilityLabel="写评论"
          />
        </View>
        <Pressable
          hitSlop={8}
          onPress={() => setShowMentionPicker((v) => !v)}
          accessibilityRole="button"
          accessibilityLabel="@好友"
        >
          <Ionicons
            name="at-outline"
            size={24}
            color={showMentionPicker ? colors.brand : colors.textSecondary}
          />
        </Pressable>
        {draft.trim().length > 0 ? (
          <Pressable
            onPress={handleSubmit}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="发送评论"
          >
            <Ionicons name="send" size={22} color={colors.brand} />
          </Pressable>
        ) : null}
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  sheetTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  empty: {
    marginTop: 40,
    textAlign: 'center',
    color: colors.textTertiary,
    fontSize: 14,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
    paddingVertical: 10,
  },
  rowBody: {
    flex: 1,
  },
  rowMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  rowName: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textTertiary,
  },
  pinned: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.brand,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.brand,
    borderRadius: 3,
    paddingHorizontal: 3,
    paddingVertical: 1,
  },
  rowText: {
    marginTop: 3,
    fontSize: 15,
    lineHeight: 21,
    color: colors.textPrimary,
  },
  rowFooter: {
    marginTop: 5,
    flexDirection: 'row',
    gap: 14,
  },
  rowTime: {
    fontSize: 12,
    color: colors.textTertiary,
  },
  rowReply: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textTertiary,
  },
  replies: {
    marginTop: 8,
    paddingLeft: 10,
    borderLeftWidth: 2,
    borderLeftColor: colors.divider,
    gap: 4,
  },
  replyText: {
    fontSize: 14,
    lineHeight: 19,
    color: colors.textSecondary,
  },
  replyName: {
    color: colors.textTertiary,
  },
  replyMore: {
    marginTop: 2,
    fontSize: 13,
    fontWeight: '600',
    color: colors.textTertiary,
  },
  rowLike: {
    alignItems: 'center',
    gap: 2,
    paddingTop: 2,
    width: 34,
  },
  rowLikeText: {
    fontSize: 11,
    color: colors.textTertiary,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 4,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.divider,
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 38,
    paddingHorizontal: 12,
    borderRadius: 19,
    backgroundColor: colors.surfaceMuted,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: colors.textPrimary,
    padding: 0,
  },
  rowDelete: {
    fontSize: 12,
    fontWeight: '600',
  },
  replyItem: {
    paddingVertical: 2,
  },
  replyingBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  replyingText: {
    fontSize: 12,
    flex: 1,
  },
  quickEmojiRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  emojiBtn: {
    padding: 4,
  },
  emojiBtnText: {
    fontSize: 18,
  },
  mentionPickerBar: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 6,
  },
  mentionLabel: {
    fontSize: 11,
    marginLeft: 4,
  },
  mentionRow: {
    gap: 8,
    paddingVertical: 2,
  },
  mentionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
  },
  mentionChipText: {
    fontSize: 12,
    fontWeight: '500',
  },
});
