import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { INITIAL_MESSAGES, type ChatMessage } from '../data/chat';
import { CONVERSATIONS } from '../data/conversations';
import { CURRENT_USER } from '../data/creators';
import { INITIAL_DANMAKUS } from '../data/danmaku';
import type { Comment, Conversation, DanmakuItem, HistoryItem, UserProfile, Video } from '../data/types';

/**
 * Which feed tab is selected:
 * `following` - videos from followed creators
 * `city` - local city videos with distance and geolocation
 * `recommended` - algorithmic recommendation feed
 */
export type FeedTab = 'following' | 'city' | 'recommended';
export type ThemeMode = 'system' | 'dark' | 'light';

interface AppState {
  /** Ids of videos the user has liked. */
  likedVideos: Record<string, boolean>;
  /** Ids of videos saved to favourites. */
  favoritedVideos: Record<string, boolean>;
  /** Creator ids the user follows. */
  followedCreators: Record<string, boolean>;
  /** Comment ids the user has liked. */
  likedComments: Record<string, boolean>;

  /** Playback volume is off. Persisted so the preference survives restarts. */
  muted: boolean;
  /** Theme appearance mode: 'system', 'dark', or 'light'. */
  themeMode: ThemeMode;
  /** Selected tab on the home feed. */
  feedTab: FeedTab;
  /** Currently selected city for city feed */
  selectedCity: string;

  /** Video whose comment sheet is showing. */
  commentsVideoId: string | null;
  commentsOpen: boolean;
  /** Same split as the comment sheet, for the share sheet. */
  shareVideoId: string | null;
  shareOpen: boolean;

  /** Chat messages keyed by creatorId */
  chatMessages: Record<string, ChatMessage[]>;
  /** Conversation summaries */
  conversations: Conversation[];
  /** Custom user comments and replies keyed by videoId */
  customComments: Record<string, Comment[]>;

  /** Danmaku floating comments */
  danmakuEnabled: boolean;
  danmakus: Record<string, DanmakuItem[]>;

  /** Watch history */
  historyVideos: HistoryItem[];

  /** User profile */
  userProfile: UserProfile;

  toggleLike: (videoId: string) => void;
  toggleFavorite: (videoId: string) => void;
  toggleFollow: (creatorId: string) => void;
  toggleCommentLike: (commentId: string) => void;
  toggleMute: () => void;
  setThemeMode: (mode: ThemeMode) => void;
  setFeedTab: (tab: FeedTab) => void;
  setSelectedCity: (city: string) => void;
  openComments: (videoId: string) => void;
  closeComments: () => void;
  openShare: (videoId: string) => void;
  closeShare: () => void;

  /** Toggle danmaku visibility */
  toggleDanmaku: () => void;
  /** Add a new danmaku to video */
  addDanmaku: (videoId: string, text: string, color?: string) => void;

  /** Record watch history */
  recordWatchHistory: (videoId: string) => void;
  /** Clear watch history */
  clearWatchHistory: () => void;

  /** Update user profile */
  updateUserProfile: (updates: Partial<UserProfile>) => void;

  /** Send a direct chat message to a creator */
  sendChatMessage: (creatorId: string, text: string) => void;
  /** Receive a direct chat message from a creator */
  receiveChatMessage: (creatorId: string, text: string) => void;
  /** Mark conversation as read */
  markConversationRead: (creatorId: string) => void;
  /** Post a comment or reply */
  addComment: (videoId: string, text: string, replyToCommentId?: string) => void;
  /** Delete a comment */
  deleteComment: (videoId: string, commentId: string) => void;

  /** 当前安装/已生效的版本号与构建号 */
  installedVersion: string;
  installedBuildNumber: number;
  /** 应用新版本增量更新 */
  applyAppUpdate: (newVersion: string, newBuildNumber?: number) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      likedVideos: {},
      favoritedVideos: {},
      followedCreators: {},
      likedComments: {},
      muted: false,
      themeMode: 'dark',
      feedTab: 'recommended',
      selectedCity: '北京',
      commentsVideoId: null,
      commentsOpen: false,
      shareVideoId: null,
      shareOpen: false,
      chatMessages: INITIAL_MESSAGES,
      conversations: CONVERSATIONS,
      customComments: {},
      danmakuEnabled: true,
      danmakus: INITIAL_DANMAKUS,
      historyVideos: [
        { videoId: 'v1', watchedAt: Date.now() - 1000 * 60 * 15 },
        { videoId: 'v4', watchedAt: Date.now() - 1000 * 60 * 45 },
      ],
      userProfile: {
        name: CURRENT_USER.name,
        handle: CURRENT_USER.handle,
        bio: CURRENT_USER.bio,
        avatar: CURRENT_USER.avatar,
        gender: '保密',
        birthday: '2000-08-18',
        location: '北京·朝阳',
      },
      installedVersion: '1.1.0',
      installedBuildNumber: 2,

      applyAppUpdate: (newVersion, newBuildNumber) =>
        set((state) => ({
          installedVersion: newVersion,
          installedBuildNumber: newBuildNumber ?? (state.installedBuildNumber + 1),
        })),

      toggleLike: (videoId) =>
        set((state) => ({
          likedVideos: { ...state.likedVideos, [videoId]: !state.likedVideos[videoId] },
        })),

      toggleFavorite: (videoId) =>
        set((state) => ({
          favoritedVideos: {
            ...state.favoritedVideos,
            [videoId]: !state.favoritedVideos[videoId],
          },
        })),

      toggleFollow: (creatorId) =>
        set((state) => ({
          followedCreators: {
            ...state.followedCreators,
            [creatorId]: !state.followedCreators[creatorId],
          },
        })),

      toggleCommentLike: (commentId) =>
        set((state) => ({
          likedComments: {
            ...state.likedComments,
            [commentId]: !state.likedComments[commentId],
          },
        })),

      toggleMute: () => set((state) => ({ muted: !state.muted })),
      setThemeMode: (themeMode) => set({ themeMode }),
      setFeedTab: (feedTab) => set({ feedTab }),
      setSelectedCity: (selectedCity) => set({ selectedCity }),

      openComments: (videoId) => set({ commentsVideoId: videoId, commentsOpen: true }),
      closeComments: () => set({ commentsOpen: false }),
      openShare: (videoId) => set({ shareVideoId: videoId, shareOpen: true }),
      closeShare: () => set({ shareOpen: false }),

      toggleDanmaku: () => set((state) => ({ danmakuEnabled: !state.danmakuEnabled })),

      addDanmaku: (videoId, text, color = '#FFFFFF') =>
        set((state) => {
          const newDanmaku: DanmakuItem = {
            id: `danmaku-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            videoId,
            text,
            color,
            timeOffset: 0.5,
            isSelf: true,
          };
          const existing = state.danmakus[videoId] ?? [];
          return {
            danmakus: {
              ...state.danmakus,
              [videoId]: [newDanmaku, ...existing],
            },
          };
        }),

      recordWatchHistory: (videoId) =>
        set((state) => {
          const filtered = state.historyVideos.filter((h) => h.videoId !== videoId);
          return {
            historyVideos: [{ videoId, watchedAt: Date.now() }, ...filtered].slice(0, 100),
          };
        }),

      clearWatchHistory: () => set({ historyVideos: [] }),

      updateUserProfile: (updates) =>
        set((state) => ({
          userProfile: {
            ...state.userProfile,
            ...updates,
          },
        })),

      sendChatMessage: (creatorId, text) =>
        set((state) => {
          const newMsg: ChatMessage = {
            id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            senderId: 'me',
            receiverId: creatorId,
            text,
            createdAt: Date.now(),
            timeLabel: '刚刚',
          };
          const existing = state.chatMessages[creatorId] ?? [];
          const updatedMessages = {
            ...state.chatMessages,
            [creatorId]: [...existing, newMsg],
          };

          // Update conversation list item
          const updatedConversations = state.conversations.map((c) =>
            c.creatorId === creatorId
              ? { ...c, lastMessage: text, timeLabel: '刚刚', unread: 0 }
              : c,
          );
          // If conversation didn't exist in list, add it
          if (!updatedConversations.some((c) => c.creatorId === creatorId)) {
            updatedConversations.unshift({
              id: `conv-${creatorId}`,
              creatorId,
              lastMessage: text,
              timeLabel: '刚刚',
              unread: 0,
            });
          }

          return {
            chatMessages: updatedMessages,
            conversations: updatedConversations,
          };
        }),

      receiveChatMessage: (creatorId, text) =>
        set((state) => {
          const newMsg: ChatMessage = {
            id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            senderId: creatorId,
            receiverId: 'me',
            text,
            createdAt: Date.now(),
            timeLabel: '刚刚',
          };
          const existing = state.chatMessages[creatorId] ?? [];
          const updatedMessages = {
            ...state.chatMessages,
            [creatorId]: [...existing, newMsg],
          };

          const updatedConversations = state.conversations.map((c) =>
            c.creatorId === creatorId
              ? { ...c, lastMessage: text, timeLabel: '刚刚', unread: c.unread + 1 }
              : c,
          );

          return {
            chatMessages: updatedMessages,
            conversations: updatedConversations,
          };
        }),

      markConversationRead: (creatorId) =>
        set((state) => ({
          conversations: state.conversations.map((c) =>
            c.creatorId === creatorId ? { ...c, unread: 0 } : c,
          ),
        })),

      addComment: (videoId, text, replyToCommentId) =>
        set((state) => {
          const existing = state.customComments[videoId] ?? [];
          if (replyToCommentId) {
            // Add as nested reply to target comment
            const updated = existing.map((c) => {
              if (c.id === replyToCommentId) {
                return {
                  ...c,
                  replies: [
                    ...c.replies,
                    {
                      id: `rep-${Date.now()}`,
                      authorId: 'me',
                      text,
                      likes: 0,
                    },
                  ],
                };
              }
              return c;
            });
            return {
              customComments: {
                ...state.customComments,
                [videoId]: updated,
              },
            };
          }

          // Top-level comment
          const newComment: Comment = {
            id: `c-local-${Date.now()}`,
            videoId,
            authorId: 'me',
            text,
            timeLabel: '刚刚',
            likes: 0,
            replies: [],
          };

          return {
            customComments: {
              ...state.customComments,
              [videoId]: [newComment, ...existing],
            },
          };
        }),

      deleteComment: (videoId, commentId) =>
        set((state) => {
          const existing = state.customComments[videoId] ?? [];
          return {
            customComments: {
              ...state.customComments,
              [videoId]: existing.filter((c) => c.id !== commentId),
            },
          };
        }),
    }),
    {
      name: 'douyin-app-state',
      storage: createJSONStorage(() => AsyncStorage),
      // Only durable preferences are persisted; sheet state is transient.
      partialize: (state) => ({
        likedVideos: state.likedVideos,
        favoritedVideos: state.favoritedVideos,
        followedCreators: state.followedCreators,
        likedComments: state.likedComments,
        muted: state.muted,
        themeMode: state.themeMode,
        chatMessages: state.chatMessages,
        conversations: state.conversations,
        customComments: state.customComments,
        danmakuEnabled: state.danmakuEnabled,
        selectedCity: state.selectedCity,
        historyVideos: state.historyVideos,
        userProfile: state.userProfile,
      }),
    },
  ),
);

/**
 * The like count as displayed: the seed count plus the user's own like.
 * Keeps the UI consistent without mutating the fixtures.
 */
export function displayLikes(video: Video, liked: boolean): number {
  return video.metrics.likes + (liked ? 1 : 0);
}
